"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useUiSfx } from "@/hooks/use-ui-sfx";
import { Crosshair, ShieldAlert, Cpu, Network } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const router = useRouter();
  const playUiSfx = useUiSfx();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cards = document.getElementsByClassName('feature-card');
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }
  };

  const floatingCards = [
    { word: "PHANTOM", color: "bg-red-600", border: "border-red-400/50", x: -380, y: -80, rotate: -15, delay: 0 },
    { word: "BERLIN", color: "bg-blue-600", border: "border-blue-400/50", x: 350, y: 120, rotate: 12, delay: 0.2 },
    { word: "SATELLITE", color: "bg-neutral-800", border: "border-white/20", x: -300, y: 180, rotate: 5, delay: 0.4 },
    { word: "LASER", color: "bg-red-600", border: "border-red-400/50", x: 420, y: -150, rotate: 22, delay: 0.6 },
    { word: "ASSASSIN", color: "bg-black", border: "border-amber-500", x: -50, y: -240, rotate: -8, delay: 0.8, textGlow: "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" },
  ];

  if (!mounted) return null;

  return (
    <main 
      className="relative min-h-screen w-full overflow-hidden bg-[#0A0A0A] text-white selection:bg-red-500/30"
      onMouseMove={handleMouseMove}
      ref={containerRef}
    >
      {/* Dynamic Tactical Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>
      
      {/* Intense Glowing Orbs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden mix-blend-screen">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], x: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] h-[700px] w-[700px] rounded-full bg-red-600/15 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2], x: [0, -50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[10%] right-[0%] h-[600px] w-[600px] rounded-full bg-blue-600/15 blur-[120px]"
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-16 sm:px-6 lg:px-8">
        
        {/* Hero Title Container */}
        <div className="relative w-full max-w-5xl text-center">
          {/* Floating Cards Background (Hidden on small screens) */}
          <div className="pointer-events-none absolute inset-0 z-0 hidden items-center justify-center md:flex">
            {floatingCards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                animate={{ 
                  opacity: 0.6, 
                  scale: 1,
                  x: card.x,
                  y: card.y,
                  rotate: card.rotate,
                }}
                transition={{ 
                  duration: 1.2, 
                  delay: card.delay,
                  type: "spring",
                  stiffness: 30,
                  damping: 10
                }}
                className={`absolute flex h-16 w-40 items-center justify-center rounded-xl border shadow-2xl backdrop-blur-md ${card.color} ${card.border}`}
              >
                <div className="absolute inset-0 bg-white/5 rounded-xl overlay mix-blend-overlay"></div>
                <span className={`text-[13px] font-black tracking-[0.2em] uppercase ${card.textGlow || "text-white drop-shadow-md"}`}>
                  {card.word}
                </span>
                <div className="absolute top-1 left-1.5 opacity-40 text-[8px] font-mono tracking-widest text-white/60">ID:{String(idx+1).padStart(2,'0')}</div>
              </motion.div>
            ))}
          </div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-20 text-balance text-6xl font-extrabold uppercase tracking-tighter text-transparent sm:text-8xl md:text-[9rem] leading-[1.1] sm:leading-none bg-clip-text bg-gradient-to-b from-white via-white/90 to-neutral-500 filter drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]"
          >
            SpyWords
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative z-20 mx-auto mt-4 sm:mt-8 max-w-2xl text-lg font-medium text-neutral-400 sm:text-xl lg:text-2xl leading-relaxed"
          >
            A high-stakes game of espionage, word association, and deception. 
            One word connects everything. Will your team decode it?
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative z-20 mt-10 sm:mt-12 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0"
          >
            <Button
              className="group relative h-16 w-full sm:w-[240px] overflow-hidden rounded-2xl bg-white text-lg font-bold text-black transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)]"
              onClick={() => {
                playUiSfx("bright");
                router.push("/play");
              }}
            >
              {/* Invisible spacer to maintain button width */}
              <span className="invisible px-10">Deploy Agents</span>
              
              <div className="absolute inset-0 flex items-center justify-center gap-3 transition-transform duration-300 group-hover:-translate-y-full">
                <span>Deploy Agents</span> <Crosshair className="h-5 w-5" />
              </div>
              <div className="absolute inset-0 flex translate-y-full items-center justify-center gap-3 bg-red-600 text-white transition-transform duration-300 group-hover:translate-y-0">
                <span>Enter Lobby</span> <Network className="h-5 w-5" />
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-16 w-full sm:w-[240px] rounded-2xl border-white/20 bg-black/40 text-lg font-semibold text-white backdrop-blur-xl transition-all hover:bg-white/10 hover:border-white/40"
              onClick={() => {
                playUiSfx("soft");
                router.push("/play");
              }}
            >
              Quick Match
            </Button>
          </motion.div>
        </div>

        {/* Feature Highlights Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="relative z-20 mt-28 grid w-full max-w-6xl gap-6 md:grid-cols-3"
        >
          {[
            {
              title: "Encrypted Comms",
              desc: "Seamless, ultra-low latency WebSocket connections keep your team synchronized.",
              icon: Network,
              color: "text-blue-400 border-blue-500/30"
            },
            {
              title: "Tactical Gameplay",
              desc: "Navigate the grid. Find your double agents. Avoid the lethal assassin word.",
              icon: ShieldAlert,
              color: "text-red-400 border-red-500/30"
            },
            {
              title: "Dynamic Engines",
              desc: "Powered by advanced mechanics designed for intense social deduction.",
              icon: Cpu,
              color: "text-emerald-400 border-emerald-500/30"
            }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="feature-card group relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 transition-all duration-500 hover:bg-white/[0.04] hover:border-white/10 backdrop-blur-2xl"
              >
                <div className={`mb-6 inline-flex rounded-2xl border bg-black/50 p-3.5 shadow-inner ${feature.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-[1.35rem] font-bold tracking-tight text-white/90 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[0.95rem] font-medium leading-relaxed text-neutral-400 group-hover:text-neutral-300 transition-colors">
                  {feature.desc}
                </p>
                {/* Interactive Spotlight Hover effect */}
                <div 
                  className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-300 group-hover:opacity-100" 
                  style={{
                    background: `radial-gradient(500px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(255,255,255,0.06), transparent 40%)`
                  }} 
                />
              </div>
            );
          })}
        </motion.div>
        
        {/* Decorative Grid Floor (bottom) */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
      </div>
    </main>
  );
}
