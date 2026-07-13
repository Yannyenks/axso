import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;
import { OUTILS_COPILOTE } from "@/lib/ai-agent";
import { hasFreeLLM, completionWithToolsFreeLLM, type ChatMessage, type ToolDefinition } from "@/lib/llm-client";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })),
});

const PROMPT_COPILOTE = `Tu es AXIA, le copilote IA d'Axso — la plateforme e-commerce mondiale alimentée par l'IA.
Tu es un assistant business ultra-compétent qui aide les entrepreneurs du monde entier à créer, gérer et scaler leur boutique en ligne.
Tu prends des actions directes sur la boutique du marchand via tes outils.

Contexte Axso :
- Axso est une plateforme e-commerce mondiale (Europe, Afrique, Amérique, Asie, Moyen-Orient, etc.)
- Produits physiques, digitaux et dropshipping international supportés
- Paiement en ligne pour les produits digitaux (commission 3%)
- Paiement à la livraison + WhatsApp pour les produits physiques/drop (abonnement SaaS)
- Sources d'approvisionnement dropshipping : AliExpress, Amazon, fournisseurs locaux selon le pays

Règles importantes :
- Pour les actions simples (ajouter produit, créer promo, changer thème) : agis directement sans demander confirmation
- Pour les actions critiques (suppression, modifications majeures) : demande confirmation avant d'agir
- Sois proactif : propose des actions pertinentes selon le contexte
- Adapte tes recommandations au marché et à la devise du marchand
- Ton style : chaleureux, direct, efficace. Utilise des emojis modérément.
- Après chaque action réussie, explique ce qui a été fait et propose la prochaine étape logique

Quand tu appelles un outil, explique toujours ce que tu vas faire AVANT de l'appeler.`;

// Convertit les outils Anthropic en format ToolDefinition universel
const OUTILS_UNIVERSELS: ToolDefinition[] = OUTILS_COPILOTE.map((t) => ({
  name: t.name,
  description: t.description ?? "",
  parameters: t.input_schema,
}));

async function executerOutil(
  nomOutil: string,
  input: Record<string, any>,
  tenantId: string
): Promise<{ succes: boolean; resultat: string }> {
  try {
    switch (nomOutil) {
      case "ajouter_produit": {
        const slug = slugify(input.nom) || `produit-${Date.now()}`;
        await prisma.produit.create({
          data: {
            tenantId,
            nom: input.nom,
            slug,
            description: input.description || "",
            prix: input.prix,
            stock: input.stock ?? 10,
            categorie: input.categorie,
            actif: true,
          },
        });
        return { succes: true, resultat: `Produit "${input.nom}" ajouté à ${input.prix} — stock: ${input.stock ?? 10}` };
      }

      case "creer_code_promo": {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) return { succes: false, resultat: "Boutique introuvable" };
        await prisma.codePromo.create({
          data: {
            tenantId,
            code: input.code.toUpperCase(),
            type: input.type,
            valeur: input.valeur,
            minCommande: input.minCommande || null,
            actif: true,
          },
        });
        return { succes: true, resultat: `Code promo "${input.code.toUpperCase()}" créé — ${input.type === "pourcentage" ? `${input.valeur}%` : `${input.valeur} de réduction`}` };
      }

      case "modifier_theme": {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { themeId: input.themeId },
        });
        return { succes: true, resultat: `Thème changé pour "${input.themeId}"` };
      }

      case "lire_statistiques": {
        const jours = input.periode === "7j" ? 7 : input.periode === "30j" ? 30 : 90;
        const depuis = new Date();
        depuis.setDate(depuis.getDate() - jours);

        const [commandes, produits, clients] = await Promise.all([
          prisma.commande.findMany({
            where: { tenantId, createdAt: { gte: depuis } },
            select: { montantTotal: true, statut: true, devise: true },
          }),
          prisma.produit.count({ where: { tenantId, actif: true } }),
          prisma.client.count({ where: { tenantId } }),
        ]);

        const totalVentes = commandes.reduce((s, c) => s + c.montantTotal, 0);
        const commandesConfirmees = commandes.filter((c) => c.statut === "confirmee" || c.statut === "livree").length;
        const devise = commandes[0]?.devise || "XOF";

        return {
          succes: true,
          resultat: `📊 Stats ${input.periode} : ${commandes.length} commandes, ${commandesConfirmees} confirmées, ${totalVentes.toLocaleString()} ${devise} de CA, ${produits} produits actifs, ${clients} clients`,
        };
      }

      default:
        return { succes: false, resultat: `Outil inconnu: ${nomOutil}` };
    }
  } catch (err: any) {
    return { succes: false, resultat: `Erreur: ${err.message}` };
  }
}

