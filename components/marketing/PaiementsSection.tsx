"use client";
import { useEffect, useRef, useState } from "react";
import { Smartphone, CreditCard, Banknote } from "lucide-react";

const pays = [
  { code: "SN", nom: "Sénégal", methodes: ["Wave", "Orange Money", "Free Money", "Visa/MC"], couleur: "#00853F" },
  { code: "CM", nom: "Cameroun", methodes: ["MTN MoMo", "Orange Money CM", "Visa/MC"], couleur: "#007A5E" },
  { code: "CI", nom: "Côte d'Ivoire", methodes: ["MTN MoMo CI", "Orange Money CI", "Wave", "Visa/MC"], couleur: "#F77F00" },
  { code: "GH", nom: "Ghana", methodes: ["MTN MoMo GH", "Vodafone Cash", "AirtelTigo", "Visa/MC"], couleur: "#006B3F" },
  { code: "NG", nom: "Nigeria", methodes: ["Bank Transfer", "USSD", "Visa/MC"], couleur: "#008751" },
  { code: "KE", nom: "Kenya", methodes: ["M-Pesa", "Airtel Money", "Visa/MC"], couleur: "#006600" },
];

function PayCard({ p, i, visible }: { p: (typeof pays)[0]; i: number; visible: boolean }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 10 });
  };

  return (
    <div
      className="bg-gray-50 border border-gray-100 rounded-2xl p-6 cursor-default"
      onMouseMove={onMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        opacity: visible ? 1 : 0,
        animation: visible ? `scaleReveal3d 0.6s ${i * 80}ms cubic-bezier(0.23,1,0.32,1) both` : "none",
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${tilt.x !== 0 ? 10 : 0}px)`,
        transition: tilt.x === 0
          ? "transform 0.5s cubic-bezier(0.23,1,0.32,1), border-color 0.3s ease, box-shadow 0.3s ease"
          : "transform 0.08s linear",
        borderColor: tilt.x !== 0 ? `${p.couleur}40` : "#f3f4f6",
        boxShadow: tilt.x !== 0 ? `0 20px 40px ${p.couleur}15, ${-tilt.y}px ${-tilt.x}px 20px ${p.couleur}10` : "none",
        willChange: "transform",
      }}
    >
      <div className="flex items-center gap-4 mb-4">
        <span
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-black tracking-wider transition-all duration-300 flex-shrink-0"
          style={{
            background: `${p.couleur}18`,
            color: p.couleur,
            border: `1.5px solid ${p.couleur}40`,
            filter: tilt.x !== 0 ? `drop-shadow(0 0 8px ${p.couleur}60)` : "none",
          }}
        >
          {p.code}
        </span>
        <div>
          <h3 className="text-gray-900 font-bold text-lg">{p.nom}</h3>
          <span className="text-xs text-gray-400">{p.methodes.length} méthodes</span>
        </div>
      </div>
      <div className="space-y-2">
        {p.methodes.map((m, j) => (
          <div key={j} className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1B4FD8]" />
            {m}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PaiementsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden" id="paiements">
      {/* Floating background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 -right-20 w-80 h-80 bg-[#1B4FD8]/5 rounded-full blur-3xl" style={{ animation: "aurora 12s ease-in-out infinite" }} />
        <div className="absolute bottom-10 -left-20 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl" style={{ animation: "aurora 9s ease-in-out 3s infinite" }} />
      </div>

      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 relative">
        <div
          className="text-center mb-16"
          style={{
            opacity: visible ? 1 : 0,
            animation: visible ? "flip3dIn 0.7s cubic-bezier(0.23,1,0.32,1) both" : "none",
          }}
        >
          <span className="text-[#1B4FD8] text-sm font-semibold uppercase tracking-widest mb-4 block">
            Paiements Africains
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-playfair text-gray-900 mb-4">
            Vos clients paient comme ils veulent
          </h2>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Mobile Money, cartes bancaires, virement — toutes les méthodes de paiement africaines intégrées via Flutterwave.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {pays.map((p, i) => (
            <PayCard key={i} p={p} i={i} visible={visible} />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icone: Smartphone, titre: "Mobile Money natif", desc: "Intégration directe avec MTN, Orange, Wave sans frais cachés" },
            { icone: CreditCard, titre: "Visa/Mastercard", desc: "Toutes les cartes bancaires acceptées partout en Afrique" },
            { icone: Banknote, titre: "Paiement à la livraison", desc: "Option cash on delivery pour les zones sans mobile money" },
          ].map((avantage, i) => {
            const Icone = avantage.icone;
            return (
              <div
                key={i}
                className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-100 hover:scale-[1.04] hover:shadow-xl hover:shadow-[#1B4FD8]/15 transition-all duration-300"
                style={{
                  opacity: visible ? 1 : 0,
                  animation: visible ? `flip3dIn 0.7s ${600 + i * 120}ms cubic-bezier(0.23,1,0.32,1) both` : "none",
                }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Icone className="text-[#1B4FD8]" size={24} />
                </div>
                <h4 className="text-gray-900 font-bold mb-2">{avantage.titre}</h4>
                <p className="text-gray-500 text-sm">{avantage.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
