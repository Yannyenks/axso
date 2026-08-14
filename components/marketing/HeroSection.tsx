"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Heart, ShoppingBag, FileText, Ruler, Layers, Truck as TruckIcon } from "lucide-react";

const PRODUIT_DETAILS = [
  { label: "Description produit", Icon: FileText },
  { label: "Dimensions", Icon: Ruler },
  { label: "Matières", Icon: Layers },
  { label: "Livraison & Retours", Icon: TruckIcon },
];

export function HeroSection() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function demarrer(e: React.FormEvent) {
    e.preventDefault();
    router.push(email ? `/inscription?email=${encodeURIComponent(email)}` : "/inscription");
  }

  return (
    <section className="relative w-full pt-24 pb-10 sm:pt-28 sm:pb-14 bg-white overflow-hidden">
      <div className="px-3 sm:px-6 lg:px-8 max-w-[1500px] mx-auto">

        {/* ─── Collage photo — mosaïque façon Shopify ─── */}
        <div className="ax-mosaic relative h-[560px] sm:h-[640px] lg:h-[720px] rounded-[28px] overflow-hidden">
          <div className="ax-tile ax-tile-desktop" style={{ gridArea: "chart" }}>
            <div className="w-full h-full bg-white flex flex-col justify-between p-4 sm:p-5">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Revenus</p>
                <p className="text-2xl sm:text-3xl font-extrabold mt-1" style={{ color: "#1B2A4A" }}>+24%</p>
                <p className="text-[11px] text-gray-400 mt-0.5">vs le mois dernier</p>
              </div>
              <div className="flex items-end gap-1 h-14">
                {[35, 55, 42, 78, 60, 90, 100].map((h, i) => (
                  <div key={i} className="flex-1 rounded-md" style={{ height: `${h}%`, background: i === 6 ? "#F5A623" : "#F5A62330" }} />
                ))}
              </div>
            </div>
          </div>

          <div className="ax-tile" style={{ gridArea: "bags" }}>
            <img src="/hero-bags.jpg" alt="Maroquinerie artisanale vendue sur Axso" className="w-full h-full object-cover" />
          </div>

          <div className="ax-tile" style={{ gridArea: "kente" }}>
            <img src="/hero-kente.jpg" alt="Textile Kente et cosmétiques vendus sur Axso" className="w-full h-full object-cover" />
          </div>

          <div className="ax-tile ax-tile-desktop" style={{ gridArea: "headphones" }}>
            <img src="/hero-headphones.jpg" alt="Accessoires audio artisanaux vendus sur Axso" className="w-full h-full object-cover" />
          </div>

          <div className="ax-tile ax-tile-desktop" style={{ gridArea: "argan" }}>
            <img src="/hero-argan.jpg" alt="Huile d'argan cosmétique vendue sur Axso" className="w-full h-full object-cover" />
          </div>

          <div className="ax-tile" style={{ gridArea: "market" }}>
            <img src="/hero-market.jpg" alt="Paiement mobile accepté sur un marché africain" className="w-full h-full object-cover" />
          </div>

          <div className="ax-tile" style={{ gridArea: "stand" }}>
            <img src="/hero-stand.jpg" alt="Accessoires tech vendus sur Axso" className="w-full h-full object-cover" />
          </div>

          <div className="ax-tile ax-tile-desktop" style={{ gridArea: "detail" }}>
            <div className="w-full h-full bg-white flex flex-col justify-between p-4 sm:p-5">
              <div>
                <p className="text-base sm:text-lg font-extrabold" style={{ color: "#1B2A4A" }}>XOF 24 900</p>
                <div className="mt-3 h-9 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold text-white" style={{ background: "#1B2A4A" }}>
                  <ShoppingBag size={12} /> Ajouter au panier
                </div>
              </div>
              <div className="space-y-2 mt-3">
                {PRODUIT_DETAILS.map(d => (
                  <div key={d.label} className="flex items-center gap-1.5 text-[10.5px] text-gray-500 border-t border-gray-100 pt-2 first:border-0 first:pt-0">
                    <d.Icon size={10} style={{ color: "#F5A623" }} /> {d.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ax-tile ax-tile-desktop" style={{ gridArea: "coffee" }}>
            <img src="/hero-coffee.jpg" alt="Épicerie fine vendue sur Axso" className="w-full h-full object-cover" />
          </div>

          <div className="ax-tile" style={{ gridArea: "moto" }}>
            <img src="/hero-moto.jpg" alt="Livraison rapide en ville avec Axso" className="w-full h-full object-cover" />
          </div>

          {/* Badge décoratif flottant */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center z-20">
            <Heart size={16} style={{ color: "#F5A623" }} fill="#F5A623" />
          </div>

          {/* ─── Carte flottante centrale ─── */}
          <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
            <div className="flex flex-col items-center" style={{ maxWidth: "480px" }}>
              <div className="bg-white rounded-[24px] shadow-2xl px-7 py-6 sm:px-9 sm:py-7 text-center">
                <h1 className="text-[26px] sm:text-[32px] font-extrabold leading-[1.1] tracking-tight" style={{ color: "#111111" }}>
                  Ton commerce démarre avec Axso
                </h1>
                <p className="text-[13.5px] sm:text-[14.5px] text-gray-500 mt-3 leading-relaxed">
                  Commence gratuitement, sans carte bancaire.
                  <br className="hidden sm:block" /> WhatsApp, Orange Money, MTN et Wave intégrés dès le premier jour.
                </p>
              </div>

              <form onSubmit={demarrer}
                className="w-full rounded-[22px] shadow-2xl px-6 py-5 -mt-1 relative"
                style={{ background: "#111111" }}>
                <p className="text-white font-bold text-[15px]">Commencer gratuitement</p>
                <p className="text-white/40 text-[11px] mt-0.5 mb-3.5">En t'inscrivant, tu acceptes de recevoir nos emails.</p>
                <div className="flex items-center bg-white rounded-full pl-4 pr-1.5 py-1.5">
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="Entre ton email"
                    className="flex-1 min-w-0 bg-transparent outline-none text-[13.5px] text-[#111111] placeholder:text-gray-400"
                  />
                  <button type="submit"
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
                    style={{ background: "#F5A623" }}>
                    <ArrowRight size={16} style={{ color: "#111111" }} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ax-mosaic {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(6, 1fr);
          grid-template-rows: repeat(3, 1fr);
          grid-template-areas:
            "chart  bags   bags   headphones kente  kente"
            "market bags   bags   headphones detail detail"
            "market coffee stand  moto       moto   argan";
        }
        .ax-tile { position: relative; border-radius: 18px; overflow: hidden; background: #F5F5F5; }
        @media (max-width: 860px) {
          .ax-mosaic {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(4, 1fr);
            grid-template-areas:
              "market bags"
              "market bags"
              "kente  stand"
              "moto   moto";
          }
          .ax-tile-desktop { display: none; }
        }
      `}</style>
    </section>
  );
}
