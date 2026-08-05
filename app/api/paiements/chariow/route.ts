// Initier un paiement Chariow pour un produit digital ou un abonnement AXSO
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { genererNumeroCommande } from "@/lib/utils";
import { initierChariowCheckout, CHARIOW_PLAN_IDS, getChariowKey } from "@/lib/chariow";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Paiement abonnement AXSO (depuis le dashboard marchand) ───────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body; // "abonnement" | "produit"

    if (type === "abonnement") {
      return handleAbonnement(req, body);
    }
    if (type === "produit") {
      return handleProduitDigital(req, body);
    }
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  } catch (err) {
    console.error("[chariow/initier]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── Abonnement ────────────────────────────────────────────────────────────────
async function handleAbonnement(_req: NextRequest, body: any) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const tenantId = (session.user as any)?.tenantId;
  const { plan } = body; // "starter" | "pro" | "business"

  if (!getChariowKey()) {
    // Mode démo : activation directe sans paiement
    await prisma.tenant.update({ where: { id: tenantId }, data: { planType: plan } });
    return NextResponse.json({ mode: "demo", plan });
  }

  const chariowProductId = CHARIOW_PLAN_IDS[plan];
  if (!chariowProductId) {
    return NextResponse.json({ error: `Produit Chariow non configuré pour le plan "${plan}"` }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { nomBoutique: true, users: { select: { email: true, name: true }, take: 1 } } });
  if (!tenant) return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });

  const owner = tenant.users[0];
  const [firstName, ...rest] = (owner?.name ?? tenant.nomBoutique).split(" ");

  const result = await initierChariowCheckout({
    productId: chariowProductId,
    email: owner?.email ?? `${tenantId}@axso.app`,
    firstName: firstName ?? "Marchand",
    lastName: rest.join(" ") || "AXSO",
    phone: "00000000",
    countryCode: "SN",
    redirectUrl: `${APP_URL}/dashboard?plan=${plan}&chariow=ok`,
    customMetadata: { type: "abonnement", tenantId, plan },
  });

  if (result.step === "payment" && result.checkoutUrl) {
    return NextResponse.json({ checkoutUrl: result.checkoutUrl });
  }
  if (result.step === "completed") {
    await prisma.tenant.update({ where: { id: tenantId }, data: { planType: plan } });
    return NextResponse.json({ mode: "completed", plan });
  }

  return NextResponse.json({ error: "Réponse Chariow inattendue" }, { status: 500 });
}

// ── Produit digital (checkout storefront) ─────────────────────────────────────
async function handleProduitDigital(_req: NextRequest, body: any) {
  const {
    tenantId, slug, client, items, total, devise, chariowProduitId,
  } = body;

  if (!chariowProduitId) {
    return NextResponse.json({ error: "chariowProduitId requis" }, { status: 400 });
  }
  if (!getChariowKey()) {
    return NextResponse.json({ error: "Chariow non configuré" }, { status: 503 });
  }

  // Créer la commande AXSO
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || tenant.statut !== "active") return NextResponse.json({ error: "Boutique inactive" }, { status: 404 });

  let clientRecord = await prisma.client.findFirst({ where: { tenantId, telephone: client.telephone } });
  if (!clientRecord) {
    clientRecord = await prisma.client.create({
      data: {
        tenantId, nom: client.nom,
        email: client.email || `${client.telephone.replace(/\D/g, "")}@axso.com`,
        telephone: client.telephone, ville: client.ville || null, pays: client.pays || null,
      },
    });
  }

  const commande = await prisma.commande.create({
    data: {
      tenantId, numero: genererNumeroCommande(),
      clientId: clientRecord.id, clientNom: client.nom,
      clientEmail: client.email || clientRecord.email,
      clientTelephone: client.telephone,
      adresseLivraison: "Digital", ville: "—", pays: client.pays || "—",
      montantSousTotal: total, montantTotal: total, devise,
      statut: "en_attente", paiementStatut: "pending",
      methodePaiement: "chariow:digital",
      lignes: {
        create: items.map((item: any) => ({
          produitId: item.produitId, nom: item.nom,
          quantite: item.quantite, prix: item.prix,
          imageUrl: item.imageUrl || null,
        })),
      },
    },
  });

  const [firstName, ...rest] = client.nom.split(" ");
  const customerIp = _req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? _req.headers.get("cf-connecting-ip") ?? undefined;

  const result = await initierChariowCheckout({
    productId: chariowProduitId,
    email: client.email || `${client.telephone.replace(/\D/g, "")}@axso.client`,
    firstName: firstName ?? client.nom,
    lastName: rest.join(" ") || "—",
    phone: client.telephone,
    countryCode: client.pays || "SN",
    redirectUrl: `${APP_URL}/${slug}/confirmation/${commande.id}`,
    customMetadata: { commandeId: commande.id, type: "produit_digital" },
    customerIp,
  });

  if (result.step === "payment" && result.checkoutUrl) {
    return NextResponse.json({ commandeId: commande.id, checkoutUrl: result.checkoutUrl });
  }
  if (result.step === "completed") {
    // Produit gratuit : traiter immédiatement
    return NextResponse.json({ commandeId: commande.id, mode: "completed" });
  }

  return NextResponse.json({ error: "Réponse Chariow inattendue" }, { status: 500 });
}
