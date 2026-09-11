// ─── Import de template — clone visuel exact ──────────────────────────────────
// Contrairement à l'extraction de style (couleurs/polices posées sur un thème
// premium existant), cette voie reproduit LITTÉRALEMENT le HTML/CSS envoyé
// par le marchand — même copywriting, même mise en page — en y branchant
// uniquement ce qu'il faut pour que ça fonctionne comme une vraie boutique
// AXSO : vrais produits (nom/prix/photo/lien), navigation vers le panier /
// la liste produits / le contact, aucune trace de script exécuté.
//
// Sécurité : tout <script> est retiré (jamais exécuté), tout attribut
// gestionnaire d'événement (onclick, onerror...) et tout lien
// "javascript:" sont neutralisés avant stockage. Le HTML obtenu est un
// simple bloc statique + CSS, injecté via dangerouslySetInnerHTML côté
// storefront (components/storefront/templates/ImportedLiteral*.tsx) — même
// niveau de confiance que customCss/trackingScripts déjà acceptés sur la
// boutique du marchand lui-même, en plus restrictif puisque aucun JS n'y
// tourne jamais.
//
// Étendu (AXSO Design + import manuel multi-pages) pour couvrir, en plus de
// l'accueil (construireTemplateBoutique) : la liste boutique — même grille
// que l'accueil (clonerGrilleProduits, factorisée) —, la fiche produit à un
// seul exemplaire (clonerFicheProduit), et l'« habillage » (chrome visuel
// seul, sans reproduire ni deviner la logique) du panier/checkout/
// confirmation (extraireChrome) — ces 3 dernières pages restent pilotées
// par les vrais composants AXSO (CartContent, CheckoutForm...) enchâssés
// dans le chrome cloné, jamais par une reconstruction du HTML/JS d'origine :
// trop risqué sur un flux qui touche à de l'argent réel.
import { parse, type HTMLElement as ParsedElement } from "node-html-parser";

export interface ProduitPourClone {
  id: string;
  nom: string;
  prixAffiche: string; // déjà formaté (formatMontant + prixClient) par l'appelant
  image: string | null;
}

export interface CloneTemplateResult {
  html: string;
  css: string;
  conteneurTrouve: boolean;
}

const ATTRS_DANGEREUX = /^on/i;
const PROTOCOLE_DANGEREUX = /^\s*javascript:/i;
// Élément (pas un commentaire HTML : node-html-parser ne les préserve pas de
// façon fiable au ré-encodage) — recherché tel quel comme simple chaîne dans
// le HTML final pour couper avant/après (voir ImportedLiteral*Shell.tsx).
export const MARQUEUR_SLOT = '<div data-axso-slot="1"></div>';
export const ATTR_AJOUTER_PANIER = "data-axso-add-to-cart";

function nettoyerElement(el: ParsedElement) {
  // Retire tout gestionnaire d'événement inline et tout lien javascript:.
  for (const attr of Object.keys(el.attributes || {})) {
    if (ATTRS_DANGEREUX.test(attr)) {
      el.removeAttribute(attr);
      continue;
    }
    if ((attr === "href" || attr === "src") && PROTOCOLE_DANGEREUX.test(el.getAttribute(attr) || "")) {
      el.removeAttribute(attr);
    }
  }
  for (const enfant of el.childNodes) {
    if ((enfant as ParsedElement).attributes !== undefined) nettoyerElement(enfant as ParsedElement);
  }
}

// Réécrit les liens de nav vers les vraies routes AXSO d'après le texte du
// lien (heuristique simple, sans dépendre de classes CSS spécifiques à un
// template précis — fonctionne sur n'importe quel fichier envoyé).
function reecrireLiensNav(root: ParsedElement, slug: string) {
  const regles: Array<{ motifs: RegExp; href: string }> = [
    { motifs: /panier|cart/i, href: `/${slug}/panier` },
    { motifs: /(?<!sous-)(?<!suivi )produits?|boutique|shop|collection/i, href: `/${slug}/produits` },
    { motifs: /contact/i, href: `/${slug}/contact` },
    { motifs: /(à propos|a propos|about)/i, href: `/${slug}/a-propos` },
    { motifs: /accueil|home/i, href: `/${slug}` },
  ];
  const prefixeProduitDeja = `/${slug}/produits/`;
  root.querySelectorAll("a").forEach((a) => {
    const texte = (a.textContent || "").trim();
    if (!texte) return;
    const hrefActuel = a.getAttribute("href") || "";
    // Ne touche jamais un lien déjà réécrit vers une fiche produit précise
    // par clonerGrilleProduits/lierProduitAuGabarit — sans cette garde, un
    // nom ou prix de produit contenant par coïncidence un mot-clé de nav
    // (ex. "Produit", "Collection été") écraserait le lien déjà correct.
    if (hrefActuel.startsWith(prefixeProduitDeja) && hrefActuel.length > prefixeProduitDeja.length) return;
    // Ne touche pas aux liens déjà explicitement fonctionnels (ancre interne
    // vers une section de la page, ex: #collection) sauf s'ils ne mènent
    // nulle part (# seul) — dans ce cas on tente de les rattacher.
    if (hrefActuel.startsWith("#") && hrefActuel.length > 1) return;
    for (const regle of regles) {
      if (regle.motifs.test(texte)) {
        a.setAttribute("href", regle.href);
        return;
      }
    }
  });
}

