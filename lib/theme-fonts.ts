// ─── Catalogue de polices Google Fonts — partagé entre le builder (aperçu) et
// la boutique en ligne (rendu réel), pour que les deux ne divergent jamais.
export const FONTS = [
  { cat: "Sans-serif", v: "inter",             label: "Inter",              gf: "Inter:wght@400;500;600;700" },
  { cat: "Sans-serif", v: "poppins",           label: "Poppins",            gf: "Poppins:wght@400;600;700;800" },
  { cat: "Sans-serif", v: "dm-sans",           label: "DM Sans",            gf: "DM+Sans:wght@400;600;700" },
  { cat: "Sans-serif", v: "outfit",            label: "Outfit",             gf: "Outfit:wght@400;600;700;800" },
  { cat: "Sans-serif", v: "nunito",            label: "Nunito",             gf: "Nunito:wght@400;600;700;800" },
  { cat: "Sans-serif", v: "plus-jakarta-sans", label: "Plus Jakarta Sans",  gf: "Plus+Jakarta+Sans:wght@400;600;700;800" },
  { cat: "Sans-serif", v: "montserrat",        label: "Montserrat",         gf: "Montserrat:wght@400;600;700;800" },
  { cat: "Sans-serif", v: "raleway",           label: "Raleway",            gf: "Raleway:wght@400;600;700;800" },
  { cat: "Sans-serif", v: "space-grotesk",     label: "Space Grotesk",      gf: "Space+Grotesk:wght@400;600;700" },
  { cat: "Sans-serif", v: "syne",              label: "Syne",               gf: "Syne:wght@400;700;800" },
  { cat: "Serif",      v: "playfair",          label: "Playfair Display",   gf: "Playfair+Display:wght@400;700" },
  { cat: "Serif",      v: "cormorant",         label: "Cormorant Garamond", gf: "Cormorant+Garamond:wght@400;600;700" },
  { cat: "Serif",      v: "lora",              label: "Lora",               gf: "Lora:wght@400;600;700" },
  { cat: "Serif",      v: "libre-baskerville", label: "Libre Baskerville",  gf: "Libre+Baskerville:wght@400;700" },
  { cat: "Serif",      v: "eb-garamond",       label: "EB Garamond",        gf: "EB+Garamond:wght@400;600;700" },
  { cat: "Display",    v: "josefin-sans",      label: "Josefin Sans",       gf: "Josefin+Sans:wght@400;600;700" },
  { cat: "Display",    v: "italiana",          label: "Italiana",           gf: "Italiana" },
  { cat: "Display",    v: "cinzel",            label: "Cinzel",             gf: "Cinzel:wght@400;600;700" },
  { cat: "Display",    v: "abril-fatface",     label: "Abril Fatface",      gf: "Abril+Fatface" },
  { cat: "Display",    v: "fraunces",          label: "Fraunces",           gf: "Fraunces:wght@400;700;900" },
] as const;

export interface StorefrontFontsCfg {
  titre?: string;
  corps?: string;
  poidsTitre?: string;
  tailleBase?: string;
  lettreEspacement?: string;
  hauteurLigne?: string;
  transformTitre?: string;
}

const LETTRE_MAP: Record<string, string> = { tight: "-0.01em", normal: "normal", wide: "0.02em", ultra: "0.06em" };
const LIGNE_MAP: Record<string, string> = { compact: "1.2", normal: "1.5", relaxed: "1.8" };

export function fontEntry(v?: string) {
  return FONTS.find((f) => f.v === v) || null;
}

// URL Google Fonts combinée pour les polices titre + corps (dédupliquée).
export function googleFontsHref(fonts: StorefrontFontsCfg): string {
  const families: string[] = [];
  const seen = new Set<string>();
  for (const v of [fonts.titre, fonts.corps]) {
    const f = fontEntry(v);
    if (f && !seen.has(f.gf)) { seen.add(f.gf); families.push(f.gf); }
  }
  return families.length ? `https://fonts.googleapis.com/css2?${families.map((gf) => `family=${gf}`).join("&")}&display=swap` : "";
}

// Génère le CSS de typographie. Sans scopeSelector : cible tout le document
// (utilisé dans l'iframe isolée de l'aperçu du builder). Avec scopeSelector
// (ex. ".axs-store") : cible uniquement les descendants de ce sélecteur, pour
// s'appliquer à la boutique en ligne sans affecter le dashboard.
export function typographyCss(fonts: StorefrontFontsCfg | undefined, scopeSelector?: string): string {
  if (!fonts) return "";
  const titre = fontEntry(fonts.titre)?.label || "Playfair Display";
  const corps = fontEntry(fonts.corps)?.label || "Poppins";
  const poids = fonts.poidsTitre || "700";
  const taille = fonts.tailleBase || "16px";
  const lettreEsp = LETTRE_MAP[fonts.lettreEspacement || "normal"] ?? "normal";
  const ligne = LIGNE_MAP[fonts.hauteurLigne || "normal"] ?? "1.5";
  const transform = fonts.transformTitre && fonts.transformTitre !== "none" ? fonts.transformTitre : "none";

  const base = scopeSelector ? scopeSelector : "body";
  const all = scopeSelector ? `${scopeSelector}, ${scopeSelector} *` : "*";
  const headings = scopeSelector
    ? `${scopeSelector} h1, ${scopeSelector} h2, ${scopeSelector} h3, ${scopeSelector} h4, ${scopeSelector} .font-playfair`
    : `h1, h2, h3, h4, .font-playfair`;

  return (
    `${all}{font-family:'${corps}',sans-serif!important;}` +
    `${headings}{font-family:'${titre}',serif!important;font-weight:${poids}!important;text-transform:${transform}!important;}` +
    `${base}{font-size:${taille};line-height:${ligne};letter-spacing:${lettreEsp};}`
  );
}
