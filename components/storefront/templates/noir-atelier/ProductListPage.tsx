import Link from "next/link";
import type { ThemeConfig } from "@/lib/theme-config";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { NoirAtelierNav } from "./Nav";
import { NoirAtelierFooter } from "./Footer";
import { GrainFilterDefs } from "./GrainFilterDefs";
import { NoirAtelierProductGrid } from "./ProductGrid";

interface Props {
  tenant: any;
  cfg: ThemeConfig;
  produits: any[];
  slug: string;
  filtres: { q?: string; min?: string; max?: string; tri?: string; collection?: string };
}

const TRIS = [
  { v: "", l: "Par défaut" },
  { v: "prix-asc", l: "Prix croissant" },
  { v: "prix-desc", l: "Prix décroissant" },
  { v: "populaire", l: "Popularité" },
];

export function NoirAtelierProductListPage({ tenant, cfg, produits, slug, filtres }: Props) {
  const c = cfg.colors;
  const collections: any[] = tenant.collections || [];
  const devise = tenant.devise || "XAF";
  const commissionRate = tenant.commissionRate ?? 0.06;

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh", fontFamily: "'Fraunces',serif" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <GrainFilterDefs />
      <NoirAtelierNav tenant={tenant} cfg={cfg} slug={slug} />

      <section style={{ padding: "70px 4vw 40px" }}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mb-10 pb-6 border-b" style={{ borderColor: c.bordure }}>
          <div>
            <div className="mb-2" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 12.5, letterSpacing: "0.07em", color: c.texteMuted }}>BOUTIQUE</div>
            <h1 className="text-[34px]" style={{ fontFamily: "'Fraunces',serif", fontWeight: 400 }}>Tous les produits</h1>
          </div>
          <form method="GET" className="flex items-center gap-3 flex-wrap" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 13 }}>
            <input name="q" defaultValue={filtres.q} placeholder="Rechercher…" className="px-3 py-2 border bg-transparent outline-none w-40" style={{ borderColor: c.bordure, color: c.texte }} />
            <select name="tri" defaultValue={filtres.tri || ""} className="px-3 py-2 border bg-transparent outline-none" style={{ borderColor: c.bordure, color: c.texte }}>
              {TRIS.map((t) => <option key={t.v} value={t.v} style={{ color: "#000" }}>{t.l}</option>)}
            </select>
            <button type="submit" className="px-4 py-2" style={{ backgroundColor: c.texte, color: c.fond }}>Filtrer</button>
          </form>
        </div>

        {collections.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 12.5 }}>
            <Link href={`/${slug}/produits`} className="px-3.5 py-2 border" style={{ borderColor: c.bordure, color: !filtres.collection ? c.fond : c.texte, backgroundColor: !filtres.collection ? c.texte : "transparent" }}>Tout</Link>
            {collections.map((col) => (
              <Link key={col.slug} href={`/${slug}/produits?collection=${col.slug}`} className="px-3.5 py-2 border" style={{ borderColor: c.bordure, color: filtres.collection === col.slug ? c.fond : c.texte, backgroundColor: filtres.collection === col.slug ? c.texte : "transparent" }}>
                {col.nom}
              </Link>
            ))}
          </div>
        )}

        {produits.length > 0 ? (
          <NoirAtelierProductGrid produits={produits} slug={slug} devise={devise} commissionRate={commissionRate} colors={c} />
        ) : (
          <p className="py-20 text-center" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>Aucun produit ne correspond à votre recherche.</p>
        )}
      </section>

      <NoirAtelierFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
