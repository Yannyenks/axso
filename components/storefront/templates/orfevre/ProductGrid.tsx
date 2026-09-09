import Link from "next/link";
import { prixClient } from "@/lib/pricing";
import { formatMontant } from "@/lib/utils";
import { WishlistHeartButton } from "@/components/storefront/WishlistHeartButton";
import type { ThemeColors } from "@/lib/theme-config";

function fallbackGradient(accent: string, i: number): string {
  const angles = [`radial-gradient(120% 100% at 50% 30%, ${accent}44 0%, #161E2E 60%, #0E1420 100%)`, `radial-gradient(120% 100% at 50% 70%, #2a1f18 0%, #161E2E 60%, #0E1420 100%)`, `radial-gradient(120% 100% at 30% 40%, #1c2436 0%, #0E1420 70%)`];
  return angles[i % angles.length];
}

interface Props { produits: any[]; slug: string; devise: string; commissionRate: number; colors: ThemeColors }

export function OrfevreProductGrid({ produits, slug, devise, commissionRate, colors: c }: Props) {
  if (!produits.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-[2px]" style={{ backgroundColor: c.bordure }}>
      {produits.map((p, i) => {
        const prixAffiche = prixClient(p.prix, commissionRate);
        const img1 = p.images?.[0];
        const img2 = p.images?.[1] || img1;
        return (
          <Link key={p.id} href={`/${slug}/produits/${p.id}`} className="relative overflow-hidden group text-left" style={{ backgroundColor: c.fond }}>
            <div className="relative overflow-hidden" style={{ aspectRatio: "1/1.15", background: img1 ? undefined : fallbackGradient(c.accent, i) }}>
              <WishlistHeartButton produitId={p.id} accent={c.accent} fond={c.fond} className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full" />
              {img1 && (
                <>
                  <img src={img1} alt={p.nom} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0" />
                  <img src={img2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </>
              )}
            </div>
            <div className="flex items-baseline justify-between py-5 px-1">
              <span className="text-[18px] truncate pr-2">{p.nom}</span>
              <span className="text-xs" style={{ color: c.accent }}>{formatMontant(prixAffiche, devise)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
