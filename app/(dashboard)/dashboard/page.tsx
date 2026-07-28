import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { formatMontant } from "@/lib/utils";
import {
  TrendingUp, ShoppingBag, Users, Eye, Package, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Globe, Plus, MapPin, UserPlus,
  Star,
} from "lucide-react";

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  en_attente:     { label: "En attente",     color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" },
  confirmee:      { label: "Confirmée",      color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  en_preparation: { label: "En préparation", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  expediee:       { label: "Expédiée",       color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
  livree:         { label: "Livrée",         color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  annulee:        { label: "Annulée",        color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

async function getData(tenantId: string) {
  const now              = new Date();
  const startOfDay       = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek      = new Date(now.getTime() - 7 * 86400000);
  const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const last30           = new Date(now.getTime() - 30 * 86400000);

  const [
    today, month, prevMonth, pending, visitors, recentOrders,
    lowStock, chartData, tenant, totalClients,
    commandesMois, statutsDist, topVilles, newClients, newClientsPrev,
    weekRevenu,
  ] = await Promise.all([
    prisma.commande.aggregate({ where: { tenantId, paiementStatut: "completed", createdAt: { gte: startOfDay } }, _sum: { montantTotal: true }, _count: true }),
    prisma.commande.aggregate({ where: { tenantId, paiementStatut: "completed", createdAt: { gte: startOfMonth } }, _sum: { montantTotal: true }, _count: true }),
    prisma.commande.aggregate({ where: { tenantId, paiementStatut: "completed", createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth } }, _sum: { montantTotal: true }, _count: true }),
    prisma.commande.count({ where: { tenantId, statut: "en_attente" } }),
    prisma.analytics.aggregate({ where: { tenantId, type: "page_view", date: { gte: startOfMonth } }, _sum: { valeur: true } }),
    prisma.commande.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 8, include: { lignes: true, client: true } }),
    prisma.produit.findMany({ where: { tenantId, actif: true, stock: { lte: 5, gt: 0 } }, take: 5, orderBy: { stock: "asc" } }),
    prisma.analytics.findMany({ where: { tenantId, type: "purchase", date: { gte: last30 } }, orderBy: { date: "asc" } }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.client.count({ where: { tenantId } }),
    // Nouvelles requêtes
    prisma.commande.findMany({
      where: { tenantId, paiementStatut: "completed", createdAt: { gte: startOfMonth } },
      select: { lignes: { select: { nom: true, prix: true, quantite: true, produitId: true } } },
    }),
    prisma.commande.groupBy({
      by: ["statut"],
      where: { tenantId, createdAt: { gte: startOfMonth } },
      _count: { id: true },
    }),
    prisma.commande.groupBy({
      by: ["ville"],
      where: { tenantId, createdAt: { gte: startOfMonth } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.client.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
    prisma.client.count({ where: { tenantId, createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth } } }),
    prisma.commande.aggregate({ where: { tenantId, paiementStatut: "completed", createdAt: { gte: startOfWeek } }, _sum: { montantTotal: true } }),
  ]);

  // Top produits calculé depuis les lignes
  const prodMap: Record<string, { nom: string; revenue: number; qte: number }> = {};
  (commandesMois as any[]).forEach(cmd => {
    cmd.lignes.forEach((l: any) => {
      if (!prodMap[l.produitId]) prodMap[l.produitId] = { nom: l.nom, revenue: 0, qte: 0 };
      prodMap[l.produitId].revenue += l.prix * l.quantite;
      prodMap[l.produitId].qte += l.quantite;
    });
  });
  const topProduits = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const chart = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(last30.getTime() + i * 86400000);
    const label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    const rows = chartData.filter(a => new Date(a.date).toDateString() === d.toDateString());
    return { date: label, montant: rows.reduce((s, a) => s + a.valeur, 0) * 10000, commandes: rows.length };
  });

  const prevCA = prevMonth._sum.montantTotal || 0;
  const currCA = month._sum.montantTotal || 0;
  const evol   = prevCA > 0 ? Math.round(((currCA - prevCA) / prevCA) * 100) : null;
  const evolClients = newClientsPrev > 0 ? Math.round(((newClients - newClientsPrev) / newClientsPrev) * 100) : null;

  // Spark 7j (CA)
  const spark7 = chart.slice(-7).map(c => c.montant);

  return {
    today: today._sum.montantTotal || 0,
    todayCount: today._count,
    month: currCA,
    monthCount: month._count,
    evol,
    pending,
    visitors: visitors._sum.valeur || 0,
    totalClients,
    newClients,
    evolClients,
    recentOrders,
    lowStock,
    chart,
    spark7,
    topProduits,
    statutsDist: statutsDist as { statut: string; _count: { id: number } }[],
    topVilles:   topVilles   as { ville: string;  _count: { id: number } }[],
    devise: tenant?.devise || "XOF",
    slug: tenant?.slug || "",
    semaine: weekRevenu._sum.montantTotal || 0,
  };
}

/* ── Sparkline SVG ─────────────────────────────────────────────────────── */
function Spark({ data, color = "#F5A623" }: { data: number[]; color?: string }) {
  if (!data.length || data.every(v => v === 0)) return null;
  const max = Math.max(...data, 1);
  const W = 64, H = 28;
  const pts = data
    .map((v, i) => `${(i / Math.max(data.length - 1, 1)) * W},${H - (v / max) * H}`)
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />
      {/* Last dot */}
      {data.length > 1 && (() => {
        const last = data[data.length - 1];
        const x = W, y = H - (last / max) * H;
        return <circle cx={x} cy={y} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/connexion");
  const tenantId = (session.user as any)?.tenantId;
  if (!tenantId) redirect("/inscription");

  const d = await getData(tenantId);
  const prenom     = session.user?.name?.split(" ")[0] ?? "Marchand";
  const conversion = d.visitors > 0 ? ((d.monthCount / d.visitors) * 100).toFixed(1) : "0";
  const panier     = d.monthCount > 0 ? d.month / d.monthCount : 0;

  const totalCmdsMonth = d.statutsDist.reduce((s, x) => s + x._count.id, 0);
  const maxVille       = d.topVilles[0]?._count.id ?? 1;
  const maxProd        = d.topProduits[0]?.revenue ?? 1;

  return (
    <div className="space-y-5">

      {/* ── Greeting + CTA ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-[20px] font-bold text-[#111111] tracking-tight">
            {new Date().getHours() < 12 ? "Bonjour" : new Date().getHours() < 18 ? "Bonne journée" : "Bonsoir"}, {prenom} 👋
          </h1>
          <p className="text-[12.5px] text-[#AAAAAA] mt-0.5 capitalize">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {d.slug && (
            <a href={`/${d.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[12px] font-medium border border-[#E8E8E8] rounded-2xl px-3.5 py-2 bg-white text-[#666666] hover:text-[#111111] hover:border-[#CCCCCC] hover:shadow-sm transition-all">
              <Globe size={13} /> Boutique <ArrowUpRight size={11} />
            </a>
          )}
          <a href="/dashboard/produits/nouveau"
            className="flex items-center gap-1.5 text-[12px] font-semibold bg-[#111111] text-white rounded-2xl px-4 py-2 hover:bg-[#2a2a2a] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm">
            <Plus size={13} /> Nouveau produit
          </a>
        </div>
      </div>

      {/* ── KPI Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="CA ce mois"
          value={formatMontant(d.month, d.devise)}
          sub={d.evol !== null ? `${d.evol > 0 ? "+" : ""}${d.evol}% vs mois dernier` : `${d.monthCount} commandes`}
          trend={d.evol}
          Icon={TrendingUp}
          accent
          spark={d.spark7}
        />
        <KpiCard
          label="Cette semaine"
          value={formatMontant(d.semaine, d.devise)}
          sub={`${d.todayCount} commande${d.todayCount !== 1 ? "s" : ""} aujourd'hui`}
          Icon={ShoppingBag}
          spark={d.spark7.slice(-3)}
          sparkColor="#7C3AED"
        />
        <KpiCard
          label="Clients total"
          value={d.totalClients.toLocaleString("fr-FR")}
          sub={d.evolClients !== null
            ? `+${d.newClients} nouveaux (${d.evolClients > 0 ? "+" : ""}${d.evolClients}%)`
            : `+${d.newClients} nouveaux ce mois`}
          trend={d.evolClients}
          Icon={Users}
          spark={[d.totalClients - d.newClients * 3, d.totalClients - d.newClients * 2, d.totalClients - d.newClients, d.totalClients]}
          sparkColor="#0891B2"
        />
        <KpiCard
          label="Taux de conversion"
          value={`${conversion}%`}
          sub={`Panier moy. ${formatMontant(panier, d.devise)}`}
          Icon={Eye}
          spark={d.spark7.map((_, i) => parseFloat(conversion) * (0.7 + i * 0.05))}
          sparkColor="#16A34A"
        />
      </div>

      {/* ── Chart + Sidebar ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SalesChart donnees={d.chart} devise={d.devise} />
        </div>

        <div className="flex flex-col gap-4">
          {d.pending > 0 && (
            <div className="ax-card p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A]/60 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={16} className="text-[#D97706]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-[#111111]">{d.pending} commande{d.pending > 1 ? "s" : ""} en attente</p>
                  <p className="text-[11.5px] text-[#AAAAAA]">À traiter en priorité</p>
                </div>
              </div>
              <a href="/dashboard/commandes?statut=en_attente"
                className="flex-shrink-0 text-[11.5px] font-semibold text-[#111111] border border-[#E8E8E8] rounded-2xl px-3.5 py-2 hover:bg-[#F5F5F5] hover:border-[#CCC] transition-all">
                Traiter →
              </a>
            </div>
          )}

          {d.lowStock.length > 0 && (
            <div className="ax-card p-4">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-7 h-7 rounded-xl bg-[#FEF2F2] border border-[#FECACA]/60 flex items-center justify-center">
                  <AlertTriangle size={13} className="text-[#DC2626]" />
                </div>
                <p className="text-[13px] font-semibold text-[#111111]">Stock critique</p>
                <span className="ml-auto text-[10.5px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] px-2.5 py-0.5 rounded-full">
                  {d.lowStock.length} produit{d.lowStock.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2.5">
                {d.lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-1">
                    <span className="text-[12.5px] text-[#444444] truncate font-medium">{p.nom}</span>
                    <span className={`text-[11px] font-bold flex-shrink-0 px-2.5 py-0.5 rounded-full border ${
                      p.stock <= 2 ? "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]" : "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                    }`}>
                      {p.stock} restant{p.stock > 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
              <a href="/dashboard/produits?stock=critique"
                className="flex items-center gap-1 text-[12px] text-[#666666] font-medium mt-4 hover:text-[#111111] transition-colors group">
                Gérer les stocks <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          )}

          <div className="ax-card p-4">
            <p className="ax-label mb-3.5">Accès rapides</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/dashboard/produits/nouveau", label: "Nouveau produit", Icon: Package,     color: "#7C3AED", bg: "#F5F3FF" },
                { href: "/dashboard/commandes",        label: "Commandes",       Icon: ShoppingBag, color: "#D97706", bg: "#FFFBEB" },
                { href: "/dashboard/clients",          label: "Clients",         Icon: Users,        color: "#0891B2", bg: "#ECFEFF" },
                { href: "/dashboard/analytics",        label: "Analytics",       Icon: TrendingUp,   color: "#16A34A", bg: "#ECFDF5" },
              ].map(({ href, label, Icon, color, bg }) => (
                <a key={href} href={href}
                  className="flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border border-[#EBEBEB] bg-white hover:border-[#CCC] hover:-translate-y-0.5 hover:shadow-md transition-all group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: bg, border: `1px solid ${color}20` }}>
                    <Icon size={16} style={{ color }} strokeWidth={1.8} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#666666] group-hover:text-[#111111] transition-colors text-center leading-tight">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Performance: Top Produits + Statuts + Villes ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top Produits */}
        <div className="lg:col-span-2 ax-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[14px] font-bold text-[#111111] tracking-tight">Top produits</h3>
              <p className="text-[11.5px] text-[#AAAAAA] mt-0.5">Par chiffre d'affaires ce mois</p>
            </div>
            <a href="/dashboard/produits"
              className="text-[11.5px] font-semibold text-[#666] hover:text-[#111] transition-colors flex items-center gap-1">
              Tous <ArrowUpRight size={11} />
            </a>
          </div>

          {d.topProduits.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
                <Star size={20} className="text-[#CCCCCC]" />
              </div>
              <p className="text-[13px] text-[#AAAAAA]">Aucune vente ce mois</p>
            </div>
          ) : (
            <div className="space-y-4">
              {d.topProduits.map((p, i) => {
                const pct = Math.round((p.revenue / maxProd) * 100);
                const rankColors = ["#F5A623", "#7C3AED", "#3B82F6", "#16A34A", "#6B7280"];
                return (
                  <div key={p.nom} className="group">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-[11px] font-bold w-5 text-center flex-shrink-0"
                        style={{ color: rankColors[i] ?? "#AAAAAA" }}>
                        {i + 1}
                      </span>
                      <span className="text-[13px] font-medium text-[#222] truncate flex-1">{p.nom}</span>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[11px] text-[#AAAAAA]">{p.qte} vente{p.qte > 1 ? "s" : ""}</span>
                        <span className="text-[13px] font-bold text-[#111111] tabular-nums"
                          style={{ fontVariantNumeric: "tabular-nums" }}>
                          {formatMontant(p.revenue, d.devise)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-8">
                      <div className="flex-1 h-1.5 bg-[#F5F5F7] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: i === 0 ? "linear-gradient(90deg,#F5A623,#FFD280)" : rankColors[i] ?? "#AAAAAA" }} />
                      </div>
                      <span className="text-[10.5px] text-[#CCCCCC] w-8 text-right tabular-nums">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Statuts + Villes */}
        <div className="flex flex-col gap-4">

          {/* Répartition statuts */}
          <div className="ax-card p-5 flex-1">
            <div className="mb-4">
              <h3 className="text-[14px] font-bold text-[#111111] tracking-tight">Statuts commandes</h3>
              <p className="text-[11.5px] text-[#AAAAAA] mt-0.5">Ce mois · {totalCmdsMonth} total</p>
            </div>

            {totalCmdsMonth === 0 ? (
              <div className="py-6 text-center text-[12px] text-[#AAAAAA]">Aucune commande ce mois</div>
            ) : (
              <>
                {/* Stacked bar */}
                <div className="flex h-2 rounded-full overflow-hidden mb-4 gap-0.5">
                  {Object.entries(STATUT_CFG).map(([key, cfg]) => {
                    const entry = d.statutsDist.find(s => s.statut === key);
                    const n = entry?._count.id ?? 0;
                    if (!n) return null;
                    const w = (n / totalCmdsMonth) * 100;
                    return <div key={key} className="h-full rounded-full flex-shrink-0" style={{ width: `${w}%`, background: cfg.color }} />;
                  })}
                </div>

                <div className="space-y-2">
                  {Object.entries(STATUT_CFG).map(([key, cfg]) => {
                    const entry = d.statutsDist.find(s => s.statut === key);
                    const n = entry?._count.id ?? 0;
                    if (!n) return null;
                    const pct = Math.round((n / totalCmdsMonth) * 100);
                    return (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                          <span className="text-[12px] text-[#555] truncate">{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] text-[#AAAAAA]">{pct}%</span>
                          <span className="text-[12px] font-bold text-[#111111] w-6 text-right tabular-nums">{n}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Top villes */}
          {d.topVilles.length > 0 && (
            <div className="ax-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={13} className="text-[#AAAAAA]" />
                <h3 className="text-[13px] font-semibold text-[#111111]">Top villes</h3>
                <span className="ml-auto text-[10.5px] text-[#AAAAAA]">ce mois</span>
              </div>
              <div className="space-y-3">
                {d.topVilles.map((v, i) => {
                  const n   = v._count.id;
                  const pct = Math.round((n / maxVille) * 100);
                  return (
                    <div key={v.ville}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12.5px] font-medium text-[#333] truncate">{v.ville || "Inconnue"}</span>
                        <span className="text-[12px] font-bold text-[#111111] tabular-nums">{n}</span>
                      </div>
                      <div className="h-1 bg-[#F5F5F7] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${pct}%`,
                          background: i === 0 ? "#F5A623" : "#E8E8E8",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Funnel de conversion ──────────────────────────────────────── */}
      {d.visitors > 0 && (
        <div className="ax-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[14px] font-bold text-[#111111] tracking-tight">Entonnoir de conversion</h3>
              <p className="text-[11.5px] text-[#AAAAAA] mt-0.5">Visiteurs → Commandes → Livrées ce mois</p>
            </div>
          </div>
          <div className="flex items-stretch gap-0">
            {(() => {
              const livrees = d.statutsDist.find(s => s.statut === "livree")?._count.id ?? 0;
              const steps = [
                { label: "Visiteurs",  value: Math.round(d.visitors), color: "#7C3AED", bg: "#F5F3FF" },
                { label: "Commandes",  value: d.monthCount,            color: "#F5A623", bg: "#FFF8EC" },
                { label: "Livrées",    value: livrees,                  color: "#16A34A", bg: "#F0FDF4" },
              ];
              const max = steps[0].value || 1;
              return steps.map((step, i) => {
                const pct = max > 0 ? Math.round((step.value / max) * 100) : 0;
                const convPrev = i > 0 && steps[i - 1].value > 0
                  ? ((step.value / steps[i - 1].value) * 100).toFixed(1)
                  : null;
                return (
                  <div key={step.label} className="flex-1 flex flex-col items-center gap-3 relative">
                    {/* Connector arrow */}
                    {i > 0 && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10
                        text-[11px] font-bold text-[#AAAAAA] bg-white border border-[#EBEBEB]
                        rounded-full px-2 py-0.5">
                        {convPrev}%
                      </div>
                    )}
                    {/* Bar */}
                    <div className="w-full flex flex-col items-center px-3 gap-2">
                      <div className="w-full bg-[#F5F5F7] rounded-xl overflow-hidden h-3">
                        <div className="h-full rounded-xl transition-all duration-700"
                          style={{ width: `${pct}%`, background: step.color }} />
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-[#AAAAAA]">{step.label}</span>
                        <span className="text-[14px] font-bold text-[#111111] tabular-nums"
                          style={{ fontVariantNumeric: "tabular-nums" }}>
                          {step.value.toLocaleString("fr-FR")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ── Recent orders ─────────────────────────────────────────────── */}
      <OrdersTable commandes={d.recentOrders as any} />
    </div>
  );
}

/* ── KPI Card ─────────────────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, trend, Icon, accent, spark, sparkColor = "#F5A623",
}: {
  label: string;
  value: string;
  sub: string;
  trend?: number | null;
  Icon: any;
  accent?: boolean;
  spark?: number[];
  sparkColor?: string;
}) {
  const up = trend !== null && trend !== undefined && trend > 0;
  const dn = trend !== null && trend !== undefined && trend < 0;
  return (
    <div className={`ax-card p-5 relative overflow-hidden group cursor-default ${accent ? "border-[#F5A623]/20" : ""}`}>
      {accent && (
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[20px]"
          style={{ background: "linear-gradient(90deg, #F5A623, #FFD280, #F5A623)" }} />
      )}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="ax-label">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 ${
          accent ? "bg-[#FFF8EC] border border-[#F5A623]/20" : "bg-[#F5F5F7] border border-[#EBEBEB]"
        }`}>
          <Icon size={14} className={accent ? "text-[#F5A623]" : "text-[#888]"} strokeWidth={1.8} />
        </div>
      </div>
      <p className="text-[24px] font-bold text-[#111111] leading-none tabular-nums tracking-tight">{value}</p>
      <div className="flex items-end justify-between mt-2">
        <div className="flex items-center gap-1.5">
          {up && (
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-[#16A34A] bg-[#ECFDF5] border border-[#BBF7D0] px-2 py-0.5 rounded-full">
              <ArrowUpRight size={10} /> {sub}
            </span>
          )}
          {dn && (
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-2 py-0.5 rounded-full">
              <ArrowDownRight size={10} /> {sub}
            </span>
          )}
          {!up && !dn && <span className="text-[11.5px] text-[#AAAAAA]">{sub}</span>}
        </div>
        {spark && spark.length > 1 && (
          <div className="flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
            <Spark data={spark} color={sparkColor} />
          </div>
        )}
      </div>
    </div>
  );
}
