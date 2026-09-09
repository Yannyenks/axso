import Link from "next/link";
import { prixClient } from "@/lib/pricing";
import { formatMontant } from "@/lib/utils";
import { WishlistHeartButton } from "@/components/storefront/WishlistHeartButton";
import { GrainLayer } from "./GrainFilterDefs";
import type { ThemeColors } from "@/lib/theme-config";

// Motif éditorial asymétrique — répète le cycle (3,3,2,2,2)/6 colonnes pour
// n'importe quel nombre de produits, exactement comme la maquette envoyée.
const SPAN_CYCLE = [3, 3, 2, 2, 2];

// Dégradés décoratifs de repli quand un produit n'a pas de photo — cycle
// entre quelques teintes de la palette pour ne jamais avoir un aplat vide.
function fallbackGradient(accent: string, i: number): string {
  const angles = [
    `radial-gradient(120% 90% at 25% 10%, ${accent}55 0%, ${accent}25 45%, #15131a 100%)`,
    `radial-gradient(120% 90% at 75% 15%, ${accent}66 0%, ${accent}30 45%, #221c17 100%)`,
    `radial-gradient(120% 90% at 30% 20%, ${accent}44 0%, ${accent}22 50%, #22201d 100%)`,
  ];
  return angles[i % angles.length];
}

interface Props {
  produits: any[];
  slug: string;
  devise: string;
  commissionRate: number;
  colors: ThemeColors;
}

export function NoirAtelierProductGrid({ produits, slug, devise, commissionRate, colors: c }: Props) {
  if (!produits.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-6 gap-[2px]" style={{ backgroundColor: c.bordure }}>
      {produits.map((p, i) => {
        const span = SPAN_CYCLE[i % SPAN_CYCLE.length];
        const prixAffiche = prixClient(p.prix, commissionRate);
        return (
          <Link
            key={p.id}
            href={`/${slug}/produits/${p.id}`}
            className="relative overflow-hidden group"
            style={{ backgroundColor: c.fond, gridColumn: `span ${span} / span ${span}` }}
          >
            <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.nom} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" style={{ transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)" }} />
              ) : (
                <div className="w-full h-full transition-transform duration-700 group-hover:scale-[1.035]" style={{ background: fallbackGradient(c.accent, i) }} />
              )}
              <GrainLayer />
              <WishlistHeartButton produitId={p.id} accent={c.accent} fond={c.fond} className="absolute top-3 right-3 w-8 h-8 rounded-full" />
            </div>
            <div className="flex items-baseline justify-between px-4.5 py-4" style={{ fontFamily: "'Archivo Narrow',sans-serif" }}>
              <span className="text-[16px] truncate pr-2" style={{ fontFamily: "'Fraunces',serif", color: c.texte }}>{p.nom}</span>
              <span className="text-[13px] flex-shrink-0" style={{ color: c.texteMuted }}>{formatMontant(prixAffiche, devise)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
