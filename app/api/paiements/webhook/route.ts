// API — Webhook Flutterwave
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("verif-hash");
    const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

    if (secret && signature !== secret) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    const payload = await req.json();
    const { event, data } = payload;

    if (event !== "charge.completed") {
      return NextResponse.json({ received: true });
    }

    const commandeId = data.tx_ref;
    const statut = data.status;

    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      include: { tenant: true },
    });

    if (!commande) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    if (statut === "successful" && commande.paiementStatut !== "completed") {
      await prisma.commande.update({
        where: { id: commandeId },
        data: {
          statut: "confirmee",
          paiementStatut: "completed",
          flutterwaveRef: data.flw_ref,
        },
      });

      // Escrow — fonds bloqués 48h
      const releaseAt = new Date();
      releaseAt.setHours(releaseAt.getHours() + 48);

      const montantCommission = commande.montantTotal * commande.tenant.commissionRate;

      await Promise.all([
        prisma.escrow.create({
          data: {
            tenantId: commande.tenantId,
            commandeId: commande.id,
            montant: commande.montantTotal,
            releaseAt,
            statut: "held",
          },
        }).catch(() => {}),
        prisma.commission.create({
          data: {
            tenantId: commande.tenantId,
            commandeId: commande.id,
            montantCommande: commande.montantTotal,
            montantCommission,
            montantMarchand: commande.montantTotal - montantCommission,
            taux: commande.tenant.commissionRate,
            devise: commande.devise,
            statut: "pending",
          },
        }).catch(() => {}),
        // Décrémenter stock + incrémenter ventes
        prisma.ligneCommande.findMany({ where: { commandeId } }).then((lignes) =>
          Promise.all(
            lignes.map((l) =>
              prisma.produit.update({
                where: { id: l.produitId },
                data: { stock: { decrement: l.quantite }, ventes: { increment: l.quantite } },
              }).catch(() => {})
            )
          )
        ),
      ]);
    } else if (statut === "failed") {
      await prisma.commande.update({
        where: { id: commandeId },
        data: { paiementStatut: "failed" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
