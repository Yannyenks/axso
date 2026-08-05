// Validation OTP / PIN pour la charge carte Flutterwave
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tauxCommissionEffectif } from "@/lib/commission";

export async function POST(req: NextRequest) {
  try {
    const { flwRef, otp, type = "card" } = await req.json();

    if (!flwRef || !otp) {
      return NextResponse.json({ error: "Référence et code requis" }, { status: 400 });
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ success: true }); // mode démo
    }

    // ── Validation auprès de Flutterwave ──────────────────────────────────────
    const flwRes = await fetch("https://api.flutterwave.com/v3/validate-charge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({ otp, flw_ref: flwRef, type }),
    });

    const flwData = await flwRes.json();

    if (!flwRes.ok || flwData.status === "error") {
      return NextResponse.json({ error: flwData?.message || "Code invalide" }, { status: 400 });
    }

    const txStatus = flwData?.data?.status?.toLowerCase();

    if (txStatus === "successful") {
      // Retrouver la commande via flw_ref ou tx_ref
      const txRef  = flwData?.data?.tx_ref;
      const flwRefFinal = flwData?.data?.flw_ref;

      const commande = await prisma.commande.findUnique({
        where: { id: txRef },
        include: {
          tenant: true,
          lignes: { include: { produit: { select: { type: true } } } },
        },
      });

      if (commande && commande.paiementStatut !== "completed") {
        const taux = tauxCommissionEffectif(commande.lignes, commande.tenant.commissionRate || 0.03);
        const montantCommission = commande.montantTotal * taux;
        const isPhysique = !commande.lignes.some((l: any) => l.produit?.type === "digital");

        await prisma.commande.update({
          where: { id: txRef },
          data: { statut: "confirmee", paiementStatut: "completed", flutterwaveRef: flwRefFinal },
        });

        const tasks: Promise<any>[] = [
          prisma.commission.upsert({
            where: { commandeId: txRef },
            create: {
              tenantId: commande.tenantId, commandeId: txRef,
              montantCommande: commande.montantTotal,
              montantCommission,
              montantMarchand: commande.montantTotal - montantCommission,
              taux,
              devise: commande.devise, statut: "pending",
            },
            update: { statut: "pending" },
          }),
        ];

        if (!isPhysique) {
          const releaseAt = new Date(Date.now() + 48 * 3600 * 1000);
          tasks.push(
            prisma.escrow.upsert({
              where: { commandeId: txRef },
              create: { tenantId: commande.tenantId, commandeId: txRef, montant: commande.montantTotal, releaseAt, statut: "held" },
              update: { statut: "held", releaseAt },
            })
          );
        }

        await Promise.allSettled(tasks);

        if (isPhysique) {
          const { crediterWallet } = await import("@/lib/affiliation");
          const net = Math.round((commande.montantTotal - montantCommission) * 100) / 100;
          await crediterWallet(
            commande.tenantId, net, commande.devise,
            `Paiement reçu #${commande.id.slice(-6).toUpperCase()}`,
            txRef, flwRefFinal, "CREDIT"
          ).catch(() => {});
        }
      }

      return NextResponse.json({ success: true, commandeId: txRef });
    }

    // Toujours pending (rare)
    return NextResponse.json({ error: "Paiement non confirmé. Réessayez." }, { status: 400 });

  } catch (err) {
    console.error("[carte/valider]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
