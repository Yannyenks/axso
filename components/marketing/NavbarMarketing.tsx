"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function NavbarMarketing() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const LIENS = [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Thèmes", href: "#themes" },
    { label: "Tarifs", href: "#tarifs" },
    { label: "Témoignages", href: "#temoignages" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center"
      style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif", paddingTop: "16px" }}
    >
      {/* ── Pill container ── */}
      <div
        className="w-full transition-all duration-500"
        style={{ maxWidth: "1100px", padding: "0 16px" }}
      >
        <div
          className="flex items-center justify-between transition-all duration-500"
          style={{
            background: "white",
            borderRadius: "999px",
            padding: "10px 20px 10px 16px",
            boxShadow: scrolled
              ? "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)"
              : "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <img
              src="/logo.png"
              alt="Axso"
              style={{ height: "52px", width: "auto", objectFit: "contain" }}
            />
          </Link>

          {/* Links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {LIENS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100/70 transition-all"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* CTA — desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/connexion"
              className="px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: "#111",
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
              }}
            >
              Créer ma boutique
            </Link>
          </div>

          {/* Burger — mobile */}
          <button
            onClick={() => setMenuOuvert(!menuOuvert)}
            className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all"
          >
            {menuOuvert ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu — drops below the pill */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${menuOuvert ? "max-h-80 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"}`}
        >
          <div
            className="bg-white rounded-3xl shadow-xl p-4 space-y-1"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.10)" }}
          >
            {LIENS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOuvert(false)}
                className="block px-4 py-3 rounded-2xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <Link
                href="/connexion"
                onClick={() => setMenuOuvert(false)}
                className="block text-center py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all"
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                onClick={() => setMenuOuvert(false)}
                className="block text-center py-3 text-sm font-bold text-white rounded-2xl"
                style={{ background: "#111" }}
              >
                Créer ma boutique
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
