import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    const tenantId = (session.user as any)?.tenantId;

    const produit = await prisma.produit.findFirst({ where: { id: params.id, tenantId } });
    if (!produit) return NextResponse.json({ message: "Produit introuvable" }, { status: 404 });

    const body = await request.json();
    const { nom, valeur, sku, prix, stock, image } = body;
    if (!valeur) return NextResponse.json({ message: "Valeur requise" }, { status: 400 });

    const variante = await (prisma as any).variante.create({
      data: {
        produitId: params.id,
        nom: nom || "Variante",
        valeur,
        sku: sku || null,
        prix: prix ? parseFloat(prix) : null,
        stock: stock ? parseInt(stock) : 0,
        image: image || null,
      },
    });

    return NextResponse.json({ variante }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    const tenantId = (session.user as any)?.tenantId;

    const { searchParams } = new URL(request.url);
    const varianteId = searchParams.get("varianteId");
    if (!varianteId) return NextResponse.json({ message: "varianteId requis" }, { status: 400 });

    const produit = await prisma.produit.findFirst({ where: { id: params.id, tenantId } });
    if (!produit) return NextResponse.json({ message: "Produit introuvable" }, { status: 404 });

    await (prisma as any).variante.delete({ where: { id: varianteId } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
