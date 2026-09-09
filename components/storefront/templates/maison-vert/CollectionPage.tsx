import type { ThemeConfig } from "@/lib/theme-config";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { MaisonVertNav } from "./Nav";
import { MaisonVertFooter } from "./Footer";
import { MaisonVertProductGrid } from "./ProductGrid";

interface Props { tenant: any; cfg: ThemeConfig; collection: any; produits: any[]; slug: string }

export function MaisonVertCollectionPage({ tenant, cfg, collection, produits, slug }: Props) {
  const c = cfg.colors;
  const devise = tenant.devise || "XAF";
  const commissionRate = tenant.commissionRate ?? 0.06;

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <MaisonVertNav tenant={tenant} cfg={cfg} slug={slug} />
      <section style={{ padding: "24px 4vw 0" }}>
        <div className="relative overflow-hidden" style={{ minHeight: 260, borderRadius: 24 }}>
          {collection.imageUrl ? <img src={collection.imageUrl} alt={collection.nom} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0" style={{ background: `radial-gradient(120% 90% at 40% 20%, ${c.accentSecondaire || c.accent}66, ${c.surface} 70%)` }} />}
          <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-14" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 65%)" }}>
            <h1 className="text-white" style={{ fontSize: "clamp(28px,4vw,44px)" }}>{collection.nom}</h1>
            {collection.description && <p className="mt-2 max-w-xl text-white/85">{collection.description}</p>}
          </div>
        </div>
      </section>
      <section style={{ padding: "50px 4vw 80px" }}>
        {produits.length > 0 ? <MaisonVertProductGrid produits={produits} slug={slug} devise={devise} commissionRate={commissionRate} colors={c} radius={cfg.radius} /> : <p className="py-16 text-center" style={{ color: c.texteMuted }}>Aucun produit dans cette collection pour le moment.</p>}
      </section>
      <MaisonVertFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
