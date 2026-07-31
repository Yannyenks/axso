"use client";
import { useEffect, useRef, useState } from "react";
import { Check, X, Zap, Star } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    id: "essentiel",
    nom: "Essentiel",
    prix: 1200,
    couleur: "#6b7280",
    gradFrom: "#6b7280",
    gradTo: "#9ca3af",
    bg: "#f9fafb",
    borderColor: "rgba(107,114,128,0.25)",
    shadowColor: "rgba(107,114,128,0.15)",
    desc: "Pour planter les premières graines de ton empire",
    features: [
      "30 commandes / mois",
      "1 boutique en ligne",
      "AXIA IA — version essentielle",
      "Social Media intégré",
      "Paiements Mobile Money",
      "Support communauté",
    ],
    notIncluded: ["Commandes illimitées", "Navigateur AXIA", "Sourcing dropshipping mondial"],
    recommande: false,
    cta: "Commencer →",
  },
  {
    id: "pro",
    nom: "Pro",
    prix: 5000,
    couleur: "#F5A623",
    gradFrom: "#F5A623",
    gradTo: "#FFD280",
    bg: "#fffbeb",
    borderColor: "rgba(245,166,35,0.35)",
    shadowColor: "rgba(245,166,35,0.25)",
    desc: "L'empire prend de l'ampleur — tout ce qu'il faut pour dominer",
    features: [
      "Commandes illimitées",
      "Social Media intégré",
      "AXIA IA — version avancée",
      "Navigateur intégré AXIA",
      "Analytics avancés",
      "Marketing & automatisations",
      "Support prioritaire",
    ],
    notIncluded: ["Sourcing dropshipping mondial"],
    recommande: true,
    cta: "Lancer mon empire →",
  },
  {
    id: "illimite",
    nom: "Illimité",
    prix: 20000,
    couleur: "#7c3aed",
    gradFrom: "#7c3aed",
    gradTo: "#a78bfa",
    bg: "#f5f3ff",
    borderColor: "rgba(124,58,237,0.25)",
    shadowColor: "rgba(124,58,237,0.18)",
    desc: "L'empire sans frontières — zéro limite, contrôle total",
    features: [
      "AUCUNE LIMITE — tout inclus",
      "AXIA IA — version complète",
      "Navigateur AXIA + contrôle total",
      "Sourcing dropshipping mondial",
      "Boutiques illimitées",
      "API & Webhooks",
      "Analytics temps réel",
      "Support prioritaire 24/7",
    ],
    notIncluded: [],
    recommande: false,
    cta: "Empire sans limites →",
  },
];

export function TarifsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [tilt, setTilt] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-28 bg-white relative overflow-hidden" id="tarifs">
      {/* Aurora */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(245,166,35,0.09) 0%, transparent 70%)", animation: "aurora 12s ease-in-out infinite" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%)", animation: "aurora 14s ease-in-out 5s infinite" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(245,166,35,0.06) 0%, transparent 70%)", animation: "aurora 10s ease-in-out 2s infinite" }} />
      </div>

      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 relative">

        {/* Header */}
        <div
          className="text-center mb-20"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(24px)",
            transition: "all 0.8s cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <span className="text-[#F5A623] text-sm font-bold uppercase tracking-[0.2em] mb-4 block">
            ⚡ Paliers de puissance
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5"
            style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>
            Choisis ton palier d'empire
          </h2>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            De l'essentiel à l'illimité — chaque plan est un tremplin vers plus grand.
            <br className="hidden sm:block" />
            AXSO grandit avec toi.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {PLANS.map((plan, idx) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              visible={visible}
              delay={idx * 120}
            />
          ))}
        </div>

        {/* Comparaison Axso vs concurrents */}
        <div
          className="mt-20 max-w-4xl mx-auto"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 1s 0.8s" }}
        >
          <p className="text-center text-sm font-bold uppercase tracking-widest text-gray-300 mb-8">
            Pourquoi AXSO bat la concurrence
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { plateforme: "AXSO",        cout: "dès 1 200 XOF/mois", highlight: true,  note: "Fait pour l'Afrique" },
              { plateforme: "Shopify",     cout: "~19 000 XOF/mois",  highlight: false, note: "Aucun support local" },
              { plateforme: "WooCommerce", cout: "Hébergement + dev",  highlight: false, note: "Complexe à gérer" },
              { plateforme: "Squarespace", cout: "~14 000 XOF/mois",  highlight: false, note: "Pas fait pour vous" },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border text-center transition-all duration-300"
                style={{
                  background: item.highlight ? "#fffbeb" : "white",
                  borderColor: item.highlight ? "rgba(245,166,35,0.4)" : "#f0f0f0",
                  boxShadow: item.highlight ? "0 8px 30px rgba(245,166,35,0.15)" : "none",
                }}
              >
                <p className="font-bold text-sm mb-1.5" style={{ color: item.highlight ? "#F5A623" : "#9ca3af" }}>
                  {item.plateforme}
                  {item.highlight && <span className="ml-1">🏆</span>}
                </p>
                <p className="text-xs font-semibold text-gray-700 mb-1">{item.cout}</p>
                <p className="text-[10px] text-gray-400">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Guarantee strip */}
        <div
          className="mt-14 text-center"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 1s 1s" }}
        >
          <p className="text-sm text-gray-400">
            🔒 Paiement sécurisé · Annulation à tout moment · Pas de frais cachés
          </p>
        </div>
      </div>

      <style>{`
        @keyframes aurora { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.05) translate(10px,-10px)} }
      `}</style>
    </section>
  );
}

