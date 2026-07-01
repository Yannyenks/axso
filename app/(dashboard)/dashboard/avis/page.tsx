// Dashboard Avis et évaluations
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Star, MessageSquare, CheckCircle2, Clock, ShieldCheck } from "lucide-react";

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

  // Initiales à partir du nom
  const getInitiales = (nom: string) => {
    const parts = nom.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nom.slice(0, 2).toUpperCase();
  };

  // Couleur d'avatar déterministe selon le nom
  const avatarColors = [
    { bg: "#F5A62320", text: "#F5A623" },
    { bg: "#60a5fa20", text: "#3b82f6" },
    { bg: "#10b98120", text: "#059669" },
    { bg: "#a78bfa20", text: "#7c3aed" },
    { bg: "#f4727220", text: "#ef4444" },
    { bg: "#34d39920", text: "#10b981" },
  ];
  const getAvatarColor = (nom: string) => {
    const idx = nom.charCodeAt(0) % avatarColors.length;
    return avatarColors[idx];
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-poppins">Avis clients</h1>
          <p className="text-gray-500 text-sm mt-1">
            {avis.length} avis au total · {nonApprouves} en attente de modération
          </p>
        </div>
        {nonApprouves > 0 && (
          <div
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl"
            style={{ backgroundColor: "#f59e0b15", color: "#f59e0b", border: "1px solid #f59e0b30" }}
          >
            <Clock size={14} />
            {nonApprouves} à modérer
          </div>
        )}
      </div>

      {/* ── Hero : note moyenne + répartition ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Note moyenne */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-gray-200 transition-all duration-200">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-3">
            Note moyenne
          </p>
          <p className="text-6xl font-bold text-gray-900 font-poppins leading-none">
            {noteMoyenne > 0 ? noteMoyenne.toFixed(1) : "—"}
          </p>
          <div className="flex items-center gap-1 my-4">
            {[1, 2, 3, 4, 5].map((i) => {
              const filled = i <= Math.round(noteMoyenne);
              const half = !filled && i - 0.5 <= noteMoyenne;
              return (
                <Star
                  key={i}
                  size={22}
                  fill={filled ? "#F5A623" : "transparent"}
                  stroke="#F5A623"
                  className={half ? "opacity-60" : ""}
                />
              );
            })}
          </div>
          <p className="text-gray-400 text-sm">
            Basé sur{" "}
            <span className="font-semibold text-gray-700">{avis.length}</span>{" "}
            avis
          </p>
          {avis.length > 0 && (
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" />
                {avis.filter((a) => a.approuve).length} approuvés
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-amber-400" />
                {nonApprouves} en attente
              </div>
            </div>
          )}
        </div>

        {/* Répartition étoiles */}
        <div className="lg:col-span-2 bg-white shadow-sm border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200">
          <h3 className="text-gray-900 font-semibold mb-5">Répartition des notes</h3>
          {avis.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
              Aucune donnée disponible
            </div>
          ) : (
            <div className="space-y-3">
              {repartition.map(({ note, count }) => {
                const pct = avis.length > 0 ? (count / avis.length) * 100 : 0;
                return (
                  <div key={note} className="flex items-center gap-3">
                    {/* Label étoile */}
                    <div className="flex items-center gap-1 w-14 flex-shrink-0">
                      <span className="text-gray-700 text-sm font-semibold font-poppins">{note}</span>
                      <Star size={12} fill="#F5A623" stroke="none" className="text-[#F5A623]" />
                    </div>
                    {/* Barre */}
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            note === 5
                              ? "#10b981"
                              : note === 4
                              ? "#F5A623"
                              : note === 3
                              ? "#f59e0b"
                              : note === 2
                              ? "#f97316"
                              : "#ef4444",
                        }}
                      />
                    </div>
                    {/* Compteur */}
                    <div className="w-16 text-right flex-shrink-0">
                      <span className="text-gray-700 text-sm font-bold font-poppins">{count}</span>
                      <span className="text-gray-400 text-xs ml-1">({Math.round(pct)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Bannière modération ── */}
      {nonApprouves > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl text-sm"
          style={{
            backgroundColor: "#f59e0b10",
            border: "1px solid #f59e0b30",
            color: "#b45309",
          }}
        >
          <Clock size={16} />
          <span>
            <strong>{nonApprouves} avis</strong> en attente de modération — approuvez-les pour qu'ils soient visibles sur votre boutique.
          </span>
        </div>
      )}

      {/* ── Liste des avis ── */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <MessageSquare size={16} className="text-gray-400" />
          <h2 className="text-gray-900 font-semibold">Tous les avis</h2>
          {avis.length > 0 && (
            <span className="ml-auto text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-lg">
              {avis.length}
            </span>
          )}
        </div>

        {avis.length === 0 ? (
          /* ── Empty state ── */
          <div className="py-16 flex flex-col items-center gap-4 text-center px-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#F5A62315" }}
            >
              <Star size={28} style={{ color: "#F5A623" }} />
            </div>
            <div>
              <p className="text-gray-700 font-semibold">Aucun avis client</p>
              <p className="text-gray-400 text-sm mt-1">
                Les avis de vos clients apparaîtront ici une fois qu'ils auront évalué leurs achats.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {avis.map((a) => {
              const initiales = getInitiales(a.client.nom);
              const avatarColor = getAvatarColor(a.client.nom);
              return (
                <div
                  key={a.id}
                  className="p-5 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar initiales */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                      style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                    >
                      {initiales}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      {/* Ligne nom + badges */}
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="text-gray-900 font-semibold text-sm">
                          {a.client.nom}
                        </span>
                        {a.verifie && (
                          <span
                            className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#10b98115", color: "#059669" }}
                          >
                            <ShieldCheck size={11} />
                            Achat vérifié
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            a.approuve
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {a.approuve ? "Approuvé" : "En attente"}
                        </span>
                      </div>

                      {/* Étoiles */}
                      <div className="flex items-center gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={13}
                            fill={i <= a.note ? "#F5A623" : "transparent"}
                            stroke={i <= a.note ? "#F5A623" : "#d1d5db"}
                          />
                        ))}
                        <span className="text-gray-400 text-xs ml-1">{a.note}/5</span>
                      </div>

                      {/* Titre */}
                      {a.titre && (
                        <p className="text-gray-800 text-sm font-medium mb-1">{a.titre}</p>
                      )}

                      {/* Commentaire */}
                      {a.commentaire && (
                        <p className="text-gray-500 text-sm leading-relaxed">{a.commentaire}</p>
                      )}

                      {/* Meta */}
                      <p className="text-gray-400 text-xs mt-2">
                        {a.produit?.nom && (
                          <>
                            <span className="text-gray-500">{a.produit.nom}</span>
                            {" · "}
                          </>
                        )}
                        {formatDate(a.createdAt)}
                      </p>
                    </div>

                    {/* Action modération */}
                    {!a.approuve && (
                      <div className="flex-shrink-0">
                        <form
                          action={async () => {
                            "use server";
                            await prisma.avis.update({
                              where: { id: a.id },
                              data: { approuve: true },
                            });
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs font-medium border px-3 py-1.5 rounded-lg transition-colors"
                            style={{
                              color: "#059669",
                              borderColor: "#10b98130",
                              backgroundColor: "#10b98108",
                            }}
                          >
                            Approuver
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
