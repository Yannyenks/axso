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
// storefront (components/storefront/templates/ImportedLiteralHomePage.tsx) —
// même niveau de confiance que customCss/trackingScripts déjà acceptés sur
// la boutique du marchand lui-même, en plus restrictif puisque aucun JS n'y
// tourne jamais.
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
  root.querySelectorAll("a").forEach((a) => {
    const texte = (a.textContent || "").trim();
    if (!texte) return;
    const hrefActuel = a.getAttribute("href") || "";
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

export function construireTemplateBoutique(params: {
  htmlBrut: string;
  selecteurConteneurProduits: string | null;
  selecteurCarteProduit: string | null;
  slug: string;
  produits: ProduitPourClone[];
}): CloneTemplateResult {
  const { htmlBrut, selecteurConteneurProduits, selecteurCarteProduit, slug, produits } = params;
  const root = parse(htmlBrut, { blockTextElements: { script: false, style: true } });

  // Le contenu des scripts n'est jamais exécuté — on les retire entièrement.
  root.querySelectorAll("script").forEach((s) => s.remove());

  // CSS : concatène tous les blocs <style> avant de les retirer du HTML —
  // ils seront réinjectés à part par le composant de rendu.
  const css = root.querySelectorAll("style").map((s) => s.textContent).join("\n");
  root.querySelectorAll("style").forEach((s) => s.remove());
  root.querySelectorAll("link").forEach((l) => {
    // Conserve les polices Google Fonts éventuelles (@import dans le CSS
    // stocké) mais retire la balise <link> elle-même (retirée du <head>,
    // qui n'existe plus une fois qu'on ne garde que le <body>).
  });

  let conteneurTrouve = false;
  if (selecteurConteneurProduits && selecteurCarteProduit && produits.length > 0) {
    const conteneur = root.querySelector(selecteurConteneurProduits);
    if (conteneur) {
      const cartes = conteneur.querySelectorAll(selecteurCarteProduit);
      if (cartes.length > 0) {
        conteneurTrouve = true;
        const carteModele = cartes[0].outerHTML;
        const nouvellesCartes = produits.slice(0, 24).map((p) => {
          const carte = parse(carteModele).firstChild as ParsedElement;
          if (!carte) return carteModele;

          const img = carte.querySelector("img");
          if (img && p.image) img.setAttribute("src", p.image);

          // Heuristique nom/prix : le prix est le texte le plus court qui
          // contient un chiffre ; le nom est le texte non-numérique le plus
          // long parmi les descendants directs (titres, spans, paragraphes).
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

          // Le lien de la carte (elle-même ou son premier <a> parent/enfant)
          // doit pointer vers la vraie fiche produit.
          const lienCarte = carte.tagName === "A" ? carte : carte.querySelector("a");
          if (lienCarte) lienCarte.setAttribute("href", `/${slug}/produits/${p.id}`);

          return carte.outerHTML;
        });
        conteneur.set_content(nouvellesCartes.join(""));
      }
    }
  }

  reecrireLiensNav(root, slug);
  nettoyerElement(root);

  const body = root.querySelector("body");
  const html = (body ? body.innerHTML : root.toString()).trim();

  return { html, css, conteneurTrouve };
}
