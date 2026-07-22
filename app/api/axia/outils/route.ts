import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { completionAuto } from "@/lib/llm-client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });

  const { type, params } = await req.json();

  let prompt = "";

  switch (type) {
    case "relance":
      prompt = `Rédige un message de relance ${params.canal === "gmail" ? "email" : "WhatsApp"} pour un client VIP qui n'a pas commandé depuis ${params.delai || "30 jours"}.
Contexte supplémentaire : ${params.contexte || "Aucun contexte particulier"}
Style : chaleureux, personnalisé, avec offre attractive. Format adapté ${params.canal === "gmail" ? "email (objet + corps)" : "WhatsApp (court, emojis)"}.
Réponds uniquement avec le message, rien d'autre.`;
      break;

    case "winners":
      prompt = `Tu es un expert en e-commerce africain. Trouve 3 produits gagnants à vendre en ligne maintenant.
Niche / marché : ${params.niche || "e-commerce général"}
Pays cible : ${params.pays || "Afrique de l'Ouest"}
Budget sourcing estimé : ${params.budget || "moyen (100-500 USD)"}

Pour chaque produit donne :
- Nom du produit
- Pourquoi c'est gagnant maintenant (tendance, besoin, timing)
- Prix source estimé / Prix de vente recommandé / Marge brute
- Canal marketing principal
Format : liste numérotée, concis, actionnable.`;
      break;

    case "copywriting":
      prompt = `Rédige une publicité Facebook/Instagram percutante.
Produit : ${params.produit}
Cible : ${params.cible || "femmes entrepreneurs africaines 25-45 ans"}
Angle : ${params.angle || "bénéfice émotionnel + urgence"}

Format : Accroche (hook) + Corps + CTA. Avec emojis stratégiques. Style africain, émotion authentique.
Donne 2 variantes distinctes.`;
      break;

    case "email-fournisseur":
      prompt = `Rédige un email professionnel à un fournisseur pour négocier une commande.
Produit : ${params.produit}
Quantité : ${params.quantite || "50 unités pour un premier essai"}
Contexte : ${params.contexte || "Première commande test avant gros volume"}
Ton : professionnel, sérieux, en position de force. Demande prix unitaire, MOQ, délai livraison, conditions paiement.
Réponds uniquement avec l'email (objet + corps).`;
      break;

    case "reponse-client":
      prompt = `Rédige une réponse professionnelle à ce message client e-commerce.
Message du client : "${params.message}"
Contexte boutique : ${params.contexte || "Boutique e-commerce, service client"}
Ton : empathique, solutionnel, fidélisant. Propose une solution concrète. En français.
Réponds uniquement avec la réponse client.`;
      break;

    default:
      return NextResponse.json({ erreur: "Type d'outil inconnu" }, { status: 400 });
  }

  try {
    const result = await completionAuto([{ role: "user", content: prompt }], 1500);
    return NextResponse.json({ resultat: result.text, provider: result.provider });
  } catch (err: any) {
    return NextResponse.json({ erreur: err?.message ?? "Erreur IA" }, { status: 500 });
  }
}
