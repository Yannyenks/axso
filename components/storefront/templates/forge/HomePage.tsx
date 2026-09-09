import Link from "next/link";
import { ScrollReveal, type RevealType } from "@/components/storefront/ScrollReveal";
import { CustomSectionsRenderer } from "@/components/storefront/CustomSectionsRenderer";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import type { ThemeConfig } from "@/lib/theme-config";
import { ForgeNav } from "./Nav";
import { ForgeFooter } from "./Footer";
import { ForgeProductGrid } from "./ProductGrid";

interface Props { tenant: any; cfg: ThemeConfig; vedettes: any[]; slug: string }
const DEFAULT_ORDER = ["annonce", "hero", "confiance", "vedettes", "collections", "about", "promo", "faq", "avis", "newsletter"];

export function ForgeHomePage({ tenant, cfg, vedettes, slug }: Props) {
  const c = cfg.colors;
  const sec = cfg.sections;
  const devise = tenant.devise || "XAF";
  const commissionRate = tenant.commissionRate ?? 0.06;
  const anim = cfg.animations;
  const vitesse = anim?.vitesse ?? "normal";
  const revealType = (cle: string): RevealType => (anim?.sectionAnimations?.[cle] as RevealType) || (anim?.global as RevealType) || "fade-in";
  const ctaHref = `/${slug}/${sec.hero.ctaLien || "produits"}`;
  const collections: any[] = tenant.collections || [];

  const NODES: Record<string, React.ReactNode> = {
    annonce: sec.annonce.actif ? (<div className="py-2.5 text-center text-xs font-bold uppercase" style={{ backgroundColor: sec.annonce.couleurFond, color: sec.annonce.couleurTexte }}>{sec.annonce.texte}</div>) : null,

    hero: sec.hero.actif ? (
      <section className="grid lg:grid-cols-2 border-b relative" style={{ minHeight: "90vh", borderColor: c.bordure }}>
        <div className="flex flex-col justify-center border-r relative" style={{ padding: "5vw 3vw 5vw 4vw", borderColor: c.bordure }}>
          {sec.hero.badgeTexte && <div className="mb-5 text-[11.5px]" style={{ color: c.texteMuted }}>{sec.hero.badgeTexte.toUpperCase()}</div>}
          <h1 style={{ fontSize: "clamp(44px,5.6vw,76px)", lineHeight: 0.95 }}>{sec.hero.titre}</h1>
          <p className="mt-5.5 max-w-[34ch] font-mono text-[13px]" style={{ color: c.texteMuted }}>{sec.hero.sousTitre}</p>
          <Link href={ctaHref} className="inline-flex mt-8 px-7 py-4 font-bold text-[12.5px] uppercase tracking-wide transition-colors" style={{ backgroundColor: c.accent, color: c.fond }}>{sec.hero.ctaTexte}</Link>
        </div>
        <div className="relative overflow-hidden flex items-center justify-center" style={{ padding: "4vw", background: tenant.bannerUrl ? undefined : `radial-gradient(120% 100% at 60% 20%, ${c.accentSecondaire || c.accent} 0%, #35402a 60%, #1B1F19 100%)` }}>
          {tenant.bannerUrl ? <img src={tenant.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : (
            vedettes[0]?.images?.[0] && <img src={vedettes[0].images[0]} alt="" className="max-h-[70%] object-contain" style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3))" }} />
          )}
        </div>
      </section>
    ) : null,

    confiance: sec.confiance?.actif && (sec.confiance.items?.length ?? 0) > 0 ? (
      <section className="py-3 overflow-hidden" style={{ backgroundColor: c.accentSecondaire || c.accent }}>
        <div className="ax-forge-marquee-track flex items-center w-max font-bold uppercase text-xs" style={{ color: c.fond }}>
          {[...sec.confiance.items, ...sec.confiance.items].map((it, i) => <span key={i} className="flex-shrink-0 px-8 whitespace-nowrap">{it.icone} {it.titre}{it.texte ? ` — ${it.texte}` : ""}</span>)}
        </div>
        <style>{`.ax-forge-marquee-track{animation:axForgeMarquee 24s linear infinite;} .ax-forge-marquee-track:hover{animation-play-state:paused;} @keyframes axForgeMarquee{from{transform:translateX(0);}to{transform:translateX(-50%);}} @media(prefers-reduced-motion:reduce){.ax-forge-marquee-track{animation:none;}}`}</style>
      </section>
    ) : null,

    vedettes: sec.vedettes.actif && vedettes.length > 0 ? (
      <section style={{ padding: "90px 4vw" }}>
        <div className="flex justify-between items-end mb-9">
          <h2 className="text-[32px]">{sec.vedettes.titre}</h2>
          <span className="hidden sm:block text-xs font-mono" style={{ color: c.texteMuted }}>SURVOLEZ POUR VOIR L'ARRIÈRE</span>
        </div>
        <ForgeProductGrid produits={vedettes} slug={slug} devise={devise} commissionRate={commissionRate} colors={c} />
      </section>
    ) : null,

    collections: sec.collections.actif && collections.length > 0 ? (
      <section style={{ padding: "20px 4vw 40px" }}>
        <h2 className="text-[28px] mb-9">{sec.collections.titre}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {collections.slice(0, 4).map((col) => (
            <Link key={col.slug} href={`/${slug}/collections/${col.slug}`} className="relative overflow-hidden flex items-end p-5" style={{ aspectRatio: "3/4", backgroundColor: c.surface }}>
              {col.imageUrl ? <img src={col.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" /> : <div className="absolute inset-0" style={{ background: `radial-gradient(120% 90% at 40% 20%, ${c.accentSecondaire || c.accent}66, ${c.surface} 70%)` }} />}
              <span className="relative z-10 text-lg font-bold" style={{ color: c.texte }}>{col.nom}</span>
            </Link>
          ))}
        </div>
      </section>
    ) : null,

    about: sec.about?.actif ? (
      <section style={{ padding: "70px 4vw" }}>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative overflow-hidden" style={{ aspectRatio: "4/3", background: sec.about.imageUrl ? undefined : `radial-gradient(120% 90% at 40% 20%, ${c.accentSecondaire || c.accent}66, ${c.surface} 70%)` }}>{sec.about.imageUrl && <img src={sec.about.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}</div>
          <div>
            {sec.about.badgeTexte && <div className="mb-3 text-xs" style={{ color: c.texteMuted }}>{sec.about.badgeTexte.toUpperCase()}</div>}
            <h3 className="text-[26px] mb-4">{sec.about.titre}</h3>
            <p className="max-w-[42ch] font-mono text-[13px]" style={{ color: c.texteMuted }}>{sec.about.texte}</p>
          </div>
        </div>
      </section>
    ) : null,

    promo: sec.promo.actif ? (
      <section style={{ padding: "20px 4vw 70px" }}>
        <div className="text-center py-16 px-8" style={{ border: `1px solid ${c.bordure}` }}>
          <h2 className="text-[26px] mb-4">{sec.promo.titre}</h2>
          <p className="max-w-xl mx-auto mb-8 font-mono text-[13px]" style={{ color: c.texteMuted }}>{sec.promo.texte}</p>
          <Link href={`/${slug}/produits`} className="inline-flex px-7 py-3.5 font-bold text-[12.5px] uppercase" style={{ backgroundColor: c.accent, color: c.fond }}>{sec.promo.ctaTexte}</Link>
        </div>
      </section>
    ) : null,

    faq: sec.faq?.actif && (sec.faq.items?.length ?? 0) > 0 ? (
      <section style={{ padding: "20px 4vw 70px" }}>
        <h2 className="text-[24px] mb-8">{sec.faq.titre}</h2>
        <div className="max-w-2xl space-y-6">{sec.faq.items.map((it, i) => <div key={i}><p className="font-bold mb-1.5">{it.question}</p><p className="text-[13px] font-mono" style={{ color: c.texteMuted }}>{it.reponse}</p></div>)}</div>
      </section>
    ) : null,

    avis: sec.avis.actif && (tenant.avis?.length ?? 0) > 0 ? (
      <section style={{ padding: "20px 4vw 70px" }}>
        <h2 className="text-[24px] mb-9">{sec.avis.titre}</h2>
        <div className="grid sm:grid-cols-3 gap-[2px]" style={{ backgroundColor: c.bordure }}>
          {tenant.avis.slice(0, 6).map((a: any) => (
            <div key={a.id} className="p-6" style={{ backgroundColor: c.fond }}>
              <div className="flex gap-0.5 mb-3">{[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ color: i <= a.note ? c.accent : c.bordure }}>★</span>)}</div>
              {a.titre && <p className="font-bold text-sm mb-2">{a.titre}</p>}
              {a.commentaire && <p className="text-[13px] font-mono mb-3" style={{ color: c.texteMuted }}>{a.commentaire}</p>}
              <p className="text-[11px] uppercase" style={{ color: c.texteMuted }}>{a.client?.nom || "Client"}</p>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    newsletter: sec.newsletter.actif ? (
      <section style={{ padding: "20px 4vw 90px" }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-[22px] mb-3">{sec.newsletter.titre}</h2>
          <p className="mb-7 font-mono text-[13px]" style={{ color: c.texteMuted }}>{sec.newsletter.texte}</p>
          <form method="post" action="/api/newsletter" className="flex flex-col sm:flex-row gap-2 justify-center">
            <input type="email" name="email" placeholder={sec.newsletter.placeholder} className="flex-1 max-w-sm px-4 py-3 text-sm outline-none border" style={{ borderColor: c.bordure, backgroundColor: c.surface, color: c.texte }} />
            <button type="submit" className="px-6 py-3 text-sm font-bold uppercase" style={{ backgroundColor: c.accent, color: c.fond }}>{sec.newsletter.ctaTexte}</button>
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
      <ForgeNav tenant={tenant} cfg={cfg} slug={slug} />
      {ordre.map((id) => NODES[id] ? (<div key={id} data-axs-id={id}><ScrollReveal type={revealType(id)} vitesse={vitesse}>{NODES[id]}</ScrollReveal></div>) : null)}
      <div data-axs-id="customSections"><CustomSectionsRenderer sections={cfg.customSections ?? []} slug={slug} colors={{ accent: c.accent, texte: c.texte, fond: c.fond }} container="max-w-[1280px]" sectionPy="py-20" /></div>
      <ForgeFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
