import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatMontant } from "@/lib/utils";
import { SalesChart } from "@/components/dashboard/SalesChart";
import {
  BarChart3,
  Eye,
  ShoppingCart,
  TrendingUp,
  Users,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
} from "lucide-react";

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
    prisma.commande.aggregate({
      where: { tenantId, createdAt: { gte: il30Jours }, paiementStatut: "completed" },
      _sum: { montantTotal: true },
      _count: true,
    }),
    prisma.commande.aggregate({
      where: { tenantId, createdAt: { gte: il60Jours, lt: il30Jours }, paiementStatut: "completed" },
      _sum: { montantTotal: true },
      _count: true,
    }),
    prisma.analytics.groupBy({
      by: ["type"],
      where: { tenantId, date: { gte: il30Jours } },
      _sum: { valeur: true },
    }),
    prisma.analytics.groupBy({
      by: ["type"],
      where: { tenantId, date: { gte: il60Jours, lt: il30Jours } },
      _sum: { valeur: true },
    }),
    prisma.produit.findMany({
      where: { tenantId, actif: true },
      orderBy: { ventes: "desc" },
      take: 8,
    }),
    prisma.commande.groupBy({
      by: ["statut"],
      where: { tenantId },
      _count: true,
    }),
    prisma.avis.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { produit: { select: { nom: true, images: true } } },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.commande.findMany({
      where: { tenantId, createdAt: { gte: il30Jours }, paiementStatut: "completed" },
      select: { createdAt: true, montantTotal: true },
    }),
  ]);

  // Graphique jour par jour
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

  const getVal = (arr: typeof analyticsParType, type: string) =>
    arr.find((a) => a.type === type)?._sum.valeur || 0;

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
      label: "Chiffre d'affaires",
      valeur: formatMontant(revenuActuel, tenant?.devise || "XOF"),
      delta: delta(revenuActuel, revenuPrecedent),
      couleur: "#10b981",
      bg: "#10b98115",
      icone: TrendingUp,
    },
    {
      label: "Commandes",
      valeur: commandesActuel.toString(),
      delta: delta(commandesActuel, commandesPrecedentCount),
      couleur: "#60a5fa",
      bg: "#60a5fa15",
      icone: ShoppingCart,
    },
    {
      label: "Visiteurs",
      valeur: Math.round(pageViews).toLocaleString("fr-FR"),
      delta: delta(pageViews, pageViewsPrev),
      couleur: "#F5A623",
      bg: "#F5A62315",
      icone: Eye,
    },
    {
      label: "Conversion",
      valeur: `${tauxConversion}%`,
      delta: null,
      couleur: "#a78bfa",
      bg: "#a78bfa15",
      icone: BarChart3,
    },
  ];

  const statutLabels: Record<string, { label: string; color: string; bg: string }> = {
    en_attente:    { label: "En attente",     color: "#f59e0b", bg: "#f59e0b15" },
    confirmee:     { label: "Confirmée",      color: "#60a5fa", bg: "#60a5fa15" },
    en_preparation:{ label: "En préparation", color: "#a78bfa", bg: "#a78bfa15" },
    en_livraison:  { label: "En livraison",   color: "#F5A623", bg: "#F5A62315" },
    livree:        { label: "Livrée",         color: "#10b981", bg: "#10b98115" },
    annulee:       { label: "Annulée",        color: "#f87171", bg: "#f8717115" },
  };

  const totalCommandes = statutDistribution.reduce((s, x) => s + x._count, 0);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-poppins">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Activité réelle de votre boutique</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-gray-700 text-sm font-medium">30 derniers jours</span>
          <span
            className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#F5A62320", color: "#F5A623" }}
          >
            comparaison J-30
          </span>
        </div>
      </div>

      {/* ── 4 KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icone;
          const d = k.delta;
          return (
            <div
              key={i}
              className="bg-white shadow-sm border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200"
            >
              {/* Icon + delta */}
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: k.bg }}
                >
                  <Icon size={18} style={{ color: k.couleur }} />
                </div>
                {d !== null && (
                  <div
                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                      d > 0
                        ? "text-emerald-600 bg-emerald-50"
                        : d < 0
                        ? "text-red-500 bg-red-50"
                        : "text-gray-400 bg-gray-50"
                    }`}
                  >
                    {d > 0 ? (
                      <ArrowUpRight size={12} />
                    ) : d < 0 ? (
                      <ArrowDownRight size={12} />
                    ) : (
                      <Minus size={12} />
                    )}
                    {Math.abs(d)}%
                  </div>
                )}
              </div>
              {/* Valeur */}
              <p className="text-2xl font-bold text-gray-900 font-poppins leading-tight">
                {k.valeur}
              </p>
              <p className="text-gray-400 text-xs mt-1">{k.label}</p>
              {d !== null && (
                <p className="text-gray-400 text-[10px] mt-2 border-t border-gray-50 pt-2">
                  vs. 30 jours précédents
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Graphique des ventes ── */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-gray-900 font-semibold text-base">Évolution du chiffre d'affaires</h2>
        </div>
        <p className="text-gray-400 text-xs mb-4">Revenus journaliers des 30 derniers jours (commandes complétées)</p>
        <SalesChart donnees={donnees30Jours} devise={tenant?.devise || "XOF"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Top produits ── */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F5A62315" }}>
              <TrendingUp size={15} style={{ color: "#F5A623" }} />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-sm">Top produits</h3>
              <p className="text-gray-400 text-xs">Classés par nombre de ventes</p>
            </div>
          </div>
          {topProduits.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                <ShoppingCart size={20} className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">Aucune vente pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topProduits.map((p, i) => {
                const maxVentes = topProduits[0].ventes || 1;
                const pct = Math.round((p.ventes / maxVentes) * 100);
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    {/* Rang */}
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={
                        i === 0
                          ? { backgroundColor: "#F5A62320", color: "#F5A623" }
                          : i === 1
                          ? { backgroundColor: "#9ca3af20", color: "#6b7280" }
                          : i === 2
                          ? { backgroundColor: "#cd7c2820", color: "#cd7c28" }
                          : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
                      }
                    >
                      {i + 1}
                    </div>
                    {/* Image */}
                    <div className="w-9 h-9 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                      {p.images[0] ? (
                        <img src={p.images[0]} alt={p.nom} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">
                          —
                        </div>
                      )}
                    </div>
                    {/* Nom + barre */}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 text-sm font-medium truncate">{p.nom}</p>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: "#F5A623" }}
                        />
                      </div>
                    </div>
                    {/* Ventes */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-gray-900 text-sm font-bold font-poppins">{p.ventes}</p>
                      <p className="text-gray-400 text-[10px]">ventes</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Distribution statuts ── */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#60a5fa15" }}>
              <BarChart3 size={15} style={{ color: "#60a5fa" }} />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-sm">Statuts des commandes</h3>
              <p className="text-gray-400 text-xs">{totalCommandes} commandes au total</p>
            </div>
          </div>
          {totalCommandes === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                <BarChart3 size={20} className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">Aucune commande pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {statutDistribution
                .sort((a, b) => b._count - a._count)
                .map((s) => {
                  const info = statutLabels[s.statut] || { label: s.statut, color: "#9ca3af", bg: "#9ca3af15" };
                  const pct = Math.round((s._count / totalCommandes) * 100);
                  return (
                    <div key={s.statut}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: info.bg, color: info.color }}
                          >
                            {info.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 text-sm font-bold font-poppins">{s._count}</span>
                          <span className="text-gray-400 text-xs">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: info.color }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ── Entonnoir de conversion ── */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-gray-900 font-semibold">Entonnoir de conversion</h3>
            <p className="text-gray-400 text-xs mt-0.5">30 derniers jours</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
            <span className="text-gray-500 text-sm">Taux global</span>
            <span className="font-bold text-gray-900 font-poppins text-lg">{tauxConversion}%</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Visites",        val: Math.round(pageViews),    color: "#F5A623" },
            { label: "Vues produits",  val: Math.round(productViews), color: "#a78bfa" },
            { label: "Ajouts panier",  val: Math.round(addToCart),    color: "#60a5fa" },
            { label: "Achats",         val: commandesActuel,          color: "#10b981" },
          ].map((step, i) => {
            const heightPct = pageViews > 0 ? Math.max(8, (step.val / Math.max(pageViews, 1)) * 100) : 8;
            const ratio = i > 0 && pageViews > 0
              ? ((step.val / pageViews) * 100).toFixed(1)
              : null;
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                {/* Barre visuelle */}
                <div
                  className="w-full rounded-xl flex items-end justify-center overflow-hidden"
                  style={{ height: "72px", backgroundColor: `${step.color}10`, border: `1px solid ${step.color}20` }}
                >
                  <div
                    className="w-full rounded-b-xl transition-all duration-700"
                    style={{ height: `${heightPct}%`, backgroundColor: `${step.color}50` }}
                  />
                </div>
                <p className="text-gray-900 font-bold font-poppins text-lg leading-tight">
                  {step.val.toLocaleString("fr-FR")}
                </p>
                <p className="text-gray-500 text-xs text-center">{step.label}</p>
                {ratio !== null && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${step.color}15`, color: step.color }}
                  >
                    {ratio}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Derniers avis ── */}
      {derniersAvis.length > 0 && (
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F5A62315" }}>
              <Star size={15} style={{ color: "#F5A623" }} />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-sm">Derniers avis clients</h3>
              <p className="text-gray-400 text-xs">Les 5 plus récents</p>
            </div>
          </div>
          <div className="space-y-3">
            {derniersAvis.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 overflow-hidden flex-shrink-0">
                  {a.produit.images[0] ? (
                    <img
                      src={a.produit.images[0]}
                      alt={a.produit.nom}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">
                      —
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-xs truncate mb-1">{a.produit.nom}</p>
                  <div className="flex items-center gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        className={
                          i < a.note
                            ? "text-[#F5A623] fill-[#F5A623]"
                            : "text-gray-200 fill-gray-200"
                        }
                      />
                    ))}
                  </div>
                  {a.commentaire && (
                    <p className="text-gray-500 text-xs line-clamp-2">{a.commentaire}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
