// Dashboard  Avis et évaluations
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Star } from "lucide-react";

export default async function AvisPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const tenantId = (session.user as any)?.tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) redirect("/inscription");

  const avis = await prisma.avis.findMany({
    where: { tenantId },
    include: {
      produit: { select: { nom: true } },
      client: { select: { nom: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const noteMoyenne = avis.length > 0 ? avis.reduce((s, a) => s + a.note, 0) / avis.length : 0;
  const nonApprouves = avis.filter((a) => !a.approuve).length;

  const repartition = [5, 4, 3, 2, 1].map((note) => ({
    note,
    count: avis.filter((a) => a.note === note).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-playfair">Avis clients</h1>
        <p className="text-gray-400 text-sm mt-1">{avis.length} avis · {nonApprouves} à modérer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
          <p className="text-5xl font-bold text-gray-900 font-playfair">{noteMoyenne.toFixed(1)}</p>
          <div className="flex items-center justify-center gap-1 my-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={18} fill={i <= Math.round(noteMoyenne) ? "#F5A623" : "transparent"} stroke="#F5A623" />
            ))}
          </div>
          <p className="text-gray-400 text-sm">{avis.length} avis</p>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="text-gray-800 font-semibold mb-4">Répartition</h3>
          <div className="space-y-2">
            {repartition.map(({ note, count }) => {
              const pct = avis.length > 0 ? (count / avis.length) * 100 : 0;
              return (
                <div key={note} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-4">{note}</span>
                  <Star size={12} fill="#F5A623" stroke="none" />
                  <div className="flex-1 bg-gray-50 rounded-full h-2">
                    <div className="h-2 rounded-full bg-[#F5A623]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-gray-400 text-sm w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {nonApprouves > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-yellow-400 text-sm">
          {nonApprouves} avis en attente de modération
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-gray-800 font-semibold">Tous les avis</h2>
        </div>
        {avis.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Aucun avis client pour l'instant</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {avis.map((a) => (
              <div key={a.id} className="p-5 hover:bg-[#151515] transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} size={12} fill={i <= a.note ? "#F5A623" : "transparent"} stroke="#F5A623" />
                        ))}
                      </div>
                      <span className="text-gray-800 font-semibold text-sm">{a.client.nom}</span>
                      {a.verifie && <span className="text-green-400 text-xs">? Achat vérifié</span>}
                    </div>
                    {a.titre && <p className="text-gray-700 text-sm font-medium">{a.titre}</p>}
                    {a.commentaire && <p className="text-gray-400 text-sm mt-1">{a.commentaire}</p>}
                    <p className="text-gray-500 text-xs mt-2">{a.produit?.nom} · {formatDate(a.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!a.approuve && (
                      <form action={async () => {
                        "use server";
                        await prisma.avis.update({ where: { id: a.id }, data: { approuve: true } });
                      }}>
                        <button type="submit" className="text-xs text-green-400 border border-green-400/30 px-3 py-1.5 rounded-lg hover:opacity-80">Approuver</button>
                      </form>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-lg ${a.approuve ? "text-green-400 bg-green-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>
                      {a.approuve ? "Approuvé" : "En attente"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