function PlanCard({
  plan, visible, delay,
}: {
  plan: typeof PLANS[0];
  visible: boolean;
  delay: number;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientY - rect.top) / rect.height - 0.5;
    const y = (e.clientX - rect.left) / rect.width - 0.5;
    setTilt({ x: x * -10, y: y * 10 });
  };

  const isActive = tilt.x !== 0;

  return (
    <div
      ref={ref}
      className="relative rounded-3xl"
      onMouseMove={onMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
          : "translateY(30px)",
        transition: isActive
          ? "transform 0.08s linear"
          : `transform 0.6s cubic-bezier(0.23,1,0.32,1), opacity 0.8s ${delay}ms cubic-bezier(0.23,1,0.32,1)`,
        willChange: "transform",
      }}
    >
      {/* Recommandé badge */}
      {plan.recommande && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 px-5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xl whitespace-nowrap"
          style={{
            background: `linear-gradient(135deg, ${plan.gradFrom}, ${plan.gradTo})`,
            color: "white",
            boxShadow: `0 4px 20px ${plan.shadowColor}`,
          }}
        >
          <Star size={11} fill="white" />
          LE PLUS POPULAIRE
          <Star size={11} fill="white" />
        </div>
      )}

      {/* Card */}
      <div
        className="relative rounded-3xl border overflow-hidden h-full flex flex-col"
        style={{
          background: plan.recommande ? "white" : plan.bg,
          borderColor: plan.borderColor,
          borderWidth: plan.recommande ? "2px" : "1px",
          boxShadow: isActive
            ? `0 30px 60px ${plan.shadowColor}, 0 0 0 1px ${plan.borderColor}`
            : plan.recommande
            ? `0 20px 50px ${plan.shadowColor}`
            : "0 2px 10px rgba(0,0,0,0.04)",
        }}
      >
        {/* Shimmer on hover */}
        {isActive && (
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              background: `linear-gradient(105deg, transparent 40%, ${plan.couleur}10 50%, transparent 60%)`,
              backgroundSize: "200% 100%",
              animation: "shimmer 2s linear infinite",
            }}
          />
        )}

        {/* Top gradient bar */}
        {plan.recommande && (
          <div className="h-1 w-full"
            style={{ background: `linear-gradient(90deg, ${plan.gradFrom}, ${plan.gradTo})` }} />
        )}

        <div className="p-7 flex-1 flex flex-col">
          {/* Plan name */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                style={{ background: `${plan.couleur}15`, color: plan.couleur }}
              >
                {plan.nom}
              </span>
              {plan.recommande && <Zap size={14} style={{ color: plan.couleur }} />}
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{plan.desc}</p>
          </div>

          {/* Price */}
          <div className="mb-8">
            <div className="flex items-end gap-2 mb-1">
              <span
                className="text-5xl font-black leading-none"
                style={{
                  background: `linear-gradient(135deg, ${plan.gradFrom}, ${plan.gradTo})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {plan.prix.toLocaleString("fr-FR")}
              </span>
              <span className="text-gray-400 text-sm mb-1.5">XOF / mois</span>
            </div>
            <p className="text-xs text-gray-400">
              ≈ {Math.round(plan.prix / 655).toLocaleString()} €/mois
            </p>
          </div>

          {/* Features incluses */}
          <div className="space-y-3 mb-6 flex-1">
            {plan.features.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${plan.couleur}15` }}
                >
                  <Check size={11} strokeWidth={3} style={{ color: plan.couleur }} />
                </div>
                <span className="text-sm text-gray-600 leading-snug">{f}</span>
              </div>
            ))}
            {plan.notIncluded.map((f, i) => (
              <div key={`not-${i}`} className="flex items-start gap-3 opacity-35">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-gray-100">
                  <X size={10} strokeWidth={3} className="text-gray-400" />
                </div>
                <span className="text-sm text-gray-400 leading-snug">{f}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/inscription"
            className="block w-full text-center py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={plan.recommande ? {
              background: `linear-gradient(135deg, ${plan.gradFrom}, ${plan.gradTo})`,
              color: "white",
              boxShadow: `0 8px 30px ${plan.shadowColor}`,
            } : {
              background: `${plan.couleur}10`,
              color: plan.couleur,
              border: `1px solid ${plan.couleur}30`,
            }}
          >
            {plan.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
