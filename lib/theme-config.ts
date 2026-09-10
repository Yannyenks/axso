import { TEMPLATE_DEFAULTS } from "@/lib/theme-templates";

// ─── Couleurs ────────────────────────────────────────────────────────────────
export interface ThemeColors {
  fond: string;
  accent: string;
  accentSecondaire?: string;
  texte: string;
  texteMuted?: string;
  surface: string;
  bordure?: string;
}

// ─── Typographie ─────────────────────────────────────────────────────────────
export interface ThemeFonts {
  titre: string;
  corps: string;
  poidsTitre?: string;
  tailleBase?: string;
  lettreEspacement?: string;
  hauteurLigne?: string;
  transformTitre?: string;
}

// ─── Mise en page ────────────────────────────────────────────────────────────
export interface ThemeLayout {
  largeurContainer?: string;
  paddingSection?: string;
  colonnesProduits?: number;
  colonnesMobile?: number;
  styleCarte?: string;
  ombre?: string;
}

// ─── Boutons ─────────────────────────────────────────────────────────────────
export interface ThemeBoutons {
  style?: string;
  taille?: string;
  hover?: string;
  bordureWidth?: string;
}

// ─── Navigation ──────────────────────────────────────────────────────────────
export interface ThemeNavigationCfg {
  type?: "classic" | "centered" | "floating" | "minimal" | "mega" | "transparent-scroll";
  style?: "light" | "dark" | "glass" | "transparent";
  sticky?: boolean;
  hauteur?: string;
  showSearch?: boolean;
  showWishlist?: boolean;
}

// ─── Animations ──────────────────────────────────────────────────────────────
export interface ThemeAnimations {
  global: "none" | "fade-in" | "slide-up" | "slide-left" | "zoom-in" | "flip" | "blur-in";
  vitesse: "fast" | "normal" | "slow";
  parallax: boolean;
  smoothScroll: boolean;
  stagger: boolean;
  preset?: "luxury" | "dynamic" | "elegant" | "playful" | "none";
  sectionAnimations: Record<string, string>;
}

// ─── Sections custom (bibliothèque) ──────────────────────────────────────────
export interface CustomSection {
  id: string;
  type: "features" | "stats" | "countdown" | "brands" | "video" | "gallery" | "social-proof" | "spacer" | "richtext" | "cta-band" | "tabs" | "columns";
  actif: boolean;
  label: string;
  animation?: string;
  ordre: number;
  config: Record<string, any>;
}

// ─── Sous-sections (blocs) — ajoutables dans n'importe quelle section ────────
// Permet d'imbriquer du contenu de forme libre à l'intérieur de toute section
// (built-in ou custom, y compris onglets et colonnes), façon Shopify.
export interface SousBloc {
  id: string;
  type: "photos" | "temoignage" | "promo" | "texte" | "video" | "stats" | "features" | "countdown" | "logos" | "confiance" | "liste" | "spacer";
  config: Record<string, any>;
}

// ─── Sections built-in ───────────────────────────────────────────────────────
export interface ThemeSectionAnnonce {
  actif: boolean;
  texte: string;
  couleurFond: string;
  couleurTexte: string;
  defilant?: boolean;
}

export interface ThemeSectionHero {
  actif: boolean;
  style: "centered" | "split" | "fullscreen" | "minimal" | "video" | "slideshow" | "magazine";
  titre: string;
  sousTitre: string;
  ctaTexte: string;
  ctaLien: string;
  overlay: number;
  hauteur?: "50vh" | "60vh" | "70vh" | "80vh" | "100vh";
  videoUrl?: string;
  slideshowImages?: string[];
  slideshowInterval?: number;
  textPosition?: "left" | "center" | "right";
  showSecondCta?: boolean;
  secondCtaTexte?: string;
  secondCtaLien?: string;
  badgeTexte?: string;
  particles?: boolean;
  animation?: string;
}

export interface ThemeSectionVedettes {
  actif: boolean;
  titre: string;
  nombre: number;
  triPar: "ventes" | "recent" | "featured";
  layout?: "grid" | "carousel" | "masonry";
  colonnes?: number;
  showRatings?: boolean;
  showSoldCount?: boolean;
}

export interface ThemeSectionCollections {
  actif: boolean;
  titre: string;
  layout?: "grid" | "masonry" | "carousel" | "cards";
}

export interface ThemeSectionPromo {
  actif: boolean;
  titre: string;
  texte: string;
  ctaTexte: string;
  style?: "gradient" | "solid" | "image" | "split";
  imageUrl?: string;
  bgColor?: string;
}

