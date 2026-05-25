import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Confirmation de réception par l'acheteur — libère l'escrow immédiatement
// Auth : l'UUID de la commande sert de token (connu seulement de l'acheteur via son email/lien)
export async function POST(req: NextRequest) {
  try {
    const { commandeId } = await req.json();
    if (!commandeId) return NextResponse.json({ error: "Commande manquante" }, { status: 400 });

    const escrow = await prisma.escrow.findUnique({
      where: { commandeId },
      include: { commande: { include: { commission: true } } },
    });

    if (!escrow) return NextResponse.json({ error: "Escrow introuvable" }, { status: 404 });
    if (escrow.statut === "released") {
      return NextResponse.json({ error: "Déjà confirmé" }, { status: 400 });
    }
    if (escrow.commande.statut !== "livree") {
      return NextResponse.json({ error: "La commande n'est pas encore marquée livrée" }, { status: 400 });
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.escrow.update({
        where: { commandeId },
        data: { statut: "released", releasedAt: now },
      });

      if (escrow.commande.commission) {
        await tx.commission.update({
          where: { commandeId },
          data: { statut: "captured", capturedAt: now },
        });
      }

      await tx.commande.update({
        where: { id: commandeId },
        data: { statut: "livree" },
      });
    });

    return NextResponse.json({ success: true, message: "Réception confirmée. Le paiement sera versé au vendeur." });
  } catch (err) {
    console.error("[ESCROW/CONFIRMER]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
