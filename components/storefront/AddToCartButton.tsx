"use client";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag, Check, Download, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  produit: {
    id: string; nom: string; prix: number; images: string[]; stock: number;
    type?: string; fichierUrl?: string | null; fichierNom?: string | null;
  };
  theme: { fond: string; accent: string; texte: string; surface: string };
  tenantSlug: string;
  whatsappNumero?: string | null;
}

export function AddToCartButton({ produit, theme, tenantSlug, whatsappNumero }: Props) {
  const { ajouterItem, setTenant } = useCartStore();
  const [ajoute, setAjoute] = useState(false);
  const [quantite, setQuantite] = useState(1);
  const isDigital = produit.type === "digital";
  const isPhysique = !isDigital;

  function ajouterAuPanier() {
    if (produit.stock === 0 && isPhysique) return;
    setTenant(tenantSlug);
    ajouterItem({
      produitId: produit.id,
      nom: produit.nom,
      prix: produit.prix,
      imageUrl: produit.images[0],
      stock: isDigital ? 9999 : produit.stock,
      quantite,
      type: (produit.type as any) || "physique",
      fichierUrl: produit.fichierUrl || undefined,
      fichierNom: produit.fichierNom || undefined,
    });
    setAjoute(true);
    toast.success(`${produit.nom} ajouté au panier`);
    setTimeout(() => setAjoute(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Badge type produit */}
      <div className="flex items-center gap-2">
        {isDigital ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: `${theme.accent}18`, color: theme.accent, border: `1px solid ${theme.accent}30` }}>
            ⚡ Livraison instantanée · Téléchargement immédiat
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
            📦 Livraison à domicile · Paiement à la livraison
          </span>
        )}
      </div>

      {/* Quantité (physique uniquement) */}
      {isPhysique && (
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-60">Quantité</span>
          <div className="flex items-center rounded-xl overflow-hidden border" style={{ borderColor: `${theme.accent}30` }}>
            <button onClick={() => setQuantite(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-lg hover:opacity-80" style={{ color: theme.texte }}>−</button>
            <span className="w-10 text-center font-semibold">{quantite}</span>
            <button onClick={() => setQuantite(q => Math.min(produit.stock, q + 1))} className="w-10 h-10 flex items-center justify-center text-lg hover:opacity-80" style={{ color: theme.texte }}>+</button>
          </div>
        </div>
      )}

      {/* Bouton principal */}
      <button
        onClick={ajouterAuPanier}
        disabled={produit.stock === 0 && isPhysique}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-base transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: theme.accent, color: theme.fond, boxShadow: `0 4px 20px ${theme.accent}40` }}>
        {ajoute
          ? <><Check size={20} />Ajouté !</>
          : isDigital
            ? <><Download size={20} />Acheter et télécharger</>
            : produit.stock === 0
              ? "Rupture de stock"
              : <><ShoppingBag size={20} />Ajouter au panier</>
        }
      </button>

      {/* WhatsApp rapide pour produits physiques */}
      {isPhysique && whatsappNumero && (
        <a
          href={`https://wa.me/${whatsappNumero.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour, je suis intéressé par *${produit.nom}* à ${produit.prix} FCFA. Pouvez-vous confirmer la disponibilité ?`)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-semibold border-2 rounded-2xl transition-all hover:opacity-80"
          style={{ borderColor: `${theme.accent}40`, color: theme.texte }}>
          <MessageCircle size={16} /> Commander via WhatsApp
        </a>
      )}
    </div>
  );
}