export interface ThemeSectionAvis {
  actif: boolean;
  titre: string;
  layout?: "cards" | "carousel" | "list" | "masonry";
  showPhotos?: boolean;
}

export interface ThemeSectionNewsletter {
  actif: boolean;
  titre: string;
  texte: string;
  placeholder: string;
  ctaTexte: string;
  style?: "centered" | "split" | "banner";
  bgColor?: string;
}

export interface ThemeSectionConfiance {
  actif: boolean;
  layout?: "icons" | "cards" | "bar" | "marquee";
  items: Array<{ icone: string; titre: string; texte: string }>;
}

export interface ThemeSectionAbout {
  actif: boolean;
  titre: string;
  texte: string;
  layout: "image-left" | "image-right" | "centered" | "fullwidth";
  imageUrl?: string;
  badgeTexte?: string;
  stats?: Array<{ valeur: string; label: string }>;
}

export interface ThemeSectionFaq {
  actif: boolean;
  titre: string;
  layout?: "accordion" | "grid" | "columns";
  items: Array<{ question: string; reponse: string }>;
}

export interface ThemeSections {
  annonce: ThemeSectionAnnonce;
  hero: ThemeSectionHero;
  vedettes: ThemeSectionVedettes;
  collections: ThemeSectionCollections;
  promo: ThemeSectionPromo;
  avis: ThemeSectionAvis;
  newsletter: ThemeSectionNewsletter;
  confiance?: ThemeSectionConfiance;
  about?: ThemeSectionAbout;
  faq?: ThemeSectionFaq;
}

// ─── Page produit — sections style Shopify ───────────────────────────────────
export type ProductPageSectionType =
  | "gallery" | "info" | "variants" | "quantity" | "trust" | "description" | "reviews" | "similar"
  | "richtext" | "banner" | "video" | "faq" | "specs" | "countdown" | "social";

// Style personnalisable par section de fiche produit (fond, couleurs, espacement, largeur)
export interface ProductPageSectionStyle {
  bgColor?: string;
  textColor?: string;
  paddingY?: "none" | "sm" | "md" | "lg" | "xl";
  maxWidth?: "full" | "medium" | "narrow";
  align?: "left" | "center";
}

export interface ProductPageSection {
  id: string;
  type: ProductPageSectionType;
  actif: boolean;
  config: Record<string, any>;
  style?: ProductPageSectionStyle;
}

export interface ThemeProductPageConfig {
  layout?: "amazon" | "classic" | "minimal" | "fullwidth";
  sections?: ProductPageSection[];
}

// ─── Pages À propos & Contact — même patron que la fiche produit ci-dessus :
// une liste de sections indépendante de la home, composée avec la même
// bibliothèque CustomSection (richtext, stats, galerie...).
export interface ThemeAboutPageConfig {
  actif: boolean;
  sections: CustomSection[];
}

export interface ThemeContactPageConfig {
  actif: boolean;
  intro?: string;
  afficherFormulaire: boolean;
  sections?: CustomSection[];
}

export const DEFAULT_PRODUCT_SECTIONS: ProductPageSection[] = [
  { id: "gallery",     type: "gallery",     actif: true, config: { style: "vertical-thumbs", zoom: true, sticky: true } },
  { id: "info",        type: "info",        actif: true, config: { breadcrumbs: true, badges: true, stock: true } },
  { id: "variants",    type: "variants",    actif: true, config: {} },
  { id: "quantity",    type: "quantity",    actif: true, config: {} },
  { id: "trust",       type: "trust",       actif: true, config: {} },
  { id: "description", type: "description", actif: true, config: { ai: true } },
  { id: "reviews",     type: "reviews",     actif: true, config: {} },
  { id: "similar",     type: "similar",     actif: true, config: { count: 4, titre: "Vous aimerez aussi" } },
];

// ─── Constructeur libre — arbre de blocs (Elementor-like) ─────────────────────
// Additif : n'existe que si le marchand a activé le "Constructeur libre",
// sinon `undefined` pour 100% des boutiques (rendu classique inchangé — voir
// dispatch dans app/(storefront)/[slug]/page.tsx). Contrairement à
// `sections`/`customSections` (schéma fixe, une seule liste plate), ceci est
// un vrai arbre : section → ligne(s) → colonne(s) → widget(s), déposable et
// réordonnable à n'importe quel endroit via glisser-déposer (dnd-kit).
export type BlockNodeType =
  | "section" | "row" | "column" // conteneurs structurels
  | "features" | "stats" | "countdown" | "brands" | "video" | "gallery"
  | "social-proof" | "spacer" | "richtext" | "cta-band" | "tabs" | "columns" // réutilisés de CustomSection (voir components/storefront/blocks/registry.tsx)
  | "heading" | "text" | "image" | "button" | "products"; // atomes (vague 2)

