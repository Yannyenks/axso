export const dynamic = "force-dynamic";

// Storefront — Confirmation de commande (avec vérification Flutterwave)
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatMontant, formatDate } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle, Clock, XCircle, Shield, TrendingDown } from "lucide-react";
import { resolveThemeConfigAsync } from "@/lib/theme-config-server";
import { ThemeEffect } from "@/components/themes/ThemeEffect";

interface Props {
  params: Promise<{ slug: string; orderId: string }>;
  searchParams: Promise<{ transaction_id?: string; status?: string; tx_ref?: string }>;
}

async function verifierPaiementFlutterwave(transactionId: string, commandeId: string): Promise<boolean> {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) return false;

  try {
    const res = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await res.json();

    if (data.status === "success" && data.data?.status === "successful" && data.data?.tx_ref === commandeId) {
      const commande = await prisma.commande.findUnique({ where: { id: commandeId }, include: { tenant: true } });
      if (!commande || commande.paiementStatut === "completed") return true;

      const montantTotal = commande.montantTotal;
      const releaseAt = new Date(Date.now() + 48 * 3600 * 1000);

      await prisma.commande.update({
        where: { id: commandeId },
        data: { statut: "confirmee", paiementStatut: "completed", flutterwaveRef: data.data.flw_ref },
      });

      const lignes = await prisma.ligneCommande.findMany({ where: { commandeId } });

      await Promise.all([
        prisma.escrow.create({
          data: {
            tenantId: commande.tenantId,
            commandeId,
            montant: montantTotal,
            releaseAt,
            statut: "held",
          },
        }).catch(() => {}),
        prisma.commission.create({
          data: {
            tenantId: commande.tenantId,
            commandeId,
            montantCommande: montantTotal,
            montantCommission: montantTotal * commande.tenant.commissionRate,
            montantMarchand: montantTotal * (1 - commande.tenant.commissionRate),
            taux: commande.tenant.commissionRate,
            devise: commande.devise,
            statut: "pending",
          },
        }).catch(() => {}),
        ...lignes.map((l) =>
          prisma.produit.update({
            where: { id: l.produitId },
            data: { stock: { decrement: l.quantite }, ventes: { increment: l.quantite } },
          }).catch(() => {})
        ),
      ]);

      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { slug, orderId } = await params;
  const { transaction_id, status } = await searchParams;

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.statut !== "active") notFound();

  // Vérifier paiement Flutterwave si transaction_id présent
  if (transaction_id && status === "successful") {
    await verifierPaiementFlutterwave(transaction_id, orderId);
  }

  const commande = await prisma.commande.findUnique({
    where: { id: orderId },
    include: { lignes: true },
  });
  if (!commande || commande.tenantId !== tenant.id) notFound();

  const themeConfig = await resolveThemeConfigAsync(tenant.themeId, tenant.id, (tenant.themeConfig as Record<string, any>) || {});
  const theme = themeConfig.colors;

  const paye = commande.paiementStatut === "completed";
  const echoue = commande.paiementStatut === "failed";

  const montantCommission = commande.montantTotal * (tenant.commissionRate || 0.03);
  const montantMarchand = commande.montantTotal - montantCommission;
  const releaseAt = new Date(Date.now() + 48 * 3600 * 1000);

  return (
    <div style={{ backgroundColor: theme.fond, color: theme.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <div className="max-w-2xl mx-auto px-4 py-16">

        {/* Statut paiement */}
        {echoue ? (
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)" }}>
              <XCircle size={36} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold font-playfair mb-2 text-red-400">Paiement échoué</h1>
            <p className="opacity-60 mb-6">Une erreur est survenue lors du paiement. Votre commande n'a pas été confirmée.</p>
            <Link href={`/${slug}/panier`} className="px-8 py-3 rounded-xl font-semibold text-sm inline-block" style={{ backgroundColor: theme.accent, color: theme.fond }}>
              Réessayer
            </Link>
          </div>
        ) : (
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: `${theme.accent}20`, border: `2px solid ${theme.accent}` }}>
              <CheckCircle size={36} style={{ color: theme.accent }} />
            </div>
            <h1 className="text-3xl font-bold font-playfair mb-2" style={{ color: theme.accent }}>
              {paye ? "Commande confirmée !" : "Commande reçue !"}
            </h1>
            <p className="opacity-70 text-lg mb-1">Merci pour votre commande, {commande.clientNom} 🎉</p>
            <p className="opacity-40 text-sm">Un email de confirmation vous a été envoyé.</p>
          </div>
        )}

        {/* Récapitulatif commande */}
        <div className="rounded-2xl border p-6 mb-4 space-y-3" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
          <h3 className="font-semibold text-sm opacity-80 mb-4">Récapitulatif</h3>
          <div className="flex justify-between text-sm">
            <span className="opacity-60">N° commande</span>
            <span className="font-mono font-bold" style={{ color: theme.accent }}>{commande.numero}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="opacity-60">Date</span>
            <span>{formatDate(commande.createdAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="opacity-60">Statut paiement</span>
            <span className={paye ? "text-green-400 font-medium" : echoue ? "text-red-400 font-medium" : "text-amber-400 font-medium"}>
              {paye ? "✓ Payé" : echoue ? "✗ Échoué" : "En attente"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60 text-sm">Total payé</span>
            <span className="font-bold text-lg" style={{ color: theme.accent }}>{formatMontant(commande.montantTotal, tenant.devise)}</span>
          </div>
          {commande.adresseLivraison && commande.adresseLivraison !== "À préciser" && (
            <div className="flex justify-between text-sm">
              <span className="opacity-60">Livraison</span>
              <span className="text-right max-w-xs opacity-80">{commande.adresseLivraison}, {commande.ville}</span>
            </div>
          )}
        </div>

        {/* Articles */}
        <div className="rounded-2xl border p-6 mb-4" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
          <h3 className="font-semibold text-sm opacity-80 mb-4">Articles commandés</h3>
          <div className="space-y-3">
            {commande.lignes.map((ligne) => (
              <div key={ligne.id} className="flex justify-between text-sm">
                <span className="opacity-80">{ligne.nom}{ligne.variante ? ` (${ligne.variante})` : ""} × {ligne.quantite}</span>
                <span style={{ color: theme.accent }}>{formatMontant(ligne.prix * ligne.quantite, tenant.devise)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Escrow & commission (si paiement confirmé) */}
        {paye && (
          <div className="rounded-2xl border p-6 mb-6 space-y-4" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
            <h3 className="font-semibold text-sm opacity-80 flex items-center gap-2">
              <Shield size={14} style={{ color: theme.accent }} /> Sécurité paiement (Escrow)
            </h3>

            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Montant total</span>
                <span className="font-semibold">{formatMontant(commande.montantTotal, tenant.devise)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-60 flex items-center gap-1">
                  <TrendingDown size={11} /> Commission Axso (3%)
                </span>
                <span className="text-red-400">-{formatMontant(montantCommission, tenant.devise)}</span>
              </div>
              <div className="border-t pt-2.5 flex justify-between text-sm" style={{ borderColor: `${theme.accent}15` }}>
                <span className="opacity-60 font-medium">Reversé au marchand</span>
                <span className="font-bold" style={{ color: theme.accent }}>{formatMontant(montantMarchand, tenant.devise)}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-amber-400/5 border border-amber-400/20 rounded-xl p-3 mt-2">
              <Clock size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-400 text-xs font-semibold">Fonds sécurisés 48h</p>
                <p className="opacity-50 text-xs mt-0.5">
                  Les fonds seront libérés après confirmation de livraison (avant le {releaseAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/${slug}/suivi/${commande.id}`} className="flex-1 text-center px-6 py-3 rounded-xl font-semibold text-sm transition-all border" style={{ borderColor: `${theme.accent}40`, color: theme.accent }}>
            Suivre ma commande
          </Link>
          <Link href={`/${slug}/produits`} className="flex-1 text-center px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ backgroundColor: theme.accent, color: theme.fond }}>
            Continuer les achats
          </Link>
        </div>
      </div>

      <footer className="border-t py-8 text-center text-sm opacity-40 mt-8" style={{ borderColor: `${theme.accent}20` }}>
        <p>{tenant.nomBoutique} · Propulsé par <span style={{ color: theme.accent }}>Axso</span></p>
      </footer>
    </div>
  );
}
