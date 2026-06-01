import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { OUTILS_COPILOTE } from "@/lib/ai-agent";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })),
});

const PROMPT_COPILOTE = `Tu es le copilote IA d'Axso, assistant business ultra-compétent spécialisé dans l'e-commerce africain.
Tu peux prendre des actions directes sur la boutique du marchand via tes outils.

Règles importantes :
- Pour les actions simples (ajouter produit, créer promo, changer thème) : agis directement sans demander confirmation
- Pour les actions critiques (suppression, modifications majeures) : demande confirmation avant d'agir
- Sois proactif : propose des actions pertinentes selon le contexte
- Ton style : chaleureux, direct, efficace. Utilise des emojis modérément.
- Après chaque action réussie, explique ce qui a été fait et propose la prochaine étape logique

Quand tu appelles un outil, explique toujours ce que tu vas faire AVANT de l'appeler.`;

// Exécute les tool calls de Claude
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

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const tenantId = (session.user as any)?.tenantId;
    if (!tenantId) return NextResponse.json({ message: "Boutique introuvable" }, { status: 404 });

    const body = await request.json();
    const { messages } = schema.parse(body);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reponse: "L'assistant IA nécessite une clé ANTHROPIC_API_KEY dans .env.local.",
        actions: [],
      });
    }

    const client = new Anthropic({ apiKey });
    const actionsEffectuees: string[] = [];

    // Boucle agentic : Claude peut appeler plusieurs outils en séquence
    let messagesEnCours: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let reponseFinale = "";
    let iterations = 0;

    while (iterations < 5) {
      iterations++;
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: PROMPT_COPILOTE,
        tools: OUTILS_COPILOTE,
        messages: messagesEnCours,
      });

      if (response.stop_reason === "end_turn") {
        const textBlock = response.content.find((b) => b.type === "text");
        reponseFinale = textBlock ? (textBlock as any).text : "Action effectuée.";
        break;
      }

      if (response.stop_reason === "tool_use") {
        // Ajouter la réponse de l'assistant avec les tool calls
        messagesEnCours.push({ role: "assistant", content: response.content });

        // Exécuter chaque outil et collecter les résultats
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content) {
          if (block.type === "tool_use") {
            const { succes, resultat } = await executerOutil(
              block.name,
              block.input as Record<string, any>,
              tenantId
            );
            actionsEffectuees.push(resultat);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: resultat,
              is_error: !succes,
            });
          }
        }

        messagesEnCours.push({ role: "user", content: toolResults });
        continue;
      }

      break;
    }

    return NextResponse.json({ reponse: reponseFinale, actions: actionsEffectuees });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: "Format invalide" }, { status: 400 });
    }
    console.error("[API/AI/COPILOTE]", err);
    return NextResponse.json({ message: "Erreur IA" }, { status: 500 });
  }
}
