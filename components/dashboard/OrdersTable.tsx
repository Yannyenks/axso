"use client";
import Link from "next/link";
import { formatMontant, dateRelative } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import type { CommandeAvecLignes } from "@/types";

interface OrdersTableProps { commandes: CommandeAvecLignes[] }

const STATUTS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  en_attente:     { label: "En attente",     bg: "#fefce8", text: "#a16207", dot: "#eab308" },
  confirmee:      { label: "Confirmée",       bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
  en_preparation: { label: "En préparation", bg: "#faf5ff", text: "#6d28d9", dot: "#8b5cf6" },
  expediee:       { label: "Expédiée",       bg: "#eef2ff", text: "#4338ca", dot: "#6366f1" },
  livree:         { label: "Livrée",         bg: "#f0fdf4", text: "#15803d", dot: "#22c55e" },
  annulee:        { label: "Annulée",        bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
};

function StatutBadge({ statut }: { statut: string }) {
  const s = STATUTS[statut] ?? { label: statut, bg: "#f9fafb", text: "#6b7280", dot: "#9ca3af" };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
      style={{ background: s.bg, color: s.text, borderColor: s.dot + "40" }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function Avatar({ nom }: { nom: string }) {
  const initiales = nom.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ background: "linear-gradient(135deg,#F5A623,#c97a10)" }}>
      {initiales}
    </div>
  );
}

export function OrdersTable({ commandes }: OrdersTableProps) {
  if (!commandes?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📦</span>
        </div>
        <p className="text-gray-700 font-semibold text-sm mb-1">Aucune commande encore</p>
        <p className="text-gray-400 text-xs">Partagez votre boutique pour recevoir vos premières commandes</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
      style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-gray-900 font-semibold text-sm">Commandes récentes</h3>
          <p className="text-gray-400 text-xs mt-0.5">{commandes.length} dernières commandes</p>
        </div>
        <Link href="/dashboard/commandes"
          className="flex items-center gap-1.5 text-[#F5A623] text-xs font-semibold hover:underline">
          Voir tout <ArrowUpRight size={12} />
        </Link>
      </div>

      {/* Table desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/60 border-b border-gray-100">
              {["Commande", "Client", "Articles", "Montant", "Statut", "Date"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {commandes.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/40 transition-colors group">
                <td className="px-5 py-4">
                  <Link href={`/dashboard/commandes/${c.id}`}
                    className="text-[#F5A623] text-sm font-mono font-semibold hover:underline">
                    #{c.numero}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar nom={c.clientNom || "?"} />
                    <div>
                      <p className="text-gray-800 text-sm font-medium leading-none">{c.clientNom}</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">{c.clientEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-gray-500 text-sm">{c.lignes?.length ?? 0} article{(c.lignes?.length ?? 0) > 1 ? "s" : ""}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-gray-900 font-bold text-sm">{formatMontant(c.montantTotal, c.devise)}</span>
                </td>
                <td className="px-5 py-4">
                  <StatutBadge statut={c.statut} />
                </td>
                <td className="px-5 py-4 text-gray-400 text-xs">{dateRelative(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-gray-50">
        {commandes.map(c => (
          <Link key={c.id} href={`/dashboard/commandes/${c.id}`}
            className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50/50 transition-colors">
            <Avatar nom={c.clientNom || "?"} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-[#F5A623] font-semibold">#{c.numero}</span>
                <StatutBadge statut={c.statut} />
              </div>
              <p className="text-sm font-medium text-gray-800 truncate">{c.clientNom}</p>
              <p className="text-xs text-gray-400">{dateRelative(c.createdAt)}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-gray-900">{formatMontant(c.montantTotal, c.devise)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
