// ─── Thèmes "premium" — familles structurelles ────────────────────────────────
// Contrairement aux thèmes classiques (lib/theme-config.ts), ces thèmes ont
// chacun leur PROPRE arbre de rendu (components/storefront/templates/<id>/),
// fidèle à une maquette HTML fournie par le marchand. Ils restent néanmoins
// des `ThemeConfig` complets et normaux : le constructeur (/dashboard/builder)
// les édite exactement comme les thèmes classiques (couleurs, polices,
// sections actif/ordre, animations, boutons, customCss...) — seule la mise en
// page structurelle de chaque section est figée par le thème plutôt que
// pilotée par les enums de layout (hero.style, confiance.layout hors
// "marquee", collections.layout, about.layout...), qui sont ignorés par ces
// rendus premium.
import type { ThemeConfig } from "@/lib/theme-config";

export interface TemplateMeta {
  nom: string;
  description: string;
  categorie: string;
  badge?: string;
}

// ─── Métadonnées galerie (/dashboard/themes) ──────────────────────────────────
export const TEMPLATE_META: Record<string, TemplateMeta> = {
  "noir-atelier": {
    nom: "Noir Atelier",
    description: "Mode & artisanat — grille éditoriale sombre, art vectoriel façon croquis, ambiance atelier de couture.",
    categorie: "Mode",
    badge: "Nouveau",
  },
  "pulse": {
    nom: "Pulse",
    description: "Sport & sneakers — hero en diagonale, galerie produit qui change de photo au survol, énergie affirmée.",
    categorie: "Sport",
    badge: "Nouveau",
  },
};

const DEFAULT_ANIM_BASE = {
  parallax: false,
  smoothScroll: true,
  stagger: true,
  sectionAnimations: {
    hero: "fade-in", confiance: "fade-in", vedettes: "slide-up", collections: "zoom-in",
    about: "slide-left", promo: "fade-in", faq: "fade-in", avis: "slide-up", newsletter: "fade-in",
  } as Record<string, string>,
};

