// Page commandes dashboard
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, CheckCircle, Truck, TrendingUp, ArrowRight, Package } from "lucide-react";
import { CommandesExport } from "@/components/dashboard/CommandesExport";
import { formatMontant, dateRelative } from "@/lib/utils";

const statutStyles: Record<string, string> = {
  en_attente:     "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]",
  confirmee:      "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]",
  en_preparation: "bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]",
  expediee:       "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]",
  livree:         "bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]",
  annulee:        "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
};

const statutLabels: Record<string, string> = {
  en_attente:     "En attente",
  confirmee:      "Confirmée",
  en_preparation: "En préparation",
  expediee:       "Expédiée",
  livree:         "Livrée",
  annulee:        "Annulée",
};

export default async function CommandesPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const tenantId = (session.user as any)?.tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  const commandes = await prisma.commande.findMany({
    where: { tenantId },
    include: { lignes: true, client: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = {
    enAttente: commandes.filter((c) => c.statut === "en_attente").length,
    confirmees: commandes.filter((c) => c.statut === "confirmee").length,
    livrees: commandes.filter((c) => c.statut === "livree").length,
    totalCeMois: commandes
      .filter(
        (c) => c.paiementStatut === "completed" && new Date(c.createdAt) >= debutMois
      )
      .reduce((s, c) => s + c.montantTotal, 0),
  };

  const statCards = [
    { label: "En attente",  valeur: stats.enAttente,                                     icon: Clock,       accent: "#D97706" },
    { label: "Confirmées",  valeur: stats.confirmees,                                    icon: CheckCircle, accent: "#2563EB" },
    { label: "Livrées",     valeur: stats.livrees,                                       icon: Truck,       accent: "#16A34A" },
    { label: "CA ce mois",  valeur: formatMontant(stats.totalCeMois, tenant?.devise || "XOF"), icon: TrendingUp, accent: "#F5A623", gold: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-[#111111] font-poppins">Commandes</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
              {commandes.length} total
            </span>
          </div>
          <p className="text-[#717171] text-sm">Gérez et suivez toutes les commandes de votre boutique</p>
        </div>
        <CommandesExport total={commandes.length} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icone = s.icon;
          return (
            <div key={i} className="bg-white border border-[#E8E8E8] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F4F4F4]">
                  <Icone size={16} style={{ color: s.accent }} />
                </div>
                {s.gold && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                    Ce mois
                  </span>
                )}
              </div>
              <p className="text-xl font-bold font-poppins text-[#111111] mb-0.5" style={s.gold ? { color: "#F5A623" } : {}}>
                {s.valeur}
              </p>
              <p className="text-[#717171] text-xs">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Table / Empty state */}
      {commandes.length === 0 ? (
        <div className="bg-white border border-[#E8E8E8] rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F4F4F4] border border-[#E8E8E8] flex items-center justify-center mx-auto mb-5">
            <Package size={28} className="text-[#717171]" />
          </div>
          <h3 className="text-[#111111] font-semibold text-base mb-2">Aucune commande encore</h3>
          <p className="text-[#717171] text-sm mb-6 max-w-xs mx-auto">
            Les commandes passées par vos clients apparaîtront ici en temps réel.
          </p>
          <Link
            href="/dashboard/boutique"
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-[#111111] text-white"
          >
            Voir ma boutique <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8E8E8] flex items-center justify-between">
            <p className="text-sm font-semibold text-[#111111]">
              {commandes.length} commande{commandes.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-[#717171]">Triées par date décroissante</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E8E8]">
                  {["#Commande", "Client", "Produits", "Montant", "Statut", "Date", ""].map((h) => (
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
                {commandes.map((c) => (
                  <tr key={c.id} className="border-b border-[#F3F3F3] hover:bg-[#FAFAFA] transition-colors group">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold text-[#F5A623]">
                        #{c.numero?.slice(-6) ?? c.id.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                          {c.clientNom?.slice(0, 2).toUpperCase() ?? "??"}
                        </div>
                        <div>
                          <p className="text-[#111111] text-sm font-medium leading-tight">{c.clientNom}</p>
                          {c.ville && (
                            <p className="text-[#717171] text-[11px] leading-tight">
                              {c.ville}{c.pays ? `, ${c.pays}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-[#717171] text-xs bg-[#F4F4F4] border border-[#E8E8E8] px-2 py-1 rounded-lg">
                        <Package size={11} />
                        {c.lignes.length} article{c.lignes.length > 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-sm font-poppins text-[#F5A623]">
                        {formatMontant(c.montantTotal, c.devise)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${statutStyles[c.statut] ?? "bg-[#F4F4F4] text-[#717171] border border-[#E8E8E8]"}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                        {statutLabels[c.statut] ?? c.statut}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[#717171] text-xs whitespace-nowrap">{dateRelative(c.createdAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/commandes/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-[#FFFBEB] text-[#D97706]"
                      >
                        Voir <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
