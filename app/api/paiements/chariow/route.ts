// Initier un paiement Chariow pour les abonnements AXSO (palier0/palier1/palier2)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initierChariowCheckout, getChariowKey } from "@/lib/chariow";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// IDs des produits Chariow par palier (à configurer dans les env vars)
function getChariowPlanId(plan: string): string | undefined {
  const ids: Record<string, string | undefined> = {
    palier0: process.env.CHARIOW_PLAN_PALIER0_ID,
    palier1: process.env.CHARIOW_PLAN_PALIER1_ID,
    palier2: process.env.CHARIOW_PLAN_PALIER2_ID,
  };
  return ids[plan];
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const tenantId = (session.user as any)?.tenantId;
    if (!tenantId) return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });

    const { plan } = await req.json();

    if (!["palier0", "palier1", "palier2"].includes(plan)) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    // Mode démo (pas de clé Chariow) : activation directe sans paiement
    if (!getChariowKey()) {
      await prisma.tenant.update({ where: { id: tenantId }, data: { planType: plan } });
      return NextResponse.json({ mode: "demo", plan });
    }

    const chariowProductId = getChariowPlanId(plan);
    if (!chariowProductId) {
      return NextResponse.json(
        { error: `Produit Chariow non configuré pour le palier "${plan}". Ajoutez CHARIOW_PLAN_${plan.toUpperCase()}_ID dans les variables d'environnement.` },
        { status: 503 }
      );
    }

    // Récupérer les infos du tenant et du propriétaire
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        nomBoutique: true,
        pays: true,
        users: { select: { email: true, name: true }, take: 1 },
      },
    });
    if (!tenant) return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });

    const owner = tenant.users[0];
    const fullName = owner?.name ?? tenant.nomBoutique ?? "Marchand AXSO";
    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ") || "AXSO";
    const email = owner?.email ?? `${tenantId}@axso.app`;

    // IP du client pour la détection du pays de paiement
    const customerIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
      ?? req.headers.get("cf-connecting-ip")
      ?? undefined;

    const result = await initierChariowCheckout({
      productId: chariowProductId,
      email,
      firstName,
      lastName,
      phone: "00000000",
      countryCode: tenant.pays ?? "SN",
      redirectUrl: `${APP_URL}/dashboard/abonnement?plan=${plan}&paiement=ok`,
      customMetadata: { type: "abonnement", tenantId, plan },
      customerIp,
    });

    if (result.step === "payment" && result.checkoutUrl) {
      return NextResponse.json({ checkoutUrl: result.checkoutUrl });
    }

    // Produit gratuit Chariow → activation directe
    if (result.step === "completed") {
      await prisma.tenant.update({ where: { id: tenantId }, data: { planType: plan } });
      return NextResponse.json({ mode: "completed", plan });
    }

    return NextResponse.json({ error: "Réponse Chariow inattendue" }, { status: 500 });

  } catch (err: any) {
    console.error("[chariow/abonnement]", err);
    return NextResponse.json({ error: err.message ?? "Erreur serveur" }, { status: 500 });
  }
}
