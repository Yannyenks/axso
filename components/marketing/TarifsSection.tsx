"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Star, Zap } from "lucide-react";
import Link from "next/link";

const fonctionnalites = [
  "Boutique en ligne professionnelle",
  "Produits illimités",
  "Thèmes premium inclus",
  "Paiements Mobile Money intégrés",
  "Assistant IA pour vos fiches produits",
  "Constructeur visuel drag & drop",
  "Gestion commandes & clients",
  "Analytics en temps réel",
  "Codes promo & marketing",
  "Gestion des avis clients",
  "Domaine personnalisé",
  "Support WhatsApp 24/7",
];

export function TarifsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  };

  return (
    <section ref={sectionRef} className="py-24 bg-gray-50/50 relative overflow-hidden" id="tarifs">
      {/* Aurora background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#F5A623]/6 rounded-full blur-3xl" style={{ animation: "aurora 10s ease-in-out infinite" }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-amber-100/40 rounded-full blur-3xl" style={{ animation: "aurora 13s ease-in-out 4s infinite" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div
          className="text-center mb-16"
          style={{
            opacity: visible ? 1 : 0,
            animation: visible ? "flip3dIn 0.7s cubic-bezier(0.23,1,0.32,1) both" : "none",
          }}
        >
          <span className="text-[#F5A623] text-sm font-semibold uppercase tracking-widest mb-4 block">
            Tarification Transparente
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-playfair text-gray-900 mb-4">
            100% gratuit pour lancer
          </h2>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Aucune mensualité. Aucun abonnement. On ne gagne que quand vous gagnez.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* 3D tilt pricing card */}
          <div
            ref={cardRef}
            className="relative bg-white rounded-3xl border-2 border-[#F5A623]/40 p-8 sm:p-10 overflow-hidden"
            onMouseMove={onMouseMove}
            onMouseLeave={() => setTilt({ x: 0, y: 0 })}
            style={{
              opacity: visible ? 1 : 0,
              animation: visible ? "scaleReveal3d 0.8s 0.2s cubic-bezier(0.23,1,0.32,1) both" : "none",
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${tilt.x !== 0 ? 20 : 0}px)`,
              transition: tilt.x === 0
                ? "transform 0.6s cubic-bezier(0.23,1,0.32,1), box-shadow 0.6s ease"
                : "transform 0.08s linear",
              boxShadow: tilt.x !== 0
                ? `${-tilt.y * 3}px ${-tilt.x * 3}px 60px rgba(245,166,35,0.25), 0 40px 80px rgba(245,166,35,0.12)`
                : "0 20px 60px rgba(245,166,35,0.12)",
              willChange: "transform",
            }}
          >
            {/* Shimmer overlay on hover */}
            <div
              className="absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-300"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(245,166,35,0.08) 50%, transparent 60%)",
                backgroundSize: "200% 100%",
                animation: visible ? "shimmer 3s linear infinite" : "none",
                opacity: tilt.x !== 0 ? 1 : 0.4,
              }}
            />

            <div className="absolute top-0 right-0 bg-[#F5A623] text-white text-xs font-bold px-4 py-2 rounded-bl-2xl flex items-center gap-1">
              <Zap size={11} />
              PLAN UNIQUE
            </div>

            <div className="mb-8 relative">
              <div className="flex items-end gap-3 mb-2">
                <span
                  className="text-6xl font-bold font-playfair"
                  style={{
                    background: "linear-gradient(110deg, #F5A623 0%, #FFD280 40%, #F5A623 60%, #E09015 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "shimmer 2.5s linear infinite",
                  }}
                >
                  0 F
                </span>
                <span className="text-gray-400 mb-2">/ mois</span>
              </div>
              <div className="flex items-center gap-2 text-lg text-gray-700">
                <Star className="text-[#F5A623]" size={18} fill="#F5A623" />
                <span><strong className="text-[#F5A623]">3%</strong> de commission par vente réussie</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Sur une vente de 50 000 F → Vous recevez 48 500 F, Axso garde 1 500 F
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-10">
              {fonctionnalites.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3"
                  style={{
                    opacity: visible ? 1 : 0,
                    animation: visible ? `slideRevealLeft 0.5s ${400 + i * 40}ms cubic-bezier(0.23,1,0.32,1) both` : "none",
                  }}
                >
                  <div className="w-5 h-5 rounded-full bg-[#F5A623]/15 flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:bg-[#F5A623] hover:scale-110 group">
                    <Check className="text-[#F5A623] group-hover:text-white transition-colors" size={12} strokeWidth={3} />
                  </div>
                  <span className="text-gray-600 text-sm">{f}</span>
                </div>
              ))}
            </div>

            <Link
              href="/inscription"
              className="block w-full text-center bg-[#F5A623] text-white font-bold py-4 rounded-xl text-lg hover:bg-[#D4911A] transition-all hover:scale-[1.02] shadow-lg shadow-[#F5A623]/30 active:scale-[0.98]"
            >
              Créer ma boutique gratuitement →
            </Link>
            <p className="text-center text-gray-400 text-xs mt-4">
              Aucune carte bancaire requise • Sans engagement
            </p>
          </div>
        </div>

        {/* Comparison row */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { plateforme: "Axso", cout: "0 F / mois + 3%", highlight: true },
            { plateforme: "Shopify", cout: "32 USD / mois", highlight: false },
            { plateforme: "WooCommerce", cout: "Hébergement + plugins", highlight: false },
            { plateforme: "Squarespace", cout: "23 USD / mois", highlight: false },
          ].map((item, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border transition-all duration-300 ${item.highlight ? "bg-amber-50 border-[#F5A623]/30 hover:scale-105" : "bg-white border-gray-100 hover:border-gray-200"}`}
              style={{
                opacity: visible ? 1 : 0,
                animation: visible ? `flip3dIn 0.6s ${800 + i * 100}ms cubic-bezier(0.23,1,0.32,1) both` : "none",
              }}
            >
              <p className="font-bold mb-1" style={{ color: item.highlight ? "#F5A623" : "#9ca3af" }}>
                {item.plateforme}
              </p>
              <p className="text-xs text-gray-400">{item.cout}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
