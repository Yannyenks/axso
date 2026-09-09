import Link from "next/link";
import { ScrollReveal, type RevealType } from "@/components/storefront/ScrollReveal";
import { CustomSectionsRenderer } from "@/components/storefront/CustomSectionsRenderer";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import type { ThemeConfig } from "@/lib/theme-config";
import { PulseNav } from "./Nav";
import { PulseFooter } from "./Footer";
import { PulseProductGrid } from "./ProductGrid";

interface Props {
  tenant: any;
  cfg: ThemeConfig;
  vedettes: any[];
  slug: string;
}

const DEFAULT_ORDER = ["annonce", "hero", "confiance", "vedettes", "collections", "about", "promo", "faq", "avis", "newsletter"];

export function PulseHomePage({ tenant, cfg, vedettes, slug }: Props) {
  const c = cfg.colors;
  const sec = cfg.sections;
  const devise = tenant.devise || "XAF";
  const commissionRate = tenant.commissionRate ?? 0.06;
  const anim = cfg.animations;
  const vitesse = anim?.vitesse ?? "fast";
  const revealType = (cle: string): RevealType => (anim?.sectionAnimations?.[cle] as RevealType) || (anim?.global as RevealType) || "slide-up";

  const ctaHref = `/${slug}/${sec.hero.ctaLien || "produits"}`;
  const collections: any[] = tenant.collections || [];

  const NODES: Record<string, React.ReactNode> = {
    annonce: sec.annonce.actif ? (
      <div className="py-2.5 text-center text-xs font-bold uppercase tracking-wide" style={{ backgroundColor: sec.annonce.couleurFond, color: sec.annonce.couleurTexte }}>
        {sec.annonce.texte}
      </div>
    ) : null,

    hero: sec.hero.actif ? (
      <section className="relative grid lg:grid-cols-2" style={{ minHeight: "88vh" }}>
        <div
          className="absolute inset-0"
          style={{ backgroundColor: c.texte, clipPath: "polygon(58% 0, 100% 0, 100% 100%, 46% 100%)" }}
        />
        <div className="relative z-10 flex flex-col justify-center" style={{ padding: "6vw 3vw 6vw 4vw" }}>
          {sec.hero.badgeTexte && (
            <div className="mb-5 text-[12.5px] font-bold" style={{ color: c.texteMuted }}>{sec.hero.badgeTexte.toUpperCase()}</div>
          )}
          <h1 className="uppercase" style={{ fontSize: "clamp(46px,6vw,84px)", lineHeight: 0.96, color: c.texte }}>
            {sec.hero.titre.split(" ").map((w, i, arr) => i === arr.length - 1 ? <span key={i} style={{ color: c.accent }}>{w}</span> : <span key={i}>{w} </span>)}
          </h1>
          <p className="mt-6 max-w-[36ch] text-[15px] leading-relaxed font-medium" style={{ color: c.texteMuted }}>{sec.hero.sousTitre}</p>
          <div className="flex flex-wrap gap-3.5 mt-8">
            <Link href={ctaHref} className="px-7 py-4 font-bold text-sm transition-transform hover:-translate-y-0.5" style={{ backgroundColor: c.texte, color: c.fond }}>
              {sec.hero.ctaTexte}
            </Link>
            {sec.hero.showSecondCta && sec.hero.secondCtaTexte && (
              <Link href={`/${slug}/${sec.hero.secondCtaLien || "produits"}`} className="px-7 py-4 font-bold text-sm border-2">
                {sec.hero.secondCtaTexte}
              </Link>
            )}
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-center" style={{ padding: "5vw 4vw 5vw 2vw" }}>
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3", background: `radial-gradient(120% 100% at 30% 20%, ${c.accent} 0%, ${c.accentSecondaire || c.accent} 100%)` }}>
            {tenant.bannerUrl && <img src={tenant.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            {vedettes[0]?.images?.[0] && !tenant.bannerUrl && (
              <img src={vedettes[0].images[0]} alt={vedettes[0].nom} className="absolute inset-0 w-full h-full object-contain p-10" />
            )}
          </div>
        </div>
      </section>
    ) : null,

    confiance: sec.confiance?.actif && (sec.confiance.items?.length ?? 0) > 0 ? (
      <section className="py-3.5 overflow-hidden" style={{ backgroundColor: c.texte, transform: "skewY(-1.2deg)", margin: "-1px 0" }}>
        <div className="ax-pulse-marquee-track flex items-center w-max font-bold text-[15px] uppercase" style={{ color: c.fond, transform: "skewY(1.2deg)" }}>
          {[...sec.confiance.items, ...sec.confiance.items].map((it, i) => (
            <span key={i} className="flex-shrink-0 px-8 whitespace-nowrap">{it.icone} {it.titre} — {it.texte}</span>
          ))}
        </div>
        <style>{`.ax-pulse-marquee-track{animation:axPulseMarquee 22s linear infinite;} .ax-pulse-marquee-track:hover{animation-play-state:paused;} @keyframes axPulseMarquee{from{transform:skewY(1.2deg) translateX(0);}to{transform:skewY(1.2deg) translateX(-50%);}} @media(prefers-reduced-motion:reduce){.ax-pulse-marquee-track{animation:none;}}`}</style>
      </section>
    ) : null,

    collections: sec.collections.actif && collections.length > 0 ? (
      <section style={{ padding: "90px 4vw 20px" }}>
        <div className="flex justify-between items-end mb-9">
          <h2 className="text-[34px] font-bold uppercase">{sec.collections.titre}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {collections.slice(0, 4).map((col, i) => (
            <Link
              key={col.slug}
              href={`/${slug}/collections/${col.slug}`}
              className="relative overflow-hidden flex items-end p-5"
              style={{ aspectRatio: "3/4", clipPath: "polygon(0 6%, 100% 0, 100% 94%, 0 100%)", background: `linear-gradient(160deg, ${i % 2 ? c.accentSecondaire || c.accent : c.accent}, #0E0E12)` }}
            >
              {col.imageUrl && <img src={col.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />}
              <span className="relative z-10 font-bold text-[19px] uppercase" style={{ color: "#fff" }}>{col.nom}</span>
            </Link>
          ))}
        </div>
      </section>
    ) : null,

    vedettes: sec.vedettes.actif && vedettes.length > 0 ? (
      <section style={{ padding: "90px 4vw 20px" }}>
        <div className="flex justify-between items-end mb-9">
          <h2 className="text-[34px] font-bold uppercase">{sec.vedettes.titre}</h2>
          <span className="hidden sm:block text-[13px] font-semibold" style={{ color: c.texteMuted }}>Survolez une carte pour voir l'autre angle</span>
        </div>
        <PulseProductGrid produits={vedettes} slug={slug} devise={devise} commissionRate={commissionRate} colors={c} colonnes={3} />
      </section>
    ) : null,

    about: sec.about?.actif ? (
      <section style={{ padding: "70px 4vw" }}>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative overflow-hidden" style={{ aspectRatio: "4/3", background: sec.about.imageUrl ? undefined : `linear-gradient(160deg, ${c.accent}, ${c.accentSecondaire || c.accent})` }}>
            {sec.about.imageUrl && <img src={sec.about.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          </div>
          <div>
            {sec.about.badgeTexte && <div className="mb-3 text-[12.5px] font-bold" style={{ color: c.texteMuted }}>{sec.about.badgeTexte.toUpperCase()}</div>}
            <h3 className="text-[32px] font-bold uppercase mb-4">{sec.about.titre}</h3>
            <p className="max-w-[42ch] font-medium" style={{ color: c.texteMuted }}>{sec.about.texte}</p>
            {cfg.aboutPage?.actif && (
              <Link href={`/${slug}/a-propos`} className="inline-block mt-6 px-6 py-3 font-bold text-sm" style={{ backgroundColor: c.texte, color: c.fond }}>En savoir plus</Link>
            )}
          </div>
        </div>
      </section>
    ) : null,

    promo: sec.promo.actif ? (
      <section style={{ padding: "20px 4vw 70px" }}>
        <div className="relative overflow-hidden p-12 sm:p-16 text-center" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentSecondaire || c.accent})` }}>
          <h2 className="text-[32px] font-bold uppercase mb-4" style={{ color: "#fff" }}>{sec.promo.titre}</h2>
          <p className="max-w-xl mx-auto mb-8 font-medium" style={{ color: "#fff", opacity: 0.9 }}>{sec.promo.texte}</p>
          <Link href={`/${slug}/produits`} className="inline-flex px-7 py-3.5 font-bold text-sm" style={{ backgroundColor: c.texte, color: c.fond }}>{sec.promo.ctaTexte}</Link>
        </div>
      </section>
    ) : null,

    faq: sec.faq?.actif && (sec.faq.items?.length ?? 0) > 0 ? (
      <section style={{ padding: "20px 4vw 70px" }}>
        <h2 className="text-[30px] font-bold uppercase mb-8">{sec.faq.titre}</h2>
        <div className="max-w-2xl space-y-6">
          {sec.faq.items.map((it, i) => (
            <div key={i}>
              <p className="font-bold mb-1.5">{it.question}</p>
              <p className="text-[13.5px] font-medium" style={{ color: c.texteMuted }}>{it.reponse}</p>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    avis: sec.avis.actif && (tenant.avis?.length ?? 0) > 0 ? (
      <section style={{ padding: "20px 4vw 70px" }}>
        <h2 className="text-[30px] font-bold uppercase mb-9">{sec.avis.titre}</h2>
        <div className="grid sm:grid-cols-3 gap-[2px]" style={{ backgroundColor: c.bordure }}>
          {tenant.avis.slice(0, 6).map((a: any) => (
            <div key={a.id} className="p-6" style={{ backgroundColor: c.fond }}>
              <div className="flex gap-0.5 mb-3">{[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ color: i <= a.note ? c.accent : c.bordure }}>★</span>)}</div>
              {a.titre && <p className="font-bold text-sm mb-2">{a.titre}</p>}
              {a.commentaire && <p className="text-[13px] font-medium mb-3" style={{ color: c.texteMuted }}>{a.commentaire}</p>}
              <p className="text-[12px] font-semibold" style={{ color: c.texteMuted }}>{a.client?.nom || "Client"}</p>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    newsletter: sec.newsletter.actif ? (
      <section style={{ padding: "20px 4vw 90px" }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-[28px] font-bold uppercase mb-3">{sec.newsletter.titre}</h2>
          <p className="mb-7 font-medium" style={{ color: c.texteMuted }}>{sec.newsletter.texte}</p>
          <form method="post" action="/api/newsletter" className="flex flex-col sm:flex-row gap-2 justify-center">
            <input type="email" name="email" placeholder={sec.newsletter.placeholder} className="flex-1 max-w-sm px-4 py-3 text-sm outline-none border-2" style={{ borderColor: c.bordure }} />
            <button type="submit" className="px-6 py-3 text-sm font-bold" style={{ backgroundColor: c.texte, color: c.fond }}>{sec.newsletter.ctaTexte}</button>
          </form>
        </div>
      </section>
    ) : null,
  };

  const ordre = (cfg.sectionOrder?.length ? cfg.sectionOrder : DEFAULT_ORDER).filter((id) => id !== "annonce" && id in NODES);
  for (const id of DEFAULT_ORDER) if (id !== "annonce" && !ordre.includes(id) && id in NODES) ordre.push(id);

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />
      {NODES.annonce}
      <PulseNav tenant={tenant} cfg={cfg} slug={slug} />
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
      <PulseFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
