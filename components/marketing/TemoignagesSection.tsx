"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const temoignages = [
  {
    nom: "Aminata Diallo", role: "Créatrice de mode, Dakar", pays: "SN", note: 5,
    texte: "En 3 mois avec Axso, j'ai multiplié mes ventes par 4. Le paiement Wave intégré a tout changé — mes clientes peuvent payer en quelques secondes. L'IA m'a même aidé à rédiger mes fiches produits !",
    ventes: "847 000 XOF", avatar: "A", couleur: "#1B4FD8",
  },
  {
    nom: "Jean-Pierre Mbarga", role: "Artisan, Douala", pays: "CM", note: 5,
    texte: "Je vendais mes produits artisanaux au marché. Aujourd'hui j'expédie dans toute l'Afrique Centrale grâce à Axso. Le dashboard est tellement simple à utiliser, même sans formation informatique.",
    ventes: "2 340 000 XAF", avatar: "J", couleur: "#c2622d",
  },
  {
    nom: "Grâce Kouassi", role: "Cosméticienne, Abidjan", pays: "CI", note: 5,
    texte: "Le thème Violet Cosmos correspond parfaitement à mon image de marque. Mes clientes adorent l'expérience d'achat. Les avis certifiés ont boosté ma crédibilité. Je recommande à 100% !",
    ventes: "1 200 000 XOF", avatar: "G", couleur: "#7c3aed",
  },
  {
    nom: "Fatou Sow", role: "Épicerie fine, Saint-Louis", pays: "SN", note: 5,
    texte: "L'assistant IA m'a suggéré des prix parfaits pour mon marché local. Les clients reçoivent leur confirmation automatiquement par WhatsApp. Axso pense à tout !",
    ventes: "560 000 XOF", avatar: "F", couleur: "#10b981",
  },
];

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  size: 2 + Math.random() * 3,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: i * 0.4,
  duration: 4 + Math.random() * 4,
}));

export function TemoignagesSection() {
  const [actif, setActif] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [dir, setDir] = useState<"left" | "right">("right");
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => navigate("right"), 5000);
    return () => clearInterval(timer);
  }, [actif]);

  const navigate = (direction: "left" | "right") => {
    setDir(direction);
    setPrev(actif);
    setActif((p) =>
      direction === "right"
        ? (p + 1) % temoignages.length
        : (p - 1 + temoignages.length) % temoignages.length
    );
    setTimeout(() => setPrev(null), 400);
  };

  const t = temoignages[actif];

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden" id="temoignages">
      {/* Floating star particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute text-[#1B4FD8]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.size * 4}px`,
              opacity: 0,
              animation: visible
                ? `floatParticle ${p.duration}s ${p.delay}s ease-in-out infinite`
                : "none",
            }}
          >
            ★
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div
          className="text-center mb-16"
          style={{
            opacity: visible ? 1 : 0,
            animation: visible ? "flip3dIn 0.7s cubic-bezier(0.23,1,0.32,1) both" : "none",
          }}
        >
          <span className="text-[#1B4FD8] text-sm font-semibold uppercase tracking-widest mb-4 block">
            Témoignages
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-playfair text-gray-900">
            Ils vendent déjà avec Axso
          </h2>
        </div>

        {/* 3D Testimonial card */}
        <div
          className="relative mb-8 overflow-hidden"
          style={{
            opacity: visible ? 1 : 0,
            animation: visible ? "scaleReveal3d 0.7s 0.2s cubic-bezier(0.23,1,0.32,1) both" : "none",
          }}
        >
          <div
            className="relative bg-gradient-to-br from-blue-50 to-white rounded-3xl border border-[#1B4FD8]/20 p-8 sm:p-12 text-center shadow-lg shadow-[#1B4FD8]/8"
            style={{
              transform: "perspective(1000px)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Glow behind avatar */}
            <div
              className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-2xl opacity-30 transition-all duration-500"
              style={{ backgroundColor: t.couleur }}
            />

            <div className="flex justify-center gap-1 mb-6">
              {[...Array(t.note)].map((_, i) => (
                <Star
                  key={i}
                  className="text-[#1B4FD8]"
                  size={22}
                  fill="#1B4FD8"
                  style={{
                    animation: visible ? `floatParticle 2s ${i * 0.1}s ease-in-out infinite` : "none",
                    filter: "drop-shadow(0 0 4px rgba(27,79,216,0.6))",
                  }}
                />
              ))}
            </div>

            <blockquote
              className="text-xl text-gray-600 leading-relaxed mb-8 italic transition-all duration-400"
              key={actif}
              style={{
                animation: `${dir === "right" ? "slideRevealRight" : "slideRevealLeft"} 0.4s cubic-bezier(0.23,1,0.32,1) both`,
              }}
            >
              "{t.texte}"
            </blockquote>

            <div
              className="flex items-center justify-center gap-4 transition-all duration-400"
              key={`avatar-${actif}`}
              style={{
                animation: `scaleReveal3d 0.4s 0.1s cubic-bezier(0.23,1,0.32,1) both`,
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-2xl transition-all duration-500"
                style={{
                  backgroundColor: t.couleur,
                  boxShadow: `0 0 0 4px ${t.couleur}30, 0 8px 32px ${t.couleur}50`,
                }}
              >
                {t.avatar}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-bold text-lg">{t.nom}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 tracking-wide">{t.pays}</span>
                </div>
                <p className="text-gray-400 text-sm">{t.role}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: t.couleur }}>{t.ventes} de ventes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div
          className="flex items-center justify-center gap-6"
          style={{
            opacity: visible ? 1 : 0,
            animation: visible ? "flip3dIn 0.7s 0.5s cubic-bezier(0.23,1,0.32,1) both" : "none",
          }}
        >
          <button
            onClick={() => navigate("left")}
            className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#1B4FD8] hover:border-[#1B4FD8]/50 hover:shadow-lg hover:shadow-[#1B4FD8]/20 hover:scale-110 transition-all duration-200"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-2">
            {temoignages.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDir(i > actif ? "right" : "left"); setPrev(actif); setActif(i); setTimeout(() => setPrev(null), 400); }}
                className={`h-2 rounded-full transition-all duration-300 ${i === actif ? "w-8" : "w-2 hover:w-4"}`}
                style={{ backgroundColor: i === actif ? t.couleur : "#e5e7eb" }}
              />
            ))}
          </div>
          <button
            onClick={() => navigate("right")}
            className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#1B4FD8] hover:border-[#1B4FD8]/50 hover:shadow-lg hover:shadow-[#1B4FD8]/20 hover:scale-110 transition-all duration-200"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
