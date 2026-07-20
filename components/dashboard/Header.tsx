"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Bell, ChevronDown, LogOut, Settings, User, ExternalLink } from "lucide-react";
import { signOut } from "next-auth/react";
import { initiales } from "@/lib/utils";
import type { Session } from "next-auth";

interface HeaderProps {
  session: Session;
  boutiqueSlug?: string;
  boutiqueNom?: string;
}

export function Header({ session, boutiqueSlug, boutiqueNom }: HeaderProps) {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef  = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const nom   = session.user?.name || "Marchand";
  const urlLocale = boutiqueSlug ? `/${boutiqueSlug}` : null;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 h-14 gap-4">

      {/* Search */}
      <div className="flex items-center gap-2 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl px-3 py-2 w-56 focus-within:border-[#CCCCCC] transition-colors">
        <Search size={13} className="text-[#AAAAAA] flex-shrink-0" />
        <input
          type="text"
          placeholder="Rechercher…"
          className="bg-transparent text-[13px] text-[#111111] placeholder:text-[#BBBBBB] outline-none w-full"
        />
      </div>

      {/* Center logo */}
      <Link href="/dashboard" className="absolute left-1/2 -translate-x-1/2">
        <img src="/logo.png" alt="axso" className="h-8 w-auto object-contain" />
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-2">

        {/* Boutique link */}
        {urlLocale && (
          <a
            href={urlLocale} target="_blank" rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 text-[12px] font-medium text-[#666666] border border-[#E8E8E8] rounded-xl px-3 py-1.5 hover:border-[#CCCCCC] hover:text-[#111111] transition-all bg-white"
          >
            <ExternalLink size={11} />
            {boutiqueNom ? boutiqueNom.slice(0, 14) : "Ma boutique"}
          </a>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); }}
            className="relative w-8 h-8 rounded-xl bg-[#F5F5F5] border border-[#E8E8E8] flex items-center justify-center text-[#666666] hover:text-[#111111] hover:border-[#CCCCCC] transition-all"
          >
            <Bell size={14} />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#F5A623] rounded-full text-white text-[8px] font-bold flex items-center justify-center">3</span>
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-10 w-76 bg-white border border-[#E8E8E8] rounded-2xl shadow-lg z-50 overflow-hidden" style={{ width: 300 }}>
              <div className="px-4 py-3 border-b border-[#F3F3F3] flex items-center justify-between">
                <p className="text-[13px] font-semibold text-[#111111]">Notifications</p>
                <span className="text-[11px] font-medium text-[#F5A623]">3 nouvelles</span>
              </div>
              <div className="divide-y divide-[#F8F8F8]">
                {[
                  { icon: "🛍️", msg: "Nouvelle commande reçue", time: "Il y a 2 min" },
                  { icon: "💰", msg: "Paiement confirmé — 25 000 XOF", time: "Il y a 15 min" },
                  { icon: "⭐", msg: "Nouvel avis 5 étoiles", time: "Il y a 1h" },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-[#F9F9F9] cursor-pointer transition-colors">
                    <span className="text-sm flex-shrink-0 mt-0.5">{n.icon}</span>
                    <div>
                      <p className="text-[12.5px] text-[#111111]">{n.msg}</p>
                      <p className="text-[11px] text-[#AAAAAA] mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-[#F3F3F3]">
                <button className="text-[11px] font-medium text-[#666666] hover:text-[#111111] transition-colors">
                  Voir toutes les notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl pl-1.5 pr-2.5 py-1 hover:border-[#CCCCCC] transition-all"
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold bg-[#111111]">
              {initiales(nom)}
            </div>
            <span className="hidden sm:block text-[12px] font-medium text-[#111111] max-w-[72px] truncate">
              {nom.split(" ")[0]}
            </span>
            <ChevronDown size={11} className="text-[#AAAAAA]" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-[#E8E8E8] rounded-2xl shadow-lg z-50 overflow-hidden p-1.5 space-y-px">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] text-[#666666] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors">
                <User size={13} /> Mon profil
              </button>
              <Link href="/dashboard/parametres"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] text-[#666666] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors"
                onClick={() => setMenuOpen(false)}>
                <Settings size={13} /> Paramètres
              </Link>
              {urlLocale && (
                <a href={urlLocale} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] text-[#666666] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors">
                  <ExternalLink size={13} /> Voir la boutique
                </a>
              )}
              <div className="border-t border-[#F3F3F3] my-1" />
              <button
                onClick={() => signOut({ callbackUrl: "/connexion" })}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
              >
                <LogOut size={13} /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
