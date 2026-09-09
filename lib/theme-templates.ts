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
  "archive01": {
    nom: "Archive01",
    description: "Streetwear & séries limitées — typographie massive, ambiance drop, violet sur noir.",
    categorie: "Mode urbaine",
    badge: "Nouveau",
  },
  "halo": {
    nom: "Halo",
    description: "Lunetterie & optique — ambiance claire et chaleureuse, essai virtuel, élégance discrète.",
    categorie: "Optique",
    badge: "Nouveau",
  },
  "cru": {
    nom: "Cru",
    description: "Vins & spiritueux — élégance sombre, typographie italique, ambiance cave à vin.",
    categorie: "Gastronomie",
    badge: "Nouveau",
  },
  "atlas": {
    nom: "Atlas",
    description: "Bagagerie & accessoires de voyage — ambiance claire et technique, esprit ingénierie.",
    categorie: "Voyage",
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

  "archive01": {
    colors: {
      fond: "#0A0A0A",
      accent: "#7C3AED",
      accentSecondaire: "#8C8C8C",
      texte: "#F2F2F0",
      texteMuted: "#8C8C8C",
      surface: "#151515",
      bordure: "rgba(242,242,240,0.14)",
    },
    fonts: { titre: "anton", corps: "archivo", poidsTitre: "400", transformTitre: "uppercase", lettreEspacement: "normal", hauteurLigne: "normal" },
    radius: "0px",
    layout: { largeurContainer: "1280px", paddingSection: "lg", colonnesProduits: 4, colonnesMobile: 2, styleCarte: "flat", ombre: "none" },
    boutons: { style: "filled", taille: "md", hover: "scale", bordureWidth: "2px" },
    navigationStyle: { type: "classic", style: "dark", sticky: true, hauteur: "66px", showSearch: true, showWishlist: false },
    animations: { global: "zoom-in", vitesse: "fast", preset: "dynamic", ...DEFAULT_ANIM_BASE },
    sections: {
      annonce: { actif: false, texte: "Série limitée · 200 pièces numérotées", couleurFond: "#7C3AED", couleurTexte: "#F2F2F0" },
      hero: {
        actif: true, style: "split", titre: "Drop 014.",
        sousTitre: "Série limitée, numérotée, imprimée en petite quantité. Une fois écoulée, elle ne revient pas.",
        ctaTexte: "Voir le drop", ctaLien: "produits", overlay: 0, hauteur: "100vh", textPosition: "left",
        badgeTexte: "Drop 014",
      },
      confiance: {
        actif: true, layout: "marquee",
        items: [
          { icone: "◆", titre: "Série limitée", texte: "200 pièces numérotées" },
          { icone: "◆", titre: "Impression locale", texte: "Fabriquée à la demande" },
          { icone: "◆", titre: "Livraison rapide", texte: "Sous 48h-72h" },
        ],
      },
      vedettes: { actif: true, titre: "Archive complète", nombre: 8, triPar: "recent", colonnes: 4, layout: "grid", showRatings: false, showSoldCount: false },
      collections: { actif: true, titre: "Collections", layout: "grid" },
      about: {
        actif: false, layout: "image-left",
        titre: "Conçu en petites séries", texte: "Chaque pièce est imprimée et cousue en quantité limitée, jamais réimprimée à l'identique.",
        badgeTexte: "L'atelier",
      },
      promo: { actif: true, titre: "Prochain drop bientôt", texte: "Inscris-toi pour être prévenu en premier.", ctaTexte: "Voir la boutique", style: "solid" },
      faq: { actif: false, titre: "Questions fréquentes", layout: "accordion", items: [
        { question: "Les pièces reviennent-elles en stock ?", reponse: "Non — chaque drop est produit en quantité limitée et n'est jamais réimprimé à l'identique." },
        { question: "Quels sont les délais de livraison ?", reponse: "Comptez 48 à 72h selon votre ville." },
      ] },
      avis: { actif: true, titre: "Ce qu'ils en pensent", layout: "cards" },
      newsletter: { actif: false, titre: "Ne rate aucun drop", texte: "Sois prévenu avant tout le monde des prochaines sorties.", placeholder: "votre@email.com", ctaTexte: "S'abonner", style: "centered" },
    },
  },

  "halo": {
    colors: {
      fond: "#F5F0E8",
      accent: "#A9672E",
      accentSecondaire: "#8A8075",
      texte: "#241F1A",
      texteMuted: "#8A8075",
      surface: "#EAE1D2",
      bordure: "rgba(36,31,26,0.14)",
    },
    fonts: { titre: "domine", corps: "sora", poidsTitre: "600", transformTitre: "none", lettreEspacement: "normal", hauteurLigne: "normal" },
    radius: "0px",
    layout: { largeurContainer: "1280px", paddingSection: "lg", colonnesProduits: 3, colonnesMobile: 2, styleCarte: "flat", ombre: "none" },
    boutons: { style: "outlined", taille: "md", hover: "darken", bordureWidth: "1px" },
    navigationStyle: { type: "classic", style: "light", sticky: true, hauteur: "70px", showSearch: true, showWishlist: false },
    animations: { global: "fade-in", vitesse: "normal", preset: "elegant", ...DEFAULT_ANIM_BASE },
    sections: {
      annonce: { actif: false, texte: "Essai virtuel en 30 secondes · Verres antireflet inclus", couleurFond: "#241F1A", couleurTexte: "#F5F0E8" },
      hero: {
        actif: true, style: "split", titre: "Voir clair commence par bien voir",
        sousTitre: "Montures en acétate italien, verres antireflet inclus, essai virtuel avant achat. Livrées prêtes à porter en 5 jours.",
        ctaTexte: "Faire l'essai virtuel", ctaLien: "produits", overlay: 0, hauteur: "80vh", textPosition: "left",
        badgeTexte: "Collection Archive",
      },
      confiance: {
        actif: true, layout: "marquee",
        items: [
          { icone: "◆", titre: "Essai virtuel", texte: "En 30 secondes" },
          { icone: "◆", titre: "Verres antireflet", texte: "Inclus" },
          { icone: "◆", titre: "Retours faciles", texte: "Sous 30 jours" },
        ],
      },
      vedettes: { actif: true, titre: "Montures signature", nombre: 6, triPar: "featured", colonnes: 3, layout: "grid", showRatings: false, showSoldCount: false },
      collections: { actif: true, titre: "Nos collections", layout: "grid" },
      about: {
        actif: false, layout: "image-left",
        titre: "Taillés pour durer", texte: "Charnières à ressort, acétate italien, verres taillés sur mesure.",
        badgeTexte: "Savoir-faire",
      },
      promo: { actif: true, titre: "Nouveauté", texte: "Découvrez notre dernière collection de montures.", ctaTexte: "Découvrir", style: "solid" },
      faq: { actif: false, titre: "Questions fréquentes", layout: "accordion", items: [
        { question: "Comment fonctionne l'essai virtuel ?", reponse: "Activez votre caméra sur la fiche produit pour voir la monture sur votre visage en direct." },
        { question: "Puis-je ajouter ma correction ?", reponse: "Oui, renseignez votre ordonnance à l'étape du panier." },
      ] },
      avis: { actif: true, titre: "Avis clients", layout: "cards" },
      newsletter: { actif: false, titre: "Restez informé", texte: "Nos nouvelles montures, sans spam.", placeholder: "votre@email.com", ctaTexte: "S'abonner", style: "centered" },
    },
  },

  "cru": {
    colors: {
      fond: "#1B0E12",
      accent: "#B8935A",
      accentSecondaire: "#7A1A32",
      texte: "#F3EAE0",
      texteMuted: "#8f7d78",
      surface: "#28151B",
      bordure: "rgba(243,234,224,0.13)",
    },
    fonts: { titre: "spectral", corps: "nunito-sans", poidsTitre: "400", transformTitre: "none", lettreEspacement: "normal", hauteurLigne: "relaxed" },
    radius: "0px",
    layout: { largeurContainer: "1280px", paddingSection: "xl", colonnesProduits: 3, colonnesMobile: 2, styleCarte: "flat", ombre: "none" },
    boutons: { style: "outlined", taille: "md", hover: "darken", bordureWidth: "1px" },
    navigationStyle: { type: "classic", style: "dark", sticky: true, hauteur: "72px", showSearch: true, showWishlist: false },
    animations: { global: "fade-in", vitesse: "slow", preset: "luxury", ...DEFAULT_ANIM_BASE },
    sections: {
      annonce: { actif: false, texte: "Sélection vignerons indépendants · Livraison en caisse bois", couleurFond: "#7A1A32", couleurTexte: "#F3EAE0" },
      hero: {
        actif: true, style: "split", titre: "Le temps ne se falsifie pas",
        sousTitre: "Sélection directe auprès de vignerons indépendants. Chaque bouteille est tracée du terroir jusqu'à votre cave.",
        ctaTexte: "Voir la cave", ctaLien: "produits", overlay: 0, hauteur: "80vh", textPosition: "left",
        badgeTexte: "Millésime 2021",
      },
      confiance: {
        actif: true, layout: "marquee",
        items: [
          { icone: "◆", titre: "Vignerons indépendants", texte: "Sélection directe" },
          { icone: "◆", titre: "Caisse bois", texte: "Livraison soignée" },
          { icone: "◆", titre: "Dégustation", texte: "Sur rendez-vous" },
        ],
      },
      vedettes: { actif: true, titre: "Ce que le temps a fait", nombre: 6, triPar: "featured", colonnes: 3, layout: "grid", showRatings: false, showSoldCount: false },
      collections: { actif: true, titre: "La cave", layout: "grid" },
      about: {
        actif: false, layout: "image-left",
        titre: "Un métier de patience", texte: "Élevage en fût de chêne, mise en bouteille au domaine, traçabilité complète.",
        badgeTexte: "Notre sélection",
      },
      promo: { actif: true, titre: "Coffrets dégustation", texte: "Découvrez nos sélections en coffret, idéales pour offrir.", ctaTexte: "Découvrir", style: "solid" },
      faq: { actif: false, titre: "Questions fréquentes", layout: "accordion", items: [
        { question: "Comment conserver mes bouteilles ?", reponse: "À l'abri de la lumière, entre 12 et 16°C, couché pour les bouchons liège." },
        { question: "Livrez-vous en caisse bois ?", reponse: "Oui, toutes nos commandes de 6 bouteilles ou plus sont expédiées en caisse bois protectrice." },
      ] },
      avis: { actif: true, titre: "Ce qu'ils en disent", layout: "cards" },
      newsletter: { actif: false, titre: "Nouveaux arrivages", texte: "Soyez informé de nos nouvelles cuvées.", placeholder: "votre@email.com", ctaTexte: "S'abonner", style: "centered" },
    },
  },

  "atlas": {
    colors: {
      fond: "#EDEDEA",
      accent: "#D9622B",
      accentSecondaire: "#B8B8B4",
      texte: "#1B1B1E",
      texteMuted: "#83837E",
      surface: "#E0E0DB",
      bordure: "rgba(27,27,30,0.14)",
    },
    fonts: { titre: "public-sans", corps: "space-mono", poidsTitre: "800", transformTitre: "none", lettreEspacement: "tight", hauteurLigne: "normal" },
    radius: "0px",
    layout: { largeurContainer: "1280px", paddingSection: "lg", colonnesProduits: 3, colonnesMobile: 2, styleCarte: "flat", ombre: "none" },
    boutons: { style: "filled", taille: "md", hover: "darken", bordureWidth: "2px" },
    navigationStyle: { type: "classic", style: "light", sticky: true, hauteur: "68px", showSearch: true, showWishlist: false },
    animations: { global: "slide-up", vitesse: "normal", preset: "dynamic", ...DEFAULT_ANIM_BASE },
    sections: {
      annonce: { actif: false, texte: "Garantie 10 ans · Suivi GPS en option", couleurFond: "#1B1B1E", couleurTexte: "#EDEDEA" },
      hero: {
        actif: true, style: "split", titre: "Bâtie pour l'usure, pas pour la vitrine",
        sousTitre: "Coque polycarbonate 100% recyclé, roues à 360° testées sur 40 000 km de tapis roulants réels.",
        ctaTexte: "Voir la gamme", ctaLien: "produits", overlay: 0, hauteur: "80vh", textPosition: "left",
        badgeTexte: "Route 004",
      },
      confiance: {
        actif: true, layout: "marquee",
        items: [
          { icone: "◆", titre: "Garantie 10 ans", texte: "Toute casse couverte" },
          { icone: "◆", titre: "Suivi GPS", texte: "En option" },
          { icone: "◆", titre: "Livraison", texte: "Sous 48h" },
        ],
      },
      vedettes: { actif: true, titre: "La gamme Atlas", nombre: 6, triPar: "recent", colonnes: 3, layout: "grid", showRatings: false, showSoldCount: false },
      collections: { actif: true, titre: "Nos collections", layout: "grid" },
      about: {
        actif: false, layout: "image-left",
        titre: "Conçu pour durer", texte: "Chaque pièce est testée en conditions réelles avant validation.",
        badgeTexte: "Notre ingénierie",
      },
      promo: { actif: true, titre: "Garantie 10 ans", texte: "Toute casse de coque est couverte, sans condition.", ctaTexte: "En savoir plus", style: "solid" },
      faq: { actif: false, titre: "Questions fréquentes", layout: "accordion", items: [
        { question: "Quelle est la politique de garantie ?", reponse: "10 ans sur la coque, toute casse couverte sans justificatif." },
        { question: "Le suivi GPS est-il inclus ?", reponse: "Il est proposé en option sur certains modèles, activable à la commande." },
      ] },
      avis: { actif: true, titre: "Avis clients", layout: "cards" },
      newsletter: { actif: false, titre: "Restez informé", texte: "Nos nouveautés, sans spam.", placeholder: "votre@email.com", ctaTexte: "S'abonner", style: "centered" },
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
