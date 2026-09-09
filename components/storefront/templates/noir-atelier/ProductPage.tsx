"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatMontant } from "@/lib/utils";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { GrainFilterDefs, GrainLayer } from "./GrainFilterDefs";
import type { ThemeConfig } from "@/lib/theme-config";

interface Props {
  tenant: any;
  cfg: ThemeConfig;
  slug: string;
  produit: any; // inclut variantes, avis (client.nom), collections
  prixAffiche: number;
  prixCompareAffiche: number | null;
  produitsSimilaires: { id: string; nom: string; images: string[]; prixAffiche: number }[];
}

export function NoirAtelierProductPage({ tenant, cfg, slug, produit, prixAffiche, prixCompareAffiche, produitsSimilaires }: Props) {
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
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh", fontFamily: "'Fraunces',serif" }}>
      <GrainFilterDefs />
      <header className="sticky top-0 z-40 flex items-center justify-between backdrop-blur-md" style={{ padding: "18px 4vw", backgroundColor: `${c.fond}eb`, borderBottom: `1px solid ${c.bordure}` }}>
        <Link href={`/${slug}`} className="text-lg" style={{ fontFamily: "'Fraunces',serif" }}>{tenant.nomBoutique}</Link>
        <Link href={`/${slug}/produits`} style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 13 }}>← Tous les produits</Link>
      </header>

      <section className="grid lg:grid-cols-2 gap-10" style={{ padding: "50px 4vw" }}>
        <div>
          <div className="relative overflow-hidden mb-2" style={{ aspectRatio: "3/4", backgroundColor: c.surface }}>
            {images[actif] ? (
              <img src={images[actif]} alt={produit.nom} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: `radial-gradient(120% 90% at 30% 20%, ${c.accent}44 0%, #22201d 100%)` }} />
            )}
            <GrainLayer />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActif(i)} className="w-16 h-20 overflow-hidden flex-shrink-0" style={{ border: `1px solid ${i === actif ? c.texte : c.bordure}` }}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {produit.categorie && <div className="mb-3" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 12.5, letterSpacing: "0.07em", color: c.texteMuted }}>{produit.categorie.toUpperCase()}</div>}
          <h1 className="mb-4" style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 400 }}>{produit.nom}</h1>
          <div className="flex items-baseline gap-3 mb-6">
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: c.accent }}>{formatMontant(prixAffiche, devise)}</span>
            {prixCompareAffiche && prixCompareAffiche > prixAffiche && (
              <span className="line-through" style={{ color: c.texteMuted, fontFamily: "'Archivo Narrow',sans-serif" }}>{formatMontant(prixCompareAffiche, devise)}</span>
            )}
          </div>
          {noteMoyenne > 0 && (
            <div className="flex items-center gap-2 mb-6" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 13 }}>
              <span>{"★".repeat(Math.round(noteMoyenne))}{"☆".repeat(5 - Math.round(noteMoyenne))}</span>
              <span style={{ color: c.texteMuted }}>({produit.avis.length} avis)</span>
            </div>
          )}
          {produit.description && (
            <p className="mb-7 leading-relaxed" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 14.5, color: c.texteMuted, maxWidth: "48ch" }}>
              {produit.description}
            </p>
          )}

          {Object.entries(dimensions).map(([dim, variantes]) => (
            <div key={dim} className="mb-6">
              <p className="mb-2.5" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 12.5, letterSpacing: "0.05em", color: c.texteMuted }}>{dim.toUpperCase()}</p>
              <div className="flex flex-wrap gap-2">
                {variantes.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelection((s) => ({ ...s, [dim]: v.id }))}
                    disabled={v.stock === 0}
                    className="px-4 py-2 text-sm disabled:opacity-30"
                    style={{ border: `1px solid ${selection[dim] === v.id ? c.texte : c.bordure}`, fontFamily: "'Archivo Narrow',sans-serif" }}
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
          <h2 className="text-[26px] mb-8 mt-10" style={{ fontFamily: "'Fraunces',serif", fontWeight: 400 }}>Avis clients</h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl">
            {produit.avis.slice(0, 6).map((a: any) => (
              <div key={a.id}>
                <div className="flex gap-0.5 mb-2">{[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ color: i <= a.note ? c.accent : c.bordure }}>★</span>)}</div>
                {a.titre && <p className="mb-1.5" style={{ fontFamily: "'Fraunces',serif" }}>{a.titre}</p>}
                {a.commentaire && <p className="text-[13px] mb-2" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>{a.commentaire}</p>}
                <p className="text-[12px]" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>{a.client?.nom || "Client"}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {produitsSimilaires.length > 0 && (
        <section style={{ padding: "20px 4vw 80px", borderTop: `1px solid ${c.bordure}` }}>
          <h2 className="text-[26px] mb-8 mt-10" style={{ fontFamily: "'Fraunces',serif", fontWeight: 400 }}>Vous aimerez aussi</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-[2px]" style={{ backgroundColor: c.bordure }}>
            {produitsSimilaires.map((p) => (
              <Link key={p.id} href={`/${slug}/produits/${p.id}`} style={{ backgroundColor: c.fond }}>
                <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                  {p.images[0] ? <img src={p.images[0]} alt={p.nom} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ backgroundColor: c.surface }} />}
                </div>
                <div className="p-3">
                  <p className="text-sm truncate" style={{ fontFamily: "'Fraunces',serif" }}>{p.nom}</p>
                  <p className="text-[12px]" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>{formatMontant(p.prixAffiche, devise)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
