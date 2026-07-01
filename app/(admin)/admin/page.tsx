import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Store, DollarSign, ShoppingCart, Users, TrendingUp, Truck, ArrowUpRight, CheckCircle, Clock } from "lucide-react";
import { formatMontant } from "@/lib/utils";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") redirect("/dashboard");

  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const debutSemaine = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const [
    totalBoutiques,
    boutiquesActives,
    totalCommandes,
    commandesMois,
    commissionsTotal,
    commissionsMois,
    totalClients,
    totalLivreurs,
    dernieresBoutiques,
    dernieresCommandes,
    commissionsPending,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { statut: "active" } }),
    prisma.commande.count({ where: { paiementStatut: "completed" } }),
    prisma.commande.count({ where: { paiementStatut: "completed", createdAt: { gte: debutMois } } }),
    prisma.commission.aggregate({ _sum: { montantCommission: true }, where: { statut: "captured" } }),
    prisma.commission.aggregate({ _sum: { montantCommission: true }, where: { statut: "captured", createdAt: { gte: debutMois } } }),
    prisma.client.count(),
    prisma.livreur.count({ where: { actif: true } }),
    prisma.tenant.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { _count: { select: { commandes: true, produits: true } } } }),
    prisma.commande.findMany({
      where: { paiementStatut: "completed" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { tenant: { select: { nomBoutique: true, slug: true } } },
    }),
    prisma.commission.aggregate({ _sum: { montantCommission: true }, where: { statut: "pending" } }),
  ]);

  const revenuTotal = commissionsTotal._sum.montantCommission || 0;
  const revenuMois = commissionsMois._sum.montantCommission || 0;
  const revenuPending = commissionsPending._sum.montantCommission || 0;

  const kpis = [
    { label: "Boutiques actives", value: boutiquesActives, total: totalBoutiques, icon: Store, color: "#1B4FD8", href: "/admin/boutiques" },
    { label: "Revenus capturés", value: formatMontant(revenuTotal, "XOF"), sub: `+${formatMontant(revenuMois, "XOF")} ce mois`, icon: DollarSign, color: "#34d399", href: "/admin/finances" },
    { label: "Commandes payées", value: totalCommandes, sub: `${commandesMois} ce mois`, icon: ShoppingCart, color: "#60a5fa", href: null },
    { label: "Clients totaux", value: totalClients.toLocaleString("fr-FR"), icon: Users, color: "#a78bfa", href: null },
    { label: "En attente paiement", value: formatMontant(revenuPending, "XOF"), sub: "À débloquer", icon: Clock, color: "#f59e0b", href: "/admin/finances" },
    { label: "Livreurs actifs", value: totalLivreurs, icon: Truck, color: "#f472b6", href: "/admin/livreurs" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-playfair">Axso HQ</h1>
        <p className="text-gray-400 text-sm mt-1">Vue globale de la plateforme — {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          const content = (
            <div key={i} className="bg-white border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${k.color}15`, border: `1px solid ${k.color}25` }}>
                  <Icon size={18} style={{ color: k.color }} />
                </div>
                {k.href && <ArrowUpRight size={14} className="text-gray-600" />}
              </div>
              <p className="text-2xl font-bold text-white">{k.value}</p>
              <p className="text-gray-500 text-xs mt-1">{k.label}</p>
              {k.sub && <p className="text-xs mt-1" style={{ color: k.color }}>{k.sub}</p>}
              {k.total && <p className="text-gray-600 text-xs mt-0.5">sur {k.total} total</p>}
            </div>
          );
          return k.href ? <Link key={i} href={k.href}>{content}</Link> : <div key={i}>{content}</div>;
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Dernières boutiques */}
        <div className="bg-white border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-white font-semibold">Dernières boutiques</h2>
            <Link href="/admin/boutiques" className="text-[#1B4FD8] text-xs hover:underline">Voir toutes →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {dernieresBoutiques.map(b => (
              <div key={b.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 rounded-xl bg-[#1B4FD8]/10 border border-[#1B4FD8]/20 flex items-center justify-center text-sm font-bold text-[#1B4FD8]">
                  {b.nomBoutique.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{b.nomBoutique}</p>
                  <p className="text-gray-500 text-xs">{b.pays} · {b._count.produits} produits · {b._count.commandes} commandes</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.statut === "active" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {b.statut === "active" ? "Active" : "Inactive"}
                  </span>
                  <span className="text-gray-600 text-[10px]">{b.planType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dernières transactions */}
        <div className="bg-white border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-white font-semibold">Dernières transactions</h2>
          </div>
          <div className="divide-y divide-white/5">
            {dernieresCommandes.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-3">
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-mono truncate">{c.numero}</p>
                  <p className="text-gray-500 text-[10px]">{c.tenant.nomBoutique} · {c.clientNom}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#1B4FD8] text-sm font-bold">{formatMontant(c.montantTotal, c.devise)}</p>
                  <p className="text-green-400 text-[10px]">+{formatMontant(c.montantTotal * 0.03, c.devise)} comm.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
