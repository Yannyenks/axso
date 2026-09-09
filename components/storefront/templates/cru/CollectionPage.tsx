import type { ThemeConfig } from "@/lib/theme-config";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { CruNav } from "./Nav";
import { CruFooter } from "./Footer";
import { CruProductGrid } from "./ProductGrid";

interface Props { tenant: any; cfg: ThemeConfig; collection: any; produits: any[]; slug: string }

export function CruCollectionPage({ tenant, cfg, collection, produits, slug }: Props) {
  const c = cfg.colors;
  const devise = tenant.devise || "XAF";
  const commissionRate = tenant.commissionRate ?? 0.06;

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <CruNav tenant={tenant} cfg={cfg} slug={slug} />
      <section className="relative overflow-hidden" style={{ minHeight: 280 }}>
        {collection.imageUrl ? <img src={collection.imageUrl} alt={collection.nom} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0" style={{ background: `radial-gradient(120% 90% at 40% 20%, ${c.accentSecondaire || c.accent}55, ${c.surface} 70%)` }} />}
        <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-14" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent 65%)" }}>
          <h1 className="italic" style={{ fontSize: "clamp(30px,4vw,46px)" }}>{collection.nom}</h1>
          {collection.description && <p className="mt-2 max-w-xl text-white/80">{collection.description}</p>}
        </div>
      </section>
      <section style={{ padding: "50px 4vw 80px" }}>
        {produits.length > 0 ? <CruProductGrid produits={produits} slug={slug} devise={devise} commissionRate={commissionRate} colors={c} /> : <p className="py-16 text-center" style={{ color: c.texteMuted }}>Aucun produit dans cette collection pour le moment.</p>}
      </section>
      <CruFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
