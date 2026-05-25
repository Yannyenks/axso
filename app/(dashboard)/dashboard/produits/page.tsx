// Page liste des produits dashboard
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Package, Search, Filter } from "lucide-react";
import { formatMontant } from "@/lib/utils";

export default async function ProduitsPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const tenantId = (session.user as any)?.tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  const produits = await prisma.produit.findMany({
    where: { tenantId },
    include: { variantes: true, _count: { select: { avis: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-playfair">Mes Produits</h1>
          <p className="text-gray-400 text-sm mt-1">{produits.length} produits dans votre catalogue</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/produits/nouveau"
            className="flex items-center gap-2 bg-[#F5A623] text-black font-semibold px-4 py-2.5 rounded-xl hover:bg-[#FFD280] transition-all"
          >
            <Plus size={16} /> Ajouter un produit
          </Link>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <Search size={16} className="text-gray-500" />
          <input placeholder="Rechercher un produit..." className="bg-transparent text-sm text-gray-600 placeholder:text-gray-600 outline-none flex-1" />
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all text-sm">
          <Filter size={16} /> Filtrer
        </button>
      </div>

      {/* Grille produits */}
      {produits.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
          <Package size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-gray-800 font-semibold mb-2">Aucun produit encore</h3>
          <p className="text-gray-400 text-sm mb-6">Commencez par ajouter votre premier produit</p>
          <Link href="/dashboard/produits/nouveau" className="inline-flex items-center gap-2 bg-[#F5A623] text-black font-semibold px-6 py-3 rounded-xl hover:bg-[#FFD280] transition-all">
            <Plus size={16} /> Ajouter un produit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produits.map((p) => (
            <Link key={p.id} href={`/dashboard/produits/${p.id}`}>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-[#F5A623]/30 transition-all group cursor-pointer">
                {/* Image */}
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {p.images[0] ? (
                    <img src={p.images[0]} alt={p.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">??</div>
                  )}
                  {!p.actif && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs bg-red-500 px-2 py-1 rounded">Désactivé</span>
                    </div>
                  )}
                  {p.stock <= 5 && p.stock > 0 && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-lg">
                      Stock faible
                    </div>
                  )}
                  {p.stock === 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-lg">
                      Épuisé
                    </div>
                  )}
                </div>
                {/* Infos */}
                <div className="p-4">
                  <h3 className="text-gray-800 font-medium text-sm mb-1 line-clamp-2 group-hover:text-[#F5A623] transition-colors">{p.nom}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[#F5A623] font-bold text-sm">
                      {formatMontant(p.prix, tenant?.devise || "XOF")}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {p.stock} en stock
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{p.ventes} ventes</span>
                    <span></span>
                    <span>{p._count.avis} avis</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