// Boucle agentique via freellmapi (format OpenAI tool calling)
async function copiloteViaFreeLLM(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  tenantId: string
): Promise<{ reponse: string; actions: string[] }> {
  const actionsEffectuees: string[] = [];

  // Format OpenAI : system message séparé, puis historique
  let conversation: ChatMessage[] = [
    { role: "system", content: PROMPT_COPILOTE },
    ...messages,
  ];

  for (let i = 0; i < 5; i++) {
    const result = await completionWithToolsFreeLLM(conversation, OUTILS_UNIVERSELS, 1500);

    if (result.stopReason === "end_turn") {
      return { reponse: result.text ?? "Action effectuée.", actions: actionsEffectuees };
    }

    if (result.stopReason === "tool_use" && result.toolCalls?.length) {
      // Ajouter la réponse assistant avec les tool calls dans l'historique
      const assistantMsg: any = {
        role: "assistant",
        content: null,
        tool_calls: result.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
      };
      conversation.push(assistantMsg);

      // Exécuter chaque outil et ajouter les résultats
      for (const tc of result.toolCalls) {
        const { succes, resultat } = await executerOutil(tc.name, tc.arguments, tenantId);
        actionsEffectuees.push(resultat);
        conversation.push({
          role: "tool" as any,
          content: resultat,
          tool_call_id: tc.id,
        } as any);
      }
      continue;
    }

    break;
  }

  return { reponse: "Action effectuée.", actions: actionsEffectuees };
}

// Boucle agentique via Claude Anthropic (format natif — fallback)
async function copiloteViaClaude(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  tenantId: string,
  apiKey: string
): Promise<{ reponse: string; actions: string[] }> {
  const client = new Anthropic({ apiKey });
  const actionsEffectuees: string[] = [];

  let messagesEnCours: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let i = 0; i < 5; i++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: PROMPT_COPILOTE,
      tools: OUTILS_COPILOTE,
      messages: messagesEnCours,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      return { reponse: textBlock ? (textBlock as any).text : "Action effectuée.", actions: actionsEffectuees };
    }

    if (response.stop_reason === "tool_use") {
      messagesEnCours.push({ role: "assistant", content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          const { succes, resultat } = await executerOutil(block.name, block.input as Record<string, any>, tenantId);
          actionsEffectuees.push(resultat);
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: resultat, is_error: !succes });
        }
      }

      messagesEnCours.push({ role: "user", content: toolResults });
      continue;
    }

    break;
  }

  return { reponse: "Action effectuée.", actions: actionsEffectuees };
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const tenantId = (session.user as any)?.tenantId;
    if (!tenantId) return NextResponse.json({ message: "Boutique introuvable" }, { status: 404 });

    const body = await request.json();
    const { messages } = schema.parse(body);

    let reponse: string;
    let actions: string[];

    // Priorité : freellmapi → fallback Claude
    if (hasFreeLLM()) {
      ({ reponse, actions } = await copiloteViaFreeLLM(messages, tenantId));
    } else {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json({
          reponse: "Aucun fournisseur IA configuré. Ajoute FREELLMAPI_KEY ou ANTHROPIC_API_KEY dans .env.local.",
          actions: [],
        });
      }
      ({ reponse, actions } = await copiloteViaClaude(messages, tenantId, apiKey));
    }

    return NextResponse.json({ reponse, actions });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: "Format invalide" }, { status: 400 });
    }
    console.error("[API/AI/COPILOTE]", err);
    return NextResponse.json({ message: "Erreur IA" }, { status: 500 });
  }
}
