// Vérification d'un paiement Flutterwave après redirection
// Utilisé par la page de confirmation pour valider le statut
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateWallet } from "@/lib/wallet";
import { tauxCommissionEffectif } from "@/lib/commission";
import { enregistrerEchecPaiement, reinitialiserEchecsPaiement } from "@/lib/paiement-securite";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transaction_id");
    const commandeId    = searchParams.get("commande_id");
    const status        = searchParams.get("status");

    if (!commandeId) {
      return NextResponse.json({ error: "Commande manquante" }, { status: 400 });
    }

    // Déjà confirmée ?
    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      include: {
        tenant: true,
        lignes: { include: { produit: { select: { type: true } } } },
      },
    });

    if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

    if (commande.paiementStatut === "completed") {
      return NextResponse.json({ statut: "completed", commande });
    }

    // Virement bancaire en attente → garder "pending" (le webhook confirmera)
    if (status === "pending" || commande.methodePaiement?.includes("banktransfer")) {
      return NextResponse.json({ statut: "pending", commande });
    }

    // Pas de clé Flutterwave → déjà traité en mode démo
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey || !transactionId) {
      return NextResponse.json({ statut: commande.paiementStatut, commande });
    }

    // Vérifier auprès de l'API Flutterwave
    const flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    if (!flwRes.ok) {
      return NextResponse.json({ statut: "unknown", commande });
    }

    const flwData = await flwRes.json();
    const flwStatus = flwData?.data?.status?.toLowerCase();
    const montantFlw = flwData?.data?.amount;
    const deviseFlw  = flwData?.data?.currency;

    // Valider : statut + montant + devise correspondent
    const estValide =
      flwStatus === "successful" &&
      Math.abs(montantFlw - commande.montantTotal) < 1 &&
      deviseFlw === commande.devise;

    if (estValide && commande.paiementStatut !== "completed") {
      const taux = tauxCommissionEffectif(commande.lignes, commande.tenant.commissionRate || 0.03);
      const montantCommission = commande.montantTotal * taux;
      const releaseAt = new Date(Date.now() + 48 * 3600 * 1000);

      await prisma.$transaction(async (tx) => {
        await tx.commande.update({
          where: { id: commandeId },
          data: {
            statut: "confirmee",
            paiementStatut: "completed",
            flutterwaveRef: flwData?.data?.flw_ref,
          },
        });

        await tx.escrow.upsert({
          where: { commandeId },
          create: { tenantId: commande.tenantId, commandeId, montant: commande.montantTotal, releaseAt, statut: "held" },
          update: { statut: "held", releaseAt },
        }).catch(() => {});

        await tx.commission.upsert({
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
        }).catch(() => {});
      });

      // Pré-créer wallet si besoin
      await getOrCreateWallet(commande.tenantId, commande.devise).catch(() => {});
      // Réinitialiser le compteur d'échecs après succès
      await reinitialiserEchecsPaiement(commande.tenantId).catch(() => {});

      return NextResponse.json({ statut: "completed", commande });
    }

    // Paiement échoué — enregistrer l'échec pour la sécurité
    if (flwStatus === "failed" || flwStatus === "error" || !estValide) {
      const { suspendu, tentatives } = await enregistrerEchecPaiement(commande.tenantId).catch(() => ({ suspendu: false, tentatives: 0 }));
      if (suspendu) {
        console.warn(`[sécurité] Boutique ${commande.tenantId} suspendue après ${tentatives} échecs de paiement`);
      }
    }

    return NextResponse.json({ statut: flwStatus ?? "failed", commande });

  } catch (err) {
    console.error("[paiements/verifier]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
