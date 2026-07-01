// Page d'accueil dashboard Axso — vue d'ensemble
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { formatMontant } from "@/lib/utils";
import {
  AlertTriangle, ArrowUpRight, Zap, Globe,
  TrendingUp, Users, Eye, BarChart3, Package, ShoppingCart
} from "lucide-react";
import {
  IconProduits, IconCommandes, IconClients, IconAnalytics, IconAxia,
} from "@/components/dashboard/AppIcons";
import { BoutiqueCard } from "@/components/dashboard/BoutiqueCard";

async function getDashboardData(tenantId: string) {
  const now = new Date();
  const debutJour = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const il30Jours = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    ventesJour,
    ventesMois,
    commandesEnAttente,
    visiteurs,
    dernieresCommandes,
    produitsFaibleStock,
    analyticsVentes,
    tenant,
  ] = await Promise.all([
    // Ventes du jour
    prisma.commande.aggregate({
      where: { tenantId, paiementStatut: "completed", createdAt: { gte: debutJour } },
      _sum: { montantTotal: true },
      _count: true,
    }),
    // Ventes du mois
    prisma.commande.aggregate({
      where: { tenantId, paiementStatut: "completed", createdAt: { gte: debutMois } },
      _sum: { montantTotal: true },
      _count: true,
    }),
    // Commandes en attente
    prisma.commande.count({
      where: { tenantId, statut: "en_attente" },
    }),
    // Visiteurs du mois (analytics)
    prisma.analytics.aggregate({
      where: { tenantId, type: "page_view", date: { gte: debutMois } },
      _sum: { valeur: true },
    }),
    // Dernières commandes
    prisma.commande.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { lignes: true, client: true },
    }),
    // Produits à faible stock
    prisma.produit.findMany({
      where: { tenantId, actif: true, stock: { lte: 5, gt: 0 } },
      take: 5,
      orderBy: { stock: "asc" },
    }),
    // Analytics ventes 30 jours pour le graphique
    prisma.analytics.findMany({
      where: { tenantId, type: "purchase", date: { gte: il30Jours } },
      orderBy: { date: "asc" },
    }),
    // Tenant pour la devise + slug
    prisma.tenant.findUnique({ where: { id: tenantId } }),
  ]);

  // Données graphique ventes par jour
  const donneesGraphique = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(il30Jours.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    const ventesDuJour = analyticsVentes.filter(
      (a) => new Date(a.date).toDateString() === date.toDateString()
    );
    return {
      date: dateStr,
      montant: ventesDuJour.reduce((s, a) => s + a.valeur, 0) * 10000,
      commandes: ventesDuJour.length,
    };
  });

  return {
    ventesJour: ventesJour._sum.montantTotal || 0,
    ventesMois: ventesMois._sum.montantTotal || 0,
    commandesEnAttente,
    visiteurs: visiteurs._sum.valeur || 0,
    dernieresCommandes,
    produitsFaibleStock,
    donneesGraphique,
    devise: tenant?.devise || "XOF",
    nombreCommandesMois: ventesMois._count,
    boutiqueSlug: tenant?.slug || "",
    boutiqueNom: tenant?.nomBoutique || "",
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const tenantId = (session.user as any)?.tenantId;
  if (!tenantId) redirect("/inscription");

  const data = await getDashboardData(tenantId);

  const tauxConversion = data.visiteurs > 0
    ? ((data.nombreCommandesMois / data.visiteurs) * 100).toFixed(1)
    : "0";

  const panierMoyen = data.nombreCommandesMois > 0
    ? data.ventesMois / data.nombreCommandesMois
    : 0;

  const now = new Date();
  const heure = now.getHours();
  const salutation = heure < 12 ? "Bonjour" : heure < 18 ? "Bonne après-midi" : "Bonsoir";
  const prenom = session.user?.name?.split(" ")[0] ?? "Marchand";

  return (
    <div className="space-y-6" style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>

      {/* ── Hero Banner avec Logo central ────────────────────────────── */}
      <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ background: "radial-gradient(ellipse at 50% 0%, #F5A623 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F5A623]/20 to-transparent" />
        </div>

        {/* Logo centré — très grande taille */}
        <div className="relative flex flex-col items-center pt-10 pb-6 px-6">
          <div className="mb-3" style={{ filter: "drop-shadow(0 8px 32px rgba(245,166,35,0.18)) drop-shadow(0 2px 8px rgba(0,0,0,0.06))" }}>
            <img
              src="/logo.png"
              alt="Axso"
              style={{ height: "120px", width: "auto", objectFit: "contain" }}
            />
          </div>
          <p className="text-gray-400 text-sm font-medium">
            {salutation}, <span className="text-gray-700 font-semibold">{prenom}</span>
            <span className="mx-2 text-gray-200">·</span>
            {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* KPIs row */}
        <div className="relative flex items-stretch border-t border-gray-100 divide-x divide-gray-100">
          <div className="flex-1 flex flex-col items-center justify-center py-4 px-3">
            <p className="text-xl font-bold text-[#F5A623]">{formatMontant(data.ventesMois, data.devise)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">CA ce mois</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-4 px-3">
            <p className="text-xl font-bold text-gray-800">{data.nombreCommandesMois}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Commandes</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-4 px-3">
            <p className="text-xl font-bold text-gray-800">{Math.round(data.visiteurs).toLocaleString("fr-FR")}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Visiteurs</p>
          </div>
          {data.boutiqueSlug && (
            <div className="flex-1 flex flex-col items-center justify-center py-4 px-3">
              <a href={`/${data.boutiqueSlug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-[#F5A623] text-black font-semibold text-xs px-4 py-2 rounded-full hover:bg-[#d4820a] transition-all shadow-sm">
                <Globe size={11} />
                Ma boutique
                <ArrowUpRight size={10} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── 6 Métriques ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard titre="Ventes aujourd'hui" valeur={formatMontant(data.ventesJour, data.devise)}
          icone={TrendingUp} couleur="#F5A623" tendance={12} />
        <MetricCard titre="Ventes du mois" valeur={formatMontant(data.ventesMois, data.devise)}
          icone={BarChart3} couleur="#7c3aed" tendance={8} />
        <MetricCard titre="En attente" valeur={String(data.commandesEnAttente)}
          icone={ShoppingCart} couleur="#f59e0b" description="À traiter" />
        <MetricCard titre="Visiteurs" valeur={Math.round(data.visiteurs).toLocaleString("fr-FR")}
          icone={Eye} couleur="#10b981" tendance={5} />
        <MetricCard titre="Conversion" valeur={`${tauxConversion}%`}
          icone={Users} couleur="#c2622d" tendance={2} />
        <MetricCard titre="Panier moyen" valeur={formatMontant(panierMoyen, data.devise)}
          icone={Package} couleur="#ec4899" tendance={-3} />
      </div>

      {/* ── Graphique + Panneau droit ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <SalesChart donnees={data.donneesGraphique} devise={data.devise} />
        </div>

        <div className="flex flex-col gap-4">

          {/* Alertes stock */}
          {data.produitsFaibleStock.length > 0 && (
            <div className="bg-white border border-amber-200/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <AlertTriangle size={14} className="text-amber-500" />
                  </div>
                  <h3 className="text-gray-900 font-semibold text-sm">Stock critique</h3>
                </div>
                <span className="text-[10px] font-bold bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full">
                  {data.produitsFaibleStock.length} produits
                </span>
              </div>
              <div className="space-y-2.5">
                {data.produitsFaibleStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <span className="text-gray-700 text-sm truncate">{p.nom}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      p.stock <= 2 ? "bg-red-50 text-red-600 border border-red-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}>
                      {p.stock} restant{p.stock > 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
              <a href="/dashboard/produits" className="mt-4 flex items-center gap-1 text-xs text-[#F5A623] font-semibold hover:underline">
                Gérer les stocks <ArrowUpRight size={11} />
              </a>
            </div>
          )}

          {/* Suggestion AXIA */}
          <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 80% 20%, #7c3aed08 0%, transparent 70%)" }} />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                <IconAxia size={34} />
                <div>
                  <h3 className="text-gray-900 font-semibold text-sm">AXIA Intelligence</h3>
                  <p className="text-gray-400 text-[10px]">Recommandation personnalisée</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Vos ventes augmentent ce mois. Ajoutez de nouveaux produits dans vos catégories les plus performantes pour maximiser votre chiffre d'affaires.
              </p>
              <a href="/dashboard/ia"
                className="flex items-center gap-2 w-full justify-center bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-sm shadow-violet-200">
                <Zap size={14} />
                Parler à AXIA
              </a>
            </div>
          </div>

          {/* Accès rapides */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Accès rapides</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/dashboard/produits/nouveau", label: "Nouveau produit", Ic: IconProduits },
                { href: "/dashboard/commandes",        label: "Commandes",       Ic: IconCommandes },
                { href: "/dashboard/clients",          label: "Clients",         Ic: IconClients },
                { href: "/dashboard/analytics",        label: "Analytics",       Ic: IconAnalytics },
              ].map(({ href, label, Ic }) => (
                <a key={href} href={href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/30 transition-all text-center group">
                  <div className="transition-transform group-hover:scale-110">
                    <Ic size={32} />
                  </div>
                  <span className="text-gray-500 text-[10px] font-medium leading-tight">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Boutique + Commandes récentes ─────────────────────────────── */}
      <BoutiqueCard slug={data.boutiqueSlug} nom={data.boutiqueNom} />
      <OrdersTable commandes={data.dernieresCommandes as any} />
    </div>
  );
}
