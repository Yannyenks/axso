export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, formatMontant } from "@/lib/utils";
import { resolveThemeConfigAsync } from "@/lib/theme-config-server";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import Link from "next/link";
import { ClipboardList, CheckCircle2, Package, Truck, Sparkles, Phone, Check, Smartphone, Circle } from "lucide-react";
import { ConfirmReceptionButton } from "@/components/storefront/ConfirmReceptionButton";

interface Props {
  params: Promise<{ slug: string; orderId: string }>;
}

const ETAPES = [
  { statut: "en_attente",     label: "Commande reçue",   icon: <ClipboardList size={18} /> },
  { statut: "confirmee",      label: "Confirmée",         icon: <CheckCircle2 size={18} /> },
  { statut: "en_preparation", label: "En préparation",   icon: <Package size={18} /> },
  { statut: "expediee",       label: "En livraison",     icon: <Truck size={18} /> },
  { statut: "livree",         label: "Livrée",            icon: <Sparkles size={18} /> },
];

export default async function SuiviPage({ params }: Props) {
  const { slug, orderId } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.statut !== "active") notFound();

  const commande = await prisma.commande.findUnique({
    where: { id: orderId },
    include: { lignes: { select: { nom: true, quantite: true, prix: true, imageUrl: true } }, livreur: { select: { nom: true, telephone: true } } },
  });

  if (!commande || commande.tenantId !== tenant.id) notFound();

  const cfg = await resolveThemeConfigAsync(tenant.themeId, tenant.id, tenant.themeConfig as Record<string, any>);
  const theme = cfg.colors;
  const etapeActuelle = Math.max(0, ETAPES.findIndex((e) => e.statut === commande.statut));

  // Le client peut confirmer si la commande est en route (expediee) et pas encore livrée
  const peutConfirmer = commande.statut === "expediee";
  // Confirmé dès que le statut est "livree" (que ce soit le marchand ou le client qui a confirmé)
  const dejaCONFIRME = commande.statut === "livree";

  return (
    <div style={{ backgroundColor: theme.fond, color: theme.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <nav style={{ borderBottomColor: `${theme.accent}20` }} className="sticky top-0 z-50 backdrop-blur-lg border-b">
        <div style={{ backgroundColor: `${theme.fond}cc` }} className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${slug}`}>
            <span className="text-xl font-bold font-playfair" style={{ color: theme.accent }}>{tenant.nomBoutique}</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-playfair" style={{ color: theme.accent }}>Suivi de commande</h1>
          <p style={{ opacity: 0.6 }} className="mt-1 font-mono text-sm">{commande.numero}</p>
        </div>

        {/* Statut annulé */}
        {commande.statut === "annulee" && (
          <div className="rounded-2xl border p-5 bg-red-500/10 border-red-500/30">
            <p className="font-semibold text-red-400">Commande annulée</p>
            <p className="text-sm opacity-70 mt-1">Cette commande a été annulée. Contactez la boutique pour plus d'informations.</p>
          </div>
        )}

        {/* Timeline */}
        {commande.statut !== "annulee" && (
          <div className="rounded-2xl border p-6" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
            <div className="space-y-0">
              {ETAPES.map((etape, index) => {
                const fait = index <= etapeActuelle;
                const actuel = index === etapeActuelle;
                return (
                  <div key={etape.statut} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                        backgroundColor: fait ? theme.accent : `${theme.accent}15`,
                        border: `2px solid ${fait ? theme.accent : `${theme.accent}30`}`,
                        color: fait ? theme.fond : `${theme.accent}80`,
                      }}>
                        {fait ? <Check size={18} /> : <Circle size={18} />}
                      </div>
                      {index < ETAPES.length - 1 && (
                        <div className="w-0.5 h-8 my-1" style={{ backgroundColor: fait && index < etapeActuelle ? theme.accent : `${theme.accent}20` }} />
                      )}
                    </div>
                    <div className="pt-2 pb-6">
                      <p className="font-semibold text-sm" style={{ color: actuel ? theme.accent : undefined, opacity: fait ? 1 : 0.4 }}>{etape.label}</p>
                      {actuel && <p className="text-xs mt-0.5" style={{ opacity: 0.5 }}>Statut actuel</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Livreur info */}
        {commande.livreur && (
          <div className="rounded-2xl border p-5" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
            <p className="font-semibold text-sm mb-2">Livreur assigné</p>
            <p className="font-medium">{commande.livreur.nom}</p>
            {commande.livreur.telephone && (
              <a href={`tel:${commande.livreur.telephone}`} className="text-sm mt-1 inline-flex items-center gap-1" style={{ color: theme.accent }}>
                <Phone size={14} /> {commande.livreur.telephone}
              </a>
            )}
          </div>
        )}

        {/* Confirmation réception */}
        {(peutConfirmer || dejaCONFIRME) && (
          <div
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: dejaCONFIRME ? `${theme.accent}08` : theme.surface,
              borderColor: dejaCONFIRME ? `${theme.accent}35` : `${theme.accent}20`,
            }}
          >
            {dejaCONFIRME ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`, boxShadow: `0 0 24px ${theme.accent}44` }}
                >
                  <CheckCircle2 size={28} color={theme.fond} />
                </div>
                <p className="font-bold" style={{ color: theme.accent }}>Commande livrée</p>
                <p className="text-sm opacity-55">Votre colis a bien été livré. Merci pour votre confiance !</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold mb-1">Vous avez reçu votre colis ?</p>
                <p className="text-sm opacity-55 mb-5">
                  Confirmez la réception pour valider votre livraison. Le marchand sera notifié.
                </p>
                <ConfirmReceptionButton
                  commandeId={commande.id}
                  slug={slug}
                  accent={theme.accent}
                  fond={theme.fond}
                />
              </div>
            )}
          </div>
        )}

        {/* Détails */}
        <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
          <h3 className="font-semibold">Récapitulatif</h3>

          {commande.lignes.length > 0 && (
            <div className="space-y-2 pb-3 border-b" style={{ borderColor: `${theme.accent}20` }}>
              {commande.lignes.map((l, i) => (
                <div key={i} className="flex items-center gap-3">
                  {l.imageUrl && <img src={l.imageUrl} alt={l.nom} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{l.nom}</p>
                    <p style={{ opacity: 0.5 }}>x{l.quantite}</p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: theme.accent }}>{formatMontant(l.prix * l.quantite, tenant.devise)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ opacity: 0.6 }}>Adresse</span>
              <span className="text-right text-sm">{commande.adresseLivraison}, {commande.ville}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ opacity: 0.6 }}>Date de commande</span>
              <span>{formatDate(commande.createdAt)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total payé</span>
              <span style={{ color: theme.accent }}>{formatMontant(commande.montantTotal, tenant.devise)}</span>
            </div>
          </div>
        </div>

        {/* Contact + continue */}
        <div className="flex flex-col sm:flex-row gap-3">
          {tenant.whatsapp && (
            <a
              href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}?text=Bonjour, j'ai une question sur ma commande ${commande.numero}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 transition-all"
              style={{ borderColor: theme.accent, color: theme.accent }}
            >
              <Smartphone size={16} /> Contacter la boutique
            </a>
          )}
          <Link
            href={`/${slug}/produits`}
            className="flex-1 text-center py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: theme.accent, color: theme.fond }}
          >
            Continuer les achats
          </Link>
        </div>
      </div>
    </div>
  );
}
