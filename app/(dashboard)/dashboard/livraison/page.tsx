import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { AssignerLivreur } from "@/components/dashboard/AssignerLivreur";

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  en_attente:     { label: "En attente",     color: "#6b7280" },
  confirmee:      { label: "Confirmée",       color: "#f59e0b" },
  en_preparation: { label: "En préparation", color: "#7c3aed" },
  expediee:       { label: "Expédiée",        color: "#3b82f6" },
  livree:         { label: "Livrée",          color: "#10b981" },
  annulee:        { label: "Annulée",         color: "#ef4444" },
};

export default async function LivraisonPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const tenantId = (session.user as any)?.tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) redirect("/inscription");

  const [commandes, livreurs] = await Promise.all([
    prisma.commande.findMany({
      where: { tenantId, statut: { notIn: ["annulee", "remboursee"] } },
      include: { client: true, livreur: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.livreur.findMany({
      where: { tenantId, actif: true },
      select: { id: true, nom: true, vehicule: true, zone: true },
    }),
  ]);

  const stats = {
    enPreparation: commandes.filter((c) => c.statut === "en_preparation").length,
    expediees:     commandes.filter((c) => c.statut === "expediee").length,
    livrees:       commandes.filter((c) => c.statut === "livree").length,
    enAttente:     commandes.filter((c) => ["en_attente", "confirmee"].includes(c.statut)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#111111] tracking-tight">Livraisons</h1>
          <p className="text-[12.5px] text-[#AAAAAA] mt-0.5">Suivi et assignation des expéditions</p>
        </div>
        <a
          href="/dashboard/livreurs"
          className="text-sm text-[#F5A623] hover:underline"
        >
          Gérer les livreurs ({livreurs.length}) ?
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "En attente", value: stats.enAttente,     color: "#6b7280", icon: Clock },
          { label: "En préparation", value: stats.enPreparation, color: "#7c3aed", icon: Package },
          { label: "Expédiées", value: stats.expediees,      color: "#3b82f6", icon: Truck },
          { label: "Livrées",   value: stats.livrees,        color: "#10b981", icon: CheckCircle },
        ].map((m, i) => {
          const Icone = m.icon;
          return (
            <div key={i} className="ax-card p-5">
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

      <div className="ax-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F3F3F3] flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[#111111]">Commandes actives</h2>
          <span className="text-[11px] text-[#AAAAAA]">{commandes.length} commandes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F3F3]">
                {["Commande", "Client", "Adresse", "Livreur", "Statut", "Date", "Action"].map((h) => (
                  <th key={h} className="text-left ax-label px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commandes.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-500 py-12">Aucune commande active</td></tr>
              ) : commandes.slice(0, 30).map((cmd) => {
                const st = STATUT_CONFIG[cmd.statut] || STATUT_CONFIG.en_attente;
                return (
                  <tr key={cmd.id} className="border-b border-[#F9F9F9] hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3 text-[#F5A623] font-mono text-[12px] font-bold">{cmd.numero}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-[#222]">{cmd.clientNom}</td>
                    <td className="px-4 py-3 text-[11.5px] text-[#AAAAAA] max-w-[160px] truncate">{cmd.adresseLivraison}, {cmd.ville}</td>
                    <td className="px-4 py-3">
                      <AssignerLivreur
                        commandeId={cmd.id}
                        livreurActuelId={cmd.livreurId}
                        livreurActuelNom={cmd.livreur?.nom}
                        livreurs={livreurs}
                        statut={cmd.statut}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ color: st.color, backgroundColor: `${st.color}15`, border: `1px solid ${st.color}30` }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-[#AAAAAA]">{formatDate(cmd.createdAt)}</td>
                    <td className="px-4 py-3">
                      {cmd.statut === "confirmee" && (
                        <form action={async () => {
                          "use server";
                          await prisma.commande.update({ where: { id: cmd.id }, data: { statut: "en_preparation" } });
                        }}>
                          <button type="submit" className="text-xs text-[#7c3aed] hover:opacity-80 border border-[#7c3aed]/30 px-3 py-1.5 rounded-lg">Préparer</button>
                        </form>
                      )}
                      {cmd.statut === "en_preparation" && (
                        <form action={async () => {
                          "use server";
                          await prisma.commande.update({ where: { id: cmd.id }, data: { statut: "expediee" } });
                        }}>
                          <button type="submit" className="text-xs text-[#3b82f6] hover:opacity-80 border border-[#3b82f6]/30 px-3 py-1.5 rounded-lg">Expédier</button>
                        </form>
                      )}
                      {cmd.statut === "expediee" && (
                        <form action={async () => {
                          "use server";
                          const { revalidatePath } = await import("next/cache");
                          // Libérer escrow si livré
                          const commande = await prisma.commande.update({
                            where: { id: cmd.id },
                            data: { statut: "livree" },
                            include: { escrow: true, commission: true },
                          });
                          if (commande.escrow) {
                            await prisma.escrow.update({
                              where: { commandeId: cmd.id },
                              data: { statut: "released", releasedAt: new Date() },
                            });
                          }
                          if (commande.commission) {
                            await prisma.commission.update({
                              where: { commandeId: cmd.id },
                              data: { statut: "captured", capturedAt: new Date() },
                            });
                          }
                          revalidatePath("/dashboard/livraison");
                        }}>
                          <button type="submit" className="text-xs text-[#10b981] hover:opacity-80 border border-[#10b981]/30 px-3 py-1.5 rounded-lg">Marquer livré</button>
                        </form>
                      )}
                    </td>
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

