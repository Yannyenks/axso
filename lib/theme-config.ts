export interface ThemeColors {
  fond: string;
  accent: string;
  texte: string;
  surface: string;
}

export interface ThemeSectionAnnonce {
  actif: boolean;
  texte: string;
  couleurFond: string;
  couleurTexte: string;
}

export interface ThemeSectionHero {
  actif: boolean;
  style: "centered" | "split" | "fullscreen" | "minimal";
  titre: string;
  sousTitre: string;
  ctaTexte: string;
  ctaLien: string;
  overlay: number;
}

export interface ThemeSectionVedettes {
  actif: boolean;
  titre: string;
  nombre: number;
  triPar: "ventes" | "recent" | "featured";
}

export interface ThemeSectionCollections {
  actif: boolean;
  titre: string;
}

export interface ThemeSectionPromo {
  actif: boolean;
  titre: string;
  texte: string;
  ctaTexte: string;
}

export interface ThemeSectionAvis {
  actif: boolean;
  titre: string;
}

export interface ThemeSectionNewsletter {
  actif: boolean;
  titre: string;
  texte: string;
  placeholder: string;
  ctaTexte: string;
}

export interface ThemeSections {
  annonce: ThemeSectionAnnonce;
  hero: ThemeSectionHero;
  vedettes: ThemeSectionVedettes;
  collections: ThemeSectionCollections;
  promo: ThemeSectionPromo;
  avis: ThemeSectionAvis;
  newsletter: ThemeSectionNewsletter;
}

export interface ThemeConfig {
  colors: ThemeColors;
  fonts: { titre: string; corps: string };
  radius: string;
  sections: ThemeSections;
  builderHtml?: string;
  builderCss?: string;
}

