export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatMontant, formatDate } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle, XCircle, Shield, TrendingDown, Download, Zap, Package, MessageCircle, Check, X, GraduationCap, KeyRound, Copy } from "lucide-react";
import { resolveThemeConfigAsync } from "@/lib/theme-config-server";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { verifierPaiementNotchPay, hasNotchPay } from "@/lib/notchpay";
import { confirmerPaiementCommande } from "@/lib/paiement-commande";
import { TYPES_LIVRAISON_DIGITALE } from "@/lib/affiliation";
import { CopyableKey } from "@/components/storefront/CopyableKey";
import { LockedDownloads } from "@/components/storefront/LockedDownloads";

interface Props {
  params: Promise<{ slug: string; orderId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

// Filet de sécurité : si le webhook NotchPay n'est pas encore arrivé au moment
// où le client revient de la page de paiement hébergée, on vérifie directement
// et on confirme la commande (confirmerPaiementCommande est idempotent).
async function verifierEtConfirmerNotchPay(commandeId: string, paiementReference: string | null) {
  if (!hasNotchPay() || !paiementReference) return;
  try {
    // paiementReference = référence NotchPay ("trx.xxx") stockée à l'initialisation —
    // GET /payments/{reference} n'accepte que leur propre référence, pas la nôtre.
    const { transaction } = await verifierPaiementNotchPay(paiementReference);
    if (transaction?.status === "complete") {
      await confirmerPaiementCommande(commandeId, paiementReference);
    }
  } catch {
    // Le webhook reste la source de vérité — on affiche l'état actuel de la commande
  }
}

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { slug, orderId } = await params;
  await searchParams;

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.statut !== "active") notFound();

  const commandeAvant = await prisma.commande.findUnique({ where: { id: orderId }, select: { paiementStatut: true, methodePaiement: true, paiementReference: true } });
  if (commandeAvant?.paiementStatut === "pending" && commandeAvant.methodePaiement === "notchpay") {
    await verifierEtConfirmerNotchPay(orderId, commandeAvant.paiementReference);
  }

  const commande = await prisma.commande.findUnique({
    where: { id: orderId },
    include: {
      lignes: {
        include: {
          produit: { select: { id: true, type: true, fichierUrl: true, fichierNom: true } },
        },
      },
    },
  });
  if (!commande || commande.tenantId !== tenant.id) notFound();

  const themeConfig = await resolveThemeConfigAsync(tenant.themeId, tenant.id, (tenant.themeConfig as Record<string, any>) || {});
  const theme = themeConfig.colors;

  const paye = commande.paiementStatut === "completed";
  const echoue = commande.paiementStatut === "failed";
  const isCOD = commande.methodePaiement === "whatsapp_cod" || commande.methodePaiement === "direct_cod";
  const isDigital = commande.lignes.some(l => l.produit?.type && TYPES_LIVRAISON_DIGITALE.has(l.produit.type));

  const lignesDigitales = commande.lignes.filter(l => l.produit?.type === "digital" && l.produit?.fichierUrl);

  // Résout aussi les produits inclus dans les bundles achetés — leurs livraisons
  // (tokens/clés/accès) sont créées contre leur propre id, pas celui du bundle.
  const ligneProduitIds = commande.lignes.map(l => l.produit?.id).filter((id): id is string => !!id);
  const bundlesAchetes = ligneProduitIds.length
    ? await prisma.bundleProduit.findMany({
        where: { produitId: { in: ligneProduitIds } },
        include: { elements: { include: { produitInclus: { select: { id: true, nom: true } } } } },
      })
    : [];
  const produitsInclusBundle = bundlesAchetes.flatMap(b => b.elements.map(e => e.produitInclus));
  const tousProduitIds = [...new Set([...ligneProduitIds, ...produitsInclusBundle.map(p => p.id)])];
  const nomProduit = new Map<string, string>([
    ...commande.lignes.filter(l => l.produit).map(l => [l.produit!.id, l.nom] as const),
    ...produitsInclusBundle.map(p => [p.id, p.nom] as const),
  ]);

