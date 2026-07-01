// Webhook Flutterwave — confirmation de paiement (card, mobilemoney, banktransfer)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateWallet } from "@/lib/wallet";
import { tauxCommissionEffectif } from "@/lib/commission";
import { enregistrerEchecPaiement, reinitialiserEchecsPaiement } from "@/lib/paiement-securite";

export async function POST(req: NextRequest) {
  try {
    // Vérification de la signature Flutterwave
    const signature = req.headers.get("verif-hash");
    const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

    if (secret && signature !== secret) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    const payload = await req.json();
    const { event, data } = payload;

    // Gérer les événements de paiement entrant
    const isChargeCompleted  = event === "charge.completed";
    const isTransferComplete = event === "transfer.completed"; // virement sortant (retrait)
    const isTransferFailed   = event === "transfer.failed";

    // ── Virement sortant (retrait wallet) ────────────────────────────────────
    if (isTransferComplete || isTransferFailed) {
      const reference = data?.reference as string | undefined;
      if (reference?.startsWith("AXSO-")) {
        const retraitId = reference.replace("AXSO-", "");
        const statut = isTransferComplete ? "complete" : "echoue";
        await prisma.retrait.update({
          where: { id: retraitId },
          data: { statut },
        }).catch(() => {});
      }
      return NextResponse.json({ received: true });
    }

    // ── Paiement entrant ─────────────────────────────────────────────────────
    if (!isChargeCompleted) {
      return NextResponse.json({ received: true });
    }

    const commandeId = data.tx_ref as string;
    const statut     = data.status?.toLowerCase();
    const methode    = data.payment_type?.toLowerCase() ?? "unknown";

    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      include: {
        tenant: true,
        lignes: { include: { produit: { select: { type: true } } } },
      },
    });

    if (!commande) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // ── Déjà traitée ─────────────────────────────────────────────────────────
    if (commande.paiementStatut === "completed") {
      return NextResponse.json({ received: true });
    }

    // ── Paiement réussi ───────────────────────────────────────────────────────
    if (statut === "successful") {
      // Vérification anti-fraude : montant + devise
      const montantFlw = Number(data.amount);
      const deviseFlw  = data.currency;
      if (
        Math.abs(montantFlw - commande.montantTotal) > 1 ||
        deviseFlw !== commande.devise
      ) {
        console.warn("[webhook] Montant ou devise incohérent — rejeté", { montantFlw, commande: commande.montantTotal });
        return NextResponse.json({ received: true });
      }

      const taux = tauxCommissionEffectif(commande.lignes, commande.tenant.commissionRate || 0.03);
      const montantCommission = commande.montantTotal * taux;
      const releaseAt = new Date(Date.now() + 48 * 3600 * 1000);

      await prisma.commande.update({
        where: { id: commandeId },
        data: {
          statut: "confirmee",
          paiementStatut: "completed",
          flutterwaveRef: data.flw_ref,
          methodePaiement: methode || commande.methodePaiement,
        },
      });

      // Pré-créer wallet + réinitialiser compteur d'échecs
      await getOrCreateWallet(commande.tenantId, commande.devise).catch(() => {});
      await reinitialiserEchecsPaiement(commande.tenantId).catch(() => {});

      await Promise.allSettled([
        prisma.escrow.upsert({
          where: { commandeId },
          create: {
            tenantId: commande.tenantId,
            commandeId,
            montant: commande.montantTotal,
            releaseAt,
            statut: "held",
          },
          update: { statut: "held", releaseAt },
        }),
        prisma.commission.upsert({
          where: { commandeId },
          create: {
            tenantId: commande.tenantId,
            commandeId,
            montantCommande: commande.montantTotal,
            montantCommission,
            montantMarchand: commande.montantTotal - montantCommission,
            taux,
            devise: commande.devise,
            statut: "pending",
          },
          update: { statut: "pending" },
        }),
        // Décrémenter stock + incrémenter ventes
        prisma.ligneCommande.findMany({ where: { commandeId } }).then(lignes =>
          Promise.allSettled(
            lignes.map(l =>
              prisma.produit.update({
                where: { id: l.produitId },
                data: { stock: { decrement: l.quantite }, ventes: { increment: l.quantite } },
              })
            )
          )
        ),
      ]);

    } else if (statut === "failed") {
      await prisma.commande.update({
        where: { id: commandeId },
        data: { paiementStatut: "failed" },
      });
      // Sécurité : 3 échecs → suspension boutique
      const { suspendu, tentatives } = await enregistrerEchecPaiement(commande.tenantId).catch(() => ({ suspendu: false, tentatives: 0 }));
      if (suspendu) {
        console.warn(`[sécurité] Boutique ${commande.tenantId} suspendue après ${tentatives} échecs de paiement`);
      }
    }
    // statut "pending" → virement en attente → on ne change rien, on attend

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("[webhook]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
