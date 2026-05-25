// Page commandes dashboard
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { formatMontant, dateRelative } from "@/lib/utils";

const statutColors: Record<string, string> = {
  en_attente: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmee: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  en_preparation: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  expediee: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  livree: "bg-green-500/20 text-green-400 border-green-500/30",
  annulee: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statutLabels: Record<string, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  en_preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
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
      .filter((c) => c.paiementStatut === "completed" && new Date(c.createdAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      .reduce((s, c) => s + c.montantTotal, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-playfair">Commandes</h1>
          <p className="text-gray-400 text-sm mt-1">{commandes.length} commandes au total</p>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "En attente", valeur: stats.enAttente, couleur: "yellow" },
          { label: "Confirmées", valeur: stats.confirmees, couleur: "blue" },
          { label: "Livrées", valeur: stats.livrees, couleur: "green" },
          { label: "CA ce mois", valeur: formatMontant(stats.totalCeMois, tenant?.devise || "XOF"), couleur: "gold" },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold font-playfair text-gray-900">{s.valeur}</p>
            <p className="text-gray-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tableau */}
      {commandes.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
          <ShoppingCart size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-gray-800 font-semibold mb-2">Aucune commande encore</h3>
          <p className="text-gray-400 text-sm">Les commandes de vos clients apparaîtront ici</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Numéro", "Client", "Produits", "Montant", "Statut", "Date"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commandes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/commandes/${c.id}`} className="text-[#F5A623] text-sm font-mono hover:underline">
                        {c.numero}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-gray-700 text-sm">{c.clientNom}</p>
                        <p className="text-gray-500 text-xs">{c.ville}, {c.pays}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-gray-400 text-sm">{c.lignes.length} article(s)</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-gray-800 font-semibold text-sm">
                        {formatMontant(c.montantTotal, c.devise)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border ${statutColors[c.statut] || "bg-gray-500/20 text-gray-400"}`}>
                        {statutLabels[c.statut] || c.statut}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {dateRelative(c.createdAt)}
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

