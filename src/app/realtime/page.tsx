"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Home, Globe, Search, Navigation, RotateCw, Train, Brain, LineChart, AlertTriangle, ShieldCheck } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const { useMap } = require("react-leaflet");
  const map = useMap();
  useEffect(() => { if (center && map) map.setView(center, zoom, { animate: true }); }, [center, map, zoom]);
  return null;
}

export default function RealtimePage() {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.5, 74.5]);
  const [mapZoom, setMapZoom] = useState(6);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [L, setL] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    import("leaflet").then((mod) => setL(mod.default));
    const connect = () => {
      // DYNAMIC BACKEND URL for Render.com support
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const wsUrl = backendUrl.replace("http", "ws") + "/ws";
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => { setIsConnected(false); setTimeout(connect, 3000); };
      ws.onmessage = (e) => setData(JSON.parse(e.data));
      socketRef.current = ws;
    };
    connect();
    return () => socketRef.current?.close();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const d = await res.json();
      if (d?.[0]) {
        const lat = parseFloat(d[0].lat), lon = parseFloat(d[0].lon);
        setMapCenter([lat, lon]); setMapZoom(10);
        if (socketRef.current?.readyState === WebSocket.OPEN)
          socketRef.current.send(JSON.stringify({ type: "SET_LOCATION", lat, lon }));
      }
    } catch (e) { console.error(e); } finally { setIsSearching(false); }
  };

  const trainIcon = useMemo(() => { if (!L) return null; return new L.Icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/3774/3774261.png", iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -15], className: "rt-train" }); }, [L]);
  const stationIcon = useMemo(() => { if (!L) return null; return new L.DivIcon({ className: "rt-stn", html: `<div style="width:16px;height:16px;background:#d946ef;border-radius:50%;border:3px solid white;box-shadow:0 0 20px #d946ef"></div>`, iconSize: [16, 16] }); }, [L]);

  const stats = data?.stats;
  const predictions = data?.predictions || {};
  const signals = data?.signals || [];
  const alerts = data?.alerts || [];

  return (
    <div className="min-h-screen bg-[#04060b] text-zinc-100 font-sans">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/5 rounded-xl transition-colors"><Home className="w-5 h-5 text-zinc-500" /></Link>
          <div className="h-5 w-px bg-zinc-800" />
          <div className="p-2 bg-fuchsia-500/10 rounded-xl border border-fuchsia-500/20"><Globe className="w-5 h-5 text-fuchsia-400" /></div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight">Module 02: <span className="text-fuchsia-400">Real-Time India Rail</span></h1>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">Live Tracking • AI Delay Prediction • Signal Monitoring</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {alerts.length > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span className="text-[9px] font-black text-rose-400 uppercase">{alerts.length} ALERT</span>
            </div>
          )}
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className="text-[10px] font-black tracking-widest uppercase">{isConnected ? "LIVE" : "OFF"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 p-5 h-[calc(100vh-57px)]">
        {/* LEFT: TRACKING INFO */}
        <aside className="col-span-3 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          
          {/* CORRIDOR STATIONS */}
          <div className="bg-zinc-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2"><Train className="w-3 h-3 text-fuchsia-400" /> Corridor Stations</h2>
            <div className="space-y-1.5">
              {data?.stations?.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-zinc-950 rounded-xl border border-white/5">
                  <div className="w-2.5 h-2.5 bg-fuchsia-500 rounded-full shadow-[0_0_8px_#d946ef] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300 block truncate">{s.name}</span>
                    <span className="text-[7px] font-mono text-zinc-700">{s.lat?.toFixed(2)}, {s.lon?.toFixed(2)}</span>
                  </div>
                  {/* Signal indicator */}
                  {signals[i] && (
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0",
                      signals[i].state === "RED" ? "bg-rose-500 shadow-[0_0_6px_#ef4444]" :
                      signals[i].state === "YELLOW" ? "bg-yellow-500 shadow-[0_0_6px_#eab308]" :
                      "bg-emerald-500 shadow-[0_0_6px_#22c55e]"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI DELAY PREDICTIONS */}
          <div className="bg-zinc-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5 flex-1 min-h-0">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2"><Brain className="w-3 h-3 text-emerald-400" /> AI Delay Predictions</h2>
            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1">
              {data?.trains?.map((t: any, i: number) => {
                const pred = predictions[t.name];
                return (
                  <div key={i} className="p-3 bg-zinc-950 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-fuchsia-400 uppercase tracking-widest truncate max-w-[130px]">{t.name}</span>
                      <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                        t.status === "RUNNING" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                        t.status === "STOPPED" ? "text-rose-400 bg-rose-500/10 border-rose-500/20" :
                        "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                      )}>{t.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[8px] font-mono text-zinc-600 uppercase tracking-widest mb-2">
                      <span>Delay: <span className={t.delay_minutes > 10 ? "text-rose-400" : "text-emerald-400"}>{t.delay_minutes} min</span></span>
                      <span>Conf: <span className="text-cyan-400">{pred ? `${(pred.confidence * 100).toFixed(0)}%` : "—"}</span></span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500",
                        t.delay_minutes > 15 ? "bg-rose-500" : t.delay_minutes > 5 ? "bg-yellow-500" : "bg-emerald-500"
                      )} style={{ width: `${Math.min(100, (t.delay_minutes / 30) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* MAP */}
        <main className="col-span-9 bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden relative flex flex-col">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
            <div className="bg-zinc-950/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-pulse shadow-[0_0_8px_#d946ef]" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300">{searchQuery || "MUMBAI → DELHI CORRIDOR"}</span>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Indian city..." className="bg-zinc-950/90 backdrop-blur-xl px-4 py-2 pl-9 rounded-2xl border border-white/10 text-[10px] font-black tracking-widest text-zinc-100 focus:outline-hidden focus:border-fuchsia-500/50 w-48 transition-all focus:w-64" />
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600", isSearching && "animate-spin text-fuchsia-400")} />
            </form>
          </div>

          <div className="absolute top-4 right-4 z-10 bg-zinc-950/90 backdrop-blur-xl p-3 rounded-2xl border border-white/5 text-[8px] font-black uppercase tracking-widest text-zinc-600 space-y-1.5">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> On Time</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-500 rounded-full" /> Delayed</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-rose-500 rounded-full" /> Stopped</div>
          </div>

          <div className="flex-1 w-full h-full">
            {isConnected && (
              <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} className="w-full h-full" style={{ background: '#0a0c14' }}>
                <MapController center={mapCenter} zoom={mapZoom} />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="CartoDB" />
                {data?.stations?.map((s: any, i: number) => (
                  <Marker key={i} position={[s.lat, s.lon]} icon={stationIcon || undefined}>
                    <Popup className="rtp"><div className="p-2 font-black uppercase text-[10px] text-fuchsia-400">{s.name}</div></Popup>
                  </Marker>
                ))}
                {data?.trains?.map((t: any) => (
                  <Marker key={t.id} position={[t.lat, t.lon]} icon={trainIcon || undefined}>
                    <Popup className="rtp">
                      <div className="p-3 space-y-1.5">
                        <div className="text-[11px] font-black text-white uppercase">{t.name}</div>
                        <div className="h-px bg-white/10" />
                        <div className={cn("text-[9px] font-black uppercase",
                          t.status === "RUNNING" ? "text-emerald-400" : t.status === "STOPPED" ? "text-rose-400" : "text-yellow-400"
                        )}>● {t.status}</div>
                        <div className="text-[8px] text-zinc-500 font-mono">Predicted Delay: {t.delay_minutes} min</div>
                        <div className="text-[8px] text-zinc-600 font-mono">GPS: {t.lat.toFixed(4)}, {t.lon.toFixed(4)}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          <div className="bg-zinc-950/90 border-t border-white/5 p-3 flex items-center justify-between z-10">
            <div className="flex gap-6 text-[9px]">
              <span className="text-zinc-600 font-black uppercase">Running: <span className="text-emerald-400">{stats?.running || 0}</span></span>
              <span className="text-zinc-600 font-black uppercase">Stopped: <span className="text-rose-400">{stats?.stopped || 0}</span></span>
              <span className="text-zinc-600 font-black uppercase">Delayed: <span className="text-yellow-400">{stats?.delayed || 0}</span></span>
              <span className="text-zinc-600 font-black uppercase">Avg Delay: <span className="text-cyan-400">{stats?.avg_delay || 0} min</span></span>
            </div>
            <div className="flex items-center gap-2"><RotateCw className="w-2.5 h-2.5 text-zinc-700 animate-spin" /><span className="text-[9px] font-mono text-zinc-700">CORRIDOR_v4.2</span></div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .rtp .leaflet-popup-content-wrapper { background: #0a0c14; color: #fff; border: 1px solid rgba(217,70,239,0.3); border-radius: 12px; }
        .rtp .leaflet-popup-tip { background: #0a0c14; }
        .rt-stn { filter: drop-shadow(0 0 10px #d946ef); }
        .rt-train { filter: drop-shadow(0 0 12px #d946ef); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(217,70,239,0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}
