import Link from "next/link";
import type { ThemeConfig } from "@/lib/theme-config";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { CustomSectionsRenderer } from "@/components/storefront/CustomSectionsRenderer";
import { OrfevreNav } from "./Nav";
import { OrfevreFooter } from "./Footer";

interface Props { tenant: any; cfg: ThemeConfig; slug: string }

export function OrfevreAboutPage({ tenant, cfg, slug }: Props) {
  const c = cfg.colors;
  const aboutPage = cfg.aboutPage;
  const about = cfg.sections.about;

  return (
    <div style={{ backgroundColor: c.fond, color: c.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <OrfevreNav tenant={tenant} cfg={cfg} slug={slug} />
      <div style={{ padding: "50px 4vw 10px" }}>
        <h1 className="text-[34px] italic" style={{ fontWeight: 400 }}>À propos</h1>
        <p className="mt-2 text-sm uppercase tracking-wide" style={{ color: c.texteMuted }}><Link href={`/${slug}`}>{tenant.nomBoutique}</Link> · À propos</p>
      </div>
      {aboutPage?.actif && aboutPage.sections?.length ? (
        <CustomSectionsRenderer sections={aboutPage.sections} slug={slug} colors={{ accent: c.accent, texte: c.texte, fond: c.fond }} container="max-w-[1280px]" sectionPy="py-16" />
      ) : (
        <section style={{ padding: "30px 4vw 80px" }}>
          <div className="max-w-2xl">
            <h2 className="text-[24px] italic mb-4" style={{ fontWeight: 400 }}>{about?.titre || "Notre histoire"}</h2>
            <p className="leading-loose" style={{ color: c.texteMuted }}>{about?.texte || tenant.description || "Cette boutique n'a pas encore renseigné sa page À propos."}</p>
          </div>
        </section>
      )}
      <OrfevreFooter tenant={tenant} cfg={cfg} slug={slug} />
    </div>
  );
}
