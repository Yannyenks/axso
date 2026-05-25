// Dashboard  Gestion des clients
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate, formatMontant } from "@/lib/utils";
import { Users, TrendingUp, ShoppingBag, Star } from "lucide-react";

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
    if (nbCommandes >= 5 || totalAchats >= 100000) return { label: "VIP", color: "#F5A623" };
    if (nbCommandes >= 2) return { label: "Régulier", color: "#10b981" };
    return { label: "Nouveau", color: "#6b7280" };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-playfair">Clients</h1>
        <p className="text-gray-400 text-sm mt-1">{totalClients} clients enregistrés</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total clients", value: totalClients, icon: Users, color: "#F5A623" },
          { label: "Clients actifs", value: clientsActifs, icon: ShoppingBag, color: "#10b981" },
          { label: "Revenu total", value: formatMontant(totalRevenu, tenant.devise), icon: TrendingUp, color: "#7c3aed" },
          { label: "Panier moyen", value: formatMontant(panierMoyen, tenant.devise), icon: Star, color: "#f59e0b" },
        ].map((m, i) => {
          const Icone = m.icon;
          return (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${m.color}15`, border: `1px solid ${m.color}30` }}>
                  <Icone size={16} style={{ color: m.color }} />
                </div>
                <span className="text-gray-400 text-xs">{m.label}</span>
              </div>
              <p className="text-gray-900 text-xl font-bold">{m.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-gray-800 font-semibold">Liste des clients</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Client", "Email", "Téléphone", "Commandes", "Total achats", "Segment", "Inscrit le"].map((h) => (
                  <th key={h} className="text-left text-gray-400 font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-12">Aucun client encore</td>
                </tr>
              ) : clients.map((client) => {
                const totalAchats = client.commandes.reduce((s, c) => s + c.montantTotal, 0);
                const seg = getSegment(client.commandes.length, totalAchats);
                return (
                  <tr key={client.id} className="border-b border-[#111] hover:bg-[#151515] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F5A623]/20 flex items-center justify-center text-[#F5A623] text-xs font-bold">
                          {client.nom.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-gray-800 font-medium">{client.nom}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-400">{client.email || ""}</td>
                    <td className="px-5 py-4 text-gray-400">{client.telephone || ""}</td>
                    <td className="px-5 py-4 text-gray-700">{client.commandes.length}</td>
                    <td className="px-5 py-4 text-[#F5A623] font-medium">{formatMontant(totalAchats, tenant.devise)}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ color: seg.color, backgroundColor: `${seg.color}15`, border: `1px solid ${seg.color}30` }}>
                        {seg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">{formatDate(client.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

