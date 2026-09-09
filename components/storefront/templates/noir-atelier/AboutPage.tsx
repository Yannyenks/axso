import Link from "next/link";
import type { ThemeConfig } from "@/lib/theme-config";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { CustomSectionsRenderer } from "@/components/storefront/CustomSectionsRenderer";
import { NoirAtelierNav } from "./Nav";
import { NoirAtelierFooter } from "./Footer";
import { GrainFilterDefs } from "./GrainFilterDefs";

interface Props {
  tenant: any;
  cfg: ThemeConfig;
  slug: string;
}

export function NoirAtelierAboutPage({ tenant, cfg, slug }: Props) {
  const c = cfg.colors;
  const aboutPage = cfg.aboutPage;
  const about = cfg.sections.about;

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh", fontFamily: "'Fraunces',serif" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <GrainFilterDefs />
      <NoirAtelierNav tenant={tenant} cfg={cfg} slug={slug} />

      <div style={{ padding: "50px 4vw 10px" }}>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 400 }}>À propos</h1>
        <p className="mt-2 text-sm" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>
          <Link href={`/${slug}`}>{tenant.nomBoutique}</Link> · À propos
        </p>
      </div>

      {aboutPage?.actif && aboutPage.sections?.length ? (
        <CustomSectionsRenderer sections={aboutPage.sections} slug={slug} colors={{ accent: c.accent, texte: c.texte, fond: c.fond }} container="max-w-[1280px]" sectionPy="py-16" />
      ) : (
        <section style={{ padding: "30px 4vw 80px" }}>
          <div className="max-w-2xl">
            <h2 className="text-[26px] mb-4" style={{ fontFamily: "'Fraunces',serif", fontWeight: 400 }}>{about?.titre || "Notre histoire"}</h2>
            <p style={{ fontFamily: "'Archivo Narrow',sans-serif", fontSize: 14.5, lineHeight: 1.75, color: c.texteMuted }}>
              {about?.texte || tenant.description || "Cette boutique n'a pas encore renseigné sa page À propos."}
            </p>
            {about?.stats && about.stats.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-9">
                {about.stats.map((s: any, i: number) => (
                  <div key={i} className="text-center p-4" style={{ border: `1px solid ${c.bordure}` }}>
                    <p style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: c.accent }}>{s.valeur}</p>
                    <p className="text-xs mt-1" style={{ fontFamily: "'Archivo Narrow',sans-serif", color: c.texteMuted }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <NoirAtelierFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
