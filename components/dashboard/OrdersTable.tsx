"use client";
import Link from "next/link";
import { formatMontant, dateRelative } from "@/lib/utils";
import type { CommandeAvecLignes } from "@/types";

interface OrdersTableProps {
  commandes: CommandeAvecLignes[];
}

const statutColors: Record<string, string> = {
  en_attente: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmee: "bg-blue-50 text-blue-700 border-blue-200",
  en_preparation: "bg-purple-50 text-purple-700 border-purple-200",
  expediee: "bg-indigo-50 text-indigo-700 border-indigo-200",
  livree: "bg-green-50 text-green-700 border-green-200",
  annulee: "bg-red-50 text-red-600 border-red-200",
};

const statutLabels: Record<string, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  en_preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

export function OrdersTable({ commandes }: OrdersTableProps) {
  if (!commandes?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
        <p className="text-gray-400">Aucune commande pour le moment</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h3 className="text-gray-900 font-semibold">Dernières commandes</h3>
        <Link href="/dashboard/commandes" className="text-[#F5A623] text-sm hover:underline font-medium">
          Voir tout →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              {["N°", "Client", "Montant", "Statut", "Date"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-gray-400 text-xs uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {commandes.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <Link href={`/dashboard/commandes/${c.id}`} className="text-[#F5A623] text-sm font-mono hover:underline">
                    {c.numero}
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  <div>
                    <p className="text-gray-800 text-sm font-medium">{c.clientNom}</p>
                    <p className="text-gray-400 text-xs">{c.clientEmail}</p>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-gray-800 font-semibold text-sm">
                    {formatMontant(c.montantTotal, c.devise)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-lg border ${statutColors[c.statut] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                    {statutLabels[c.statut] || c.statut}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">
                  {dateRelative(c.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
