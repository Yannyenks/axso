import Link from "next/link";
import { prixClient } from "@/lib/pricing";
import { formatMontant } from "@/lib/utils";
import { WishlistHeartButton } from "@/components/storefront/WishlistHeartButton";
import type { ThemeColors } from "@/lib/theme-config";

function fallbackGradient(accent: string, secondaire: string, i: number): string {
  const angles = [`radial-gradient(120% 100% at 60% 20%, ${secondaire} 0%, #35402a 60%, #1B1F19 100%)`, `radial-gradient(120% 100% at 40% 80%, ${accent} 0%, #6b2f16 60%, #1B1F19 100%)`, `radial-gradient(120% 100% at 60% 30%, #4a4f42 0%, #23261f 60%, #1B1F19 100%)`];
  return angles[i % angles.length];
}

interface Props { produits: any[]; slug: string; devise: string; commissionRate: number; colors: ThemeColors }

export function ForgeProductGrid({ produits, slug, devise, commissionRate, colors: c }: Props) {
  if (!produits.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-[2px]" style={{ backgroundColor: c.bordure }}>
      {produits.map((p, i) => {
        const prixAffiche = prixClient(p.prix, commissionRate);
        const img1 = p.images?.[0];
        const img2 = p.images?.[1] || img1;
        return (
          <Link key={p.id} href={`/${slug}/produits/${p.id}`} className="relative overflow-hidden group" style={{ backgroundColor: c.fond }}>
            <div className="relative overflow-hidden" style={{ aspectRatio: "1/1", background: img1 ? undefined : fallbackGradient(c.accent, c.accentSecondaire || c.accent, i) }}>
              <WishlistHeartButton produitId={p.id} accent={c.accent} fond={c.fond} className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full" />
              {img1 && (
                <>
                  <img src={img1} alt={p.nom} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-450 group-hover:opacity-0" />
                  <img src={img2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-450 group-hover:opacity-100" />
                </>
              )}
            </div>
            <div className="flex items-baseline justify-between px-4.5 py-4">
              <span className="text-[15px] font-bold uppercase truncate pr-2">{p.nom}</span>
              <span className="text-xs" style={{ color: c.texteMuted }}>{formatMontant(prixAffiche, devise)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
