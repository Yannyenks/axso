import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const tenantId = (session.user as any)?.tenantId;
  const role = (session.user as any)?.role;

  if (role !== "owner" && role !== "editeur") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const { livreurId } = await req.json();

  const commande = await prisma.commande.findUnique({ where: { id } });
  if (!commande || commande.tenantId !== tenantId) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (livreurId) {
    // Accept both tenant livreurs and platform-wide livreurs (tenantId null)
    const livreur = await prisma.livreur.findFirst({
      where: { id: livreurId, actif: true },
    });
    if (!livreur) {
      return NextResponse.json({ error: "Livreur introuvable" }, { status: 404 });
    }
  }

  const ancienLivreurId = commande.livreurId;

  const updated = await prisma.commande.update({
    where: { id },
    data: { livreurId: livreurId || null },
    include: { livreur: true },
  });

  // Create notification for newly assigned livreur
  if (livreurId && livreurId !== ancienLivreurId) {
    await prisma.notification.create({
      data: {
        livreurId,
        type: "nouvelle_commande",
        titre: "Nouvelle livraison assignée",
        message: `Commande #${commande.numero} — ${commande.adresseLivraison}, ${commande.ville}`,
        commandeId: id,
      },
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, commande: updated });
}
