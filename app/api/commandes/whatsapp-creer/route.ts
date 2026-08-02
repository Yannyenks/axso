// Créer une commande physique (paiement à la livraison) + générer lien WhatsApp + tokens tracking/facture
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { genererNumeroCommande, formatMontant } from "@/lib/utils";
import { randomBytes } from "crypto";

function genToken() { return randomBytes(20).toString("hex"); }

export async function POST(req: NextRequest) {
  try {
    const { tenantId, slug, client, items, total, devise, codePromo, localisation } = await req.json();

    if (!tenantId || !items?.length || !client?.nom || !client?.telephone) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.statut !== "active") {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }

    const produitIds = items.map((i: any) => i.produitId).filter(Boolean);
    if (produitIds.length > 0) {
      const produits = await prisma.produit.findMany({ where: { id: { in: produitIds } }, select: { type: true } });
      if (produits.some(p => p.type === "digital")) {
        return NextResponse.json({ error: "Les produits digitaux nécessitent un paiement en ligne" }, { status: 400 });
      }
    }

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

    const trackingToken = genToken();
    const livreurToken  = genToken();
    const mapsLien = localisation?.lat
      ? `https://www.google.com/maps?q=${localisation.lat},${localisation.lng}`
      : null;

    const commande = await prisma.commande.create({
      data: {
        tenantId, numero: genererNumeroCommande(),
        clientId: clientRecord.id,
        clientNom: client.nom,
        clientEmail: client.email || clientRecord.email,
        clientTelephone: client.telephone,
        adresseLivraison: localisation?.adresseExacte || client.adresse || "À préciser",
        ville: client.ville || "—",
        pays: client.pays || "—",
        montantSousTotal: total,
        montantTotal: total,
        devise,
        statut: "en_attente",
        paiementStatut: "pending",
        methodePaiement: "whatsapp_cod",
        trackingToken,
        livreurToken,
        latitudeClient: localisation?.lat ?? null,
        longitudeClient: localisation?.lng ?? null,
        adresseExacte: localisation?.adresseExacte || client.adresse || null,
        mapsLienClient: mapsLien,
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
      include: { lignes: true },
    });

    // Auto-routing dropshipping
    try {
      const dropItems = items.filter((i: any) => i.fournisseurId);
      if (dropItems.length > 0) {
        const fournisseurIds = [...new Set(dropItems.map((i: any) => i.fournisseurId as string))];
        for (const fId of fournisseurIds) {
          const lf = dropItems.filter((i: any) => i.fournisseurId === fId);
          const montantFournisseur = lf.reduce((s: number, i: any) => s + ((i.prixFournisseur ?? i.prix * 0.5) * i.quantite), 0);
          await (prisma as any).commandeFournisseur.create({
            data: { tenantId: tenant.id, commandeId: commande.id, fournisseurId: fId, montantFournisseur, statut: "envoye", envoiAuto: true },
          }).catch(() => null);
        }
      }
    } catch {}

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://axso.vercel.app";
    const factureUrl  = `${appUrl}/${slug}/facture/${trackingToken}`;
    const trackingUrl = `${appUrl}/${slug}/tracking/${trackingToken}`;
    const adresseLivraison = [localisation?.adresseExacte || client.adresse, client.ville, client.pays].filter(Boolean).join(", ");

    const lignesTexte = items.map((i: any) =>
      `• ${i.nom}${i.variante ? ` (${i.variante})` : ""} × ${i.quantite} — ${formatMontant(i.prix * i.quantite, devise)}`
    ).join("\n");

    // Message WhatsApp marchand (nouvelle commande)
    const messageMarchand = [
      `🛍️ *Nouvelle commande — ${tenant.nomBoutique}*`,
      `📋 N° *${commande.numero}*`,
      ``,
      `👤 *Client :* ${client.nom}`,
      `📞 *Tél :* ${client.telephone}`,
      adresseLivraison ? `📍 *Adresse :* ${adresseLivraison}` : null,
      mapsLien ? `🗺️ *Google Maps :* ${mapsLien}` : null,
      ``,
      `🛒 *Articles :*`,
      lignesTexte,
      ``,
      `💰 *Total à percevoir :* ${formatMontant(total, devise)}`,
      codePromo ? `🏷️ Code promo : ${codePromo}` : null,
      ``,
      `📄 Facture : ${factureUrl}`,
      `🚚 Tracking : ${trackingUrl}`,
    ].filter(Boolean).join("\n");

    const numero = (tenant.whatsappNumero || (tenant as any).whatsapp || "").replace(/\D/g, "");
    const whatsappUrl = numero ? `https://wa.me/${numero}?text=${encodeURIComponent(messageMarchand)}` : null;

    // Message WhatsApp client (confirmation automatique)
    const telClient = client.telephone.replace(/\D/g, "");
    const messageClient = [
      `✅ *Commande confirmée — ${tenant.nomBoutique}*`,
      ``,
      `Bonjour ${client.nom} ! 🙏`,
      `Votre commande *#${commande.numero}* a bien été reçue.`,
      ``,
      `📋 *${items.length} article(s)* — Total : *${formatMontant(total, devise)}*`,
      `💳 Paiement à la livraison`,
      ``,
      `📄 *Votre facture :*`,
      factureUrl,
      ``,
      `🚚 *Suivre votre livraison :*`,
      trackingUrl,
      ``,
      `Nous vous contacterons pour la livraison. Merci ! 🎉`,
    ].filter(Boolean).join("\n");

    const whatsappClientUrl = telClient ? `https://wa.me/${telClient}?text=${encodeURIComponent(messageClient)}` : null;

    return NextResponse.json({
      commandeId: commande.id,
      numero: commande.numero,
      whatsappUrl,
      whatsappClientUrl,
      trackingToken,
      factureUrl,
      trackingUrl,
    });

  } catch (err) {
    console.error("[whatsapp-creer]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
