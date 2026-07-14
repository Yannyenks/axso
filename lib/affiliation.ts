import { prisma } from "./prisma";

const AXSO_COMMISSION = 0.03; // 3% Axso

// Génère un code d'affiliation unique : "NOM-XXXX"
export function genererCodeAffiliation(nomBoutique: string): string {
  const base = nomBoutique
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5) || "AFF";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${suffix}`;
}

// Calcule la répartition d'un paiement digital :
// axso: 3%, affilieur: tauxAff (si applicable), tenant: reste
export function calculerRepartition(
  montantTotal: number,
  tauxAff: number | null | undefined,
  codeAffiliation: string | null | undefined
): { axso: number; affilieur: number; tenant: number } {
  const axso = Math.round(montantTotal * AXSO_COMMISSION * 100) / 100;
  let affilieur = 0;
  if (codeAffiliation && tauxAff && tauxAff > 0) {
    affilieur = Math.round(montantTotal * tauxAff * 100) / 100;
  }
  const tenant = Math.round((montantTotal - axso - affilieur) * 100) / 100;
  return { axso, affilieur, tenant };
}

// Crédite le wallet d'un tenant + log transaction
export async function crediterWallet(
  tenantId: string,
  montant: number,
  devise: string,
  description: string,
  commandeId?: string,
  reference?: string,
  type = "CREDIT"
) {
  await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { tenantId },
      create: { tenantId, solde: 0, totalRecu: 0, totalRetire: 0, totalCommission: 0, devise },
      update: {},
    });
    const delta = type === "RETRAIT" ? -montant : montant;
    await tx.wallet.update({
      where: { tenantId },
      data: {
        solde: { increment: delta },
        totalRecu: type === "CREDIT" ? { increment: montant } : undefined,
        totalCommission: type === "COMMISSION" ? { increment: montant } : undefined,
        totalRetire: type === "RETRAIT" ? { increment: montant } : undefined,
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        montant,
        devise,
        description,
        commandeId,
        reference,
        statut: "completed",
      },
    });
  });
}

// Traite toute la chaîne de paiement digital après confirmation :
// 1. Crédite le wallet tenant
// 2. Si affiliation : crédite le wallet affilieur + crée AffiliationCommission
// 3. Crée les tokens de téléchargement (1 par produit digital)
export async function traiterPaiementDigital(params: {
  commande: {
    id: string;
    tenantId: string;
    clientEmail: string;
    clientNom: string;
    montantTotal: number;
    devise: string;
    codeAffiliation?: string | null;
    affilieurId?: string | null;
  };
  lignes: Array<{ produitId: string; produit?: { fichierUrl?: string | null; type?: string } | null }>;
  reference: string;
}) {
  const { commande, lignes, reference } = params;

  // Récupère les produits digitaux avec leurs infos d'affiliation
  const produits = await prisma.produit.findMany({
    where: { id: { in: lignes.map((l) => l.produitId) }, type: "digital" },
    select: { id: true, fichierUrl: true, tauxCommissionAff: true, affiliationActive: true },
  });

  const tauxAff =
    commande.codeAffiliation && produits.some((p) => p.affiliationActive && p.tauxCommissionAff)
      ? (produits.find((p) => p.affiliationActive && p.tauxCommissionAff)?.tauxCommissionAff ?? null)
      : null;

  const { axso, affilieur, tenant } = calculerRepartition(
    commande.montantTotal,
    tauxAff,
    commande.codeAffiliation
  );

  // Crédite le tenant
  await crediterWallet(
    commande.tenantId,
    tenant,
    commande.devise,
    `Vente digitale #${commande.id.slice(-6).toUpperCase()}`,
    commande.id,
    reference
  );

  // Commission Axso (log uniquement — va dans Commission table)
  await prisma.commission.upsert({
    where: { commandeId: commande.id },
    create: {
      commandeId: commande.id,
      tenantId: commande.tenantId,
      montantCommande: commande.montantTotal,
      montantCommission: axso,
      montantMarchand: tenant,
      taux: AXSO_COMMISSION,
      devise: commande.devise,
      statut: "captured",
      capturedAt: new Date(),
    },
    update: { statut: "captured", capturedAt: new Date() },
  });

  // Commission affilieur
  if (commande.codeAffiliation && commande.affilieurId && affilieur > 0) {
    const lien = await prisma.affiliationLien.findUnique({
      where: { code: commande.codeAffiliation },
    });
    if (lien) {
      await crediterWallet(
        commande.affilieurId,
        affilieur,
        commande.devise,
        `Commission affiliation #${commande.id.slice(-6).toUpperCase()}`,
        commande.id,
        reference,
        "COMMISSION"
      );
      await prisma.affiliationCommission.create({
        data: {
          lienId: lien.id,
          commandeId: commande.id,
          tenantId: commande.tenantId,
          affilieurId: commande.affilieurId,
          montantCommande: commande.montantTotal,
          taux: tauxAff ?? 0,
          montantGagne: affilieur,
          devise: commande.devise,
          statut: "capturee",
        },
      });
      await prisma.affiliationLien.update({
        where: { id: lien.id },
        data: { conversions: { increment: 1 }, montantGenere: { increment: affilieur } },
      });
    }
  }

  // Tokens de téléchargement (48h)
  const crypto = await import("crypto");
  for (const produit of produits) {
    if (!produit.fichierUrl) continue;
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.telechargement.create({
      data: {
        produitId: produit.id,
        commandeId: commande.id,
        token,
        expireAt: new Date(Date.now() + 48 * 3600 * 1000),
      },
    });
  }

  // Marque la commande comme payée + statut digital
  await prisma.commande.update({
    where: { id: commande.id },
    data: { paiementStatut: "completed", statut: "livree" },
  });
}
