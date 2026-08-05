import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifierClientWhatsApp } from "@/lib/whatsapp";
import { crediterWallet } from "@/lib/affiliation";

const TRANSITIONS_VALIDES: Record<string, string[]> = {
  en_attente:     ["confirmee", "annulee"],
  confirmee:      ["en_preparation", "annulee"],
  en_preparation: ["expediee", "annulee"],
  expediee:       ["livree", "annulee"],
  livree:         [],
  annulee:        [],
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
    include: { escrow: true, commission: true, tenant: { select: { id: true, slug: true, nomBoutique: true } } },
  });

  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  if (role === "livreur") {
    const livreur = await prisma.livreur.findFirst({
      where: { userId: (session.user as any)?.id, tenantId: commande.tenantId },
    });
    if (!livreur || commande.livreurId !== livreur.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
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
    return NextResponse.json({ error: `Transition invalide : ${commande.statut} → ${statut}` }, { status: 400 });
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dejaVente = commande.paiementStatut === "completed";

  await prisma.$transaction(async (tx) => {
    await tx.commande.update({
      where: { id },
      data: {
        statut,
        // Marquer comme vente dès que le marchand confirme la livraison
        ...(statut === "livree" && !dejaVente ? { paiementStatut: "completed" } : {}),
        updatedAt: now,
      },
    });

    if (statut === "livree") {
      // Libérer l'escrow si existant (paiement en ligne avec retenue)
      if (commande.escrow && commande.escrow.statut !== "released") {
        await tx.escrow.update({
          where: { commandeId: id },
          data: { statut: "released", releasedAt: now },
        });
      }
      // Capturer la commission si existante
      if (commande.commission && commande.commission.statut !== "captured") {
        await tx.commission.update({
          where: { commandeId: id },
          data: { statut: "captured", capturedAt: now },
        });
      }
      // Enregistrer la vente dans les analytics pour le graphique CA
      if (!dejaVente) {
        await tx.analytics.create({
          data: {
            tenantId: commande.tenantId,
            type: "purchase",
            date: today,
            valeur: commande.montantTotal / 10000,
            metadata: { commandeId: id, source: "marchand_livree" },
          },
        });
      }
    }
  });

  // Créditer le wallet du marchand pour les commandes COD / paiement physique
  // (les paiements en ligne ont déjà crédité via escrow ou webhook)
  if (statut === "livree" && !dejaVente) {
    const COMMISSION = 0.03;
    const net = Math.round(commande.montantTotal * (1 - COMMISSION) * 100) / 100;
    await crediterWallet(
      commande.tenantId,
      net,
      commande.devise,
      `Vente livrée #${commande.numero}`,
      id,
      undefined,
      "CREDIT"
    ).catch(() => {});
  }

  const { envoyeAuto, whatsappUrl } = await notifierClientWhatsApp({
    telephone: commande.clientTelephone,
    statut,
    numero: commande.numero,
    boutique: commande.tenant.nomBoutique,
    slug: commande.tenant.slug,
    commandeId: id,
  });

  return NextResponse.json({ success: true, statut, envoyeAuto, whatsappUrl });
}
