"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  IconAxia, IconAccueil, IconBoutique, IconBuilder, IconProduits,
  IconCommandes, IconClients, IconWallet, IconRevenus,
  IconMarketing, IconMessages, IconContenus, IconNavigateur, IconLivraisons,
  IconAnalytics, IconConnecteurs, IconAbonnement, IconParametres, IconIA,
  IconWhatsApp, IconAvis, IconPaiements, IconSourcing, IconThemes,
} from "./AppIcons";

const NAV_GROUPS = [
  {
    label: "Boutique",
    items: [
      { href: "/dashboard",           label: "Accueil",      Icone: IconAccueil,    exact: true },
      { href: "/dashboard/boutique",  label: "Ma boutique",  Icone: IconBoutique },
      { href: "/dashboard/builder",   label: "Constructeur", Icone: IconBuilder },
      { href: "/dashboard/produits",  label: "Produits",     Icone: IconProduits },
      { href: "/dashboard/commandes", label: "Commandes",    Icone: IconCommandes,  badge: true },
      { href: "/dashboard/clients",   label: "Clients",      Icone: IconClients },
      { href: "/dashboard/whatsapp",  label: "WhatsApp",     Icone: IconWhatsApp,   badge: true },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/dashboard/wallet",    label: "Wallet",       Icone: IconWallet,     highlight: true },
      { href: "/dashboard/revenus",   label: "Revenus",      Icone: IconRevenus },
    ],
  },
  {
    label: "Croissance",
    items: [
      { href: "/dashboard/marketing", label: "Marketing",    Icone: IconMarketing },
      { href: "/dashboard/messages",  label: "Axsocial",     Icone: IconMessages,   badge: true },
      { href: "/dashboard/studio",    label: "Contenus",     Icone: IconContenus },
      { href: "/dashboard/navigateur",label: "Navigateur",   Icone: IconNavigateur },
    ],
  },
  {
    label: "Opérations",
    items: [
      { href: "/dashboard/logistique",    label: "Logistique",   Icone: IconLivraisons },
      { href: "/dashboard/dropshipping",  label: "Dropshipping", Icone: IconSourcing },
      { href: "/dashboard/affiliation",   label: "Affiliation",  Icone: IconRevenus },
      { href: "/dashboard/campagnes",     label: "Campagnes",    Icone: IconThemes },
      { href: "/dashboard/analytics",     label: "Analytics",    Icone: IconAnalytics },
    ],
  },
  {
    label: "Système",
    items: [
      { href: "/dashboard/connecteurs",   label: "Connecteurs",  Icone: IconConnecteurs },
      { href: "/dashboard/abonnement",    label: "Abonnement",   Icone: IconAbonnement },
      { href: "/dashboard/parametres",    label: "Paramètres",   Icone: IconParametres },
    ],
  },
];

export function Sidebar() {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : (href !== "/dashboard" ? pathname.startsWith(href) : pathname === href);

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-gray-100 transition-all duration-300 relative shadow-sm",
        collapsed ? "w-[68px]" : "w-[230px]"
      )}
      style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}
    >
      <nav className="flex-1 py-3 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <p className="text-[9.5px] font-black text-gray-300 uppercase tracking-[0.2em] px-4 pt-3 pb-1.5">
                {group.label}
              </p>
            )}
            {collapsed && <div className="my-1 mx-3 border-t border-gray-100" />}

            <div className="px-2 space-y-0.5">
              {group.items.map((item) => {
                const { Icone } = item;
                const actif    = isActive(item.href, (item as any).exact);
                const isWallet = item.href === "/dashboard/wallet";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all duration-150 group",
                      actif ? "bg-gray-100 shadow-sm" : "hover:bg-gray-50",
                      collapsed && "justify-center"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0 transition-all duration-200",
                      actif ? "scale-95" : "group-hover:scale-105",
                      !actif && "opacity-80 group-hover:opacity-100"
                    )}>
                      <Icone size={collapsed ? 30 : 26} />
                    </div>

                    {!collapsed && (
                      <span className={cn(
                        "text-[12.5px] font-medium flex-1 truncate transition-colors",
                        actif ? "text-gray-900 font-semibold" : "text-gray-500 group-hover:text-gray-800"
                      )}>
                        {item.label}
                      </span>
                    )}

                    {!collapsed && (item as any).badge && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-[#F5A623] flex-shrink-0" />
                    )}
                    {!collapsed && isWallet && !actif && (
                      <Zap size={10} className="text-[#F5A623] ml-auto flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-[#F5A623] hover:border-[#F5A623]/40 transition-all z-10 shadow-sm"
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
}