const DEFAULTS: Record<string, ThemeConfig> = {
  "noir-obsidien": {
    colors: { fond: "#0a0a0a", accent: "#F5A623", texte: "#F5F5F0", surface: "#111111" },
    fonts: { titre: "playfair", corps: "inter" },
    radius: "16px",
    sections: {
      annonce: { actif: true, texte: "✦ Livraison gratuite dès 30 000 XOF ✦ Paiement 100% sécurisé ✦ Retours sous 14 jours", couleurFond: "#F5A623", couleurTexte: "#0a0a0a" },
      hero: { actif: true, style: "centered", titre: "Élégance redéfinie", sousTitre: "Découvrez notre collection exclusive de pièces uniques sélectionnées avec soin", ctaTexte: "Explorer la collection", ctaLien: "produits", overlay: 55 },
      vedettes: { actif: true, titre: "Nos Best-Sellers", nombre: 8, triPar: "ventes" },
      collections: { actif: true, titre: "Nos Collections" },
      promo: { actif: true, titre: "Nouvelle Saison", texte: "Découvrez les nouvelles arrivées et laissez-vous séduire par l'excellence", ctaTexte: "Voir la collection" },
      avis: { actif: true, titre: "Ce que disent nos clients" },
      newsletter: { actif: false, titre: "Rejoignez notre univers", texte: "Recevez nos offres exclusives et nouveautés en avant-première", placeholder: "votre@email.com", ctaTexte: "S'abonner" },
    },
  },
  "violet-cosmos": {
    colors: { fond: "#1a0a2e", accent: "#7c3aed", texte: "#f0eaff", surface: "#200a3e" },
    fonts: { titre: "playfair", corps: "inter" },
    radius: "20px",
    sections: {
      annonce: { actif: true, texte: "✨ Collection Cosmos — Expédition 24h ✨ -10% sur votre 1ère commande avec COSMOS10", couleurFond: "#7c3aed", couleurTexte: "#ffffff" },
      hero: { actif: true, style: "centered", titre: "Au-delà de l'ordinaire", sousTitre: "Une collection unique inspirée des mystères de l'univers", ctaTexte: "Découvrir le cosmos", ctaLien: "produits", overlay: 60 },
      vedettes: { actif: true, titre: "Sélection Cosmos", nombre: 8, triPar: "featured" },
      collections: { actif: true, titre: "Univers de marque" },
      promo: { actif: true, titre: "Offre Cosmos", texte: "-20% sur votre première commande — une aventure commence ici", ctaTexte: "Profiter de l'offre" },
      avis: { actif: true, titre: "Ils voyagent avec nous" },
      newsletter: { actif: true, titre: "Entrez dans l'univers", texte: "Accédez en avant-première à nos lancements et collections exclusives", placeholder: "votre@email.com", ctaTexte: "Rejoindre le cosmos" },
    },
  },
  "terre-et-or": {
    colors: { fond: "#fff8f0", accent: "#c2622d", texte: "#2c1503", surface: "#fef3e8" },
    fonts: { titre: "playfair", corps: "inter" },
    radius: "12px",
    sections: {
      annonce: { actif: true, texte: "🌿 Produits naturels & authentiques — Livraison soignée sous 48h — Satisfaction garantie", couleurFond: "#c2622d", couleurTexte: "#ffffff" },
      hero: { actif: true, style: "split", titre: "L'authenticité à l'état pur", sousTitre: "Des produits sélectionnés avec soin, pour une vie plus belle et naturelle", ctaTexte: "Découvrir", ctaLien: "produits", overlay: 30 },
      vedettes: { actif: true, titre: "Nos Coups de Cœur", nombre: 8, triPar: "ventes" },
      collections: { actif: true, titre: "Explorer nos Collections" },
      promo: { actif: true, titre: "Artisanat local", texte: "Chaque produit raconte une histoire unique de savoir-faire et de passion", ctaTexte: "Découvrir l'histoire" },
      avis: { actif: true, titre: "Ils nous font confiance" },
      newsletter: { actif: false, titre: "Restez connecté", texte: "Recevez nos actualités et offres spéciales directement dans votre boîte mail", placeholder: "votre@email.com", ctaTexte: "S'abonner" },
    },
  },
  "ocean-atlantique": {
    colors: { fond: "#010d1f", accent: "#00b4d8", texte: "#e0f4ff", surface: "#021a33" },
    fonts: { titre: "playfair", corps: "inter" },
    radius: "18px",
    sections: {
      annonce: { actif: true, texte: "🌊 Livraison express sous 24h · Paiement 100% sécurisé · Retours gratuits 30j", couleurFond: "#0077b6", couleurTexte: "#ffffff" },
      hero: { actif: true, style: "centered", titre: "L'essence de l'Atlantique", sousTitre: "Une collection inspirée par la richesse des côtes ouest-africaines", ctaTexte: "Plonger dans la collection", ctaLien: "produits", overlay: 55 },
      vedettes: { actif: true, titre: "Sélection Atlantique", nombre: 8, triPar: "featured" },
      collections: { actif: true, titre: "Nos Trésors des Profondeurs" },
      promo: { actif: true, titre: "Vagues d'offres exclusives", texte: "Des promotions aussi vastes que l'Atlantique — profitez-en avant la marée haute", ctaTexte: "Voir les offres" },
      avis: { actif: true, titre: "Ils naviguent avec nous" },
      newsletter: { actif: true, titre: "Entrez dans nos flots", texte: "Recevez en avant-première nos nouveautés et offres exclusives de la côte", placeholder: "votre@email.com", ctaTexte: "M'inscrire" },
    },
  },
  "kente-royal": {
    colors: { fond: "#1a0e00", accent: "#f5a623", texte: "#fff8e8", surface: "#261400" },
    fonts: { titre: "playfair", corps: "inter" },
    radius: "14px",
    sections: {
      annonce: { actif: true, texte: "✦ Authenticité africaine ✦ Artisanat premium ✦ Livraison soignée 48h ✦", couleurFond: "#c8861a", couleurTexte: "#1a0e00" },
      hero: { actif: true, style: "fullscreen", titre: "Kente Royal", sousTitre: "L'excellence du savoir-faire africain dans chaque pièce unique et intemporelle", ctaTexte: "Découvrir la collection royale", ctaLien: "produits", overlay: 40 },
      vedettes: { actif: true, titre: "Pièces d'exception", nombre: 8, triPar: "ventes" },
      collections: { actif: true, titre: "Collections Royales" },
      promo: { actif: true, titre: "L'Artisanat Royal vous attend", texte: "Chaque pièce est un hommage vibrant au riche patrimoine culturel africain", ctaTexte: "Explorer le patrimoine" },
      avis: { actif: true, titre: "La voix de notre communauté royale" },
      newsletter: { actif: false, titre: "Rejoindre la royauté", texte: "Accédez aux créations exclusives et aux offres réservées aux membres", placeholder: "votre@email.com", ctaTexte: "Rejoindre" },
    },
  },
  "bwiti-forest": {
    colors: { fond: "#071a0b", accent: "#4ade80", texte: "#e8ffe0", surface: "#0d2912" },
    fonts: { titre: "playfair", corps: "inter" },
    radius: "20px",
    sections: {
      annonce: { actif: true, texte: "🌿 Produits 100% naturels · Bio & équitable · Livraison éco-responsable", couleurFond: "#15803d", couleurTexte: "#e8ffe0" },
      hero: { actif: true, style: "split", titre: "La forêt primaire vous parle", sousTitre: "Des produits naturels authentiques, en harmonie avec la forêt équatoriale d'Afrique", ctaTexte: "Explorer la forêt", ctaLien: "produits", overlay: 50 },
      vedettes: { actif: true, titre: "Trésors de la Forêt", nombre: 8, triPar: "featured" },
      collections: { actif: true, titre: "Rituels Naturels" },
      promo: { actif: true, titre: "Offrande de la forêt", texte: "La nature vous offre ses secrets les mieux gardés à prix exceptionnel — pour un temps limité", ctaTexte: "Découvrir les secrets" },
      avis: { actif: true, titre: "La forêt témoigne" },
      newsletter: { actif: true, titre: "Entrez dans la forêt", texte: "Recevez nos rituels naturels et secrets de la forêt directement dans votre boîte", placeholder: "votre@email.com", ctaTexte: "Entrer dans la forêt" },
    },
  },
};

