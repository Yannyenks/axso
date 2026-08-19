"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Home, ShoppingCart, Monitor, Users, Package, Download,
  Star, Truck, MessageSquare, BarChart3, Megaphone,
  DollarSign, CreditCard, Wallet, Map, Box,
  Settings2, ExternalLink, ArrowLeft, UserCheck,
  LayoutGrid, Plug, Link2, Bell, Store, ChevronRight,
  RotateCcw, FileText,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  Icon: React.ElementType;
  badge?: boolean;
  locked?: boolean;
  exact?: boolean;
  excludePrefix?: string;
}

type Entry = NavItem | { type: "label"; text: string };

export interface SidebarProps {
  boutiqueNom?: string;
  boutiqueSlug?: string;
  userInitials?: string;
}

// ─── Routes boutique ──────────────────────────────────────────────────────────
const BOUTIQUE_ROUTES = [
  "/dashboard/boutique",
  "/dashboard/builder",
  "/dashboard/themes",
  "/dashboard/transporteurs",
  "/dashboard/connecteurs",
  "/dashboard/feeds",
  "/dashboard/campagnes",
];

// ─── Navigation principale ────────────────────────────────────────────────────
const MAIN_NAV: Entry[] = [
  { type: "label", text: "VENTES" },
  { href: "/dashboard",                  label: "Accueil",           Icon: Home,          exact: true },
  { href: "/dashboard/commandes",        label: "Commandes",         Icon: ShoppingCart,  badge: true },
  { href: "/dashboard/pos",              label: "Point de vente",    Icon: Monitor },
  { href: "/dashboard/factures",         label: "Factures",          Icon: FileText },
  { href: "/dashboard/retours",          label: "Retours",           Icon: RotateCcw },

  { type: "label", text: "CLIENTS" },
  { href: "/dashboard/clients",          label: "Clients",           Icon: Users },
  { href: "/dashboard/avis",             label: "Avis clients",      Icon: Star },
  { href: "/dashboard/whatsapp",         label: "WhatsApp",          Icon: MessageSquare, badge: true },
  { href: "/dashboard/livreurs",         label: "Livreurs",          Icon: Truck },

  { type: "label", text: "CATALOGUE" },
  { href: "/dashboard/produits",         label: "Produits",          Icon: Package,       excludePrefix: "/dashboard/produits/digital" },
  { href: "/dashboard/produits/digital", label: "Produits Digitaux", Icon: Download },
  { href: "/dashboard/sourcing",         label: "Sourcing",          Icon: Map },
  { href: "/dashboard/entrepots",        label: "Entrepôts",         Icon: Box },

  { type: "label", text: "CROISSANCE" },
  { href: "/dashboard/analytics",        label: "Analytics",         Icon: BarChart3 },
  { href: "/dashboard/marketing",        label: "Marketing",         Icon: Megaphone },
  { href: "/dashboard/affiliation",      label: "Affiliation",       Icon: UserCheck },

  { type: "label", text: "FINANCE" },
  { href: "/dashboard/revenus",          label: "Revenus",           Icon: DollarSign },
  { href: "/dashboard/paiements",        label: "Paiements",         Icon: CreditCard },
  { href: "/dashboard/wallet",           label: "Wallet",            Icon: Wallet },

  { type: "label", text: "COMPTE" },
  { href: "/dashboard/abonnement",       label: "Abonnement",        Icon: CreditCard },
];

// ─── Navigation boutique ──────────────────────────────────────────────────────
const BOUTIQUE_NAV: NavItem[] = [
  { href: "/dashboard/boutique",         label: "Dashboard",          Icon: Home,         exact: true },
  { href: "/dashboard/commandes",        label: "Commandes",          Icon: ShoppingCart, badge: true },
  { href: "/dashboard/produits",         label: "Produits",           Icon: Package,      excludePrefix: "/dashboard/produits/digital" },
  { href: "/dashboard/themes",           label: "Thèmes",             Icon: LayoutGrid },
  { href: "/dashboard/builder",          label: "Constructeur",       Icon: LayoutGrid },
  { href: "/dashboard/transporteurs",    label: "Transporteurs",      Icon: Truck },
  { href: "/dashboard/connecteurs",      label: "Connecteurs",        Icon: Plug },
  { href: "/dashboard/feeds",            label: "Flux produits",      Icon: Link2 },
  { href: "/dashboard/campagnes",        label: "Campagnes",          Icon: Bell },
  { href: "/dashboard/parametres",       label: "Réglages",           Icon: Settings2 },
];

// ─── Helper active ────────────────────────────────────────────────────────────
function isActive(item: NavItem, pathname: string) {
  if (item.excludePrefix && pathname.startsWith(item.excludePrefix)) return false;
  if (item.exact) return pathname === item.href;
  return item.href !== "/dashboard"
    ? pathname.startsWith(item.href)
    : pathname === item.href;
}

// ─── NavLink ──────────────────────────────────────────────────────────────────
function NavLink({
  item, pathname,
  accent = "#F5A623",
  activeBg = "#FFF7ED",
  activeText = "#92400E",
}: {
  item: NavItem;
  pathname: string;
  accent?: string;
  activeBg?: string;
  activeText?: string;
}) {
  const active = isActive(item, pathname);
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-2.5 px-3 py-[7px] rounded-xl text-[12.5px] font-medium transition-all duration-100 group",
        !active && "hover:bg-gray-50/80"
      )}
      style={active ? { backgroundColor: activeBg, color: activeText } : undefined}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-full"
          style={{ backgroundColor: accent }}
        />
      )}
      <item.Icon
        size={15}
        className="flex-shrink-0 transition-colors"
        style={{ color: active ? accent : "#94A3B8" }}
      />
      <span
        className={cn("flex-1 truncate leading-none", !active && "text-gray-600 group-hover:text-gray-900")}
      >
        {item.label}
      </span>
      {item.badge && (
        <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
      )}
    </Link>
  );
}