// ─── Définitions ───────────────────────────────────────────────────────────────
export const TEMPLATE_DEFAULTS: Record<string, ThemeConfig> = {
  "noir-atelier": {
    colors: {
      fond: "#F3F0E9",
      accent: "#5C1420",
      accentSecondaire: "#A9824F",
      texte: "#15131A",
      texteMuted: "#948E82",
      surface: "#F3F0E9",
      bordure: "rgba(21,19,26,0.14)",
    },
    fonts: { titre: "fraunces", corps: "archivo-narrow", poidsTitre: "400", transformTitre: "none", lettreEspacement: "normal", hauteurLigne: "normal" },
    radius: "0px",
    layout: { largeurContainer: "1280px", paddingSection: "lg", colonnesProduits: 3, colonnesMobile: 2, styleCarte: "bordered", ombre: "sm" },
    boutons: { style: "filled", taille: "md", hover: "darken", bordureWidth: "1px" },
    navigationStyle: { type: "classic", style: "light", sticky: true, hauteur: "70px", showSearch: true, showWishlist: false },
    animations: { global: "fade-in", vitesse: "normal", preset: "luxury", ...DEFAULT_ANIM_BASE },
    sections: {
      annonce: { actif: false, texte: "Livraison offerte dès 250 000 XAF · Retours sous 30 jours", couleurFond: "#15131A", couleurTexte: "#F3F0E9" },
      hero: {
        actif: true, style: "split", titre: "La matière avant l'ornement",
        sousTitre: "Une sélection resserrée de pièces façonnées à la main, pensées pour durer plus d'une saison. Douze silhouettes, aucune répétition.",
        ctaTexte: "Découvrir la collection", ctaLien: "produits", overlay: 45, hauteur: "80vh", textPosition: "left",
        badgeTexte: "Collection Automne — Pièce 001",
      },
      confiance: {
        actif: true, layout: "marquee",
        items: [
          { icone: "✦", titre: "Livraison offerte", texte: "Dès 250 000 XAF" },
          { icone: "✦", titre: "Retours faciles", texte: "Sous 30 jours" },
          { icone: "✦", titre: "Petite série", texte: "Fabrication artisanale" },
        ],
      },
      vedettes: { actif: true, titre: "Pièces de la semaine", nombre: 8, triPar: "ventes", colonnes: 3, layout: "grid", showRatings: false, showSoldCount: false },
      collections: { actif: true, titre: "Nos Univers", layout: "grid" },
      about: {
        actif: true, layout: "image-left",
        titre: "Chaque pièce porte la main de celui qui l'a faite",
        texte: "Nos ateliers travaillent en série limitée avec des artisans installés depuis plus de vingt ans dans leur métier. Rien n'est produit avant d'être vendu — nous coupons ce que la demande justifie, pas ce que le calendrier impose.",
        badgeTexte: "Savoir-faire",
      },
      promo: { actif: true, titre: "Nouvelle saison", texte: "Des pièces pensées pour durer, au-delà des tendances.", ctaTexte: "Découvrir", style: "solid" },
      faq: { actif: false, titre: "Questions fréquentes", layout: "accordion", items: [
        { question: "Quels sont vos délais de livraison ?", reponse: "Nous livrons sous 48 à 72h pour les commandes passées avant 14h." },
        { question: "Comment retourner un article ?", reponse: "Vous disposez de 30 jours pour retourner un article, sans justification." },
      ] },
      avis: { actif: true, titre: "Ce qu'on en dit", layout: "cards" },
      newsletter: { actif: false, titre: "Restez informé", texte: "Nos nouvelles pièces, sans spam.", placeholder: "votre@email.com", ctaTexte: "S'abonner", style: "centered" },
    },
  },

  "pulse": {
    colors: {
      fond: "#F4F3EF",
      accent: "#FF5B1E",
      accentSecondaire: "#1440E0",
      texte: "#0E0E12",
      texteMuted: "#63636B",
      surface: "#EAE8E2",
      bordure: "rgba(14,14,18,0.14)",
    },
    fonts: { titre: "space-grotesk", corps: "archivo", poidsTitre: "700", transformTitre: "uppercase", lettreEspacement: "tight", hauteurLigne: "normal" },
    radius: "0px",
    layout: { largeurContainer: "1280px", paddingSection: "lg", colonnesProduits: 3, colonnesMobile: 2, styleCarte: "flat", ombre: "none" },
    boutons: { style: "filled", taille: "md", hover: "scale", bordureWidth: "2px" },
    navigationStyle: { type: "classic", style: "light", sticky: true, hauteur: "70px", showSearch: true, showWishlist: false },
    animations: { global: "slide-up", vitesse: "fast", preset: "dynamic", ...DEFAULT_ANIM_BASE },
    sections: {
      annonce: { actif: false, texte: "Nouveau drop chaque vendredi · Livraison express 24h", couleurFond: "#0E0E12", couleurTexte: "#F4F3EF" },
      hero: {
        actif: true, style: "split", titre: "Chaque foulée compte.",
        sousTitre: "Conçues à partir de données de course réelles, ajustées pour la propulsion, pas pour le marketing. Douze coloris, un seul objectif : aller plus vite.",
        ctaTexte: "Voir le drop", ctaLien: "produits", overlay: 0, hauteur: "80vh", textPosition: "left",
        badgeTexte: "Drop 014 — Disponible maintenant",
        showSecondCta: true, secondCtaTexte: "Fiche produit", secondCtaLien: "produits",
      },
      confiance: {
        actif: true, layout: "marquee",
        items: [
          { icone: "⚡", titre: "Nouveau drop", texte: "Chaque vendredi" },
          { icone: "🚚", titre: "Livraison express", texte: "Sous 24h" },
          { icone: "👟", titre: "Essayage virtuel", texte: "Disponible" },
        ],
      },
      vedettes: { actif: true, titre: "Drop de la semaine", nombre: 8, triPar: "featured", colonnes: 3, layout: "grid", showRatings: false, showSoldCount: true },
      collections: { actif: true, titre: "Terrains de jeu", layout: "grid" },
      about: {
        actif: false, layout: "image-left",
        titre: "Notre ingénierie", texte: "Chaque paire est testée en conditions réelles avant validation.",
        badgeTexte: "Coulisses",
      },
      promo: { actif: true, titre: "Nouveau drop", texte: "Disponible en édition limitée, chaque vendredi.", ctaTexte: "Voir le drop", style: "gradient" },
      faq: { actif: false, titre: "Questions fréquentes", layout: "accordion", items: [
        { question: "Comment choisir ma taille ?", reponse: "Consultez notre guide des tailles sur la fiche produit — nos coupes sont fidèles à la pointure standard." },
        { question: "Livrez-vous en 24h partout ?", reponse: "La livraison express 24h est disponible dans les grandes villes ; comptez 48-72h ailleurs." },
      ] },
      avis: { actif: true, titre: "Note coureurs", layout: "cards" },
      newsletter: { actif: false, titre: "Ne manque aucun drop", texte: "Sois prévenu avant tout le monde.", placeholder: "votre@email.com", ctaTexte: "S'abonner", style: "centered" },
    },
  },
};

export const TEMPLATE_IDS: ReadonlySet<string> = new Set(Object.keys(TEMPLATE_DEFAULTS));

// Thèmes classiques historiques conservés dans la gamme "principale" en plus
// des thèmes premium — les autres classiques restent définis dans
// THEME_DEFAULTS (lib/theme-config.ts) pour ne rien casser chez les tenants
// qui les ont déjà, mais ne sont plus proposés à la sélection.
export const LEGACY_CLASSIC_IDS_KEPT = ["terre-et-or", "noir-obsidien"] as const;

export const PRINCIPAL_THEME_IDS: string[] = [...LEGACY_CLASSIC_IDS_KEPT, ...TEMPLATE_IDS];
