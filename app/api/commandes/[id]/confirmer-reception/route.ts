import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crediterWallet } from "@/lib/affiliation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { slug } = await req.json();

  const commande = await prisma.commande.findUnique({
    where: { id },
    include: { tenant: { select: { id: true, slug: true } } },
  });

  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  if (commande.tenant.slug !== slug) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (commande.statut === "annulee") return NextResponse.json({ error: "Commande annulée" }, { status: 400 });
  if (commande.statut === "livree") return NextResponse.json({ ok: true, dejaDone: true });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  await prisma.$transaction(async (tx) => {
    await tx.commande.update({
      where: { id },
      data: { statut: "livree", paiementStatut: "completed", updatedAt: now },
    });

    // Enregistrer la vente dans les analytics (graphique CA)
    await tx.analytics.create({
      data: {
        tenantId: commande.tenantId,
        type: "purchase",
        date: today,
        valeur: commande.montantTotal / 10000,
        metadata: { commandeId: id, source: "client_confirmation" },
      },
    });
  });

  // Créditer le wallet du marchand (sans escrow)
  const COMMISSION = 0.03;
  const net = Math.round(commande.montantTotal * (1 - COMMISSION) * 100) / 100;
  await crediterWallet(
    commande.tenantId,
    net,
    commande.devise,
    `Vente confirmée #${commande.numero}`,
    id,
    undefined,
    "CREDIT"
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
