// Dashboard  Revenus et analytics financières
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatMontant } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";

export default async function RevenusPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const tenantId = (session.user as any)?.tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) redirect("/inscription");

  const debut30j = new Date();
  debut30j.setDate(debut30j.getDate() - 30);
  const debut7j = new Date();
  debut7j.setDate(debut7j.getDate() - 7);

  const [commandes30j, commandes7j, commissions] = await Promise.all([
    prisma.commande.findMany({
      where: { tenantId, createdAt: { gte: debut30j }, paiementStatut: "completed" },
      select: { montantTotal: true, createdAt: true },
    }),
    prisma.commande.findMany({
      where: { tenantId, createdAt: { gte: debut7j }, paiementStatut: "completed" },
      select: { montantTotal: true },
    }),
    prisma.commission.findMany({
      where: { tenantId },
      select: { montantCommission: true, createdAt: true },
    }),
  ]);

  const revenu30j = commandes30j.reduce((s, c) => s + c.montantTotal, 0);
  const revenu7j = commandes7j.reduce((s, c) => s + c.montantTotal, 0);
  const totalCommissions = commissions.reduce((s, c) => s + c.montantCommission, 0);
  const revenuNet = revenu30j - totalCommissions;

  // Regrouper par jour
  const parJour: Record<string, number> = {};
  commandes30j.forEach((c) => {
    const jour = c.createdAt.toISOString().slice(0, 10);
    parJour[jour] = (parJour[jour] || 0) + c.montantTotal;
  });
  const jours = Object.entries(parJour).slice(-14);
  const maxRevenu = Math.max(...jours.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-playfair">Revenus</h1>
          <p className="text-gray-400 text-sm mt-1">Analyse financière de votre boutique</p>
        </div>
        <Link href="/dashboard/revenus/commissions" className="text-sm text-[#F5A623] hover:opacity-80 transition-opacity">
          Voir les commissions ?
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenu 30 jours", value: formatMontant(revenu30j, tenant.devise), icon: DollarSign, color: "#F5A623" },
          { label: "Revenu 7 jours", value: formatMontant(revenu7j, tenant.devise), icon: TrendingUp, color: "#10b981" },
          { label: "Commissions Axso", value: formatMontant(totalCommissions, tenant.devise), icon: TrendingDown, color: "#ef4444" },
          { label: "Revenu net", value: formatMontant(Math.max(0, revenuNet), tenant.devise), icon: BarChart3, color: "#7c3aed" },
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

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="text-gray-800 font-semibold mb-6">Revenus  14 derniers jours</h2>
        {jours.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-500">Pas encore de données</div>
        ) : (
          <div className="flex items-end gap-2 h-48">
            {jours.map(([date, revenu]) => {
              const hauteur = Math.max((revenu / maxRevenu) * 100, 3);
              const jour = new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg" style={{ height: `${hauteur}%`, backgroundColor: "#F5A623", minHeight: "4px" }} title={formatMontant(revenu, tenant.devise)} />
                  <span className="text-gray-500 text-xs">{jour}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="text-gray-800 font-semibold mb-4">Répartition des revenus</h2>
        <div className="space-y-3">
          {[
            { label: "Revenu brut 30j", montant: revenu30j, color: "#F5A623", sign: "+" },
            { label: "Commission Axso (3%)", montant: totalCommissions, color: "#ef4444", sign: "-" },
            { label: "Revenu net", montant: Math.max(0, revenuNet), color: "#10b981", sign: "=" },
          ].map((ligne) => (
            <div key={ligne.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ligne.color }} />
                <span className="text-gray-400 text-sm">{ligne.label}</span>
              </div>
              <span className="font-semibold text-sm" style={{ color: ligne.color }}>
                {ligne.sign} {formatMontant(ligne.montant, tenant.devise)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

