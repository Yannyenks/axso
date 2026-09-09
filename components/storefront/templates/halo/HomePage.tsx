import Link from "next/link";
import { ScrollReveal, type RevealType } from "@/components/storefront/ScrollReveal";
import { CustomSectionsRenderer } from "@/components/storefront/CustomSectionsRenderer";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import type { ThemeConfig } from "@/lib/theme-config";
import { HaloNav } from "./Nav";
import { HaloFooter } from "./Footer";
import { HaloProductGrid } from "./ProductGrid";

interface Props { tenant: any; cfg: ThemeConfig; vedettes: any[]; slug: string }

const DEFAULT_ORDER = ["annonce", "hero", "confiance", "vedettes", "collections", "about", "promo", "faq", "avis", "newsletter"];

export function HaloHomePage({ tenant, cfg, vedettes, slug }: Props) {
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
    annonce: sec.annonce.actif ? (
      <div className="py-2.5 text-center text-xs font-semibold" style={{ backgroundColor: sec.annonce.couleurFond, color: sec.annonce.couleurTexte }}>{sec.annonce.texte}</div>
    ) : null,

    hero: sec.hero.actif ? (
      <section className="grid lg:grid-cols-2 items-center gap-10" style={{ minHeight: "88vh", padding: "0 4vw" }}>
        <div>
          {sec.hero.badgeTexte && <div className="mb-4.5 text-[12.5px] font-semibold" style={{ color: c.accent }}>{sec.hero.badgeTexte.toUpperCase()}</div>}
          <h1 className="max-w-[12ch]" style={{ fontSize: "clamp(38px,4.6vw,58px)", lineHeight: 1.14 }}>{sec.hero.titre}</h1>
          <p className="mt-6 max-w-[36ch] leading-relaxed" style={{ color: c.texteMuted }}>{sec.hero.sousTitre}</p>
          <Link href={ctaHref} className="inline-flex mt-8 px-7 py-4 font-medium text-sm transition-colors" style={{ border: `1px solid ${c.texte}`, color: c.texte }}>{sec.hero.ctaTexte}</Link>
        </div>
        <div className="relative overflow-hidden" style={{ aspectRatio: "4/3.4", background: tenant.bannerUrl ? undefined : `radial-gradient(120% 100% at 50% 20%, #e4d7bd 0%, #cdbb96 60%, ${c.accent} 100%)` }}>
          {tenant.bannerUrl && <img src={tenant.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          {!tenant.bannerUrl && vedettes[0]?.images?.[0] && <img src={vedettes[0].images[0]} alt="" className="absolute inset-0 w-full h-full object-contain p-14" />}
        </div>
      </section>
    ) : null,

    confiance: sec.confiance?.actif && (sec.confiance.items?.length ?? 0) > 0 ? (
      <section className="py-3.5 overflow-hidden" style={{ backgroundColor: c.texte }}>
        <div className="ax-halo-marquee-track flex items-center w-max text-[13px]" style={{ color: c.fond }}>
          {[...sec.confiance.items, ...sec.confiance.items].map((it, i) => <span key={i} className="flex-shrink-0 px-8 whitespace-nowrap">{it.icone} {it.titre} — {it.texte}</span>)}
        </div>
        <style>{`.ax-halo-marquee-track{animation:axHaloMarquee 25s linear infinite;} .ax-halo-marquee-track:hover{animation-play-state:paused;} @keyframes axHaloMarquee{from{transform:translateX(0);}to{transform:translateX(-50%);}} @media(prefers-reduced-motion:reduce){.ax-halo-marquee-track{animation:none;}}`}</style>
      </section>
    ) : null,

    vedettes: sec.vedettes.actif && vedettes.length > 0 ? (
      <section style={{ padding: "100px 4vw 40px" }}>
        <div className="flex justify-between items-end mb-10">
          <h2 className="text-[32px]">{sec.vedettes.titre}</h2>
          <span className="hidden sm:block text-[13px]" style={{ color: c.texteMuted }}>Survolez pour voir le profil</span>
        </div>
        <HaloProductGrid produits={vedettes} slug={slug} devise={devise} commissionRate={commissionRate} colors={c} />
      </section>
    ) : null,

    collections: sec.collections.actif && collections.length > 0 ? (
      <section style={{ padding: "20px 4vw 40px" }}>
        <h2 className="text-[30px] mb-9">{sec.collections.titre}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {collections.slice(0, 4).map((col) => (
            <Link key={col.slug} href={`/${slug}/collections/${col.slug}`} className="relative overflow-hidden flex items-end p-5" style={{ aspectRatio: "3/4", backgroundColor: c.surface }}>
              {col.imageUrl ? <img src={col.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0" style={{ background: `radial-gradient(120% 90% at 40% 20%, ${c.accent}44, ${c.surface} 70%)` }} />}
              <span className="relative z-10 text-lg" style={{ color: c.texte }}>{col.nom}</span>
            </Link>
          ))}
        </div>
      </section>
    ) : null,

    about: sec.about?.actif ? (
      <section style={{ padding: "70px 4vw" }}>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative overflow-hidden" style={{ aspectRatio: "4/3", background: sec.about.imageUrl ? undefined : `radial-gradient(120% 90% at 40% 20%, ${c.accent}44, ${c.surface} 70%)` }}>
            {sec.about.imageUrl && <img src={sec.about.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          </div>
          <div>
            {sec.about.badgeTexte && <div className="mb-3 text-[12px] font-semibold" style={{ color: c.accent }}>{sec.about.badgeTexte.toUpperCase()}</div>}
            <h3 className="text-[28px] mb-4">{sec.about.titre}</h3>
            <p className="max-w-[42ch]" style={{ color: c.texteMuted }}>{sec.about.texte}</p>
          </div>
        </div>
      </section>
    ) : null,

    promo: sec.promo.actif ? (
      <section style={{ padding: "20px 4vw 70px" }}>
        <div className="text-center py-16 px-8" style={{ backgroundColor: c.surface }}>
          <h2 className="text-[28px] mb-4">{sec.promo.titre}</h2>
          <p className="max-w-xl mx-auto mb-8" style={{ color: c.texteMuted }}>{sec.promo.texte}</p>
          <Link href={`/${slug}/produits`} className="inline-flex px-7 py-3.5 text-sm font-medium" style={{ backgroundColor: c.texte, color: c.fond }}>{sec.promo.ctaTexte}</Link>
        </div>
      </section>
    ) : null,

    faq: sec.faq?.actif && (sec.faq.items?.length ?? 0) > 0 ? (
      <section style={{ padding: "20px 4vw 70px" }}>
        <h2 className="text-[26px] mb-8">{sec.faq.titre}</h2>
        <div className="max-w-2xl space-y-6">{sec.faq.items.map((it, i) => <div key={i}><p className="mb-1.5">{it.question}</p><p className="text-[13.5px]" style={{ color: c.texteMuted }}>{it.reponse}</p></div>)}</div>
      </section>
    ) : null,

    avis: sec.avis.actif && (tenant.avis?.length ?? 0) > 0 ? (
      <section style={{ padding: "20px 4vw 70px" }}>
        <h2 className="text-[26px] mb-9">{sec.avis.titre}</h2>
        <div className="grid sm:grid-cols-3 gap-[2px]" style={{ backgroundColor: c.bordure }}>
          {tenant.avis.slice(0, 6).map((a: any) => (
            <div key={a.id} className="p-6" style={{ backgroundColor: c.fond }}>
              <div className="flex gap-0.5 mb-3">{[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ color: i <= a.note ? c.accent : c.bordure }}>★</span>)}</div>
              {a.titre && <p className="mb-2">{a.titre}</p>}
              {a.commentaire && <p className="text-[13px] mb-3" style={{ color: c.texteMuted }}>{a.commentaire}</p>}
              <p className="text-[12px]" style={{ color: c.texteMuted }}>{a.client?.nom || "Client"}</p>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    newsletter: sec.newsletter.actif ? (
      <section style={{ padding: "20px 4vw 90px" }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-[26px] mb-3">{sec.newsletter.titre}</h2>
          <p className="mb-7" style={{ color: c.texteMuted }}>{sec.newsletter.texte}</p>
          <form method="post" action="/api/newsletter" className="flex flex-col sm:flex-row gap-2 justify-center">
            <input type="email" name="email" placeholder={sec.newsletter.placeholder} className="flex-1 max-w-sm px-4 py-3 text-sm outline-none border" style={{ borderColor: c.bordure, backgroundColor: c.fond }} />
            <button type="submit" className="px-6 py-3 text-sm" style={{ backgroundColor: c.texte, color: c.fond }}>{sec.newsletter.ctaTexte}</button>
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
      <HaloNav tenant={tenant} cfg={cfg} slug={slug} />
      {ordre.map((id) => NODES[id] ? (<div key={id} data-axs-id={id}><ScrollReveal type={revealType(id)} vitesse={vitesse}>{NODES[id]}</ScrollReveal></div>) : null)}
      <div data-axs-id="customSections">
        <CustomSectionsRenderer sections={cfg.customSections ?? []} slug={slug} colors={{ accent: c.accent, texte: c.texte, fond: c.fond }} container="max-w-[1280px]" sectionPy="py-20" />
      </div>
      <HaloFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
