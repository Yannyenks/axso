// API — Initier un paiement Flutterwave
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { genererNumeroCommande } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { tenantId, slug, client, items, total, devise, codePromo } = await req.json();

    if (!tenantId || !items?.length || !total || !client?.nom || !client?.telephone) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.statut !== "active") {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }

    // Vérifier/créer le client
    let clientRecord = await prisma.client.findFirst({
      where: { tenantId, telephone: client.telephone },
    });

    if (!clientRecord) {
      clientRecord = await prisma.client.create({
        data: {
          tenantId,
          nom: client.nom,
          email: client.email || `${client.telephone.replace(/\D/g, "")}@axso.com`,
          telephone: client.telephone,
          ville: client.ville || null,
          pays: client.pays || null,
        },
      });
    }

    // Créer la commande avec les bons noms de champs du schéma
    const commande = await prisma.commande.create({
      data: {
        tenantId,
        numero: genererNumeroCommande(),
        clientId: clientRecord.id,
        clientNom: client.nom,
        clientEmail: client.email || clientRecord.email,
        clientTelephone: client.telephone,
        adresseLivraison: client.adresse || "À préciser",
        ville: client.ville || "—",
        pays: client.pays || "—",
        montantSousTotal: total,
        montantTotal: total,
        devise,
        statut: "en_attente",
        paiementStatut: "pending",
        methodePaiement: "flutterwave",
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

    // Tenter l'initiation Flutterwave
    const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!flutterwaveKey) {
      // Mode demo — confirmer + créer commission/escrow
      await prisma.commande.update({
        where: { id: commande.id },
        data: { statut: "confirmee", paiementStatut: "completed" },
      });

      const montantCommission = total * (tenant.commissionRate || 0.03);
      const releaseAt = new Date(Date.now() + 48 * 3600 * 1000);

      await Promise.all([
        prisma.commission.create({
          data: {
            tenantId,
            commandeId: commande.id,
            montantCommande: total,
            montantCommission,
            montantMarchand: total - montantCommission,
            taux: tenant.commissionRate || 0.03,
            devise,
            statut: "pending",
          },
        }).catch(() => {}),
        prisma.escrow.create({
          data: {
            tenantId,
            commandeId: commande.id,
            montant: total,
            releaseAt,
            statut: "held",
          },
        }).catch(() => {}),
        // Décrémenter stock + incrémenter ventes
        ...items.map((item: any) =>
          prisma.produit.update({
            where: { id: item.produitId },
            data: { stock: { decrement: item.quantite }, ventes: { increment: item.quantite } },
          }).catch(() => {})
        ),
      ]);

      return NextResponse.json({ commandeId: commande.id });
    }

    // Mode live Flutterwave — l'inline SDK côté client gère le paiement
    // La commande reste en "en_attente" jusqu'au callback du SDK ou du webhook
    return NextResponse.json({ commandeId: commande.id, mode: "live" });
  } catch (error) {
    console.error("Erreur paiement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
