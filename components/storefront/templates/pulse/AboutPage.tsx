import Link from "next/link";
import type { ThemeConfig } from "@/lib/theme-config";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { CustomSectionsRenderer } from "@/components/storefront/CustomSectionsRenderer";
import { PulseNav } from "./Nav";
import { PulseFooter } from "./Footer";

interface Props {
  tenant: any;
  cfg: ThemeConfig;
  slug: string;
}

export function PulseAboutPage({ tenant, cfg, slug }: Props) {
  const c = cfg.colors;
  const aboutPage = cfg.aboutPage;
  const about = cfg.sections.about;

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <PulseNav tenant={tenant} cfg={cfg} slug={slug} />

      <div style={{ padding: "50px 4vw 10px" }}>
        <h1 className="text-[36px] font-bold uppercase">À propos</h1>
        <p className="mt-2 text-sm font-semibold" style={{ color: c.texteMuted }}>
          <Link href={`/${slug}`}>{tenant.nomBoutique}</Link> · À propos
        </p>
      </div>

      {aboutPage?.actif && aboutPage.sections?.length ? (
        <CustomSectionsRenderer sections={aboutPage.sections} slug={slug} colors={{ accent: c.accent, texte: c.texte, fond: c.fond }} container="max-w-[1280px]" sectionPy="py-16" />
      ) : (
        <section style={{ padding: "30px 4vw 80px" }}>
          <div className="max-w-2xl">
            <h2 className="text-[26px] font-bold uppercase mb-4">{about?.titre || "Notre histoire"}</h2>
            <p className="font-medium leading-relaxed" style={{ color: c.texteMuted }}>
              {about?.texte || tenant.description || "Cette boutique n'a pas encore renseigné sa page À propos."}
            </p>
            {about?.stats && about.stats.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-9">
                {about.stats.map((s: any, i: number) => (
                  <div key={i} className="text-center p-4" style={{ border: `2px solid ${c.bordure}` }}>
                    <p className="text-xl font-bold" style={{ color: c.accent }}>{s.valeur}</p>
                    <p className="text-xs mt-1 font-semibold" style={{ color: c.texteMuted }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <PulseFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
