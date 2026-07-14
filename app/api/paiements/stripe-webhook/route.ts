// Stripe Webhook — confirme les paiements et déclenche la chaîne digital
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { traiterPaiementDigital } from "@/lib/affiliation";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: any;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error("[stripe-webhook] Signature invalide:", err.message);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const pi = event.data.object;

  if (event.type === "payment_intent.succeeded") {
    const commandeId = pi.metadata?.commandeId;
    if (!commandeId) {
      return NextResponse.json({ received: true });
    }

    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      include: {
        lignes: {
          include: { produit: { select: { id: true, type: true, fichierUrl: true } } },
        },
      },
    });

    if (!commande) {
      return NextResponse.json({ received: true });
    }

    // Mettre à jour le charge ID
    const chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : null;
    await prisma.commande.update({
      where: { id: commandeId },
      data: {
        stripePaymentIntentId: pi.id,
        stripeChargeId: chargeId,
        paiementStatut: "completed",
      },
    });

    const hasDigital      = commande.lignes.some((l) => l.produit?.type === "digital");
    const hasDropshipping = commande.lignes.some((l) => l.produit?.type === "dropshipping");

    if (hasDigital) {
      // Flux digital : crédite wallet + envoie fichiers
      await traiterPaiementDigital({
        commande: {
          id: commande.id,
          tenantId: commande.tenantId,
          clientEmail: commande.clientEmail,
          clientNom: commande.clientNom,
          montantTotal: commande.montantTotal,
          devise: commande.devise,
          codeAffiliation: commande.codeAffiliation,
          affilieurId: commande.affilieurId,
        },
        lignes: commande.lignes.map((l) => ({
          produitId: l.produitId,
          produit: l.produit,
        })),
        reference: pi.id,
      });
    } else if (hasDropshipping) {
      // Flux dropshipping : Stripe → wallet Axso → marchand (déduction coût fournisseur gérée manuellement)
      await prisma.commande.update({
        where: { id: commandeId },
        data: { paiementStatut: "completed", statut: "confirmee" },
      });
      const { crediterWallet } = await import("@/lib/affiliation");
      const COMMISSION_AXSO = 0.03;
      const net = Math.round(commande.montantTotal * (1 - COMMISSION_AXSO) * 100) / 100;
      await crediterWallet(
        commande.tenantId,
        net,
        commande.devise,
        `Vente dropshipping #${commande.id.slice(-6).toUpperCase()}`,
        commande.id,
        pi.id,
        "CREDIT"
      );
    } else {
      // Produit physique payé en ligne : escrow 48h avant libération wallet
      await prisma.commande.update({
        where: { id: commandeId },
        data: { paiementStatut: "completed", statut: "confirmee" },
      });
      await prisma.escrow.upsert({
        where: { commandeId },
        create: {
          commandeId,
          tenantId: commande.tenantId,
          montant: commande.montantTotal,
          statut: "held",
          releaseAt: new Date(Date.now() + 48 * 3600 * 1000),
        },
        update: { statut: "held" },
      });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const commandeId = pi.metadata?.commandeId;
    if (commandeId) {
      await prisma.commande.update({
        where: { id: commandeId },
        data: { paiementStatut: "failed" },
      }).catch(() => {});
    }
  }

  if (event.type === "charge.refunded") {
    const commandeId = pi.metadata?.commandeId ?? "";
    if (commandeId) {
      await prisma.commande.update({
        where: { id: commandeId },
        data: { paiementStatut: "refunded", statut: "annulee" },
      }).catch(() => {});
    }
  }

  return NextResponse.json({ received: true });
}
