// Calcul et gestion des commissions Axso (3% par défaut)
import { prisma } from "@/lib/prisma";

export interface ResultatCommission {
  montantCommission: number;
  montantMarchand: number;
  taux: number;
}

export function calculerCommission(
  montantTotal: number,
  tauxCommission: number = 0.03
): ResultatCommission {
  const montantCommission = Math.round(montantTotal * tauxCommission);
  const montantMarchand = montantTotal - montantCommission;
  return {
    montantCommission,
    montantMarchand,
    taux: tauxCommission,
  };
}

// Créer une commission en base après paiement confirmé
export async function creerCommission(
  commandeId: string,
  tenantId: string,
  montantTotal: number,
  devise: string,
  taux: number = 0.03
) {
  const { montantCommission, montantMarchand } = calculerCommission(
    montantTotal,
    taux
  );

  return prisma.commission.create({
    data: {
      commandeId,
      tenantId,
      montantCommande: montantTotal,
      montantCommission,
      montantMarchand,
      taux,
      devise,
      statut: "pending",
    },
  });
}

// Capturer une commission (marquer comme payée à Axso)
export async function capturerCommission(commandeId: string) {
  return prisma.commission.update({
    where: { commandeId },
    data: {
      statut: "captured",
      capturedAt: new Date(),
    },
  });
}
