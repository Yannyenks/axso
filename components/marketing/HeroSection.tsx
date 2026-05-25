"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: "1 247+", label: "boutiques actives" },
  { value: "10", label: "pays africains" },
  { value: "98%", label: "satisfaction clients" },
];

const FLAGS = ["🇸🇳", "🇨🇲", "🇨🇮", "🇬🇭", "🇳🇬"];
const MOTS = ["en ligne", "rentable", "puissante", "complète"];

export function HeroSection() {
  const [motIdx, setMotIdx] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setMotIdx((i) => (i + 1) % MOTS.length), 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouse({ x, y });
  };

  const handleMouseLeave = () => setMouse({ x: 0, y: 0 });

  const mockupTransform = `perspective(1200px) rotateY(${-10 + mouse.x * 8}deg) rotateX(${5 + mouse.y * -6}deg) translateZ(${mouse.x !== 0 ? 20 : 0}px)`;
  const orbParallax = -scrollY * 0.15;

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-gradient-to-b from-white to-orange-50/40">

      {/* Gradient orbs — parallax on scroll */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-24 left-1/4 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl animate-aurora"
          style={{ transform: `translateY(${orbParallax}px)` }}
        />
        <div
          className="absolute -top-20 right-10 w-80 h-80 bg-amber-100/60 rounded-full blur-3xl"
          style={{ transform: `translateY(${orbParallax * 0.7}px)`, animation: "aurora 10s ease-in-out 2s infinite" }}
        />
        <div
          className="absolute bottom-20 left-10 w-72 h-72 bg-orange-100/40 rounded-full blur-2xl"
          style={{ transform: `translateY(${orbParallax * 0.5}px)` }}
        />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-[#F5A623]/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#F5A623 1px, transparent 1px), linear-gradient(90deg, #F5A623 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            transform: `translateY(${scrollY * 0.05}px)`,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── LEFT ── */}
          <div style={{ animation: "slideRevealLeft 0.8s cubic-bezier(0.23,1,0.32,1) forwards" }}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/25 text-[#F5A623] text-sm font-semibold mb-8 animate-border-glow">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
              👋 Hello Axso tu vends quoi ?
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] mb-6 font-playfair">
              Ta boutique
              <br />
              <span
                key={motIdx}
                className="animate-shimmer"
                style={{ animation: "fadeSlideIn 0.4s ease forwards, shimmer 2.5s linear infinite" }}
              >
                {MOTS[motIdx]}
              </span>
            </h1>

            <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-lg"
              style={{ animation: "flip3dIn 1s 0.2s cubic-bezier(0.23,1,0.32,1) both" }}>
              Lance ta boutique en ligne en 3 minutes. Accepte les paiements mobile money.
              Gère tes livraisons. Tout depuis ton téléphone.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12"
              style={{ animation: "flip3dIn 1s 0.4s cubic-bezier(0.23,1,0.32,1) both" }}>
              <Link
                href="/inscription"
                className="px-8 py-4 bg-[#F5A623] text-white rounded-2xl font-bold text-base hover:bg-[#D4911A] transition-all shadow-xl shadow-[#F5A623]/30 hover:shadow-[#F5A623]/50 hover:scale-105 active:scale-95 text-center animate-glow-pulse"
              >
                Créer ma boutique — gratuit →
              </Link>
              <Link
                href="#themes"
                className="px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold text-base border border-gray-200 hover:border-[#F5A623]/40 hover:shadow-md transition-all text-center hover:scale-[1.02]"
              >
                Voir les thèmes
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-5"
              style={{ animation: "flip3dIn 1s 0.6s cubic-bezier(0.23,1,0.32,1) both" }}>
              <div className="flex -space-x-2.5">
                {FLAGS.map((f, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-[#F5A623] border-2 border-white flex items-center justify-center text-base shadow-sm hover:scale-125 hover:z-10 transition-transform cursor-default"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    {f}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">+1 247 boutiques actives</p>
                <p className="text-xs text-gray-400">dans 10 pays africains</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: 3D Mockup with mouse parallax ── */}
          <div
            ref={rightPanelRef}
            className="relative hidden lg:flex items-center justify-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ animation: "slideRevealRight 0.8s 0.15s cubic-bezier(0.23,1,0.32,1) both" }}
          >
            {/* 3D tilted dashboard card */}
            <div
              className="relative w-full max-w-[460px]"
              style={{
                transform: mockupTransform,
                transformStyle: "preserve-3d",
                transition: mouse.x === 0 ? "transform 0.6s cubic-bezier(0.23,1,0.32,1)" : "transform 0.08s linear",
                willChange: "transform",
              }}
            >
              {/* Drop shadow layer */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  transform: "translateZ(-40px) translateY(20px) scale(0.95)",
                  background: "linear-gradient(135deg, #F5A62340, #00000010)",
                  filter: "blur(30px)",
                }}
              />

              {/* Main card */}
              <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-2xl">
                {/* Browser chrome */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-lg px-3 py-1 text-xs text-gray-400 text-center border border-gray-100">
                    app.axso.africa/dashboard
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-gray-900">Tableau de bord</p>
                    <span className="text-xs text-gray-400">Aujourd'hui</span>
                  </div>

                  {/* KPI cards */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { label: "Revenus du mois", val: "485 000", unit: "XOF", color: "#F5A623", bg: "#fffbeb", delta: "+24%" },
                      { label: "Commandes", val: "48", unit: "", color: "#34d399", bg: "#f0fdf4", delta: "+8" },
                      { label: "Clients", val: "234", unit: "", color: "#60a5fa", bg: "#eff6ff", delta: "+12" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl p-3" style={{ backgroundColor: m.bg }}>
                        <p className="text-[9px] text-gray-500 mb-1">{m.label}</p>
                        <p className="text-sm font-extrabold" style={{ color: m.color }}>{m.val}<span className="text-[9px] ml-0.5 font-normal opacity-60">{m.unit}</span></p>
                        <p className="text-[9px] mt-0.5 font-semibold" style={{ color: m.color }}>{m.delta}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart bars */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[9px] text-gray-400 mb-2 font-medium">Ventes — 30 derniers jours</p>
                    <div className="flex items-end gap-[3px] h-14">
                      {[25, 40, 30, 55, 35, 70, 50, 85, 45, 60, 75, 55, 90, 65, 80, 70, 85, 60, 95, 75, 85, 70, 90, 55, 80, 65, 88, 72, 95, 100].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm transition-all"
                          style={{
                            height: `${h}%`,
                            backgroundColor: i >= 27 ? "#F5A623" : `#F5A623${Math.round(h * 0.45).toString(16).padStart(2, "0")}`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recent orders */}
                  <div className="space-y-2">
                    <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Dernières commandes</p>
                    {[
                      { name: "Aminata Kouyaté", item: "Robe Ankara", amount: "35 000 XOF", status: "✅" },
                      { name: "Moussa Diallo", item: "Tissu Kente", amount: "28 000 XOF", status: "📦" },
                      { name: "Fatou Camara", item: "Sac artisanal", amount: "65 000 XOF", status: "🚚" },
                    ].map((o) => (
                      <div key={o.name} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-[10px]">{o.status}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-gray-800 truncate">{o.name}</p>
                          <p className="text-[9px] text-gray-400 truncate">{o.item}</p>
                        </div>
                        <p className="text-[10px] font-bold text-[#F5A623] flex-shrink-0">{o.amount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating notification: Vente */}
            <div
              className="absolute -left-14 top-1/4 bg-white rounded-2xl shadow-xl p-3.5 border border-gray-100 w-44"
              style={{
                animation: "float 3s ease-in-out infinite",
                transform: `translateY(${mouse.y * -8}px) translateX(${mouse.x * -6}px)`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-base flex-shrink-0">💰</div>
                <div>
                  <p className="text-[9px] text-gray-400 font-medium">Vente reçue !</p>
                  <p className="text-sm font-extrabold text-gray-900">45 000 XOF</p>
                  <p className="text-[9px] text-green-500 font-semibold">Orange Money ✓</p>
                </div>
              </div>
            </div>

            {/* Floating notification: Commande */}
            <div
              className="absolute -right-8 bottom-1/3 bg-white rounded-2xl shadow-xl p-3.5 border border-gray-100 w-40"
              style={{
                animation: "float 3s ease-in-out 1s infinite",
                transform: `translateY(${mouse.y * 8}px) translateX(${mouse.x * 6}px)`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-base flex-shrink-0">📦</div>
                <div>
                  <p className="text-[9px] text-gray-400">Nouvelle commande</p>
                  <p className="text-xs font-bold text-gray-900">Aminata K.</p>
                  <p className="text-[9px] text-blue-500">Dakar, SN</p>
                </div>
              </div>
            </div>

            {/* Rating card */}
            <div
              className="absolute right-4 top-6 bg-white rounded-2xl shadow-xl p-3 border border-gray-100"
              style={{
                animation: "float 4s ease-in-out 0.5s infinite",
                transform: `translateY(${mouse.y * -10}px) translateX(${mouse.x * 5}px)`,
              }}
            >
              <div className="flex gap-0.5 mb-1">
                {[1,2,3,4,5].map(i => <span key={i} className="text-[#F5A623] text-sm">★</span>)}
              </div>
              <p className="text-[9px] text-gray-400">Satisfaction client</p>
              <p className="text-xs font-bold text-gray-900">4.9 / 5</p>
            </div>
          </div>
        </div>

        {/* Stats bar — scroll reveal */}
        <div
          ref={statsRef as React.RefObject<HTMLDivElement>}
          className={`mt-16 pt-10 border-t border-gray-100 grid grid-cols-3 gap-8 text-center reveal-3d ${statsVisible ? "visible" : ""}`}
        >
          {STATS.map((s, i) => (
            <div key={s.label} style={{ animationDelay: `${i * 120}ms` }}>
              <p className="text-3xl font-bold font-playfair text-gray-900 mb-1">{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
