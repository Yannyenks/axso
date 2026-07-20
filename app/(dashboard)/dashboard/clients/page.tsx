// Dashboard — Gestion des clients
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate, formatMontant } from "@/lib/utils";
import { Users, TrendingUp, ShoppingBag, Star, ArrowRight } from "lucide-react";

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

  const vipCount = clients.filter((c) => {
    const t = c.commandes.reduce((s, cmd) => s + cmd.montantTotal, 0);
    return c.commandes.length >= 5 || t >= 100000;
  }).length;

  function getSegment(nbCommandes: number, totalAchats: number) {
    if (nbCommandes >= 5 || totalAchats >= 100000)
      return { label: "VIP",      style: "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]",   dot: "#F5A623" };
    if (nbCommandes >= 2)
      return { label: "Régulier", style: "bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]",   dot: "#16A34A" };
    return   { label: "Nouveau",  style: "bg-[#F4F4F4] text-[#717171] border border-[#E8E8E8]",   dot: "#717171" };
  }

  const avatarPalette = [
    "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]",
    "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]",
    "bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]",
    "bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]",
    "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
  ];

  const statCards = [
    { label: "Total clients",  value: totalClients,                              icon: Users,       accent: "#F5A623" },
    { label: "Clients actifs", value: clientsActifs,                             icon: ShoppingBag, accent: "#16A34A",
      badge: totalClients > 0 ? `${Math.round((clientsActifs / totalClients) * 100)}%` : null },
    { label: "Revenu total",   value: formatMontant(totalRevenu, tenant.devise), icon: TrendingUp,  accent: "#7C3AED" },
    { label: "Panier moyen",   value: formatMontant(panierMoyen, tenant.devise), icon: Star,        accent: "#F5A623" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-[#111111] font-poppins">Clients</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F4F4F4] text-[#717171] border border-[#E8E8E8]">
              {totalClients} enregistrés
            </span>
            {vipCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                <Star size={10} fill="#F5A623" className="text-[#F5A623]" />
                {vipCount} VIP
              </span>
            )}
          </div>
          <p className="text-[#717171] text-sm">Suivez et analysez vos clients pour mieux les fidéliser</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-white border border-[#E8E8E8] rounded-xl px-4 py-2.5">
          <span className="text-[#717171]">Taux actifs</span>
          <span className="font-bold text-[#111111]">
            {totalClients > 0 ? Math.round((clientsActifs / totalClients) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((m, i) => {
          const Icone = m.icon;
          return (
            <div key={i} className="bg-white border border-[#E8E8E8] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F4F4F4]">
                  <Icone size={16} style={{ color: m.accent }} />
                </div>
                {m.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]">
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-[#111111] text-xl font-bold font-poppins mb-0.5">{m.value}</p>
              <p className="text-[#717171] text-xs">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E8E8] flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#111111]">Liste des clients</h2>
            <p className="text-[#717171] text-xs mt-0.5">Trié par dépenses décroissantes</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" />
              VIP
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              Régulier
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F4F4F4] text-[#717171] border border-[#E8E8E8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#717171]" />
              Nouveau
            </span>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F4F4F4] border border-[#E8E8E8] flex items-center justify-center mx-auto mb-5">
              <Users size={28} className="text-[#717171]" />
            </div>
            <h3 className="text-[#111111] font-semibold text-base mb-2">Aucun client encore</h3>
            <p className="text-[#717171] text-sm mb-6 max-w-xs mx-auto">
              Vos clients apparaîtront ici dès qu'ils passeront leur première commande.
            </p>
            <a
              href="/dashboard/boutique"
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-[#111111] text-white"
            >
              Voir ma boutique <ArrowRight size={14} />
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E8E8]">
                  {["Client", "Contact", "Commandes", "Dépenses totales", "Segment", "Dernière commande", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[#717171] text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...clients]
                  .sort((a, b) => {
                    const ta = a.commandes.reduce((s, c) => s + c.montantTotal, 0);
                    const tb = b.commandes.reduce((s, c) => s + c.montantTotal, 0);
                    return tb - ta;
                  })
                  .map((client, idx) => {
                    const totalAchats = client.commandes.reduce((s, c) => s + c.montantTotal, 0);
                    const seg = getSegment(client.commandes.length, totalAchats);
                    const avatarStyle = avatarPalette[idx % avatarPalette.length];
                    const derniereCommande = client.commandes[0]?.createdAt;
                    return (
                      <tr key={client.id} className="border-b border-[#F3F3F3] hover:bg-[#FAFAFA] transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarStyle}`}>
                              {client.nom.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[#111111] text-sm font-semibold leading-tight">{client.nom}</p>
                              {client.email && (
                                <p className="text-[#717171] text-[11px] leading-tight">{client.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[#717171] text-xs">{client.telephone || "—"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#111111] text-sm font-semibold">{client.commandes.length}</span>
                            <span className="text-[#717171] text-xs">commande{client.commandes.length > 1 ? "s" : ""}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold font-poppins" style={{ color: totalAchats > 0 ? "#F5A623" : "#717171" }}>
                            {formatMontant(totalAchats, tenant.devise)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${seg.style}`}>
                            {seg.label === "VIP" && <Star size={10} fill="currentColor" />}
                            {seg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {derniereCommande ? (
                            <span className="text-[#717171] text-xs">{formatDate(derniereCommande)}</span>
                          ) : (
                            <span className="text-[#717171] text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <button className="inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-[#F4F4F4] text-[#717171] border border-[#E8E8E8]">
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
