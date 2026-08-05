// Webhook Campay — confirmation de paiement Mobile Money (Cameroun : MTN, Orange)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateWallet } from "@/lib/wallet";
import { tauxCommissionEffectif } from "@/lib/commission";
import { crediterWallet } from "@/lib/affiliation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Campay envoie : { reference, status, operator, amount, currency, app_hash, operator_reference }
    const { reference, status, amount, currency, app_hash } = body;

    if (!reference) return NextResponse.json({ received: true });

    // Vérification optionnelle de l'app_hash (si configuré)
    const appHash = process.env.CAMPAY_APP_HASH;
    if (appHash && app_hash !== appHash) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    // Vérification du statut de paiement côté Campay (évite les faux webhooks)
    const verified = await verifierPaiementCampay(reference);
    if (!verified) return NextResponse.json({ received: true });

    const campayStatus = verified.status ?? status;
    if (campayStatus !== "SUCCESSFUL") {
      if (campayStatus === "FAILED") {
        await prisma.commande.updateMany({
          where: { id: reference, paiementStatut: { not: "completed" } },
          data: { paiementStatut: "failed" },
        });
      }
      return NextResponse.json({ received: true });
    }

    // Trouver la commande correspondante (reference = commandeId)
    const commande = await prisma.commande.findUnique({
      where: { id: reference },
      include: {
        tenant: true,
        lignes: { include: { produit: { select: { type: true } } } },
      },
    });

    if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    if (commande.paiementStatut === "completed") return NextResponse.json({ received: true });

    // Vérification anti-fraude : montant
    const montantCampay = Number(verified.amount ?? amount ?? 0);
    if (montantCampay > 0 && Math.abs(montantCampay - commande.montantTotal) > 1) {
      console.warn("[campay-webhook] Montant incohérent", { montantCampay, commande: commande.montantTotal });
      return NextResponse.json({ received: true });
    }

    const taux = tauxCommissionEffectif(commande.lignes, commande.tenant.commissionRate || 0.03);
    const montantCommission = commande.montantTotal * taux;
    const operateur = body.operator ?? verified.operator ?? "campay";
    const isPhysique = !commande.lignes.some((l: any) => l.produit?.type === "digital");

    await prisma.commande.update({
      where: { id: reference },
      data: {
        statut: "confirmee",
        paiementStatut: "completed",
        flutterwaveRef: body.operator_reference ?? reference,
        methodePaiement: `campay:${operateur.toLowerCase()}`,
      },
    });

    await getOrCreateWallet(commande.tenantId, commande.devise).catch(() => {});

    const tasks: Promise<any>[] = [
      prisma.commission.upsert({
        where: { commandeId: reference },
        create: {
          tenantId: commande.tenantId,
          commandeId: reference,
          montantCommande: commande.montantTotal,
          montantCommission,
          montantMarchand: commande.montantTotal - montantCommission,
          taux,
          devise: commande.devise,
          statut: "pending",
        },
        update: { statut: "pending" },
      }),
      prisma.ligneCommande.findMany({ where: { commandeId: reference } }).then(lignes =>
        Promise.allSettled(lignes.map(l =>
          prisma.produit.update({
            where: { id: l.produitId },
            data: { stock: { decrement: l.quantite }, ventes: { increment: l.quantite } },
          })
        ))
      ),
    ];

    // Escrow uniquement pour les produits digitaux
    if (!isPhysique) {
      const releaseAt = new Date(Date.now() + 48 * 3600 * 1000);
      tasks.push(
        prisma.escrow.upsert({
          where: { commandeId: reference },
          create: { tenantId: commande.tenantId, commandeId: reference, montant: commande.montantTotal, releaseAt, statut: "held" },
          update: { statut: "held", releaseAt },
        })
      );
    }

    await Promise.allSettled(tasks);

    // Produit physique : crédit wallet immédiat (pas d'escrow)
    if (isPhysique) {
      const net = Math.round((commande.montantTotal - montantCommission) * 100) / 100;
      await crediterWallet(
        commande.tenantId, net, commande.devise,
        `Paiement reçu #${commande.id.slice(-6).toUpperCase()}`,
        reference, body.operator_reference ?? reference, "CREDIT"
      ).catch(() => {});
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[campay-webhook]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

async function verifierPaiementCampay(reference: string) {
  try {
    const username = process.env.CAMPAY_USERNAME;
    const password = process.env.CAMPAY_PASSWORD;
    if (!username || !password) return null;

    const tokenRes = await fetch("https://demo.campay.net/api/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const { token } = await tokenRes.json();
    if (!token) return null;

    const res = await fetch(`https://demo.campay.net/api/transaction/${reference}/`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
