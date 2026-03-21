"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home, Globe, Search, RotateCw, Train, Brain,
  AlertTriangle, ChevronRight
} from "lucide-react";
import "leaflet/dist/leaflet.css";

/* ── Dynamic Leaflet imports (SSR-safe) ──────────── */
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import("react-leaflet").then(m => m.TileLayer),    { ssr: false });
const Marker       = dynamic(() => import("react-leaflet").then(m => m.Marker),       { ssr: false });
const Popup        = dynamic(() => import("react-leaflet").then(m => m.Popup),        { ssr: false });

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return <MapSubController center={center} zoom={zoom} />;
}

function MapSubController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const { useMap } = require("react-leaflet");
  const map = useMap();
  useEffect(() => { 
    if (center && map) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, map, zoom]);
  return null;
}

/* ── Utility ─────────────────────────────────────── */
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ── MAIN PAGE COMPONENT ─────────────────────────── */
export default function RealtimePage() {
  const [data, setData]               = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mapCenter, setMapCenter]     = useState<[number, number]>([23.5, 74.5]);
  const [mapZoom, setMapZoom]         = useState(6);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchedPlace, setSearchedPlace] = useState("");
  const [L, setL]                     = useState<any>(null);
  const [analytics, setAnalytics]     = useState<any>({ ai_decisions: [] });
  const socketRef = useRef<WebSocket | null>(null);

  /* ── WebSocket ──────────────────────────────────── */
  useEffect(() => {
    import("leaflet").then(mod => setL(mod.default));
    const connect = () => {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8085";
      const ws = new WebSocket(backend.replace("http", "ws") + "/ws");
      ws.onopen  = () => setIsConnected(true);
      ws.onclose = () => { setIsConnected(false); setTimeout(connect, 3000); };
      ws.onmessage = (e) => {
        const payload = JSON.parse(e.data);
        setData(payload);
        if (payload.analytics) setAnalytics(payload.analytics);
      };
      socketRef.current = ws;
    };
    connect();
    return () => socketRef.current?.close();
  }, []);

  /* ── Cities ─────────────────────────────────────── */
  const quickCities = [
    { name: "Delhi",     lat: 28.6139, lon: 77.2090 },
    { name: "Chennai",   lat: 13.0827, lon: 80.2707 },
    { name: "Kolkata",   lat: 22.5726, lon: 88.3639 },
    { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
    { name: "Hyderabad", lat: 17.3850, lon: 78.4867 },
  ];

  const goToLocation = (lat: number, lon: number, name: string) => {
    setMapCenter([lat, lon]);
    setMapZoom(10);
    setSearchedPlace(name);
    if (socketRef.current?.readyState === WebSocket.OPEN)
      socketRef.current.send(JSON.stringify({ type: "SET_LOCATION", lat, lon }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const d = await res.json();
      if (d?.[0]) {
        const lat = parseFloat(d[0].lat), lon = parseFloat(d[0].lon);
        goToLocation(lat, lon, d[0].display_name?.split(",")[0] || searchQuery);
      }
    } catch (_) {} finally { setIsSearching(false); }
  };

  /* ── Icons ──────────────────────────────────────── */
  const trainIcon = useMemo(() => {
    if (!L) return undefined;
    return new L.DivIcon({
      className: '',
      html: `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 8px #d946ef)">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#d946ef" stroke="#fff" stroke-width="0.5">
          <path d="M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4S4 1.5 4 5v10.5zm8-12.5c3 0 6 .5 6 3H6c0-2.5 3-3 6-3zM6 10h5v4H6v-4zm7 4v-4h5v4h-5zm-1 3.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
        </svg>
      </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  }, [L]);

  const stationIcon = useMemo(() => {
    if (!L) return undefined;
    return new L.DivIcon({
      className: '',
      html: `<div style="width:14px;height:14px;background:#d946ef;border-radius:50%;border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 15px #d946ef,0 0 30px rgba(217,70,239,0.3)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  }, [L]);

  /* ── Derived data ───────────────────────────────── */
  const stats       = data?.stats;
  const predictions = data?.predictions || {};
  const alerts      = data?.alerts || [];

  /* ── RENDER ─────────────────────────────────────── */
  return (
    <div className="relative min-h-screen bg-[#030712] text-zinc-100 font-sans xl:overflow-hidden">
      <div className="cyber-bg" />
      <div className="cyber-grid" />

      {/* ── TOP BAR ───────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/50 backdrop-blur-2xl sticky top-0" style={{ zIndex: 1001 }}>
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/5 rounded-xl transition-colors"><Home className="w-5 h-5 text-zinc-500" /></Link>
          <div className="h-5 w-px bg-zinc-800" />
          <div className="p-2 bg-fuchsia-500/15 rounded-xl border border-fuchsia-500/30">
            <Globe className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">
              <span className="text-fuchsia-400">Module 02:</span>{" "}
              <span className="text-zinc-200">Live Tracking</span>
            </h1>
            <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] text-zinc-600">
              <span>Indian Rail Network</span>
              <span className="text-zinc-800">•</span>
              <span className="text-fuchsia-500/50 font-mono">NODE_v4.2</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {alerts.length > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span className="text-[8px] font-bold text-rose-400 tracking-widest">{alerts.length} ALERT</span>
            </div>
          )}
          <div className={cn("px-3 py-1.5 rounded-xl border flex items-center gap-2",
            isConnected ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
          )}>
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400")} />
            <span className="text-[9px] font-bold tracking-widest">{isConnected ? "LIVE" : "OFF"}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ─────────────────────────────── */}
      <div className="flex flex-col xl:grid xl:grid-cols-12 gap-4 p-4 xl:h-[calc(100vh-52px)]">

        {/* ── LEFT SIDEBAR ──────────────────────────── */}
        <aside className="w-full xl:col-span-3 flex flex-col gap-3.5 xl:overflow-y-auto custom-scrollbar xl:pb-4 xl:pr-1">

          {/* SEARCH */}
          <div className="glass-card p-5 rounded-2xl" style={{ borderColor: "rgba(217,70,239,0.1)" }}>
            <h2 className="text-[9px] font-bold tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-fuchsia-400" /> Search Location
            </h2>
            <form onSubmit={handleSearch} className="relative mb-3">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Enter city name..."
                className="w-full bg-black/40 px-4 py-2.5 pl-9 rounded-xl border border-white/5 text-xs font-bold text-zinc-100 focus:outline-none focus:border-fuchsia-500/30 transition-colors" />
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600", isSearching && "animate-spin text-fuchsia-400")} />
            </form>
            <div className="flex flex-wrap gap-1.5">
              {quickCities.map(c => (
                <button key={c.name} onClick={() => goToLocation(c.lat, c.lon, c.name)}
                  className="btn-premium px-2.5 py-1.5 bg-black/30 border border-white/5 text-zinc-500 hover:text-fuchsia-400 hover:border-fuchsia-500/20">
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* CORRIDOR STATIONS */}
          <div className="glass-card p-5 rounded-2xl">
            <h2 className="text-[9px] font-bold tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
              <Train className="w-3.5 h-3.5 text-fuchsia-400" /> Corridor Stations
            </h2>
            <div className="space-y-1.5">
              {data?.stations?.map((s: any, i: number) => (
                <div key={i} onClick={() => { setMapCenter([s.lat, s.lon]); setMapZoom(13); }} 
                  className="flex items-center gap-3 p-2.5 bg-black/30 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer transition-colors group">
                  <div className="w-2.5 h-2.5 bg-fuchsia-500 rounded-full shadow-[0_0_8px_#d946ef] group-hover:scale-125 transition-transform" />
                  <span className="text-[8px] font-bold tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors truncate flex-1">{s.name.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                  <ChevronRight className="w-3 h-3 text-zinc-800 group-hover:text-fuchsia-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* DELAY PREDICTIONS */}
          <div className="glass-card p-5 rounded-2xl flex-1 min-h-[300px] flex flex-col">
            <h2 className="text-[9px] font-bold tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-emerald-400" /> AI Delay Predictions
            </h2>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
              {data?.trains?.map((t: any, i: number) => {
                const pred = predictions[t.name];
                return (
                  <div key={i} className="p-3.5 bg-black/30 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-fuchsia-400 tracking-widest truncate max-w-[130px]">{t.name}</span>
                      <span className={cn("text-[7px] font-bold px-2 py-0.5 rounded-full border",
                        t.status === "RUNNING" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                        "text-rose-400 bg-rose-500/10 border-rose-500/20"
                      )}>{t.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[8px] font-mono tracking-widest mb-2">
                      <span className="text-zinc-600">Delay: <span className={t.delay_minutes > 10 ? "text-rose-400" : "text-emerald-400"}>{t.delay_minutes} min</span></span>
                      <span className="text-zinc-600">Conf: <span className="text-cyan-400">{pred ? `${(pred.confidence * 100).toFixed(0)}%` : "—"}</span></span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-700",
                        t.delay_minutes > 15 ? "bg-rose-500" : t.delay_minutes > 5 ? "bg-yellow-500" : "bg-emerald-500"
                      )} style={{ width: `${Math.min(100, (t.delay_minutes / 30) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
              {(data?.trains?.length || 0) === 0 && (
                <div className="py-8 text-center opacity-30 text-[8px] font-bold tracking-widest">
                  No trains currently active
                </div>
              )}
            </div>
          </div>

          {/* AI SIGNAL CONTROL MATRIX */}
          <div className="glass-card p-5 rounded-2xl flex-col flex" style={{ borderColor: "rgba(16,185,129,0.1)" }}>
            <h2 className="text-[9px] font-bold tracking-widest text-emerald-400 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Neural Signal Matrix</span>
              <span className="text-[7px] text-zinc-700 font-mono tracking-tighter">ML_ACTIVE</span>
            </h2>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {(data?.signals || []).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <span className="text-[8px] font-bold tracking-widest text-zinc-500 truncate max-w-[140px]">{s.station.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px]",
                      s.state === "RED" ? "bg-rose-500 shadow-rose-500/50" :
                      s.state === "YELLOW" ? "bg-yellow-500 shadow-yellow-500/50 animate-pulse" :
                      "bg-emerald-500 shadow-emerald-500/50"
                    )} />
                    <span className={cn("text-[7px] font-bold tracking-widest",
                      s.state === "RED" ? "text-rose-400" : s.state === "YELLOW" ? "text-yellow-400" : "text-emerald-400"
                    )}>{s.state}</span>
                  </div>
                </div>
              ))}
              {(data?.signals || []).length === 0 && (
                <div className="py-5 text-center text-[7px] font-bold text-zinc-700 tracking-widest">
                  Initializing Signal Sync...
                </div>
              )}
            </div>
          </div>

          {/* AI NEURAL LOG (SYCHRONIZED FROM BACKEND) */}
          <div className="glass-card p-5 rounded-2xl flex-1 flex flex-col overflow-hidden" style={{ borderColor: "rgba(249,115,22,0.1)" }}>
            <h2 className="text-[9px] font-bold tracking-widest text-orange-400 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2"><Brain className="w-3.5 h-3.5 animate-pulse" /> AI Neural Log</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[7px] border border-orange-500/20">LIVE</span>
            </h2>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
              {(analytics.ai_decisions || []).slice().reverse().slice(0, 20).map((d: any, i: number) => (
                <div key={i} className="border-l-2 border-white/5 hover:border-orange-500/30 pl-3 py-1.5 rounded-r-lg transition-colors group">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={cn("text-[7px] font-bold tracking-widest",
                      d.action === "CORRIDOR_SYNC" ? "text-cyan-400" :
                      d.action === "EMERGENCY_BRAKE" ? "text-rose-400" :
                      "text-zinc-600"
                    )}>{d.action}</span>
                    <span className="text-[6px] text-zinc-700 font-mono">T{d.tick || '—'}</span>
                  </div>
                  <p className="text-[8px] text-zinc-500 leading-tight group-hover:text-zinc-300 transition-colors font-bold tracking-tight">{d.reason}</p>
                </div>
              ))}
              {(analytics.ai_decisions || []).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <Brain className="w-8 h-8 mb-2" />
                  <span className="text-[8px] font-bold tracking-[0.3em]">Listening...</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── MAP ─────────────────────────────────── */}
        <main className="w-full xl:col-span-9 h-[65vh] xl:h-full glass-card rounded-3xl overflow-hidden relative flex flex-col" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {/* Location indicator */}
          <div className="absolute top-5 left-5 flex flex-col gap-3 max-w-sm" style={{ zIndex: 1000 }}>
            {searchedPlace && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="px-4 py-2.5 glass-card rounded-xl flex items-center gap-3" style={{ borderColor: "rgba(217,70,239,0.2)" }}>
                <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-pulse shadow-[0_0_8px_#d946ef]" />
                <span className="text-[9px] font-bold tracking-[0.2em] text-fuchsia-300">Tracking: {searchedPlace}</span>
              </motion.div>
            )}
          </div>

          {/* Legend */}
          <div className="absolute top-5 right-5 glass-card p-3.5 rounded-xl text-[8px] font-bold tracking-widest text-zinc-500 space-y-2" style={{ zIndex: 1000 }}>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_6px_#10b981]" /> On Time</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_6px_#eab308]" /> Delayed</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_6px_#f43f5e]" /> Stopped</div>
          </div>

          {/* Map body */}
          <div className="flex-1 w-full h-full relative">
            <div className="absolute inset-x-0 h-px bg-fuchsia-500/10 pointer-events-none" style={{ zIndex: 1001, animation: "scan 10s linear infinite" }} />
            <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} className="w-full h-full" style={{ background: '#0a0c10' }}>
              <MapController center={mapCenter} zoom={mapZoom} />
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; <a href='https://carto.com/attributions'>CARTO</a>" />
              {data?.stations?.map((s: any, i: number) => (
                <Marker key={`st-${i}`} position={[s.lat, s.lon]} icon={stationIcon || undefined}>
                  <Popup><div className="p-2 font-bold text-[10px] text-fuchsia-400">{s.name}</div></Popup>
                </Marker>
              ))}
              {data?.trains?.map((t: any) => (
                <Marker key={`tr-${t.id}`} position={[t.lat, t.lon]} icon={trainIcon || undefined}>
                  <Popup>
                    <div className="p-4 space-y-3 min-w-[200px] bg-black/80 backdrop-blur-xl border border-fuchsia-500/20 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-bold text-white tracking-widest">{t.name}</div>
                        <div className={cn("px-2 py-0.5 rounded-full text-[7px] font-bold border", 
                          t.status === "RUNNING" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        )}>{t.status}</div>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="grid grid-cols-2 gap-3 text-[8px] font-mono tracking-widest uppercase">
                        <div>
                          <div className="text-zinc-600 mb-1">Live Speed</div>
                          <div className="text-zinc-200 font-bold">{t.speed_kmh} KM/H</div>
                        </div>
                        <div>
                          <div className="text-zinc-600 mb-1">Payload</div>
                          <div className="text-zinc-200 font-bold">{t.passengers} PAX</div>
                        </div>
                        <div>
                          <div className="text-zinc-600 mb-1">AI Delay</div>
                          <div className={cn("font-bold", t.delay_minutes > 10 ? "text-rose-400" : "text-emerald-400")}>{t.delay_minutes} MIN</div>
                        </div>
                        <div>
                          <div className="text-zinc-600 mb-1">Confidence</div>
                          <div className="text-fuchsia-400 font-bold">{predictions[t.name] ? (predictions[t.name].confidence * 100).toFixed(0) : 0}%</div>
                        </div>
                      </div>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                        <div className={cn("h-full transition-all duration-700", t.delay_minutes > 15 ? "bg-rose-500" : t.delay_minutes > 5 ? "bg-amber-400" : "bg-emerald-500")}
                             style={{ width: `${Math.max(10, Math.min(100, (predictions[t.name]?.confidence || 0) * 100))}%` }} />
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Bottom bar */}
          <div className="bg-black/50 backdrop-blur-xl border-t border-white/5 px-5 py-3 flex items-center justify-between">
            <div className="flex gap-6 text-[9px] font-bold tracking-widest">
              <span className="text-zinc-600">Running: <span className="text-emerald-400">{stats?.running || 0}</span></span>
              <span className="text-zinc-600">Stopped: <span className="text-rose-400">{stats?.stopped || 0}</span></span>
              <span className="text-zinc-600">Delayed: <span className="text-yellow-400">{stats?.delayed || 0}</span></span>
              <span className="text-zinc-600">Avg Delay: <span className="text-cyan-400">{stats?.avg_delay || 0} min</span></span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCw className="w-3 h-3 text-zinc-700 animate-spin" style={{ animationDuration: "5s" }} />
              <span className="text-[8px] font-mono text-zinc-700">CORRIDOR_v4.2</span>
            </div>
          </div>
        </main>
      </div>

      {/* ── LOCAL STYLES ──────────────────────────── */}
      <style jsx global>{`
        .rt-stn { filter: drop-shadow(0 0 8px #d946ef); }
        .rt-train { filter: drop-shadow(0 0 10px #d946ef); }
      `}</style>
    </div>
  );
}
