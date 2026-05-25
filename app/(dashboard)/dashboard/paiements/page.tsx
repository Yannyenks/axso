// Dashboard  Paiements et transactions
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatMontant, formatDate } from "@/lib/utils";
import { CreditCard, TrendingUp, Clock, CheckCircle } from "lucide-react";

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "#f59e0b" },
  completed: { label: "Complété", color: "#10b981" },
  failed: { label: "Échoué", color: "#ef4444" },
  refunded: { label: "Remboursé", color: "#6b7280" },
};

export default async function PaiementsPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const tenantId = (session.user as any)?.tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) redirect("/inscription");

  const commandes = await prisma.commande.findMany({
    where: { tenantId },
    include: { client: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totalPercu = commandes
    .filter((c) => c.paiementStatut === "completed")
    .reduce((s, c) => s + c.montantTotal, 0);

  const enAttente = commandes
    .filter((c) => c.paiementStatut === "pending")
    .reduce((s, c) => s + c.montantTotal, 0);

  const commissions = await prisma.commission.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const totalCommissions = commissions.reduce((s, c) => s + c.montantCommission, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-playfair">Paiements</h1>
        <p className="text-gray-400 text-sm mt-1">Historique des transactions et commissions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total perçu", value: formatMontant(totalPercu, tenant.devise), icon: CheckCircle, color: "#10b981" },
          { label: "En attente", value: formatMontant(enAttente, tenant.devise), icon: Clock, color: "#f59e0b" },
          { label: "Commissions Axso", value: formatMontant(totalCommissions, tenant.devise), icon: TrendingUp, color: "#ef4444" },
          { label: "Transactions", value: commandes.length, icon: CreditCard, color: "#F5A623" },
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
          <h2 className="text-gray-800 font-semibold">Transactions récentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Référence", "Client", "Montant", "Méthode", "Statut", "Date"].map((h) => (
                  <th key={h} className="text-left text-gray-400 font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commandes.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-500 py-12">Aucune transaction</td></tr>
              ) : commandes.map((cmd) => {
                const st = STATUT_LABELS[cmd.paiementStatut] || { label: cmd.paiementStatut, color: "#6b7280" };
                return (
                  <tr key={cmd.id} className="border-b border-[#111] hover:bg-[#151515]">
                    <td className="px-5 py-4 text-[#F5A623] font-mono text-xs">{cmd.numero}</td>
                    <td className="px-5 py-4 text-gray-700">{cmd.client?.nom || cmd.clientNom}</td>
                    <td className="px-5 py-4 text-gray-800 font-semibold">{formatMontant(cmd.montantTotal, tenant.devise)}</td>
                    <td className="px-5 py-4 text-gray-400 capitalize">{cmd.methodePaiement || ""}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ color: st.color, backgroundColor: `${st.color}15`, border: `1px solid ${st.color}30` }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">{formatDate(cmd.createdAt)}</td>
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

