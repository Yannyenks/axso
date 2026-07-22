import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAgentStream } from "@/lib/agent-runner";
import type { ToolDefinition } from "@/lib/llm-client";

const SYSTEM_PROMPT = `Tu es AXIA, l'agent IA intelligent d'Axso — la plateforme e-commerce pour entrepreneurs africains.
Tu as accès en temps réel aux données de la boutique : stock produits, commandes, clients, revenus.
Utilise toujours tes outils pour récupérer les données avant de répondre.
Style : concis, direct, chiffres précis, francophone. Ne dis jamais "je n'ai pas accès" — utilise tes outils.`;

const TOOLS: ToolDefinition[] = [
  {
    name: "getInventory",
    description: "Récupère le stock des produits de la boutique",
    parameters: {
      type: "object",
      properties: {
        lowStockOnly: { type: "boolean", description: "Retourner seulement les produits en stock faible (≤5)" },
      },
      required: [],
    },
  },
  {
    name: "getOrders",
    description: "Récupère les commandes récentes",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Nombre de commandes (défaut 10)" },
        statut: { type: "string", description: "Filtrer par statut: en_attente, confirmee, en_preparation, expediee, livree, annulee" },
      },
      required: [],
    },
  },
  {
    name: "getClients",
    description: "Récupère les clients et leurs statistiques",
    parameters: {
      type: "object",
      properties: {
        top: { type: "boolean", description: "Si true, retourne les meilleurs clients par dépense totale" },
        limit: { type: "number", description: "Nombre de clients (défaut 10)" },
      },
      required: [],
    },
  },
  {
    name: "getDashboardStats",
    description: "Récupère les statistiques globales : nombre de commandes, clients, produits, revenus",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "getTopProducts",
    description: "Récupère les produits actifs de la boutique",
    parameters: {
      type: "object",
      properties: { limit: { type: "number", description: "Nombre de produits (défaut 10)" } },
      required: [],
    },
  },
];

async function executeOutil(name: string, args: Record<string, any>, tenantId: string) {
  try {
    switch (name) {
      case "getInventory": {
        const where: any = { tenantId, actif: true };
        if (args.lowStockOnly) where.stock = { lte: 5 };
        const produits = await prisma.produit.findMany({
          where,
          select: { nom: true, stock: true, prix: true, categorie: true, sku: true },
          take: 30,
          orderBy: { stock: "asc" },
        });
        return { succes: true, resultat: JSON.stringify(produits) };
      }
      case "getOrders": {
        const where: any = { tenantId };
        if (args.statut) where.statut = args.statut;
        const commandes = await prisma.commande.findMany({
          where,
          take: args.limit ?? 10,
          orderBy: { createdAt: "desc" },
          select: { numero: true, statut: true, montantTotal: true, devise: true, createdAt: true, clientNom: true, ville: true },
        });
        return { succes: true, resultat: JSON.stringify(commandes) };
      }
      case "getClients": {
        const clients = await prisma.client.findMany({
          where: { tenantId },
          take: args.limit ?? 10,
          orderBy: args.top ? { totalDepense: "desc" } : { createdAt: "desc" },
          select: { nom: true, email: true, totalDepense: true, totalCommandes: true, ville: true, pays: true },
        });
        return { succes: true, resultat: JSON.stringify(clients) };
      }
      case "getDashboardStats": {
        const [nbCommandes, nbClients, nbProduits, revenus] = await Promise.all([
          prisma.commande.count({ where: { tenantId } }),
          prisma.client.count({ where: { tenantId } }),
          prisma.produit.count({ where: { tenantId, actif: true } }),
          prisma.commande.aggregate({
            where: { tenantId, statut: "livree" },
            _sum: { montantTotal: true },
          }),
        ]);
        return {
          succes: true,
          resultat: JSON.stringify({
            nbCommandes,
            nbClients,
            nbProduits,
            revenuTotal: revenus._sum.montantTotal ?? 0,
          }),
        };
      }
      case "getTopProducts": {
        const produits = await prisma.produit.findMany({
          where: { tenantId, actif: true },
          take: args.limit ?? 10,
          orderBy: { createdAt: "desc" },
          select: { nom: true, prix: true, stock: true, categorie: true, cout: true },
        });
        return { succes: true, resultat: JSON.stringify(produits) };
      }
      default:
        return { succes: false, resultat: `Outil ${name} inconnu` };
    }
  } catch (err: any) {
    return { succes: false, resultat: `Erreur: ${err?.message?.slice(0, 120)}` };
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Non autorisé", { status: 401 });

  const tenantId = (session.user as any)?.tenantId;
  if (!tenantId) return new Response("Tenant requis", { status: 400 });

  const { messages } = await req.json();
  if (!messages?.length) return new Response("Messages requis", { status: 400 });

  const stream = runAgentStream(SYSTEM_PROMPT, messages, TOOLS, tenantId, executeOutil);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
