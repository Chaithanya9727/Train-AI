"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Cpu, Zap, Map, Activity, ArrowRight, 
  Train, Gauge, Globe, ShieldCheck, Brain, 
  BarChart3, Network, Sparkles
} from "lucide-react";

export default function Home() {
  const [particles, setParticles] = useState<{x:number;y:number;s:number}[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 40 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100, s: Math.random() * 3 + 1
    })));
  }, []);

  return (
    <div className="min-h-screen bg-[#04060b] text-white overflow-hidden relative">
      {/* Animated particle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-fuchsia-500/20"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-fuchsia-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[100px]" />
      </div>

      {/* HERO SECTION */}
      <header className="relative z-10 flex flex-col items-center justify-center pt-20 pb-10 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-fuchsia-300">AI-Powered Railway Intelligence</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
            <span className="text-white">AI TRAIN</span><br/>
            <span className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 bg-clip-text text-transparent">TRAFFIC CONTROL</span>
          </h1>

          <p className="text-zinc-500 text-lg max-w-xl mx-auto leading-relaxed font-medium">
            Advanced Reinforcement Learning system for optimizing Indian Railway corridors. 
            Real-time monitoring, predictive analytics, and AI-driven decision making.
          </p>
        </motion.div>

        {/* STATS BAR */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex items-center gap-10 mt-12 px-8 py-4 bg-zinc-900/50 rounded-2xl border border-white/5 backdrop-blur-sm"
        >
          {[
            { icon: Train, label: "Active Units", value: "24+" },
            { icon: Network, label: "Corridors", value: "6" },
            { icon: Brain, label: "AI Model", value: "RL v4.2" },
            { icon: ShieldCheck, label: "Safety Score", value: "99.8%" },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-fuchsia-400/60" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{stat.label}</span>
                <span className="text-sm font-black text-zinc-200">{stat.value}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </header>

      {/* MODULE CARDS */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-300 mb-3">Choose Your Module</h2>
          <p className="text-zinc-600 text-sm font-medium">Each module provides a unique view into the AI railway management system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* MODULE 1: SIMULATION */}
          <Link href="/simulation">
            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="group relative p-8 rounded-3xl border border-orange-500/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl cursor-pointer overflow-hidden hover:border-orange-500/30 transition-all duration-500 h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-[60px] group-hover:bg-orange-500/10 transition-all" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] transition-all">
                    <Gauge className="w-8 h-8 text-orange-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-500/50 bg-orange-500/5 px-3 py-1.5 rounded-full border border-orange-500/10">Module 01</span>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-100 mb-3">
                  AI Simulation
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                  Interactive sandbox to simulate train traffic. Spawn & purge train units, 
                  adjust speed, trigger incidents, and watch the RL agent optimize routes in real-time.
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {["Spawn Units", "Speed Control", "AI Decision Log", "Stress Test"].map(tag => (
                    <span key={tag} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 bg-zinc-800/80 rounded-full text-zinc-400 border border-white/5">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-orange-400 text-sm font-black uppercase tracking-widest group-hover:gap-5 transition-all">
                  Launch Simulation <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* MODULE 2: REAL-TIME TRACKING */}
          <Link href="/realtime">
            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="group relative p-8 rounded-3xl border border-fuchsia-500/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl cursor-pointer overflow-hidden hover:border-fuchsia-500/30 transition-all duration-500 h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-fuchsia-500/5 rounded-full blur-[60px] group-hover:bg-fuchsia-500/10 transition-all" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="p-4 bg-fuchsia-500/10 rounded-2xl border border-fuchsia-500/20 group-hover:shadow-[0_0_30px_rgba(217,70,239,0.15)] transition-all">
                    <Globe className="w-8 h-8 text-fuchsia-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-500/50 bg-fuchsia-500/5 px-3 py-1.5 rounded-full border border-fuchsia-500/10">Module 02</span>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-100 mb-3">
                  Real-Time India Rail
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                  Live GPS tracking on the Mumbai-Delhi Vande Bharat corridor. 
                  Search any Indian city, view AI congestion analysis, and monitor the full network.
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {["Live GPS Map", "Search Any City", "Vande Bharat", "AI Predictions"].map(tag => (
                    <span key={tag} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 bg-zinc-800/80 rounded-full text-zinc-400 border border-white/5">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-fuchsia-400 text-sm font-black uppercase tracking-widest group-hover:gap-5 transition-all">
                  Open Live Feed <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* TECH FOOTER */}
      <footer className="relative z-10 border-t border-white/5 py-8 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Cpu className="w-5 h-5 text-zinc-700" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">AI Train Traffic Control © 2026</span>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-700">
            <span>Next.js</span>
            <span>•</span>
            <span>FastAPI</span>
            <span>•</span>
            <span>Gymnasium (RL)</span>
            <span>•</span>
            <span>Leaflet GIS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
