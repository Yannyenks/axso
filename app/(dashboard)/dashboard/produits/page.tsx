// Page liste des produits dashboard
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Package, Search, Filter, Star, TrendingUp, Tag, AlertTriangle } from "lucide-react";
import { formatMontant } from "@/lib/utils";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Épuisé
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
        <AlertTriangle size={9} />
        {stock} restants
      </span>
    );
  }
  if (stock <= 20) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-orange-50 text-orange-600 border border-orange-200">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        {stock} en stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-green-50 text-green-600 border border-green-200">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      {stock} en stock
    </span>
  );
}

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

  const totalActifs = produits.filter((p) => p.actif).length;
  const totalVentes = produits.reduce((s, p) => s + p.ventes, 0);
  const stockFaible = produits.filter((p) => p.stock <= 5 && p.actif).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 font-poppins">Mes Produits</h1>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#fff7ed", color: "#F5A623", border: "1px solid #fed7aa" }}
            >
              {produits.length} au total
            </span>
            {stockFaible > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                <AlertTriangle size={10} />
                {stockFaible} stock faible
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">Gérez votre catalogue de produits et suivez vos ventes</p>
        </div>
        <Link
          href="/dashboard/produits/nouveau"
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
          style={{ backgroundColor: "#F5A623", color: "#000" }}
        >
          <Plus size={16} />
          Nouveau produit
        </Link>
      </div>

      {/* Stat pills rapides */}
      {produits.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#fff7ed" }}>
              <Package size={13} style={{ color: "#F5A623" }} />
            </div>
            <span className="text-gray-400 text-xs">Actifs :</span>
            <span className="text-gray-800 text-sm font-bold">{totalActifs}</span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f0fdf4" }}>
              <TrendingUp size={13} style={{ color: "#16a34a" }} />
            </div>
            <span className="text-gray-400 text-xs">Ventes totales :</span>
            <span className="text-gray-800 text-sm font-bold">{totalVentes}</span>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="flex gap-3">
        <div
          className="flex-1 flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm transition-all duration-200"
          style={{ outline: "none" }}
        >
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            placeholder="Rechercher un produit par nom, catégorie..."
            className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none flex-1 min-w-0"
          />
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-sm font-medium shadow-sm">
          <Filter size={15} />
          Filtrer
        </button>
      </div>

      {/* Grille produits / Empty state */}
      {produits.length === 0 ? (
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-5">
            <Package size={36} className="text-gray-300" />
          </div>
          <h3 className="text-gray-800 font-semibold text-base mb-2">Aucun produit encore</h3>
          <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
            Votre catalogue est vide. Ajoutez votre premier produit pour commencer à vendre.
          </p>
          <Link
            href="/dashboard/produits/nouveau"
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            style={{ backgroundColor: "#F5A623", color: "#000" }}
          >
            <Plus size={16} />
            Ajouter mon premier produit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produits.map((p) => (
            <Link key={p.id} href={`/dashboard/produits/${p.id}`} className="group block">
              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200 h-full flex flex-col">
                {/* Image */}
                <div className="aspect-square bg-gray-50 relative overflow-hidden flex-shrink-0">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.nom}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl">📦</span>
                    </div>
                  )}

                  {/* Overlay désactivé */}
                  {!p.actif && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold bg-red-500 px-3 py-1 rounded-full">
                        Désactivé
                      </span>
                    </div>
                  )}

                  {/* Badge catégorie */}
                  {(p as any).categorie && (
                    <div className="absolute top-2 left-2">
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#374151", backdropFilter: "blur(4px)" }}
                      >
                        <Tag size={8} />
                        {(p as any).categorie}
                      </span>
                    </div>
                  )}

                  {/* Badge stock */}
                  {p.stock <= 5 && (
                    <div className="absolute top-2 right-2">
                      {p.stock === 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white shadow-sm">
                          Épuisé
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white shadow-sm">
                          Stock faible
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Infos produit */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-gray-800 font-semibold text-sm mb-3 line-clamp-2 group-hover:text-[#F5A623] transition-colors duration-200 leading-snug">
                    {p.nom}
                  </h3>

                  {/* Prix + stock */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-bold font-poppins" style={{ color: "#F5A623" }}>
                      {formatMontant(p.prix, tenant?.devise || "XOF")}
                    </span>
                    <StockBadge stock={p.stock} />
                  </div>

                  {/* Meta : ventes + avis */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1 text-gray-400 text-[11px]">
                      <TrendingUp size={10} />
                      <span>{p.ventes} vente{p.ventes > 1 ? "s" : ""}</span>
                    </div>
                    {p._count.avis > 0 && (
                      <div className="flex items-center gap-1 text-gray-400 text-[11px]">
                        <Star size={10} className="text-yellow-400" fill="#facc15" />
                        <span>{p._count.avis} avis</span>
                      </div>
                    )}
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
