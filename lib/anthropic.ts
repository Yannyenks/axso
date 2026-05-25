// Client Anthropic Claude pour l'assistant IA Axso
import Anthropic from "@anthropic-ai/sdk";

// Singleton client Anthropic (côté serveur uniquement)
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante");
    client = new Anthropic({ apiKey });
  }
  return client;
}

const SYSTEME_PROMPT = `Tu es l'assistant IA d'Axso, la plateforme e-commerce premium de l'Afrique.
Tu parles français, avec un ton chaleureux et encourageant, comme un vrai conseiller business africain.
Tu aides les marchands africains à vendre mieux en ligne.
Tu connais les marchés africains, les habitudes d'achat, les prix locaux.
Sois concis, pratique et positif. Utilise des emojis occasionnellement pour rendre les réponses plus vivantes.`;

// Générer une description produit IA
export async function genererDescriptionProduit(
  nom: string,
  categorie: string,
  prix: number,
  devise: string
): Promise<string> {
  const anthropic = getClient();
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: SYSTEME_PROMPT,
    messages: [
      {
        role: "user",
        content: `Écris une description produit accrocheuse et professionnelle pour :
Nom: ${nom}
Catégorie: ${categorie}
Prix: ${prix} ${devise}

La description doit faire 2-3 phrases, mettre en valeur les bénéfices, et donner envie d'acheter.`,
      },
    ],
  });

  return (message.content[0] as any).text;
}

// Générer les balises SEO pour un produit
export async function genererSEO(
  nomProduit: string,
  description: string,
  categorie: string
): Promise<{ metaTitle: string; metaDescription: string }> {
  const anthropic = getClient();
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    system: SYSTEME_PROMPT,
    messages: [
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
  });

  try {
    const text = (message.content[0] as any).text;
    const json = text.match(/\{[\s\S]*\}/)?.[0];
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
  const anthropic = getClient();
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    system: SYSTEME_PROMPT,
    messages: [
      {
        role: "user",
        content: `Suggère une fourchette de prix réaliste pour ce produit sur le marché africain :
Produit: ${nom}
Catégorie: ${categorie}
Pays: ${pays}

Donne une réponse courte avec la fourchette de prix conseillée et un bref raisonnement.`,
      },
    ],
  });

  return (message.content[0] as any).text;
}

// Chat général avec l'assistant IA
export async function chatAvecIA(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: SYSTEME_PROMPT,
    messages,
  });

  return (response.content[0] as any).text;
}
