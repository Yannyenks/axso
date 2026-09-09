"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatMontant } from "@/lib/utils";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import type { ThemeConfig } from "@/lib/theme-config";

interface Props {
  tenant: any;
  cfg: ThemeConfig;
  slug: string;
  produit: any;
  prixAffiche: number;
  prixCompareAffiche: number | null;
  produitsSimilaires: { id: string; nom: string; images: string[]; prixAffiche: number }[];
}

export function PulseProductPage({ tenant, cfg, slug, produit, prixAffiche, prixCompareAffiche, produitsSimilaires }: Props) {
  const c = cfg.colors;
  const devise = tenant.devise || "XAF";
  const images: string[] = produit.images?.length ? produit.images : [];
  const [actif, setActif] = useState(0);

  const dimensions = useMemo(() => {
    const groupes: Record<string, any[]> = {};
    for (const v of produit.variantes || []) {
      const dim = v.dimension || "Option";
      (groupes[dim] ||= []).push(v);
    }
    return groupes;
  }, [produit.variantes]);
  const [selection, setSelection] = useState<Record<string, string>>({});

  const noteMoyenne = produit.avis?.length ? produit.avis.reduce((s: number, a: any) => s + a.note, 0) / produit.avis.length : 0;

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh" }}>
      <header className="sticky top-0 z-40 flex items-center justify-between backdrop-blur-md" style={{ padding: "18px 4vw", backgroundColor: `${c.fond}e6`, borderBottom: `1px solid ${c.bordure}` }}>
        <Link href={`/${slug}`} className="text-lg font-bold">{tenant.nomBoutique}</Link>
        <Link href={`/${slug}/produits`} className="text-sm font-semibold">← Tous les produits</Link>
      </header>

      <section className="grid lg:grid-cols-[90px_1fr_1fr] gap-6" style={{ padding: "50px 4vw" }}>
        <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible order-2 lg:order-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActif(i)} className="flex-shrink-0 overflow-hidden" style={{ width: 90, height: 74, border: `2px solid ${i === actif ? c.accent : "transparent"}` }}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="relative overflow-hidden order-1 lg:order-2" style={{ aspectRatio: "1/1", backgroundColor: c.surface }}>
          {images[actif] ? (
            <img src={images[actif]} alt={produit.nom} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(160deg, ${c.accent}, ${c.accentSecondaire || c.accent})` }} />
          )}
        </div>

        <div className="order-3 flex flex-col justify-center">
          {produit.categorie && <div className="mb-3 text-[12.5px] font-bold" style={{ color: c.texteMuted }}>{produit.categorie.toUpperCase()} — ÉDITION</div>}
          <h1 className="text-[32px] font-bold uppercase mb-4">{produit.nom}</h1>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-[22px] font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{formatMontant(prixAffiche, devise)}</span>
            {prixCompareAffiche && prixCompareAffiche > prixAffiche && (
              <span className="line-through font-semibold" style={{ color: c.texteMuted }}>{formatMontant(prixCompareAffiche, devise)}</span>
            )}
          </div>
          {noteMoyenne > 0 && (
            <div className="flex items-center gap-2 mb-6 text-sm font-semibold">
              <span>{"★".repeat(Math.round(noteMoyenne))}{"☆".repeat(5 - Math.round(noteMoyenne))}</span>
              <span style={{ color: c.texteMuted }}>({produit.avis.length} avis)</span>
            </div>
          )}
          {produit.description && (
            <p className="mb-7 leading-relaxed font-medium" style={{ color: c.texteMuted, maxWidth: "42ch" }}>{produit.description}</p>
          )}

          {Object.entries(dimensions).map(([dim, variantes]) => (
            <div key={dim} className="mb-6">
              <p className="mb-2.5 text-[12.5px] font-bold" style={{ color: c.texteMuted }}>{dim.toUpperCase()}</p>
              <div className="grid grid-cols-6 gap-2 max-w-[340px]">
                {variantes.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelection((s) => ({ ...s, [dim]: v.id }))}
                    disabled={v.stock === 0}
                    className="py-2.5 text-[13px] font-bold disabled:opacity-30 transition-all"
                    style={{ border: `1.5px solid ${c.bordure}`, backgroundColor: selection[dim] === v.id ? c.texte : "transparent", color: selection[dim] === v.id ? c.fond : c.texte }}
                  >
                    {v.valeur}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <AddToCartButton
            produit={{ id: produit.id, nom: produit.nom, prix: prixAffiche, images: produit.images, stock: produit.stock, type: produit.type, fichierUrl: produit.fichierUrl, fichierNom: produit.fichierNom }}
            theme={{ fond: c.fond, accent: c.accent, texte: c.texte, surface: c.surface }}
            tenantSlug={slug}
            whatsappNumero={tenant.whatsapp}
          />
        </div>
      </section>

      {(produit.avis?.length ?? 0) > 0 && (
        <section style={{ padding: "20px 4vw 70px", borderTop: `1px solid ${c.bordure}` }}>
          <h2 className="text-[26px] font-bold uppercase mb-8 mt-10">Avis clients</h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl">
            {produit.avis.slice(0, 6).map((a: any) => (
              <div key={a.id}>
                <div className="flex gap-0.5 mb-2">{[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ color: i <= a.note ? c.accent : c.bordure }}>★</span>)}</div>
                {a.titre && <p className="font-bold mb-1.5">{a.titre}</p>}
                {a.commentaire && <p className="text-[13px] font-medium mb-2" style={{ color: c.texteMuted }}>{a.commentaire}</p>}
                <p className="text-[12px] font-semibold" style={{ color: c.texteMuted }}>{a.client?.nom || "Client"}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {produitsSimilaires.length > 0 && (
        <section style={{ padding: "20px 4vw 80px", borderTop: `1px solid ${c.bordure}` }}>
          <h2 className="text-[26px] font-bold uppercase mb-8 mt-10">Vous aimerez aussi</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-[2px]" style={{ backgroundColor: c.bordure }}>
            {produitsSimilaires.map((p) => (
              <Link key={p.id} href={`/${slug}/produits/${p.id}`} style={{ backgroundColor: c.fond }}>
                <div className="relative overflow-hidden" style={{ aspectRatio: "1/1" }}>
                  {p.images[0] ? <img src={p.images[0]} alt={p.nom} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ backgroundColor: c.surface }} />}
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold truncate">{p.nom}</p>
                  <p className="text-[12px] font-semibold" style={{ color: c.texteMuted }}>{formatMontant(p.prixAffiche, devise)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
