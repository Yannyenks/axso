import type { ThemeConfig } from "@/lib/theme-config";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { PulseNav } from "./Nav";
import { PulseFooter } from "./Footer";
import { PulseProductGrid } from "./ProductGrid";

interface Props {
  tenant: any;
  cfg: ThemeConfig;
  collection: any;
  produits: any[];
  slug: string;
}

export function PulseCollectionPage({ tenant, cfg, collection, produits, slug }: Props) {
  const c = cfg.colors;
  const devise = tenant.devise || "XAF";
  const commissionRate = tenant.commissionRate ?? 0.06;

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <PulseNav tenant={tenant} cfg={cfg} slug={slug} />

      <section className="relative overflow-hidden" style={{ minHeight: 300 }}>
        {collection.imageUrl ? (
          <img src={collection.imageUrl} alt={collection.nom} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${c.accent}, ${c.accentSecondaire || c.accent})` }} />
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-14" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 65%)" }}>
          <h1 className="text-white font-bold uppercase" style={{ fontSize: "clamp(32px,4vw,52px)" }}>{collection.nom}</h1>
          {collection.description && <p className="mt-2 max-w-xl text-white/85 font-medium">{collection.description}</p>}
        </div>
      </section>

      <section style={{ padding: "50px 4vw 80px" }}>
        {produits.length > 0 ? (
          <PulseProductGrid produits={produits} slug={slug} devise={devise} commissionRate={commissionRate} colors={c} colonnes={4} />
        ) : (
          <p className="py-16 text-center font-medium" style={{ color: c.texteMuted }}>Aucun produit dans cette collection pour le moment.</p>
        )}
      </section>

      <PulseFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
