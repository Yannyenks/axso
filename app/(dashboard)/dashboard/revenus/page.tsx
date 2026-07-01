// Dashboard Revenus et analytics financières
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatMontant } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, ArrowRight, Wallet } from "lucide-react";

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

  // Regrouper par jour (14 derniers jours)
  const parJour: Record<string, number> = {};
  commandes30j.forEach((c) => {
    const jour = c.createdAt.toISOString().slice(0, 10);
    parJour[jour] = (parJour[jour] || 0) + c.montantTotal;
  });
  const jours = Object.entries(parJour).slice(-14);
  const maxRevenu = Math.max(...jours.map(([, v]) => v), 1);

  const metriques = [
    {
      label: "Revenu 30 jours",
      value: formatMontant(revenu30j, tenant.devise),
      icon: DollarSign,
      color: "#F5A623",
      bg: "#F5A62312",
      description: "Commandes complétées",
    },
    {
      label: "Revenu 7 jours",
      value: formatMontant(revenu7j, tenant.devise),
      icon: TrendingUp,
      color: "#10b981",
      bg: "#10b98112",
      description: "Cette semaine",
    },
    {
      label: "Commissions Axso",
      value: formatMontant(totalCommissions, tenant.devise),
      icon: TrendingDown,
      color: "#ef4444",
      bg: "#ef444412",
      description: "Frais de plateforme",
    },
    {
      label: "Revenu net",
      value: formatMontant(Math.max(0, revenuNet), tenant.devise),
      icon: Wallet,
      color: "#7c3aed",
      bg: "#7c3aed12",
      description: "Après commissions",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-poppins">Revenus</h1>
          <p className="text-gray-500 text-sm mt-1">Analyse financière de votre boutique</p>
        </div>
      </div>

      {/* ── Hero card : revenu net ── */}
      <div
        className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 hover:shadow-md transition-all duration-200"
        style={{ background: "linear-gradient(135deg, #fff 60%, #F5A62308 100%)" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#F5A62315" }}
          >
            <DollarSign size={22} style={{ color: "#F5A623" }} />
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">
              Chiffre d'affaires · 30 jours
            </p>
          </div>
        </div>
        <p className="text-5xl font-bold text-gray-900 font-poppins mt-4 mb-1">
          {formatMontant(revenu30j, tenant.devise)}
        </p>
        <p className="text-gray-400 text-sm">
          Revenu net après commissions :{" "}
          <span className="font-semibold" style={{ color: "#10b981" }}>
            {formatMontant(Math.max(0, revenuNet), tenant.devise)}
          </span>
        </p>
      </div>

      {/* ── 4 metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metriques.map((m, i) => {
          const Icone = m.icon;
          return (
            <div
              key={i}
              className="bg-white shadow-sm border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: m.bg, border: `1px solid ${m.color}25` }}
                >
                  <Icone size={16} style={{ color: m.color }} />
                </div>
              </div>
              <p className="text-gray-900 text-xl font-bold font-poppins">{m.value}</p>
              <p className="text-gray-500 text-xs mt-1">{m.label}</p>
              <p className="text-gray-400 text-[10px] mt-0.5">{m.description}</p>
            </div>
          );
        })}
      </div>

      {/* ── Graphique barres 14j ── */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-gray-900 font-semibold">Revenus journaliers</h2>
            <p className="text-gray-400 text-xs mt-0.5">14 derniers jours</p>
          </div>
          {jours.length > 0 && (
            <div className="text-right">
              <p className="text-gray-900 font-bold font-poppins text-lg">
                {formatMontant(jours.reduce((s, [, v]) => s + v, 0), tenant.devise)}
              </p>
              <p className="text-gray-400 text-xs">sur la période</p>
            </div>
          )}
        </div>
        {jours.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
              <BarChart3 size={20} className="text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">Pas encore de données</p>
          </div>
        ) : (
          <div className="flex items-end gap-2 h-48">
            {jours.map(([date, revenu]) => {
              const hauteur = Math.max((revenu / maxRevenu) * 100, 3);
              const jour = new Date(date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              });
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-2 group">
                  <div
                    className="relative w-full rounded-t-lg transition-all duration-300 group-hover:opacity-80 cursor-default"
                    style={{
                      height: `${hauteur}%`,
                      backgroundColor: "#F5A623",
                      minHeight: "4px",
                    }}
                    title={formatMontant(revenu, tenant.devise)}
                  >
                    {/* Tooltip au hover */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {formatMontant(revenu, tenant.devise)}
                    </div>
                  </div>
                  <span className="text-gray-400 text-[10px] text-center leading-tight">{jour}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Répartition des revenus ── */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200">
        <h2 className="text-gray-900 font-semibold mb-5">Répartition des revenus</h2>
        <div className="space-y-1">
          {[
            {
              label: "Revenu brut (30j)",
              montant: revenu30j,
              color: "#F5A623",
              sign: "+",
              description: "Total des commandes complétées",
            },
            {
              label: "Commission Axso (3%)",
              montant: totalCommissions,
              color: "#ef4444",
              sign: "−",
              description: "Frais de plateforme prélevés",
            },
            {
              label: "Revenu net",
              montant: Math.max(0, revenuNet),
              color: "#10b981",
              sign: "=",
              description: "Ce que vous empochez",
            },
          ].map((ligne, i) => (
            <div
              key={ligne.label}
              className={`flex items-center justify-between p-4 rounded-xl ${
                i === 2 ? "border border-gray-100 bg-gray-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: `${ligne.color}15`, color: ligne.color }}
                >
                  {ligne.sign}
                </div>
                <div>
                  <p className="text-gray-700 text-sm font-medium">{ligne.label}</p>
                  <p className="text-gray-400 text-xs">{ligne.description}</p>
                </div>
              </div>
              <span className="font-bold text-base font-poppins" style={{ color: ligne.color }}>
                {formatMontant(ligne.montant, tenant.devise)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Navigation sous-modules ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard/revenus/commissions">
          <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#7c3aed12" }}
                >
                  <BarChart3 size={20} style={{ color: "#7c3aed" }} />
                </div>
                <div>
                  <p className="text-gray-900 font-semibold group-hover:text-[#F5A623] transition-colors">
                    Commissions
                  </p>
                  <p className="text-gray-400 text-sm mt-0.5">
                    Détail des frais Axso prélevés
                  </p>
                </div>
              </div>
              <ArrowRight size={18} className="text-gray-300 group-hover:text-[#F5A623] group-hover:translate-x-1 transition-all duration-200" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-gray-400 text-xs">Total prélevé</span>
              <span className="font-bold text-sm font-poppins" style={{ color: "#7c3aed" }}>
                {formatMontant(totalCommissions, tenant.devise)}
              </span>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/analytics">
          <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#F5A62312" }}
                >
                  <TrendingUp size={20} style={{ color: "#F5A623" }} />
                </div>
                <div>
                  <p className="text-gray-900 font-semibold group-hover:text-[#F5A623] transition-colors">
                    Analytics complètes
                  </p>
                  <p className="text-gray-400 text-sm mt-0.5">
                    Visites, conversions, entonnoir
                  </p>
                </div>
              </div>
              <ArrowRight size={18} className="text-gray-300 group-hover:text-[#F5A623] group-hover:translate-x-1 transition-all duration-200" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-gray-400 text-xs">Période analysée</span>
              <span className="font-bold text-sm font-poppins text-gray-700">30 jours</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
