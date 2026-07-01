// Wallet AXSO — logique métier
// Chaque marchand possède un wallet unique.
// Flux : paiement → escrow (48h) → libération → crédit wallet (montant net)
//        commission → débit automatique au moment de la libération
//        retrait    → débit wallet → virement Flutterwave

import { prisma } from "./prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TypeTransaction = "CREDIT" | "COMMISSION" | "RETRAIT" | "REMBOURSEMENT";

export interface CreditWalletParams {
  tenantId: string;
  montantTotal: number;
  montantCommission: number;
  devise: string;
  commandeId: string;
  reference?: string;
}

export interface RetraitParams {
  tenantId: string;
  montant: number;
  devise: string;
  methode: "mobile_money" | "virement_bancaire";
  destinataire: string;
  operateur?: string;
  notes?: string;
}

// ─── Obtenir ou créer le wallet d'un marchand ─────────────────────────────────

export async function getOrCreateWallet(tenantId: string, devise = "XAF") {
  return prisma.wallet.upsert({
    where: { tenantId },
    create: { tenantId, devise },
    update: {},
  });
}

// ─── Créditer le wallet après libération d'escrow ────────────────────────────
// Appelle en mode transaction Prisma ($transaction) depuis les routes escrow.

export async function crediterWallet(
  tx: any,
  params: CreditWalletParams
) {
  const { tenantId, montantTotal, montantCommission, devise, commandeId, reference } = params;
  const montantMarchand = montantTotal - montantCommission;

  // Upsert wallet
  const wallet = await tx.wallet.upsert({
    where: { tenantId },
    create: {
      tenantId,
      devise,
      solde: montantMarchand,
      totalRecu: montantTotal,
      totalCommission: montantCommission,
    },
    update: {
      solde: { increment: montantMarchand },
      totalRecu: { increment: montantTotal },
      totalCommission: { increment: montantCommission },
    },
  });

  // Ligne CREDIT (montant marchand net)
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "CREDIT",
      montant: montantMarchand,
      devise,
      description: `Vente confirmée${reference ? ` · ${reference}` : ""}`,
      reference,
      commandeId,
      statut: "completed",
    },
  });

  // Ligne COMMISSION (débit Axso)
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "COMMISSION",
      montant: -montantCommission,
      devise,
      description: `Commission Axso 3%${reference ? ` · ${reference}` : ""}`,
      reference,
      commandeId,
      statut: "completed",
    },
  });

  return wallet;
}

// ─── Initier un retrait ───────────────────────────────────────────────────────

export async function initierRetrait(params: RetraitParams) {
  const { tenantId, montant, devise, methode, destinataire, operateur, notes } = params;

  const wallet = await prisma.wallet.findUnique({ where: { tenantId } });
  if (!wallet) throw new Error("Wallet introuvable");
  if (wallet.solde < montant) throw new Error("Solde insuffisant");

  // Montant minimum
  const MINIMUM = 1000;
  if (montant < MINIMUM) throw new Error(`Montant minimum de retrait : ${MINIMUM} ${devise}`);

  const retrait = await prisma.$transaction(async (tx) => {
    // Débit immédiat du solde (fond réservé)
    const updatedWallet = await tx.wallet.update({
      where: { tenantId },
      data: {
        solde: { decrement: montant },
        totalRetire: { increment: montant },
      },
    });

    // Ligne de transaction RETRAIT
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "RETRAIT",
        montant: -montant,
        devise,
        description: `Retrait ${methode === "mobile_money" ? `Mobile Money (${operateur ?? ""})` : "Virement bancaire"} → ${destinataire}`,
        statut: "en_cours",
      },
    });

    // Enregistrement du retrait
    const r = await tx.retrait.create({
      data: {
        walletId: wallet.id,
        tenantId,
        montant,
        devise,
        methode,
        destinataire,
        operateur,
        notes,
        statut: "en_attente",
      },
    });

    return r;
  });

  // Appel Flutterwave Transfer si clé configurée
  if (process.env.FLUTTERWAVE_SECRET_KEY) {
    try {
      const transferData = buildFlutterwaveTransfer(retrait.id, montant, devise, methode, destinataire, operateur);
      const res = await fetch("https://api.flutterwave.com/v3/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
        body: JSON.stringify(transferData),
      });

      const data = await res.json();
      const ref = data?.data?.id?.toString() ?? undefined;
      const statut = res.ok && data?.status === "success" ? "traitement" : "en_attente";

      await prisma.retrait.update({
        where: { id: retrait.id },
        data: { statut, reference: ref },
      });

      if (ref) {
        await prisma.walletTransaction.updateMany({
          where: { walletId: wallet.id, type: "RETRAIT", statut: "en_cours" },
          data: { statut: "completed", reference: ref },
        });
      }
    } catch {
      // Flutterwave indisponible — retrait en attente traitement manuel
    }
  }

  return retrait;
}

function buildFlutterwaveTransfer(
  retraitId: string,
  montant: number,
  devise: string,
  methode: string,
  destinataire: string,
  operateur?: string
) {
  if (methode === "mobile_money") {
    return {
      account_bank: operateur?.toLowerCase() ?? "MPS",
      account_number: destinataire,
      amount: montant,
      narration: "Retrait Axso Wallet",
      currency: devise,
      reference: `AXSO-${retraitId}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/wallet/retrait/callback`,
      debit_currency: devise,
    };
  }
  // Virement bancaire
  return {
    account_bank: destinataire.split("|")[0] ?? "UBA",
    account_number: destinataire.split("|")[1] ?? destinataire,
    amount: montant,
    narration: "Retrait Axso Wallet",
    currency: devise,
    reference: `AXSO-${retraitId}`,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/wallet/retrait/callback`,
    debit_currency: devise,
  };
}

// ─── Résumé wallet (pour le dashboard) ───────────────────────────────────────

export async function getWalletResume(tenantId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { tenantId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      retraits: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!wallet) return null;

  // Solde en séquestre (commandes confirmées mais escrow non libéré)
  const escrowsActifs = await prisma.escrow.aggregate({
    where: { tenantId, statut: "held" },
    _sum: { montant: true },
  });

  const soldeSequestre = escrowsActifs._sum.montant ?? 0;
  const commissionSequestre = soldeSequestre * 0.03;
  const netSequestre = soldeSequestre - commissionSequestre;

  return {
    ...wallet,
    soldeSequestre: netSequestre,
    retraitsEnAttente: wallet.retraits.filter((r) => r.statut === "en_attente").reduce((s, r) => s + r.montant, 0),
  };
}
