// Création / rechargement d'une carte virtuelle Flutterwave pour le vendeur
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creerCarteVirtuelleFlutterwave, rechargerCarteVirtuelle } from "@/lib/payment-providers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const tenantId = (session.user as any)?.tenantId;
    if (!tenantId) return NextResponse.json({ error: "Aucune boutique" }, { status: 400 });

    const { montant, cardId } = await req.json();
    if (!montant || montant < 5) {
      return NextResponse.json({ error: "Montant minimum : 5 USD" }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { tenantId } });
    if (!wallet) return NextResponse.json({ error: "Wallet introuvable" }, { status: 404 });

    // Convertir en USD (approximation simple — idéalement utiliser un taux de change réel)
    const USD_RATE: Record<string, number> = {
      XOF: 0.00165, XAF: 0.00165, GHS: 0.068, KES: 0.0077,
      NGN: 0.00065, MAD: 0.099, TND: 0.32, USD: 1, EUR: 1.08,
    };
    const rate   = USD_RATE[wallet.devise] ?? 0.00165;
    const montantUsd = Math.floor(montant * rate * 100) / 100;
    if (montantUsd < 5) {
      return NextResponse.json({ error: `Montant insuffisant (minimum ~${Math.ceil(5 / rate)} ${wallet.devise})` }, { status: 400 });
    }
    if (wallet.solde < montant) {
      return NextResponse.json({ error: "Solde wallet insuffisant" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { email: true, nomBoutique: true },
    });

    // ── Recharger une carte existante ────────────────────────────────────────
    if (cardId) {
      const result = await rechargerCarteVirtuelle(cardId, montantUsd, "USD");
      if (result.status !== "success") {
        return NextResponse.json({ error: result.message || "Erreur rechargement" }, { status: 400 });
      }

      await prisma.$transaction(async tx => {
        await tx.wallet.update({
          where: { tenantId },
          data: { solde: { decrement: montant }, totalRetire: { increment: montant } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "RETRAIT",
            montant: -montant,
            devise: wallet.devise,
            description: `Rechargement carte virtuelle Flutterwave · ${montantUsd} USD`,
            statut: "completed",
          },
        });
        await tx.retrait.create({
          data: {
            walletId: wallet.id,
            tenantId,
            montant,
            devise: wallet.devise,
            methode: "carte_virtuelle",
            destinataire: cardId,
            statut: "complete",
            reference: result.data?.id?.toString(),
          },
        });
      });

      return NextResponse.json({ success: true, type: "rechargement", montantUsd });
    }

    // ── Créer une nouvelle carte virtuelle ───────────────────────────────────
    const [prenom, ...restNom] = (tenant?.nomBoutique ?? "Vendeur Axso").split(" ");
    const cardData = await creerCarteVirtuelleFlutterwave({
      prenom: prenom || "Vendeur",
      nom:    restNom.join(" ") || "Axso",
      email:  tenant?.email ?? `${tenantId}@axso.com`,
      montant: montantUsd,
      devise: "USD",
    });

    await prisma.$transaction(async tx => {
      await tx.wallet.update({
        where: { tenantId },
        data: { solde: { decrement: montant }, totalRetire: { increment: montant } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "RETRAIT",
          montant: -montant,
          devise: wallet.devise,
          description: `Création carte virtuelle · ${montantUsd} USD · ${cardData?.masked_pan ?? ""}`,
          statut: "completed",
        },
      });
      await tx.retrait.create({
        data: {
          walletId: wallet.id,
          tenantId,
          montant,
          devise: wallet.devise,
          methode: "carte_virtuelle",
          destinataire: cardData?.id?.toString() ?? "virtual",
          statut: "complete",
          reference: cardData?.id?.toString(),
          notes: `Carte Flutterwave · ${cardData?.masked_pan ?? ""}`,
        },
      });
    });

    return NextResponse.json({
      success:    true,
      type:       "creation",
      montantUsd,
      card: {
        id:         cardData?.id,
        maskedPan:  cardData?.masked_pan,
        expiration: cardData?.expiration,
        solde:      montantUsd,
        devise:     "USD",
      },
    });

  } catch (err: any) {
    console.error("[wallet/carte-virtuelle]", err);
    return NextResponse.json({ error: err.message ?? "Erreur serveur" }, { status: 500 });
  }
}
