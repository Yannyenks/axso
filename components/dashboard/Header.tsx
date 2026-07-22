"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Bell, ChevronDown, LogOut, Settings, User, ExternalLink, Store } from "lucide-react";
import { signOut } from "next-auth/react";
import { initiales } from "@/lib/utils";
import type { Session } from "next-auth";

interface HeaderProps {
  session: Session;
  boutiqueSlug?: string;
  boutiqueNom?: string;
}

export function Header({ session, boutiqueSlug, boutiqueNom }: HeaderProps) {
  const [menuOuvert, setMenuOuvert]   = useState(false);
  const [notifOuvert, setNotifOuvert] = useState(false);
  const [scrolled, setScrolled]       = useState(false);

  const nom   = session.user?.name || "Marchand";
  const email = session.user?.email || "";
  const urlLocale = boutiqueSlug ? `/${boutiqueSlug}` : null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="sticky top-0 z-40 flex justify-center px-4 pt-3 pb-2"
      style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}
    >
      {/* ── Pill container ── */}
      <div
        className="w-full flex items-center justify-between transition-all duration-500"
        style={{
          background: "rgba(255,255,255,0.97)",
          borderRadius: "999px",
          padding: "8px 16px 8px 12px",
          backdropFilter: "blur(20px)",
          boxShadow: scrolled
            ? "0 8px 40px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)"
            : "0 4px 24px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* ── Gauche : Recherche ── */}
        <div className="flex items-center gap-2.5 bg-gray-50/80 border border-gray-200/80 rounded-full px-3.5 py-2 w-52 focus-within:border-gray-300 focus-within:bg-white transition-all">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Rechercher…"
            className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
          />
        </div>

        {/* ── Centre : Logo ── */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <Link href="/dashboard">
            <img
              src="/logo.png"
              alt="Axso"
              style={{
                height: "54px",
                width: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))",
              }}
            />
          </Link>
        </div>

        {/* ── Droite : Actions ── */}
        <div className="flex items-center gap-2">
          {/* Boutique */}
          {urlLocale && (
            <a
              href={urlLocale}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 bg-[#F5A623]/8 border border-[#F5A623]/25 text-[#F5A623] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#F5A623]/15 transition-all"
            >
              <Store size={12} />
              {boutiqueNom ? boutiqueNom.slice(0, 12) : "Ma boutique"}
              <ExternalLink size={10} />
            </a>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOuvert(!notifOuvert); setMenuOuvert(false); }}
              className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#F5A623] hover:border-[#F5A623]/30 transition-all relative"
            >
              <Bell size={14} />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#F5A623] rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                3
              </span>
            </button>

            {notifOuvert && (
              <div className="absolute right-0 top-11 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="text-gray-900 font-semibold text-sm">Notifications</h4>
                  <span className="text-xs text-[#F5A623] font-medium">3 nouvelles</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { icon: "🛍️", msg: "Nouvelle commande reçue", temps: "Il y a 2 min" },
                    { icon: "💰", msg: "Paiement confirmé 25 000 XOF", temps: "Il y a 15 min" },
                    { icon: "⭐", msg: "Nouvel avis 5 étoiles", temps: "Il y a 1h" },
                  ].map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                      <span className="text-sm flex-shrink-0">{n.icon}</span>
                      <div>
                        <p className="text-gray-700 text-sm">{n.msg}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{n.temps}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setMenuOuvert(!menuOuvert); setNotifOuvert(false); }}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-1 pr-2.5 py-1 hover:border-gray-300 hover:bg-gray-100/50 transition-all"
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[#1B2A4A] text-[10px] font-bold"
                style={{ background: "linear-gradient(135deg, #F5A623, #d97706)" }}>
                {initiales(nom)}
              </div>
              <span className="hidden sm:block text-gray-700 text-xs font-semibold max-w-[80px] truncate">
                {nom.split(" ")[0]}
              </span>
              <ChevronDown size={11} className="text-gray-400" />
            </button>

            {menuOuvert && (
              <div className="absolute right-0 top-11 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-2 space-y-0.5">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm transition-colors">
                    <User size={14} /> Mon profil
                  </button>
                  <Link href="/dashboard/parametres"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm transition-colors">
                    <Settings size={14} /> Paramètres
                  </Link>
                  {urlLocale && (
                    <a href={urlLocale} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm transition-colors">
                      <ExternalLink size={14} /> Voir la boutique
                    </a>
                  )}
                  <hr className="border-gray-100 my-1" />
                  <button
                    onClick={() => signOut({ callbackUrl: "/connexion" })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 text-sm transition-colors"
                  >
                    <LogOut size={14} /> Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
