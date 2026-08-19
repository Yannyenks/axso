"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Home, ShoppingCart, Package, Users, DollarSign,
  TrendingUp, Store, Settings2, X,
  Download, FileText, RotateCcw, Monitor,
  Star, Truck, CreditCard, Wallet,
  Megaphone, PieChart, MessageSquare, Calendar,
  BarChart3, Layers, Plug, Bell, Link2,
  Box, Map, UserCheck, LayoutGrid,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  Icon: React.ElementType;
  badge?: boolean;
  exact?: boolean;
  excludePrefix?: string;
}

interface Group {
  id: string;
  label: string;
  Icon: React.ElementType;
  gradient: string;
  color: string;
  items: NavItem[];
}

// ─── Structure de navigation ──────────────────────────────────────────────────
const GROUPS: Group[] = [
  {
    id: "ventes",
    label: "Ventes",
    Icon: ShoppingCart,
    color: "#F5A623",
    gradient: "linear-gradient(135deg,#F5A623 0%,#D4911A 100%)",
    items: [
      { href: "/dashboard/commandes",   label: "Commandes",       Icon: ShoppingCart, badge: true },
      { href: "/dashboard/pos",          label: "Point de vente",  Icon: Monitor },
      { href: "/dashboard/factures",     label: "Factures",        Icon: FileText },
      { href: "/dashboard/retours",      label: "Retours",         Icon: RotateCcw },
    ],
  },
  {
    id: "catalogue",
    label: "Catalogue",
    Icon: Package,
    color: "#1B2A4A",
    gradient: "linear-gradient(135deg,#3a5480 0%,#1B2A4A 100%)",
    items: [
      { href: "/dashboard/produits",         label: "Produits",          Icon: Package,   excludePrefix: "/dashboard/produits/digital" },
      { href: "/dashboard/produits/digital", label: "Produits Digitaux", Icon: Download },
      { href: "/dashboard/dropshipping",     label: "Dropshipping",      Icon: Layers },
      { href: "/dashboard/sourcing",         label: "Sourcing",          Icon: Map },
      { href: "/dashboard/entrepots",        label: "Entrepôts",         Icon: Box },
    ],
  },
  {
    id: "clients",
    label: "Clients",
    Icon: Users,
    color: "#7c3aed",
    gradient: "linear-gradient(135deg,#a78bfa 0%,#7c3aed 100%)",
    items: [
      { href: "/dashboard/clients",  label: "Clients",       Icon: Users },
      { href: "/dashboard/avis",     label: "Avis clients",  Icon: Star },
      { href: "/dashboard/whatsapp", label: "WhatsApp",      Icon: MessageSquare, badge: true },
      { href: "/dashboard/livreurs", label: "Livreurs",      Icon: Truck },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    Icon: DollarSign,
    color: "#15803d",
    gradient: "linear-gradient(135deg,#4ade80 0%,#15803d 100%)",
    items: [
      { href: "/dashboard/revenus",     label: "Revenus",     Icon: BarChart3 },
      { href: "/dashboard/paiements",   label: "Paiements",   Icon: CreditCard },
      { href: "/dashboard/wallet",      label: "Wallet",      Icon: Wallet },
      { href: "/dashboard/affiliation", label: "Affiliation", Icon: UserCheck },
    ],
  },
  {
    id: "croissance",
    label: "Croissance",
    Icon: TrendingUp,
    color: "#be123c",
    gradient: "linear-gradient(135deg,#fb7185 0%,#be123c 100%)",
    items: [
      { href: "/dashboard/marketing",  label: "Marketing",          Icon: Megaphone },
      { href: "/dashboard/analytics",  label: "Analytics",          Icon: PieChart },
      { href: "/dashboard/publicite",  label: "Publicités Ads",     Icon: TrendingUp },
      { href: "/dashboard/messages",   label: "Axsocial",           Icon: MessageSquare, badge: true },
      { href: "/dashboard/scheduler",  label: "Planificateur",      Icon: Calendar },
      { href: "/dashboard/veille",     label: "Veille concurrente", Icon: BarChart3 },
    ],
  },
  {
    id: "boutique",
    label: "Boutique",
    Icon: Store,
    color: "#0284c7",
    gradient: "linear-gradient(135deg,#38bdf8 0%,#0284c7 100%)",
    items: [
      { href: "/dashboard/boutique",      label: "Ma boutique",    Icon: Store },
      { href: "/dashboard/builder",       label: "Constructeur",   Icon: LayoutGrid },
      { href: "/dashboard/transporteurs", label: "Transporteurs",  Icon: Truck },
      { href: "/dashboard/connecteurs",   label: "Connecteurs",    Icon: Plug },
      { href: "/dashboard/feeds",         label: "Flux produits",  Icon: Link2 },
      { href: "/dashboard/campagnes",     label: "Campagnes",      Icon: Bell },
    ],
  },
  {
    id: "parametres",
    label: "Paramètres",
    Icon: Settings2,
    color: "#475569",
    gradient: "linear-gradient(135deg,#94a3b8 0%,#475569 100%)",
    items: [
      { href: "/dashboard/abonnement", label: "Abonnement", Icon: CreditCard },
      { href: "/dashboard/parametres", label: "Paramètres", Icon: Settings2 },
    ],
  },
];

const MAIN_GROUPS  = GROUPS.filter(g => g.id !== "parametres");
const BOTTOM_GROUP = GROUPS.find(g => g.id === "parametres")!;

// ─── Component ────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Sélectionne automatiquement le bon groupe au chargement initial
  useEffect(() => {
    const match = GROUPS.find(g =>
      g.items.some(i => {
        if (i.excludePrefix && pathname.startsWith(i.excludePrefix)) return false;
        if (i.exact) return pathname === i.href;
        return i.href !== "/dashboard" && pathname.startsWith(i.href);
      })
    );
    if (match) setActiveGroup(match.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isItemActive = (item: NavItem) => {
    if (item.excludePrefix && pathname.startsWith(item.excludePrefix)) return false;
    if (item.exact) return pathname === item.href;
    return item.href !== "/dashboard" ? pathname.startsWith(item.href) : pathname === item.href;
  };

  const isGroupHasActive = (g: Group) => g.items.some(isItemActive);

  const currentGroup = GROUPS.find(g => g.id === activeGroup) ?? null;

  const toggleGroup = (id: string) =>
    setActiveGroup(prev => (prev === id ? null : id));

  return (
    <aside
      className="flex h-screen flex-shrink-0"
      style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}
    >
      {/* ════════════════════════════════════════════════════════════
          RAIL — 64 px, toujours visible
      ════════════════════════════════════════════════════════════ */}
      <div className="w-[64px] flex flex-col bg-white border-r border-gray-100 shadow-sm flex-shrink-0 relative z-10">

        {/* Logo */}
        <div className="h-[56px] flex items-center justify-center border-b border-gray-100 flex-shrink-0">
          <img
            src="/logo-icon.png"
            alt="Axso"
            className="w-8 h-8 object-contain"
            onError={e => { (e.currentTarget as HTMLImageElement).src = ""; }}
          />
        </div>

        {/* Accueil — lien direct, pas de sous-panel */}
        <div className="px-2 pt-3 pb-1">
          <Link
            href="/dashboard"
            title="Accueil"
            className={cn(
              "flex flex-col items-center justify-center w-full py-2.5 rounded-2xl transition-all duration-150 group",
              pathname === "/dashboard" ? "bg-[#1B2A4A]/8" : "hover:bg-gray-50"
            )}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#3a5480 0%,#1B2A4A 100%)" }}
            >
              <Home size={16} className="text-white" />
            </div>
            <span className="text-[9px] mt-1.5 font-semibold text-gray-400 group-hover:text-gray-600 leading-none">
              Accueil
            </span>
          </Link>
        </div>

        <div className="mx-3 border-t border-gray-100 mb-1" />

        {/* Groupes principaux */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {MAIN_GROUPS.map(g => {
            const isOpen    = activeGroup === g.id;
            const hasActive = isGroupHasActive(g);

            return (
              <button
                key={g.id}
                type="button"
                title={g.label}
                onClick={() => toggleGroup(g.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full py-2.5 rounded-2xl transition-all duration-150 group",
                  isOpen    ? "bg-gray-100/80"  :
                  hasActive ? "bg-gray-50"       : "hover:bg-gray-50"
                )}
              >
                {/* Indicateur de page active quand panel fermé */}
                {hasActive && !isOpen && (
                  <span
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
                    style={{ background: g.color }}
                  />
                )}

                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-150 group-hover:scale-105"
                  style={{
                    background: isOpen || hasActive
                      ? g.gradient
                      : "linear-gradient(135deg,#e5e7eb,#d1d5db)",
                  }}
                >
                  <g.Icon size={16} className="text-white" />
                </div>
                <span className={cn(
                  "text-[9px] mt-1.5 font-semibold leading-none",
                  isOpen    ? "text-gray-700"  :
                  hasActive ? "text-gray-600"  : "text-gray-400 group-hover:text-gray-600"
                )}>
                  {g.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Paramètres — fixé en bas */}
        <div className="px-2 pb-3 pt-2 border-t border-gray-100 flex-shrink-0">
          {(() => {
            const g = BOTTOM_GROUP;
            const isOpen    = activeGroup === g.id;
            const hasActive = isGroupHasActive(g);
            return (
              <button
                type="button"
                title={g.label}
                onClick={() => toggleGroup(g.id)}
                className={cn(
                  "flex flex-col items-center justify-center w-full py-2.5 rounded-2xl transition-all duration-150 group",
                  isOpen ? "bg-gray-100/80" : "hover:bg-gray-50"
                )}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-150 group-hover:scale-105"
                  style={{ background: isOpen || hasActive ? g.gradient : "linear-gradient(135deg,#e5e7eb,#d1d5db)" }}
                >
                  <g.Icon size={16} className="text-white" />
                </div>
                <span className={cn(
                  "text-[9px] mt-1.5 font-semibold leading-none",
                  isOpen ? "text-gray-700" : "text-gray-400 group-hover:text-gray-600"
                )}>
                  {g.label}
                </span>
              </button>
            );
          })()}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          SOUS-PANEL — 196 px, apparaît/disparaît par transition CSS
      ════════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          "flex flex-col bg-white border-r border-gray-100 overflow-hidden flex-shrink-0",
          "transition-[width] duration-200 ease-in-out"
        )}
        style={{ width: activeGroup ? "196px" : "0px" }}
      >
        {currentGroup && (
          <>
            {/* En-tête du panel */}
            <div className="h-[56px] flex items-center justify-between px-3.5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: currentGroup.gradient }}
                >
                  <currentGroup.Icon size={12} className="text-white" />
                </div>
                <span className="text-[10.5px] font-black uppercase tracking-[0.18em] text-gray-600 truncate">
                  {currentGroup.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveGroup(null)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all flex-shrink-0"
              >
                <X size={13} />
              </button>
            </div>

            {/* Liste des sous-items */}
            <nav
              className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {currentGroup.items.map(item => {
                const actif = isItemActive(item);
                const ItemIcon = item.Icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-100 group whitespace-nowrap",
                      actif ? "bg-[#FFF3DC]" : "hover:bg-gray-50"
                    )}
                  >
                    {/* Icône de l'item */}
                    <div
                      className="w-[26px] h-[26px] rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        background: actif
                          ? currentGroup.gradient
                          : "transparent",
                      }}
                    >
                      <ItemIcon
                        size={13}
                        className={cn(
                          "transition-colors",
                          actif
                            ? "text-white"
                            : "text-gray-400 group-hover:text-gray-600"
                        )}
                      />
                    </div>

                    <span className={cn(
                      "text-[12px] font-medium flex-1 truncate",
                      actif
                        ? "text-[#B4740A] font-semibold"
                        : "text-gray-500 group-hover:text-gray-800"
                    )}>
                      {item.label}
                    </span>

                    {item.badge && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: currentGroup.color }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </>
        )}
      </div>
    </aside>
  );
}