// ─── Sidebar principale ────────────────────────────────────────────────────────
function MainSidebar({
  pathname, boutiqueNom, userInitials, onBoutique,
}: {
  pathname: string;
  boutiqueNom?: string;
  userInitials?: string;
  onBoutique: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 flex-shrink-0 border-b border-gray-100">
        <img
          src="/logo.png"
          alt="Axso"
          className="h-[28px] object-contain"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      </div>

      {/* Ma boutique CTA */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={onBoutique}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:brightness-105 active:scale-[0.98] transition-all group"
          style={{ background: "linear-gradient(135deg,#1B2A4A 0%,#2c4270 100%)" }}
        >
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
            <Store size={13} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[11.5px] font-bold text-white leading-tight truncate">
              {boutiqueNom || "Ma boutique"}
            </div>
            <div className="text-[9.5px] text-white/45 leading-none mt-[3px]">Gérer la boutique</div>
          </div>
          <ChevronRight size={12} className="text-white/35 group-hover:text-white/75 flex-shrink-0 transition-colors" />
        </button>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 px-2.5 pb-2 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="space-y-px">
          {MAIN_NAV.map((entry, i) => {
            if ("type" in entry) {
              return (
                <div key={i} className="pt-3 pb-1 px-1">
                  <span className="text-[9.5px] font-bold tracking-[0.12em] text-gray-400/70">
                    {entry.text}
                  </span>
                </div>
              );
            }
            return <NavLink key={entry.href} item={entry} pathname={pathname} />;
          })}
        </div>
      </nav>

      {/* Bottom — paramètres */}
      <div className="border-t border-gray-100 px-3 py-3 flex-shrink-0">
        <Link
          href="/dashboard/parametres"
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all group",
            pathname.startsWith("/dashboard/parametres") ? "bg-[#FFF7ED]" : "hover:bg-gray-50"
          )}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold"
            style={{ background: "linear-gradient(135deg,#F5A623,#D4911A)" }}
          >
            {userInitials || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11.5px] font-semibold text-gray-700 leading-tight">Mon compte</div>
            <div className="text-[10px] text-gray-400 leading-none mt-[3px]">Paramètres</div>
          </div>
          <Settings2 size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
        </Link>
      </div>
    </>
  );
}

// ─── Sidebar boutique (mode boutique) ─────────────────────────────────────────
function BoutiqueSidebar({
  pathname, boutiqueNom, boutiqueSlug, onRetour,
}: {
  pathname: string;
  boutiqueNom?: string;
  boutiqueSlug?: string;
  onRetour: () => void;
}) {
  return (
    <>
      {/* Retour */}
      <button
        type="button"
        onClick={onRetour}
        className="h-14 w-full flex items-center gap-2.5 px-4 border-b border-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-50/80 transition-all flex-shrink-0"
      >
        <ArrowLeft size={14} />
        <span className="text-[12.5px] font-medium">Retour au dashboard</span>
      </button>

      {/* Store identity */}
      <div className="px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#1B2A4A,#3a5480)" }}
          >
            <Store size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-gray-800 truncate leading-tight">
              {boutiqueNom || "Ma boutique"}
            </div>
            <div className="text-[10px] font-semibold mt-[3px]" style={{ color: "#0284c7" }}>
              Module Boutique
            </div>
          </div>
        </div>
      </div>

      {/* Nav boutique */}
      <nav
        className="flex-1 px-2.5 py-3 overflow-y-auto space-y-px"
        style={{ scrollbarWidth: "none" }}
      >
        {BOUTIQUE_NAV.map(item => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            accent="#0284c7"
            activeBg="#EFF6FF"
            activeText="#0369a1"
          />
        ))}
      </nav>

      {/* Voir boutique */}
      <div className="border-t border-gray-100 p-3 flex-shrink-0">
        {boutiqueSlug ? (
          <a
            href={`/${boutiqueSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:brightness-105 active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg,#0284c7,#0369a1)" }}
          >
            <ExternalLink size={13} className="text-white/80 flex-shrink-0" />
            <span className="text-[12px] font-bold text-white">Voir ma boutique</span>
          </a>
        ) : (
          <div className="px-3 py-2 text-[11px] text-gray-400 text-center">
            Boutique non configurée
          </div>
        )}
      </div>
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function Sidebar({ boutiqueNom, boutiqueSlug, userInitials }: SidebarProps) {
  const pathname = usePathname();
  const [mode, setMode] = useState<"main" | "boutique">("main");

  useEffect(() => {
    setMode(BOUTIQUE_ROUTES.some(r => pathname.startsWith(r)) ? "boutique" : "main");
  }, [pathname]);

  return (
    <aside
      className="flex-shrink-0 h-screen flex flex-col bg-white border-r border-gray-100"
      style={{
        width: "224px",
        boxShadow: "1px 0 12px rgba(0,0,0,0.03)",
        fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif",
      }}
    >
      {mode === "boutique" ? (
        <BoutiqueSidebar
          pathname={pathname}
          boutiqueNom={boutiqueNom}
          boutiqueSlug={boutiqueSlug}
          onRetour={() => setMode("main")}
        />
      ) : (
        <MainSidebar
          pathname={pathname}
          boutiqueNom={boutiqueNom}
          userInitials={userInitials}
          onBoutique={() => { setMode("boutique"); }}
        />
      )}
    </aside>
  );
}
