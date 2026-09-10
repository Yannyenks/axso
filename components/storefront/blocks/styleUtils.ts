import type { CSSProperties } from "react";
import type { BlockStyleOverrides } from "@/lib/theme-config";

// Convertit les surcharges de style d'un bloc (BlockStyleOverrides) en objet
// style React — un seul endroit, partagé par tous les conteneurs/widgets du
// constructeur libre. Les champs non renseignés n'écrivent rien (héritage du
// thème conservé). La visibilité par appareil (vague 3) n'est pas encore
// appliquée ici — pour l'instant seul `actif` (afficher/masquer) est lu par
// BlockTreeRenderer.
export function blockStyleToCss(style?: BlockStyleOverrides): CSSProperties {
  if (!style) return {};
  const css: CSSProperties = {};
  if (style.spacing?.pt) css.paddingTop = style.spacing.pt;
  if (style.spacing?.pb) css.paddingBottom = style.spacing.pb;
  if (style.spacing?.pl) css.paddingLeft = style.spacing.pl;
  if (style.spacing?.pr) css.paddingRight = style.spacing.pr;
  if (style.spacing?.mt) css.marginTop = style.spacing.mt;
  if (style.spacing?.mb) css.marginBottom = style.spacing.mb;
  if (style.background?.gradient) css.background = style.background.gradient;
  else if (style.background?.color) css.backgroundColor = style.background.color;
  if (style.background?.image) {
    css.backgroundImage = `url(${style.background.image})`;
    css.backgroundSize = "cover";
    css.backgroundPosition = "center";
  }
  if (style.typography?.color) css.color = style.typography.color;
  if (style.typography?.taille) css.fontSize = style.typography.taille;
  if (style.typography?.poids) css.fontWeight = style.typography.poids as any;
  if (style.typography?.align) css.textAlign = style.typography.align;
  if (style.border?.radius) css.borderRadius = style.border.radius;
  if (style.border?.width && style.border?.color) css.border = `${style.border.width} solid ${style.border.color}`;
  if (style.width) css.flexBasis = style.width;
  return css;
}
