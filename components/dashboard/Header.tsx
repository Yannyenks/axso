"use client";
import { useState } from "react";
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
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [notifOuvert, setNotifOuvert] = useState(false);

  const nom = session.user?.name || "Marchand";
  const email = session.user?.email || "";
  const urlLocale = boutiqueSlug ? `/${boutiqueSlug}` : null;
  const urlProd = boutiqueSlug ? `${boutiqueSlug}.axso.africa` : null;

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
      {/* Search */}
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-64 focus-within:border-[#F5A623]/50 focus-within:bg-white transition-all">
        <Search size={15} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Rechercher…"
          className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
        />
      </div>

      <div className="flex items-center gap-2.5">
        {/* Voir boutique */}
        {urlLocale && (
          <a
            href={urlLocale}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 bg-[#F5A623]/8 border border-[#F5A623]/25 text-[#F5A623] text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-[#F5A623]/15 transition-all"
          >
            <Store size={13} />
            Ma boutique
            <ExternalLink size={11} />
          </a>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOuvert(!notifOuvert); setMenuOuvert(false); }}
            className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#F5A623] hover:border-[#F5A623]/30 hover:bg-amber-50 transition-all relative"
          >
            <Bell size={15} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F5A623] rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
              3
            </span>
          </button>

          {notifOuvert && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-gray-900 font-semibold text-sm">Notifications</h4>
                <span className="text-xs text-[#F5A623] font-medium">3 nouvelles</span>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { icon: "🛍️", msg: "Nouvelle commande #AX-2024-1247", temps: "Il y a 2 min" },
                  { icon: "💰", msg: "Paiement confirmé 25 000 XOF", temps: "Il y a 15 min" },
                  { icon: "⭐", msg: "Nouvel avis 5 étoiles sur Robe Wax", temps: "Il y a 1h" },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors">
                    <span className="text-base flex-shrink-0 mt-0.5">{n.icon}</span>
                    <div>
                      <p className="text-gray-700 text-sm">{n.msg}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{n.temps}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-100">
                <button className="w-full text-center text-[#F5A623] text-xs font-semibold hover:underline">
                  Voir toutes les notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setMenuOuvert(!menuOuvert); setNotifOuvert(false); }}
            className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 hover:border-[#F5A623]/30 hover:bg-amber-50/50 transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-[#F5A623] flex items-center justify-center text-[#1B2A4A] text-xs font-bold shadow-sm">
              {initiales(nom)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-gray-800 text-xs font-semibold">{nom}</p>
              <p className="text-gray-400 text-[10px]">{email.slice(0, 22)}</p>
            </div>
            <ChevronDown size={13} className="text-gray-400" />
          </button>

          {menuOuvert && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
              {urlProd && (
                <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                  <p className="text-amber-700 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Votre boutique</p>
                  <p className="text-[#F5A623] text-xs font-mono truncate">{urlProd}</p>
                </div>
              )}
              <div className="p-2 space-y-0.5">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm transition-colors">
                  <User size={14} /> Mon profil
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm transition-colors">
                  <Settings size={14} /> Paramètres
                </button>
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
    </header>
  );
}
