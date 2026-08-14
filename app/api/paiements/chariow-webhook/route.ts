// Chariow Pulse — réception des notifications de paiement abonnement AXSO
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PLANS_VALIDES = ["palier0", "palier1", "palier2"] as const;

export async function POST(req: NextRequest) {
  try {
    // Vérification signature Chariow
    const webhookSecret = process.env.CHARIOW_WEBHOOK_SECRET;
    if (webhookSecret) {
      const sig = req.headers.get("x-chariow-signature") ?? req.headers.get("x-pulse-signature");
      if (sig !== webhookSecret) {
        return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
      }
    }

    const payload = await req.json();
    const { event, data } = payload;

    // Seuls les événements de vente finalisée nous intéressent
    if (event !== "sale.completed" && event !== "sale.payment_confirmed") {
      return NextResponse.json({ received: true });
    }

    const sale = data?.sale ?? data;
    const metadata: Record<string, string> = sale?.custom_metadata ?? {};

    // Vérifier que c'est bien un abonnement AXSO
    if (metadata.type !== "abonnement" || !metadata.tenantId || !metadata.plan) {
      return NextResponse.json({ received: true });
    }

    const plan = metadata.plan as typeof PLANS_VALIDES[number];
    if (!PLANS_VALIDES.includes(plan)) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    await prisma.tenant.update({
      where: { id: metadata.tenantId },
      data: { planType: plan },
    });

    console.log(`[chariow-webhook] Abonnement activé : tenant=${metadata.tenantId} plan=${plan}`);
    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("[chariow-webhook]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