export interface BlockStyleOverrides {
  spacing?: { pt?: string; pb?: string; pl?: string; pr?: string; mt?: string; mb?: string };
  background?: { color?: string; image?: string; gradient?: string };
  typography?: { color?: string; taille?: string; poids?: string; align?: "left" | "center" | "right" };
  border?: { radius?: string; width?: string; color?: string };
  visibility?: { desktop?: boolean; tablet?: boolean; mobile?: boolean };
  width?: string;
  customClass?: string;
}

export interface BlockNode {
  id: string; // stable, sert aussi de data-axs-id pour la sélection visuelle
  type: BlockNodeType;
  actif?: boolean;
  children?: BlockNode[]; // uniquement pour section/row/column
  config?: Record<string, any>; // même forme que CustomSection.config pour les 12 types réutilisés
  style?: BlockStyleOverrides;
}

// Thèmes dont le rendu storefront est encore piloté par `sections`/JSX
// partagé (pas un arbre React écrit à la main comme les 10 thèmes premium) —
// seuls ceux-ci peuvent activer le Constructeur libre pour l'instant.
export const THEMES_LIBRE_ELIGIBLES = [
  "terre-et-or", "noir-obsidien", "violet-cosmos", "ocean-atlantique", "kente-royal", "bwiti-forest",
] as const;

// ─── Config principale ───────────────────────────────────────────────────────
export interface ThemeConfig {
  colors: ThemeColors;
  fonts: ThemeFonts;
  radius: string;
  layout?: ThemeLayout;
  boutons?: ThemeBoutons;
  navigationStyle?: ThemeNavigationCfg;
  animations?: ThemeAnimations;
  customSections?: CustomSection[];
  sectionOrder?: string[];
  // Sous-sections personnalisées ajoutées dans n'importe quelle section (built-in ou custom),
  // indexées par id de section. Permet d'ajouter photos/témoignages/promo/texte dans toute section.
  sectionSousBlocs?: Record<string, SousBloc[]>;
  customCss?: string;
  sections: ThemeSections;
  productPage?: ThemeProductPageConfig;
  aboutPage?: ThemeAboutPageConfig;
  contactPage?: ThemeContactPageConfig;
  builderHtml?: string;
  builderCss?: string;
  builderTree?: BlockNode[];
}

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_CONFIANCE: ThemeSectionConfiance = {
  actif: true,
  layout: "marquee",
  items: [
    { icone: "📦", titre: "Livraison rapide", texte: "Expédiée sous 24h-48h" },
    { icone: "🔒", titre: "Paiement sécurisé", texte: "Transactions protégées" },
    { icone: "↩️", titre: "Retours faciles", texte: "Sous 14 jours" },
    { icone: "💬", titre: "Support dédié", texte: "Réponse rapide garantie" },
  ],
};

const DEFAULT_ABOUT: ThemeSectionAbout = {
  actif: false,
  titre: "Notre histoire",
  texte: "Fondée avec passion, notre boutique est née d'un désir profond de vous proposer des produits authentiques et de qualité exceptionnelle. Chaque article est sélectionné avec soin pour refléter nos valeurs d'excellence.",
  layout: "image-right",
  stats: [
    { valeur: "1000+", label: "Clients satisfaits" },
    { valeur: "500+", label: "Produits" },
    { valeur: "5★", label: "Note moyenne" },
  ],
};

const DEFAULT_FAQ: ThemeSectionFaq = {
  actif: false,
  titre: "Questions fréquentes",
  layout: "accordion",
  items: [
    { question: "Quels sont vos délais de livraison ?", reponse: "Nous livrons sous 24 à 48h pour les commandes passées avant 14h." },
    { question: "Comment retourner un article ?", reponse: "Vous disposez de 14 jours pour retourner un article. Contactez-nous par WhatsApp pour initier le retour." },
    { question: "Quels modes de paiement acceptez-vous ?", reponse: "Nous acceptons Orange Money, Wave, Moov Money et les virements bancaires." },
  ],
};

