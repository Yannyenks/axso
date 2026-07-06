import Anthropic from "@anthropic-ai/sdk";
import { hasNVIDIA, completionNVIDIA, hasFreeLLM, completionFreeLLM, hasPollinations, completionPollinations } from "./llm-client";
import { generateProductImageUrl, buildProductImagePrompt } from "./image-gen";

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

// Carte devise par code pays ISO2 — couverture mondiale
export const PAYS_DEVISES: Record<string, string> = {
  // Afrique de l'Ouest CFA
  SN: "XOF", CI: "XOF", TG: "XOF", BJ: "XOF", ML: "XOF", BF: "XOF", GN: "GNF", NE: "XOF",
  // Afrique Centrale CFA
  CM: "XAF", GA: "XAF", CG: "XAF", TD: "XAF", CF: "XAF", CD: "CDF",
  // Afrique subsaharienne
  GH: "GHS", NG: "NGN", KE: "KES", ZA: "ZAR", ET: "ETB", TZ: "TZS",
  UG: "UGX", RW: "RWF", MZ: "MZN", AO: "AOA", ZM: "ZMW", ZW: "USD",
  // Afrique du Nord
  MA: "MAD", DZ: "DZD", TN: "TND", EG: "EGP", LY: "LYD",
  // Europe
  FR: "EUR", DE: "EUR", ES: "EUR", IT: "EUR", PT: "EUR", NL: "EUR", BE: "EUR",
  GB: "GBP", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN",
  // Amérique du Nord
  US: "USD", CA: "CAD", MX: "MXN",
  // Amérique Latine
  BR: "BRL", AR: "ARS", CO: "COP", CL: "CLP", PE: "PEN", VE: "USD",
  // Asie
  CN: "CNY", JP: "JPY", IN: "INR", ID: "IDR", PH: "PHP", TH: "THB",
  VN: "VND", SG: "SGD", MY: "MYR", KR: "KRW", PK: "PKR", BD: "BDT",
  // Moyen-Orient
  AE: "AED", SA: "SAR", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR",
  TR: "TRY", IL: "ILS", LB: "USD",
  // Océanie
  AU: "AUD", NZ: "NZD",
};

const PROMPT_ANALYSTE = `Tu es AXIA, l'agent IA d'Axso — la plateforme e-commerce mondiale propulsée par l'IA.
Tu aides les entrepreneurs du monde entier à lancer leur boutique en ligne.
Analyse la description du business et génère un plan de boutique complet en JSON.

Règles strictes :
- pays : code ISO 2 lettres (ex: SN, FR, US, MA, NG, DE, BR, AE, etc.) — détecte le pays depuis la description
- devise : adapte à la devise locale du pays (EUR pour France, USD pour USA, XOF pour Sénégal, GBP pour UK, etc.)
- themeId : choisis parmi — "noir-obsidien" (mode/luxe/sombre), "violet-cosmos" (beauté/cosmétiques), "terre-et-or" (artisanat/naturel/chaleureux), "kente-royal" (tissu/royal/coloré), "ocean-atlantique" (frais/bleu), "bwiti-forest" (vert/naturel/bio)
- slug : lettres minuscules, chiffres, tirets seulement (ex: mode-aminata, tech-paris, shop-dubai)
- Propose 3 produits représentatifs avec des prix réalistes en devise locale
- Prix livraison locale adaptés au pays et au contexte (0 si digital)
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

// Tente d'extraire et parser le JSON du texte retourné par le modèle
function extraireJSON(texte: string): any {
  const json = texte.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("L'IA n'a pas retourné de plan JSON valide");
  return JSON.parse(json);
}

export async function analyserBusinessEtCreerPlan(
  description: string
): Promise<PlanBoutique & { messageIA: string }> {

  let texte: string;

  // Priorité 1 : NVIDIA NIM DeepSeek V4 Flash (rapide pour JSON structuré)
  if (hasNVIDIA()) {
    const result = await completionNVIDIA(
      [
        { role: "system", content: PROMPT_ANALYSTE },
        { role: "user", content: description },
      ],
      2000,
      process.env.NVIDIA_MODEL_DEEPSEEK ?? "deepseek-ai/deepseek-v4-flash"
    );
    texte = result.text;
  } else if (hasPollinations()) {
    // Priorité 2 : Pollinations Claude Sonnet 5 (meilleure qualité JSON)
    const result = await completionPollinations(
      [
        { role: "system", content: PROMPT_ANALYSTE },
        { role: "user", content: description },
      ],
      2000,
      "claude-sonnet-5"
    );
    texte = result.text;
  } else if (hasFreeLLM()) {
    // Priorité 3 : freellmapi (si lancé en local)
    const result = await completionFreeLLM(
      [
        { role: "system", content: PROMPT_ANALYSTE },
        { role: "user", content: description },
      ],
      1500
    );
    texte = result.text;
  } else {
    // Fallback : Claude Anthropic
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Aucun fournisseur IA configuré. Ajoute NVIDIA_KEY_DEEPSEEK ou ANTHROPIC_API_KEY dans .env.local");

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: PROMPT_ANALYSTE,
      messages: [{ role: "user", content: description }],
    });
    texte = (response.content[0] as any).text;
  }

  const plan = extraireJSON(texte);

  // Corriger la devise selon le pays (carte mondiale)
  if (plan.pays && PAYS_DEVISES[plan.pays]) {
    plan.devise = PAYS_DEVISES[plan.pays];
  }

  // Générer images Flux pour chaque produit dès la création de la boutique
  if (Array.isArray(plan.produits)) {
    plan.produits = plan.produits.map((p: any, i: number) => ({
      ...p,
      imageUrl: generateProductImageUrl(
        buildProductImagePrompt(p.nom, p.categorie || plan.categorie),
        i * 7919 + Date.now() % 10000
      ),
    }));
  }

  return plan;
}

// Outils pour le copilote dashboard (tool use — Claude uniquement, API native)
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
