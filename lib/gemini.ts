// Client IA — Axso tourne exclusivement sur Google Gemini (SDK officiel @google/genai)
import { completionAuto, type ChatMessage } from "./llm-client";

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

// Chat général avec l'assistant IA
export async function chatAvecIA(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  return completion(
    [{ role: "system", content: SYSTEME_PROMPT }, ...messages],
    1000
  );
}
