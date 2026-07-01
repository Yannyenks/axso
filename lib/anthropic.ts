// Client IA hybride pour Axso
// Tâches légères  → freellmapi (free tiers : Gemini, Groq, Mistral, etc.)
// Tâches agentiques → Claude Anthropic (tool use natif dans lib/ai-agent.ts)

import Anthropic from "@anthropic-ai/sdk";
import { hasFreeLLM, completionFreeLLM, hasNVIDIA, completionNVIDIA, ChatMessage } from "./llm-client";

const SYSTEME_PROMPT = `Tu es l'assistant IA d'Axso, la plateforme e-commerce premium de l'Afrique.
Tu parles français, avec un ton chaleureux et encourageant, comme un vrai conseiller business africain.
Tu aides les marchands africains à vendre mieux en ligne.
Tu connais les marchés africains, les habitudes d'achat, les prix locaux.
Sois concis, pratique et positif. Utilise des emojis occasionnellement pour rendre les réponses plus vivantes.`;

// Singleton Claude (utilisé uniquement en fallback si freellmapi absent)
let claudeClient: Anthropic | null = null;
function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante");
    claudeClient = new Anthropic({ apiKey });
  }
  return claudeClient;
}

// Routeur : freellmapi en priorité, Claude en fallback
async function completion(
  messages: ChatMessage[],
  maxTokens = 500
): Promise<string> {
  if (hasFreeLLM()) {
    const result = await completionFreeLLM(messages, maxTokens);
    return result.text;
  }
  if (hasNVIDIA()) {
    const result = await completionNVIDIA(messages, maxTokens);
    return result.text;
  }
  // Fallback Claude Anthropic
  const anthropic = getClaudeClient();
  const [systemMsg, ...rest] = messages;
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: systemMsg?.role === "system" ? systemMsg.content : SYSTEME_PROMPT,
    messages: (systemMsg?.role === "system" ? rest : messages).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });
  return (response.content[0] as any).text;
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

// Chat général avec l'assistant IA
export async function chatAvecIA(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  return completion(
    [{ role: "system", content: SYSTEME_PROMPT }, ...messages],
    1000
  );
}
