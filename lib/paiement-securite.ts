import { prisma } from "./prisma";

const MAX_TENTATIVES = 3;

/**
 * Enregistre un échec de paiement pour un tenant.
 * Au bout de MAX_TENTATIVES échecs, suspend la boutique.
 */
export async function enregistrerEchecPaiement(tenantId: string): Promise<{
  tentatives: number;
  suspendu: boolean;
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { parametresPaiement: true, statut: true },
  });

  if (!tenant || tenant.statut === "suspended") {
    return { tentatives: MAX_TENTATIVES, suspendu: true };
  }

  const params = (tenant.parametresPaiement as any) || {};
  const tentatives = (params.tentativesEchouees ?? 0) + 1;
  const suspendu = tentatives >= MAX_TENTATIVES;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      parametresPaiement: {
        ...params,
        tentativesEchouees: tentatives,
        dernierEchecAt: new Date().toISOString(),
      },
      ...(suspendu ? { statut: "suspended" } : {}),
    },
  });

  return { tentatives, suspendu };
}

/**
 * Réinitialise le compteur d'échecs après un paiement réussi.
 */
export async function reinitialiserEchecsPaiement(tenantId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { parametresPaiement: true },
  });
  if (!tenant) return;
  const params = (tenant.parametresPaiement as any) || {};
  if (!params.tentativesEchouees) return;
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      parametresPaiement: { ...params, tentativesEchouees: 0 },
    },
  });
}

/**
 * Taux de conversion approximatifs depuis XAF vers les devises mondiales.
 * 1 XAF = X unités de la devise cible.
 */
export const XAF_TO: Record<string, number> = {
  XAF: 1, XOF: 1,
  EUR: 0.001524, GBP: 0.00125, CHF: 0.00176,
  USD: 0.001626, CAD: 0.00218, AUD: 0.0025, NZD: 0.0027,
  NGN: 2.6,  GHS: 0.024,  KES: 0.21,  ZAR: 0.031,
  ETB: 0.21, TZS: 4.39,  UGX: 6.18,  RWF: 2.27,
  GNF: 14,   MZN: 0.104, AOA: 1.5,   ZMW: 0.044,
  CDF: 4.6,  MAD: 0.016, DZD: 0.22,  TND: 0.005,
  EGP: 0.078,
  INR: 0.136, CNY: 0.012, JPY: 0.245, IDR: 25.6,
  PHP: 0.094, THB: 0.056, VND: 40,   SGD: 0.00216,
  MYR: 0.0075, KRW: 2.17, PKR: 0.454, BDT: 0.18,
  AED: 0.006, SAR: 0.0061, QAR: 0.0059, TRY: 0.053,
  ILS: 0.006, BHD: 0.00061, KWD: 0.0005,
  BRL: 0.0089, ARS: 1.63, COP: 6.5,  CLP: 1.55,
  MXN: 0.029, PEN: 0.012,
  SEK: 0.0171, NOK: 0.0174, DKK: 0.0105, PLN: 0.0067,
};

/** Convertit un montant de XAF vers une devise, arrondi intelligemment. */
export function convertirDepuisXAF(montantXAF: number, devise: string): number {
  const rate = XAF_TO[devise] ?? XAF_TO["USD"];
  const converted = montantXAF * rate;
  // Arrondi selon l'ordre de grandeur
  if (converted >= 1000) return Math.round(converted / 10) * 10;
  if (converted >= 100)  return Math.round(converted);
  if (converted >= 10)   return Math.round(converted * 10) / 10;
  return Math.round(converted * 100) / 100;
}