// Variété sobre par défaut, section par section — le système ScrollReveal
// est déjà câblé partout (voir components/storefront/ScrollReveal.tsx),
// il ne manquait que ces préréglages pour qu'une boutique neuve soit animée
// de façon professionnelle sans que le marchand ait à toucher au builder.
const DEFAULT_SECTION_ANIMATIONS: Record<string, string> = {
  hero: "fade-in",
  confiance: "fade-in",
  vedettes: "slide-up",
  collections: "zoom-in",
  about: "slide-left",
  promo: "fade-in",
  faq: "fade-in",
  avis: "slide-up",
  newsletter: "fade-in",
};

const DEFAULT_ANIMATIONS: ThemeAnimations = {
  global: "slide-up",
  vitesse: "normal",
  parallax: false,
  smoothScroll: true,
  stagger: true,
  preset: "elegant",
  sectionAnimations: { ...DEFAULT_SECTION_ANIMATIONS },
};

const DEFAULT_NAV: ThemeNavigationCfg = {
  type: "classic",
  style: "light",
  sticky: true,
  hauteur: "64px",
  showSearch: true,
  showWishlist: false,
};

const DEFAULT_BOUTONS: ThemeBoutons = {
  style: "filled",
  taille: "md",
  hover: "scale",
  bordureWidth: "2px",
};

const DEFAULT_LAYOUT: ThemeLayout = {
  largeurContainer: "1280px",
  paddingSection: "lg",
  colonnesProduits: 4,
  colonnesMobile: 2,
  styleCarte: "shadow",
  ombre: "md",
};

