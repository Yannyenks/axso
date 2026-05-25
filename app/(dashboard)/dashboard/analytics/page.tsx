import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatMontant } from "@/lib/utils";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { BarChart3, Eye, ShoppingCart, TrendingUp, Users, Star, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const tenantId = (session.user as any)?.tenantId;
  if (!tenantId) redirect("/dashboard");

  const now = new Date();
  const il30Jours = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const il60Jours = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    commandesPeriode,
    commandesPrecedente,
    analyticsParType,
    analyticsParTypePrecedent,
    topProduits,
    statutDistribution,
    derniersAvis,
    tenant,
    commandesParJour,
  ] = await Promise.all([
    // Commandes des 30 derniers jours
    prisma.commande.aggregate({
      where: { tenantId, createdAt: { gte: il30Jours }, paiementStatut: "completed" },
      _sum: { montantTotal: true },
      _count: true,
    }),
    // Commandes des 30 jours précédents
    prisma.commande.aggregate({
      where: { tenantId, createdAt: { gte: il60Jours, lt: il30Jours }, paiementStatut: "completed" },
      _sum: { montantTotal: true },
      _count: true,
    }),
    // Analytics période actuelle
    prisma.analytics.groupBy({
      by: ["type"],
      where: { tenantId, date: { gte: il30Jours } },
      _sum: { valeur: true },
    }),
    // Analytics période précédente
    prisma.analytics.groupBy({
      by: ["type"],
      where: { tenantId, date: { gte: il60Jours, lt: il30Jours } },
      _sum: { valeur: true },
    }),
    // Top produits par ventes
    prisma.produit.findMany({
      where: { tenantId, actif: true },
      orderBy: { ventes: "desc" },
      take: 8,
    }),
    // Distribution des statuts
    prisma.commande.groupBy({
      by: ["statut"],
      where: { tenantId },
      _count: true,
    }),
    // Derniers avis
    prisma.avis.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { produit: { select: { nom: true, images: true } } },
    }),
    // Tenant info
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    // Commandes par jour pour le graphique (30 derniers jours)
    prisma.commande.findMany({
      where: { tenantId, createdAt: { gte: il30Jours }, paiementStatut: "completed" },
      select: { createdAt: true, montantTotal: true },
    }),
  ]);

  // Construire les données du graphique jour par jour
  const donneesMap: Record<string, { montant: number; commandes: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(il30Jours.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    donneesMap[key] = { montant: 0, commandes: 0 };
  }
  for (const c of commandesParJour) {
    const key = new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    if (donneesMap[key]) {
      donneesMap[key].montant += c.montantTotal;
      donneesMap[key].commandes += 1;
    }
  }
  const donnees30Jours = Object.entries(donneesMap).map(([date, v]) => ({ date, ...v }));

  // Métriques analytics
  const getVal = (arr: typeof analyticsParType, type: string) =>
    arr.find(a => a.type === type)?._sum.valeur || 0;

  const pageViews = getVal(analyticsParType, "page_view");
  const productViews = getVal(analyticsParType, "product_view");
  const addToCart = getVal(analyticsParType, "add_to_cart");

  const pageViewsPrev = getVal(analyticsParTypePrecedent, "page_view");
  const productViewsPrev = getVal(analyticsParTypePrecedent, "product_view");
  const addToCartPrev = getVal(analyticsParTypePrecedent, "add_to_cart");

  const revenuActuel = commandesPeriode._sum.montantTotal || 0;
  const revenuPrecedent = commandesPrecedente._sum.montantTotal || 0;
  const commandesActuel = commandesPeriode._count;
  const commandesPrecedentCount = commandesPrecedente._count;

  const delta = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const tauxConversion = pageViews > 0 ? ((commandesActuel / pageViews) * 100).toFixed(1) : "0";
  const panier = commandesActuel > 0 ? revenuActuel / commandesActuel : 0;

  const kpis = [
    {
      label: "Revenu (30j)",
      valeur: formatMontant(revenuActuel, tenant?.devise || "XOF"),
      delta: delta(revenuActuel, revenuPrecedent),
      couleur: "#34d399",
      icone: TrendingUp,
    },
    {
      label: "Commandes",
      valeur: commandesActuel.toString(),
      delta: delta(commandesActuel, commandesPrecedentCount),
      couleur: "#60a5fa",
      icone: ShoppingCart,
    },
    {
      label: "Pages vues",
      valeur: Math.round(pageViews).toLocaleString("fr-FR"),
      delta: delta(pageViews, pageViewsPrev),
      couleur: "#F5A623",
      icone: Eye,
    },
    {
      label: "Vues produits",
      valeur: Math.round(productViews).toLocaleString("fr-FR"),
      delta: delta(productViews, productViewsPrev),
      couleur: "#a78bfa",
      icone: BarChart3,
    },
    {
      label: "Ajouts panier",
      valeur: Math.round(addToCart).toLocaleString("fr-FR"),
      delta: delta(addToCart, addToCartPrev),
      couleur: "#f59e0b",
      icone: Users,
    },
    {
      label: "Panier moyen",
      valeur: formatMontant(panier, tenant?.devise || "XOF"),
      delta: null,
      couleur: "#f472b6",
      icone: ShoppingCart,
    },
  ];

  const statutLabels: Record<string, { label: string; color: string }> = {
    en_attente: { label: "En attente", color: "#f59e0b" },
    confirmee: { label: "Confirmée", color: "#60a5fa" },
    en_preparation: { label: "En préparation", color: "#a78bfa" },
    en_livraison: { label: "En livraison", color: "#F5A623" },
    livree: { label: "Livrée", color: "#34d399" },
    annulee: { label: "Annulée", color: "#f87171" },
  };

  const totalCommandes = statutDistribution.reduce((s, x) => s + x._count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-playfair">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Activité réelle des 30 derniers jours · comparaison période précédente</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icone;
          const d = k.delta;
          return (
            <div key={i} className="bg-white border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={14} style={{ color: k.couleur }} />
                  <span className="text-gray-500 text-xs">{k.label}</span>
                </div>
                {d !== null && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${d > 0 ? "text-green-400" : d < 0 ? "text-red-400" : "text-gray-500"}`}>
                    {d > 0 ? <ArrowUpRight size={11} /> : d < 0 ? <ArrowDownRight size={11} /> : <Minus size={11} />}
                    {Math.abs(d)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{k.valeur}</p>
              {d !== null && (
                <p className="text-gray-600 text-[10px] mt-1">vs. 30 jours précédents</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Graphique des ventes */}
      <SalesChart donnees={donnees30Jours} devise={tenant?.devise || "XOF"} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top produits */}
        <div className="bg-white border border-white/5 rounded-2xl p-6">
          <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-[#F5A623]" />
            Top produits
          </h3>
          {topProduits.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">Aucune vente pour le moment</p>
          ) : (
            <div className="space-y-3">
              {topProduits.map((p, i) => {
                const maxVentes = topProduits[0].ventes || 1;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-gray-600 text-xs w-4 text-right">{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                      {p.images[0]
                        ? <img src={p.images[0]} alt={p.nom} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">??</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 text-sm truncate">{p.nom}</p>
                      <div className="w-full bg-white/5 rounded-full h-1 mt-1">
                        <div className="h-full rounded-full bg-[#F5A623]" style={{ width: `${(p.ventes / maxVentes) * 100}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-gray-900 text-sm font-bold">{p.ventes}</p>
                      <p className="text-gray-500 text-[10px]">ventes</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Distribution des statuts */}
        <div className="bg-white border border-white/5 rounded-2xl p-6">
          <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={15} className="text-[#60a5fa]" />
            Statuts des commandes
          </h3>
          {totalCommandes === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">Aucune commande pour le moment</p>
          ) : (
            <div className="space-y-3">
              {statutDistribution
                .sort((a, b) => b._count - a._count)
                .map(s => {
                  const info = statutLabels[s.statut] || { label: s.statut, color: "#9ca3af" };
                  const pct = Math.round((s._count / totalCommandes) * 100);
                  return (
                    <div key={s.statut}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm" style={{ color: info.color }}>{info.label}</span>
                        <span className="text-gray-900 text-sm font-bold">{s._count} <span className="text-gray-600 font-normal text-xs">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: info.color }} />
                      </div>
                    </div>
                  );
                })}
              <p className="text-gray-600 text-xs pt-1 border-t border-white/5 mt-3">{totalCommandes} commandes total (tous statuts)</p>
            </div>
          )}
        </div>
      </div>

      {/* Taux de conversion */}
      <div className="bg-white border border-white/5 rounded-2xl p-6">
        <h3 className="text-gray-800 font-semibold mb-4">Entonnoir de conversion (30 jours)</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Visites", val: Math.round(pageViews), color: "#F5A623" },
            { label: "Vues produits", val: Math.round(productViews), color: "#a78bfa" },
            { label: "Ajouts panier", val: Math.round(addToCart), color: "#f59e0b" },
            { label: "Achats", val: commandesActuel, color: "#34d399" },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="relative mb-2">
                <div
                  className="mx-auto rounded-xl flex items-end justify-center"
                  style={{
                    height: "80px",
                    width: "100%",
                    backgroundColor: `${step.color}10`,
                    border: `1px solid ${step.color}20`,
                  }}
                >
                  <div
                    className="rounded-b-xl w-full"
                    style={{
                      height: `${pageViews > 0 ? Math.max(8, (step.val / Math.max(pageViews, 1)) * 100) : 8}%`,
                      backgroundColor: `${step.color}40`,
                    }}
                  />
                </div>
              </div>
              <p className="text-gray-900 font-bold">{step.val.toLocaleString("fr-FR")}</p>
              <p className="text-gray-500 text-xs">{step.label}</p>
              {i > 0 && pageViews > 0 && (
                <p className="text-[10px] mt-0.5" style={{ color: step.color }}>
                  {((step.val / pageViews) * 100).toFixed(1)}% des visites
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-gray-500 text-sm">Taux de conversion global</span>
          <span className="text-gray-900 font-bold text-lg">{tauxConversion}%</span>
        </div>
      </div>

      {/* Derniers avis */}
      {derniersAvis.length > 0 && (
        <div className="bg-white border border-white/5 rounded-2xl p-6">
          <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
            <Star size={15} className="text-[#F5A623]" />
            Derniers avis clients
          </h3>
          <div className="space-y-3">
            {derniersAvis.map(a => (
              <div key={a.id} className="flex items-start gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                  {a.produit.images[0]
                    ? <img src={a.produit.images[0]} alt={a.produit.nom} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs">??</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-xs mb-1 truncate">{a.produit.nom}</p>
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={10} className={i < a.note ? "text-[#F5A623] fill-[#F5A623]" : "text-gray-700"} />
                    ))}
                    <span className="text-gray-600 text-[10px] ml-1">{a.produit.nom}</span>
                  </div>
                  {a.commentaire && <p className="text-gray-600 text-xs line-clamp-2">{a.commentaire}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

