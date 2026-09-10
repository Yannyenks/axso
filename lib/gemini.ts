// Client IA — Axso tourne exclusivement sur Google Gemini (SDK officiel @google/genai)
import { completionAuto, type ChatMessage } from "./llm-client";
import { FONTS } from "./theme-fonts";
import { TEMPLATE_META } from "./theme-templates";

const SYSTEME_PROMPT = `Tu es l'assistant IA d'Axso, la plateforme e-commerce premium de l'Afrique.
Tu parles français, avec un ton chaleureux et encourageant, comme un vrai conseiller business africain.
Tu aides les marchands africains à vendre mieux en ligne.
Tu connais les marchés africains, les habitudes d'achat, les prix locaux.
Sois concis, pratique et positif. Utilise des emojis occasionnellement pour rendre les réponses plus vivantes.`;

async function completion(messages: ChatMessage[], maxTokens = 500): Promise<string> {
  const result = await completionAuto(messages, maxTokens);
  return result.text;
}

// Générer une description produit IA
export async function genererDescriptionProduit(
  nom: string,
  categorie: string,
  prix: number,
  devise: string
): Promise<string> {
  return completion(
    [
      { role: "system", content: SYSTEME_PROMPT },
      {
        role: "user",
        content: `Écris une description produit accrocheuse et professionnelle pour :
Nom: ${nom}
Catégorie: ${categorie}
Prix: ${prix} ${devise}

La description doit faire 2-3 phrases, mettre en valeur les bénéfices, et donner envie d'acheter.`,
      },
    ],
    500
  );
}

// Générer les balises SEO pour un produit
export async function genererSEO(
  nomProduit: string,
  description: string,
  categorie: string
): Promise<{ metaTitle: string; metaDescription: string }> {
  try {
    const texte = await completion(
      [
        { role: "system", content: SYSTEME_PROMPT },
        {
          role: "user",
          content: `Génère les balises SEO pour ce produit :
Nom: ${nomProduit}
Description: ${description}
Catégorie: ${categorie}

Réponds en JSON avec : {"metaTitle": "...", "metaDescription": "..."}
Le metaTitle doit faire max 60 caractères. La metaDescription max 155 caractères.`,
        },
      ],
      300
    );
    const json = texte.match(/\{[\s\S]*\}/)?.[0];
    return JSON.parse(json || "{}");
  } catch {
    return {
      metaTitle: nomProduit,
      metaDescription: description.slice(0, 155),
    };
  }
}

// Suggérer un prix selon le marché africain
export async function suggererPrix(
  nom: string,
  categorie: string,
  pays: string
): Promise<string> {
  return completion(
    [
      { role: "system", content: SYSTEME_PROMPT },
      {
        role: "user",
        content: `Suggère une fourchette de prix réaliste pour ce produit sur le marché africain :
Produit: ${nom}
Catégorie: ${categorie}
Pays: ${pays}

Donne une réponse courte avec la fourchette de prix conseillée et un bref raisonnement.`,
      },
    ],
    300
  );
}

// Générer une FAQ produit
export async function genererFaqProduit(
  nom: string,
  description: string
): Promise<Array<{ question: string; reponse: string }>> {
  try {
    const texte = await completion(
      [
        { role: "system", content: SYSTEME_PROMPT },
        {
          role: "user",
          content: `Génère une FAQ de 4 questions pour ce produit :
Nom: ${nom}
Description: ${description || "Produit digital"}

Réponds uniquement en JSON : [{"question":"...","reponse":"..."},...]
Les questions doivent être pratiques (accès, remboursement, format, délai…).`,
        },
      ],
      600
    );
    const json = texte.match(/\[[\s\S]*\]/)?.[0];
    return JSON.parse(json || "[]");
  } catch {
    return [
      { question: "Comment accéder au contenu après achat ?", reponse: "Un lien de téléchargement vous sera envoyé par email immédiatement après confirmation de votre paiement." },
      { question: "Puis-je obtenir un remboursement ?", reponse: "Contactez notre support dans les 7 jours suivant l'achat si vous rencontrez un problème avec votre commande." },
    ];
  }
}