export function resolveThemeConfig(themeId: string, savedConfig: Record<string, any> = {}): ThemeConfig {
  const base = DEFAULTS[themeId] || DEFAULTS["terre-et-or"];
  if (!savedConfig || Object.keys(savedConfig).filter(k => k !== "builderHtml" && k !== "builderCss").length === 0) return base;

  return {
    ...base,
    colors: { ...base.colors, ...(savedConfig.colors || {}) },
    fonts: { ...base.fonts, ...(savedConfig.fonts || {}) },
    radius: savedConfig.radius || base.radius,
    sections: {
      annonce: { ...base.sections.annonce, ...(savedConfig.sections?.annonce || {}) },
      hero: { ...base.sections.hero, ...(savedConfig.sections?.hero || {}) },
      vedettes: { ...base.sections.vedettes, ...(savedConfig.sections?.vedettes || {}) },
      collections: { ...base.sections.collections, ...(savedConfig.sections?.collections || {}) },
      promo: { ...base.sections.promo, ...(savedConfig.sections?.promo || {}) },
      avis: { ...base.sections.avis, ...(savedConfig.sections?.avis || {}) },
      newsletter: { ...base.sections.newsletter, ...(savedConfig.sections?.newsletter || {}) },
    },
    builderHtml: savedConfig.builderHtml,
    builderCss: savedConfig.builderCss,
  };
}

export { DEFAULTS as THEME_DEFAULTS };
