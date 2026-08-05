// Webhook CinetPay — confirmation de paiement Mobile Money
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateWallet } from "@/lib/wallet";
import { verifierCinetPay } from "@/lib/payment-providers";
import { tauxCommissionEffectif } from "@/lib/commission";
import { reinitialiserEchecsPaiement } from "@/lib/paiement-securite";
import { crediterWallet } from "@/lib/affiliation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transactionId = body.cpm_trans_id || body.transaction_id;
    if (!transactionId) return NextResponse.json({ received: true });

    // Vérifier le paiement auprès de CinetPay
    const verification = await verifierCinetPay(transactionId).catch(() => null);
    if (!verification) return NextResponse.json({ received: true });

    const status = verification.data?.payment_status;
    if (status !== "ACCEPTED") return NextResponse.json({ received: true });

    // L'ID de transaction CinetPay = commandeId Axso
    const commandeId = transactionId;
    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      include: {
        tenant: true,
        lignes: { include: { produit: { select: { type: true } } } },
      },
    });

    if (!commande || commande.paiementStatut === "completed") {
      return NextResponse.json({ received: true });
    }

    // Anti-fraude : vérifier montant
    const montantCinetPay = Number(verification.data?.amount);
    if (Math.abs(montantCinetPay - commande.montantTotal) > 1) {
      console.warn("[cinetpay-webhook] Montant incohérent", { montantCinetPay, commande: commande.montantTotal });
      return NextResponse.json({ received: true });
    }

    const taux = tauxCommissionEffectif(commande.lignes, commande.tenant.commissionRate || 0.03);
    const montantCommission = commande.montantTotal * taux;
    const isPhysique = !commande.lignes.some((l: any) => l.produit?.type === "digital");

    await prisma.commande.update({
      where: { id: commandeId },
      data: {
        statut: "confirmee",
        paiementStatut: "completed",
        flutterwaveRef: verification.data?.cpm_payid,
        methodePaiement: "cinetpay:" + (verification.data?.payment_method || "mobilemoney"),
      },
    });

    await getOrCreateWallet(commande.tenantId, commande.devise).catch(() => {});
    await reinitialiserEchecsPaiement(commande.tenantId).catch(() => {});

    const tasks: Promise<any>[] = [
      prisma.commission.upsert({
        where: { commandeId },
        create: {
          tenantId: commande.tenantId, commandeId,
          montantCommande: commande.montantTotal,
          montantCommission,
          montantMarchand: commande.montantTotal - montantCommission,
          taux,
          devise: commande.devise, statut: "pending",
        },
        update: { statut: "pending" },
      }),
      prisma.ligneCommande.findMany({ where: { commandeId } }).then(lignes =>
        Promise.allSettled(lignes.map(l =>
          prisma.produit.update({
            where: { id: l.produitId },
            data: { stock: { decrement: l.quantite }, ventes: { increment: l.quantite } },
          })
        ))
      ),
    ];

    if (!isPhysique) {
      const releaseAt = new Date(Date.now() + 48 * 3600 * 1000);
      tasks.push(
        prisma.escrow.upsert({
          where: { commandeId },
          create: { tenantId: commande.tenantId, commandeId, montant: commande.montantTotal, releaseAt, statut: "held" },
          update: { statut: "held", releaseAt },
        })
      );
    }

    await Promise.allSettled(tasks);

    if (isPhysique) {
      const net = Math.round((commande.montantTotal - montantCommission) * 100) / 100;
      await crediterWallet(
        commande.tenantId, net, commande.devise,
        `Paiement reçu #${commande.id.slice(-6).toUpperCase()}`,
        commandeId, verification.data?.cpm_payid, "CREDIT"
      ).catch(() => {});
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[cinetpay-webhook]", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
