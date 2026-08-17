import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { genererNumeroCommande } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { tenantId, client, items, total, devise, codeAffiliation } = await req.json();

    if (!tenantId || !items?.length || !client?.nom || !client?.email) {
      return NextResponse.json({ error: "Nom et email obligatoires" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.statut !== "active") {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }

    // Upsert client par email (clé naturelle pour les achats digitaux)
    let clientRecord = await prisma.client.findFirst({
      where: { tenantId, email: client.email },
    });
    if (!clientRecord) {
      clientRecord = await prisma.client.create({
        data: {
          tenantId,
          nom: client.nom,
          email: client.email,
          telephone: client.telephone || null,
          pays: client.pays || null,
        },
      });
    }

    const commande = await prisma.commande.create({
      data: {
        tenantId,
        numero: genererNumeroCommande(),
        clientId: clientRecord.id,
        clientNom: client.nom,
        clientEmail: client.email,
        clientTelephone: client.telephone || null,
        adresseLivraison: "Digital",
        ville: "Digital",
        pays: client.pays || "—",
        montantSousTotal: total,
        montantTotal: total,
        devise,
        statut: "en_attente",
        paiementStatut: "pending",
        methodePaiement: "en_attente",
        codeAffiliation: codeAffiliation || null,
        lignes: {
          create: items.map((item: any) => ({
            produitId: item.produitId,
            nom: item.nom,
            prix: item.prix,
            quantite: item.quantite,
            imageUrl: item.imageUrl || null,
            variante: item.variante || null,
          })),
        },
      },
    });

    return NextResponse.json({ commandeId: commande.id, numero: commande.numero });
  } catch (err) {
    console.error("[digital-creer]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
