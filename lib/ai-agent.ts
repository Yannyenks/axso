import Anthropic from "@anthropic-ai/sdk";

export interface PlanProduit {
  nom: string;
  description: string;
  prix: number;
  stock: number;
  categorie: string;
}

export interface PlanLivraison {
  locale: number;
  nationale: number;
  gratuite: number;
}

export interface PlanBoutique {
  nomBoutique: string;
  slug: string;
  categorie: string;
  pays: string;
  devise: string;
  themeId: string;
  description: string;
  produits: PlanProduit[];
  livraison: PlanLivraison;
}

const PAYS_DEVISES: Record<string, string> = {
  SN: "XOF", CI: "XOF", TG: "XOF", BJ: "XOF", ML: "XOF",
  CM: "XAF", GH: "GHS", NG: "NGN", KE: "KES", MA: "MAD",
};

const PROMPT_ANALYSTE = `Tu es un expert e-commerce africain qui aide les entrepreneurs à lancer leur boutique en ligne.
Analyse la description du business et génère un plan de boutique complet en JSON.

Règles strictes :
- pays : code ISO 2 lettres uniquement parmi : SN, CM, CI, GH, NG, KE, MA, TG, BJ, ML
- devise : XOF (Sénégal/CI/Togo/Bénin/Mali), XAF (Cameroun), GHS (Ghana), NGN (Nigeria), KES (Kenya), MAD (Maroc)
- themeId : choisis parmi — "noir-obsidien" (mode/luxe/sombre), "violet-cosmos" (beauté/cosmétiques), "terre-et-or" (artisanat/naturel/chaleureux), "kente-royal" (tissu/royal/coloré), "ocean-atlantique" (frais/bleu), "bwiti-forest" (vert/naturel/bio)
- slug : lettres minuscules, chiffres, tirets seulement (ex: mode-aminata)
- Propose 3 produits représentatifs avec des prix réalistes en devise locale
- Prix livraison locale adaptés au pays
- Réponds UNIQUEMENT avec le JSON, aucun texte avant ou après

Format JSON attendu :
{
  "nomBoutique": "...",
  "slug": "...",
  "categorie": "...",
  "pays": "...",
  "devise": "...",
  "themeId": "...",
  "description": "...",
  "messageIA": "Message chaleureux expliquant le plan en 2-3 phrases avec des emojis",
  "produits": [
    { "nom": "...", "description": "...", "prix": 0, "stock": 10, "categorie": "..." }
  ],
  "livraison": { "locale": 0, "nationale": 0, "gratuite": 0 }
}`;

export async function analyserBusinessEtCreerPlan(
  description: string
): Promise<PlanBoutique & { messageIA: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante");

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: PROMPT_ANALYSTE,
    messages: [{ role: "user", content: description }],
  });

  const texte = (response.content[0] as any).text;
  const json = texte.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("L'IA n'a pas retourné de plan valide");

  const plan = JSON.parse(json);

  // Vérifier et corriger la devise si incohérente avec le pays
  if (plan.pays && PAYS_DEVISES[plan.pays]) {
    plan.devise = PAYS_DEVISES[plan.pays];
  }

  return plan;
}

// Outils pour le copilote dashboard (tool use)
export const OUTILS_COPILOTE: Anthropic.Tool[] = [
  {
    name: "ajouter_produit",
    description: "Ajoute un nouveau produit à la boutique du marchand",
    input_schema: {
      type: "object" as const,
      properties: {
        nom: { type: "string", description: "Nom du produit" },
        description: { type: "string", description: "Description du produit" },
        prix: { type: "number", description: "Prix en devise locale" },
        stock: { type: "number", description: "Quantité en stock" },
        categorie: { type: "string", description: "Catégorie du produit" },
      },
      required: ["nom", "prix", "categorie"],
    },
  },
  {
    name: "creer_code_promo",
    description: "Crée un code promo pour la boutique",
    input_schema: {
      type: "object" as const,
      properties: {
        code: { type: "string", description: "Code promo (ex: PROMO20)" },
        type: { type: "string", enum: ["pourcentage", "montant_fixe"], description: "Type de réduction" },
        valeur: { type: "number", description: "Valeur de la réduction" },
        minCommande: { type: "number", description: "Montant minimum de commande" },
      },
      required: ["code", "type", "valeur"],
    },
  },
  {
    name: "modifier_theme",
    description: "Change le thème visuel de la boutique",
    input_schema: {
      type: "object" as const,
      properties: {
        themeId: {
          type: "string",
          enum: ["noir-obsidien", "violet-cosmos", "terre-et-or", "kente-royal", "ocean-atlantique", "bwiti-forest"],
          description: "ID du thème",
        },
      },
      required: ["themeId"],
    },
  },
  {
    name: "lire_statistiques",
    description: "Lit les statistiques de ventes et commandes récentes",
    input_schema: {
      type: "object" as const,
      properties: {
        periode: { type: "string", enum: ["7j", "30j", "90j"], description: "Période d'analyse" },
      },
      required: ["periode"],
    },
  },
];
