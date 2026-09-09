import Link from "next/link";
import { Star } from "lucide-react";
import { SectionCountdown } from "@/components/storefront/SectionCountdown";
import { SectionTabs } from "@/components/storefront/SectionTabs";
import type { CustomSection, ThemeColors } from "@/lib/theme-config";

// Bibliothèque de sections custom réutilisable — extraite telle quelle de
// app/(storefront)/[slug]/page.tsx (accueil) pour être partagée avec les
// nouvelles pages À propos / Contact (mêmes blocs : features, stats,
// countdown, brands, video, gallery, social-proof, spacer, richtext,
// cta-band, tabs, columns). Extraction pure — aucun changement de rendu.
interface Props {
  sections: CustomSection[];
  slug: string;
  colors: Pick<ThemeColors, "accent" | "texte" | "fond">;
  container: string;
  sectionPy: string;
}

export function CustomSectionsRenderer({ sections, slug, colors: c, container: CONTAINER, sectionPy: SECTION_PY }: Props) {
  return (
    <>
      {(sections ?? []).filter((s: any) => s.actif !== false).sort((a: any, b: any) => (a.ordre ?? 99) - (b.ordre ?? 99)).map((section: any) => {
        if (section.type === "features") {
          return (
            <section key={section.id} data-axs-id={section.id} className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <section key={section.id} data-axs-id={section.id} className={SECTION_PY}>
              <div className={`${CONTAINER} mx-auto px-4 sm:px-6 lg:px-8`}>
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
            <section key={section.id} data-axs-id={section.id} className="py-14 sm:py-20" style={{ background: `${c.accent}08` }}>
              <div className={`${CONTAINER} mx-auto px-4 sm:px-6 lg:px-8`}>
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
            <section key={section.id} data-axs-id={section.id} className="py-16" style={{ background: c.accent }}>
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
            <section key={section.id} data-axs-id={section.id} className="py-16 max-w-3xl mx-auto px-4">
              {section.config?.titre && <h2 className="text-2xl font-bold font-playfair mb-6" style={{ color: c.texte }}>{section.config.titre}</h2>}
              {section.config?.texte && <div className="prose prose-sm max-w-none" style={{ color: c.texte, opacity: 0.75 }}>{section.config.texte}</div>}
            </section>
          );
        }
        if (section.type === "countdown") {
          return (
            <SectionCountdown key={section.id} data-axs-id={section.id} slug={slug} accent={c.accent} texte={c.texte}
              titre={section.config?.titre} texteDesc={section.config?.texte}
              dateFin={section.config?.dateFin} ctaTexte={section.config?.ctaTexte} />
          );
        }
        if (section.type === "brands") {
          const logos: string[] = (section.config?.logos ?? []).filter(Boolean);
          if (!logos.length) return null;
          return (
            <section key={section.id} data-axs-id={section.id} className="py-14">
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
            <section key={section.id} data-axs-id={section.id} className={SECTION_PY}>
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
            <section key={section.id} data-axs-id={section.id} className="py-10" style={{ background: `${c.accent}06` }}>
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
          return <div key={section.id} data-axs-id={section.id} style={{ height: section.config?.hauteur || "80px" }} />;
        }
        if (section.type === "tabs") {
          return <SectionTabs key={section.id} data-axs-id={section.id} titre={section.config?.titre} onglets={section.config?.onglets ?? []} accent={c.accent} texte={c.texte} />;
        }
        if (section.type === "columns") {
          const colonnes: any[] = section.config?.colonnes ?? [];
          if (!colonnes.length) return null;
          const nb = section.config?.nombreColonnes || colonnes.length;
          return (
            <section key={section.id} data-axs-id={section.id} className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
    </>
  );
}
