import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const tenantId = (session.user as any)?.tenantId;
  if (!tenantId) return NextResponse.json({ membres: [] });

  const membres = await prisma.membreEquipe.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ membres });
}
