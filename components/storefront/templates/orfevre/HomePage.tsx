import Link from "next/link";
import { ScrollReveal, type RevealType } from "@/components/storefront/ScrollReveal";
import { CustomSectionsRenderer } from "@/components/storefront/CustomSectionsRenderer";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import type { ThemeConfig } from "@/lib/theme-config";
import { OrfevreNav } from "./Nav";
import { OrfevreFooter } from "./Footer";
import { OrfevreProductGrid } from "./ProductGrid";

interface Props { tenant: any; cfg: ThemeConfig; vedettes: any[]; slug: string }
const DEFAULT_ORDER = ["annonce", "hero", "confiance", "vedettes", "collections", "about", "promo", "faq", "avis", "newsletter"];

export function OrfevreHomePage({ tenant, cfg, vedettes, slug }: Props) {
  const c = cfg.colors;
  const sec = cfg.sections;
  const devise = tenant.devise || "XAF";
  const commissionRate = tenant.commissionRate ?? 0.06;
  const anim = cfg.animations;
  const vitesse = anim?.vitesse ?? "slow";
  const revealType = (cle: string): RevealType => (anim?.sectionAnimations?.[cle] as RevealType) || (anim?.global as RevealType) || "fade-in";
  const ctaHref = `/${slug}/${sec.hero.ctaLien || "produits"}`;
  const collections: any[] = tenant.collections || [];

  const NODES: Record<string, React.ReactNode> = {
    annonce: sec.annonce.actif ? (<div className="py-2.5 text-center text-xs uppercase tracking-wide" style={{ backgroundColor: sec.annonce.couleurFond, color: sec.annonce.couleurTexte }}>{sec.annonce.texte}</div>) : null,

    hero: sec.hero.actif ? (
      <section className="grid lg:grid-cols-2 items-center gap-10" style={{ minHeight: "92vh", padding: "0 4vw" }}>
        <div>
          {sec.hero.badgeTexte && <div className="mb-6 text-[11.5px] uppercase tracking-widest" style={{ color: c.accent }}>{sec.hero.badgeTexte}</div>}
          <h1 className="italic max-w-[12ch]" style={{ fontSize: "clamp(40px,4.6vw,66px)", fontWeight: 400, lineHeight: 1.08 }}>{sec.hero.titre}</h1>
          <p className="mt-6.5 max-w-[36ch] leading-loose" style={{ color: c.texteMuted }}>{sec.hero.sousTitre}</p>
          <Link href={ctaHref} className="inline-flex mt-9 px-8 py-4 text-[12.5px] uppercase tracking-widest transition-colors" style={{ border: `1px solid ${c.accent}`, color: c.accent, borderRadius: cfg.radius }}>{sec.hero.ctaTexte}</Link>
        </div>
        <div className="relative overflow-hidden" style={{ aspectRatio: "1/1.1", borderRadius: cfg.radius, background: tenant.bannerUrl ? undefined : `radial-gradient(120% 100% at 50% 30%, ${c.accent}33 0%, ${c.surface} 60%, ${c.fond} 100%)` }}>
          {tenant.bannerUrl && <img src={tenant.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          {!tenant.bannerUrl && vedettes[0]?.images?.[0] && <img src={vedettes[0].images[0]} alt="" className="absolute inset-0 w-full h-full object-contain p-16" />}
        </div>
      </section>
    ) : null,

    confiance: sec.confiance?.actif && (sec.confiance.items?.length ?? 0) > 0 ? (
      <section className="py-3.5 overflow-hidden" style={{ borderTop: `1px solid ${c.bordure}`, borderBottom: `1px solid ${c.bordure}` }}>
        <div className="ax-orf-marquee-track flex items-center w-max text-[11.5px] uppercase tracking-widest" style={{ color: c.texteMuted }}>
          {[...sec.confiance.items, ...sec.confiance.items].map((it, i) => <span key={i} className="flex-shrink-0 px-10 whitespace-nowrap">{it.icone} {it.titre} — {it.texte}</span>)}
        </div>
        <style>{`.ax-orf-marquee-track{animation:axOrfMarquee 28s linear infinite;} .ax-orf-marquee-track:hover{animation-play-state:paused;} @keyframes axOrfMarquee{from{transform:translateX(0);}to{transform:translateX(-50%);}} @media(prefers-reduced-motion:reduce){.ax-orf-marquee-track{animation:none;}}`}</style>
      </section>
    ) : null,

    vedettes: sec.vedettes.actif && vedettes.length > 0 ? (
      <section className="text-center" style={{ padding: "110px 4vw 40px" }}>
        <div className="mb-14">
          <span className="block mb-3.5 text-[11.5px] uppercase tracking-widest" style={{ color: c.accent }}>Pièces signature</span>
          <h2 className="text-[38px] italic" style={{ fontWeight: 400 }}>{sec.vedettes.titre}</h2>
        </div>
        <div className="text-left"><OrfevreProductGrid produits={vedettes} slug={slug} devise={devise} commissionRate={commissionRate} colors={c} /></div>
      </section>
    ) : null,

    collections: sec.collections.actif && collections.length > 0 ? (
      <section style={{ padding: "20px 4vw 40px" }}>
        <h2 className="text-[30px] italic mb-9 text-center" style={{ fontWeight: 400 }}>{sec.collections.titre}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {collections.slice(0, 4).map((col) => (
            <Link key={col.slug} href={`/${slug}/collections/${col.slug}`} className="relative overflow-hidden flex items-end p-5" style={{ aspectRatio: "3/4", backgroundColor: c.surface, borderRadius: cfg.radius }}>
              {col.imageUrl ? <img src={col.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" /> : <div className="absolute inset-0" style={{ background: `radial-gradient(120% 90% at 40% 20%, ${c.accent}44, ${c.surface} 70%)` }} />}
              <span className="relative z-10 text-lg italic" style={{ color: c.texte }}>{col.nom}</span>
            </Link>
          ))}
        </div>
      </section>
    ) : null,

    about: sec.about?.actif ? (
      <section style={{ padding: "70px 4vw" }}>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative overflow-hidden" style={{ aspectRatio: "4/3", borderRadius: cfg.radius, background: sec.about.imageUrl ? undefined : `radial-gradient(120% 90% at 40% 20%, ${c.accent}44, ${c.surface} 70%)` }}>{sec.about.imageUrl && <img src={sec.about.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}</div>
          <div>
            {sec.about.badgeTexte && <div className="mb-3 text-[11.5px] uppercase tracking-widest" style={{ color: c.accent }}>{sec.about.badgeTexte}</div>}
            <h3 className="text-[28px] italic mb-4" style={{ fontWeight: 400 }}>{sec.about.titre}</h3>
            <p className="max-w-[42ch]" style={{ color: c.texteMuted }}>{sec.about.texte}</p>
          </div>
        </div>
      </section>
    ) : null,

    promo: sec.promo.actif ? (
      <section className="text-center" style={{ padding: "20px 4vw 70px" }}>
        <div className="py-16 px-8" style={{ backgroundColor: c.surface, borderRadius: cfg.radius }}>
          <h2 className="text-[28px] italic mb-4" style={{ fontWeight: 400 }}>{sec.promo.titre}</h2>
          <p className="max-w-xl mx-auto mb-8" style={{ color: c.texteMuted }}>{sec.promo.texte}</p>
          <Link href={`/${slug}/produits`} className="inline-flex px-7 py-3.5 text-[12.5px] uppercase tracking-widest" style={{ border: `1px solid ${c.accent}`, color: c.accent }}>{sec.promo.ctaTexte}</Link>
        </div>
      </section>
    ) : null,

    faq: sec.faq?.actif && (sec.faq.items?.length ?? 0) > 0 ? (
      <section style={{ padding: "20px 4vw 70px" }}>
        <h2 className="text-[26px] italic mb-8 text-center" style={{ fontWeight: 400 }}>{sec.faq.titre}</h2>
        <div className="max-w-2xl mx-auto space-y-6">{sec.faq.items.map((it, i) => <div key={i}><p className="mb-1.5 italic">{it.question}</p><p className="text-[13.5px]" style={{ color: c.texteMuted }}>{it.reponse}</p></div>)}</div>
      </section>
    ) : null,

    avis: sec.avis.actif && (tenant.avis?.length ?? 0) > 0 ? (
      <section style={{ padding: "20px 4vw 70px" }}>
        <h2 className="text-[26px] italic mb-9 text-center" style={{ fontWeight: 400 }}>{sec.avis.titre}</h2>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {tenant.avis.slice(0, 6).map((a: any) => (
            <div key={a.id}>
              <div className="flex gap-0.5 mb-3 justify-center">{[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ color: i <= a.note ? c.accent : c.bordure }}>★</span>)}</div>
              {a.titre && <p className="italic mb-2 text-center">{a.titre}</p>}
              {a.commentaire && <p className="text-[13px] mb-3 text-center" style={{ color: c.texteMuted }}>{a.commentaire}</p>}
              <p className="text-[12px] text-center uppercase tracking-wide" style={{ color: c.texteMuted }}>{a.client?.nom || "Client"}</p>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    newsletter: sec.newsletter.actif ? (
      <section style={{ padding: "20px 4vw 90px" }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-[24px] italic mb-3" style={{ fontWeight: 400 }}>{sec.newsletter.titre}</h2>
          <p className="mb-7" style={{ color: c.texteMuted }}>{sec.newsletter.texte}</p>
          <form method="post" action="/api/newsletter" className="flex flex-col sm:flex-row gap-2 justify-center">
            <input type="email" name="email" placeholder={sec.newsletter.placeholder} className="flex-1 max-w-sm px-4 py-3 text-sm outline-none border" style={{ borderColor: c.bordure, backgroundColor: c.surface, color: c.texte }} />
            <button type="submit" className="px-6 py-3 text-sm uppercase tracking-widest" style={{ border: `1px solid ${c.accent}`, color: c.accent }}>{sec.newsletter.ctaTexte}</button>
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
      <OrfevreNav tenant={tenant} cfg={cfg} slug={slug} />
      {ordre.map((id) => NODES[id] ? (<div key={id} data-axs-id={id}><ScrollReveal type={revealType(id)} vitesse={vitesse}>{NODES[id]}</ScrollReveal></div>) : null)}
      <div data-axs-id="customSections"><CustomSectionsRenderer sections={cfg.customSections ?? []} slug={slug} colors={{ accent: c.accent, texte: c.texte, fond: c.fond }} container="max-w-[1280px]" sectionPy="py-20" /></div>
      <OrfevreFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
