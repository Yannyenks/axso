// Chariow Pulse — réception des notifications de vente (paiement digital & abonnement)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { traiterPaiementDigital } from "@/lib/affiliation";

export async function POST(req: NextRequest) {
  try {
    // Vérification signature Chariow (header X-Chariow-Signature)
    const webhookSecret = process.env.CHARIOW_WEBHOOK_SECRET;
    if (webhookSecret) {
      const sig = req.headers.get("x-chariow-signature") ?? req.headers.get("x-pulse-signature");
      if (sig !== webhookSecret) {
        return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
      }
    }

    const payload = await req.json();
    const { event, data } = payload;

    // Pulse : vente finalisée
    if (event !== "sale.completed" && event !== "sale.payment_confirmed") {
      return NextResponse.json({ received: true });
    }

    const sale = data?.sale ?? data;
    const purchaseId = sale?.id as string | undefined;
    const metadata: Record<string, string> = sale?.custom_metadata ?? {};

    // ── Cas 1 : abonnement AXSO ────────────────────────────────────────────────
    if (metadata.type === "abonnement" && metadata.tenantId && metadata.plan) {
      await prisma.tenant.update({
        where: { id: metadata.tenantId },
        data: { planType: metadata.plan },
      });
      return NextResponse.json({ received: true });
    }

    // ── Cas 2 : produit digital AXSO ──────────────────────────────────────────
    if (metadata.commandeId) {
      const commandeId = metadata.commandeId;

      const commande = await prisma.commande.findUnique({
        where: { id: commandeId },
        include: {
          lignes: {
            include: { produit: { select: { id: true, type: true, fichierUrl: true } } },
          },
        },
      });

      if (!commande) return NextResponse.json({ received: true });
      if (commande.paiementStatut === "completed") return NextResponse.json({ received: true });

      await prisma.commande.update({
        where: { id: commandeId },
        data: {
          statut: "confirmee",
          paiementStatut: "completed",
          flutterwaveRef: purchaseId ?? commandeId,
          methodePaiement: `chariow${commande.methodePaiement ? `:${commande.methodePaiement}` : ""}`,
        },
      });

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
        reference: purchaseId ?? commandeId,
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[chariow-webhook]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
