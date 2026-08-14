"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Heart, ShoppingBag, FileText, Ruler, Layers, Truck as TruckIcon } from "lucide-react";

const PRODUIT_DETAILS = [
  { label: "Description produit", Icon: FileText },
  { label: "Dimensions", Icon: Ruler },
  { label: "Matières", Icon: Layers },
  { label: "Livraison & Retours", Icon: TruckIcon },
];

// 8 photos pour 8 emplacements photo de la mosaïque — permutées en continu (cf. useShuffle).
const PHOTOS = [
  { src: "/hero-bags.jpg",       alt: "Maroquinerie artisanale vendue sur Axso" },
  { src: "/hero-kente.jpg",      alt: "Textile Kente et cosmétiques vendus sur Axso" },
  { src: "/hero-headphones.jpg", alt: "Accessoires audio artisanaux vendus sur Axso" },
  { src: "/hero-argan.jpg",      alt: "Huile d'argan cosmétique vendue sur Axso" },
  { src: "/hero-market.jpg",     alt: "Paiement mobile accepté sur un marché africain" },
  { src: "/hero-stand.jpg",      alt: "Accessoires tech vendus sur Axso" },
  { src: "/hero-coffee.jpg",     alt: "Épicerie fine vendue sur Axso" },
  { src: "/hero-moto.jpg",       alt: "Livraison rapide en ville avec Axso" },
];
const SLOT_AREAS = ["bags", "kente", "headphones", "argan", "market", "stand", "coffee", "moto"];

/** Échange périodiquement deux emplacements au hasard — les photos "changent de place" en continu, sans jamais dupliquer une image. */
function useShuffle(count: number, intervalMs: number) {
  const [order, setOrder] = useState(() => Array.from({ length: count }, (_, i) => i));
  const [fading, setFading] = useState<number[]>([]);

  useEffect(() => {
    const iv = setInterval(() => {
      const a = Math.floor(Math.random() * count);
      let b = Math.floor(Math.random() * count);
      while (b === a) b = Math.floor(Math.random() * count);
      setFading([a, b]);
      setTimeout(() => {
        setOrder(prev => {
          const next = [...prev];
          [next[a], next[b]] = [next[b], next[a]];
          return next;
        });
        setTimeout(() => setFading([]), 60);
      }, 380);
    }, intervalMs);
    return () => clearInterval(iv);
  }, [count, intervalMs]);

  return { order, fading };
}

export function HeroSection() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const { order, fading } = useShuffle(PHOTOS.length, 3200);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  function demarrer(e: React.FormEvent) {
    e.preventDefault();
    router.push(email ? `/inscription?email=${encodeURIComponent(email)}` : "/inscription");
  }

  return (
    <section className="relative w-full h-screen min-h-[640px] bg-white overflow-hidden">

      {/* ─── Collage photo — mosaïque plein cadre, façon Shopify ─── */}
      <div className="ax-mosaic absolute inset-0">
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

        {SLOT_AREAS.map((area, slotIdx) => {
          const photo = PHOTOS[order[slotIdx]];
          const isFading = fading.includes(slotIdx);
          const isDesktopOnly = area === "headphones" || area === "argan" || area === "coffee";
          return (
            <div key={area} className={`ax-tile${isDesktopOnly ? " ax-tile-desktop" : ""}`} style={{ gridArea: area }}>
              <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover"
                style={{
                  opacity: isFading ? 0 : 1,
                  transform: isFading ? "scale(1.06)" : "scale(1)",
                  transition: "opacity 0.45s ease, transform 0.6s ease",
                }} />
            </div>
          );
        })}

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

        {/* Badge décoratif flottant */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center z-20">
          <Heart size={16} style={{ color: "#F5A623" }} fill="#F5A623" />
        </div>
      </div>

      {/* ─── Carte flottante centrale ─── */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-4 pointer-events-none">
        <div className="flex flex-col items-center pointer-events-auto" style={{
          maxWidth: "480px",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(18px) scale(0.97)",
          transition: "opacity 0.7s cubic-bezier(0.23,1,0.32,1), transform 0.7s cubic-bezier(0.23,1,0.32,1)",
        }}>
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

      <style>{`
        .ax-mosaic {
          display: grid;
          gap: 3px;
          grid-template-columns: repeat(6, 1fr);
          grid-template-rows: repeat(3, 1fr);
          grid-template-areas:
            "chart  bags   bags   headphones kente  kente"
            "market bags   bags   headphones detail detail"
            "market coffee stand  moto       moto   argan";
        }
        .ax-tile { position: relative; overflow: hidden; background: #F5F5F5; border-radius: 10px; }
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
