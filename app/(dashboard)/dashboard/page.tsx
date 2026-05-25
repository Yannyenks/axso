// Page d'accueil dashboard Axso — vue d'ensemble
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { formatMontant } from "@/lib/utils";
import {
  ShoppingCart, TrendingUp, Users, Eye, BarChart3, Package, AlertTriangle, Sparkles, ExternalLink, Copy
} from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-playfair">
            Bonjour, {session.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Voici ce qui se passe dans votre boutique aujourd'hui
          </p>
        </div>
        <div className="text-right">
          <p className="text-[#F5A623] font-bold text-lg">
            {formatMontant(data.ventesMois, data.devise)}
          </p>
          <p className="text-gray-500 text-xs">Ce mois-ci</p>
        </div>
      </div>

      {/* 6 Métriques */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          titre="Ventes aujourd'hui"
          valeur={formatMontant(data.ventesJour, data.devise)}
          icone={TrendingUp}
          couleur="#F5A623"
          tendance={12}
        />
        <MetricCard
          titre="Ventes du mois"
          valeur={formatMontant(data.ventesMois, data.devise)}
          icone={BarChart3}
          couleur="#7c3aed"
          tendance={8}
        />
        <MetricCard
          titre="Commandes en attente"
          valeur={String(data.commandesEnAttente)}
          icone={ShoppingCart}
          couleur="#f59e0b"
          description="À traiter"
        />
        <MetricCard
          titre="Visiteurs ce mois"
          valeur={Math.round(data.visiteurs).toLocaleString("fr-FR")}
          icone={Eye}
          couleur="#10b981"
          tendance={5}
        />
        <MetricCard
          titre="Taux de conversion"
          valeur={`${tauxConversion}%`}
          icone={Users}
          couleur="#c2622d"
          tendance={2}
        />
        <MetricCard
          titre="Panier moyen"
          valeur={formatMontant(panierMoyen, data.devise)}
          icone={Package}
          couleur="#ec4899"
          tendance={-3}
        />
      </div>

      {/* Graphique + Alertes */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart donnees={data.donneesGraphique} devise={data.devise} />
        </div>

        <div className="space-y-4">
          {/* Alerte stock faible */}
          {data.produitsFaibleStock.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-orange-500" />
                <h3 className="text-orange-600 font-semibold text-sm">Stock faible</h3>
              </div>
              <div className="space-y-2">
                {data.produitsFaibleStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="text-gray-700 text-sm truncate max-w-32">{p.nom}</span>
                    <span className="text-orange-600 text-xs font-bold bg-orange-100 px-2 py-0.5 rounded">
                      {p.stock} restants
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestion IA */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-violet-500" />
              <h3 className="text-violet-700 font-semibold text-sm">Suggestion IA</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              💡 Vos ventes de robes augmentent de 23% ce mois. Ajoutez 5 nouveaux modèles pour capitaliser sur cette tendance !
            </p>
            <button className="mt-3 text-violet-600 text-xs hover:text-violet-800 transition-colors font-medium">
              Voir plus de suggestions →
            </button>
          </div>
        </div>
      </div>

      {/* Carte boutique */}
      <BoutiqueCard slug={data.boutiqueSlug} nom={data.boutiqueNom} />

      {/* Tableau commandes récentes */}
      <OrdersTable commandes={data.dernieresCommandes as any} />
    </div>
  );
}
