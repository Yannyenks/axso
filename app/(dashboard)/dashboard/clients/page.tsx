// Dashboard — Gestion des clients
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate, formatMontant } from "@/lib/utils";
import { Users, TrendingUp, ShoppingBag, Star, ArrowUpRight, ArrowRight } from "lucide-react";

export default async function ClientsPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const tenantId = (session.user as any)?.tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) redirect("/inscription");

  const clients = await prisma.client.findMany({
    where: { tenantId },
    include: {
      commandes: {
        where: { statut: { notIn: ["annulee", "remboursee"] }, paiementStatut: "completed" },
        select: { montantTotal: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalClients = clients.length;
  const clientsActifs = clients.filter((c) => c.commandes.length > 0).length;
  const totalRevenu = clients.reduce(
    (s, c) => s + c.commandes.reduce((sc, cmd) => sc + cmd.montantTotal, 0),
    0
  );
  const panierMoyen = clientsActifs > 0 ? totalRevenu / clientsActifs : 0;

  function getSegment(nbCommandes: number, totalAchats: number) {
    if (nbCommandes >= 5 || totalAchats >= 100000)
      return { label: "VIP", color: "#F5A623", bg: "#fff7ed", border: "#fed7aa" };
    if (nbCommandes >= 2)
      return { label: "Régulier", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
    return { label: "Nouveau", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" };
  }

  // Avatar background palette deterministic par index
  const avatarPalette = [
    { bg: "#fff7ed", color: "#F5A623", border: "#fed7aa" },
    { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
    { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
    { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
    { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  ];

  const statCards = [
    {
      label: "Total clients",
      value: totalClients,
      icon: Users,
      color: "#F5A623",
      bg: "#fff7ed",
      border: "#fed7aa",
      trend: null,
    },
    {
      label: "Clients actifs",
      value: clientsActifs,
      icon: ShoppingBag,
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      trend: totalClients > 0 ? Math.round((clientsActifs / totalClients) * 100) + "%" : "—",
    },
    {
      label: "Revenu total",
      value: formatMontant(totalRevenu, tenant.devise),
      icon: TrendingUp,
      color: "#7c3aed",
      bg: "#fdf4ff",
      border: "#e9d5ff",
      trend: null,
    },
    {
      label: "Panier moyen",
      value: formatMontant(panierMoyen, tenant.devise),
      icon: Star,
      color: "#f59e0b",
      bg: "#fffbeb",
      border: "#fde68a",
      trend: null,
    },
  ];

  const vipCount = clients.filter((c) => {
    const t = c.commandes.reduce((s, cmd) => s + cmd.montantTotal, 0);
    return c.commandes.length >= 5 || t >= 100000;
  }).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 font-poppins">Clients</h1>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#fff7ed", color: "#F5A623", border: "1px solid #fed7aa" }}
            >
              {totalClients} enregistrés
            </span>
            {vipCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "#fff7ed", color: "#F5A623", border: "1px solid #fed7aa" }}
              >
                <Star size={10} fill="#F5A623" />
                {vipCount} VIP
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">Suivez et analysez vos clients pour mieux les fidéliser</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
          <ArrowUpRight size={14} style={{ color: "#F5A623" }} />
          <span className="font-medium text-gray-700">Taux actifs :</span>
          <span className="font-bold" style={{ color: "#F5A623" }}>
            {totalClients > 0 ? Math.round((clientsActifs / totalClients) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((m, i) => {
          const Icone = m.icon;
          return (
            <div
              key={i}
              className="bg-white shadow-sm border border-gray-100 rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: m.bg, border: `1px solid ${m.border}` }}
                >
                  <Icone size={18} style={{ color: m.color }} />
                </div>
                {m.trend && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }}
                  >
                    {m.trend}
                  </span>
                )}
              </div>
              <p className="text-gray-900 text-xl font-bold font-poppins mb-0.5">{m.value}</p>
              <p className="text-gray-400 text-xs">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-gray-800 font-semibold text-sm">Liste des clients</h2>
            <p className="text-gray-400 text-xs mt-0.5">Trié par dépenses décroissantes</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "#fff7ed", color: "#F5A623", border: "1px solid #fed7aa" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#F5A623" }} />
              VIP
            </span>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Régulier
            </span>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              Nouveau
            </span>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-5">
              <Users size={32} className="text-gray-300" />
            </div>
            <h3 className="text-gray-800 font-semibold text-base mb-2">Aucun client encore</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
              Vos clients apparaîtront ici dès qu'ils passeront leur première commande.
            </p>
            <a
              href="/dashboard/boutique"
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200"
              style={{ backgroundColor: "#F5A623", color: "#000" }}
            >
              Voir ma boutique <ArrowRight size={14} />
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Client", "Contact", "Commandes", "Dépenses totales", "Segment", "Dernière commande", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-gray-400 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...clients]
                  .sort((a, b) => {
                    const ta = a.commandes.reduce((s, c) => s + c.montantTotal, 0);
                    const tb = b.commandes.reduce((s, c) => s + c.montantTotal, 0);
                    return tb - ta;
                  })
                  .map((client, idx) => {
                    const totalAchats = client.commandes.reduce((s, c) => s + c.montantTotal, 0);
                    const seg = getSegment(client.commandes.length, totalAchats);
                    const palette = avatarPalette[idx % avatarPalette.length];
                    const derniereCommande = client.commandes[0]?.createdAt;
                    return (
                      <tr key={client.id} className="hover:bg-gray-50 transition-all duration-200 group">
                        {/* Client */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: palette.bg, color: palette.color, border: `1.5px solid ${palette.border}` }}
                            >
                              {client.nom.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-gray-800 text-sm font-semibold leading-tight">{client.nom}</p>
                              {client.email && (
                                <p className="text-gray-400 text-[11px] leading-tight">{client.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Contact */}
                        <td className="px-5 py-4">
                          <p className="text-gray-500 text-xs">{client.telephone || "—"}</p>
                        </td>
                        {/* Commandes */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-800 text-sm font-semibold">{client.commandes.length}</span>
                            <span className="text-gray-400 text-xs">commande{client.commandes.length > 1 ? "s" : ""}</span>
                          </div>
                        </td>
                        {/* Dépenses */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <span
                              className="text-sm font-bold font-poppins"
                              style={{ color: totalAchats > 0 ? "#F5A623" : "#9ca3af" }}
                            >
                              {formatMontant(totalAchats, tenant.devise)}
                            </span>
                            {totalAchats > 0 && <ArrowUpRight size={12} style={{ color: "#F5A623" }} />}
                          </div>
                        </td>
                        {/* Segment */}
                        <td className="px-5 py-4">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                            style={{ color: seg.color, backgroundColor: seg.bg, border: `1px solid ${seg.border}` }}
                          >
                            {seg.label === "VIP" && <Star size={10} fill={seg.color} />}
                            {seg.label}
                          </span>
                        </td>
                        {/* Dernière commande */}
                        <td className="px-5 py-4">
                          {derniereCommande ? (
                            <span className="text-gray-400 text-xs">{formatDate(derniereCommande)}</span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        {/* Action */}
                        <td className="px-5 py-4">
                          <button
                            className="inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 px-3 py-1.5 rounded-lg"
                            style={{ color: "#F5A623", backgroundColor: "#fff7ed" }}
                          >
                            Voir <ArrowRight size={11} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
