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
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        Épuisé
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
        <AlertTriangle size={9} />
        {stock} restants
      </span>
    );
  }
  if (stock <= 20) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {stock} en stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]">
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
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
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-[#111111] font-poppins">Produits</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F4F4F4] text-[#717171] border border-[#E8E8E8]">
              {produits.length} au total
            </span>
            {stockFaible > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                <AlertTriangle size={10} />
                {stockFaible} stock faible
              </span>
            )}
          </div>
          <p className="text-[#717171] text-sm">Gérez votre catalogue de produits et suivez vos ventes</p>
        </div>
        <Link
          href="/dashboard/produits/nouveau"
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-[#111111] text-white whitespace-nowrap"
        >
          <Plus size={15} />
          Nouveau produit
        </Link>
      </div>

      {/* Stats rapides */}
      {produits.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-[#E8E8E8] rounded-xl px-4 py-2.5">
            <Package size={13} className="text-[#717171]" />
            <span className="text-[#717171] text-xs">Actifs</span>
            <span className="text-[#111111] text-sm font-bold">{totalActifs}</span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-[#E8E8E8] rounded-xl px-4 py-2.5">
            <TrendingUp size={13} className="text-[#16A34A]" />
            <span className="text-[#717171] text-xs">Ventes totales</span>
            <span className="text-[#111111] text-sm font-bold">{totalVentes}</span>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white border border-[#E8E8E8] rounded-xl px-4 py-2.5">
          <Search size={15} className="text-[#717171] flex-shrink-0" />
          <input
            placeholder="Rechercher un produit par nom, catégorie..."
            className="bg-transparent text-sm text-[#111111] placeholder:text-[#717171] outline-none flex-1 min-w-0"
          />
        </div>
        <button className="flex items-center gap-2 bg-white border border-[#E8E8E8] px-4 py-2.5 rounded-xl text-[#717171] hover:text-[#111111] transition-colors text-sm font-medium">
          <Filter size={14} />
          Filtrer
        </button>
      </div>

      {/* Grille produits / Empty state */}
      {produits.length === 0 ? (
        <div className="bg-white border border-[#E8E8E8] rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F4F4F4] border border-[#E8E8E8] flex items-center justify-center mx-auto mb-5">
            <Package size={32} className="text-[#717171]" />
          </div>
          <h3 className="text-[#111111] font-semibold text-base mb-2">Aucun produit encore</h3>
          <p className="text-[#717171] text-sm mb-8 max-w-sm mx-auto">
            Votre catalogue est vide. Ajoutez votre premier produit pour commencer à vendre.
          </p>
          <Link
            href="/dashboard/produits/nouveau"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl bg-[#111111] text-white"
          >
            <Plus size={15} />
            Ajouter mon premier produit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produits.map((p) => (
            <Link key={p.id} href={`/dashboard/produits/${p.id}`} className="group block">
              <div className="bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden h-full flex flex-col hover:border-[#D0D0D0] transition-colors">
                {/* Image */}
                <div className="aspect-square bg-[#F4F4F4] relative overflow-hidden flex-shrink-0">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.nom}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={36} className="text-[#717171]" />
                    </div>
                  )}

                  {!p.actif && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold bg-[#DC2626] px-3 py-1 rounded-full">
                        Désactivé
                      </span>
                    </div>
                  )}

                  {(p as any).categorie && (
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-[#111111] border border-[#E8E8E8]">
                        <Tag size={8} />
                        {(p as any).categorie}
                      </span>
                    </div>
                  )}

                  {p.stock === 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                        Épuisé
                      </span>
                    </div>
                  )}
                  {p.stock > 0 && p.stock <= 5 && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                        Stock faible
                      </span>
                    </div>
                  )}
                </div>

                {/* Infos produit */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-[#111111] font-semibold text-sm mb-3 line-clamp-2 leading-snug">
                    {p.nom}
                  </h3>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-bold font-poppins text-[#F5A623]">
                      {formatMontant(p.prix, tenant?.devise || "XOF")}
                    </span>
                    <StockBadge stock={p.stock} />
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F3F3F3]">
                    <div className="flex items-center gap-1 text-[#717171] text-[11px]">
                      <TrendingUp size={10} />
                      <span>{p.ventes} vente{p.ventes > 1 ? "s" : ""}</span>
                    </div>
                    {p._count.avis > 0 && (
                      <div className="flex items-center gap-1 text-[#717171] text-[11px]">
                        <Star size={10} className="text-[#F5A623]" fill="#F5A623" />
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
