import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLANS_VALIDES = ["gratuit", "starter", "pro", "business"] as const;
type Plan = (typeof PLANS_VALIDES)[number];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const tenantId = (session.user as any)?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });
  }

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const plan = body.plan?.toLowerCase() as Plan;
  if (!plan || !PLANS_VALIDES.includes(plan)) {
    return NextResponse.json(
      { error: `Plan invalide. Valeurs acceptées : ${PLANS_VALIDES.join(", ")}` },
      { status: 400 }
    );
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { planType: plan },
  });

  return NextResponse.json({ succes: true, plan });
}
