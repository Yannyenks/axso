// Tracker de clics (endpoint public — appelé quand un visiteur arrive via un lien d'affiliation)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ ok: false });

    await prisma.affiliationLien.updateMany({
      where: { code, actif: true },
      data: { clics: { increment: 1 } },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
