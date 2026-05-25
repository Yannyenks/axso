"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function NavbarMarketing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100/80" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center flex-shrink-0">
            <img src="/logo.png" alt="axso" style={{ height: "52px", width: "auto", objectFit: "contain" }} />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Fonctionnalités", href: "#features" },
              { label: "Thèmes", href: "#themes" },
              { label: "Tarifs", href: "#tarifs" },
              { label: "À propos", href: "#about" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/connexion" className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 transition-colors">
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="text-sm font-bold px-5 py-2.5 rounded-xl bg-[#F5A623] text-white hover:bg-[#D4911A] transition-all shadow-lg shadow-[#F5A623]/30 hover:shadow-[#F5A623]/50 hover:scale-105 active:scale-95"
            >
              Créer ma boutique →
            </Link>
          </div>

          <button onClick={() => setMenuOuvert(!menuOuvert)} className="md:hidden p-2 text-gray-600 hover:text-gray-900">
            {menuOuvert ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div className={`md:hidden overflow-hidden transition-all duration-300 bg-white border-t border-gray-100 ${menuOuvert ? "max-h-72 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 py-4 space-y-1">
          {["Fonctionnalités", "Thèmes", "Tarifs"].map((l) => (
            <button key={l} onClick={() => setMenuOuvert(false)} className="block w-full text-left px-3 py-3 text-sm font-medium text-gray-600 hover:text-[#F5A623] hover:bg-amber-50 rounded-xl transition-all">
              {l}
            </button>
          ))}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <Link href="/connexion" onClick={() => setMenuOuvert(false)} className="block text-center py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
              Se connecter
            </Link>
            <Link href="/inscription" onClick={() => setMenuOuvert(false)} className="block text-center py-3 text-sm font-bold bg-[#F5A623] text-white rounded-xl shadow-md shadow-[#F5A623]/30">
              Créer ma boutique
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
