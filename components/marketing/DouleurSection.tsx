"use client";
import { useEffect, useRef, useState } from "react";

const CARTES = [
  {
    emoji: "😤",
    titre: "« Je perds des commandes sur WhatsApp »",
    texte: "Les clients t'écrivent, tu oublies de répondre, ils vont ailleurs. Avec AXSO, toutes tes commandes arrivent au même endroit — rien ne se perd.",
  },
  {
    emoji: "💸",
    titre: "« Mes clients ne savent pas comment me payer »",
    texte: "Orange Money et MTN Mobile Money sont intégrés nativement. Le client paie en 2 clics depuis son téléphone, tu encaisses immédiatement sur ton compte.",
  },
  {
    emoji: "🎨",
    titre: "« Je n'ai personne pour faire mes visuels pub »",
    texte: "L'IA AXSO génère tes affiches, stories et posts Instagram en quelques secondes. Professionnel, sans graphiste, sans budget créa.",
  },
  {
    emoji: "🤯",
    titre: "« Shopify c'est trop cher et trop compliqué »",
    texte: "AXSO est gratuit pour démarrer et en français. Ton premier produit en ligne en 3 minutes — sans développeur, sans hébergement à payer.",
  },
];

export function DouleurSection() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-gray-50/50 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] bg-[#F5A623]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div
          className="text-center mb-16"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "all 0.7s cubic-bezier(0.23,1,0.32,1)" }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold font-playfair text-gray-900">Tu te reconnais ici ?</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {CARTES.map((c, i) => (
            <div
              key={c.titre}
              className="rounded-2xl border border-gray-100 bg-white p-7 hover:border-[#F5A623]/30 hover:shadow-lg hover:shadow-[#F5A623]/5 transition-all"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(24px)",
                transition: `all 0.6s ${i * 0.1}s cubic-bezier(0.23,1,0.32,1)`,
              }}
            >
              <span className="text-3xl mb-4 block">{c.emoji}</span>
              <p className="font-bold text-gray-900 text-lg mb-2 leading-snug">{c.titre}</p>
              <p className="text-gray-500 leading-relaxed">{c.texte}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
