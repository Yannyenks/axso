import { prisma } from "@/lib/prisma";
import { THEME_DEFAULTS, resolveThemeConfig, type ThemeConfig } from "@/lib/theme-config";

export async function resolveThemeConfigAsync(
  themeId: string,
  tenantId: string,
  savedConfig: Record<string, any> = {}
): Promise<ThemeConfig> {
  // Builtin theme — use sync resolver
  if (THEME_DEFAULTS[themeId]) {
    return resolveThemeConfig(themeId, savedConfig);
  }

  // Custom theme stored in DB
  const dbTheme = await prisma.theme.findFirst({
    where: { id: themeId, tenantId },
  });

  if (!dbTheme) {
    // Fallback to default
    return resolveThemeConfig("terre-et-or", savedConfig);
  }

  const dbConfig = dbTheme.config as Record<string, any>;
  const baseThemeId = dbConfig.baseThemeId || "terre-et-or";
  const base = THEME_DEFAULTS[baseThemeId] || THEME_DEFAULTS["terre-et-or"];

  return {
    ...base,
    colors: { ...base.colors, ...(dbConfig.colors || {}) },
    fonts: { ...base.fonts, ...(dbConfig.fonts || {}) },
    radius: dbConfig.radius || base.radius,
    layout: { ...base.layout, ...(dbConfig.layout || {}) },
    boutons: { ...base.boutons, ...(dbConfig.boutons || {}) },
    navigationStyle: { ...base.navigationStyle, ...(dbConfig.navigationStyle || {}) },
    customCss: dbConfig.customCss || base.customCss,
    sections: {
      annonce: { ...base.sections.annonce, ...(dbConfig.sections?.annonce || {}) },
      hero: { ...base.sections.hero, ...(dbConfig.sections?.hero || {}) },
      vedettes: { ...base.sections.vedettes, ...(dbConfig.sections?.vedettes || {}) },
      collections: { ...base.sections.collections, ...(dbConfig.sections?.collections || {}) },
      promo: { ...base.sections.promo, ...(dbConfig.sections?.promo || {}) },
      avis: { ...base.sections.avis, ...(dbConfig.sections?.avis || {}) },
      newsletter: { ...base.sections.newsletter, ...(dbConfig.sections?.newsletter || {}) },
      confiance: dbConfig.sections?.confiance ?? base.sections.confiance,
      about: dbConfig.sections?.about ?? base.sections.about,
      faq: dbConfig.sections?.faq ?? base.sections.faq,
    },
    builderHtml: savedConfig.builderHtml || dbConfig.builderHtml,
    builderCss: savedConfig.builderCss || dbConfig.builderCss,
  };
}

export { resolveThemeConfig };
