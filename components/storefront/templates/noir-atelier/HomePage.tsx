import Link from "next/link";
import { prixClient } from "@/lib/pricing";
import { formatMontant } from "@/lib/utils";
import { ScrollReveal, type RevealType } from "@/components/storefront/ScrollReveal";
import { CustomSectionsRenderer } from "@/components/storefront/CustomSectionsRenderer";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import type { ThemeConfig } from "@/lib/theme-config";
import { NoirAtelierNav } from "./Nav";
import { NoirAtelierFooter } from "./Footer";
import { GrainFilterDefs, GrainLayer } from "./GrainFilterDefs";
import { NoirAtelierProductGrid } from "./ProductGrid";

interface Props {
  tenant: any;
  cfg: ThemeConfig;
  vedettes: any[];
  slug: string;
}

const DEFAULT_ORDER = ["annonce", "hero", "confiance", "vedettes", "collections", "about", "promo", "faq", "avis", "newsletter"];

export function NoirAtelierHomePage({ tenant, cfg, vedettes, slug }: Props) {
  const c = cfg.colors;
  const sec = cfg.sections;
  const devise = tenant.devise || "XAF";
  const commissionRate = tenant.commissionRate ?? 0.06;
  const anim = cfg.animations;
  const vitesse = anim?.vitesse ?? "normal";
  const revealType = (cle: string): RevealType => (anim?.sectionAnimations?.[cle] as RevealType) || (anim?.global as RevealType) || "fade-in";

  const ctaHref = `/${slug}/${sec.hero.ctaLien || "produits"}`;
  const heroTag = vedettes[0];
  const collections: any[] = tenant.collections || [];

  const NODES: Record<string, React.ReactNode> = {
    annonce: sec.annonce.actif ? (
      <div className="py-2.5 text-center text-xs font-semibold tracking-wide" style={{ backgroundColor: sec.annonce.couleurFond, color: sec.annonce.couleurTexte }}>
        {sec.annonce.texte}
      </div>
    ) : null,

    hero: sec.hero.actif ? (
      <section className="grid lg:grid-cols-[1.15fr_0.85fr] border-b" style={{ minHeight: "86vh", borderColor: c.bordure }}>
        <div className="flex flex-col justify-center border-r" style={{ padding: "6vw 5vw", borderColor: c.bordure }}>
          {sec.hero.badgeTexte && (
            <div className="mb-6" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 12.5, letterSpacing: "0.07em", color: c.texteMuted }}>
              {sec.hero.badgeTexte.toUpperCase()}
            </div>
          )}
          <h1 className="max-w-[11ch]" style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(40px,5.4vw,78px)", lineHeight: 1.02, fontWeight: 400, letterSpacing: "-0.01em", color: c.texte }}>
            {sec.hero.titre}
          </h1>
          <p className="mt-6 max-w-[38ch]" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 15, lineHeight: 1.6, color: c.texteMuted }}>
            {sec.hero.sousTitre}
          </p>
          <div className="flex flex-wrap gap-3 mt-9">
            <Link href={ctaHref} className="inline-flex items-center gap-3.5 w-fit px-6.5 py-4 transition-colors" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 13.5, letterSpacing: "0.04em", backgroundColor: c.texte, color: c.fond }}>
              {sec.hero.ctaTexte}
            </Link>
            {sec.hero.showSecondCta && sec.hero.secondCtaTexte && (
              <Link href={`/${slug}/${sec.hero.secondCtaLien || "produits"}`} className="inline-flex items-center gap-2 w-fit px-6.5 py-4 border" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 13.5, letterSpacing: "0.04em", borderColor: c.bordure, color: c.texte }}>
                {sec.hero.secondCtaTexte}
              </Link>
            )}
          </div>
        </div>
        <div className="relative overflow-hidden" style={{ background: tenant.bannerUrl ? undefined : `radial-gradient(130% 95% at 80% 10%, ${c.accentSecondaire || c.accent}55 0%, #4a3d30 30%, #241f22 58%, #0e0d11 100%)` }}>
          {tenant.bannerUrl ? (
            <img src={tenant.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.9 }} viewBox="0 0 300 500" preserveAspectRatio="xMidYMid meet" fill="none">
              <path d="M150 40 C 128 40 118 62 120 88 C 122 112 108 122 96 148 C 78 188 74 238 88 292 C 96 322 84 356 70 392 C 58 424 62 452 78 472" stroke="rgba(243,240,233,0.55)" strokeWidth="1.1" />
              <path d="M150 40 C 172 40 182 62 180 88 C 178 112 192 122 204 148 C 222 188 226 238 212 292 C 204 322 216 356 230 392 C 242 424 238 452 222 472" stroke={`${c.accentSecondaire || c.accent}a6`} strokeWidth="1.1" />
              <path d="M150 40 C 150 90 150 130 150 180 C 150 250 150 320 150 400" stroke="rgba(243,240,233,0.3)" strokeWidth="0.6" strokeDasharray="2 6" />
              <ellipse cx="150" cy="22" rx="16" ry="18" stroke="rgba(243,240,233,0.5)" strokeWidth="1.1" />
            </svg>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(115deg, transparent 38%, rgba(169,130,79,0.28) 54%, transparent 72%), radial-gradient(60% 50% at 50% 100%, rgba(0,0,0,0.55), transparent 70%)" }} />
          <GrainLayer />
          {heroTag && (
            <div className="absolute left-8 bottom-8 flex flex-col gap-1" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 12, color: "#F3F0E9", letterSpacing: "0.05em" }}>
              <span>{heroTag.nom}</span>
              <b style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 400 }}>{formatMontant(prixClient(heroTag.prix, commissionRate), devise)}</b>
            </div>
          )}
        </div>
      </section>
    ) : null,

    confiance: sec.confiance?.actif && (sec.confiance.items?.length ?? 0) > 0 ? (
      <section className="border-b py-3.5 overflow-hidden" style={{ borderColor: c.bordure }}>
        <div className="ax-noir-marquee-track flex items-center w-max" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 13, letterSpacing: "0.08em", color: c.texteMuted }}>
          {[...sec.confiance.items, ...sec.confiance.items].map((it, i) => (
            <span key={i} className="flex-shrink-0 px-8 whitespace-nowrap">{it.titre.toUpperCase()} — {it.texte}</span>
          ))}
        </div>
        <style>{`.ax-noir-marquee-track{animation:axNoirMarquee 26s linear infinite;} .ax-noir-marquee-track:hover{animation-play-state:paused;} @keyframes axNoirMarquee{from{transform:translateX(0);}to{transform:translateX(-50%);}} @media(prefers-reduced-motion:reduce){.ax-noir-marquee-track{animation:none;}}`}</style>
      </section>
    ) : null,

    vedettes: sec.vedettes.actif && vedettes.length > 0 ? (
      <section style={{ padding: "90px 4vw 40px" }}>
        <div className="flex justify-between items-end mb-10 pb-6 border-b" style={{ borderColor: c.bordure }}>
          <h2 className="text-[34px]" style={{ fontFamily: "'Fraunces',serif", fontWeight: 400, color: c.texte }}>{sec.vedettes.titre}</h2>
          <p className="max-w-[26ch] text-right hidden sm:block" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 12.5, color: c.texteMuted }}>
            Chaque silhouette est produite en série limitée.
          </p>
        </div>
        <NoirAtelierProductGrid produits={vedettes} slug={slug} devise={devise} commissionRate={commissionRate} colors={c} />
      </section>
    ) : null,

    collections: sec.collections.actif && collections.length > 0 ? (
      <section style={{ padding: "20px 4vw 40px" }}>
        <div className="flex justify-between items-end mb-10 pb-6 border-b" style={{ borderColor: c.bordure }}>
          <h2 className="text-[34px]" style={{ fontFamily: "'Fraunces',serif", fontWeight: 400, color: c.texte }}>{sec.collections.titre}</h2>
        </div>
        <div className={`grid gap-[2px] ${collections.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`} style={{ backgroundColor: c.bordure }}>
          {collections.slice(0, 4).map((col, i) => (
            <Link key={col.slug} href={`/${slug}/collections/${col.slug}`} className="relative overflow-hidden group" style={{ backgroundColor: c.fond, minHeight: 320 }}>
              {col.imageUrl ? (
                <img src={col.imageUrl} alt={col.nom} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0" style={{ background: `radial-gradient(120% 90% at ${i % 2 ? 70 : 30}% 15%, ${c.accentSecondaire || c.accent}55 0%, #221c17 100%)` }} />
              )}
              <div className="absolute inset-0 flex flex-col justify-end p-6" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)" }}>
                <span className="text-white text-xl" style={{ fontFamily: "'Fraunces',serif" }}>{col.nom}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    ) : null,

    about: sec.about?.actif ? (
      <section className="grid lg:grid-cols-[0.9fr_1.1fr] border-t border-b mt-14" style={{ borderColor: c.bordure }}>
        <div className="relative overflow-hidden" style={{ minHeight: 420, background: sec.about.imageUrl ? undefined : `radial-gradient(140% 100% at 20% 100%, ${c.accent} 0%, #3c1319 38%, ${c.texte} 70%)` }}>
          {sec.about.imageUrl && <img src={sec.about.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          {sec.about.badgeTexte && (
            <div className="absolute top-7 left-7 z-10" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 12.5, letterSpacing: "0.07em", color: "#F3F0E9", opacity: 0.7 }}>
              {sec.about.badgeTexte.toUpperCase()}
            </div>
          )}
          <GrainLayer />
        </div>
        <div className="flex flex-col justify-center border-l" style={{ padding: "6vw 5vw", borderColor: c.bordure }}>
          <h3 className="max-w-[16ch]" style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(28px,3vw,42px)", fontWeight: 400, lineHeight: 1.15, color: c.texte }}>
            {sec.about.titre}
          </h3>
          <p className="mt-5 max-w-[44ch]" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 14.5, lineHeight: 1.7, color: c.texteMuted }}>
            {sec.about.texte}
          </p>
          {cfg.aboutPage?.actif && (
            <Link href={`/${slug}/a-propos`} className="mt-7 w-fit pb-1 border-b" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 13, letterSpacing: "0.04em", borderColor: c.texte, color: c.texte }}>
              Lire notre histoire
            </Link>
          )}
        </div>
      </section>
    ) : null,

    promo: sec.promo.actif ? (
      <section style={{ padding: "70px 4vw" }}>
        <div className="text-center py-16 px-8" style={{ border: `1px solid ${c.bordure}` }}>
          <h2 className="text-[32px] mb-4" style={{ fontFamily: "'Fraunces',serif", color: c.accent }}>{sec.promo.titre}</h2>
          <p className="max-w-xl mx-auto mb-8" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>{sec.promo.texte}</p>
          <Link href={`/${slug}/produits`} className="inline-flex px-7 py-3.5" style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 13.5, backgroundColor: c.texte, color: c.fond }}>
            {sec.promo.ctaTexte}
          </Link>
        </div>
      </section>
    ) : null,

    faq: sec.faq?.actif && (sec.faq.items?.length ?? 0) > 0 ? (
      <section style={{ padding: "20px 4vw 70px" }}>
        <h2 className="text-[30px] mb-8 pb-5 border-b" style={{ fontFamily: "'Fraunces',serif", fontWeight: 400, color: c.texte, borderColor: c.bordure }}>{sec.faq.titre}</h2>
        <div className="max-w-2xl space-y-6">
          {sec.faq.items.map((it, i) => (
            <div key={i}>
              <p className="mb-1.5" style={{ fontFamily: "'Fraunces',serif", fontSize: 16, color: c.texte }}>{it.question}</p>
              <p style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 13.5, color: c.texteMuted, lineHeight: 1.6 }}>{it.reponse}</p>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    avis: sec.avis.actif && (tenant.avis?.length ?? 0) > 0 ? (
      <section style={{ padding: "20px 4vw 70px" }}>
        <h2 className="text-[30px] mb-10 pb-5 border-b" style={{ fontFamily: "'Fraunces',serif", fontWeight: 400, color: c.texte, borderColor: c.bordure }}>{sec.avis.titre}</h2>
        <div className="grid sm:grid-cols-3 gap-[2px]" style={{ backgroundColor: c.bordure }}>
          {tenant.avis.slice(0, 6).map((a: any) => (
            <div key={a.id} className="p-6" style={{ backgroundColor: c.fond }}>
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ color: i <= a.note ? c.accent : c.bordure }}>★</span>)}
              </div>
              {a.titre && <p className="text-sm mb-2" style={{ fontFamily: "'Fraunces',serif", color: c.texte }}>{a.titre}</p>}
              {a.commentaire && <p className="text-[13px] leading-relaxed mb-3" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>{a.commentaire}</p>}
              <p className="text-[12px]" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>{a.client?.nom || "Client"}</p>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    newsletter: sec.newsletter.actif ? (
      <section style={{ padding: "20px 4vw 90px" }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-[28px] mb-3" style={{ fontFamily: "'Fraunces',serif", color: c.texte }}>{sec.newsletter.titre}</h2>
          <p className="mb-7" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>{sec.newsletter.texte}</p>
          <form method="post" action="/api/newsletter" className="flex flex-col sm:flex-row gap-2 justify-center">
            <input type="email" name="email" placeholder={sec.newsletter.placeholder} className="flex-1 max-w-sm px-4 py-3 text-sm outline-none border" style={{ borderColor: c.bordure, backgroundColor: c.fond, color: c.texte }} />
            <button type="submit" className="px-6 py-3 text-sm" style={{ backgroundColor: c.texte, color: c.fond, fontFamily: "'Archivo Narrow',sans-serif" }}>{sec.newsletter.ctaTexte}</button>
          </form>
        </div>
      </section>
    ) : null,
  };

  const ordre = (cfg.sectionOrder?.length ? cfg.sectionOrder : DEFAULT_ORDER).filter((id) => id !== "annonce" && NODES.hasOwnProperty(id) && id in NODES);
  for (const id of DEFAULT_ORDER) if (id !== "annonce" && !ordre.includes(id) && id in NODES) ordre.push(id);

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh", fontFamily: "'Fraunces',serif" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <GrainFilterDefs />
      {NODES.annonce}
      <NoirAtelierNav tenant={tenant} cfg={cfg} slug={slug} />
      {ordre.map((id) =>
        NODES[id] ? (
          <div key={id} data-axs-id={id}>
            <ScrollReveal type={revealType(id)} vitesse={vitesse}>{NODES[id]}</ScrollReveal>
          </div>
        ) : null
      )}
      <div data-axs-id="customSections">
        <CustomSectionsRenderer sections={cfg.customSections ?? []} slug={slug} colors={{ accent: c.accent, texte: c.texte, fond: c.fond }} container="max-w-[1280px]" sectionPy="py-20" />
      </div>
      <NoirAtelierFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
