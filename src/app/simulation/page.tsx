"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Home, FastForward, PlusCircle, MinusCircle, Play, Terminal, Search, Navigation, RotateCw, AlertTriangle, ShieldCheck, Zap, Siren } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

function MapController({ center }: { center: [number, number] }) {
  const { useMap } = require("react-leaflet");
  const map = useMap();
  useEffect(() => { if (center && map) map.setView(center, 7, { animate: true }); }, [center, map]);
  return null;
}

export default function SimulationPage() {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.5, 74.5]);
  const [searchQuery, setSearchQuery] = useState("");
  const [simSpeed, setSimSpeed] = useState(1);
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

  const send = (type: string, payload: any = {}) => {
    if (socketRef.current?.readyState === WebSocket.OPEN)
      socketRef.current.send(JSON.stringify({ type, ...payload }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const d = await res.json();
      if (d?.[0]) { const lat = parseFloat(d[0].lat), lon = parseFloat(d[0].lon); setMapCenter([lat, lon]); send("SET_LOCATION", { lat, lon }); }
    } catch (e) { console.error(e); }
  };

  const trainIcon = useMemo(() => { if (!L) return null; return new L.Icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/3774/3774261.png", iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14], className: "train-glow" }); }, [L]);
  const stationIcon = useMemo(() => { if (!L) return null; return new L.DivIcon({ className: "stn", html: `<div style="width:14px;height:14px;background:#f59e0b;border-radius:50%;border:2px solid white;box-shadow:0 0 12px #f59e0b"></div>`, iconSize: [14, 14] }); }, [L]);

  const stats = data?.stats;
  const alerts = data?.alerts || [];
  const signals = data?.signals || [];

  return (
    <div className="min-h-screen bg-[#04060b] text-zinc-100 font-sans">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/5 rounded-xl transition-colors"><Home className="w-5 h-5 text-zinc-500" /></Link>
          <div className="h-5 w-px bg-zinc-800" />
          <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20"><FastForward className="w-5 h-5 text-orange-400" /></div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight">Module 01: <span className="text-orange-400">AI Simulation</span></h1>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">Collision Detection • Signal Automation • Delay Prediction</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {alerts.length > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] font-black text-rose-400 uppercase">{alerts.length} ALERT{alerts.length > 1 ? "S" : ""}</span>
            </div>
          )}
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className="text-[10px] font-black tracking-widest uppercase">{isConnected ? "LIVE" : "OFF"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 p-5 h-[calc(100vh-57px)]">
        {/* LEFT: CONTROLS */}
        <aside className="col-span-3 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          {/* ENGINE CONTROLS */}
          <div className="bg-zinc-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2"><Play className="w-3 h-3 text-orange-400" /> Engine Controls</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2"><span>Speed</span><span className="text-orange-400">{simSpeed}X</span></div>
                <input type="range" min="1" max="10" value={simSpeed} onChange={(e) => { setSimSpeed(parseInt(e.target.value)); send("SET_SPEED", { speed: parseInt(e.target.value) }); }} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => send("ADD_TRAIN")} className="flex flex-col items-center gap-1 py-2.5 bg-zinc-950 border border-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:border-orange-500/40 transition-all active:scale-95">
                  <PlusCircle className="w-4 h-4 text-orange-400" /> Spawn
                </button>
                <button onClick={() => send("REMOVE_TRAIN")} className="flex flex-col items-center gap-1 py-2.5 bg-zinc-950 border border-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:border-rose-500/40 transition-all active:scale-95">
                  <MinusCircle className="w-4 h-4 text-rose-400" /> Purge
                </button>
                <button onClick={() => send("ADD_TRAIN", { emergency: true })} className="flex flex-col items-center gap-1 py-2.5 bg-zinc-950 border border-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:border-yellow-500/40 transition-all active:scale-95">
                  <Siren className="w-4 h-4 text-yellow-400" /> SOS
                </button>
              </div>
            </div>
          </div>

          {/* SIGNAL STATUS */}
          <div className="bg-zinc-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-cyan-400" /> 🚦 Signal Status</h2>
            <div className="space-y-2">
              {signals.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-xl border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 truncate max-w-[120px]">{s.station}</span>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full shadow-lg", 
                      s.state === "RED" ? "bg-rose-500 shadow-rose-500/50" : 
                      s.state === "YELLOW" ? "bg-yellow-500 shadow-yellow-500/50 animate-pulse" : 
                      "bg-emerald-500 shadow-emerald-500/50"
                    )} />
                    <span className={cn("text-[8px] font-black uppercase", 
                      s.state === "RED" ? "text-rose-400" : s.state === "YELLOW" ? "text-yellow-400" : "text-emerald-400"
                    )}>{s.state}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LIVE STATS */}
          <div className="bg-zinc-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2"><Zap className="w-3 h-3 text-emerald-400" /> Network Stats</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Running", value: stats?.running || 0, color: "text-emerald-400" },
                { label: "Stopped", value: stats?.stopped || 0, color: "text-rose-400" },
                { label: "Delayed", value: stats?.delayed || 0, color: "text-yellow-400" },
                { label: "Saved", value: stats?.collisions_prevented || 0, color: "text-cyan-400" },
              ].map(s => (
                <div key={s.label} className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-center">
                  <div className={cn("text-xl font-black", s.color)}>{s.value}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-zinc-600 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* COLLISION ALERTS */}
          <div className="bg-zinc-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5 flex-1 min-h-0">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-rose-400" /> AI Alerts</h2>
            <div className="space-y-2 overflow-y-auto custom-scrollbar max-h-40">
              {alerts.length === 0 ? (
                <div className="text-center py-6 text-[10px] text-zinc-700 font-bold uppercase tracking-widest">✅ All Clear — No Threats</div>
              ) : (
                alerts.map((a: any, i: number) => (
                  <div key={i} className={cn("p-3 rounded-xl border text-[9px] font-bold uppercase tracking-widest",
                    a.severity === "CRITICAL" ? "bg-rose-500/5 border-rose-500/20 text-rose-400" : "bg-yellow-500/5 border-yellow-500/20 text-yellow-400"
                  )}>{a.message}</div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* MAP */}
        <main className="col-span-9 bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden relative flex flex-col">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
            <div className="bg-zinc-950/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
              <Navigation className="w-3 h-3 text-orange-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">{searchQuery || "INDIA CORRIDOR"}</span>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search city..." className="bg-zinc-950/90 backdrop-blur-xl px-4 py-2 pl-9 rounded-2xl border border-white/10 text-[10px] font-black tracking-widest text-zinc-100 focus:outline-hidden focus:border-orange-500/50 w-40 transition-all focus:w-56" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
            </form>
          </div>

          <div className="flex-1 w-full h-full">
            {isConnected && (
              <MapContainer center={mapCenter} zoom={7} scrollWheelZoom={true} className="w-full h-full" style={{ background: '#0a0c14' }}>
                <MapController center={mapCenter} />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="CartoDB" />
                {data?.stations?.map((s: any, i: number) => (
                  <Marker key={i} position={[s.lat, s.lon]} icon={stationIcon || undefined}>
                    <Popup className="cp"><div className="p-2 font-black uppercase text-[10px] text-orange-400">{s.name}</div></Popup>
                  </Marker>
                ))}
                {data?.trains?.map((t: any) => (
                  <Marker key={t.id} position={[t.lat, t.lon]} icon={trainIcon || undefined}>
                    <Popup className="cp">
                      <div className="p-3 space-y-1">
                        <div className="text-[11px] font-black text-white uppercase">{t.name}</div>
                        <div className="h-px bg-white/10" />
                        <div className={cn("text-[9px] font-black uppercase", t.status === "RUNNING" ? "text-emerald-400" : t.status === "STOPPED" ? "text-rose-400" : "text-yellow-400")}>Status: {t.status}</div>
                        <div className="text-[8px] text-zinc-500 font-mono">Delay: {t.delay_minutes} min</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          <div className="bg-zinc-950/90 border-t border-white/5 p-3 flex items-center justify-between z-10">
            <div className="flex gap-6 text-[9px]">
              <span className="text-zinc-600 font-black uppercase">Sim: <span className="text-orange-400">{simSpeed}X</span></span>
              <span className="text-zinc-600 font-black uppercase">Trains: <span className="text-cyan-400">{stats?.total_trains || 0}</span></span>
              <span className="text-zinc-600 font-black uppercase">Avg Delay: <span className="text-yellow-400">{stats?.avg_delay || 0} min</span></span>
              <span className="text-zinc-600 font-black uppercase">Collisions Prevented: <span className="text-emerald-400">{stats?.collisions_prevented || 0}</span></span>
            </div>
            <div className="flex items-center gap-2"><RotateCw className="w-2.5 h-2.5 text-zinc-700 animate-spin" /><span className="text-[9px] font-mono text-zinc-700">SIM_v4</span></div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .cp .leaflet-popup-content-wrapper { background: #0a0c14; color: #fff; border: 1px solid rgba(249,115,22,0.3); border-radius: 12px; }
        .cp .leaflet-popup-tip { background: #0a0c14; }
        .stn { filter: drop-shadow(0 0 8px #f59e0b); }
        .train-glow { filter: drop-shadow(0 0 10px #06b6d4); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}
