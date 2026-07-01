// Page commandes dashboard
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Clock, CheckCircle, Truck, TrendingUp, ArrowRight, Package, FileSpreadsheet } from "lucide-react";
import { CommandesExport } from "@/components/dashboard/CommandesExport";
import { formatMontant, dateRelative } from "@/lib/utils";

const statutColors: Record<string, string> = {
  en_attente: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  confirmee: "bg-blue-50 text-blue-700 border border-blue-200",
  en_preparation: "bg-purple-50 text-purple-700 border border-purple-200",
  expediee: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  livree: "bg-green-50 text-green-700 border border-green-200",
  annulee: "bg-red-50 text-red-700 border border-red-200",
};

const statutLabels: Record<string, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  en_preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

const statutDots: Record<string, string> = {
  en_attente: "#ca8a04",
  confirmee: "#2563eb",
  en_preparation: "#7c3aed",
  expediee: "#4338ca",
  livree: "#16a34a",
  annulee: "#dc2626",
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

  const stats = {
    enAttente: commandes.filter((c) => c.statut === "en_attente").length,
    confirmees: commandes.filter((c) => c.statut === "confirmee").length,
    livrees: commandes.filter((c) => c.statut === "livree").length,
    totalCeMois: commandes
      .filter(
        (c) =>
          c.paiementStatut === "completed" &&
          new Date(c.createdAt) >=
            new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      )
      .reduce((s, c) => s + c.montantTotal, 0),
  };

  const statCards = [
    {
      label: "En attente",
      valeur: stats.enAttente,
      icon: Clock,
      color: "#ca8a04",
      bg: "#fefce8",
      border: "#fef08a",
    },
    {
      label: "Confirmées",
      valeur: stats.confirmees,
      icon: CheckCircle,
      color: "#2563eb",
      bg: "#eff6ff",
      border: "#bfdbfe",
    },
    {
      label: "Livrées",
      valeur: stats.livrees,
      icon: Truck,
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#bbf7d0",
    },
    {
      label: "CA ce mois",
      valeur: formatMontant(stats.totalCeMois, tenant?.devise || "XOF"),
      icon: TrendingUp,
      color: "#F5A623",
      bg: "#fffbeb",
      border: "#fed7aa",
      highlight: true,
    },
  ];

  const filtreStatuts = [
    { key: "tous", label: "Toutes", count: commandes.length },
    { key: "en_attente", label: "En attente", count: stats.enAttente },
    { key: "confirmee", label: "Confirmées", count: stats.confirmees },
    { key: "livree", label: "Livrées", count: stats.livrees },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 font-poppins">Commandes</h1>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#fff7ed", color: "#F5A623", border: "1px solid #fed7aa" }}
            >
              {commandes.length} total
            </span>
          </div>
          <p className="text-gray-400 text-sm">Gérez et suivez toutes les commandes de votre boutique</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 font-medium hidden sm:block">
            <FileSpreadsheet size={12} className="inline mr-1" />Export Excel
          </span>
          <CommandesExport total={commandes.length} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icone = s.icon;
          return (
            <div
              key={i}
              className="bg-white shadow-sm border border-gray-100 rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: s.bg, border: `1px solid ${s.border}` }}
                >
                  <Icone size={18} style={{ color: s.color }} />
                </div>
                {s.highlight && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#fff7ed", color: "#F5A623" }}>
                    Ce mois
                  </span>
                )}
              </div>
              <p
                className="text-2xl font-bold font-poppins mb-0.5"
                style={{ color: s.highlight ? "#F5A623" : "#111827" }}
              >
                {s.valeur}
              </p>
              <p className="text-gray-400 text-xs">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filtres visuels */}
      <div className="flex items-center gap-2 flex-wrap">
        {filtreStatuts.map((f) => (
          <button
            key={f.key}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border"
            style={
              f.key === "tous"
                ? { backgroundColor: "#F5A623", color: "#000", borderColor: "#F5A623" }
                : { backgroundColor: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }
            }
          >
            {f.label}
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px]"
              style={
                f.key === "tous"
                  ? { backgroundColor: "rgba(0,0,0,0.15)", color: "#000" }
                  : { backgroundColor: "#f3f4f6", color: "#374151" }
              }
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tableau / Empty state */}
      {commandes.length === 0 ? (
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-5">
            <Package size={32} className="text-gray-300" />
          </div>
          <h3 className="text-gray-800 font-semibold text-base mb-2">Aucune commande encore</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Les commandes passées par vos clients apparaîtront ici en temps réel.
          </p>
          <Link
            href="/dashboard/boutique"
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200"
            style={{ backgroundColor: "#F5A623", color: "#000" }}
          >
            Voir ma boutique <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {commandes.length} commande{commandes.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-gray-400">Triées par date décroissante</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["#Commande", "Client", "Produits", "Montant", "Statut", "Date", ""].map((h) => (
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
                {commandes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-all duration-200 group">
                    {/* Numéro */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold" style={{ color: "#F5A623" }}>
                        #{c.numero?.slice(-6) ?? c.id.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    {/* Client */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                          style={{ backgroundColor: "#fff7ed", color: "#F5A623", border: "1px solid #fed7aa" }}
                        >
                          {c.clientNom?.slice(0, 2).toUpperCase() ?? "??"}
                        </div>
                        <div>
                          <p className="text-gray-800 text-sm font-medium leading-tight">{c.clientNom}</p>
                          {c.ville && (
                            <p className="text-gray-400 text-[11px] leading-tight">{c.ville}{c.pays ? `, ${c.pays}` : ""}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Produits */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-gray-500 text-xs bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                        <Package size={11} className="text-gray-400" />
                        {c.lignes.length} article{c.lignes.length > 1 ? "s" : ""}
                      </span>
                    </td>
                    {/* Montant */}
                    <td className="px-5 py-4">
                      <span className="font-bold text-sm font-poppins" style={{ color: "#F5A623" }}>
                        {formatMontant(c.montantTotal, c.devise)}
                      </span>
                    </td>
                    {/* Statut */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${statutColors[c.statut] ?? "bg-gray-50 text-gray-600 border border-gray-200"}`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: statutDots[c.statut] ?? "#9ca3af" }}
                        />
                        {statutLabels[c.statut] ?? c.statut}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="px-5 py-4">
                      <span className="text-gray-400 text-xs whitespace-nowrap">{dateRelative(c.createdAt)}</span>
                    </td>
                    {/* Action */}
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/commandes/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 px-3 py-1.5 rounded-lg"
                        style={{ color: "#F5A623", backgroundColor: "#fff7ed" }}
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
