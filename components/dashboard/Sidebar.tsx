"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Store, Paintbrush, Package, Layers,
  ShoppingBag, Users, MessageCircle, Wallet, TrendingUp,
  Megaphone, Globe2, Film, Globe, Truck, BarChart3,
  Plug, CreditCard, Settings, ChevronLeft, ChevronRight,
  Star, Bike, Search, Calendar, Package2, Radio, Bot,
} from "lucide-react";

const NAV = [
  {
    group: "Intelligence",
    items: [
      { href: "/dashboard/axia",       label: "AXIA IA",       Icon: Bot, accent: true },
    ],
  },
  {
    group: "Boutique",
    items: [
      { href: "/dashboard",            label: "Accueil",       Icon: LayoutDashboard, exact: true },
      { href: "/dashboard/boutique",   label: "Ma boutique",   Icon: Store },
      { href: "/dashboard/builder",    label: "Constructeur",  Icon: Paintbrush },
      { href: "/dashboard/produits",   label: "Produits",      Icon: Package },
      { href: "/dashboard/sourcing",   label: "Sourcing",      Icon: Layers },
      { href: "/dashboard/commandes",  label: "Commandes",     Icon: ShoppingBag, dot: true },
      { href: "/dashboard/clients",    label: "Clients",       Icon: Users },
      { href: "/dashboard/whatsapp",   label: "WhatsApp",      Icon: MessageCircle, dot: true },
    ],
  },
  {
    group: "Finance",
    items: [
      { href: "/dashboard/wallet",     label: "Wallet",        Icon: Wallet, accent: true },
      { href: "/dashboard/revenus",    label: "Revenus",       Icon: TrendingUp },
      { href: "/dashboard/paiements",  label: "Paiements",     Icon: CreditCard },
    ],
  },
  {
    group: "Croissance",
    items: [
      { href: "/dashboard/marketing",  label: "Marketing",     Icon: Megaphone },
      { href: "/dashboard/messages",   label: "Social",        Icon: Globe2, dot: true },
      { href: "/dashboard/studio",     label: "Studio",        Icon: Film },
      { href: "/dashboard/scheduler",  label: "Planificateur", Icon: Calendar },
      { href: "/dashboard/publicite",  label: "Publicité",     Icon: Radio },
      { href: "/dashboard/veille",     label: "Veille",        Icon: Search },
    ],
  },
  {
    group: "Opérations",
    items: [
      { href: "/dashboard/livraison",  label: "Livraisons",    Icon: Truck },
      { href: "/dashboard/livreurs",   label: "Livreurs",      Icon: Bike },
      { href: "/dashboard/dropshipping",label: "Dropshipping", Icon: Package2 },
      { href: "/dashboard/analytics",  label: "Analytics",     Icon: BarChart3 },
      { href: "/dashboard/avis",       label: "Avis",          Icon: Star },
    ],
  },
  {
    group: "Système",
    items: [
      { href: "/dashboard/connecteurs",label: "Connecteurs",   Icon: Plug },
      { href: "/dashboard/abonnement", label: "Abonnement",    Icon: CreditCard },
      { href: "/dashboard/parametres", label: "Paramètres",    Icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const active = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className="flex flex-col bg-white border-r border-[#E8E8E8] transition-all duration-300 relative flex-shrink-0"
      style={{ width: collapsed ? 60 : 220 }}
    >
      {/* Brand */}
      <div className="flex items-center border-b border-[#E8E8E8] px-3 py-3" style={{ minHeight: 56 }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="axso" className="w-5 h-5 object-contain invert" />
          </div>
          {!collapsed && (
            <span className="text-[13px] font-black tracking-tight text-[#111111] truncate">axso</span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "none" }}>
        {NAV.map((section) => (
          <div key={section.group} className="mb-1">
            {!collapsed && (
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#BBBBBB] px-4 pt-3 pb-1">
                {section.group}
              </p>
            )}
            {collapsed && <div className="mx-3 my-1 border-t border-[#F0F0F0]" />}

            <div className="px-2 space-y-px">
              {section.items.map(({ href, label, Icon, exact = false, dot = false, accent = false }: any) => {
                const on = active(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-100 group relative"
                    style={{
                      background: on ? "#F5F5F5" : "transparent",
                      color: on ? "#111111" : "#888888",
                    }}
                  >
                    {on && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#111111] rounded-r-full" />
                    )}
                    <Icon
                      size={16}
                      strokeWidth={on ? 2.2 : 1.8}
                      className="flex-shrink-0 transition-colors"
                      style={{ color: on ? "#111111" : accent ? "#F5A623" : "inherit" }}
                    />
                    {!collapsed && (
                      <span
                        className="text-[12.5px] truncate flex-1 transition-colors"
                        style={{ fontWeight: on ? 600 : 450 }}
                      >
                        {label}
                      </span>
                    )}
                    {!collapsed && dot && !on && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623] flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-14 w-6 h-6 bg-white border border-[#E8E8E8] rounded-full flex items-center justify-center text-[#AAAAAA] hover:text-[#111111] hover:border-[#CCCCCC] transition-all z-10 shadow-sm"
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
}
