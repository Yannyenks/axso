import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const TRANSITIONS_VALIDES: Record<string, string[]> = {
  en_attente: ["confirmee", "annulee"],
  confirmee: ["en_preparation", "annulee"],
  en_preparation: ["expediee"],
  expediee: ["livree"],
  livree: [],
  annulee: [],
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { statut } = await req.json();
  const role = (session.user as any)?.role;
  const tenantId = (session.user as any)?.tenantId;

  const commande = await prisma.commande.findUnique({
    where: { id },
    include: { escrow: true, commission: true, tenant: true },
  });

  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  // Vérification d'accès : owner/marchand sur son tenant, livreur sur ses commandes
  if (role === "livreur") {
    const livreur = await prisma.livreur.findFirst({
      where: { userId: (session.user as any)?.id, tenantId: commande.tenantId },
    });
    if (!livreur || commande.livreurId !== livreur.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    // Le livreur peut seulement marquer livré
    if (statut !== "livree") {
      return NextResponse.json({ error: "Le livreur peut seulement marquer comme livré" }, { status: 403 });
    }
  } else {
    if (commande.tenantId !== tenantId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  const statutsValides = TRANSITIONS_VALIDES[commande.statut] || [];
  if (!statutsValides.includes(statut)) {
    return NextResponse.json({
      error: `Transition invalide : ${commande.statut} → ${statut}`,
    }, { status: 400 });
  }

  // Mise à jour en transaction avec libération escrow si livré
  await prisma.$transaction(async (tx) => {
    await tx.commande.update({
      where: { id },
      data: {
        statut,
        updatedAt: new Date(),
      },
    });

    // Libérer l'escrow quand livraison confirmée
    if (statut === "livree" && commande.escrow) {
      await tx.escrow.update({
        where: { commandeId: id },
        data: {
          statut: "released",
          releasedAt: new Date(),
        },
      });

      // Capturer la commission
      if (commande.commission) {
        await tx.commission.update({
          where: { commandeId: id },
          data: {
            statut: "captured",
            capturedAt: new Date(),
          },
        });
      }

      // Créer escrow si pas encore (commandes sans paiement Flutterwave)
      if (!commande.escrow) {
        const releaseAt = new Date();
        releaseAt.setHours(releaseAt.getHours() + 48);
        await tx.escrow.create({
          data: {
            tenantId: commande.tenantId,
            commandeId: id,
            montant: commande.montantTotal,
            statut: "released",
            releaseAt,
            releasedAt: new Date(),
          },
        });
      }
    }
  });

  return NextResponse.json({ success: true, statut });
}
