/**
 * API — Initier un paiement avec routage intelligent par pays/méthode
 *
 * Flux garanti :
 *   Client paie → Provider → Webhook confirme → Escrow 48h → Wallet vendeur → Retrait
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { genererNumeroCommande } from "@/lib/utils";
import { getOrCreateWallet } from "@/lib/wallet";
import {
  choisirProvider,
  initierCinetPay,
  initierCampay,
  creerLienFlutterwave,
  PAYS_ISO,
} from "@/lib/payment-providers";
import { tauxCommissionEffectif } from "@/lib/commission";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const {
      tenantId, slug,
      client, items, total, devise,
      codePromo,
      methodePaiement = "mobilemoney",
      operateur,
      modeDigital = false,
    } = await req.json();

    if (!tenantId || !items?.length || !total || !client?.nom || !client?.telephone) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.statut !== "active") {
      return NextResponse.json({ error: "Boutique introuvable ou inactive" }, { status: 404 });
    }

    // ── Upsert client ────────────────────────────────────────────────────────
    let clientRecord = await prisma.client.findFirst({
      where: { tenantId, telephone: client.telephone },
    });
    if (!clientRecord) {
      clientRecord = await prisma.client.create({
        data: {
          tenantId,
          nom:       client.nom,
          email:     client.email || `${client.telephone.replace(/\D/g, "")}@axso.com`,
          telephone: client.telephone,
          ville:     client.ville || null,
          pays:      client.pays  || null,
        },
      });
    }

    // ── Créer la commande ────────────────────────────────────────────────────
    const commande = await prisma.commande.create({
      data: {
        tenantId,
        numero:           genererNumeroCommande(),
        clientId:         clientRecord.id,
        clientNom:        client.nom,
        clientEmail:      client.email || clientRecord.email,
        clientTelephone:  client.telephone,
        adresseLivraison: client.adresse || "À préciser",
        ville:            client.ville || "—",
        pays:             client.pays  || "—",
        montantSousTotal: total,
        montantTotal:     total,
        devise,
        statut:           "en_attente",
        paiementStatut:   "pending",
        methodePaiement:  `${methodePaiement}${operateur ? `:${operateur}` : ""}`,
        lignes: {
          create: items.map((item: any) => ({
            produitId: item.produitId,
            nom:       item.nom,
            prix:      item.prix,
            quantite:  item.quantite,
            imageUrl:  item.imageUrl || null,
            variante:  item.variante || null,
          })),
        },
      },
    });

    // Pré-créer le wallet du vendeur
    await getOrCreateWallet(tenantId, devise).catch(() => {});

    // Pour les produits digitaux, marquer la commande en mode digital
    if (modeDigital) {
      await prisma.commande.update({
        where: { id: commande.id },
        data: { methodePaiement: `${methodePaiement}${operateur ? `:${operateur}` : ""}:digital` },
      });
    }

    // ── Mode démo (aucune clé provider) ─────────────────────────────────────
    const hasFlw      = !!process.env.FLUTTERWAVE_SECRET_KEY;
    const hasCinetPay = !!process.env.CINETPAY_API_KEY;
    const hasCampay   = !!process.env.CAMPAY_USERNAME;

    if (!hasFlw && !hasCinetPay && !hasCampay) {
      await _confirmerDemo(commande.id, tenantId, total, devise, tenant.commissionRate, items, modeDigital);
      return NextResponse.json({ commandeId: commande.id, mode: "demo" });
    }

    // ── Routage provider ─────────────────────────────────────────────────────
    const paysIso  = PAYS_ISO[client.pays ?? ""] ?? "SN";
    const provider = choisirProvider(client.pays ?? "Sénégal", methodePaiement, operateur);

    const returnUrl = `${APP_URL}/${slug}/confirmation/${commande.id}`;
    const notifyUrl = `${APP_URL}/api/paiements/${provider === "cinetpay" ? "cinetpay-webhook" : provider === "campay" ? "campay-webhook" : "webhook"}`;
    const description = `Commande ${commande.numero} · ${tenant.nomBoutique}`;

    // ── CARTE → Flutterwave inline (géré par CardForm côté client) ──────────
    if (methodePaiement === "card") {
      return NextResponse.json({ commandeId: commande.id, mode: "card_inline" });
    }

    // ── CINETPAY (Afrique de l'Ouest francophone) ────────────────────────────
    if (provider === "cinetpay" && hasCinetPay) {
      try {
        const result = await initierCinetPay({
          commandeId:  commande.id,
          montant:     total,
          devise,
          nom:         client.nom,
          email:       client.email || `${client.telephone.replace(/\D/g,"")}@axso.client`,
          telephone:   client.telephone,
          pays:        client.pays ?? "Sénégal",
          description,
          notifyUrl,
          returnUrl,
        });
        return NextResponse.json({
          commandeId: commande.id,
          mode:       "redirect",
          paymentUrl: result.paymentUrl,
          provider:   "cinetpay",
        });
      } catch (err: any) {
        console.warn("[paiements] CinetPay échoué, fallback Flutterwave:", err.message);
        // Fallback Flutterwave si CinetPay échoue
      }
    }

    // ── CAMPAY (Cameroun) ────────────────────────────────────────────────────
    if (provider === "campay" && hasCampay) {
      try {
        const result = await initierCampay({
          commandeId:  commande.id,
          montant:     total,
          telephone:   client.telephone,
          description,
          notifyUrl,
          returnUrl,
        });
        return NextResponse.json({
          commandeId:  commande.id,
          mode:        "campay",
          reference:   result.reference,
          ussd_code:   result.ussd_code,
          provider:    "campay",
        });
      } catch (err: any) {
        console.warn("[paiements] Campay échoué, fallback Flutterwave:", err.message);
      }
    }

    // ── FLUTTERWAVE (mobile money + bank transfer — mode standard redirect) ─
    if (hasFlw) {
      const result = await creerLienFlutterwave({
        commandeId:      commande.id,
        montant:         total,
        devise,
        email:           client.email || `${client.telephone.replace(/\D/g,"")}@axso.client`,
        telephone:       client.telephone,
        nom:             client.nom,
        nomBoutique:     tenant.nomBoutique,
        methodePaiement,
        paysIso,
        notifyUrl,
        returnUrl,
      });
      return NextResponse.json({
        commandeId: commande.id,
        mode:       "redirect",
        paymentUrl: result.paymentUrl,
        provider:   "flutterwave",
      });
    }

    // Aucun provider disponible → démo
    await _confirmerDemo(commande.id, tenantId, total, devise, tenant.commissionRate, items, modeDigital);
    return NextResponse.json({ commandeId: commande.id, mode: "demo" });

  } catch (error) {
    console.error("[paiements/initier]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── Confirmation automatique mode démo ──────────────────────────────────────
async function _confirmerDemo(
  commandeId: string,
  tenantId: string,
  total: number,
  devise: string,
  commissionRate: number,
  items: any[],
  isDigital = false
) {
  const produits = await prisma.produit.findMany({
    where: { id: { in: items.map((i: any) => i.produitId).filter(Boolean) } },
    select: { type: true },
  });
  const taux = tauxCommissionEffectif(
    produits.map(p => ({ produit: p })),
    commissionRate
  );
  const montantCommission = total * taux;
  // Produits digitaux : libération immédiate du wallet (pas d'attente 48h)
  const releaseAt = isDigital ? new Date() : new Date(Date.now() + 48 * 3600 * 1000);

  await prisma.commande.update({
    where: { id: commandeId },
    data: { statut: "confirmee", paiementStatut: "completed" },
  });

  await Promise.allSettled([
    prisma.commission.create({
      data: {
        tenantId, commandeId,
        montantCommande: total,
        montantCommission,
        montantMarchand: total - montantCommission,
        taux, devise, statut: "pending",
      },
    }),
    prisma.escrow.create({
      data: { tenantId, commandeId, montant: total, releaseAt, statut: "held" },
    }),
    ...items.map((item: any) =>
      prisma.produit.update({
        where: { id: item.produitId },
        data: { stock: { decrement: item.quantite }, ventes: { increment: item.quantite } },
      }).catch(() => {})
    ),
  ]);
}
