import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatMontant, formatDate } from "@/lib/utils";
import { ExternalLink, Store } from "lucide-react";
import Link from "next/link";

export default async function AdminBoutiquesPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") redirect("/dashboard");

  const boutiques = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { produits: true, commandes: true, clients: true } },
      commissions: { where: { statut: "captured" }, select: { montantCommission: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-playfair">Boutiques</h1>
        <p className="text-gray-400 text-sm mt-1">{boutiques.length} boutiques enregistrées sur la plateforme</p>
      </div>

      <div className="bg-white border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Boutique", "Pays", "Plan", "Produits", "Commandes", "Clients", "Revenus Axso", "Statut", "Créée le"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-gray-500 text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {boutiques.map(b => {
                const revenu = b.commissions.reduce((s, c) => s + c.montantCommission, 0);
                return (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1B4FD8]/10 border border-[#1B4FD8]/20 flex items-center justify-center text-[#1B4FD8] text-xs font-bold flex-shrink-0">
                          {b.nomBoutique.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{b.nomBoutique}</p>
                          <a href={`/${b.slug}`} target="_blank" rel="noopener noreferrer"
                            className="text-[#1B4FD8]/60 text-[10px] hover:text-[#1B4FD8] flex items-center gap-1">
                            {b.slug} <ExternalLink size={9} />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-400">{b.pays}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#1B4FD8]/10 text-[#1B4FD8] border border-[#1B4FD8]/20">
                        {b.planType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white">{b._count.produits}</td>
                    <td className="px-5 py-4 text-white">{b._count.commandes}</td>
                    <td className="px-5 py-4 text-white">{b._count.clients}</td>
                    <td className="px-5 py-4 text-green-400 font-medium">{formatMontant(revenu, b.devise)}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${b.statut === "active" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                        {b.statut === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(b.createdAt)}</td>
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