const DEFAULTS: Record<string, ThemeConfig> = {
  "noir-obsidien": {
    colors: { fond: "#0a0a0a", accent: "#F5A623", texte: "#F5F5F0", surface: "#111111", texteMuted: "#888888", bordure: "#222222" },
    fonts: { titre: "playfair", corps: "inter", poidsTitre: "700" },
    radius: "16px",
    layout: { ...DEFAULT_LAYOUT },
    boutons: { ...DEFAULT_BOUTONS },
    navigationStyle: { ...DEFAULT_NAV, style: "dark" },
    animations: { ...DEFAULT_ANIMATIONS },
    sections: {
      annonce: { actif: true, texte: "✦ Livraison gratuite dès 30 000 XOF ✦ Paiement 100% sécurisé ✦ Retours sous 14 jours", couleurFond: "#F5A623", couleurTexte: "#0a0a0a" },
      hero: { actif: true, style: "centered", titre: "Élégance redéfinie", sousTitre: "Découvrez notre collection exclusive de pièces uniques sélectionnées avec soin", ctaTexte: "Explorer la collection", ctaLien: "produits", overlay: 55, hauteur: "80vh", textPosition: "center" },
      confiance: { ...DEFAULT_CONFIANCE },
      vedettes: { actif: true, titre: "Nos Best-Sellers", nombre: 8, triPar: "ventes", colonnes: 4, layout: "grid" },
      collections: { actif: true, titre: "Nos Collections", layout: "grid" },
      about: { ...DEFAULT_ABOUT },
      promo: { actif: true, titre: "Nouvelle Saison", texte: "Découvrez les nouvelles arrivées et laissez-vous séduire par l'excellence", ctaTexte: "Voir la collection", style: "gradient" },
      faq: { ...DEFAULT_FAQ },
      avis: { actif: true, titre: "Ce que disent nos clients", layout: "cards" },
      newsletter: { actif: false, titre: "Rejoignez notre univers", texte: "Recevez nos offres exclusives et nouveautés en avant-première", placeholder: "votre@email.com", ctaTexte: "S'abonner", style: "centered" },
    },
  },
  "violet-cosmos": {
    colors: { fond: "#1a0a2e", accent: "#7c3aed", texte: "#f0eaff", surface: "#200a3e", texteMuted: "#9876cc", bordure: "#2d1058" },
    fonts: { titre: "playfair", corps: "inter", poidsTitre: "700" },
    radius: "20px",
    layout: { ...DEFAULT_LAYOUT },
    boutons: { ...DEFAULT_BOUTONS, hover: "glow" },
    navigationStyle: { ...DEFAULT_NAV, style: "dark" },
    animations: { ...DEFAULT_ANIMATIONS, preset: "dynamic" },
    sections: {
      annonce: { actif: true, texte: "✨ Collection Cosmos — Expédition 24h ✨ -10% sur votre 1ère commande avec COSMOS10", couleurFond: "#7c3aed", couleurTexte: "#ffffff" },
      hero: { actif: true, style: "fullscreen", titre: "Au-delà de l'ordinaire", sousTitre: "Une collection unique inspirée des mystères de l'univers", ctaTexte: "Découvrir le cosmos", ctaLien: "produits", overlay: 60, hauteur: "100vh", textPosition: "center" },
      confiance: { ...DEFAULT_CONFIANCE },
      vedettes: { actif: true, titre: "Sélection Cosmos", nombre: 8, triPar: "featured", colonnes: 4, layout: "grid" },
      collections: { actif: true, titre: "Univers de marque", layout: "masonry" },
      about: { ...DEFAULT_ABOUT },
      promo: { actif: true, titre: "Offre Cosmos", texte: "-20% sur votre première commande — une aventure commence ici", ctaTexte: "Profiter de l'offre", style: "gradient" },
      faq: { ...DEFAULT_FAQ },
      avis: { actif: true, titre: "Ils voyagent avec nous", layout: "carousel" },
      newsletter: { actif: true, titre: "Entrez dans l'univers", texte: "Accédez en avant-première à nos lancements et collections exclusives", placeholder: "votre@email.com", ctaTexte: "Rejoindre le cosmos", style: "split" },
    },
  },
  "terre-et-or": {
    colors: { fond: "#fff8f0", accent: "#c2622d", texte: "#2c1503", surface: "#fef3e8", texteMuted: "#8a6248", bordure: "#f0e0d0" },
    fonts: { titre: "playfair", corps: "inter", poidsTitre: "700" },
    radius: "12px",
    layout: { ...DEFAULT_LAYOUT, styleCarte: "bordered" },
    boutons: { ...DEFAULT_BOUTONS, hover: "darken" },
    navigationStyle: { ...DEFAULT_NAV, style: "light" },
    animations: { ...DEFAULT_ANIMATIONS, preset: "luxury" },
    sections: {
      annonce: { actif: true, texte: "🌿 Produits naturels & authentiques — Livraison soignée sous 48h — Satisfaction garantie", couleurFond: "#c2622d", couleurTexte: "#ffffff" },
      hero: { actif: true, style: "split", titre: "L'authenticité à l'état pur", sousTitre: "Des produits sélectionnés avec soin, pour une vie plus belle et naturelle", ctaTexte: "Découvrir", ctaLien: "produits", overlay: 30, hauteur: "80vh", textPosition: "left" },
      confiance: { ...DEFAULT_CONFIANCE },
      vedettes: { actif: true, titre: "Nos Coups de Cœur", nombre: 8, triPar: "ventes", colonnes: 4, layout: "grid" },
      collections: { actif: true, titre: "Explorer nos Collections", layout: "grid" },
      about: { ...DEFAULT_ABOUT, actif: true },
      promo: { actif: true, titre: "Artisanat local", texte: "Chaque produit raconte une histoire unique de savoir-faire et de passion", ctaTexte: "Découvrir l'histoire", style: "split" },
      faq: { ...DEFAULT_FAQ },
      avis: { actif: true, titre: "Ils nous font confiance", layout: "cards" },
      newsletter: { actif: false, titre: "Restez connecté", texte: "Recevez nos actualités et offres spéciales directement dans votre boîte mail", placeholder: "votre@email.com", ctaTexte: "S'abonner", style: "centered" },
    },
  },
  "ocean-atlantique": {
    colors: { fond: "#010d1f", accent: "#00b4d8", texte: "#e0f4ff", surface: "#021a33", texteMuted: "#6aa8c4", bordure: "#0a2a40" },
    fonts: { titre: "playfair", corps: "inter", poidsTitre: "700" },
    radius: "18px",
    layout: { ...DEFAULT_LAYOUT },
    boutons: { ...DEFAULT_BOUTONS },
    navigationStyle: { ...DEFAULT_NAV, style: "dark", type: "transparent-scroll" },
    animations: { ...DEFAULT_ANIMATIONS },
    sections: {
      annonce: { actif: true, texte: "🌊 Livraison express sous 24h · Paiement 100% sécurisé · Retours gratuits 30j", couleurFond: "#0077b6", couleurTexte: "#ffffff" },
      hero: { actif: true, style: "centered", titre: "L'essence de l'Atlantique", sousTitre: "Une collection inspirée par la richesse des côtes ouest-africaines", ctaTexte: "Plonger dans la collection", ctaLien: "produits", overlay: 55, hauteur: "100vh", textPosition: "center" },
      confiance: { ...DEFAULT_CONFIANCE },
      vedettes: { actif: true, titre: "Sélection Atlantique", nombre: 8, triPar: "featured", colonnes: 4, layout: "grid" },
      collections: { actif: true, titre: "Nos Trésors des Profondeurs", layout: "masonry" },
      about: { ...DEFAULT_ABOUT },
      promo: { actif: true, titre: "Vagues d'offres exclusives", texte: "Des promotions aussi vastes que l'Atlantique", ctaTexte: "Voir les offres", style: "gradient" },
      faq: { ...DEFAULT_FAQ },
      avis: { actif: true, titre: "Ils naviguent avec nous", layout: "cards" },
      newsletter: { actif: true, titre: "Entrez dans nos flots", texte: "Recevez en avant-première nos nouveautés et offres exclusives", placeholder: "votre@email.com", ctaTexte: "M'inscrire", style: "banner" },
    },
  },
  "kente-royal": {
    colors: { fond: "#1a0e00", accent: "#f5a623", texte: "#fff8e8", surface: "#261400", texteMuted: "#c8a060", bordure: "#3a2200" },
    fonts: { titre: "playfair", corps: "inter", poidsTitre: "700" },
    radius: "14px",
    layout: { ...DEFAULT_LAYOUT },
    boutons: { ...DEFAULT_BOUTONS, style: "pill", hover: "glow" },
    navigationStyle: { ...DEFAULT_NAV, style: "dark" },
    animations: { ...DEFAULT_ANIMATIONS, preset: "luxury", global: "fade-in" },
    sections: {
      annonce: { actif: true, texte: "✦ Authenticité africaine ✦ Artisanat premium ✦ Livraison soignée 48h ✦", couleurFond: "#c8861a", couleurTexte: "#1a0e00" },
      hero: { actif: true, style: "fullscreen", titre: "Kente Royal", sousTitre: "L'excellence du savoir-faire africain dans chaque pièce unique et intemporelle", ctaTexte: "Découvrir la collection royale", ctaLien: "produits", overlay: 40, hauteur: "100vh", textPosition: "center" },
      confiance: { ...DEFAULT_CONFIANCE },
      vedettes: { actif: true, titre: "Pièces d'exception", nombre: 8, triPar: "ventes", colonnes: 4, layout: "grid" },
      collections: { actif: true, titre: "Collections Royales", layout: "masonry" },
      about: { ...DEFAULT_ABOUT },
      promo: { actif: true, titre: "L'Artisanat Royal vous attend", texte: "Chaque pièce est un hommage vibrant au riche patrimoine culturel africain", ctaTexte: "Explorer le patrimoine", style: "gradient" },
      faq: { ...DEFAULT_FAQ },
      avis: { actif: true, titre: "La voix de notre communauté royale", layout: "carousel" },
      newsletter: { actif: false, titre: "Rejoindre la royauté", texte: "Accédez aux créations exclusives et aux offres réservées aux membres", placeholder: "votre@email.com", ctaTexte: "Rejoindre", style: "centered" },
    },
  },
  "bwiti-forest": {
    colors: { fond: "#071a0b", accent: "#4ade80", texte: "#e8ffe0", surface: "#0d2912", texteMuted: "#6aad6a", bordure: "#163d1e" },
    fonts: { titre: "playfair", corps: "inter", poidsTitre: "700" },
    radius: "20px",
    layout: { ...DEFAULT_LAYOUT },
    boutons: { ...DEFAULT_BOUTONS },
    navigationStyle: { ...DEFAULT_NAV, style: "dark" },
    animations: { ...DEFAULT_ANIMATIONS, preset: "elegant" },
    sections: {
      annonce: { actif: true, texte: "🌿 Produits 100% naturels · Bio & équitable · Livraison éco-responsable", couleurFond: "#15803d", couleurTexte: "#e8ffe0" },
      hero: { actif: true, style: "split", titre: "La forêt primaire vous parle", sousTitre: "Des produits naturels authentiques, en harmonie avec la forêt équatoriale d'Afrique", ctaTexte: "Explorer la forêt", ctaLien: "produits", overlay: 50, hauteur: "80vh", textPosition: "left" },
      confiance: { ...DEFAULT_CONFIANCE },
      vedettes: { actif: true, titre: "Trésors de la Forêt", nombre: 8, triPar: "featured", colonnes: 4, layout: "grid" },
      collections: { actif: true, titre: "Rituels Naturels", layout: "grid" },
      about: { ...DEFAULT_ABOUT },
      promo: { actif: true, titre: "Offrande de la forêt", texte: "La nature vous offre ses secrets les mieux gardés à prix exceptionnel", ctaTexte: "Découvrir les secrets", style: "gradient" },
      faq: { ...DEFAULT_FAQ },
      avis: { actif: true, titre: "La forêt témoigne", layout: "cards" },
      newsletter: { actif: true, titre: "Entrez dans la forêt", texte: "Recevez nos rituels naturels et secrets directement dans votre boîte", placeholder: "votre@email.com", ctaTexte: "Entrer dans la forêt", style: "centered" },
    },
  },
  "epure-minimal": {
    colors: { fond: "#ffffff", accent: "#111111", texte: "#1a1a1a", surface: "#fafafa", texteMuted: "#8a8a8a", bordure: "#ececec" },
    fonts: { titre: "inter", corps: "inter", poidsTitre: "600" },
    radius: "6px",
    layout: { ...DEFAULT_LAYOUT, styleCarte: "bordered", ombre: "sm" },
    boutons: { ...DEFAULT_BOUTONS, style: "outline", hover: "darken" },
    navigationStyle: { ...DEFAULT_NAV, style: "light" },
    animations: { ...DEFAULT_ANIMATIONS, preset: "none", global: "fade-in" },
    sections: {
      annonce: { actif: false, texte: "Livraison sous 48h · Paiement sécurisé · Retours sous 14 jours", couleurFond: "#111111", couleurTexte: "#ffffff" },
      hero: { actif: true, style: "minimal", titre: "L'essentiel, bien fait", sousTitre: "Une sélection épurée, pensée pour durer", ctaTexte: "Découvrir", ctaLien: "produits", overlay: 0, hauteur: "70vh", textPosition: "left" },
      confiance: { ...DEFAULT_CONFIANCE, layout: "bar" },
      vedettes: { actif: true, titre: "Sélection", nombre: 8, triPar: "ventes", colonnes: 4, layout: "grid" },
      collections: { actif: true, titre: "Collections", layout: "grid" },
      about: { ...DEFAULT_ABOUT },
      promo: { actif: false, titre: "Nouveautés", texte: "Les dernières arrivées, sélectionnées avec soin", ctaTexte: "Voir", style: "solid" },
      faq: { ...DEFAULT_FAQ },
      avis: { actif: true, titre: "Avis clients", layout: "list" },
      newsletter: { actif: false, titre: "Restez informé", texte: "Les nouveautés, sans spam", placeholder: "votre@email.com", ctaTexte: "S'abonner", style: "centered" },
    },
  },
};