// Générer des avis clients de démonstration à la création d'une boutique —
// pour qu'une boutique neuve inspire confiance dès le premier jour plutôt
// que d'afficher une section "Avis" vide. Marqués verifie:false côté
// appelant (jamais affichés avec un badge "achat vérifié").
export async function genererAvisDemo(
  nomBoutique: string,
  categorie: string,
  produitsNoms: string[]
): Promise<Array<{ note: number; titre: string; commentaire: string; clientNom: string }>> {
  try {
    const texte = await completion(
      [
        { role: "system", content: SYSTEME_PROMPT },
        {
          role: "user",
          content: `Génère 7 avis clients réalistes et variés pour cette boutique africaine :
Boutique: ${nomBoutique}
Catégorie: ${categorie}
Quelques produits: ${produitsNoms.slice(0, 5).join(", ") || "produits variés"}

Avis positifs (note 4 ou 5 sur 5), tons et longueurs variés (certains courts, certains plus détaillés),
prénoms/noms africains variés et réalistes, français naturel (pas de tournures robotiques).

Réponds uniquement en JSON : [{"note":5,"titre":"...","commentaire":"...","clientNom":"..."},...]`,
        },
      ],
      900
    );
    const json = texte.match(/\[[\s\S]*\]/)?.[0];
    const avis = JSON.parse(json || "[]");
    return Array.isArray(avis) ? avis.slice(0, 8) : [];
  } catch {
    return [
      { note: 5, titre: "Très satisfaite", commentaire: "Commande reçue rapidement, produit conforme à la description. Je recommande !", clientNom: "Aminata D." },
      { note: 5, titre: "Excellent service", commentaire: "Livraison rapide et bon accueil. Je repasserai commande.", clientNom: "Kwame O." },
      { note: 4, titre: "Bonne expérience", commentaire: "Produit de qualité, un peu de retard à la livraison mais rien de grave.", clientNom: "Fatou S." },
    ];
  }
}

// ─── Import de template — extraction de style (jamais d'exécution du fichier) ──
// Analyse un fichier HTML envoyé par le marchand pour en extraire l'identité
// visuelle (couleurs, polices, ambiance) et le thème premium existant dont la
// structure se rapproche le plus. Le fichier lui-même n'est jamais rendu ni
// exécuté — seul ce résumé JSON sert à construire un ThemeConfig normal
// (voir app/api/themes/importer/route.ts), rendu par les composants AXSO.
export interface AnalyseTemplateImporte {
  couleurs: { fond?: string; accent?: string; texte?: string; surface?: string };
  polices: { titre?: string; corps?: string };
  ambiance: string[];
  rayonAngles: "anguleux" | "arrondi";
  styleBouton: "filled" | "outlined" | "pill";
  familleProche: string;
}

const FALLBACK_ANALYSE: AnalyseTemplateImporte = {
  couleurs: {},
  polices: {},
  ambiance: ["moderne"],
  rayonAngles: "anguleux",
  styleBouton: "filled",
  familleProche: "terre-et-or",
};

export async function analyserTemplateImporte(html: string): Promise<AnalyseTemplateImporte> {
  const fontIds = FONTS.map((f) => f.v).join(", ");
  const familleIds = Object.keys(TEMPLATE_META).join(", ");
  try {
    const texte = await completion(
      [
        { role: "system", content: SYSTEME_PROMPT },
        {
          role: "user",
          content: `Voici le code HTML/CSS d'un site que le marchand souhaite utiliser comme inspiration visuelle pour sa boutique AXSO. Analyse UNIQUEMENT son style (couleurs, polices, ambiance) — n'exécute ni ne reproduis son code, ne cite aucun texte du site.

Réponds uniquement en JSON strict avec cette forme exacte :
{
  "couleurs": {"fond":"#RRGGBB","accent":"#RRGGBB","texte":"#RRGGBB","surface":"#RRGGBB"},
  "polices": {"titre":"<un id parmi: ${fontIds}>","corps":"<un id parmi: ${fontIds}>"},
  "ambiance": ["adjectif1","adjectif2"],
  "rayonAngles": "anguleux" ou "arrondi",
  "styleBouton": "filled" ou "outlined" ou "pill",
  "familleProche": "<l'id parmi: ${familleIds} dont la structure ressemble le plus à ce site>"
}

Règles :
- Les couleurs doivent être des hex à 6 chiffres tirés réellement des variables CSS du fichier (:root, --bg, --ink, --accent, etc.) — n'invente pas de couleurs si tu n'en trouves pas.
- "polices" doit être choisi STRICTEMENT dans la liste donnée, jamais un nom de police libre.
- "familleProche" doit être choisi STRICTEMENT dans la liste donnée.

Fichier à analyser :
\`\`\`html
${html.slice(0, 60000)}
\`\`\``,
        },
      ],
      700
    );
    const json = texte.match(/\{[\s\S]*\}/)?.[0];
    const parsed = JSON.parse(json || "{}");
    return {
      couleurs: typeof parsed.couleurs === "object" && parsed.couleurs ? parsed.couleurs : {},
      polices: typeof parsed.polices === "object" && parsed.polices ? parsed.polices : {},
      ambiance: Array.isArray(parsed.ambiance) ? parsed.ambiance.slice(0, 6) : FALLBACK_ANALYSE.ambiance,
      rayonAngles: parsed.rayonAngles === "arrondi" ? "arrondi" : "anguleux",
      styleBouton: ["filled", "outlined", "pill"].includes(parsed.styleBouton) ? parsed.styleBouton : "filled",
      familleProche: typeof parsed.familleProche === "string" ? parsed.familleProche : FALLBACK_ANALYSE.familleProche,
    };
  } catch {
    return FALLBACK_ANALYSE;
  }
}

// Chat général avec l'assistant IA
export async function chatAvecIA(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  return completion(
    [{ role: "system", content: SYSTEME_PROMPT }, ...messages],
    1000
  );
}
