import type { ThemeConfig } from "@/lib/theme-config";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { NoirAtelierNav } from "./Nav";
import { NoirAtelierFooter } from "./Footer";
import { GrainFilterDefs, GrainLayer } from "./GrainFilterDefs";
import { NoirAtelierProductGrid } from "./ProductGrid";

interface Props {
  tenant: any;
  cfg: ThemeConfig;
  collection: any;
  produits: any[];
  slug: string;
}

export function NoirAtelierCollectionPage({ tenant, cfg, collection, produits, slug }: Props) {
  const c = cfg.colors;
  const devise = tenant.devise || "XAF";
  const commissionRate = tenant.commissionRate ?? 0.06;

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh", fontFamily: "'Fraunces',serif" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <GrainFilterDefs />
      <NoirAtelierNav tenant={tenant} cfg={cfg} slug={slug} />

      <section className="relative overflow-hidden" style={{ minHeight: 320 }}>
        {collection.imageUrl ? (
          <img src={collection.imageUrl} alt={collection.nom} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(140% 100% at 30% 20%, ${c.accentSecondaire || c.accent}55 0%, #221c17 100%)` }} />
        )}
        <GrainLayer />
        <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-14" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 65%)" }}>
          <h1 className="text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 400 }}>{collection.nom}</h1>
          {collection.description && <p className="mt-2 max-w-xl text-white/75" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 14 }}>{collection.description}</p>}
        </div>
      </section>

      <section style={{ padding: "50px 4vw 80px" }}>
        {produits.length > 0 ? (
          <NoirAtelierProductGrid produits={produits} slug={slug} devise={devise} commissionRate={commissionRate} colors={c} />
        ) : (
          <p className="py-16 text-center" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>Aucun produit dans cette collection pour le moment.</p>
        )}
      </section>

      <NoirAtelierFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
