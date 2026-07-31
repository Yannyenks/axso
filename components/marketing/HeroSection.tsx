"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CartParallax } from "./CartParallax";

const MOTS = ["en ligne", "digital", "africain", "sans limite"];
const FLAGS = ["🇸🇳", "🇨🇲", "🇨🇮", "🇬🇭", "🇳🇬", "🇰🇪", "🇲🇦"];

const HERO_CARTS = [
  { size: 700, top: "6%",  duration: 18, delay: 0,   opacity: 0.07, direction: "rtl" as const },
  { size: 440, top: "58%", duration: 25, delay: 6,   opacity: 0.055, direction: "ltr" as const },
  { size: 900, top: "73%", duration: 14, delay: 3,   opacity: 0.035, direction: "rtl" as const },
  { size: 340, top: "32%", duration: 30, delay: 12,  opacity: 0.06,  direction: "ltr" as const },
];

export function HeroSection() {
  const [motIdx, setMotIdx] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setMotIdx((i) => (i + 1) % MOTS.length), 2800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  };

  const mockupTransform = `perspective(1400px) rotateY(${-12 + mouse.x * 10}deg) rotateX(${6 + mouse.y * -7}deg) translateZ(${mouse.x !== 0 ? 30 : 0}px)`;

  return (
    <section
      className="relative min-h-screen w-full flex items-center pt-28 overflow-hidden bg-gradient-to-b from-white via-orange-50/30 to-white"
      style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouse({ x: 0, y: 0 })}
    >
      <CartParallax carts={HERO_CARTS} color="#F5A623" />

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[900px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(245,166,35,0.12) 0%, transparent 70%)", transform: `translateY(${-scrollY * 0.1}px)` }}/>
        <div className="absolute bottom-1/3 right-1/4 w-[700px] h-[550px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%)", transform: `translateY(${scrollY * 0.06}px)` }}/>
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `linear-gradient(#F5A623 1px, transparent 1px), linear-gradient(90deg, #F5A623 1px, transparent 1px)`, backgroundSize: "60px 60px", transform: `translateY(${scrollY * 0.04}px)` }}/>
      </div>

      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center max-w-[1700px] mx-auto">

          {/* ─── GAUCHE ─── */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(-30px)", transition: "all 0.9s cubic-bezier(0.23,1,0.32,1)" }}>

            {/* Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full mb-10 bg-[#F5A623]/10 border border-[#F5A623]/25">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5A623] opacity-75"/>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F5A623]"/>
              </span>
              <span className="text-[#F5A623] text-base font-semibold">⚡ 11 agents IA · tout est automatisé</span>
            </div>

            {/* Headline empire */}
            <h1 className="font-bold leading-[1.06] mb-8">
              <span className="block text-4xl lg:text-5xl xl:text-[4.2rem] 2xl:text-[4.8rem] text-gray-900 uppercase tracking-tight">
                Crée ton empire
              </span>
              <span
                key={motIdx}
                className="block text-4xl lg:text-5xl xl:text-[4.2rem] 2xl:text-[4.8rem] uppercase tracking-tight"
                style={{
                  background: "linear-gradient(135deg, #F5A623 0%, #e8950f 50%, #FFD280 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "heroWordIn 0.5s cubic-bezier(0.23,1,0.32,1) both, shimmer 3s linear infinite",
                }}
              >
                {MOTS[motIdx]}
              </span>
              <span className="block text-4xl lg:text-5xl xl:text-[4.2rem] 2xl:text-[4.8rem] text-gray-900 uppercase tracking-tight">
                avec <span style={{ color: "#F5A623" }}>AXSO</span>
              </span>
            </h1>

            <p
              style={{ opacity: visible ? 1 : 0, transition: "opacity 1s 0.25s" }}
              className="text-lg lg:text-xl xl:text-2xl text-gray-500 leading-relaxed mb-12 max-w-xl"
            >
              Présente ta vision — AXSO s'occupe du reste.
              <br />
              <span className="text-base text-gray-400 mt-1 block">
                Boutique, marketing, clients, livraison. Tout en quelques clics.
              </span>
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row gap-5 mb-14"
              style={{ opacity: visible ? 1 : 0, transition: "opacity 1s 0.4s" }}
            >
              <Link
                href="/inscription"
                className="group relative px-10 py-4 rounded-2xl font-bold text-lg text-white text-center overflow-hidden"
                style={{ background: "linear-gradient(135deg, #F5A623, #e8950f)", boxShadow: "0 0 50px rgba(245,166,35,0.35), 0 10px 40px rgba(245,166,35,0.25)" }}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.25) 50%, transparent 80%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s linear infinite" }}/>
                <span className="relative z-10">🚀 Lancer mon empire →</span>
              </Link>
              <Link
                href="#video-demo"
                className="px-10 py-4 rounded-2xl font-semibold text-lg text-gray-700 text-center border border-gray-200 bg-white hover:border-[#F5A623]/40 hover:shadow-md transition-all hover:scale-[1.02]"
              >
                ▶ Voir la démo IA
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6" style={{ opacity: visible ? 1 : 0, transition: "opacity 1s 0.6s" }}>
              <div className="flex -space-x-3">
                {FLAGS.map((f, i) => (
                  <div key={i} className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-200 to-[#F5A623] border-2 border-white flex items-center justify-center text-lg shadow-sm hover:scale-125 hover:z-10 transition-transform">
                    {f}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">+1 247 empires lancés</p>
                <p className="text-sm text-gray-400">dans 10 pays africains</p>
              </div>
            </div>
          </div>

          {/* ─── DROITE — 3D Mockup ─── */}
          <div
            className="relative hidden lg:flex items-center justify-center"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(30px)", transition: "all 0.9s 0.15s cubic-bezier(0.23,1,0.32,1)" }}
          >
            <div
              className="relative w-full"
              style={{
                maxWidth: "620px",
                transform: mockupTransform,
                transformStyle: "preserve-3d",
                transition: mouse.x === 0 ? "transform 0.7s cubic-bezier(0.23,1,0.32,1)" : "transform 0.06s linear",
                willChange: "transform",
              }}
            >
              {/* Glow */}
              <div className="absolute inset-0 rounded-3xl"
                style={{ transform: "translateZ(-60px) translateY(40px) scale(0.92)", background: "radial-gradient(ellipse, rgba(245,166,35,0.40) 0%, transparent 70%)", filter: "blur(50px)" }}/>

              {/* Card */}
              <div className="relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-2xl shadow-gray-200/60">
                {/* Browser chrome */}
                <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-400"/>
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-400"/>
                    <div className="w-3.5 h-3.5 rounded-full bg-green-400"/>
                  </div>
                  <div className="flex-1 bg-white rounded-xl px-4 py-1.5 text-sm text-gray-400 text-center border border-gray-100">
                    app.axso.africa/dashboard
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-[#F5A623]/10 text-[#F5A623]">● LIVE</span>
                </div>

                {/* Dashboard */}
                <div className="p-7 space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-gray-900">🤖 Empire en cours de construction</p>
                    <span className="text-sm text-gray-400">il y a 2 sec</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Revenus", val: "485 000", unit: "XOF", color: "#F5A623", bg: "#fffbeb", delta: "+24% 📈" },
                      { label: "Commandes", val: "48", unit: "", color: "#34d399", bg: "#f0fdf4", delta: "+8 ✅" },
                      { label: "Clients", val: "234", unit: "", color: "#818cf8", bg: "#f5f3ff", delta: "+12 🆕" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-2xl p-4" style={{ backgroundColor: m.bg }}>
                        <p className="text-xs text-gray-400 mb-1.5">{m.label}</p>
                        <p className="text-lg font-extrabold" style={{ color: m.color }}>
                          {m.val}<span className="text-xs ml-1 font-normal opacity-60">{m.unit}</span>
                        </p>
                        <p className="text-xs mt-1 font-semibold" style={{ color: m.color }}>{m.delta}</p>
                      </div>
                    ))}
                  </div>
                  {/* Agent activity */}
                  <div className="space-y-2">
                    {[
                      { agent: "NOVA", action: "Post Instagram généré", color: "#f472b6" },
                      { agent: "REX", action: "Prix optimisé +15%", color: "#34d399" },
                      { agent: "FID", action: "Email VIP envoyé × 34", color: "#22d3ee" },
                    ].map((a) => (
                      <div key={a.agent} className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-gray-50 border border-gray-100">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: a.color }}/>
                        <span className="text-sm font-bold" style={{ color: a.color }}>{a.agent}</span>
                        <span className="text-sm text-gray-500 flex-1">{a.action}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mini revenue chart */}
                  <div className="pt-2">
                    <p className="text-xs font-bold text-gray-400 mb-3">REVENUS · 7 DERNIERS JOURS</p>
                    <div className="flex items-end gap-1.5 h-16">
                      {[35, 55, 42, 78, 60, 90, 100].map((h, i) => (
                        <div key={i} className="flex-1 rounded-lg transition-all"
                          style={{
                            height: `${h}%`,
                            background: i === 6 ? "linear-gradient(180deg, #F5A623, #e8950f)" : "rgba(245,166,35,0.18)",
                            animation: `barIn 0.6s ${i * 0.08}s both`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-6 -right-6 rounded-2xl px-5 py-3 text-base font-bold shadow-2xl"
                style={{ background: "linear-gradient(135deg, #F5A623, #e8950f)", color: "white", transform: "translateZ(60px)", animation: "daFloat 4s ease-in-out infinite" }}>
                +24% CA 🚀
              </div>
              <div className="absolute -bottom-5 -left-6 rounded-2xl px-4 py-3 text-sm font-semibold border shadow-xl"
                style={{ background: "white", borderColor: "#7c3aed30", color: "#7c3aed", transform: "translateZ(40px)", animation: "daFloat 5s 1s ease-in-out infinite" }}>
                🤖 11 agents actifs
              </div>
              <div className="absolute top-1/2 -left-8 rounded-2xl px-3 py-2.5 text-xs font-bold shadow-lg"
                style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", transform: "translateZ(50px)", animation: "daFloat 4.5s 2s ease-in-out infinite" }}>
                ✅ Empire en ligne
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroWordIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes daFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes barIn { from{opacity:0;transform:scaleY(0);transform-origin:bottom} to{opacity:1;transform:scaleY(1);transform-origin:bottom} }
      `}</style>
    </section>
  );
}