// Préparation commune à tous les points d'entrée : parse, retire les
// <script> (jamais exécutés), extrait puis retire les <style> (réinjectés à
// part par le composant de rendu).
function parserEtExtraireCss(htmlBrut: string): { root: ParsedElement; css: string } {
  const root = parse(htmlBrut, { blockTextElements: { script: false, style: true } });
  root.querySelectorAll("script").forEach((s) => s.remove());
  const css = root.querySelectorAll("style").map((s) => s.textContent).join("\n");
  root.querySelectorAll("style").forEach((s) => s.remove());
  return { root, css };
}

function finaliser(root: ParsedElement, slug: string): string {
  reecrireLiensNav(root, slug);
  nettoyerElement(root);
  const body = root.querySelector("body");
  return (body ? body.innerHTML : root.toString()).trim();
}

// Clone une grille de produits répétée (accueil ET liste boutique) — clone
// la première carte trouvée comme gabarit, puis en génère une par produit
// réel avec nom/prix/image/lien réécrits. Mute `root` en place ; retourne si
// un conteneur+carte ont effectivement été trouvés.
function clonerGrilleProduits(
  root: ParsedElement,
  selecteurConteneurProduits: string | null,
  selecteurCarteProduit: string | null,
  slug: string,
  produits: ProduitPourClone[]
): boolean {
  if (!selecteurConteneurProduits || !selecteurCarteProduit || produits.length === 0) return false;
  const conteneur = root.querySelector(selecteurConteneurProduits);
  if (!conteneur) return false;
  const cartes = conteneur.querySelectorAll(selecteurCarteProduit);
  if (cartes.length === 0) return false;

  const carteModele = cartes[0].outerHTML;
  const nouvellesCartes = produits.slice(0, 24).map((p) => {
    const carte = parse(carteModele).firstChild as ParsedElement;
    if (!carte) return carteModele;

    const img = carte.querySelector("img");
    if (img && p.image) img.setAttribute("src", p.image);

    // Heuristique nom/prix : le prix est le texte qui correspond au format
    // monétaire strict ; le nom est le texte non-numérique le plus long
    // parmi les descendants directs (titres, spans, paragraphes).
    const candidats = carte.querySelectorAll("*").filter((el) => {
      const t = (el.textContent || "").trim();
      return t.length > 0 && el.childNodes.every((c) => (c as any).nodeType === 3 || (c as any).nodeType === undefined || !(c as ParsedElement).tagName);
    });
    const candidatPrix = candidats.find((el) =>
      /^[\d][\d\s.,]*\s*(FCFA|CFA|XOF|XAF|F|€|EUR|\$|USD)?$/i.test((el.textContent || "").trim())
    );
    const candidatNom = candidats
      .filter((el) => el !== candidatPrix)
      .sort((a, b) =>
        (b.textContent || "").replace(/[^a-zA-ZÀ-ÿ]/g, "").length -
        (a.textContent || "").replace(/[^a-zA-ZÀ-ÿ]/g, "").length
      )[0];

    if (candidatPrix) candidatPrix.set_content(p.prixAffiche);
    if (candidatNom) candidatNom.set_content(p.nom);

    // Le lien de la carte (elle-même ou son premier <a> parent/enfant) doit
    // pointer vers la vraie fiche produit.
    const lienCarte = carte.tagName === "A" ? carte : carte.querySelector("a");
    if (lienCarte) lienCarte.setAttribute("href", `/${slug}/produits/${p.id}`);

    return carte.outerHTML;
  });
  conteneur.set_content(nouvellesCartes.join(""));
  return true;
}

export function construireTemplateBoutique(params: {
  htmlBrut: string;
  selecteurConteneurProduits: string | null;
  selecteurCarteProduit: string | null;
  slug: string;
  produits: ProduitPourClone[];
}): CloneTemplateResult {
  const { htmlBrut, selecteurConteneurProduits, selecteurCarteProduit, slug, produits } = params;
  const { root, css } = parserEtExtraireCss(htmlBrut);
  const conteneurTrouve = clonerGrilleProduits(root, selecteurConteneurProduits, selecteurCarteProduit, slug, produits);
  const html = finaliser(root, slug);
  return { html, css, conteneurTrouve };
}

