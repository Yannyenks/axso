// API — Charge directe par carte via Flutterwave v3
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { tauxCommissionEffectif } from "@/lib/commission";

// ─── Chiffrement 3DES ECB (requis par Flutterwave) ───────────────────────────
function encryptFlutterwave(encKey: string, payload: object): string {
  const text = JSON.stringify(payload);
  const key  = Buffer.alloc(24);
  Buffer.from(encKey.slice(0, 24), "utf8").copy(key);

  try {
    const cipher = crypto.createCipheriv("des-ede3-ecb" as any, key, "");
    cipher.setAutoPadding(true);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  } catch {
    // Fallback Node.js < 18
    const cipher = (crypto as any).createCipher("des-ede3", encKey.slice(0, 24));
    let enc = cipher.update(text, "utf8", "base64");
    enc += cipher.final("base64");
    return enc;
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      commandeId, cardNumber, cvv, expiryMonth, expiryYear,
      email, telephone, nom, devise, montant,
    } = await req.json();

    if (!commandeId || !cardNumber || !cvv || !expiryMonth || !expiryYear) {
      return NextResponse.json({ error: "Données carte manquantes" }, { status: 400 });
    }

    const commande = await prisma.commande.findUnique({ where: { id: commandeId } });
    if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    if (commande.paiementStatut === "completed") {
      return NextResponse.json({ mode: "success", message: "Déjà payée" });
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const encKey    = process.env.FLUTTERWAVE_ENCRYPTION_KEY;

    // ── Mode démo ────────────────────────────────────────────────────────────
    if (!secretKey || !encKey) {
      await prisma.commande.update({
        where: { id: commandeId },
        data: { statut: "confirmee", paiementStatut: "completed" },
      });
      return NextResponse.json({ mode: "success" });
    }

    // ── Payload carte à chiffrer ─────────────────────────────────────────────
    const cardPayload = {
      card_number:   cardNumber,
      cvv,
      expiry_month:  expiryMonth,
      expiry_year:   expiryYear.length === 2 ? "20" + expiryYear : expiryYear,
      currency:      devise,
      amount:        String(montant),
      email:         email || `${telephone?.replace(/\D/g, "")}@axso.client`,
      fullname:      nom,
      phone_number:  telephone,
      tx_ref:        commandeId,
    };

    const client = encryptFlutterwave(encKey, cardPayload);

    // ── Appel API Flutterwave ─────────────────────────────────────────────────
    const flwRes = await fetch("https://api.flutterwave.com/v3/charges?type=card", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        client,
        authorization: {},
      }),
    });

    const flwData = await flwRes.json();

    if (!flwRes.ok || flwData.status === "error") {
      const msg = flwData?.message || "Paiement refusé";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const authMode = flwData?.meta?.authorization?.mode;
    const flwRef   = flwData?.data?.flw_ref || flwData?.meta?.flw_ref;

    // ── Selon le mode d'authentification ─────────────────────────────────────
    if (authMode === "redirect") {
      const redirectUrl = flwData?.meta?.authorization?.redirect;
      return NextResponse.json({ mode: "redirect", redirectUrl, flwRef });
    }

    if (authMode === "pin") {
      return NextResponse.json({ mode: "pin", flwRef });
    }

    if (authMode === "otp") {
      return NextResponse.json({ mode: "otp", flwRef });
    }

    if (authMode === "avs_noauth" || flwData?.data?.status === "successful") {
      // Paiement direct, pas de 3DS
      await _confirmerCommande(commandeId, flwRef, flwData?.data?.flw_ref);
      return NextResponse.json({ mode: "success", flwRef });
    }

    return NextResponse.json({ error: "Réponse Flutterwave inattendue", raw: flwData }, { status: 400 });

  } catch (err) {
    console.error("[carte/charge]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

async function _confirmerCommande(commandeId: string, flwRef: string, flwRefAlt?: string) {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: {
      tenant: true,
      lignes: { include: { produit: { select: { type: true } } } },
    },
  });
  if (!commande || commande.paiementStatut === "completed") return;

  const taux = tauxCommissionEffectif(commande.lignes, commande.tenant.commissionRate || 0.03);
  const montantCommission = commande.montantTotal * taux;
  const isPhysique = !commande.lignes.some((l: any) => l.produit?.type === "digital");

  await prisma.commande.update({
    where: { id: commandeId },
    data: {
      statut: "confirmee",
      paiementStatut: "completed",
      flutterwaveRef: flwRefAlt || flwRef,
    },
  });

  const tasks: Promise<any>[] = [
    prisma.commission.upsert({
      where: { commandeId },
      create: {
        tenantId: commande.tenantId, commandeId,
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
        where: { commandeId },
        create: { tenantId: commande.tenantId, commandeId, montant: commande.montantTotal, releaseAt, statut: "held" },
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
      commandeId, flwRefAlt || flwRef, "CREDIT"
    ).catch(() => {});
  }
}
