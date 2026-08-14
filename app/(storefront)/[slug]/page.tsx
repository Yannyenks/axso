export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatMontant } from "@/lib/utils";
import { resolveThemeConfigAsync } from "@/lib/theme-config-server";
import Link from "next/link";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { StorefrontNavbar } from "@/components/storefront/StorefrontNavbar";
import { SectionCountdown } from "@/components/storefront/SectionCountdown";
import { SectionTabs } from "@/components/storefront/SectionTabs";
import { SousBlocsRenderer } from "@/components/storefront/SousBlocsRenderer";
import { Package, Lock, RotateCcw, MessageCircle, Star } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return { title: "Boutique introuvable" };
  return {
    title: tenant.metaTitle || tenant.nomBoutique,
    description: tenant.metaDescription || tenant.description || "",
    openGraph: { images: tenant.bannerUrl ? [{ url: tenant.bannerUrl }] : [] },
  };
}

export default async function StorefrontPage({ params }: Props) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      collections: { where: { actif: true }, take: 6, orderBy: { createdAt: "desc" } },
      avis: {
        where: { approuve: true },
        include: { client: { select: { nom: true } }, produit: { select: { nom: true } } },
        take: 6,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!tenant || tenant.statut !== "active") notFound();

  const cfg = await resolveThemeConfigAsync(tenant.themeId, tenant.id, tenant.themeConfig as Record<string, any>);
  const { colors: c, sections: sec, radius, fonts } = cfg;

  const vedettesOrderBy =
    sec.vedettes.triPar === "ventes" ? { ventes: "desc" as const } :
    sec.vedettes.triPar === "featured" ? { featured: "desc" as const } :
    { createdAt: "desc" as const };

  const vedettes = await prisma.produit.findMany({
    where: { tenantId: tenant.id, actif: true },
    orderBy: vedettesOrderBy,
    take: sec.vedettes.nombre || 8,
  });

  // Determine if theme background is dark by checking luminance of fond color
  const fondHex = cfg.colors.fond.replace("#", "");
  const r = parseInt(fondHex.slice(0, 2), 16);
  const g = parseInt(fondHex.slice(2, 4), 16);
  const b = parseInt(fondHex.slice(4, 6), 16);
  const isDark = (r * 299 + g * 587 + b * 114) / 1000 < 128;
  const socialLinks = tenant.socialLinks as Record<string, string> || {};

  const heroGradients: Record<string, string> = {
    "noir-obsidien": `radial-gradient(ellipse at 40% 50%, #1a1200 0%, #0a0a0a 70%)`,
    "violet-cosmos": `radial-gradient(ellipse at 40% 50%, #2d1058 0%, #1a0a2e 70%)`,
    "terre-et-or": `linear-gradient(135deg, #fef3e8 0%, #fde8d0 60%, #fef3e8 100%)`,
  };
  const heroGradient = heroGradients[tenant.themeId] || heroGradients["terre-et-or"];

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />

      {/* ─── BARRE D'ANNONCE ─── */}
      {sec.annonce.actif && (
        <div
          className="py-2.5 text-center text-xs font-semibold tracking-wide overflow-hidden"
          style={{ backgroundColor: sec.annonce.couleurFond, color: sec.annonce.couleurTexte }}
        >
          <div className="max-w-7xl mx-auto px-4 truncate">{sec.annonce.texte}</div>
        </div>
      )}
      <SousBlocsRenderer blocs={cfg.sectionSousBlocs?.annonce} accent={c.accent} texte={c.texte} />

      {/* ─── NAVBAR ─── */}
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

      {/* ─── HERO ─── */}
      {sec.hero.actif && (() => {
        const h = sec.hero;
        const ctaHref = `/${slug}/${h.ctaLien || "produits"}`;

        if (h.style === "fullscreen") {
          return (
            <section
              className="relative flex items-center justify-center"
              style={{ minHeight: "100vh" }}
            >
              {tenant.bannerUrl && (
                <img src={tenant.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: tenant.bannerUrl
                    ? `linear-gradient(to bottom, rgba(0,0,0,${h.overlay / 100}) 0%, rgba(0,0,0,${(h.overlay + 20) / 100}) 100%)`
                    : heroGradient,
                }}
              />
              <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                <h1 className="text-5xl sm:text-7xl font-bold font-playfair leading-tight mb-6 text-white">
                  {h.titre}
                </h1>
                <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">{h.sousTitre}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href={ctaHref} className="px-10 py-4 rounded-2xl font-semibold text-base transition-all hover:opacity-90 hover:scale-105 active:scale-95" style={{ backgroundColor: c.accent, color: c.fond, borderRadius: radius }}>
                    {h.ctaTexte}
                  </Link>
                  <Link href={`/${slug}/produits`} className="px-10 py-4 rounded-2xl font-semibold text-base transition-all border-2 text-white border-white/40 hover:bg-white/10" style={{ borderRadius: radius }}>
                    Voir tout
                  </Link>
                </div>
              </div>
            </section>
          );
        }

        if (h.style === "split") {
          return (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              <div className="grid lg:grid-cols-2 gap-6 items-stretch min-h-[520px]">
                <div
                  className="relative rounded-3xl overflow-hidden"
                  style={{ background: heroGradient, minHeight: "420px" }}
                >
                  {tenant.bannerUrl && (
                    <img src={tenant.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${h.overlay / 100})` }} />
                  <div className="absolute bottom-8 left-8 right-8">
                    <span className="text-sm font-semibold uppercase tracking-widest mb-3 block" style={{ color: c.accent }}>
                      {tenant.categorie}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col justify-center py-8 lg:py-0 lg:pl-8">
                  <span className="text-sm font-semibold uppercase tracking-widest mb-4 inline-block" style={{ color: c.accent }}>
                    Bienvenue
                  </span>
                  <h1 className="text-4xl sm:text-5xl font-bold font-playfair leading-tight mb-6" style={{ color: c.texte }}>
                    {h.titre}
                  </h1>
                  <p className="text-lg mb-8 leading-relaxed" style={{ color: c.texte, opacity: 0.7 }}>{h.sousTitre}</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={ctaHref} className="px-8 py-4 font-semibold text-sm transition-all hover:opacity-90 hover:scale-105 active:scale-95 text-center" style={{ backgroundColor: c.accent, color: c.fond, borderRadius: radius }}>
                      {h.ctaTexte}
                    </Link>
                    <Link href={`/${slug}/produits`} className="px-8 py-4 font-semibold text-sm transition-all border text-center" style={{ borderColor: `${c.accent}40`, color: c.texte, borderRadius: radius }}>
                      Voir tous les produits
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (h.style === "minimal") {
          return (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
              <div className="max-w-3xl">
                <span className="text-sm font-semibold uppercase tracking-widest mb-4 block" style={{ color: c.accent }}>
                  {tenant.categorie}
                </span>
                <h1 className="text-5xl sm:text-6xl font-bold font-playfair leading-tight mb-6">{h.titre}</h1>
                <p className="text-xl mb-8 leading-relaxed" style={{ opacity: 0.7 }}>{h.sousTitre}</p>
                <Link href={ctaHref} className="inline-flex items-center gap-2 px-8 py-4 font-semibold text-sm transition-all hover:opacity-90" style={{ backgroundColor: c.accent, color: c.fond, borderRadius: radius }}>
                  {h.ctaTexte} →
                </Link>
              </div>
            </section>
          );
        }

        // Default: centered
        return (
          <section
            className="relative flex items-center justify-center py-20 sm:py-32 px-4"
            style={{ background: heroGradient }}
          >
            {tenant.bannerUrl && (
              <img src={tenant.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {tenant.bannerUrl && (
              <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${h.overlay / 100})` }} />
            )}
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-widest mb-5 block" style={{ color: tenant.bannerUrl ? "#fff" : c.accent }}>
                {tenant.categorie} · {tenant.pays}
              </span>
              <h1
                className="text-4xl sm:text-6xl font-bold font-playfair leading-tight mb-6"
                style={{ color: tenant.bannerUrl ? "#fff" : c.texte }}
              >
                {h.titre}
              </h1>
              <p
                className="text-lg sm:text-xl mb-10 leading-relaxed max-w-2xl mx-auto"
                style={{ color: tenant.bannerUrl ? "rgba(255,255,255,0.8)" : c.texte, opacity: tenant.bannerUrl ? 1 : 0.7 }}
              >
                {h.sousTitre}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={ctaHref} className="px-10 py-4 font-semibold text-base transition-all hover:opacity-90 hover:scale-105 active:scale-95" style={{ backgroundColor: c.accent, color: c.fond, borderRadius: radius }}>
                  {h.ctaTexte}
                </Link>
                <Link href={`/${slug}/produits`} className="px-10 py-4 font-semibold text-base transition-all border-2" style={{ borderColor: `${c.accent}50`, color: tenant.bannerUrl ? "#fff" : c.texte, borderRadius: radius }}>
                  Tous les produits
                </Link>
              </div>
            </div>
          </section>
        );
      })()}
      {sec.hero.actif && <SousBlocsRenderer blocs={cfg.sectionSousBlocs?.hero} accent={c.accent} texte={c.texte} />}

      {/* ─── BADGES DE CONFIANCE ─── */}
      <section className="border-y py-6" style={{ borderColor: `${c.accent}15`, backgroundColor: c.surface }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: <Package size={24} style={{ color: c.accent }} />, titre: "Livraison rapide", texte: "Expédiée sous 24h-48h" },
              { icon: <Lock size={24} style={{ color: c.accent }} />, titre: "Paiement sécurisé", texte: "Transactions protégées" },
              { icon: <RotateCcw size={24} style={{ color: c.accent }} />, titre: "Retours faciles", texte: "Sous 14 jours" },
              { icon: <MessageCircle size={24} style={{ color: c.accent }} />, titre: "Support dédié", texte: "Réponse rapide garantie" },
            ].map((b) => (
              <div key={b.titre} className="flex flex-col items-center gap-2">
                {b.icon}
                <p className="font-semibold text-sm">{b.titre}</p>
                <p className="text-xs" style={{ opacity: 0.5 }}>{b.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUITS VEDETTES ─── */}
      {sec.vedettes.actif && vedettes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: c.accent }}>Sélection</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-playfair">{sec.vedettes.titre}</h2>
            </div>
            <Link href={`/${slug}/produits`} className="text-sm font-semibold hover:opacity-70 transition-opacity" style={{ color: c.accent }}>
              Voir tout →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {vedettes.map((p) => {
              const remise = p.prixCompare && p.prixCompare > p.prix
                ? Math.round(((p.prixCompare - p.prix) / p.prixCompare) * 100)
                : 0;
              return (
                <Link key={p.id} href={`/${slug}/produits/${p.id}`} className="group">
                  <div
                    className="rounded-2xl overflow-hidden border transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1"
                    style={{ backgroundColor: c.surface, borderColor: `${c.accent}15`, borderRadius: radius }}
                  >
                    <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: c.fond }}>
                      {p.images[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.nom}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package size={48} className="opacity-20" /></div>
                      )}
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {p.featured && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: c.accent, color: c.fond }}>
                            VEDETTE
                          </span>
                        )}
                        {remise > 0 && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500 text-white">
                            -{remise}%
                          </span>
                        )}
                        {p.stock === 0 && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-500/80 text-white">
                            Épuisé
                          </span>
                        )}
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: `linear-gradient(to top, ${c.fond}cc 0%, transparent 60%)` }}>
                        <span className="w-full text-center text-xs font-bold py-2 rounded-xl" style={{ backgroundColor: c.accent, color: c.fond }}>
                          Voir le produit
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-sm mb-2 line-clamp-2 leading-snug">{p.nom}</h3>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: c.accent }}>
                          {formatMontant(p.prix, tenant.devise)}
                        </span>
                        {remise > 0 && (
                          <span className="text-xs opacity-40 line-through">
                            {formatMontant(p.prixCompare!, tenant.devise)}
                          </span>
                        )}
                      </div>
                      {p.ventes > 0 && (
                        <p className="text-[10px] mt-1" style={{ opacity: 0.4 }}>{p.ventes} ventes</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      {sec.vedettes.actif && vedettes.length > 0 && <SousBlocsRenderer blocs={cfg.sectionSousBlocs?.vedettes} accent={c.accent} texte={c.texte} />}

      {/* ─── COLLECTIONS ─── */}
      {sec.collections.actif && tenant.collections.length > 0 && (
        <section className="py-16 sm:py-20" style={{ backgroundColor: c.surface }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: c.accent }}>Univers</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-playfair">{sec.collections.titre}</h2>
            </div>
            <div className={`grid gap-4 ${tenant.collections.length === 1 ? "grid-cols-1 max-w-2xl mx-auto" : tenant.collections.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
              {tenant.collections.slice(0, 6).map((col, i) => (
                <Link key={col.slug} href={`/${slug}/collections/${col.slug}`} className="group">
                  <div
                    className="relative overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1"
                    style={{
                      borderRadius: radius,
                      minHeight: i === 0 && tenant.collections.length >= 3 ? "320px" : "220px",
                      background: heroGradient,
                    }}
                  >
                    {col.imageUrl && (
                      <img src={col.imageUrl} alt={col.nom} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                    <div
                      className="absolute inset-0 flex flex-col justify-end p-6"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }}
                    >
                      <h3 className="text-white font-bold text-xl font-playfair mb-1">{col.nom}</h3>
                      {col.description && <p className="text-white/70 text-sm line-clamp-2 mb-3">{col.description}</p>}
                      <span className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: c.accent }}>
                        Explorer →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      {sec.collections.actif && tenant.collections.length > 0 && <SousBlocsRenderer blocs={cfg.sectionSousBlocs?.collections} accent={c.accent} texte={c.texte} />}

      {/* ─── BANNIÈRE PROMO ─── */}
      {sec.promo.actif && (
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="relative overflow-hidden py-14 px-8 sm:px-16 text-center"
              style={{
                background: `linear-gradient(135deg, ${c.accent}20 0%, ${c.accent}10 50%, ${c.accent}05 100%)`,
                border: `1px solid ${c.accent}25`,
                borderRadius: radius,
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${c.accent}08 0%, transparent 70%)` }} />
              <h2 className="relative text-3xl sm:text-4xl font-bold font-playfair mb-4" style={{ color: c.accent }}>
                {sec.promo.titre}
              </h2>
              <p className="relative text-lg mb-8 max-w-xl mx-auto" style={{ opacity: 0.7 }}>{sec.promo.texte}</p>
              <Link
                href={`/${slug}/produits`}
                className="inline-flex items-center gap-2 px-8 py-4 font-semibold text-sm transition-all hover:opacity-90 hover:scale-105 active:scale-95"
                style={{ backgroundColor: c.accent, color: c.fond, borderRadius: radius }}
              >
                {sec.promo.ctaTexte} →
              </Link>
            </div>
          </div>
        </section>
      )}
      {sec.promo.actif && <SousBlocsRenderer blocs={cfg.sectionSousBlocs?.promo} accent={c.accent} texte={c.texte} />}

      {/* ─── AVIS CLIENTS ─── */}
      {sec.avis.actif && tenant.avis.length > 0 && (
        <section className="py-16 sm:py-20" style={{ backgroundColor: c.surface }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: c.accent }}>Témoignages</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-playfair">{sec.avis.titre}</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tenant.avis.slice(0, 6).map((avis) => (
                <div
                  key={avis.id}
                  className="p-6 border transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: c.fond, border: `1px solid ${c.accent}15`, borderRadius: radius }}
                >
                  <div className="flex items-center gap-1 mb-3">
                    {[1,2,3,4,5].map((i) => (
                      <span key={i} className="text-base" style={{ color: i <= avis.note ? c.accent : `${c.texte}20` }}>★</span>
                    ))}
                    {avis.verifie && (
                      <span className="ml-2 text-[10px] font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Vérifié</span>
                    )}
                  </div>
                  {avis.titre && <p className="font-semibold text-sm mb-2">{avis.titre}</p>}
                  {avis.commentaire && <p className="text-sm leading-relaxed mb-4" style={{ opacity: 0.65 }}>{avis.commentaire}</p>}
                  <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: `${c.accent}10` }}>
                    <div>
                      <p className="text-xs font-semibold">{avis.client?.nom || "Client"}</p>
                      <p className="text-[10px] opacity-40 mt-0.5">à propos de {(avis as any).produit?.nom}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {sec.avis.actif && tenant.avis.length > 0 && <SousBlocsRenderer blocs={cfg.sectionSousBlocs?.avis} accent={c.accent} texte={c.texte} />}

      {/* ─── NEWSLETTER ─── */}
      {sec.newsletter.actif && (
        <section className="py-16 sm:py-20" style={{ background: `linear-gradient(135deg, ${c.accent}15 0%, ${c.accent}05 100%)` }}>
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold font-playfair mb-3">{sec.newsletter.titre}</h2>
            <p className="mb-8 text-lg" style={{ opacity: 0.65 }}>{sec.newsletter.texte}</p>
            <form className="flex flex-col sm:flex-row gap-3 justify-center" method="post" action="/api/newsletter">
              <input
                type="email"
                placeholder={sec.newsletter.placeholder}
                className="flex-1 px-5 py-3.5 text-sm border focus:outline-none max-w-sm"
                style={{ backgroundColor: c.fond, borderColor: `${c.accent}30`, color: c.texte, borderRadius: radius }}
              />
              <button
                type="submit"
                className="px-7 py-3.5 text-sm font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: c.accent, color: c.fond, borderRadius: radius }}
              >
                {sec.newsletter.ctaTexte}
              </button>
            </form>
          </div>
        </section>
      )}
      {sec.newsletter.actif && <SousBlocsRenderer blocs={cfg.sectionSousBlocs?.newsletter} accent={c.accent} texte={c.texte} />}

      {/* ─── SECTIONS CUSTOM (générées par l'IA ou builder) ─── */}
      {(cfg.customSections ?? []).filter((s: any) => s.actif !== false).sort((a: any, b: any) => (a.ordre ?? 99) - (b.ordre ?? 99)).map((section: any) => {
        if (section.type === "features") {
          return (
            <section key={section.id} className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {section.config?.titre && (
                <h2 className="text-3xl font-bold font-playfair text-center mb-12" style={{ color: c.texte }}>{section.config.titre}</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {(section.config?.items ?? []).map((item: any, i: number) => (
                  <div key={i} className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl" style={{ background: `${c.accent}08`, border: `1px solid ${c.accent}15` }}>
                    <span className="text-3xl">{item.icone}</span>
                    <p className="font-bold text-sm">{item.titre}</p>
                    <p className="text-sm" style={{ opacity: 0.6 }}>{item.description}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }
        if (section.type === "gallery") {
          const images: string[] = section.config?.images ?? [];
          if (!images.length) return null;
          return (
            <section key={section.id} className="py-16 sm:py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {section.config?.titre && (
                  <h2 className="text-3xl font-bold font-playfair text-center mb-10" style={{ color: c.texte }}>{section.config.titre}</h2>
                )}
                <div className={`grid gap-4 ${images.length >= 3 ? "grid-cols-2 sm:grid-cols-3" : images.length === 2 ? "grid-cols-2" : "grid-cols-1 max-w-lg mx-auto"}`}>
                  {images.map((src: string, i: number) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.accent}15` }}>
                      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }
        if (section.type === "stats") {
          return (
            <section key={section.id} className="py-14 sm:py-20" style={{ background: `${c.accent}08` }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
                  {(section.config?.items ?? []).map((stat: any, i: number) => (
                    <div key={i}>
                      <p className="text-4xl font-bold font-playfair" style={{ color: c.accent }}>{stat.valeur}</p>
                      <p className="text-sm mt-1" style={{ opacity: 0.6 }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }
        if (section.type === "cta-band") {
          return (
            <section key={section.id} className="py-16" style={{ background: c.accent }}>
              <div className="max-w-4xl mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold font-playfair mb-4" style={{ color: c.fond }}>{section.config?.titre}</h2>
                {section.config?.texte && <p className="text-lg mb-8" style={{ color: c.fond, opacity: 0.85 }}>{section.config.texte}</p>}
                {section.config?.ctaTexte && (
                  <Link href={section.config.ctaLien ?? `/${slug}/produits`}
                    className="inline-flex px-8 py-4 rounded-2xl font-bold text-sm"
                    style={{ background: c.fond, color: c.accent }}>
                    {section.config.ctaTexte}
                  </Link>
                )}
              </div>
            </section>
          );
        }
        if (section.type === "richtext") {
          return (
            <section key={section.id} className="py-16 max-w-3xl mx-auto px-4">
              {section.config?.titre && <h2 className="text-2xl font-bold font-playfair mb-6" style={{ color: c.texte }}>{section.config.titre}</h2>}
              {section.config?.texte && <div className="prose prose-sm max-w-none" style={{ color: c.texte, opacity: 0.75 }}>{section.config.texte}</div>}
            </section>
          );
        }
        if (section.type === "countdown") {
          return (
            <SectionCountdown key={section.id} slug={slug} accent={c.accent} texte={c.texte}
              titre={section.config?.titre} texteDesc={section.config?.texte}
              dateFin={section.config?.dateFin} ctaTexte={section.config?.ctaTexte} />
          );
        }
        if (section.type === "brands") {
          const logos: string[] = (section.config?.logos ?? []).filter(Boolean);
          if (!logos.length) return null;
          return (
            <section key={section.id} className="py-14">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {section.config?.titre && (
                  <p className="text-center text-sm font-bold uppercase tracking-widest mb-8" style={{ color: c.texte, opacity: 0.4 }}>{section.config.titre}</p>
                )}
                <div className={`flex flex-wrap items-center justify-center gap-10 ${section.config?.style === "carousel" ? "animate-pulse" : ""}`}>
                  {logos.map((src, i) => (
                    <img key={i} src={src} alt="" className="h-10 object-contain opacity-60 hover:opacity-100 transition-opacity" loading="lazy" />
                  ))}
                </div>
              </div>
            </section>
          );
        }
        if (section.type === "video") {
          if (!section.config?.videoUrl) return null;
          const isEmbed = /youtube|vimeo/.test(section.config.videoUrl);
          return (
            <section key={section.id} className="py-16 sm:py-20">
              <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${section.config.style === "fullwidth" ? "max-w-full" : "max-w-4xl"}`}>
                {section.config?.titre && (
                  <h2 className="text-3xl font-bold font-playfair text-center mb-10" style={{ color: c.texte }}>{section.config.titre}</h2>
                )}
                <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9", border: `1px solid ${c.accent}15` }}>
                  {isEmbed ? (
                    <iframe className="w-full h-full" src={section.config.videoUrl} allow="autoplay; fullscreen" allowFullScreen style={{ border: "none" }} />
                  ) : (
                    <video className="w-full h-full object-cover" src={section.config.videoUrl} controls autoPlay={!!section.config.autoplay} muted={!!section.config.autoplay} loop playsInline />
                  )}
                </div>
              </div>
            </section>
          );
        }
        if (section.type === "social-proof") {
          const certs: string[] = section.config?.certifications ?? [];
          return (
            <section key={section.id} className="py-10" style={{ background: `${c.accent}06` }}>
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-8 text-center">
                {section.config?.note && (
                  <div className="flex items-center gap-1.5">
                    <Star size={16} fill={c.accent} style={{ color: c.accent }} />
                    <span className="font-bold text-sm" style={{ color: c.texte }}>{section.config.note}</span>
                  </div>
                )}
                {section.config?.nbClients && <span className="text-sm" style={{ color: c.texte, opacity: 0.6 }}>{section.config.nbClients} clients</span>}
                {section.config?.nbCommandes && <span className="text-sm" style={{ color: c.texte, opacity: 0.6 }}>{section.config.nbCommandes} commandes</span>}
                {certs.map((cert, i) => <span key={i} className="text-sm" style={{ color: c.texte, opacity: 0.6 }}>{cert}</span>)}
              </div>
            </section>
          );
        }
        if (section.type === "spacer") {
          return <div key={section.id} style={{ height: section.config?.hauteur || "80px" }} />;
        }
        if (section.type === "tabs") {
          return <SectionTabs key={section.id} titre={section.config?.titre} onglets={section.config?.onglets ?? []} accent={c.accent} texte={c.texte} />;
        }
        if (section.type === "columns") {
          const colonnes: any[] = section.config?.colonnes ?? [];
          if (!colonnes.length) return null;
          const nb = section.config?.nombreColonnes || colonnes.length;
          return (
            <section key={section.id} className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              {section.config?.titre && <h2 className="text-3xl font-bold font-playfair text-center mb-12" style={{ color: c.texte }}>{section.config.titre}</h2>}
              <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${Math.min(nb, colonnes.length)}, minmax(0, 1fr))` }}>
                {colonnes.map((col) => (
                  <div key={col.id} className="space-y-5">
                    {(col.blocs ?? []).map((bloc: any) => {
                      if (bloc.type === "photos") {
                        const images = (bloc.config?.images ?? []).filter(Boolean);
                        if (!images.length) return null;
                        return (
                          <div key={bloc.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.accent}15` }}>
                            <img src={images[0]} alt="" className="w-full object-cover" loading="lazy" />
                          </div>
                        );
                      }
                      if (bloc.type === "temoignage" && bloc.config?.texte) {
                        return (
                          <div key={bloc.id} className="rounded-xl p-5" style={{ background: `${c.accent}08` }}>
                            <p className="text-sm italic mb-2" style={{ color: c.texte, opacity: 0.75 }}>"{bloc.config.texte}"</p>
                            {bloc.config.nom && <p className="text-xs font-bold" style={{ color: c.texte }}>{bloc.config.nom}</p>}
                          </div>
                        );
                      }
                      if (bloc.type === "promo" && (bloc.config?.titre || bloc.config?.texte)) {
                        return (
                          <div key={bloc.id} className="rounded-xl p-5 text-center" style={{ background: c.accent }}>
                            {bloc.config.titre && <p className="font-bold text-sm mb-1" style={{ color: "white" }}>{bloc.config.titre}</p>}
                            {bloc.config.texte && <p className="text-xs" style={{ color: "white", opacity: 0.9 }}>{bloc.config.texte}</p>}
                          </div>
                        );
                      }
                      if (bloc.type === "texte" && (bloc.config?.titre || bloc.config?.texte)) {
                        return (
                          <div key={bloc.id}>
                            {bloc.config.titre && <p className="font-bold text-sm mb-1" style={{ color: c.texte }}>{bloc.config.titre}</p>}
                            {bloc.config.texte && <p className="text-sm" style={{ color: c.texte, opacity: 0.65 }}>{bloc.config.texte}</p>}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                ))}
              </div>
            </section>
          );
        }
        return null;
      })}

      {/* ─── FOOTER ─── */}
      <footer className="border-t mt-0" style={{ backgroundColor: c.fond, borderColor: `${c.accent}15` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              {tenant.logoUrl ? (
                <img src={tenant.logoUrl} alt={tenant.nomBoutique} className="h-10 mb-4 object-contain" />
              ) : (
                <p className="text-2xl font-bold font-playfair mb-4" style={{ color: c.accent }}>{tenant.nomBoutique}</p>
              )}
              {tenant.description && (
                <p className="text-sm leading-relaxed mb-5" style={{ opacity: 0.55, maxWidth: "320px" }}>{tenant.description}</p>
              )}
              {/* Réseaux sociaux */}
              <div className="flex gap-3">
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                    style={{ backgroundColor: `${c.accent}15`, color: c.accent }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                    style={{ backgroundColor: `${c.accent}15`, color: c.accent }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                    style={{ backgroundColor: `${c.accent}15`, color: c.accent }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.84a8.27 8.27 0 004.84 1.54V6.93a4.85 4.85 0 01-1.07-.24z"/></svg>
                  </a>
                )}
                {tenant.whatsapp && (
                  <a href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                    style={{ backgroundColor: `${c.accent}15`, color: c.accent }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div>
              <p className="font-semibold text-sm mb-4 uppercase tracking-wider" style={{ color: c.accent }}>Navigation</p>
              <div className="space-y-3">
                {[
                  { label: "Accueil", href: `/${slug}` },
                  { label: "Produits", href: `/${slug}/produits` },
                  { label: "Mon panier", href: `/${slug}/panier` },
                  { label: "Suivi commande", href: `/suivi` },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="block text-sm transition-opacity hover:opacity-100" style={{ opacity: 0.55 }}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="font-semibold text-sm mb-4 uppercase tracking-wider" style={{ color: c.accent }}>Contact</p>
              <div className="space-y-3">
                {tenant.email && (
                  <a href={`mailto:${tenant.email}`} className="block text-sm transition-opacity hover:opacity-100" style={{ opacity: 0.55 }}>
                    {tenant.email}
                  </a>
                )}
                {tenant.whatsapp && (
                  <a href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="block text-sm transition-opacity hover:opacity-100" style={{ opacity: 0.55 }}>
                    {tenant.whatsapp}
                  </a>
                )}
                {tenant.adresse && (
                  <p className="text-sm" style={{ opacity: 0.55 }}>{tenant.adresse}</p>
                )}
                {tenant.pays && (
                  <p className="text-sm" style={{ opacity: 0.55 }}>{tenant.pays}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t py-5" style={{ borderColor: `${c.accent}10` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ opacity: 0.4 }}>
            <p>© {new Date().getFullYear()} {tenant.nomBoutique}. Tous droits réservés.</p>
            <p>Propulsé par <span style={{ color: c.accent, opacity: 1 }}>Axso</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
