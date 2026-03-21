"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Home, FastForward, PlusCircle, MinusCircle, Play, Search, Navigation,
  RotateCw, AlertTriangle, ShieldCheck, Zap, Siren, CloudRain, CloudFog,
  CloudLightning, Sun, Volume2, VolumeX, TrendingUp, Users, Brain
} from "lucide-react";
import "leaflet/dist/leaflet.css";

/* ── Dynamic Leaflet imports (SSR-safe) ──────────── */
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import("react-leaflet").then(m => m.TileLayer),    { ssr: false });
const Marker       = dynamic(() => import("react-leaflet").then(m => m.Marker),       { ssr: false });
const Popup        = dynamic(() => import("react-leaflet").then(m => m.Popup),        { ssr: false });
const Polyline     = dynamic(() => import("react-leaflet").then(m => m.Polyline),     { ssr: false });

function MapController({ center }: { center: [number, number] }) {
  const { useMap } = require("react-leaflet");
  const map = useMap();
  useEffect(() => { 
    if (center && map) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

/* ── Utility ─────────────────────────────────────── */
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ── MAIN PAGE COMPONENT ─────────────────────────── */
export default function SimulationPage() {
  const [data, setData]               = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mapCenter, setMapCenter]     = useState<[number, number]>([23.5, 74.5]);
  const [searchQuery, setSearchQuery] = useState("");
  const [simSpeed, setSimSpeed]       = useState(1);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [ecoMode, setEcoMode]         = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [L, setL]                     = useState<any>(null);
  const socketRef  = useRef<WebSocket | null>(null);
  const lastVoice  = useRef("");

  /* ── Voice ──────────────────────────────────────── */
  const speak = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined") return;
    if (text === lastVoice.current) return;
    lastVoice.current = text;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.1; u.pitch = 0.8; u.volume = 0.8;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }, [voiceEnabled]);

  /* ── WebSocket ──────────────────────────────────── */
  useEffect(() => {
    import("leaflet").then(mod => setL(mod.default));
    const connect = () => {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8085";
      const ws = new WebSocket(backend.replace("http", "ws") + "/ws");
      ws.onopen  = () => setIsConnected(true);
      ws.onclose = () => { setIsConnected(false); setTimeout(connect, 3000); };
      ws.onmessage = (e) => {
        const parsed = JSON.parse(e.data);
        setData(parsed);
        if (parsed.voice_alerts?.[0]) speak(parsed.voice_alerts[0]);
      };
      socketRef.current = ws;
    };
    connect();
    return () => socketRef.current?.close();
  }, [speak]);

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
      if (d?.[0]) {
        const lat = parseFloat(d[0].lat), lon = parseFloat(d[0].lon);
        setMapCenter([lat, lon]);
        send("SET_LOCATION", { lat, lon });
      }
    } catch (_) {}
  };

  /* ── Icons ──────────────────────────────────────── */
  const trainIcon = useMemo(() => {
    if (!L) return undefined;
    return new L.DivIcon({
      className: '',
      html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 6px #06b6d4)">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#22d3ee" stroke="#fff" stroke-width="0.5">
          <path d="M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4S4 1.5 4 5v10.5zm8-12.5c3 0 6 .5 6 3H6c0-2.5 3-3 6-3zM6 10h5v4H6v-4zm7 4v-4h5v4h-5zm-1 3.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
        </svg>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
  }, [L]);

  const stationIcon = useMemo(() => {
    if (!L) return undefined;
    return new L.DivIcon({
      className: '',
      html: `<div style="width:14px;height:14px;background:#f59e0b;border-radius:50%;border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 12px #f59e0b,0 0 24px rgba(245,158,11,0.3)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  }, [L]);

  /* ── Derived data ───────────────────────────────── */
  const stats       = data?.stats;
  const alerts      = data?.alerts || [];
  const signals     = data?.signals || [];
  const weather     = data?.weather || {};
  const analytics   = data?.analytics || {};
  const trackRoutes = data?.track_routes || [];

  const WeatherIcon = weather.type === "STORM" ? CloudLightning
    : weather.type === "RAIN" ? CloudRain
    : weather.type === "FOG" ? CloudFog : Sun;

  const weatherColor = weather.type === "STORM" ? "text-rose-400"
    : weather.type === "RAIN" ? "text-blue-400"
    : weather.type === "FOG" ? "text-zinc-400" : "text-yellow-400";

  /* ── Mini chart ──────────────────────────────────── */
  const MiniChart = ({ data: d, color, h = 40 }: { data: number[]; color: string; h?: number }) => {
    if (!d?.length) return <div className="h-10 bg-zinc-900/50 rounded-lg" />;
    const max = Math.max(...d, 1);
    const w = 100 / d.length;
    return (
      <svg viewBox={`0 0 100 ${h}`} className="w-full" style={{ height: h }}>
        <defs><linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.4" /><stop offset="100%" stopColor={color} stopOpacity="0.05" /></linearGradient></defs>
        <path d={`M 0 ${h} ${d.map((v, i) => `L ${i * w} ${h - (v / max) * (h - 4)}`).join(" ")} L 100 ${h} Z`} fill={`url(#g-${color})`} />
        <path d={`${d.map((v, i) => `${i === 0 ? "M" : "L"} ${i * w} ${h - (v / max) * (h - 4)}`).join(" ")}`} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  };

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
          <div className="p-2 bg-orange-500/15 rounded-xl border border-orange-500/30">
            <FastForward className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">
              <span className="gradient-text">Module 01:</span>{" "}
              <span className="text-zinc-200">AI Simulation</span>
            </h1>
            <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] text-zinc-600">
              <span>Neural Digital Twin</span>
              <span className="text-zinc-800">•</span>
              <span className="text-orange-500/50 font-mono">SYNC_v5.4</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Weather badge */}
          <div className={cn("px-3 py-1.5 rounded-xl border flex items-center gap-2 text-[9px] font-bold tracking-widest",
            weather.type === "STORM" ? "bg-rose-500/10 border-rose-500/20" :
            weather.type === "RAIN"  ? "bg-blue-500/10 border-blue-500/20" :
            weather.type === "FOG"   ? "bg-zinc-500/10 border-zinc-500/20" :
            "bg-yellow-500/10 border-yellow-500/20"
          )}>
            <WeatherIcon className={cn("w-3.5 h-3.5", weatherColor)} />
            <span className={weatherColor}>{weather.type || "CLEAR"}</span>
          </div>

          {/* Voice */}
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={cn("p-2 rounded-xl border transition-all", voiceEnabled ? "bg-emerald-500/10 border-emerald-500/20" : "bg-zinc-900 border-white/5")}>
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[9px] font-bold text-rose-400">{alerts.length} ALERT</span>
            </div>
          )}

          {/* Eco mode */}
          <button onClick={() => { setEcoMode(!ecoMode); send("SET_ECO", { enabled: !ecoMode }); }} className={cn("px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all", ecoMode ? "bg-emerald-500/15 border-emerald-500/30" : "bg-zinc-900 border-white/5")}>
            <div className={cn("w-2 h-2 rounded-full", ecoMode ? "bg-emerald-400 animate-pulse" : "bg-zinc-600")} />
            <span className={cn("text-[9px] font-bold tracking-widest", ecoMode ? "text-emerald-400" : "text-zinc-500")}>ECO</span>
          </button>

          {/* Connection */}
          <div className={cn("px-3 py-1.5 rounded-xl border flex items-center gap-2", isConnected ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20")}>
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400")} />
            <span className="text-[9px] font-bold tracking-widest">{isConnected ? "LIVE" : "OFF"}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ─────────────────────────────── */}
      <div className="flex flex-col xl:grid xl:grid-cols-12 gap-4 p-4 xl:h-[calc(100vh-52px)]">

        {/* ── LEFT SIDEBAR ──────────────────────────── */}
        <aside className="w-full xl:col-span-3 flex flex-col gap-3.5 xl:overflow-y-auto custom-scrollbar xl:pb-4 xl:pr-1">

          {/* ENGINE CONTROLS */}
          <div className="glass-card p-5 rounded-2xl">
            <h2 className="text-[9px] font-bold tracking-widest text-zinc-400 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><Play className="w-3.5 h-3.5 text-orange-400" /> Core Propulsion</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[7px] border border-orange-500/20">HYPER</span>
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[8px] font-bold tracking-widest text-zinc-600 mb-1">
                  <span>Speed</span><span className="text-orange-400">{simSpeed}X</span>
                </div>
                <input type="range" min="1" max="10" value={simSpeed}
                  onChange={(e) => { setSimSpeed(parseInt(e.target.value)); send("SET_SPEED", { speed: parseInt(e.target.value) }); }}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => send("ADD_TRAIN")} className="btn-premium bg-zinc-950 border border-white/5 hover:border-orange-500/30 text-orange-400 justify-center">
                  <PlusCircle className="w-3.5 h-3.5" /> Add
                </button>
                <button onClick={() => send("REMOVE_TRAIN")} className="btn-premium bg-zinc-950 border border-white/5 hover:border-rose-500/30 text-rose-400 justify-center">
                  <MinusCircle className="w-3.5 h-3.5" /> Rem
                </button>
                <button onClick={() => send("ADD_TRAIN", { emergency: true })} className="btn-premium bg-zinc-950 border border-white/5 hover:border-yellow-500/30 text-yellow-400 justify-center group">
                  <Siren className="w-3.5 h-3.5 group-hover:animate-bounce" /> SOS
                </button>
              </div>
            </div>
          </div>

          {/* WEATHER */}
          <div className={cn("glass-card p-5 rounded-2xl transition-all duration-500",
            weather.type === "STORM" ? "border-rose-500/20" :
            weather.type === "RAIN"  ? "border-blue-500/20" : ""
          )}>
            <h2 className="text-[9px] font-bold tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
              <WeatherIcon className={cn("w-3.5 h-3.5", weatherColor)} /> Weather Impact
            </h2>
            <div className="grid grid-cols-2 gap-2 text-[8px] font-mono tracking-widest">
              <div className="p-2.5 bg-black/30 rounded-xl border border-white/5"><span className="text-zinc-600 block mb-1">State</span><span className={cn("font-bold text-sm", weatherColor)}>{weather.type || "CLEAR"}</span></div>
              <div className="p-2.5 bg-black/30 rounded-xl border border-white/5"><span className="text-zinc-600 block mb-1">Vis</span><span className="font-bold text-sm text-zinc-200">{weather.visibility_km || 10} km</span></div>
              <div className="p-2.5 bg-black/30 rounded-xl border border-white/5"><span className="text-zinc-600 block mb-1">Wind</span><span className="font-bold text-sm text-zinc-200">{weather.wind_speed || 5} km/h</span></div>
              <div className="p-2.5 bg-black/30 rounded-xl border border-white/5"><span className="text-zinc-600 block mb-1">Limit</span><span className={cn("font-bold text-sm", (weather.speed_multiplier || 1) < 0.5 ? "text-rose-400" : (weather.speed_multiplier || 1) < 0.8 ? "text-yellow-400" : "text-emerald-400")}>{((weather.speed_multiplier || 1) * 100).toFixed(0)}%</span></div>
            </div>
          </div>

          {/* SABOTAGE */}
          <div className="glass-card p-5 rounded-2xl" style={{ borderColor: "rgba(244,63,94,0.15)" }}>
            <h2 className="text-[9px] font-bold tracking-widest text-rose-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> Network Stress Test
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[0, 2].map(seg => (
                <button key={seg} onClick={() => send("SABOTAGE_TRACK", { segment: seg })}
                  className={cn("btn-premium py-2.5 bg-black/30 border transition-all justify-center",
                    (data?.broken_tracks || []).includes(seg) ? "border-rose-500 text-rose-400" : "border-white/5 text-zinc-600 hover:border-rose-500/20"
                  )}>
                  <Zap className="w-3.5 h-3.5" />
                  {(data?.broken_tracks || []).includes(seg) ? `FIX ${seg}` : `FAIL ${seg}`}
                </button>
              ))}
            </div>
          </div>

          {/* SIGNALS */}
          <div className="glass-card p-5 rounded-2xl">
            <h2 className="text-[9px] font-bold tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Automated Signals
            </h2>
            <div className="space-y-1.5">
              {signals.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <span className="text-[8px] font-bold tracking-widest text-zinc-500 truncate max-w-[110px]">{s.station}</span>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full",
                      s.state === "RED" ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" :
                      s.state === "YELLOW" ? "bg-yellow-500 shadow-[0_0_8px_#eab308] animate-pulse" :
                      "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                    )} />
                    <span className={cn("text-[7px] font-bold tracking-widest",
                      s.state === "RED" ? "text-rose-400" : s.state === "YELLOW" ? "text-yellow-400" : "text-emerald-400"
                    )}>{s.state}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LIVE STATS */}
          <div className="glass-card p-5 rounded-2xl">
            <h2 className="text-[9px] font-bold tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Live Telemetry
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Running",   value: stats?.running || 0,               color: "text-emerald-400" },
                { label: "Stopped",   value: stats?.stopped || 0,               color: "text-rose-400" },
                { label: "Delayed",   value: stats?.delayed || 0,               color: "text-yellow-400" },
                { label: "Prevented", value: stats?.collisions_prevented || 0,  color: "text-cyan-400" },
              ].map(s => (
                <div key={s.label} className="p-2.5 bg-black/30 rounded-xl border border-white/5 text-center">
                  <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
                  <div className="text-[7px] font-bold tracking-widest text-zinc-600">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CHARTS */}
          <div className="glass-card p-5 rounded-2xl">
            <h2 className="text-[9px] font-bold tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-fuchsia-400" /> Analytics
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[7px] font-bold tracking-widest text-zinc-600 mb-1.5">
                  <span>Delay Trend</span><span className="text-yellow-400">{stats?.avg_delay || 0} min</span>
                </div>
                <div className="p-1.5 bg-black/30 rounded-lg border border-white/5">
                  <MiniChart data={analytics.delay_trend} color="#eab308" h={45} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 flex flex-col items-center">
                  <Users className="w-3.5 h-3.5 text-fuchsia-400 mb-1" />
                  <span className="text-xs font-bold text-fuchsia-400">{(stats?.total_passengers || 0).toLocaleString()}</span>
                  <span className="text-[6px] text-zinc-600 font-bold">PAX</span>
                </div>
                <div className={cn("p-2.5 rounded-xl border flex flex-col items-center", ecoMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-black/30 border-white/5")}>
                  <Zap className={cn("w-3.5 h-3.5 mb-1", ecoMode ? "text-emerald-400" : "text-zinc-600")} />
                  <span className={cn("text-xs font-bold", ecoMode ? "text-emerald-400" : "text-zinc-600")}>{analytics?.eco_saved_kwh || 0}</span>
                  <span className="text-[6px] text-zinc-600 font-bold">KWH</span>
                </div>
              </div>
            </div>
          </div>

          {/* NEURAL SIGNAL MATRIX */}
          <div className="glass-card p-5 rounded-2xl" style={{ borderColor: "rgba(245,158,11,0.1)" }}>
            <h2 className="text-[9px] font-bold tracking-widest text-orange-400 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Neural Signal Matrix</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] text-zinc-500 font-bold">Dynamic Sync</span>
              </div>
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {data?.signals?.map((sig: any) => (
                <div key={sig.id} className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-white/5 group hover:border-orange-500/20 transition-all">
                  <span className="text-[8px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors truncate max-w-[70px]">{sig.station.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                  <div className={cn("w-2 h-2 rounded-full shadow-lg transition-all duration-500",
                    sig.state === "RED" ? "bg-rose-500 shadow-rose-500/50" :
                    sig.state === "YELLOW" ? "bg-amber-400 shadow-amber-400/50 animate-pulse" :
                    "bg-emerald-500 shadow-emerald-500/50"
                  )} />
                </div>
              ))}
              {(data?.signals?.length || 0) === 0 && (
                <div className="col-span-2 py-4 text-center text-[8px] text-zinc-700 font-bold tracking-[0.2em]">Initializing Matrix...</div>
              )}
            </div>
          </div>

          {/* AI LOG */}
          <div className="glass-card p-5 rounded-2xl flex-1 min-h-[350px] flex flex-col" style={{ borderColor: "rgba(249,115,22,0.1)" }}>
            <h2 className="text-[9px] font-bold tracking-widest text-orange-400 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2"><Brain className="w-3.5 h-3.5 animate-pulse" /> AI Neural Log</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[7px] border border-orange-500/20">Live Sync</span>
            </h2>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {(analytics.ai_decisions || []).slice().reverse().map((d: any, i: number) => (
                <div key={i} className="border-l-2 border-white/5 hover:border-orange-500/30 pl-3 py-1.5 rounded-r-lg transition-colors group">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={cn("text-[7px] font-bold tracking-widest",
                      d.action === "EMERGENCY_BRAKE" || d.action === "SIGNAL_SWITCH" ? "text-orange-400" :
                      d.action === "MODE_CHANGE" ? "text-emerald-400" : "text-zinc-600"
                    )}>{d.action}</span>
                    <span className="text-[6px] text-zinc-700 font-mono">T{d.tick}</span>
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-relaxed group-hover:text-zinc-300 transition-colors">{d.reason}</p>
                </div>
              ))}
              {(analytics.ai_decisions || []).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <Brain className="w-12 h-12 mb-3" />
                  <span className="text-[9px] font-bold tracking-[0.3em]">Listening...</span>
                </div>
              )}
            </div>
          </div>

          {/* ALERTS */}
          <div className="glass-card p-5 rounded-2xl">
            <h2 className="text-[9px] font-bold tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Active Risks
            </h2>
            <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="text-center py-5 text-[9px] text-zinc-700 font-bold tracking-widest flex flex-col items-center gap-2">
                  <ShieldCheck className="w-5 h-5 opacity-30" /> Sector Clear
                </div>
              ) : alerts.map((a: any, i: number) => (
                <div key={i} className={cn("p-3 rounded-xl border text-[8px] font-bold tracking-widest flex items-start gap-2",
                  a.severity === "CRITICAL" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                )}>
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{a.message}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAP ─────────────────────────────────── */}
        <main className="w-full xl:col-span-9 h-[65vh] xl:h-full glass-card rounded-3xl overflow-hidden relative flex flex-col" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {/* Search overlay */}
          <div className="absolute top-5 left-5 flex items-center gap-3" style={{ zIndex: 1000 }}>
            <div className="bg-black/70 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
              <Navigation className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-300">{searchQuery || "MUMBAI-DELHI"}</span>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..."
                className="bg-black/70 backdrop-blur-xl px-4 py-2.5 pl-9 rounded-xl border border-white/10 text-xs font-bold text-zinc-100 focus:outline-none focus:border-orange-500/40 w-40 focus:w-60 transition-all" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            </form>
          </div>

          {/* Map body */}
          <div className="flex-1 w-full h-full relative">
            {/* Scan line */}
            <div className="absolute inset-x-0 h-px bg-orange-500/15 pointer-events-none" style={{ zIndex: 1001, animation: "scan 6s ease-in-out infinite" }} />

            <MapContainer center={mapCenter} zoom={7} scrollWheelZoom={true} className="w-full h-full" style={{ background: '#0a0c10' }}>
              <MapController center={mapCenter} />
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; <a href='https://carto.com/attributions'>CARTO</a>" />
              {/* Track lines */}
              {trackRoutes.map((r: any, i: number) => (
                <Polyline key={i} positions={r.coords} pathOptions={{
                  color: (data?.broken_tracks || []).includes(i) ? "#ef4444" : "#f59e0b",
                  weight: (data?.broken_tracks || []).includes(i) ? 4 : 2,
                  opacity: (data?.broken_tracks || []).includes(i) ? 0.8 : 0.35,
                  dashArray: (data?.broken_tracks || []).includes(i) ? undefined : "8 12",
                }} />
              ))}
              {/* Stations */}
              {data?.stations?.map((s: any, i: number) => (
                <Marker key={`st-${i}`} position={[s.lat, s.lon]} icon={stationIcon || undefined} eventHandlers={{ click: () => setSelectedStation(s) }}>
                  <Popup><div className="p-2 font-bold text-[10px] text-orange-400">{s.name}</div></Popup>
                </Marker>
              ))}
              {/* Trains */}
              {data?.trains?.map((t: any) => (
                <Marker key={`tr-${t.id}`} position={[t.lat, t.lon]} icon={trainIcon || undefined}>
                  <Popup>
                    <div className="p-3 space-y-1.5 min-w-[150px]">
                      <div className="text-[11px] font-bold text-white">{t.name}</div>
                      <div className="h-px bg-white/10" />
                      <div className={cn("text-[9px] font-bold", t.status === "RUNNING" ? "text-emerald-400" : t.status === "STOPPED" ? "text-rose-400" : "text-yellow-400")}>● {t.status}</div>
                      <div className="text-[8px] text-zinc-500 font-mono space-y-0.5">
                        <div>Speed: {t.speed_kmh} km/h</div>
                        <div>Delay: {t.delay_minutes} min</div>
                        <div>PAX: {t.passengers}</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* CCTV overlay */}
            {selectedStation && (
              <div className="absolute bottom-16 right-6 w-64 glass-card rounded-xl overflow-hidden" style={{ zIndex: 1002 }}>
                <div className="p-2.5 border-b border-white/10 flex items-center justify-between bg-black/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-bold tracking-widest">CCTV: {selectedStation.name}</span>
                  </div>
                  <button onClick={() => setSelectedStation(null)} className="p-1 hover:bg-white/5 rounded-lg"><RotateCw className="w-3 h-3 text-zinc-600" /></button>
                </div>
                <div className="aspect-video bg-zinc-950 flex flex-col items-center justify-center text-zinc-800">
                  <Brain className="w-10 h-10 mb-2 animate-pulse" />
                  <span className="text-[7px] font-bold tracking-[0.15em]">Neural Vision Active</span>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                    <span className="text-[6px] text-zinc-600 font-bold block mb-0.5">Crowd</span>
                    <span className="text-[10px] font-bold text-emerald-400">74%</span>
                  </div>
                  <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                    <span className="text-[6px] text-zinc-600 font-bold block mb-0.5">Tickets</span>
                    <span className="text-[10px] font-bold text-orange-400">1,240</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="bg-black/50 backdrop-blur-xl border-t border-white/5 px-5 py-3 flex items-center justify-between" style={{ zIndex: 1001 }}>
            <div className="flex gap-6 text-[9px] font-bold tracking-widest">
              <span className="text-zinc-600">Speed: <span className="text-orange-400">{simSpeed}X</span></span>
              <span className="text-zinc-600">Units: <span className="text-cyan-400">{stats?.total_trains || 0}</span></span>
              <span className="text-zinc-600">Delay: <span className="text-yellow-400">{stats?.avg_delay || 0}m</span></span>
              <span className="text-zinc-600">Saved: <span className="text-emerald-400">{stats?.collisions_prevented || 0}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[7px] font-mono">STABLE</span>
              <RotateCw className="w-3 h-3 text-zinc-700 animate-spin" style={{ animationDuration: "4s" }} />
            </div>
          </div>
        </main>
      </div>

      {/* ── LOCAL STYLES ──────────────────────────── */}
      <style jsx global>{`
        .stn { filter: drop-shadow(0 0 8px #f59e0b); }
        .train-glow { filter: drop-shadow(0 0 10px #06b6d4); }
      `}</style>
    </div>
  );
}
