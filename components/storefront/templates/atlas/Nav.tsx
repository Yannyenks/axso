"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { formatMontant } from "@/lib/utils";
import type { ThemeConfig } from "@/lib/theme-config";

interface RechercheProduit { id: string; nom: string; prix: number; image: string | null }
interface Props { tenant: any; cfg: ThemeConfig; slug: string }

export function AtlasNav({ tenant, cfg, slug }: Props) {
  const c = cfg.colors;
  const totalItems = useCartStore((s) => s.totalItems());
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [query, setQuery] = useState("");
  const [resultats, setResultats] = useState<RechercheProduit[]>([]);
  const [dropdownOuvert, setDropdownOuvert] = useState(false);
  const [devise, setDevise] = useState(tenant.devise || "XAF");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  async function chercher(q: string) {
    if (q.trim().length < 2) { setResultats([]); setDropdownOuvert(false); return; }
    try {
      const res = await fetch(`/api/storefront/${slug}/recherche?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResultats(data.produits || []);
      if (data.devise) setDevise(data.devise);
      setDropdownOuvert(true);
    } catch { /* la soumission classique reste le repli */ }
  }
  function onQueryChange(v: string) { setQuery(v); if (debounceRef.current) clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => chercher(v), 250); }
  useEffect(() => {
    function onClickOutside(e: MouseEvent) { if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) setDropdownOuvert(false); }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const collections: Array<{ slug: string; nom: string }> = tenant.collections || [];
  const navLinks = [
    { label: "Produits", href: `/${slug}/produits` },
    ...collections.slice(0, 4).map((col) => ({ label: col.nom, href: `/${slug}/collections/${col.slug}` })),
    ...(cfg.aboutPage?.actif ? [{ label: "À propos", href: `/${slug}/a-propos` }] : []),
    ...(cfg.contactPage?.actif ? [{ label: "Contact", href: `/${slug}/contact` }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between backdrop-blur-md" style={{ padding: "20px 4vw", backgroundColor: `${c.fond}e6`, borderBottom: `1px solid ${c.bordure}` }}>
      <Link href={`/${slug}`} className="text-[21px] font-extrabold">
        {tenant.logoUrl ? <img src={tenant.logoUrl} alt={tenant.nomBoutique} className="h-8 object-contain" /> : tenant.nomBoutique}
      </Link>
      <nav className="hidden md:flex">
        <ul className="flex gap-7 list-none text-sm font-semibold">{navLinks.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul>
      </nav>
      <div className="flex items-center gap-4 text-[12.5px] font-mono">
        <div className="hidden sm:block relative" ref={searchBoxRef}>
          <input value={query} onChange={(e) => onQueryChange(e.target.value)} onFocus={() => resultats.length && setDropdownOuvert(true)}
            placeholder="RECHERCHE" className="w-28 focus:w-44 transition-all bg-transparent outline-none border-b uppercase" style={{ borderColor: c.texteMuted, color: c.texte }} />
          {dropdownOuvert && resultats.length > 0 && (
            <div className="absolute top-full right-0 mt-3 w-72 z-50" style={{ backgroundColor: c.fond, border: `1px solid ${c.bordure}` }}>
              {resultats.map((p) => (
                <Link key={p.id} href={`/${slug}/produits/${p.id}`} onClick={() => setDropdownOuvert(false)} className="flex items-center gap-3 px-3 py-2.5 normal-case" style={{ borderBottom: `1px solid ${c.bordure}` }}>
                  <div className="w-10 h-10 flex-shrink-0 overflow-hidden" style={{ backgroundColor: c.surface }}>{p.image && <img src={p.image} alt="" className="w-full h-full object-cover" />}</div>
                  <div className="min-w-0 flex-1"><p className="text-[12.5px] truncate">{p.nom}</p><p className="text-[11.5px]" style={{ color: c.texteMuted }}>{formatMontant(p.prix, devise)}</p></div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <span className="hidden sm:inline">COMPTE</span>
        <Link href={`/${slug}/panier`} className="px-4 py-2" style={{ backgroundColor: c.texte, color: c.fond }}>PANIER ({totalItems})</Link>
        <button className="md:hidden" onClick={() => setMenuOuvert((v) => !v)} aria-label="Menu">☰</button>
      </div>
      {menuOuvert && (
        <div className="md:hidden absolute top-full left-0 right-0 z-40 flex flex-col gap-1 py-4 px-6" style={{ backgroundColor: c.fond, borderBottom: `1px solid ${c.bordure}` }}>
          {navLinks.map((l) => <Link key={l.href} href={l.href} onClick={() => setMenuOuvert(false)} className="py-2.5 text-sm font-semibold">{l.label}</Link>)}
        </div>
      )}
    </header>
  );
}
