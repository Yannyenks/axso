export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatMontant } from "@/lib/utils";
import { prixClient } from "@/lib/pricing";
import { resolveThemeConfigAsync } from "@/lib/theme-config-server";
import Link from "next/link";
import { StorefrontNavbar } from "@/components/storefront/StorefrontNavbar";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { Package, ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ slug: string; collectionSlug: string }>;
}

export default async function CollectionPage({ params }: Props) {
  const { slug, collectionSlug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { collections: { where: { actif: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!tenant || tenant.statut !== "active") notFound();

  const collection = tenant.collections.find((c) => c.slug === collectionSlug);
  if (!collection) notFound();

  const cfg = await resolveThemeConfigAsync(tenant.themeId, tenant.id, tenant.themeConfig as Record<string, any>);
  const { colors: c, radius } = cfg;
  const taux = tenant.commissionRate ?? 0.06;

  const produits = await prisma.produit.findMany({
    where: { tenantId: tenant.id, actif: true, collections: { some: { id: collection.id } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <StorefrontNavbar
        slug={slug}
        nomBoutique={tenant.nomBoutique}
        logoUrl={tenant.logoUrl}
        accent={c.accent}
        fond={c.fond}
        texte={c.texte}
        radius={radius}
        collections={tenant.collections}
        certifie={tenant.certifie}
      />

      {/* Hero collection */}
      <div className="relative overflow-hidden" style={{ backgroundColor: c.surface }}>
        {collection.imageUrl && (
          <div className="absolute inset-0">
            <img src={collection.imageUrl} alt="" className="w-full h-full object-cover" style={{ opacity: 0.28 }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${c.fond}00 0%, ${c.fond}f0 90%)` }} />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <Link href={`/${slug}/produits`} className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 hover:opacity-80 transition-opacity" style={{ opacity: 0.6 }}>
            <ArrowLeft size={12} /> Tous les produits
          </Link>
          <span className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: c.accent }}>
            Collection
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold font-playfair mb-3">{collection.nom}</h1>
          {collection.description && (
            <p className="text-sm sm:text-base max-w-xl leading-relaxed" style={{ opacity: 0.65 }}>{collection.description}</p>
          )}
          <p className="text-xs mt-4" style={{ opacity: 0.4 }}>{produits.length} produit{produits.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {produits.length === 0 ? (
          <div className="text-center py-24">
            <Package size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-semibold mb-2">Cette collection est vide pour l'instant</p>
            <Link
              href={`/${slug}/produits`}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all hover:opacity-90 mt-2"
              style={{ backgroundColor: c.accent, color: c.fond, borderRadius: radius }}
            >
              Voir tous les produits
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {produits.map((p) => {
              const prixAffiche = prixClient(p.prix, taux);
              const prixCompareAffiche = p.prixCompare ? prixClient(p.prixCompare, taux) : null;
              const remise = prixCompareAffiche && prixCompareAffiche > prixAffiche
                ? Math.round(((prixCompareAffiche - prixAffiche) / prixCompareAffiche) * 100)
                : 0;
              return (
                <Link key={p.id} href={`/${slug}/produits/${p.id}`} className="group">
                  <div
                    className="rounded-2xl overflow-hidden border transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1"
                    style={{ backgroundColor: c.surface, borderColor: `${c.accent}12`, borderRadius: radius }}
                  >
                    <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: c.fond }}>
                      {p.images[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.nom}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package size={40} className="opacity-20" /></div>
                      )}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                        {p.featured && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ backgroundColor: c.accent, color: c.fond }}>
                            VEDETTE
                          </span>
                        )}
                        {remise > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-500 text-white">
                            -{remise}%
                          </span>
                        )}
                        {p.stock === 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 text-white">
                            Épuisé
                          </span>
                        )}
                      </div>
                      <div
                        className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
                        style={{ background: `linear-gradient(to top, ${c.fond}cc 0%, transparent 60%)` }}
                      >
                        <span className="w-full text-center text-xs font-bold py-2 rounded-xl" style={{ backgroundColor: c.accent, color: c.fond }}>
                          Voir le produit
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5">
                      <p className="font-medium text-sm leading-snug line-clamp-2 mb-2">{p.nom}</p>
                      {p.categorie && (
                        <p className="text-[10px] mb-2" style={{ opacity: 0.4 }}>{p.categorie}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: c.accent }}>
                          {formatMontant(prixAffiche, tenant.devise)}
                        </span>
                        {remise > 0 && (
                          <span className="text-xs line-through" style={{ opacity: 0.35 }}>
                            {formatMontant(prixCompareAffiche!, tenant.devise)}
                          </span>
                        )}
                      </div>
                      {p.ventes > 5 && (
                        <p className="text-[10px] mt-1" style={{ opacity: 0.35 }}>{p.ventes} ventes</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <footer className="border-t mt-16 py-8 text-center text-xs" style={{ borderColor: `${c.accent}10`, opacity: 0.4 }}>
        <p>{tenant.nomBoutique} · Propulsé par <span style={{ color: c.accent, opacity: 1 }}>Axso</span></p>
      </footer>
    </div>
  );
}
