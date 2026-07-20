// Agent Universel AXIA — tous les outils fusionnés + connecteurs MCP
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { runAgent, runAgentStream, type AgentTool, type ToolExecutor } from "@/lib/agent-runner";
import { executerOutilMcp } from "@/lib/mcp/executor";
import { generateProductImage, buildProductImagePrompt } from "@/lib/image-gen";
import { pollinationsVideoUrl, pollinationsAudioUrl, pollinationsImageUrl } from "@/lib/llm-client";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })),
  imageUrl: z.string().optional(),
  fast: z.boolean().optional(),
  stream: z.boolean().optional(),
});

const BASE_SYSTEM_PROMPT = `Tu es AXIA — l'IA e-commerce d'Axso, propulsée par Claude.
Ton style : intelligent, naturel, direct. Comme un expert qui parle franchement, sans blabla.

━━━ COMPORTEMENT FONDAMENTAL ━━━

Tu réponds comme un expert humain qui CONNAÎT déjà la boutique.
Tu NE joues PAS le rôle d'un assistant qui découvre les infos et les récite.

Quand l'utilisateur parle, tu :
1. Comprends CE QU'IL VEUT vraiment
2. Utilises tes outils EN SILENCE pour obtenir le contexte nécessaire
3. Réponds directement à ce qu'il veut — avec ton propre jugement et expertise

━━━ RÈGLES STRICTES ━━━

JAMAIS :
- Réciter des données brutes ("Vous avez 3 produits : …", "Voici les infos :")
- Terminer par "Que puis-je faire pour vous ?" ou "Comment puis-je vous aider ?"
- Dire "Bienvenue", "Je suis là pour vous aider", "Bien sûr !", "Absolument !"
- Répéter l'historique de la boutique à l'utilisateur qui la connaît déjà
- Faire semblant d'avoir utilisé un outil sans l'avoir utilisé

TOUJOURS :
- Répondre à LA question posée, directement
- Utiliser les données des outils pour CONSTRUIRE ta réponse, pas pour les afficher
- Être aussi naturel et intelligent que Claude dans une vraie conversation
- Donner des conseils concrets, actionnables, adaptés au contexte réel

━━━ EXEMPLES DE BON COMPORTEMENT ━━━

❌ MAUVAIS — "Voici un résumé de votre boutique : vous avez 3 produits, 1 client…"
✓ BON — "Avec ta formation à 35k XAF comme produit phare, voici comment scaler rapidement : …"

❌ MAUVAIS — "Je vais d'abord lire votre boutique pour mieux vous aider."
✓ BON — [appelle lire_boutique silencieusement, puis répond directement]

❌ MAUVAIS — "Que puis-je faire pour vous aujourd'hui ?"
✓ BON — [répond à ce qui a été demandé]

━━━ OUTILS (utiliser silencieusement) ━━━
lire_boutique · stats_globales · rapport_complet · ajouter_produit · generer_image
creer_code_promo · envoyer_campagne_email · whatsapp_diffusion · generer_post_social
generer_video · higgsfield_generer_video · lister_produits · lister_clients · 20+ autres

Médias générés → affiche directement : [IMAGE:url] [VIDEO:url] [AUDIO:url]

━━━ MARCHÉ ━━━
Afrique (Wave, Orange Money, MTN MoMo, Flooz) + Europe. WhatsApp = canal #1.`;

function buildSystemPrompt(ctx: { boutique?: string; pays?: string; devise?: string; categorie?: string }) {
  const lines = [BASE_SYSTEM_PROMPT, ""];
  if (ctx.boutique) lines.push(`BOUTIQUE ACTIVE : "${ctx.boutique}"`);
  if (ctx.pays || ctx.devise) lines.push(`Marché : ${ctx.pays ?? "international"} | Devise : ${ctx.devise ?? "XOF"}`);
  if (ctx.categorie) lines.push(`Catégorie principale : ${ctx.categorie}`);
  return lines.join("\n");
}


const PAYS_THEMES: Record<string, string> = {
  SN: "terre-et-or", CM: "bwiti-forest", CI: "kente-royal",
  GH: "ocean-atlantique", NG: "noir-obsidien", KE: "violet-cosmos", MA: "terre-et-or",
};

