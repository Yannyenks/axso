// Bouton ajout au panier — client component
"use client";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  produit: { id: string; nom: string; prix: number; images: string[]; stock: number };
  theme: { fond: string; accent: string; texte: string; surface: string };
  tenantSlug: string;
}

export function AddToCartButton({ produit, theme, tenantSlug }: Props) {
  const { ajouterItem, setTenant } = useCartStore();
  const [ajoute, setAjoute] = useState(false);
  const [quantite, setQuantite] = useState(1);

  function ajouterAuPanier() {
    if (produit.stock === 0) return;
    setTenant(tenantSlug);
    ajouterItem({
      produitId: produit.id,
      nom: produit.nom,
      prix: produit.prix,
      imageUrl: produit.images[0],
      stock: produit.stock,
      quantite,
    });
    setAjoute(true);
    toast.success(`${produit.nom} ajouté au panier`);
    setTimeout(() => setAjoute(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Quantité */}
      <div className="flex items-center gap-3">
        <span className="text-sm opacity-60">Quantité</span>
        <div className="flex items-center rounded-xl overflow-hidden border" style={{ borderColor: `${theme.accent}30` }}>
          <button onClick={() => setQuantite((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-lg hover:opacity-80 transition-opacity" style={{ color: theme.texte }}>−</button>
          <span className="w-10 text-center font-semibold">{quantite}</span>
          <button onClick={() => setQuantite((q) => Math.min(produit.stock, q + 1))} className="w-10 h-10 flex items-center justify-center text-lg hover:opacity-80 transition-opacity" style={{ color: theme.texte }}>+</button>
        </div>
      </div>

      <button
        onClick={ajouterAuPanier}
        disabled={produit.stock === 0}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-base transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: theme.accent, color: theme.fond }}
      >
        {ajoute ? <Check size={20} /> : <ShoppingBag size={20} />}
        {produit.stock === 0 ? "Rupture de stock" : ajoute ? "Ajouté !" : "Ajouter au panier"}
      </button>
    </div>
  );
}
