"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, Sparkles, Zap } from "lucide-react";

const MESSAGES = [
  { role: "user", texte: "Ajoute une promo -20% sur mes sneakers ce week-end" },
  { role: "xia",  texte: "C'est fait ✓ La promo est active du samedi 00h00 au dimanche 23h59, et j'ai notifié tes 3 derniers clients intéressés." },
];

export function XiaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 overflow-hidden" style={{ background: "#F7F8FA" }}>
      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="grid lg:grid-cols-2 gap-14 items-center max-w-[1400px] mx-auto">

          <div className="order-2 lg:order-1" style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(-24px)", transition: "all 0.8s cubic-bezier(0.23,1,0.32,1)" }}>
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 sm:p-6 max-w-md">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1B2A4A" }}>
                  <Sparkles size={15} color="#F5A623" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#111111]">Xia</p>
                  <p className="text-[11px] text-gray-400">Ton assistante IA</p>
                </div>
                <Mic size={16} className="ml-auto text-gray-300" />
              </div>
              <div className="space-y-3">
                {MESSAGES.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    style={{ opacity: visible ? 1 : 0, animation: visible ? `slideRevealLeft 0.5s ${300 + i * 250}ms cubic-bezier(0.23,1,0.32,1) both` : "none" }}>
                    <div className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed max-w-[85%] ${m.role === "user" ? "text-white" : "bg-gray-50 text-gray-700 border border-gray-100"}`}
                      style={m.role === "user" ? { background: "#F5A623" } : undefined}>
                      {m.texte}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2" style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(24px)", transition: "all 0.8s 0.1s cubic-bezier(0.23,1,0.32,1)" }}>
            <span className="text-[#F5A623] text-sm font-bold uppercase tracking-widest mb-4 block">Assistante IA</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111111] mb-5 leading-[1.08]">
              Rencontre Xia, ta copilote au quotidien
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              Parle-lui à l'écrit ou à la voix : elle configure ta boutique, répond à tes clients, lance des promotions et t'alerte sur ce qui compte — 24h/24.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
              <Zap size={14} style={{ color: "#F5A623" }} /> Comprend le français, disponible en interface vocale
            </div>
            <Link href="/inscription" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white transition-transform hover:scale-[1.03]"
              style={{ background: "#1B2A4A" }}>
              Parler à Xia →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
