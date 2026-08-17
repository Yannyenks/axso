"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag, Menu, X, Search, BadgeCheck } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  slug: string;
  nomBoutique: string;
  logoUrl?: string | null;
  accent: string;
  fond: string;
  texte: string;
  radius: string;
  collections: Array<{ slug: string; nom: string }>;
  certifie?: boolean;
}

export function StorefrontNavbar({ slug, nomBoutique, logoUrl, accent, fond, texte, radius, collections, certifie }: Props) {
  const totalItems = useCartStore((s) => s.totalItems());
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    const handler = () => setScroll(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-500"
      style={{
        backgroundColor: scroll ? `${fond}f0` : `${fond}cc`,
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${accent}18`,
        boxShadow: scroll ? `0 1px 40px ${accent}08` : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={`/${slug}`} className="flex-shrink-0 min-w-0 flex items-center gap-1.5">
          {logoUrl ? (
            <img src={logoUrl} alt={nomBoutique} className="h-9 object-contain max-w-[180px]" />
          ) : (
            <span className="text-xl font-bold font-playfair truncate" style={{ color: accent }}>
              {nomBoutique}
            </span>
          )}
          {certifie && (
            <span className="flex-shrink-0" title="Boutique certifiée Axso">
              <BadgeCheck size={16} style={{ color: accent }} />
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
          <Link href={`/${slug}/produits`} className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity tracking-wide" style={{ color: texte }}>
            Produits
          </Link>
          {collections.slice(0, 4).map((col) => (
            <Link
              key={col.slug}
              href={`/${slug}/collections/${col.slug}`}
              className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity tracking-wide"
              style={{ color: texte }}
            >
              {col.nom}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Cart */}
          <Link
            href={`/${slug}/panier`}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: accent, color: fond, borderRadius: radius }}
          >
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">Panier</span>
            {totalItems > 0 && (
              <span
                className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: fond, color: accent }}
              >
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOuvert(!menuOuvert)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl transition-all"
            style={{ backgroundColor: `${accent}15`, color: texte }}
            aria-label="Menu"
          >
            {menuOuvert ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${menuOuvert ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
        style={{ borderTop: menuOuvert ? `1px solid ${accent}20` : "none", backgroundColor: fond }}
      >
        <div className="px-4 py-4 space-y-1">
          <Link
            href={`/${slug}/produits`}
            onClick={() => setMenuOuvert(false)}
            className="block px-3 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ color: texte }}
          >
            Tous les produits
          </Link>
          {collections.map((col) => (
            <Link
              key={col.slug}
              href={`/${slug}/collections/${col.slug}`}
              onClick={() => setMenuOuvert(false)}
              className="block px-3 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ color: texte }}
            >
              {col.nom}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              href={`/${slug}/panier`}
              onClick={() => setMenuOuvert(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold w-full justify-center"
              style={{ backgroundColor: accent, color: fond }}
            >
              <ShoppingBag size={16} />
              Voir mon panier{totalItems > 0 && ` (${totalItems})`}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