  const [telechargements, accesFormations, clesLicence] = tousProduitIds.length
    ? await Promise.all([
        prisma.telechargement.findMany({
          where: { commandeId: orderId, produitId: { in: tousProduitIds } },
          include: { produit: { include: { produitFichier: { include: { fichiers: { orderBy: { ordre: "asc" } } } } } } },
        }),
        prisma.accesFormation.findMany({ where: { commandeId: orderId, produitId: { in: tousProduitIds } } }),
        prisma.cleLicence.findMany({
          where: { commandeId: orderId, licenceProduit: { produitId: { in: tousProduitIds } } },
          include: { licenceProduit: { select: { produitId: true } } },
        }),
      ])
    : [[], [], []] as const;

  // commande.montantTotal est déjà majoré de la commission côté client (prix vendeur
  // × (1 + taux)) — le marchand reçoit son prix intégral, extrait par division.
  const montantMarchand = commande.montantTotal / (1 + (tenant.commissionRate || 0.06));
  const montantCommission = commande.montantTotal - montantMarchand;

  return (
    <div style={{ backgroundColor: theme.fond, color: theme.texte, minHeight: "100vh" }}>
      <ThemeEffect themeId={tenant.themeId} />
      <div className="max-w-2xl mx-auto px-4 py-16">

        {/* ── En-tête statut ─────────────────────────────────────────── */}
        {echoue ? (
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)" }}>
              <XCircle size={36} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold font-playfair mb-2 text-red-400">Paiement échoué</h1>
            <p className="opacity-60 mb-6">Une erreur est survenue. Votre commande n'a pas été confirmée.</p>
            <Link href={`/${slug}/panier`}
              className="px-8 py-3 rounded-xl font-semibold text-sm inline-block"
              style={{ backgroundColor: theme.accent, color: theme.fond }}>
              Réessayer
            </Link>
          </div>
        ) : isCOD ? (
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)" }}>
              <Package size={36} className="text-green-400" />
            </div>
            <h1 className="text-3xl font-bold font-playfair mb-2 text-green-400">Commande enregistrée !</h1>
            <p className="opacity-70 text-lg mb-1">Merci {commande.clientNom}</p>
            <p className="opacity-40 text-sm">Le vendeur va vous contacter pour organiser la livraison.</p>
          </div>
        ) : isDigital ? (
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: `${theme.accent}20`, border: `2px solid ${theme.accent}` }}>
              <Zap size={36} style={{ color: theme.accent }} />
            </div>
            <h1 className="text-3xl font-bold font-playfair mb-2" style={{ color: theme.accent }}>
              {paye ? "Achat confirmé !" : "Commande reçue !"}
            </h1>
            <p className="opacity-70 text-lg mb-1">Merci {commande.clientNom} — votre fichier est prêt !</p>
            <p className="opacity-40 text-sm">Un lien de téléchargement a été envoyé à votre email.</p>
          </div>
        ) : (
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: `${theme.accent}20`, border: `2px solid ${theme.accent}` }}>
              <CheckCircle size={36} style={{ color: theme.accent }} />
            </div>
            <h1 className="text-3xl font-bold font-playfair mb-2" style={{ color: theme.accent }}>
              {paye ? "Commande confirmée !" : "Commande reçue !"}
            </h1>
            <p className="opacity-70 text-lg mb-1">Merci pour votre commande, {commande.clientNom}</p>
            <p className="opacity-40 text-sm">Un email de confirmation vous a été envoyé.</p>
          </div>
        )}

        {/* ── Téléchargements digitaux ──────────────────────────────── */}
        {lignesDigitales.length > 0 && (paye || !echoue) && (
          <div className="rounded-2xl border p-6 mb-4 space-y-4"
            style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}40`, boxShadow: `0 0 0 1px ${theme.accent}20, 0 8px 32px ${theme.accent}12` }}>
            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: theme.accent }}>
              <Download size={16} /> Vos téléchargements
            </h3>
            <div className="space-y-3">
              {lignesDigitales.map((ligne) => (
                <div key={ligne.id} className="flex items-center justify-between gap-4 p-3 rounded-xl"
                  style={{ backgroundColor: `${theme.accent}08`, border: `1px solid ${theme.accent}20` }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{ligne.nom}</p>
                    <p className="text-xs opacity-50 mt-0.5">{ligne.produit?.fichierNom || "Fichier digital"}</p>
                  </div>
                  <a
                    href={ligne.produit!.fichierUrl!}
                    download={ligne.produit?.fichierNom || ligne.nom}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 transition-all hover:opacity-90"
                    style={{ backgroundColor: theme.accent, color: theme.fond }}>
                    <Download size={14} /> Télécharger
                  </a>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs opacity-50">
              <Zap size={11} style={{ color: theme.accent }} />
              Liens valides 7 jours · Accès depuis votre email également
            </div>
          </div>
        )}

        {/* ── Fichiers (nouveau système multi-fichiers) ─────────────── */}
        {telechargements.length > 0 && (paye || !echoue) && (
          <div className="rounded-2xl border p-6 mb-4 space-y-4"
            style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}40`, boxShadow: `0 0 0 1px ${theme.accent}20, 0 8px 32px ${theme.accent}12` }}>
            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: theme.accent }}>
              <Download size={16} /> Vos fichiers
            </h3>
            <div className="space-y-3">
              {telechargements.map((dl) => {
                const fichiers = dl.produit.produitFichier?.fichiers ?? [];
                const nom = nomProduit.get(dl.produitId) ?? dl.produit.nom;
                if (fichiers.length === 0) return null;
                if (dl.produit.produitFichier?.motDePasse) {
                  return <LockedDownloads key={dl.id} token={dl.token} nom={nom} accent={theme.accent} fond={theme.fond} />;
                }
                return (
                  <div key={dl.id} className="p-3 rounded-xl" style={{ backgroundColor: `${theme.accent}08`, border: `1px solid ${theme.accent}20` }}>
                    <p className="text-sm font-semibold mb-2">{nom}</p>
                    <div className="space-y-2">
                      {fichiers.map((f) => (
                        <div key={f.id} className="flex items-center justify-between gap-3">
                          <span className="text-xs opacity-60 truncate">{f.nom}</span>
                          <a href={`/api/telechargements/${dl.token}?fichier=${f.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-all hover:opacity-90"
                            style={{ backgroundColor: theme.accent, color: theme.fond }}>
                            <Download size={12} /> Télécharger
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-xs opacity-50">
              <Zap size={11} style={{ color: theme.accent }} />
              Accès valide 1 an · Retrouvez ce lien dans votre email de confirmation
            </div>
          </div>
        )}

        {/* ── Formations ───────────────────────────────────────────── */}
        {accesFormations.length > 0 && (paye || !echoue) && (
          <div className="rounded-2xl border p-6 mb-4 space-y-3"
            style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}40`, boxShadow: `0 0 0 1px ${theme.accent}20, 0 8px 32px ${theme.accent}12` }}>
            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: theme.accent }}>
              <GraduationCap size={16} /> Vos formations
            </h3>
            <div className="space-y-3">
              {accesFormations.map((acces) => (
                <div key={acces.id} className="flex items-center justify-between gap-4 p-3 rounded-xl"
                  style={{ backgroundColor: `${theme.accent}08`, border: `1px solid ${theme.accent}20` }}>
                  <p className="text-sm font-semibold truncate">{nomProduit.get(acces.produitId) ?? "Formation"}</p>
                  <a href={`/${slug}/formation/${acces.token}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 transition-all hover:opacity-90"
                    style={{ backgroundColor: theme.accent, color: theme.fond }}>
                    Accéder <GraduationCap size={14} />
                  </a>
                </div>
              ))}
            </div>
            <p className="text-xs opacity-50">Accès à vie · Retrouvez ce lien dans votre email de confirmation</p>
          </div>
        )}

        {/* ── Licences ─────────────────────────────────────────────── */}
        {clesLicence.length > 0 && (paye || !echoue) && (
          <div className="rounded-2xl border p-6 mb-4 space-y-3"
            style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}40`, boxShadow: `0 0 0 1px ${theme.accent}20, 0 8px 32px ${theme.accent}12` }}>
            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: theme.accent }}>
              <KeyRound size={16} /> Vos clés de licence
            </h3>
            <div className="space-y-3">
              {clesLicence.map((cle) => (
                <div key={cle.id} className="flex items-center justify-between gap-4 p-3 rounded-xl"
                  style={{ backgroundColor: `${theme.accent}08`, border: `1px solid ${theme.accent}20` }}>
                  <p className="text-sm font-semibold truncate">{nomProduit.get(cle.licenceProduit.produitId) ?? "Licence"}</p>
                  <CopyableKey value={cle.cle} accent={theme.accent} fond={theme.fond} />
                </div>
              ))}
            </div>
            <p className="text-xs opacity-50">Conservez précieusement vos clés — elles ne sont affichées qu'une fois.</p>
          </div>
        )}

        {/* ── WhatsApp CTA pour COD ─────────────────────────────────── */}
        {isCOD && (
          <div className="rounded-2xl border p-5 mb-4 flex items-center gap-4"
            style={{ backgroundColor: "rgba(37,211,102,0.05)", borderColor: "rgba(37,211,102,0.25)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#25D366" }}>
              <MessageCircle size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-green-500">Paiement à la livraison</p>
              <p className="text-xs opacity-60 mt-0.5">Vous paierez en espèces ou mobile money à la réception du colis.</p>
            </div>
          </div>
        )}

        {/* ── Récapitulatif ─────────────────────────────────────────── */}
        <div className="rounded-2xl border p-6 mb-4 space-y-3"
          style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
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
            {isCOD ? (
              <span className="text-green-400 font-medium flex items-center gap-1"><Check size={12} /> Paiement à la livraison</span>
            ) : (
              <span className={`flex items-center gap-1 ${paye ? "text-green-400 font-medium" : echoue ? "text-red-400 font-medium" : "text-amber-400 font-medium"}`}>
                {paye ? <><Check size={12} /> Payé</> : echoue ? <><X size={12} /> Échoué</> : "En attente"}
              </span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="opacity-60 text-sm">Total</span>
            <span className="font-bold text-lg" style={{ color: theme.accent }}>{formatMontant(commande.montantTotal, tenant.devise)}</span>
          </div>
          {commande.adresseLivraison && commande.adresseLivraison !== "À préciser" && !isDigital && (
            <div className="flex justify-between text-sm">
              <span className="opacity-60">Livraison</span>
              <span className="text-right max-w-xs opacity-80">{commande.adresseLivraison}, {commande.ville}</span>
            </div>
          )}
        </div>

        {/* ── Articles ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border p-6 mb-4"
          style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
          <h3 className="font-semibold text-sm opacity-80 mb-4">Articles commandés</h3>
          <div className="space-y-3">
            {commande.lignes.map((ligne) => (
              <div key={ligne.id} className="flex items-center justify-between text-sm gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {ligne.produit?.type && TYPES_LIVRAISON_DIGITALE.has(ligne.produit.type)
                    ? <Zap size={12} style={{ color: theme.accent }} className="flex-shrink-0" />
                    : <Package size={12} className="opacity-40 flex-shrink-0" />
                  }
                  <span className="opacity-80 truncate">
                    {ligne.nom}{ligne.variante ? ` (${ligne.variante})` : ""} × {ligne.quantite}
                  </span>
                </div>
                <span style={{ color: theme.accent }} className="flex-shrink-0">
                  {formatMontant(ligne.prix * ligne.quantite, tenant.devise)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Escrow section (paiement en ligne uniquement) ─────────── */}
        {paye && !isCOD && (
          <div className="rounded-2xl border p-6 mb-6 space-y-4"
            style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
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
                  <TrendingDown size={11} /> Commission Axso ({Math.round((tenant.commissionRate || 0.06) * 100)}%)
                </span>
                <span className="text-red-400">-{formatMontant(montantCommission, tenant.devise)}</span>
              </div>
              <div className="border-t pt-2.5 flex justify-between text-sm" style={{ borderColor: `${theme.accent}15` }}>
                <span className="opacity-60 font-medium">Reversé au marchand</span>
                <span className="font-bold" style={{ color: theme.accent }}>{formatMontant(montantMarchand, tenant.devise)}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl p-3 mt-2"
              style={{ backgroundColor: `${theme.accent}08`, border: `1px solid ${theme.accent}20` }}>
              <Zap size={14} style={{ color: theme.accent }} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold" style={{ color: theme.accent }}>Fonds libérés immédiatement</p>
                <p className="opacity-50 text-xs mt-0.5">
                  Le marchand reçoit les fonds instantanément après confirmation du paiement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!isCOD && !isDigital && commande.trackingToken && (
            <Link href={`/${slug}/tracking/${commande.trackingToken}`}
              className="flex-1 text-center px-6 py-3 rounded-xl font-semibold text-sm transition-all border"
              style={{ borderColor: `${theme.accent}40`, color: theme.accent }}>
              Suivre ma commande
            </Link>
          )}
          <Link href={`/${slug}/produits`}
            className="flex-1 text-center px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: theme.accent, color: theme.fond }}>
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
