// Endpoint de reset — supprime toutes les boutiques (tenants + users).
// Protégé par RESET_SECRET dans les variables d'environnement.
// À utiliser UNE SEULE FOIS puis supprimer ce fichier.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (!secret || secret !== process.env.RESET_SECRET) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    // Supprimer dans l'ordre pour respecter les contraintes FK
    await prisma.telechargement.deleteMany({}).catch(() => {});
    await prisma.avis.deleteMany({});
    await prisma.ligneCommande.deleteMany({});
    await prisma.commande.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.produit.deleteMany({});
    await prisma.collection.deleteMany({}).catch(() => {});
    await prisma.analytics.deleteMany({}).catch(() => {});
    await prisma.notification.deleteMany({}).catch(() => {});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    return NextResponse.json({ success: true, message: "Toutes les boutiques supprimées." });
  } catch (err) {
    console.error("[reset]", err);
    return NextResponse.json({ message: "Erreur", error: String(err) }, { status: 500 });
  }
}
