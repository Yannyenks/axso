import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatMontant, formatDate } from "@/lib/utils";
import { DollarSign, Lock, Unlock, TrendingUp, AlertCircle } from "lucide-react";

export default async function AdminFinancesPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") redirect("/dashboard");

  const [commissionsCapturees, commissionsPending, escrowsHeld, escrowsReleased, topBoutiques] = await Promise.all([
    prisma.commission.aggregate({ _sum: { montantCommission: true }, where: { statut: "captured" } }),
    prisma.commission.aggregate({ _sum: { montantCommission: true }, where: { statut: "pending" } }),
    prisma.escrow.aggregate({ _sum: { montant: true }, where: { statut: "held" } }),
    prisma.escrow.aggregate({ _sum: { montant: true }, where: { statut: "released" } }),
    prisma.commission.groupBy({
      by: ["tenantId"],
      _sum: { montantCommission: true, montantMarchand: true },
      where: { statut: "captured" },
      orderBy: { _sum: { montantCommission: "desc" } },
      take: 10,
    }),
  ]);

  const tenantIds = topBoutiques.map(t => t.tenantId);
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    select: { id: true, nomBoutique: true, slug: true, devise: true },
  });
  const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t]));

  const dernieresCommissions = await prisma.commission.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { tenant: { select: { nomBoutique: true } }, commande: { select: { numero: true, clientNom: true } } },
  });

  const revenuCapture = commissionsCapturees._sum.montantCommission || 0;
  const revenuPending = commissionsPending._sum.montantCommission || 0;
  const escrowHeld = escrowsHeld._sum.montant || 0;
  const escrowReleased = escrowsReleased._sum.montant || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white font-playfair">Finances Axso</h1>
        <p className="text-gray-400 text-sm mt-1">Revenus de commission (3%) et flux escrow</p>
      </div>

      {/* KPIs financiers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenus capturés", value: formatMontant(revenuCapture, "XOF"), icon: TrendingUp, color: "#34d399", desc: "Commissions libérées" },
          { label: "En attente", value: formatMontant(revenuPending, "XOF"), icon: AlertCircle, color: "#f59e0b", desc: "Après livraison" },
          { label: "Escrow bloqué", value: formatMontant(escrowHeld, "XOF"), icon: Lock, color: "#60a5fa", desc: "Fonds en séquestre" },
          { label: "Escrow libéré", value: formatMontant(escrowReleased, "XOF"), icon: Unlock, color: "#a78bfa", desc: "Versé aux marchands" },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-white border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${k.color}15`, border: `1px solid ${k.color}25` }}>
                  <Icon size={16} style={{ color: k.color }} />
                </div>
                <span className="text-gray-500 text-xs">{k.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{k.value}</p>
              <p className="text-gray-600 text-xs mt-1">{k.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Top boutiques par commission */}
      <div className="bg-white border border-white/5 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <DollarSign size={15} className="text-[#F5A623]" />
          Top boutiques par revenus générés
        </h2>
        <div className="space-y-3">
          {topBoutiques.map((t, i) => {
            const tenant = tenantMap[t.tenantId];
            const comm = t._sum.montantCommission || 0;
            const marchand = t._sum.montantMarchand || 0;
            const maxComm = topBoutiques[0]._sum.montantCommission || 1;
            return (
              <div key={t.tenantId} className="flex items-center gap-4">
                <span className="text-gray-600 text-sm w-5 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-white text-sm">{tenant?.nomBoutique || t.tenantId}</span>
                    <span className="text-green-400 text-sm font-bold">{formatMontant(comm, tenant?.devise || "XOF")}</span>
                  </div>
                  <div className="w-full bg-[#1a1a2e] rounded-full h-1.5">
                    <div className="h-full bg-gradient-to-r from-[#F5A623] to-[#FFD280] rounded-full" style={{ width: `${(comm / maxComm) * 100}%` }} />
                  </div>
                  <p className="text-gray-500 text-[10px] mt-0.5">Versé au marchand : {formatMontant(marchand, tenant?.devise || "XOF")}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historique commissions */}
      <div className="bg-white border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold">Historique des commissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Commande", "Boutique", "Client", "Montant commande", "Commission (3%)", "Marchand", "Statut", "Date"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-gray-500 text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dernieresCommissions.map(c => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-[#F5A623] font-mono text-xs">{c.commande.numero}</td>
                  <td className="px-5 py-3 text-white text-xs">{c.tenant.nomBoutique}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{c.commande.clientNom}</td>
                  <td className="px-5 py-3 text-white">{formatMontant(c.montantCommande, c.devise)}</td>
                  <td className="px-5 py-3 text-green-400 font-medium">+{formatMontant(c.montantCommission, c.devise)}</td>
                  <td className="px-5 py-3 text-gray-400">{formatMontant(c.montantMarchand, c.devise)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.statut === "captured" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                      {c.statut === "captured" ? "Capturée" : "En attente"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