// Fusionne une couche de surcharges (overrides — venant soit d'un thème custom
// stocké en DB, soit des réglages live du tenant sauvegardés par le builder)
// par-dessus une base ThemeConfig déjà complète. Utilisé pour empiler
// plusieurs couches : défauts intégrés → thème custom → édits du builder.
export function mergeThemeConfig(base: ThemeConfig, overrides: Record<string, any>): ThemeConfig {
  return {
    ...base,
    colors: { ...base.colors, ...(overrides.colors || {}) },
    fonts: { ...base.fonts, ...(overrides.fonts || {}) },
    radius: overrides.radius || base.radius,
    layout: { ...base.layout, ...(overrides.layout || {}) },
    boutons: { ...base.boutons, ...(overrides.boutons || {}) },
    navigationStyle: { ...base.navigationStyle, ...(overrides.navigationStyle || {}) },
    animations: { ...base.animations, ...(overrides.animations || {}), sectionAnimations: { ...(base.animations?.sectionAnimations || {}), ...(overrides.animations?.sectionAnimations || {}) } },
    customSections: overrides.customSections ?? base.customSections,
    sectionOrder: overrides.sectionOrder ?? base.sectionOrder,
    sectionSousBlocs: overrides.sectionSousBlocs ?? base.sectionSousBlocs ?? {},
    customCss: overrides.customCss ?? base.customCss,
    sections: {
      annonce: { ...base.sections.annonce, ...(overrides.sections?.annonce || {}) },
      hero: { ...base.sections.hero, ...(overrides.sections?.hero || {}) },
      vedettes: { ...base.sections.vedettes, ...(overrides.sections?.vedettes || {}) },
      collections: { ...base.sections.collections, ...(overrides.sections?.collections || {}) },
      promo: { ...base.sections.promo, ...(overrides.sections?.promo || {}) },
      avis: { ...base.sections.avis, ...(overrides.sections?.avis || {}) },
      newsletter: { ...base.sections.newsletter, ...(overrides.sections?.newsletter || {}) },
      confiance: overrides.sections?.confiance ?? base.sections.confiance ?? DEFAULT_CONFIANCE,
      about: overrides.sections?.about ?? base.sections.about ?? DEFAULT_ABOUT,
      faq: overrides.sections?.faq ?? base.sections.faq ?? DEFAULT_FAQ,
    },
    productPage: overrides.productPage ?? base.productPage,
    aboutPage: overrides.aboutPage ?? base.aboutPage,
    contactPage: overrides.contactPage ?? base.contactPage,
    builderHtml: overrides.builderHtml ?? base.builderHtml,
    builderCss: overrides.builderCss ?? base.builderCss,
    builderTree: overrides.builderTree ?? base.builderTree,
  };
}

