export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatMontant, pourcentageRemise } from "@/lib/utils";
import { resolveThemeConfigAsync } from "@/lib/theme-config-server";
import Link from "next/link";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { ViewContentTracker } from "@/components/storefront/ViewContentTracker";
import { StorefrontNavbar } from "@/components/storefront/StorefrontNavbar";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { Package, AlertTriangle, Smartphone, Lock, RotateCcw, Check } from "lucide-react";

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const produit = await prisma.produit.findUnique({ where: { id } });
  if (!produit) return { title: "Produit introuvable" };
  return {
    title: produit.metaTitle || produit.nom,
    description: produit.metaDesc || produit.description || "",
    openGraph: { images: produit.images[0] ? [{ url: produit.images[0] }] : [] },
  };
}

export default async function ProduitPage({ params }: Props) {
  const { slug, id } = await params;

  const [tenant, produit] = await Promise.all([
    prisma.tenant.findUnique({
      where: { slug },
      include: { collections: { where: { actif: true }, take: 5 } },
    }),
    prisma.produit.findUnique({
      where: { id },
      include: {
        variantes: true,
        avis: { where: { approuve: true }, include: { client: { select: { nom: true } } }, take: 8, orderBy: { createdAt: "desc" } },
        collections: { select: { nom: true, slug: true } },
      },
    }),
  ]);

  if (!tenant || tenant.statut !== "active") notFound();
  if (!produit || produit.tenantId !== tenant.id || !produit.actif) notFound();

  const cfg = await resolveThemeConfigAsync(tenant.themeId, tenant.id, tenant.themeConfig as Record<string, any>);
  const { colors: c, radius } = cfg;

  const remise = produit.prixCompare && produit.prixCompare > produit.prix
    ? pourcentageRemise(produit.prix, produit.prixCompare)
    : 0;
  const noteMoyenne = produit.avis.length > 0
    ? produit.avis.reduce((s, a) => s + a.note, 0) / produit.avis.length
    : 0;

  const produitsSimilaires = await prisma.produit.findMany({
    where: {
      tenantId: tenant.id,
      actif: true,
      id: { not: produit.id },
      OR: produit.categorie ? [{ categorie: produit.categorie }] : undefined,
    },
    take: 4,
    orderBy: { ventes: "desc" },
  });

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <ViewContentTracker produitId={produit.id} nom={produit.nom} prix={produit.prix} devise={tenant.devise} />
      <StorefrontNavbar
        slug={slug}
        nomBoutique={tenant.nomBoutique}
        logoUrl={tenant.logoUrl}
        accent={c.accent}
        fond={c.fond}
        texte={c.texte}
        radius={radius}
        collections={tenant.collections}
      />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-xs" style={{ opacity: 0.45 }}>
          <Link href={`/${slug}`} className="hover:opacity-100 transition-opacity">Accueil</Link>
          <span>›</span>
          <Link href={`/${slug}/produits`} className="hover:opacity-100 transition-opacity">Produits</Link>
          {produit.categorie && <>
            <span>›</span>
            <span>{produit.categorie}</span>
          </>}
          <span>›</span>
          <span style={{ opacity: 2, color: c.texte }}>{produit.nom}</span>
        </div>
      </div>

      {/* Main product */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">

          {/* Gallery */}
          <div className="space-y-3">
            <div
              className="aspect-square overflow-hidden"
              style={{ backgroundColor: c.surface, borderRadius: radius }}
            >
              {produit.images[0] ? (
                <img
                  src={produit.images[0]}
                  alt={produit.nom}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package size={64} className="opacity-20" /></div>
              )}
            </div>
            {produit.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {produit.images.slice(0, 5).map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square overflow-hidden border-2 transition-all"
                    style={{
                      backgroundColor: c.surface,
                      borderRadius: radius,
                      borderColor: i === 0 ? c.accent : "transparent",
                    }}
                  >
                    <img src={img} alt={`${produit.nom} ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-6 py-2">
            {/* Collections badges */}
            {produit.collections.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {produit.collections.map((col) => (
                  <Link key={col.slug} href={`/${slug}/collections/${col.slug}`}>
                    <span
                      className="text-xs px-3 py-1 border transition-all hover:opacity-100"
                      style={{ borderColor: `${c.accent}40`, color: c.accent, borderRadius: radius, opacity: 0.8 }}
                    >
                      {col.nom}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold font-playfair leading-tight">{produit.nom}</h1>

            {/* Rating */}
            {produit.avis.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((i) => (
                    <span key={i} className="text-lg" style={{ color: i <= Math.round(noteMoyenne) ? c.accent : `${c.texte}20` }}>★</span>
                  ))}
                </div>
                <span className="text-sm font-semibold">{noteMoyenne.toFixed(1)}</span>
                <span className="text-sm" style={{ opacity: 0.45 }}>({produit.avis.length} avis)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold" style={{ color: c.accent }}>
                {formatMontant(produit.prix, tenant.devise)}
              </span>
              {remise > 0 && (
                <>
                  <span className="text-xl" style={{ opacity: 0.35, textDecoration: "line-through" }}>
                    {formatMontant(produit.prixCompare!, tenant.devise)}
                  </span>
                  <span className="text-sm font-bold px-2 py-0.5 rounded-lg bg-red-500/15 text-red-400">
                    -{remise}%
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: produit.stock > 10 ? "#34d399" : produit.stock > 0 ? "#f59e0b" : "#ef4444" }}
              />
              <span className="text-sm flex items-center gap-1">
                {produit.stock > 10
                  ? `En stock — ${produit.stock} disponibles`
                  : produit.stock > 0
                    ? <><AlertTriangle size={14} /> Plus que {produit.stock} en stock</>
                    : "Rupture de stock"}
              </span>
            </div>

            {/* Description short */}
            {produit.description && (
              <p className="text-base leading-relaxed" style={{ opacity: 0.65, borderLeft: `3px solid ${c.accent}30`, paddingLeft: "16px" }}>
                {produit.description}
              </p>
            )}

            {/* Variants */}
            {produit.variantes.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-3">Options disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {produit.variantes.map((v) => (
                    <button
                      key={v.id}
                      className="px-4 py-2 text-sm border transition-all hover:opacity-100"
                      style={{ borderColor: `${c.accent}40`, color: c.texte, borderRadius: radius, opacity: v.stock === 0 ? 0.3 : 0.8 }}
                      disabled={v.stock === 0}
                    >
                      {v.nom}: {v.valeur}
                      {v.prix && v.prix !== produit.prix && (
                        <span className="ml-1 font-semibold" style={{ color: c.accent }}>
                          +{formatMontant(Math.abs(v.prix - produit.prix), tenant.devise)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to cart */}
            <AddToCartButton
              produit={{ id: produit.id, nom: produit.nom, prix: produit.prix, images: produit.images, stock: produit.stock, type: produit.type, fichierUrl: produit.fichierUrl, fichierNom: produit.fichierNom }}
              theme={c}
              tenantSlug={slug}
              whatsappNumero={tenant.whatsappNumero || tenant.whatsapp}
            />

            {/* WhatsApp contact */}
            {tenant.whatsapp && (
              <a
                href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}?text=Bonjour, je suis intéressé par : ${produit.nom}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-semibold border-2 transition-all hover:opacity-80"
                style={{ borderColor: `${c.accent}40`, color: c.texte, borderRadius: radius }}
              >
                <Smartphone size={16} /> Demander via WhatsApp
              </a>
            )}

            {/* Trust badges inline */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: <Lock size={18} style={{ color: c.accent }} />, text: "Paiement sécurisé" },
                { icon: <Package size={18} style={{ color: c.accent }} />, text: "Livraison rapide" },
                { icon: <RotateCcw size={18} style={{ color: c.accent }} />, text: "Retours 14j" },
              ].map((b) => (
                <div key={b.text} className="text-center py-3 rounded-xl" style={{ backgroundColor: c.surface }}>
                  <div className="flex justify-center mb-1">{b.icon}</div>
                  <p className="text-[10px] font-medium" style={{ opacity: 0.6 }}>{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description tabs */}
        <div className="mt-16">
          <div className="border-b" style={{ borderColor: `${c.accent}15` }}>
            <div className="flex gap-8">
              {["Description", "Livraison & retours"].map((tab, i) => (
                <button
                  key={tab}
                  className={`py-3 text-sm font-semibold border-b-2 transition-all ${i === 0 ? "border-current" : "border-transparent opacity-40 hover:opacity-70"}`}
                  style={{ color: i === 0 ? c.accent : c.texte }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="py-8 max-w-3xl">
            {produit.description ? (
              <p className="text-base leading-relaxed" style={{ opacity: 0.7 }}>{produit.description}</p>
            ) : (
              <p style={{ opacity: 0.4 }} className="text-sm">Aucune description disponible pour ce produit.</p>
            )}
            {produit.descriptionIA && (
              <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: c.surface }}>
                <p className="text-xs font-semibold mb-2" style={{ color: c.accent }}>Description enrichie</p>
                <p className="text-sm leading-relaxed" style={{ opacity: 0.7 }}>{produit.descriptionIA}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {produit.avis.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold font-playfair mb-2" style={{ color: c.accent }}>Avis clients</h2>
            <p className="text-sm mb-8" style={{ opacity: 0.5 }}>{produit.avis.length} avis · {noteMoyenne.toFixed(1)}/5</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {produit.avis.map((avis) => (
                <div
                  key={avis.id}
                  className="p-5 border"
                  style={{ backgroundColor: c.surface, border: `1px solid ${c.accent}12`, borderRadius: radius }}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    {[1,2,3,4,5].map((i) => (
                      <span key={i} style={{ color: i <= avis.note ? c.accent : `${c.texte}20`, fontSize: "14px" }}>★</span>
                    ))}
                    {avis.verifie && (
                      <span className="ml-1 text-[10px] text-green-500 font-semibold flex items-center gap-0.5"><Check size={10} /> Vérifié</span>
                    )}
                  </div>
                  {avis.titre && <p className="font-semibold text-sm mb-1.5">{avis.titre}</p>}
                  {avis.commentaire && <p className="text-sm leading-relaxed" style={{ opacity: 0.6 }}>{avis.commentaire}</p>}
                  <p className="text-xs mt-3 font-semibold" style={{ opacity: 0.45 }}>— {avis.client?.nom || "Client"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related products */}
        {produitsSimilaires.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold font-playfair mb-8" style={{ color: c.accent }}>Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
              {produitsSimilaires.map((p) => (
                <Link key={p.id} href={`/${slug}/produits/${p.id}`} className="group">
                  <div
                    className="rounded-2xl overflow-hidden border transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5"
                    style={{ backgroundColor: c.surface, borderColor: `${c.accent}12`, borderRadius: radius }}
                  >
                    <div className="aspect-square overflow-hidden" style={{ backgroundColor: c.fond }}>
                      {p.images[0] ? (
                        <img src={p.images[0]} alt={p.nom} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package size={32} className="opacity-20" /></div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-xs line-clamp-2 mb-1">{p.nom}</p>
                      <p className="font-bold text-sm" style={{ color: c.accent }}>{formatMontant(p.prix, tenant.devise)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-8 text-center text-xs" style={{ borderColor: `${c.accent}10`, opacity: 0.4 }}>
        <p>{tenant.nomBoutique} · Propulsé par <span style={{ color: c.accent, opacity: 1 }}>Axso</span></p>
      </footer>
    </div>
  );
}
