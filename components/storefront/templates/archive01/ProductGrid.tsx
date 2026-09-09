import Link from "next/link";
import { prixClient } from "@/lib/pricing";
import { formatMontant } from "@/lib/utils";
import { WishlistHeartButton } from "@/components/storefront/WishlistHeartButton";
import type { ThemeColors } from "@/lib/theme-config";

function fallbackGradient(accent: string, i: number): string {
  const angles = [
    `linear-gradient(160deg, ${accent}55, #0A0A0A)`,
    `linear-gradient(160deg, #3a3a3a, #0A0A0A)`,
    `linear-gradient(160deg, ${accent}, #151515)`,
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

export function Archive01ProductGrid({ produits, slug, devise, commissionRate, colors: c }: Props) {
  if (!produits.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-[2px]" style={{ backgroundColor: c.bordure }}>
      {produits.map((p, i) => {
        const prixAffiche = prixClient(p.prix, commissionRate);
        const img1 = p.images?.[0];
        const img2 = p.images?.[1] || img1;
        return (
          <Link key={p.id} href={`/${slug}/produits/${p.id}`} className="relative overflow-hidden group" style={{ backgroundColor: c.fond }}>
            <div className="relative overflow-hidden" style={{ aspectRatio: "1/1.05", background: img1 ? undefined : fallbackGradient(c.accent, i) }}>
              {p.stock > 0 && p.stock <= 5 && (
                <span className="absolute top-3 left-3 z-10 text-[10px] font-bold uppercase px-2 py-1" style={{ backgroundColor: c.accent, color: c.texte }}>
                  {p.stock} restants
                </span>
              )}
              <WishlistHeartButton produitId={p.id} accent={c.accent} fond={c.fond} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full" />
              {img1 ? (
                <>
                  <img src={img1} alt={p.nom} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-400 group-hover:opacity-0" />
                  <img src={img2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-400 group-hover:opacity-100" />
                </>
              ) : null}
            </div>
            <div className="flex items-baseline justify-between px-4 py-3.5">
              <span className="text-[13px] font-bold uppercase truncate pr-2">{p.nom}</span>
              <span className="text-[12px] font-medium flex-shrink-0" style={{ color: c.texteMuted }}>{formatMontant(prixAffiche, devise)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
