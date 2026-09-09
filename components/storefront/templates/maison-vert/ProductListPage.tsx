import Link from "next/link";
import type { ThemeConfig } from "@/lib/theme-config";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { MaisonVertNav } from "./Nav";
import { MaisonVertFooter } from "./Footer";
import { MaisonVertProductGrid } from "./ProductGrid";

interface Props { tenant: any; cfg: ThemeConfig; produits: any[]; slug: string; filtres: { q?: string; min?: string; max?: string; tri?: string; collection?: string } }
const TRIS = [{ v: "", l: "Par défaut" }, { v: "prix-asc", l: "Prix croissant" }, { v: "prix-desc", l: "Prix décroissant" }, { v: "populaire", l: "Popularité" }];

export function MaisonVertProductListPage({ tenant, cfg, produits, slug, filtres }: Props) {
  const c = cfg.colors;
  const collections: any[] = tenant.collections || [];
  const devise = tenant.devise || "XAF";
  const commissionRate = tenant.commissionRate ?? 0.06;

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <MaisonVertNav tenant={tenant} cfg={cfg} slug={slug} />
      <section style={{ padding: "60px 4vw 40px" }}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mb-9">
          <h1 className="text-[32px]">Tous les produits</h1>
          <form method="GET" className="flex items-center gap-3 flex-wrap text-sm">
            <input name="q" defaultValue={filtres.q} placeholder="Rechercher…" className="px-4 py-2 border bg-transparent outline-none w-40" style={{ borderColor: c.bordure, borderRadius: "999px" }} />
            <select name="tri" defaultValue={filtres.tri || ""} className="px-4 py-2 border bg-transparent outline-none" style={{ borderColor: c.bordure, borderRadius: "999px" }}>{TRIS.map((t) => <option key={t.v} value={t.v} style={{ color: "#000" }}>{t.l}</option>)}</select>
            <button type="submit" className="px-5 py-2 font-semibold" style={{ backgroundColor: c.accent, color: c.fond, borderRadius: "999px" }}>Filtrer</button>
          </form>
        </div>
        {collections.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-9 text-[12.5px]">
            <Link href={`/${slug}/produits`} className="px-4 py-2 border" style={{ borderColor: c.bordure, borderRadius: "999px", color: !filtres.collection ? c.fond : c.texte, backgroundColor: !filtres.collection ? c.accent : "transparent" }}>Tout</Link>
            {collections.map((col) => <Link key={col.slug} href={`/${slug}/produits?collection=${col.slug}`} className="px-4 py-2 border" style={{ borderColor: c.bordure, borderRadius: "999px", color: filtres.collection === col.slug ? c.fond : c.texte, backgroundColor: filtres.collection === col.slug ? c.accent : "transparent" }}>{col.nom}</Link>)}
          </div>
        )}
        {produits.length > 0 ? <MaisonVertProductGrid produits={produits} slug={slug} devise={devise} commissionRate={commissionRate} colors={c} radius={cfg.radius} /> : <p className="py-20 text-center" style={{ color: c.texteMuted }}>Aucun produit ne correspond à votre recherche.</p>}
      </section>
      <MaisonVertFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
