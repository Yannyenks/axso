"use client";
import React, { useState, useRef } from "react";
import Link from "next/link";
import { formatMontant } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Package, AlertTriangle, Lock, RotateCcw, Check,
  Star, Minus, Plus, ShoppingCart, Truck, ZoomIn,
  MessageCircle, Download, ChevronRight, ShoppingBag,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Variante = { id: string; nom: string; valeur: string; prix: number | null; stock: number };
type Avis = {
  id: string; note: number; titre: string | null; commentaire: string | null;
  verifie: boolean; client: { nom: string } | null; createdAt: string;
};

export interface ProductPageClientProps {
  produit: {
    id: string; nom: string; description: string | null; descriptionIA: string | null;
    images: string[]; prixAffiche: number; prixCompareAffiche: number | null;
    remise: number; stock: number; type: string; fichierUrl: string | null;
    fichierNom: string | null; categorie: string | null; marque: string | null;
    variantes: Variante[]; avis: Avis[];
    collections: { nom: string; slug: string }[]; noteMoyenne: number;
  };
  tenant: {
    slug: string; nomBoutique: string; devise: string; certifie: boolean;
    accent: string; fond: string; texte: string; surface: string; radius: string;
    whatsapp: string | null; whatsappNumero: string | null;
    productPage?: {
      layout?: string; galleryStyle?: string; zoomOnHover?: boolean; stickyPanel?: boolean;
      showBreadcrumbs?: boolean; showBadges?: boolean; showStockIndicator?: boolean;
      showQuantitySelector?: boolean; showReviews?: boolean; showSimilarProducts?: boolean;
      showDescriptionTabs?: boolean; showAiDescription?: boolean; imageRatio?: string;
    } | null;
  };
  produitsSimilaires: { id: string; nom: string; images: string[]; prixAffiche: number }[];
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ note, size = 14, accent }: { note: number; size?: number; accent: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i} size={size} strokeWidth={1.5}
          style={{ color: accent }}
          fill={i <= Math.floor(note) ? accent : "none"}
          opacity={i <= Math.ceil(note) ? 1 : 0.2}
        />
      ))}
    </div>
  );
}

