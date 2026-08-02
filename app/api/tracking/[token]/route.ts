import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — client/marchand poll la position du livreur
export async function GET(_: Request, { params }: { params: { token: string } }) {
  const commande = await (prisma as any).commande.findFirst({
    where: { OR: [{ trackingToken: params.token }, { livreurToken: params.token }] },
    select: {
      id: true, numero: true, statut: true, livraisonStatut: true,
      clientNom: true, adresseExacte: true, adresseLivraison: true, ville: true,
      latitudeClient: true, longitudeClient: true, mapsLienClient: true,
      livreurPosition: true, livreurNom: true, livreurTelephone: true,
      trackingToken: true, livreurToken: true,
      lignes: { select: { nom: true, quantite: true, prix: true, imageUrl: true } },
      tenant: { select: { nomBoutique: true, logoUrl: true, slug: true } },
    },
  });
  if (!commande) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Ne pas exposer livreurToken au client (uniquement trackingToken)
  const isLivreurToken = commande.livreurToken === params.token;

  return NextResponse.json({
    commande: {
      ...commande,
      livreurToken: isLivreurToken ? commande.livreurToken : undefined,
    },
  });
}

// POST — livreur envoie sa position GPS
export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    const { lat, lng, nom, telephone } = await req.json();
    if (!lat || !lng) return NextResponse.json({ error: "lat/lng requis" }, { status: 400 });

    const commande = await (prisma as any).commande.findFirst({
      where: { livreurToken: params.token },
    });
    if (!commande) return NextResponse.json({ error: "Token livreur invalide" }, { status: 404 });

    await (prisma as any).commande.update({
      where: { id: commande.id },
      data: {
        livreurPosition: { lat, lng, updatedAt: new Date().toISOString() },
        ...(nom ? { livreurNom: nom } : {}),
        ...(telephone ? { livreurTelephone: telephone } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

// PATCH — marchand assigne livreur + infos
export async function PATCH(req: Request, { params }: { params: { token: string } }) {
  try {
    const body = await req.json();
    const commande = await (prisma as any).commande.findFirst({
      where: { OR: [{ trackingToken: params.token }, { livreurToken: params.token }] },
    });
    if (!commande) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    await (prisma as any).commande.update({
      where: { id: commande.id },
      data: {
        livreurNom: body.livreurNom ?? undefined,
        livreurTelephone: body.livreurTelephone ?? undefined,
        statut: body.statut ?? undefined,
        livraisonStatut: body.livraisonStatut ?? undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
