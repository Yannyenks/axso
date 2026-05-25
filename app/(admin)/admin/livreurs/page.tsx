import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Truck, MapPin, CheckCircle, XCircle, Bike, Car, Package } from "lucide-react";

const VEHICULES: Record<string, { label: string; icon: any }> = {
  moto: { label: "Moto", icon: Bike },
  voiture: { label: "Voiture", icon: Car },
  velo: { label: "Vélo", icon: Bike },
  pied: { label: "À pied", icon: Package },
};

export default async function AdminLivreursPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") redirect("/dashboard");

  const livreurs = await prisma.livreur.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tenant: { select: { nomBoutique: true, slug: true } },
      _count: { select: { commandes: true } },
    },
  });

  const independants = livreurs.filter(l => !l.tenantId);
  const attaches = livreurs.filter(l => l.tenantId);
  const disponibles = livreurs.filter(l => l.disponible && l.actif).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white font-playfair">Livreurs</h1>
        <p className="text-gray-400 text-sm mt-1">{livreurs.length} livreurs sur la plateforme</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total livreurs", value: livreurs.length, color: "#F5A623" },
          { label: "Disponibles", value: disponibles, color: "#34d399" },
          { label: "Indépendants", value: independants.length, color: "#60a5fa" },
          { label: "Attachés boutique", value: attaches.length, color: "#a78bfa" },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-white/5 rounded-2xl p-5">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table livreurs */}
      <div className="bg-white border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
          <Truck size={15} className="text-[#F5A623]" />
          <h2 className="text-white font-semibold">Tous les livreurs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Livreur", "Téléphone", "Véhicule", "Zone", "Boutique", "Livraisons", "Position", "Statut", "Inscrit le"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-gray-500 text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {livreurs.map(l => {
                const vehicule = VEHICULES[l.vehicule] || VEHICULES.moto;
                const VehiculeIcon = vehicule.icon;
                return (
                  <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white">
                          {l.nom.slice(0, 2).toUpperCase()}
                        </div>
                        <p className="text-white font-medium">{l.nom}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-400 font-mono text-xs">{l.telephone}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <VehiculeIcon size={13} />
                        <span className="text-xs">{vehicule.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{l.zone || "—"}</td>
                    <td className="px-5 py-4">
                      {l.tenant ? (
                        <span className="text-xs text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded-full border border-[#F5A623]/20">
                          {l.tenant.nomBoutique}
                        </span>
                      ) : (
                        <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          Plateforme
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-white text-center">{l._count.commandes}</td>
                    <td className="px-5 py-4">
                      {l.latitude && l.longitude ? (
                        <div className="flex items-center gap-1 text-green-400 text-xs">
                          <MapPin size={11} />
                          <span>{l.latitude.toFixed(3)}, {l.longitude.toFixed(3)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">Non partagée</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {l.actif
                            ? <CheckCircle size={11} className="text-green-400" />
                            : <XCircle size={11} className="text-red-400" />}
                          <span className={`text-[10px] ${l.actif ? "text-green-400" : "text-red-400"}`}>
                            {l.actif ? "Actif" : "Inactif"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${l.disponible ? "bg-green-400" : "bg-gray-600"}`} />
                          <span className={`text-[10px] ${l.disponible ? "text-green-400" : "text-gray-500"}`}>
                            {l.disponible ? "Dispo" : "Occupé"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(l.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {livreurs.length === 0 && (
            <div className="py-16 text-center text-gray-600">
              <Truck size={32} className="mx-auto mb-3 opacity-30" />
              <p>Aucun livreur inscrit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