// ─── Rating Breakdown ─────────────────────────────────────────────────────────
function RatingBreakdown({ avis, accent, moyenne }: { avis: Avis[]; accent: string; moyenne: number }) {
  const total = avis.length;
  const counts = [5, 4, 3, 2, 1].map(n => ({
    stars: n, count: avis.filter(a => Math.round(a.note) === n).length,
  }));
  return (
    <div className="flex items-center gap-8 flex-wrap">
      <div className="text-center flex-shrink-0">
        <div className="text-5xl font-black tabular-nums">{moyenne.toFixed(1)}</div>
        <div className="flex justify-center my-1.5">
          <Stars note={moyenne} size={13} accent={accent} />
        </div>
        <div className="text-xs opacity-40">{total} avis</div>
      </div>
      <div className="flex-1 min-w-[140px] space-y-1.5">
        {counts.map(({ stars, count }) => (
          <div key={stars} className="flex items-center gap-2">
            <span className="text-xs text-right w-2 opacity-50 tabular-nums">{stars}</span>
            <Star size={9} fill={accent} style={{ color: accent }} />
            <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${total > 0 ? (count / total) * 100 : 0}%`, background: accent }} />
            </div>
            <span className="text-xs opacity-40 w-3 text-right tabular-nums">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Image Gallery with hover zoom ───────────────────────────────────────────
function ImageGallery({ images, nom, accent, radius, zoomEnabled = true }: {
  images: string[]; nom: string; accent: string; radius: string; zoomEnabled?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const [zoomData, setZoomData] = useState<{
    x: number; y: number; panelLeft: number; panelTop: number;
  } | null>(null);
  const current = images[selected] ?? null;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoomEnabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    const panelLeft = Math.min(rect.right + 12, (typeof window !== "undefined" ? window.innerWidth : 1400) - 420);
    const panelTop = Math.max(8, rect.top);
    setZoomData({ x, y, panelLeft, panelTop });
  }

  return (
    <>
      <div className="flex gap-3">
        {/* Vertical thumbnail strip — desktop */}
        {images.length > 1 && (
          <div className="hidden sm:flex flex-col gap-2 w-[70px] flex-shrink-0">
            {images.slice(0, 8).map((img, i) => (
              <button
                key={i}
                onMouseEnter={() => setSelected(i)}
                onClick={() => setSelected(i)}
                className="w-full overflow-hidden transition-all duration-150"
                style={{
                  aspectRatio: "1",
                  borderRadius: radius,
                  border: `2px solid ${i === selected ? accent : "rgba(0,0,0,0.1)"}`,
                  opacity: i === selected ? 1 : 0.55,
                  boxShadow: i === selected ? `0 0 0 2px ${accent}30` : "none",
                }}
              >
                <img src={img} alt={`${nom} ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div className="flex-1 group">
          <div
            className="relative aspect-square overflow-hidden select-none"
            style={{ borderRadius: radius, background: "#F6F6F6", cursor: zoomData ? "crosshair" : "zoom-in" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setZoomData(null)}
          >
            {current ? (
              <img src={current} alt={nom} className="w-full h-full object-cover" draggable={false} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={64} className="opacity-20" />
              </div>
            )}
            {/* Zoom hint — shows briefly before interaction */}
            {!zoomData && current && (
              <div
                className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
              >
                <ZoomIn size={10} /> Survolez pour zoomer
              </div>
            )}
          </div>

          {/* Mobile thumbnails — horizontal scroll */}
          {images.length > 1 && (
            <div className="sm:hidden flex gap-2 mt-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className="flex-shrink-0 w-12 overflow-hidden"
                  style={{
                    aspectRatio: "1",
                    borderRadius: radius,
                    border: `2px solid ${i === selected ? accent : "transparent"}`,
                  }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed zoom preview panel — desktop only */}
      {zoomData && current && (
        <div
          className="fixed z-[200] pointer-events-none hidden lg:block"
          style={{
            left: zoomData.panelLeft,
            top: zoomData.panelTop,
            width: 400,
            height: 400,
            borderRadius: radius,
            backgroundImage: `url(${current})`,
            backgroundSize: "300%",
            backgroundPosition: `${zoomData.x}% ${zoomData.y}%`,
            boxShadow: "0 25px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)",
          }}
        />
      )}
    </>
  );
}

// ─── Variant Selector ─────────────────────────────────────────────────────────
function VariantSelector({ variantes, accent, radius, selected, onSelect }: {
  variantes: Variante[]; accent: string; radius: string;
  selected: Variante | null; onSelect: (v: Variante | null) => void;
}) {
  const grouped = variantes.reduce<Record<string, Variante[]>>((acc, v) => {
    (acc[v.nom] ??= []).push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([nom, variants]) => {
        const current = variants.find(v => v.id === selected?.id);
        return (
          <div key={nom}>
            <p className="text-sm font-medium mb-2.5">
              <span className="opacity-55">{nom} :</span>{" "}
              {current && <span className="font-bold" style={{ color: accent }}>{current.valeur}</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {variants.map(v => {
                const isSelected = selected?.id === v.id;
                const isOut = v.stock === 0;
                return (
                  <button
                    key={v.id}
                    onClick={() => onSelect(isSelected ? null : v)}
                    disabled={isOut}
                    className="relative px-4 py-2 text-sm font-medium transition-all duration-150"
                    style={{
                      borderRadius: radius,
                      border: `2px solid ${isSelected ? accent : "rgba(0,0,0,0.12)"}`,
                      background: isSelected ? `${accent}12` : "transparent",
                      color: isSelected ? accent : "inherit",
                      opacity: isOut ? 0.3 : 1,
                    }}
                  >
                    {v.valeur}
                    {isOut && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-[130%] h-px bg-current opacity-50 rotate-[-15deg] absolute" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProductPageClient({ produit, tenant, produitsSimilaires }: ProductPageClientProps) {
  const { slug, devise, accent, fond, texte, surface, radius, whatsapp, whatsappNumero, nomBoutique, certifie } = tenant;
  const pp = tenant.productPage;
  const zoomEnabled      = pp?.zoomOnHover      !== false;
  const stickyGallery    = pp?.stickyPanel       !== false;
  const showBreadcrumbs  = pp?.showBreadcrumbs   !== false;
  const showStockInd     = pp?.showStockIndicator !== false;
  const showQtySelector  = pp?.showQuantitySelector !== false;
  const showReviews      = pp?.showReviews       !== false;
  const showSimilar      = pp?.showSimilarProducts !== false;
  const showDescTabs     = pp?.showDescriptionTabs !== false;
  const showAiDesc       = pp?.showAiDescription  !== false;
  const showBadges       = pp?.showBadges        !== false;

  const [selectedVariante, setSelectedVariante] = useState<Variante | null>(null);
  const [quantite, setQuantite] = useState(1);
  const [tab, setTab] = useState<"description" | "livraison" | "avis">("description");

  const { ajouterItem, setTenant } = useCartStore();
  const router = useRouter();

  const prixEffectif = selectedVariante?.prix ?? produit.prixAffiche;
  const stockEffectif = selectedVariante !== null ? selectedVariante.stock : produit.stock;
  const enRupture = stockEffectif === 0;

  function doAddToCart() {
    if (enRupture) return;
    setTenant(slug);
    ajouterItem({
      produitId: produit.id,
      nom: produit.nom,
      prix: prixEffectif,
      imageUrl: produit.images[0] ?? undefined,
      stock: produit.type === "digital" ? 9999 : stockEffectif,
      quantite,
      type: produit.type as any,
      fichierUrl: produit.fichierUrl ?? undefined,
      fichierNom: produit.fichierNom ?? undefined,
      variante: selectedVariante ? `${selectedVariante.nom}: ${selectedVariante.valeur}` : undefined,
    });
    toast.success(`${produit.nom} ajouté au panier`);
  }

  function buyNow() {
    doAddToCart();
    router.push(`/${slug}/checkout`);
  }

  const waNum = (whatsappNumero || whatsapp || "").replace(/\D/g, "");
  const waMsg = encodeURIComponent(`Bonjour, je suis intéressé par : ${produit.nom}`);

  return (
    <div style={{ backgroundColor: fond, color: texte, minHeight: "100vh" }}>

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      {showBreadcrumbs && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-1 text-xs flex-wrap" style={{ opacity: 0.45 }}>
          <Link href={`/${slug}`} className="hover:opacity-100 transition-opacity">Accueil</Link>
          <ChevronRight size={10} />
          <Link href={`/${slug}/produits`} className="hover:opacity-100 transition-opacity">Produits</Link>
          {produit.categorie && <><ChevronRight size={10} /><span>{produit.categorie}</span></>}
          <ChevronRight size={10} />
          <span className="truncate max-w-[200px]" style={{ opacity: 1, color: texte }}>{produit.nom}</span>
        </div>
      </div>}

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.8fr)] gap-10 lg:gap-16 items-start">

          {/* Left — gallery */}
          <div className={stickyGallery ? "lg:sticky lg:top-6" : ""}>
            <ImageGallery images={produit.images} nom={produit.nom} accent={accent} radius={radius} zoomEnabled={zoomEnabled} />
          </div>

          {/* Right — product info */}
          <div className="space-y-5 py-1">

            {/* Collections badges */}
            {produit.collections.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {produit.collections.map(col => (
                  <Link key={col.slug} href={`/${slug}/collections/${col.slug}`}>
                    <span className="text-xs px-3 py-1 rounded-full border transition-all hover:opacity-100"
                      style={{ borderColor: `${accent}40`, color: accent, opacity: 0.8 }}>
                      {col.nom}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Brand */}
            {produit.marque && (
              <p className="text-xs font-semibold" style={{ color: accent }}>
                Marque : <span style={{ color: texte, opacity: 0.6, fontWeight: 400 }}>{produit.marque}</span>
              </p>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold leading-snug">{produit.nom}</h1>

            {/* Rating */}
            {produit.avis.length > 0 && (
              <button
                onClick={() => setTab("avis")}
                className="flex items-center gap-2 group"
              >
                <Stars note={produit.noteMoyenne} size={15} accent={accent} />
                <span className="text-sm font-semibold" style={{ color: accent }}>
                  {produit.noteMoyenne.toFixed(1)}
                </span>
                <span className="text-sm opacity-50 group-hover:opacity-80 underline transition-opacity">
                  {produit.avis.length} avis
                </span>
              </button>
            )}

            {/* Divider */}
            <div className="h-px" style={{ background: `${accent}12` }} />

            {/* Price */}
            <div>
              {produit.remise > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg"
                    style={{ background: "#EF4444", color: "#fff" }}>
                    -{produit.remise}% · Offre limitée
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl font-black" style={{ color: accent }}>
                  {formatMontant(prixEffectif, devise)}
                </span>
                {produit.prixCompareAffiche && produit.prixCompareAffiche > produit.prixAffiche && (
                  <span className="text-lg opacity-35 line-through">
                    {formatMontant(produit.prixCompareAffiche, devise)}
                  </span>
                )}
              </div>
            </div>

            {/* Stock */}
            {showStockInd && <div className="flex items-center gap-2 text-sm">
              {enRupture ? (
                <><div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-red-500 font-semibold">Rupture de stock</span></>
              ) : stockEffectif <= 10 ? (
                <><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                  <span className="font-medium flex items-center gap-1">
                    <AlertTriangle size={13} className="text-amber-400" />
                    Plus que <strong>{stockEffectif}</strong> en stock — commandez vite
                  </span></>
              ) : (
                <><div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-600 font-semibold">En stock · Expédition sous 24-48h</span></>
              )}
            </div>}

            {/* Short description */}
            {produit.description && (
              <p className="text-sm leading-relaxed"
                style={{ opacity: 0.6, paddingLeft: "12px", borderLeft: `3px solid ${accent}30` }}>
                {produit.description.length > 220
                  ? produit.description.slice(0, 220) + "…"
                  : produit.description}
              </p>
            )}

            {/* Divider */}
            <div className="h-px" style={{ background: `${accent}12` }} />

            {/* Variants */}
            {produit.variantes.length > 0 && (
              <VariantSelector
                variantes={produit.variantes}
                accent={accent}
                radius={radius}
                selected={selectedVariante}
                onSelect={setSelectedVariante}
              />
            )}

            {/* Quantity selector */}
            {showQtySelector && <div className="flex items-center gap-4">
              <span className="text-sm font-medium opacity-55">Quantité</span>
              <div className="flex items-center border rounded-xl overflow-hidden"
                style={{ borderColor: `${accent}25` }}>
                <button
                  onClick={() => setQuantite(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ color: accent }}
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-sm font-bold tabular-nums">{quantite}</span>
                <button
                  onClick={() => setQuantite(q => Math.min(enRupture ? 1 : stockEffectif, q + 1))}
                  disabled={enRupture}
                  className="w-10 h-10 flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ color: accent }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>}

            {/* CTA Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={doAddToCart}
                disabled={enRupture}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-35 flex items-center justify-center gap-3"
                style={{
                  background: enRupture ? "#E0E0E0" : `linear-gradient(135deg, ${accent} 0%, ${accent}CC 100%)`,
                  color: enRupture ? "#999" : "#fff",
                  boxShadow: enRupture ? "none" : `0 6px 24px ${accent}40`,
                }}
              >
                {produit.type === "digital" ? <Download size={18} /> : <ShoppingCart size={18} />}
                {enRupture ? "Indisponible" : "Ajouter au panier"}
              </button>

              <button
                onClick={buyNow}
                disabled={enRupture}
                className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-35 border-2 flex items-center justify-center gap-2"
                style={{ borderColor: accent, color: accent, background: `${accent}08` }}
              >
                <ShoppingBag size={16} /> Acheter maintenant
              </button>

              {waNum && (
                <a
                  href={`https://wa.me/${waNum}?text=${waMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-sm border-2 transition-all hover:opacity-80"
                  style={{
                    borderColor: "rgba(37,211,102,0.35)",
                    color: "#25D366",
                    background: "rgba(37,211,102,0.05)",
                  }}
                >
                  <MessageCircle size={16} /> Contacter via WhatsApp
                </a>
              )}
            </div>

            {/* Trust badges */}
            {showBadges && <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { icon: <Lock size={15} style={{ color: accent }} />, label: "Paiement sécurisé" },
                { icon: <Truck size={15} style={{ color: accent }} />, label: "Livraison rapide" },
                { icon: <RotateCcw size={15} style={{ color: accent }} />, label: "Retour 14 jours" },
              ].map(b => (
                <div key={b.label} className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl text-center"
                  style={{ background: surface }}>
                  {b.icon}
                  <p className="text-[10px] font-semibold leading-tight" style={{ opacity: 0.55 }}>{b.label}</p>
                </div>
              ))}
            </div>}

            {/* Sold by */}
            <div className="rounded-xl p-4" style={{ background: surface }}>
              <p className="text-xs opacity-50 mb-0.5">Vendu par</p>
              <p className="text-sm font-semibold">
                {nomBoutique}{certifie && <span className="ml-1.5 text-[10px] text-emerald-500 font-bold">✓ Certifié Axso</span>}
              </p>
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        {showDescTabs && <div className="mt-16 border-b" style={{ borderColor: `${accent}15` }}>
          <div className="flex gap-1 overflow-x-auto">
            {([
              { key: "description", label: "Description" },
              { key: "livraison", label: "Livraison & retours" },
              ...(showReviews ? [{ key: "avis", label: `Avis (${produit.avis.length})` }] : []),
            ] as { key: "description" | "livraison" | "avis"; label: string }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex-shrink-0"
                style={{
                  borderColor: tab === t.key ? accent : "transparent",
                  color: tab === t.key ? accent : texte,
                  opacity: tab === t.key ? 1 : 0.4,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>}

        {showDescTabs && <div className="py-10 max-w-3xl">
          {/* Description tab */}
          {tab === "description" && (
            <div className="space-y-5">
              {produit.description && (
                <p className="text-base leading-relaxed" style={{ opacity: 0.7 }}>{produit.description}</p>
              )}
              {showAiDesc && produit.descriptionIA && (
                <div className="p-5 rounded-2xl" style={{ background: surface }}>
                  <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: accent }}>
                    Description enrichie par IA
                  </p>
                  <p className="text-sm leading-relaxed" style={{ opacity: 0.7 }}>{produit.descriptionIA}</p>
                </div>
              )}
              {!produit.description && !produit.descriptionIA && (
                <p className="text-sm" style={{ opacity: 0.35 }}>Aucune description disponible pour ce produit.</p>
              )}
            </div>
          )}

          {/* Livraison tab */}
          {tab === "livraison" && (
            <div className="space-y-3">
              {[
                {
                  icon: <Truck size={18} style={{ color: accent }} />,
                  titre: "Livraison standard",
                  texte: "Votre commande est préparée sous 24–48h ouvrées. Le délai de livraison varie selon votre zone géographique.",
                },
                {
                  icon: <RotateCcw size={18} style={{ color: accent }} />,
                  titre: "Politique de retour",
                  texte: "Retours acceptés dans les 14 jours suivant la réception. Le produit doit être dans son état d'origine, non utilisé.",
                },
                {
                  icon: <Lock size={18} style={{ color: accent }} />,
                  titre: "Paiement sécurisé",
                  texte: "Toutes les transactions sont sécurisées et chiffrées SSL. Paiement par mobile money, carte bancaire ou à la livraison.",
                },
              ].map(item => (
                <div key={item.titre} className="flex gap-4 p-5 rounded-2xl" style={{ background: surface }}>
                  <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                  <div>
                    <p className="font-semibold text-sm mb-1">{item.titre}</p>
                    <p className="text-sm leading-relaxed" style={{ opacity: 0.6 }}>{item.texte}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Avis tab */}
          {tab === "avis" && (
            <div>
              {produit.avis.length > 0 ? (
                <div className="space-y-8">
                  <RatingBreakdown avis={produit.avis} accent={accent} moyenne={produit.noteMoyenne} />
                  <div className="h-px" style={{ background: `${accent}12` }} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {produit.avis.map(avis => (
                      <div key={avis.id} className="p-5 rounded-2xl"
                        style={{ background: surface, border: `1px solid ${accent}10` }}>
                        <div className="flex items-center justify-between mb-2">
                          <Stars note={avis.note} size={13} accent={accent} />
                          {avis.verifie && (
                            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                              <Check size={10} /> Achat vérifié
                            </span>
                          )}
                        </div>
                        {avis.titre && <p className="font-semibold text-sm mb-1">{avis.titre}</p>}
                        {avis.commentaire && (
                          <p className="text-sm leading-relaxed" style={{ opacity: 0.6 }}>{avis.commentaire}</p>
                        )}
                        <p className="text-xs mt-3 font-semibold" style={{ opacity: 0.3 }}>
                          — {avis.client?.nom || "Client"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Star size={36} className="mx-auto mb-3" style={{ opacity: 0.15, color: accent }} />
                  <p className="font-medium text-sm" style={{ opacity: 0.4 }}>Aucun avis pour ce produit.</p>
                  <p className="text-xs mt-1" style={{ opacity: 0.25 }}>Soyez le premier à partager votre expérience !</p>
                </div>
              )}
            </div>
          )}
        </div>}

        {/* ── Similar products ──────────────────────────────────────────────── */}
        {showSimilar && produitsSimilaires.length > 0 && (
          <div className="mt-8 border-t pt-12" style={{ borderColor: `${accent}10` }}>
            <h2 className="text-xl font-bold mb-6">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {produitsSimilaires.map(p => (
                <Link key={p.id} href={`/${slug}/produits/${p.id}`} className="group">
                  <div className="rounded-2xl overflow-hidden border transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5"
                    style={{ background: surface, borderColor: `${accent}12` }}>
                    <div className="aspect-square overflow-hidden" style={{ background: fond }}>
                      {p.images[0] ? (
                        <img src={p.images[0]} alt={p.nom}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={28} className="opacity-20" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium line-clamp-2 leading-snug mb-1">{p.nom}</p>
                      <p className="text-sm font-bold" style={{ color: accent }}>
                        {formatMontant(p.prixAffiche, devise)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-8 text-center text-xs" style={{ borderColor: `${accent}10`, opacity: 0.35 }}>
        <p>{nomBoutique} · Propulsé par <span style={{ color: accent, opacity: 1 }}>Axso</span></p>
      </footer>
    </div>
  );
}