export function resolveThemeConfig(themeId: string, savedConfig: Record<string, any> = {}): ThemeConfig {
  const base = DEFAULTS[themeId] || TEMPLATE_DEFAULTS[themeId] || DEFAULTS["terre-et-or"];
  const hasCustom = savedConfig && Object.keys(savedConfig).filter(k => k !== "builderHtml" && k !== "builderCss").length > 0;
  if (!hasCustom) return base;

  return mergeThemeConfig(base, savedConfig);
}

// ─── Changement de thème sans perdre le texte du marchand ────────────────────
// Chaque thème a ses propres textes par défaut (titres, accroches, badges de
// confiance...), mais un marchand qui a déjà écrit/gardé le sien ne doit
// jamais le voir disparaître au profit du texte par défaut du thème choisi —
// seule l'identité visuelle (couleurs, polices, rayon, boutons, animations,
// mise en page) doit changer avec le thème. Liste des champs "copywriting"
// par section, conservés depuis l'ancienne config ; tout le reste de la
// section vient des défauts du nouveau thème.
const CHAMPS_COPY_PAR_SECTION: Record<string, string[]> = {
  annonce: ["texte"],
  hero: ["titre", "sousTitre", "ctaTexte", "ctaLien", "badgeTexte", "showSecondCta", "secondCtaTexte", "secondCtaLien", "videoUrl", "slideshowImages", "slideshowInterval"],
  vedettes: ["titre"],
  collections: ["titre"],
  promo: ["titre", "texte", "ctaTexte", "imageUrl"],
  avis: ["titre"],
  newsletter: ["titre", "texte", "placeholder", "ctaTexte"],
  confiance: ["items"],
  about: ["titre", "texte", "badgeTexte", "stats", "imageUrl"],
  faq: ["titre", "items"],
};