// Fiche produit (PDP) — clone la zone désignée UNE SEULE FOIS (pas de
// répétition) et y injecte le produit réel. Ne branche aucun handler de clic
// ici : le bouton d'achat retrouvé par son texte est juste marqué
// (ATTR_AJOUTER_PANIER) — c'est le composant client React qui lui attache le
// vrai onClick (useCartStore), jamais de JS cloné/exécuté.
//
// Contrairement à l'accueil/la liste boutique (figées avec un instantané de
// produits au moment de l'import — limitation acceptée, comme aujourd'hui),
// la fiche produit affiche un produit DIFFÉRENT à chaque URL : on ne peut
// donc pas figer une seule liaison au moment de l'import. Découpé en deux
// étapes : extraireGabaritFicheProduit (une fois, à l'import — isole juste
// la zone comme fragment réutilisable, sans produit) et lierProduitAuGabarit
// (à chaque requête storefront, avec le vrai produit demandé).

// Étape import — isole la zone fiche-produit comme fragment réutilisable
// (aucun produit encore lié). Stocké tel quel dans ThemeConfig.builderHtmlProduit.
export function extraireGabaritFicheProduit(params: {
  htmlBrut: string;
  selecteurZoneProduit: string | null;
}): { gabarit: string; css: string; zoneTrouvee: boolean } {
  const { htmlBrut, selecteurZoneProduit } = params;
  const { root, css } = parserEtExtraireCss(htmlBrut);
  const zone = selecteurZoneProduit ? root.querySelector(selecteurZoneProduit) : null;
  if (!zone) return { gabarit: "", css, zoneTrouvee: false };
  nettoyerElement(zone as ParsedElement);
  return { gabarit: zone.outerHTML.trim(), css, zoneTrouvee: true };
}

// Étape requête — reçoit le petit fragment déjà isolé (pas la page entière)
// et y lie le produit réellement demandé. Rapide (fragment isolé, pas de
// sélecteur à chercher dans tout le document) : appelable à chaque rendu
// SSR de la fiche produit sans coût d'appel IA.
export function lierProduitAuGabarit(gabarit: string, slug: string, produit: ProduitPourClone): string {
  if (!gabarit) return "";
  const zone = parse(gabarit).firstChild as ParsedElement;
  if (!zone) return gabarit;

  const img = zone.querySelector("img");
  if (img && produit.image) img.setAttribute("src", produit.image);

  const candidats = zone.querySelectorAll("*").filter((el) => {
    const t = (el.textContent || "").trim();
    return t.length > 0 && el.childNodes.every((c) => (c as any).nodeType === 3 || (c as any).nodeType === undefined || !(c as ParsedElement).tagName);
  });
  const candidatPrix = candidats.find((el) =>
    /^[\d][\d\s.,]*\s*(FCFA|CFA|XOF|XAF|F|€|EUR|\$|USD)?$/i.test((el.textContent || "").trim())
  );
  const candidatNom = candidats
    .filter((el) => el !== candidatPrix)
    .sort((a, b) =>
      (b.textContent || "").replace(/[^a-zA-ZÀ-ÿ]/g, "").length -
      (a.textContent || "").replace(/[^a-zA-ZÀ-ÿ]/g, "").length
    )[0];
  if (candidatPrix) candidatPrix.set_content(produit.prixAffiche);
  if (candidatNom) candidatNom.set_content(produit.nom);

  // Bouton d'achat retrouvé par texte visible — jamais par classe (trop
  // spécifique à un template précis).
  const boutonAchat = zone.querySelectorAll("button, a").find((el) =>
    /ajouter|acheter|commander|add to cart|buy/i.test((el.textContent || "").trim())
  );
  boutonAchat?.setAttribute(ATTR_AJOUTER_PANIER, "1");

  reecrireLiensNav(zone, slug);
  return zone.outerHTML.trim();
}

// Panier / commande / confirmation — n'essaie jamais de recloner ni de
// rebrancher la logique JS d'origine (trop risqué sur un flux qui touche à
// de l'argent réel). Garde tout le chrome visuel de la page, remplace
// uniquement la zone désignée par un marqueur : le composant de rendu y
// enchâsse le vrai composant AXSO (CartContent/CheckoutForm/confirmation).
export function extraireChrome(params: {
  htmlBrut: string;
  selecteurZoneRemplacement: string | null;
  slug: string;
}): CloneTemplateResult {
  const { htmlBrut, selecteurZoneRemplacement, slug } = params;
  const { root, css } = parserEtExtraireCss(htmlBrut);

  let zoneTrouvee = false;
  const zone = selecteurZoneRemplacement ? root.querySelector(selecteurZoneRemplacement) : null;
  if (zone) {
    zoneTrouvee = true;
    zone.set_content(MARQUEUR_SLOT);
  }

  const html = finaliser(root, slug);
  return { html, css, conteneurTrouve: zoneTrouvee };
}
