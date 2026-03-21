"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain, Network, ChevronRight, Monitor, Activity, Zap,
  ShieldCheck, Globe, BarChart3, Signal, Route, Clock,
  Cpu, Eye, ArrowRight, Layers, Radio, MapPin
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-white font-sans selection:bg-orange-500/30">
      <div className="cyber-bg" />
      <div className="cyber-grid" />

      {/* ── STICKY NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-black/40 backdrop-blur-2xl border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-linear-to-br from-orange-400 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight block leading-none">Train AI</span>
              <span className="text-[8px] font-medium text-zinc-500 tracking-widest">Traffic Control</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#about" className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">About</Link>
            <Link href="#how-it-works" className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">How It Works</Link>
            <Link href="#modules" className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">Modules</Link>
            <div className="h-4 w-px bg-white/10" />
            <Link href="/simulation">
              <button className="px-5 py-2 bg-orange-500 text-black font-bold text-xs rounded-lg hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20">
                Launch App
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="relative z-10 pt-40 pb-10 px-6 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-widest text-orange-400">
              AI-Powered Railway Intelligence Platform
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
            Smarter Trains.<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 via-fuchsia-500 to-cyan-400">Safer Railways.</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            Train AI is an intelligent traffic control system that uses artificial intelligence 
            to manage railway signals, prevent collisions, predict delays, and optimize 
            train movements across the Indian Railway network in real time.
          </p>

          <div className="flex flex-wrap gap-5 justify-center">
            <Link href="/simulation">
              <button className="px-10 py-4 bg-orange-500 text-black font-bold tracking-wide text-sm rounded-2xl hover:bg-orange-400 transition-all shadow-xl shadow-orange-500/20 flex items-center gap-3 group">
                Try the Simulator <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/realtime">
              <button className="px-10 py-4 bg-white/5 border border-white/10 text-white font-bold tracking-wide text-sm rounded-2xl hover:bg-white/10 transition-all backdrop-blur-xl flex items-center gap-3">
                <Globe className="w-4 h-4 text-fuchsia-400" /> View Live Trains
              </button>
            </Link>
          </div>
        </motion.div>

        {/* ── Live Stats Bar ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {[
            { value: "6", label: "Stations Monitored", color: "text-orange-400" },
            { value: "24/7", label: "Real-Time Tracking", color: "text-cyan-400" },
            { value: "AI", label: "Signal Decisions", color: "text-fuchsia-400" },
            { value: "0", label: "Target Collisions", color: "text-emerald-400" },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl text-center border-white/5">
              <div className={`text-3xl font-bold mb-2 ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] font-bold text-zinc-500 tracking-widest">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </header>

      {/* ── WHAT IS TRAIN AI ── */}
      <section id="about" className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold tracking-widest text-cyan-400">The Problem We Solve</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-8 leading-tight">
              Indian Railways runs<br />
              <span className="text-orange-400">13,000+ trains daily.</span><br />
              Managing them is chaos.
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed mb-6">
              Signal failures, manual coordination errors, and unpredictable delays cost 
              the Indian Railways billions every year. Current systems rely heavily on 
              human operators making split-second decisions for thousands of trains 
              simultaneously.
            </p>
            <p className="text-zinc-400 text-base leading-relaxed mb-8">
              <span className="text-white font-bold">Train AI changes this.</span> Our platform uses artificial intelligence 
              to automatically control railway signals, detect potential collisions before 
              they happen, and predict delays with high accuracy — all without human intervention.
            </p>
            <div className="flex items-center gap-6 pt-6 border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">AI-Powered</div>
                  <div className="text-[10px] text-zinc-500 font-medium">Not rule-based</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Real-Time</div>
                  <div className="text-[10px] text-zinc-500 font-medium">Live GIS data</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="grid grid-cols-2 gap-5"
          >
            <div className="glass-card p-7 rounded-3xl border-orange-500/10 hover:border-orange-500/20 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Signal className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2 tracking-tight">Smart Signals</h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">AI reads traffic density and automatically sets signals to Green, Yellow, or Red to keep trains safe.</p>
            </div>
            <div className="glass-card p-7 rounded-3xl border-rose-500/10 hover:border-rose-500/20 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2 tracking-tight">Collision Prevention</h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Continuously monitors the distance between all trains and triggers emergency stops if a conflict is detected.</p>
            </div>
            <div className="glass-card p-7 rounded-3xl border-cyan-500/10 hover:border-cyan-500/20 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2 tracking-tight">Delay Prediction</h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Machine learning models analyze patterns to forecast which trains will be delayed and by how many minutes.</p>
            </div>
            <div className="glass-card p-7 rounded-3xl border-fuchsia-500/10 hover:border-fuchsia-500/20 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6 text-fuchsia-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2 tracking-tight">Live GPS Tracking</h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Every station and train is plotted on a real-world map using OpenStreetMap for accurate geographic visualization.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative z-10 py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full mb-6">
              <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="text-[10px] font-bold tracking-widest text-fuchsia-400">System Architecture</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">How Train AI Works</h2>
            <p className="text-zinc-400 text-base max-w-2xl mx-auto leading-relaxed">
              Our platform connects a Python AI backend with a Next.js frontend, 
              processing real-world railway data through three intelligent layers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0, duration: 0.6 }}>
              <div className="glass-card p-10 rounded-4xl h-full border-orange-500/10 hover:border-orange-500/25 transition-all relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/5 blur-[60px] group-hover:bg-orange-500/10 transition-all" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-5xl font-bold text-orange-500/20">01</div>
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-4">Data Collection</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-8 font-medium">The system fetches real Indian Railway station coordinates and distances from our curated database. When you search any city, it queries OpenStreetMap to locate nearby railway stations with precise GPS data.</p>
                  <div className="space-y-3 pt-6 border-t border-white/5">
                    {["Mumbai-Delhi corridor mapped", "6 major junctions tracked", "Live search via OpenStreetMap"].map((d, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        <span className="text-xs text-zinc-500 font-medium">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15, duration: 0.6 }}>
              <div className="glass-card p-10 rounded-4xl h-full border-fuchsia-500/10 hover:border-fuchsia-500/25 transition-all relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-500/5 blur-[60px] group-hover:bg-fuchsia-500/10 transition-all" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-5xl font-bold text-fuchsia-500/20">02</div>
                    <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-fuchsia-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-4">AI Decision Engine</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-8 font-medium">A Python-based neural engine analyzes train positions, velocities, and track occupancy every second. It calculates optimal signal states and predicts future congestion points before they occur.</p>
                  <div className="space-y-3 pt-6 border-t border-white/5">
                    {["Recursive signal optimization", "Congestion pattern detection", "Speed adjustment protocols"].map((d, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                        <span className="text-xs text-zinc-500 font-medium">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.6 }}>
              <div className="glass-card p-10 rounded-4xl h-full border-cyan-500/10 hover:border-cyan-500/25 transition-all relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/5 blur-[60px] group-hover:bg-cyan-500/10 transition-all" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-5xl font-bold text-cyan-500/20">03</div>
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-4">Visual Command Center</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-8 font-medium">Everything is displayed on a beautiful dark-themed dashboard with an interactive Leaflet map, live signal matrix, delay charts, and an AI neural log showing every decision the system makes in real time.</p>
                  <div className="space-y-3 pt-6 border-t border-white/5">
                    {["Interactive GIS map", "Real-time signal matrix", "Live AI decision log"].map((d, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span className="text-xs text-zinc-500 font-medium">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="glass-card p-10 md:p-14 rounded-[3rem] border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
            <div className="lg:col-span-2">
              <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Built With Modern Tech</h3>
              <p className="text-zinc-400 text-base leading-relaxed font-medium">
                A production-grade stack combining the best of web development and machine learning 
                to deliver a responsive, real-time AI experience.
              </p>
            </div>
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-5">
              {[
                { name: "Next.js 16", role: "Frontend Framework" },
                { name: "FastAPI", role: "AI Backend" },
                { name: "Python", role: "Neural Engine" },
                { name: "Leaflet.js", role: "Interactive Maps" },
                { name: "OpenStreetMap", role: "GIS Data Source" },
                { name: "Framer Motion", role: "Animations" },
              ].map((t, i) => (
                <div key={i} className="p-6 bg-white/3 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="text-lg font-bold text-white mb-2">{t.name}</div>
                  <div className="text-xs text-zinc-500 font-bold tracking-wider">{t.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MODULES / CTA ── */}
      <section id="modules" className="relative z-10 max-w-7xl mx-auto px-6 py-28 border-t border-white/5">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Explore the Platform</h2>
          <p className="text-zinc-400 text-base max-w-xl mx-auto leading-relaxed">
            Choose a module to get started. The Simulator lets you test the AI in a sandbox.
            The Live Tracker connects to real-world data.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Module 1 */}
          <Link href="/simulation" className="group">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="glass-card p-10 rounded-[2.5rem] min-h-[480px] flex flex-col justify-between relative overflow-hidden border-orange-500/10 hover:border-orange-500/30 transition-all cursor-pointer">
                <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/5 blur-[100px] group-hover:bg-orange-500/10 transition-all" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-10">
                    <Monitor className="w-12 h-12 text-orange-400" />
                    <div className="px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[9px] font-bold text-orange-400 tracking-widest">Module 01</div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tighter mb-5 leading-tight">AI Simulation<br />Sandbox</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-sm font-medium mb-3">
                    A controlled testing environment where you can deploy trains on the Mumbai-Delhi corridor 
                    and watch the AI manage signals, prevent collisions, and optimize traffic flow in real time.
                  </p>
                  <ul className="space-y-2 mt-6">
                    {["Control train speed and count", "Watch AI change signals live", "Simulate track failures", "View the neural decision log"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative z-10 flex items-center gap-3 mt-8 text-orange-400 group-hover:gap-5 transition-all">
                  <span className="text-sm font-bold">Launch Simulator</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Module 2 */}
          <Link href="/realtime" className="group">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15, duration: 0.6 }}>
              <div className="glass-card p-10 rounded-[2.5rem] min-h-[480px] flex flex-col justify-between relative overflow-hidden border-fuchsia-500/10 hover:border-fuchsia-500/30 transition-all cursor-pointer">
                <div className="absolute top-0 right-0 w-72 h-72 bg-fuchsia-500/5 blur-[100px] group-hover:bg-fuchsia-500/10 transition-all" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-10">
                    <Activity className="w-12 h-12 text-fuchsia-400" />
                    <div className="px-4 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-[9px] font-bold text-fuchsia-400 tracking-widest">Module 02</div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tighter mb-5 leading-tight">Real-Time<br />Live Tracker</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-sm font-medium mb-3">
                    Connected to live geographic data. Search any Indian city, discover its railway stations, 
                    and watch the AI monitor signals and predict delays on a real-world interactive map.
                  </p>
                  <ul className="space-y-2 mt-6">
                    {["Search any city in India", "Live station discovery via GPS", "AI signal health monitoring", "Predictive delay analytics"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative z-10 flex items-center gap-3 mt-8 text-fuchsia-400 group-hover:gap-5 transition-all">
                  <span className="text-sm font-bold">Open Live Tracker</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-28">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="glass-card p-16 rounded-[3rem] text-center relative overflow-hidden border-orange-500/10"
        >
          <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-fuchsia-500/5" />
          <div className="relative z-10">
            <Radio className="w-12 h-12 text-orange-400 mx-auto mb-8" />
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6">Ready to Control the Network?</h2>
            <p className="text-zinc-400 text-base max-w-xl mx-auto leading-relaxed mb-10">
              Experience how artificial intelligence can transform railway traffic management. 
              Launch the simulator or connect to the live network now.
            </p>
            <div className="flex flex-wrap gap-5 justify-center">
              <Link href="/simulation">
                <button className="px-10 py-4 bg-orange-500 text-black font-bold text-sm rounded-2xl hover:bg-orange-400 transition-all shadow-xl shadow-orange-500/20 flex items-center gap-3 group">
                  Start Simulation <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/realtime">
                <button className="px-10 py-4 bg-white/5 border border-white/10 text-white font-bold text-sm rounded-2xl hover:bg-white/10 transition-all flex items-center gap-3">
                  <Globe className="w-4 h-4 text-fuchsia-400" /> Live Tracker
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-linear-to-br from-orange-400 to-fuchsia-600 rounded-lg flex items-center justify-center">
                  <Network className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold tracking-tight">Train AI</span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-sm font-medium">
                An AI-powered railway traffic control system built to demonstrate how 
                machine learning can make train networks safer and more efficient.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-300 tracking-widest mb-5">Platform</h4>
              <div className="space-y-3">
                <Link href="/simulation" className="block text-sm text-zinc-500 hover:text-orange-400 transition-colors font-medium">Simulation Sandbox</Link>
                <Link href="/realtime" className="block text-sm text-zinc-500 hover:text-fuchsia-400 transition-colors font-medium">Live Tracker</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-300 tracking-widest mb-5">Technology</h4>
              <div className="space-y-3 text-sm text-zinc-500 font-medium">
                <p>Next.js + React</p>
                <p>Python + FastAPI</p>
                <p>Leaflet + OpenStreetMap</p>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-700 font-medium">2026 Train AI. AI-Powered Railway Traffic Control System.</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400/70 font-bold">All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
