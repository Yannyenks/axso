import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schemaInvitation = z.object({
  email: z.string().email(),
  nom: z.string().min(1).optional(),
  role: z.enum(["admin", "editeur", "lecteur"]),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const tenantId = (session.user as any)?.tenantId;
    if (!tenantId) return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });

    const body = await req.json();
    const { email, nom, role } = schemaInvitation.parse(body);

    const existant = await prisma.membreEquipe.findFirst({
      where: { tenantId, email },
    });
    if (existant) {
      return NextResponse.json({ error: "Ce membre fait déjà partie de l'équipe" }, { status: 400 });
    }

    const membre = await prisma.membreEquipe.create({
      data: {
        tenantId,
        email,
        nom: nom || email.split("@")[0],
        role,
        actif: false,
      },
    });

    return NextResponse.json({ success: true, membre });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    console.error("[API/EQUIPE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const tenantId = (session.user as any)?.tenantId;
    const { searchParams } = new URL(req.url);
    const membreId = searchParams.get("id");

    if (!membreId) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    await prisma.membreEquipe.deleteMany({
      where: { id: membreId, tenantId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
