import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { formatMontant } from "@/lib/utils";
import {
  TrendingUp, ShoppingBag, Users, Eye, Package, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Globe, Plus,
} from "lucide-react";

async function getData(tenantId: string) {
  const now = new Date();
  const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const last30 = new Date(now.getTime() - 30 * 86400000);

  const [
    today, month, prevMonth, pending, visitors, recentOrders,
    lowStock, chartData, tenant, totalClients,
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
  ]);

  const chart = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(last30.getTime() + i * 86400000);
    const label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    const rows = chartData.filter(a => new Date(a.date).toDateString() === d.toDateString());
    return { date: label, montant: rows.reduce((s, a) => s + a.valeur, 0) * 10000, commandes: rows.length };
  });

  const prevCA = prevMonth._sum.montantTotal || 0;
  const currCA = month._sum.montantTotal || 0;
  const evol = prevCA > 0 ? Math.round(((currCA - prevCA) / prevCA) * 100) : null;

  return {
    today: today._sum.montantTotal || 0,
    todayCount: today._count,
    month: currCA,
    monthCount: month._count,
    evol,
    pending,
    visitors: visitors._sum.valeur || 0,
    totalClients,
    recentOrders,
    lowStock,
    chart,
    devise: tenant?.devise || "XOF",
    slug: tenant?.slug || "",
    nom: tenant?.nomBoutique || "",
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/connexion");
  const tenantId = (session.user as any)?.tenantId;
  if (!tenantId) redirect("/inscription");

  const d = await getData(tenantId);
  const prenom = session.user?.name?.split(" ")[0] ?? "Marchand";
  const conversion = d.visitors > 0 ? ((d.monthCount / d.visitors) * 100).toFixed(1) : "0";
  const panier = d.monthCount > 0 ? d.month / d.monthCount : 0;

  return (
    <div className="space-y-5">

      {/* ── Top bar: greeting + CTA ────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[17px] font-bold text-[#111111]">
            {new Date().getHours() < 12 ? "Bonjour" : new Date().getHours() < 18 ? "Bonne journée" : "Bonsoir"}, {prenom}
          </h1>
          <p className="text-[12px] text-[#AAAAAA] mt-0.5">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {d.slug && (
            <a href={`/${d.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[12px] font-medium border border-[#E8E8E8] rounded-xl px-3 py-2 bg-white text-[#666666] hover:text-[#111111] hover:border-[#CCCCCC] transition-all">
              <Globe size={13} /> Boutique
              <ArrowUpRight size={11} />
            </a>
          )}
          <a href="/dashboard/produits/nouveau"
            className="flex items-center gap-1.5 text-[12px] font-semibold bg-[#111111] text-white rounded-xl px-3 py-2 hover:bg-[#333333] transition-all">
            <Plus size={13} /> Nouveau produit
          </a>
        </div>
      </div>

      {/* ── KPI Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="CA ce mois"
          value={formatMontant(d.month, d.devise)}
          sub={d.evol !== null ? `${d.evol > 0 ? "+" : ""}${d.evol}% vs mois dernier` : `${d.monthCount} commandes`}
          trend={d.evol}
          Icon={TrendingUp}
        />
        <KpiCard
          label="Aujourd'hui"
          value={formatMontant(d.today, d.devise)}
          sub={`${d.todayCount} commande${d.todayCount !== 1 ? "s" : ""}`}
          Icon={ShoppingBag}
        />
        <KpiCard
          label="Clients"
          value={d.totalClients.toLocaleString("fr-FR")}
          sub={`${Math.round(d.visitors).toLocaleString("fr-FR")} visiteurs ce mois`}
          Icon={Users}
        />
        <KpiCard
          label="Conversion"
          value={`${conversion}%`}
          sub={`Panier moy. ${formatMontant(panier, d.devise)}`}
          Icon={Eye}
        />
      </div>

      {/* ── Chart + Sidebar ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SalesChart donnees={d.chart} devise={d.devise} />
        </div>

        <div className="flex flex-col gap-4">

          {/* Pending orders */}
          {d.pending > 0 && (
            <div className="ax-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center">
                  <ShoppingBag size={15} className="text-[#D97706]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#111111]">{d.pending} en attente</p>
                  <p className="text-[11px] text-[#AAAAAA]">Commandes à traiter</p>
                </div>
              </div>
              <a href="/dashboard/commandes?statut=en_attente"
                className="text-[11px] font-semibold text-[#111111] border border-[#E8E8E8] rounded-xl px-3 py-1.5 hover:bg-[#F5F5F5] transition-all">
                Voir
              </a>
            </div>
          )}

          {/* Low stock */}
          {d.lowStock.length > 0 && (
            <div className="ax-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-[#DC2626]" />
                <p className="text-[12px] font-semibold text-[#111111]">Stock critique</p>
                <span className="ml-auto text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] px-2 py-0.5 rounded-full">
                  {d.lowStock.length}
                </span>
              </div>
              <div className="space-y-2">
                {d.lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-[#444444] truncate">{p.nom}</span>
                    <span className={`text-[11px] font-bold flex-shrink-0 px-2 py-0.5 rounded-full border ${
                      p.stock <= 2 ? "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]" : "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                    }`}>
                      {p.stock} restant{p.stock > 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
              <a href="/dashboard/produits?stock=critique"
                className="flex items-center gap-1 text-[11px] text-[#666666] font-medium mt-3 hover:text-[#111111] transition-colors">
                Gérer les stocks <ArrowUpRight size={10} />
              </a>
            </div>
          )}

          {/* Quick actions */}
          <div className="ax-card p-4">
            <p className="ax-label mb-3">Accès rapides</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/dashboard/produits/nouveau", label: "Nouveau produit",   Icon: Package },
                { href: "/dashboard/commandes",        label: "Commandes",          Icon: ShoppingBag },
                { href: "/dashboard/clients",          label: "Clients",            Icon: Users },
                { href: "/dashboard/analytics",        label: "Analytics",          Icon: TrendingUp },
              ].map(({ href, label, Icon }) => (
                <a key={href} href={href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#F9F9F9] border border-[#EBEBEB] hover:border-[#CCCCCC] hover:bg-[#F5F5F5] transition-all group">
                  <Icon size={16} className="text-[#666666] group-hover:text-[#111111] transition-colors" strokeWidth={1.8} />
                  <span className="text-[10.5px] font-medium text-[#666666] group-hover:text-[#111111] transition-colors text-center leading-tight">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent orders ─────────────────────────────────────────── */}
      <OrdersTable commandes={d.recentOrders as any} />
    </div>
  );
}

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, trend, Icon,
}: {
  label: string;
  value: string;
  sub: string;
  trend?: number | null;
  Icon: any;
}) {
  const up = trend !== null && trend !== undefined && trend > 0;
  const dn = trend !== null && trend !== undefined && trend < 0;
  return (
    <div className="ax-card p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="ax-label">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
          <Icon size={13} className="text-[#888888]" strokeWidth={1.8} />
        </div>
      </div>
      <p className="text-[22px] font-bold text-[#111111] leading-none font-variant-numeric tabular-nums">{value}</p>
      <div className="flex items-center gap-1 mt-1.5">
        {up && <ArrowUpRight size={11} className="text-[#16A34A]" />}
        {dn && <ArrowDownRight size={11} className="text-[#DC2626]" />}
        <span className={`text-[11px] ${up ? "text-[#16A34A]" : dn ? "text-[#DC2626]" : "text-[#AAAAAA]"}`}>{sub}</span>
      </div>
    </div>
  );
}