// `ancienConfig` : config actuellement active du tenant (déjà résolue,
// fusionnée avec ses propres édits). `nouveauThemeBase` : défauts du thème
// vers lequel il bascule (résolu SANS les overrides du tenant — juste le
// thème lui-même). Retourne la nouvelle config à sauvegarder.
export function appliquerNouveauTheme(ancienConfig: ThemeConfig, nouveauThemeBase: ThemeConfig): ThemeConfig {
  const sections: Record<string, any> = {};
  for (const [id, base] of Object.entries(nouveauThemeBase.sections)) {
    const ancienneSec = (ancienConfig.sections as any)?.[id];
    const champsCopy = CHAMPS_COPY_PAR_SECTION[id] || [];
    const fusion: any = { ...(base as any) };
    if (ancienneSec) {
      for (const champ of champsCopy) {
        if (ancienneSec[champ] !== undefined) fusion[champ] = ancienneSec[champ];
      }
    }
    sections[id] = fusion;
  }
  return {
    ...nouveauThemeBase,
    sections: sections as ThemeSections,
    // Contenu piloté par le marchand, jamais lié à l'identité visuelle d'un
    // thème — ne doit jamais être perdu en changeant de thème.
    customSections: ancienConfig.customSections,
    sectionOrder: ancienConfig.sectionOrder,
    sectionSousBlocs: ancienConfig.sectionSousBlocs,
    customCss: ancienConfig.customCss,
    productPage: ancienConfig.productPage,
    aboutPage: ancienConfig.aboutPage,
    contactPage: ancienConfig.contactPage,
    builderTree: ancienConfig.builderTree,
  };
}

export { DEFAULTS as THEME_DEFAULTS };
