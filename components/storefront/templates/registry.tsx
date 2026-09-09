// Registre des thèmes premium — chaque entrée fournit son propre arbre de
// composants pour les 6 pages storefront. Les routes sous app/(storefront)/
// gardent leur logique de récupération de données inchangée ; elles délèguent
// juste le rendu ici quand `TEMPLATE_IDS.has(tenant.themeId)` (voir
// lib/theme-templates.ts).
import { NoirAtelierHomePage } from "./noir-atelier/HomePage";
import { NoirAtelierProductListPage } from "./noir-atelier/ProductListPage";
import { NoirAtelierProductPage } from "./noir-atelier/ProductPage";
import { NoirAtelierCollectionPage } from "./noir-atelier/CollectionPage";
import { NoirAtelierAboutPage } from "./noir-atelier/AboutPage";
import { NoirAtelierContactPage } from "./noir-atelier/ContactPage";
import { PulseHomePage } from "./pulse/HomePage";
import { PulseProductListPage } from "./pulse/ProductListPage";
import { PulseProductPage } from "./pulse/ProductPage";
import { PulseCollectionPage } from "./pulse/CollectionPage";
import { PulseAboutPage } from "./pulse/AboutPage";
import { PulseContactPage } from "./pulse/ContactPage";
import { Archive01HomePage } from "./archive01/HomePage";
import { Archive01ProductListPage } from "./archive01/ProductListPage";
import { Archive01ProductPage } from "./archive01/ProductPage";
import { Archive01CollectionPage } from "./archive01/CollectionPage";
import { Archive01AboutPage } from "./archive01/AboutPage";
import { Archive01ContactPage } from "./archive01/ContactPage";

export interface TemplateComponents {
  HomePage: React.ComponentType<any>;
  ProductListPage: React.ComponentType<any>;
  ProductPage: React.ComponentType<any>;
  CollectionPage: React.ComponentType<any>;
  AboutPage: React.ComponentType<any>;
  ContactPage: React.ComponentType<any>;
}

export const TEMPLATE_COMPONENTS: Record<string, TemplateComponents> = {
  "noir-atelier": {
    HomePage: NoirAtelierHomePage,
    ProductListPage: NoirAtelierProductListPage,
    ProductPage: NoirAtelierProductPage,
    CollectionPage: NoirAtelierCollectionPage,
    AboutPage: NoirAtelierAboutPage,
    ContactPage: NoirAtelierContactPage,
  },
  "pulse": {
    HomePage: PulseHomePage,
    ProductListPage: PulseProductListPage,
    ProductPage: PulseProductPage,
    CollectionPage: PulseCollectionPage,
    AboutPage: PulseAboutPage,
    ContactPage: PulseContactPage,
  },
  "archive01": {
    HomePage: Archive01HomePage,
    ProductListPage: Archive01ProductListPage,
    ProductPage: Archive01ProductPage,
    CollectionPage: Archive01CollectionPage,
    AboutPage: Archive01AboutPage,
    ContactPage: Archive01ContactPage,
  },
};
