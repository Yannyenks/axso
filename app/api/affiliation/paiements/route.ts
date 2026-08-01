import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut");

  const where: any = { tenantId };
  if (statut) where.statut = statut;

  const [paiements, commissionsDues] = await Promise.all([
    (prisma as any).paiementCommission.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 }),
    (prisma as any).affiliationCommission.groupBy({
      by: ["affilieurId"],
      where: { tenantId, statut: "validee" },
      _sum: { montant: true },
      _count: true,
    }),
  ]);

  const totalPaye = paiements.filter((p: any) => p.statut === "traite").reduce((s: number, p: any) => s + p.montant, 0);
  const totalDu = commissionsDues.reduce((s: number, g: any) => s + (g._sum.montant ?? 0), 0);

  return NextResponse.json({ paiements, commissionsDues, stats: { totalPaye, totalDu, soldeRestant: totalDu - totalPaye } });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const tenantId = session.user.tenantId;
  const body = await req.json();

  if (!body.affilieurId || !body.montant) return NextResponse.json({ error: "affilieurId et montant requis" }, { status: 400 });

  const paiement = await (prisma as any).paiementCommission.create({
    data: {
      tenantId,
      affilieurId: body.affilieurId,
      montant: body.montant,
      methode: body.methode ?? "mobile_money",
      telephone: body.telephone,
      notes: body.notes,
    },
  });
  return NextResponse.json({ paiement });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();

  const paiement = await (prisma as any).paiementCommission.update({
    where: { id: body.id },
    data: { statut: body.statut, reference: body.reference, notes: body.notes },
  });

  // Mark corresponding commissions as payée
  if (body.statut === "traite") {
    await (prisma as any).affiliationCommission.updateMany({
      where: { tenantId: session!.user!.tenantId, affilieurId: paiement.affilieurId, statut: "validee" },
      data: { statut: "payee" },
    });
  }

  return NextResponse.json({ paiement });
}
