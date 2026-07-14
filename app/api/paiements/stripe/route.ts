// Stripe Payment Intent — produits digitaux + cartes internationales
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, toStripeAmount, toStripeCurrency } from "@/lib/stripe";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      commandeId,
      montant,
      devise,
      clientEmail,
      clientNom,
      description,
      codeAffiliation,
      affilieurId,
    } = body;

    if (!montant || !devise || !clientEmail) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: toStripeAmount(montant, devise),
      currency: toStripeCurrency(devise),
      receipt_email: clientEmail,
      description: description ?? `Commande Axso`,
      metadata: {
        commandeId: commandeId ?? "",
        clientNom: clientNom ?? "",
        codeAffiliation: codeAffiliation ?? "",
        affilieurId: affilieurId ?? "",
        platform: "axso",
      },
      automatic_payment_methods: { enabled: true },
    });

    // Si une commandeId est fournie, on met à jour la commande avec le PI ID
    if (commandeId) {
      await prisma.commande.update({
        where: { id: commandeId },
        data: {
          stripePaymentIntentId: paymentIntent.id,
          methodePaiement: "stripe:card",
          ...(codeAffiliation ? { codeAffiliation, affilieurId } : {}),
        },
      }).catch(() => {}); // Peut ne pas encore exister
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: any) {
    console.error("[stripe/initier]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
