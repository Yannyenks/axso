import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schemaUpdate = z.object({
  nom: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  prix: z.number().positive().optional(),
  prixCompare: z.number().positive().optional().nullable(),
  cout: z.number().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
  categorie: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  actif: z.boolean().optional(),
  featured: z.boolean().optional(),
  poids: z.number().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const tenantId = (session.user as any)?.tenantId;
  const { id } = await params;

  const produit = await prisma.produit.findFirst({
    where: { id, tenantId },
    include: { variantes: true, _count: { select: { avis: true, lignesCommande: true } } },
  });

  if (!produit) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  return NextResponse.json({ produit });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const tenantId = (session.user as any)?.tenantId;
  const role = (session.user as any)?.role;
  if (role !== "owner" && role !== "editeur") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const data = schemaUpdate.parse(body);

    const produit = await prisma.produit.findFirst({ where: { id, tenantId } });
    if (!produit) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });

    const updateData: any = { ...data };
    if (data.nom && data.nom !== produit.nom) {
      const newSlug = slugify(data.nom);
      const slugExiste = await prisma.produit.findFirst({
        where: { tenantId, slug: newSlug, id: { not: id } },
      });
      if (!slugExiste) updateData.slug = newSlug;
    }

    const updated = await prisma.produit.update({ where: { id }, data: updateData });
    return NextResponse.json({ produit: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const tenantId = (session.user as any)?.tenantId;
  const role = (session.user as any)?.role;
  if (role !== "owner") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  const produit = await prisma.produit.findFirst({ where: { id, tenantId } });
  if (!produit) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });

  await prisma.produit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
