// Créer une commande physique (paiement à la livraison) + générer lien WhatsApp
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { genererNumeroCommande, formatMontant } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { tenantId, slug, client, items, total, devise, codePromo } = await req.json();

    if (!tenantId || !items?.length || !client?.nom || !client?.telephone) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.statut !== "active") {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }

    // Vérifier que tous les produits sont physiques/dropshipping
    const produitIds = items.map((i: any) => i.produitId).filter(Boolean);
    if (produitIds.length > 0) {
      const produits = await prisma.produit.findMany({ where: { id: { in: produitIds } }, select: { type: true } });
      const aDigital = produits.some(p => p.type === "digital");
      if (aDigital) return NextResponse.json({ error: "Les produits digitaux nécessitent un paiement en ligne" }, { status: 400 });
    }

    // Upsert client
    let clientRecord = await prisma.client.findFirst({ where: { tenantId, telephone: client.telephone } });
    if (!clientRecord) {
      clientRecord = await prisma.client.create({
        data: {
          tenantId, nom: client.nom,
          email: client.email || `${client.telephone.replace(/\D/g, "")}@axso.com`,
          telephone: client.telephone, ville: client.ville || null, pays: client.pays || null,
        },
      });
    }

    // Créer la commande — paiement à la livraison
    const commande = await prisma.commande.create({
      data: {
        tenantId, numero: genererNumeroCommande(),
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
        methodePaiement: "whatsapp_cod", // Cash On Delivery
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

    // Construire le message WhatsApp
    const lignesTexte = items.map((i: any) =>
      `• ${i.nom}${i.variante ? ` (${i.variante})` : ""} × ${i.quantite} — ${formatMontant(i.prix * i.quantite, devise)}`
    ).join("\n");

    const adresseLivraison = [client.adresse, client.ville, client.pays].filter(Boolean).join(", ");

    const message = [
      `🛍️ *Nouvelle commande — ${tenant.nomBoutique}*`,
      `N° ${commande.numero}`,
      ``,
      `*Client :* ${client.nom}`,
      `*Téléphone :* ${client.telephone}`,
      adresseLivraison ? `*Adresse :* ${adresseLivraison}` : null,
      ``,
      `*Articles :*`,
      lignesTexte,
      ``,
      `*Total à percevoir à la livraison :* ${formatMontant(total, devise)}`,
      codePromo ? `Code promo appliqué : ${codePromo}` : null,
      ``,
      `✅ Merci de confirmer la commande et l'heure de livraison.`,
    ].filter(Boolean).join("\n");

    // Choisir le numéro WhatsApp (priorité au numéro marchand dédié)
    const numero = (tenant.whatsappNumero || tenant.whatsapp || "").replace(/\D/g, "");
    if (!numero) {
      // Pas de numéro WhatsApp configuré — retourner la commande sans URL
      return NextResponse.json({ commandeId: commande.id, whatsappUrl: null, numero: commande.numero });
    }

    const whatsappUrl = `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
    return NextResponse.json({ commandeId: commande.id, whatsappUrl, numero: commande.numero });

  } catch (err) {
    console.error("[whatsapp-creer]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