const OUTILS: AgentTool[] = [
  // ─── IMAGES ───────────────────────────────────────────────────────────────
  {
    name: "generer_image",
    description: "Génère une image produit ultra HD via fal.ai FLUX.1-dev ou Pollinations (gptimage/seedream-pro/flux). TOUJOURS appeler avant ajouter_produit.",
    parameters: {
      type: "object" as const,
      properties: {
        description: { type: "string", description: "Description précise du produit/visuel à générer" },
        categorie: { type: "string", description: "Catégorie : mode, cosmétiques, artisanat, électronique, alimentaire, etc." },
        style: { type: "string", enum: ["product_white", "product_lifestyle", "social_media", "banner"], description: "Style de rendu" },
      },
      required: ["description", "categorie"],
    },
  },
  // ─── VIDÉO ────────────────────────────────────────────────────────────────
  {
    name: "generer_video",
    description: "Génère une vidéo IA (Seedance 2.0, Veo, Wan Pro 1080p) depuis un prompt. Retourne l'URL de la vidéo MP4.",
    parameters: {
      type: "object" as const,
      properties: {
        prompt: { type: "string", description: "Description cinématique précise de la vidéo" },
        model: { type: "string", enum: ["seedance-2.0", "veo", "wan-pro-1080p", "wan"], description: "Modèle vidéo" },
        duration: { type: "number", description: "Durée en secondes (3-10)" },
        sujet: { type: "string", description: "Contexte : produit à filmer, style, ambiance" },
      },
      required: ["prompt"],
    },
  },
  // ─── AUDIO / TTS ──────────────────────────────────────────────────────────
  {
    name: "generer_voiceover",
    description: "Génère un audio voix off professionnel (ElevenLabs/Eleven Multilingual). Retourne l'URL MP3.",
    parameters: {
      type: "object" as const,
      properties: {
        texte: { type: "string", description: "Texte à lire (max 500 mots)" },
        voix: { type: "string", enum: ["nova", "alloy", "echo", "shimmer", "onyx", "rachel", "bella", "charlotte", "dorothy"], description: "Voix TTS" },
        langue: { type: "string", description: "Langue : fr, en, ar, wo, etc." },
      },
      required: ["texte"],
    },
  },
  // ─── PRODUITS ─────────────────────────────────────────────────────────────
  {
    name: "ajouter_produit",
    description: "Ajoute un nouveau produit à la boutique (passe imageUrl si tu as généré une image avant)",
    parameters: {
      type: "object" as const,
      properties: {
        nom: { type: "string" },
        description: { type: "string" },
        prix: { type: "number" },
        stock: { type: "number" },
        categorie: { type: "string" },
        imageUrl: { type: "string", description: "URL de l'image générée par generer_image" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["nom", "prix", "categorie"],
    },
  },
  {
    name: "lister_produits",
    description: "Liste les produits du catalogue avec leur statut",
    parameters: {
      type: "object" as const,
      properties: {
        limite: { type: "number" },
        sans_image_seulement: { type: "boolean", description: "Lister uniquement les produits sans image" },
      },
      required: [],
    },
  },
  {
    name: "enrichir_produit",
    description: "Met à jour description, SEO et tags d'un produit",
    parameters: {
      type: "object" as const,
      properties: {
        produitId: { type: "string" },
        description: { type: "string" },
        metaTitle: { type: "string" },
        metaDesc: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        imageUrl: { type: "string" },
      },
      required: ["produitId"],
    },
  },
  {
    name: "mettre_a_jour_prix",
    description: "Change le prix d'un produit avec option prix barré",
    parameters: {
      type: "object" as const,
      properties: {
        produitId: { type: "string" },
        prix: { type: "number" },
        prixCompare: { type: "number" },
      },
      required: ["produitId", "prix"],
    },
  },
  // ─── BOUTIQUE ─────────────────────────────────────────────────────────────
  {
    name: "lire_boutique",
    description: "Lit toutes les infos de la boutique : tenant, produits, stats récentes",
    parameters: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "modifier_boutique",
    description: "Modifie le thème, la description ou les paramètres de la boutique",
    parameters: {
      type: "object" as const,
      properties: {
        themeId: { type: "string", enum: ["noir-obsidien","violet-cosmos","terre-et-or","kente-royal","ocean-atlantique","bwiti-forest"] },
        description: { type: "string" },
        metaTitle: { type: "string" },
        metaDescription: { type: "string" },
      },
      required: [],
    },
  },
  // ─── MARKETING ────────────────────────────────────────────────────────────
  {
    name: "creer_code_promo",
    description: "Crée un code promotionnel actif",
    parameters: {
      type: "object" as const,
      properties: {
        code: { type: "string" },
        type: { type: "string", enum: ["pourcentage", "montant_fixe"] },
        valeur: { type: "number" },
        minCommande: { type: "number" },
      },
      required: ["code", "type", "valeur"],
    },
  },
  {
    name: "envoyer_campagne_email",
    description: "Envoie une campagne email HTML à tous les clients",
    parameters: {
      type: "object" as const,
      properties: {
        sujet: { type: "string" },
        html: { type: "string" },
        segment: { type: "string", enum: ["tous", "vip", "inactifs_30j", "nouveaux"] },
      },
      required: ["sujet", "html"],
    },
  },
  {
    name: "generer_post_social",
    description: "Génère un post prêt à publier pour les réseaux sociaux",
    parameters: {
      type: "object" as const,
      properties: {
        plateforme: { type: "string", enum: ["instagram", "facebook", "tiktok", "whatsapp"] },
        theme: { type: "string" },
        produitNom: { type: "string" },
      },
      required: ["plateforme", "theme"],
    },
  },
  // ─── ANALYTICS ────────────────────────────────────────────────────────────
  {
    name: "stats_globales",
    description: "KPIs : CA, commandes, clients, panier moyen sur une période",
    parameters: {
      type: "object" as const,
      properties: {
        periode: { type: "string", enum: ["7j", "30j", "90j", "365j"] },
      },
      required: ["periode"],
    },
  },
  {
    name: "rapport_complet",
    description: "Rapport business complet 30j : tous les KPIs, top produits, clients",
    parameters: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "produits_performance",
    description: "Classement produits par ventes ou revenus",
    parameters: {
      type: "object" as const,
      properties: {
        tri: { type: "string", enum: ["ventes", "revenu", "stock_critique"] },
        limite: { type: "number" },
      },
      required: ["tri"],
    },
  },
  // ─── CLIENTS ──────────────────────────────────────────────────────────────
  {
    name: "lister_clients",
    description: "Liste les clients avec options de tri et filtrage",
    parameters: {
      type: "object" as const,
      properties: {
        tri: { type: "string", enum: ["depense_desc", "commandes_desc", "recent"] },
        limite: { type: "number" },
        segment: { type: "string", enum: ["tous", "vip", "inactifs_30j", "nouveaux"] },
      },
      required: [],
    },
  },
  {
    name: "envoyer_email_client",
    description: "Envoie un email personnalisé à un segment de clients",
    parameters: {
      type: "object" as const,
      properties: {
        destinataires: { type: "string", enum: ["tous", "inactifs_30j", "vip", "nouveaux"] },
        sujet: { type: "string" },
        html: { type: "string" },
      },
      required: ["destinataires", "sujet", "html"],
    },
  },
  // ─── LIVRAISON ────────────────────────────────────────────────────────────
  {
    name: "dashboard_livraison",
    description: "Vue d'ensemble livraisons : commandes à assigner, en cours, livreurs disponibles",
    parameters: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "assigner_livreur",
    description: "Assigne automatiquement le meilleur livreur disponible à une commande",
    parameters: {
      type: "object" as const,
      properties: {
        commandeId: { type: "string" },
        livreurId: { type: "string" },
      },
      required: ["commandeId", "livreurId"],
    },
  },
  // ─── CONNECTEURS MCP ──────────────────────────────────────────────────────
  {
    name: "meta_poster_facebook",
    description: "Publie MAINTENANT sur Facebook (message + image optionnelle)",
    parameters: { type: "object" as const, properties: { message: { type: "string" }, imageUrl: { type: "string" }, lienUrl: { type: "string" } }, required: ["message"] },
  },
  {
    name: "meta_poster_instagram",
    description: "Publie MAINTENANT sur Instagram (image obligatoire)",
    parameters: { type: "object" as const, properties: { caption: { type: "string" }, imageUrl: { type: "string" } }, required: ["caption", "imageUrl"] },
  },
  {
    name: "meta_planifier_post",
    description: "Programme un post Facebook ou Instagram pour une date future",
    parameters: {
      type: "object" as const,
      properties: {
        plateforme: { type: "string", enum: ["facebook", "instagram"] },
        contenu: { type: "string" },
        imageUrl: { type: "string" },
        planifieLe: { type: "string", description: "ISO 8601 : 2026-06-15T18:00:00" },
      },
      required: ["plateforme", "contenu", "planifieLe"],
    },
  },
  {
    name: "meta_creer_campagne_ads",
    description: "Crée une campagne publicitaire Meta Ads",
    parameters: {
      type: "object" as const,
      properties: {
        nom: { type: "string" },
        objectif: { type: "string", enum: ["OUTCOME_TRAFFIC", "OUTCOME_SALES", "OUTCOME_LEADS", "OUTCOME_AWARENESS"] },
        budget_jour: { type: "number" },
        pays: { type: "array", items: { type: "string" } },
        url_destination: { type: "string" },
      },
      required: ["nom", "objectif", "budget_jour"],
    },
  },
  {
    name: "whatsapp_envoyer_message",
    description: "Envoie un message WhatsApp à un numéro",
    parameters: { type: "object" as const, properties: { telephone: { type: "string" }, message: { type: "string" } }, required: ["telephone", "message"] },
  },
  {
    name: "whatsapp_diffusion",
    description: "Diffuse un message WhatsApp à tous les clients ou un segment (tous/vip/inactifs/nouveaux)",
    parameters: {
      type: "object" as const,
      properties: {
        message: { type: "string" },
        segment: { type: "string", enum: ["tous", "vip", "inactifs", "nouveaux"] },
        code_promo: { type: "string" },
      },
      required: ["message"],
    },
  },
  {
    name: "gmail_envoyer",
    description: "Envoie un email depuis Gmail (nécessite Gmail connecté)",
    parameters: { type: "object" as const, properties: { destinataire: { type: "string" }, sujet: { type: "string" }, corps_html: { type: "string" } }, required: ["destinataire", "sujet", "corps_html"] },
  },
  {
    name: "sms_campagne",
    description: "Envoie un SMS en masse via Africa's Talking",
    parameters: { type: "object" as const, properties: { message: { type: "string" }, segment: { type: "string", enum: ["tous", "vip", "inactifs"] } }, required: ["message", "segment"] },
  },
  // ─── HIGGSFIELD AI ────────────────────────────────────────────────────────
  {
    name: "higgsfield_generer_video",
    description: "Génère une vidéo ultra HD avec Higgsfield (Kling 3.0, Veo 3.1, Sora 2, Cinema 3.5). Pour publicités, produits, contenus sociaux.",
    parameters: {
      type: "object" as const,
      properties: {
        prompt: { type: "string", description: "Description cinématique précise de la vidéo" },
        model: { type: "string", enum: ["kling-3.0", "veo-3.1", "sora-2", "cinema-3.5", "seedance-2.0"], description: "Modèle vidéo" },
        duration: { type: "number", description: "Durée en secondes (5 ou 10)" },
        aspect_ratio: { type: "string", enum: ["16:9", "9:16", "1:1"] },
        style: { type: "string", description: "Style : cinematic, commercial, ugc, lifestyle" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "higgsfield_generer_image",
    description: "Génère une image ultra HD (Recraft 4.1, GPT Image, Seedream 4.0). Pour visuels produits, bannières, posts.",
    parameters: {
      type: "object" as const,
      properties: {
        prompt: { type: "string" },
        model: { type: "string", enum: ["recraft-4.1", "gpt-image", "seedream-4.0", "wan-2.5"] },
        style: { type: "string", description: "photorealistic, illustration, 3d, cinematic" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "higgsfield_video_produit",
    description: "Génère automatiquement une vidéo produit professionnelle depuis un produit de la boutique",
    parameters: {
      type: "object" as const,
      properties: {
        produitId: { type: "string" },
        style: { type: "string", enum: ["commercial", "lifestyle", "ugc", "cinematic"] },
        model: { type: "string" },
      },
      required: ["produitId"],
    },
  },
  {
    name: "higgsfield_lister_outils",
    description: "Liste tous les outils disponibles sur le serveur MCP Higgsfield de l'utilisateur",
    parameters: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "higgsfield_appeler_outil",
    description: "Appelle directement n'importe quel outil Higgsfield MCP (accès aux 40+ outils)",
    parameters: {
      type: "object" as const,
      properties: {
        outil: { type: "string" },
        arguments: { type: "object" },
      },
      required: ["outil"],
    },
  },
];

// ─── EXÉCUTEUR ────────────────────────────────────────────────────────────────
const executeOutil: ToolExecutor = async (nom, args, tenantId) => {
  try {
    switch (nom) {

      case "generer_image": {
        const prompt = buildProductImagePrompt(args.description, args.categorie, args.style || "product_white");
        // Priorité : fal.ai FLUX.1-dev → Pollinations gptimage (avec clé) → Pollinations flux-pro
        let url: string;
        if (process.env.FAL_KEY) {
          url = await generateProductImage({ prompt });
        } else if (process.env.POLLINATIONS_API_KEY) {
          url = pollinationsImageUrl(prompt, "gptimage");
        } else {
          url = await generateProductImage({ prompt });
        }
        return { succes: true, resultat: `IMAGE:${url}` };
      }

      case "generer_video": {
        const model = args.model || "seedance-2.0";
        const duration = Math.min(Math.max(args.duration || 5, 3), 10);
        const fullPrompt = args.sujet ? `${args.prompt}, ${args.sujet}` : args.prompt;
        const url = pollinationsVideoUrl(fullPrompt, model, duration);
        return { succes: true, resultat: `VIDEO:${url}` };
      }

      case "generer_voiceover": {
        if (!process.env.POLLINATIONS_API_KEY) {
          return { succes: false, resultat: "POLLINATIONS_API_KEY requise pour la voix off. Ajoute-la dans .env.local" };
        }
        const voix = args.voix || "nova";
        const url = pollinationsAudioUrl(args.texte, voix, "eleven-multilingual-v2");
        return { succes: true, resultat: `AUDIO:${url}` };
      }

      case "ajouter_produit": {
        const prodSlug = slugify(args.nom) || `produit-${Date.now()}`;
        const images = args.imageUrl ? [args.imageUrl] : [];
        await prisma.produit.create({
          data: {
            tenantId,
            nom: args.nom,
            slug: prodSlug,
            description: args.description || "",
            prix: args.prix,
            stock: args.stock ?? 10,
            categorie: args.categorie,
            images,
            tags: args.tags || [],
            actif: true,
          },
        });
        return { succes: true, resultat: `✅ Produit "${args.nom}" créé à ${args.prix}${images.length ? " avec image IA" : ""}` };
      }

      case "lister_produits": {
        const where: any = { tenantId, actif: true };
        if (args.sans_image_seulement) where.images = { isEmpty: true };
        const produits = await prisma.produit.findMany({
          where, take: args.limite ?? 15, orderBy: { createdAt: "desc" },
          select: { id: true, nom: true, prix: true, categorie: true, images: true, ventes: true, stock: true, description: true },
        });
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { devise: true } });
        return { succes: true, resultat: `[LISTE PRODUITS — utilise pour répondre à la demande, ne recopie pas] ${JSON.stringify({ devise: tenant?.devise, produits })}` };
      }

      case "enrichir_produit": {
        const data: any = {};
        if (args.description) data.description = args.description;
        if (args.metaTitle) data.metaTitle = args.metaTitle.slice(0, 60);
        if (args.metaDesc) data.metaDesc = args.metaDesc.slice(0, 155);
        if (args.tags) data.tags = args.tags;
        if (args.imageUrl) data.images = [args.imageUrl];
        const p = await prisma.produit.findFirst({ where: { id: args.produitId, tenantId }, select: { nom: true } });
        if (!p) return { succes: false, resultat: "Produit introuvable" };
        await prisma.produit.update({ where: { id: args.produitId }, data });
        return { succes: true, resultat: `✅ "${p.nom}" enrichi avec succès` };
      }

      case "mettre_a_jour_prix": {
        const p = await prisma.produit.findFirst({ where: { id: args.produitId, tenantId }, select: { nom: true, prix: true } });
        if (!p) return { succes: false, resultat: "Produit introuvable" };
        await prisma.produit.update({ where: { id: args.produitId }, data: { prix: args.prix, prixCompare: args.prixCompare ?? null } });
        return { succes: true, resultat: `✅ Prix "${p.nom}" : ${p.prix} → ${args.prix}` };
      }

      case "lire_boutique": {
        const [tenant, produits, nbCommandes, nbClients] = await Promise.all([
          prisma.tenant.findUnique({ where: { id: tenantId }, select: { nomBoutique: true, categorie: true, pays: true, devise: true, description: true, themeId: true, slug: true } }),
          prisma.produit.findMany({ where: { tenantId, actif: true }, orderBy: { ventes: "desc" }, take: 5, select: { nom: true, prix: true, ventes: true, images: true } }),
          prisma.commande.count({ where: { tenantId, statut: { in: ["confirmee", "livree"] } } }),
          prisma.client.count({ where: { tenantId } }),
        ]);
        const data = { boutique: tenant, top_produits: produits, commandes_confirmees: nbCommandes, nb_clients: nbClients };
        return { succes: true, resultat: `[CONTEXTE INTERNE — NE PAS RÉPÉTER À L'UTILISATEUR] ${JSON.stringify(data)} [Utilise ces données pour répondre à la question de l'utilisateur directement.]` };
      }

      case "modifier_boutique": {
        const data: any = {};
        if (args.themeId) data.themeId = args.themeId;
        if (args.description) data.description = args.description;
        if (args.metaTitle) data.metaTitle = args.metaTitle;
        if (args.metaDescription) data.metaDescription = args.metaDescription;
        await prisma.tenant.update({ where: { id: tenantId }, data });
        return { succes: true, resultat: `✅ Boutique mise à jour : ${Object.keys(data).join(", ")}` };
      }

      case "creer_code_promo": {
        const exists = await prisma.codePromo.findUnique({ where: { tenantId_code: { tenantId, code: args.code.toUpperCase() } } });
        if (exists) return { succes: false, resultat: `Code "${args.code.toUpperCase()}" existe déjà` };
        await prisma.codePromo.create({ data: { tenantId, code: args.code.toUpperCase(), type: args.type, valeur: args.valeur, minCommande: args.minCommande ?? null, actif: true } });
        const label = args.type === "pourcentage" ? `${args.valeur}%` : `${args.valeur} de réduction`;
        return { succes: true, resultat: `✅ Code "${args.code.toUpperCase()}" créé — ${label}` };
      }

      case "envoyer_campagne_email": {
        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey) return { succes: false, resultat: "RESEND_API_KEY manquante" };
        const [clients, tenant] = await Promise.all([
          prisma.client.findMany({ where: { tenantId }, select: { email: true, nom: true }, take: 50 }),
          prisma.tenant.findUnique({ where: { id: tenantId }, select: { nomBoutique: true } }),
        ]);
        if (!clients.length) return { succes: false, resultat: "Aucun client enregistré" };
        const resend = new Resend(resendKey);
        let envoyes = 0;
        for (const c of clients) {
          try {
            await resend.emails.send({ from: `${tenant?.nomBoutique} <onboarding@resend.dev>`, to: c.email, subject: args.sujet, html: args.html.replace(/\{\{nom\}\}/g, c.nom) });
            envoyes++;
          } catch { /* continue */ }
        }
        return { succes: true, resultat: `✅ Campagne envoyée : ${envoyes}/${clients.length} emails` };
      }

      case "generer_post_social": {
        let ctx = `Plateforme: ${args.plateforme}, Thème: ${args.theme}`;
        if (args.produitNom) {
          const p = await prisma.produit.findFirst({ where: { tenantId, nom: { contains: args.produitNom, mode: "insensitive" } }, select: { nom: true, prix: true } });
          if (p) ctx += `. Produit: ${p.nom} à ${p.prix}`;
        }
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { nomBoutique: true, devise: true } });
        return { succes: true, resultat: `Contexte récupéré pour ${args.plateforme}: ${ctx}. Boutique: ${tenant?.nomBoutique}. Génère le post maintenant.` };
      }

      case "stats_globales": {
        const jours = args.periode === "7j" ? 7 : args.periode === "30j" ? 30 : args.periode === "90j" ? 90 : 365;
        const depuis = new Date(Date.now() - jours * 86400000);
        const [commandes, clients, tenant] = await Promise.all([
          prisma.commande.findMany({ where: { tenantId, createdAt: { gte: depuis } }, select: { montantTotal: true, statut: true, devise: true } }),
          prisma.client.count({ where: { tenantId, createdAt: { gte: depuis } } }),
          prisma.tenant.findUnique({ where: { id: tenantId }, select: { devise: true, nomBoutique: true } }),
        ]);
        const conf = commandes.filter(c => ["confirmee", "livree"].includes(c.statut));
        const ca = conf.reduce((s, c) => s + c.montantTotal, 0);
        const statsData = { periode: args.periode, devise: tenant?.devise, ca: Math.round(ca), commandes: commandes.length, confirmees: conf.length, taux_conversion: commandes.length ? Math.round(conf.length / commandes.length * 100) : 0, panier_moyen: conf.length ? Math.round(ca / conf.length) : 0, nouveaux_clients: clients };
        return { succes: true, resultat: `[DONNÉES STATS — utilise pour rédiger une analyse claire, ne recopie pas le JSON] ${JSON.stringify(statsData)}` };
      }

      case "rapport_complet": {
        const depuis = new Date(Date.now() - 30 * 86400000);
        const [commandes, clients, topProduits, tenant] = await Promise.all([
          prisma.commande.findMany({ where: { tenantId, createdAt: { gte: depuis } }, select: { montantTotal: true, statut: true, devise: true } }),
          prisma.client.aggregate({ where: { tenantId }, _count: true, _sum: { totalDepense: true } }),
          prisma.produit.findMany({ where: { tenantId, actif: true }, orderBy: { ventes: "desc" }, take: 5, select: { nom: true, ventes: true, prix: true } }),
          prisma.tenant.findUnique({ where: { id: tenantId }, select: { nomBoutique: true, devise: true, pays: true } }),
        ]);
        const conf = commandes.filter(c => ["confirmee", "livree"].includes(c.statut));
        const ca = conf.reduce((s, c) => s + c.montantTotal, 0);
        const rapportData = { boutique: tenant?.nomBoutique, devise: tenant?.devise, ca_30j: Math.round(ca), commandes_30j: commandes.length, confirmees_30j: conf.length, taux_conversion: commandes.length ? Math.round(conf.length / commandes.length * 100) : 0, total_clients: clients._count, ltv_total: Math.round(clients._sum.totalDepense ?? 0), top_produits: topProduits };
        return { succes: true, resultat: `[RAPPORT COMPLET — rédige une analyse business structurée avec ces chiffres, ne recopie pas le JSON] ${JSON.stringify(rapportData)}` };
      }

      case "produits_performance": {
        const produits = await prisma.produit.findMany({ where: { tenantId }, select: { id: true, nom: true, prix: true, ventes: true, stock: true, images: true }, take: args.limite ?? 10, orderBy: args.tri === "ventes" || args.tri === "revenu" ? { ventes: "desc" } : { stock: "asc" } });
        const avecRevenu = produits.map(p => ({ ...p, revenu: Math.round(p.prix * p.ventes), stock_ok: p.stock > 3 }));
        if (args.tri === "revenu") avecRevenu.sort((a, b) => b.revenu - a.revenu);
        return { succes: true, resultat: JSON.stringify(avecRevenu) };
      }

      case "lister_clients": {
        let where: any = { tenantId };
        if (args.segment === "inactifs_30j") where.createdAt = { lt: new Date(Date.now() - 30 * 86400000) };
        else if (args.segment === "nouveaux") where.createdAt = { gte: new Date(Date.now() - 7 * 86400000) };
        const orderBy: any = args.tri === "depense_desc" ? { totalDepense: "desc" } : args.tri === "commandes_desc" ? { totalCommandes: "desc" } : { createdAt: "desc" };
        const clients = await prisma.client.findMany({ where, orderBy, take: args.limite ?? 15, select: { id: true, nom: true, email: true, totalCommandes: true, totalDepense: true, createdAt: true } });
        return { succes: true, resultat: `[LISTE CLIENTS — utilise pour répondre, ne recopie pas le JSON brut] ${JSON.stringify(clients)}` };
      }

      case "envoyer_email_client": {
        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey) return { succes: false, resultat: "RESEND_API_KEY manquante" };
        let where: any = { tenantId };
        if (args.destinataires === "inactifs_30j") where.createdAt = { lt: new Date(Date.now() - 30 * 86400000) };
        else if (args.destinataires === "vip") { const agg = await prisma.client.aggregate({ where: { tenantId }, _avg: { totalDepense: true } }); where.totalDepense = { gte: (agg._avg.totalDepense ?? 0) * 2 }; }
        else if (args.destinataires === "nouveaux") where.createdAt = { gte: new Date(Date.now() - 7 * 86400000) };
        const clients = await prisma.client.findMany({ where, select: { email: true, nom: true }, take: 50 });
        if (!clients.length) return { succes: false, resultat: "Aucun client dans ce segment" };
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { nomBoutique: true } });
        const resend = new Resend(resendKey);
        let envoyes = 0;
        for (const c of clients) {
          try { await resend.emails.send({ from: `${tenant?.nomBoutique} <onboarding@resend.dev>`, to: c.email, subject: args.sujet, html: args.html.replace(/\{\{nom\}\}/g, c.nom) }); envoyes++; } catch { /* continue */ }
        }
        return { succes: true, resultat: `✅ ${envoyes}/${clients.length} emails envoyés (segment: ${args.destinataires})` };
      }

      case "dashboard_livraison": {
        const [aAssigner, enCours, livreurs] = await Promise.all([
          prisma.commande.count({ where: { tenantId, statut: "confirmee", livreurId: null } }),
          prisma.commande.count({ where: { tenantId, livraisonStatut: { in: ["en_transit", "en_livraison"] } } }),
          prisma.livreur.count({ where: { tenantId, disponible: true, actif: true } }),
        ]);
        return { succes: true, resultat: JSON.stringify({ commandes_a_assigner: aAssigner, en_cours: enCours, livreurs_disponibles: livreurs }) };
      }

      case "assigner_livreur": {
        const [commande, livreur] = await Promise.all([
          prisma.commande.findFirst({ where: { id: args.commandeId, tenantId }, select: { numero: true, adresseLivraison: true, clientNom: true } }),
          prisma.livreur.findFirst({ where: { id: args.livreurId }, select: { nom: true } }),
        ]);
        if (!commande || !livreur) return { succes: false, resultat: "Commande ou livreur introuvable" };
        await prisma.commande.update({ where: { id: args.commandeId }, data: { livreurId: args.livreurId, livraisonStatut: "en_transit" } });
        await prisma.notification.create({ data: { livreurId: args.livreurId, type: "nouvelle_livraison", titre: "Nouvelle livraison", message: `Commande ${commande.numero} — ${commande.clientNom}`, commandeId: args.commandeId } });
        return { succes: true, resultat: `✅ Commande ${commande.numero} assignée à ${livreur.nom}` };
      }

      default: {
        // Déléguer aux connecteurs MCP si l'outil commence par un préfixe connu
        const MCP_PREFIXES = ["meta_", "whatsapp_", "gmail_", "sms_", "tiktok_", "google_ads_", "higgsfield_"];
        if (MCP_PREFIXES.some(p => nom.startsWith(p))) {
          const res = await executerOutilMcp(nom, args, tenantId);
          return res;
        }
        return { succes: false, resultat: `Outil inconnu: ${nom}` };
      }
    }
  } catch (err: any) {
    return { succes: false, resultat: `Erreur: ${err.message}` };
  }
};

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    const tenantId = (session.user as any)?.tenantId;
    if (!tenantId) return NextResponse.json({ message: "Boutique introuvable" }, { status: 404 });

    const body = await request.json();
    const { messages, imageUrl, fast, stream } = schema.parse(body);

    // Fetch tenant context to personalize system prompt
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nomBoutique: true, pays: true, devise: true, categorie: true },
    }).catch(() => null);
    const SYSTEM_PROMPT = buildSystemPrompt({
      boutique: tenant?.nomBoutique,
      pays: tenant?.pays ?? undefined,
      devise: tenant?.devise ?? undefined,
      categorie: tenant?.categorie ?? undefined,
    });

    // If an image was attached, append it as an OpenAI vision content block
    const enrichedMessages: any[] = imageUrl
      ? messages.map((m, i) =>
          i === messages.length - 1 && m.role === "user"
            ? {
                role: "user",
                content: [
                  { type: "text", text: m.content || "Analyse cette image." },
                  { type: "image_url", image_url: { url: imageUrl } },
                ],
              }
            : m
        )
      : messages;

    const maxIter = fast ? 5 : 10;
    if (stream) {
      const sseStream = runAgentStream(SYSTEM_PROMPT, enrichedMessages, OUTILS, tenantId, executeOutil, maxIter);
      return new Response(sseStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        },
      });
    }

    const result = await runAgent(SYSTEM_PROMPT, enrichedMessages, OUTILS, tenantId, executeOutil, maxIter, false);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ message: "Format invalide" }, { status: 400 });
    console.error("[AGENT/UNIVERSAL]", err);
    return NextResponse.json({ message: "Erreur AXIA" }, { status: 500 });
  }
}
