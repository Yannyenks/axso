"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart,
  X, BarChart3, TrendingUp, Megaphone, Truck, Star,
  Settings, Bike, Palette, Globe2, Film, Calendar,
  Search, MessageSquare, Store, Paintbrush, CreditCard,
  Wallet, Package2, Bot, Zap
} from "lucide-react";
import {
  IconAccueil, IconProduits, IconAxia, IconCommandes,
} from "@/components/dashboard/AppIcons";

// ─── Groupes complets (tous les modules) ─────────────────────────────────────
const GROUPS = [
  {
    label: "Intelligence IA", color: "#7c3aed",
    items: [
      { href: "/dashboard/ia",        label: "AXIA — Chat IA",    icon: Zap },
      { href: "/dashboard/studio",    label: "Studio Contenu",    icon: Film },
      { href: "/dashboard/scheduler", label: "Planificateur",     icon: Calendar },
    ],
  },
  {
    label: "Boutique", color: "#F5A623",
    items: [
      { href: "/dashboard",            label: "Accueil",           icon: LayoutDashboard },
      { href: "/dashboard/produits",   label: "Produits",          icon: Package },
      { href: "/dashboard/commandes",  label: "Commandes",         icon: ShoppingCart },
      { href: "/dashboard/clients",    label: "Clients",           icon: Bot },
      { href: "/dashboard/avis",       label: "Avis clients",      icon: Star },
    ],
  },
  {
    label: "Design", color: "#ec4899",
    items: [
      { href: "/dashboard/boutique",   label: "Ma Boutique",       icon: Store },
      { href: "/dashboard/builder",    label: "Constructeur",      icon: Paintbrush },
      { href: "/dashboard/themes",     label: "Thèmes",            icon: Palette },
    ],
  },
  {
    label: "Finance", color: "#34d399",
    items: [
      { href: "/dashboard/wallet",     label: "Wallet Axso",       icon: Wallet },
      { href: "/dashboard/paiements",  label: "Paiements",         icon: CreditCard },
      { href: "/dashboard/revenus",    label: "Revenus",           icon: TrendingUp },
    ],
  },
  {
    label: "Croissance", color: "#f472b6",
    items: [
      { href: "/dashboard/marketing",    label: "Marketing",        icon: Megaphone },
      { href: "/dashboard/publicite",    label: "Publicité Ads",    icon: Megaphone },
      { href: "/dashboard/sms",          label: "SMS / WhatsApp",   icon: MessageSquare },
      { href: "/dashboard/feeds",        label: "Flux Produits",    icon: Globe2 },
      { href: "/dashboard/veille",       label: "Veille Concurr.",  icon: Search },
      { href: "/dashboard/dropshipping", label: "Dropshipping",     icon: Package2 },
    ],
  },
  {
    label: "Logistique", color: "#fb923c",
    items: [
      { href: "/dashboard/livraison",  label: "Livraison",         icon: Truck },
      { href: "/dashboard/livreurs",   label: "Livreurs",          icon: Bike },
    ],
  },
  {
    label: "Analytiques", color: "#a78bfa",
    items: [
      { href: "/dashboard/analytics",  label: "Analytics",         icon: BarChart3 },
      { href: "/dashboard/parametres", label: "Paramètres",        icon: Settings },
    ],
  },
];

// ─── 4 onglets principaux (+ bouton Plus) ────────────────────────────────────
const MAIN_TABS = [
  { href: "/dashboard",           label: "Accueil",   AppIcon: IconAccueil,   exact: true },
  { href: "/dashboard/produits",  label: "Produits",  AppIcon: IconProduits },
  { href: "/dashboard/ia",        label: "AXIA",      AppIcon: null },  // bouton central spécial
  { href: "/dashboard/commandes", label: "Commandes", AppIcon: IconCommandes },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href) && pathname !== "/dashboard" || (exact && pathname === href);

  return (
    <>
      {/* ── Bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/96 backdrop-blur-xl border-t border-gray-100"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -4px 24px rgba(0,0,0,0.07)" }}>
        <div className="flex items-end justify-around px-1 pt-2 pb-2">

          {MAIN_TABS.map((tab) => {
            const isCenter = tab.AppIcon === null;
            const active = tab.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(tab.href);

            if (isCenter) {
              return (
                <Link key={tab.href} href={tab.href} className="flex flex-col items-center -mt-6">
                  <div className="transition-transform active:scale-95 hover:scale-105"
                    style={{ filter: "drop-shadow(0 4px 12px rgba(124,58,237,0.4))" }}>
                    <IconAxia size={54} />
                  </div>
                  <span className="text-[10px] font-bold mt-1" style={{ color: active ? "#7c3aed" : "#9ca3af" }}>
                    AXIA
                  </span>
                </Link>
              );
            }

            const AppIcon = tab.AppIcon!;
            return (
              <Link key={tab.href} href={tab.href}
                className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all">
                <div className={`transition-all duration-150 ${active ? "scale-100" : "scale-90 opacity-60"}`}>
                  <AppIcon size={30} />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: active ? "#F5A623" : "#9ca3af" }}>
                  {tab.label}
                </span>
                {active && <div className="w-1 h-1 rounded-full bg-[#F5A623] -mt-0.5"/>}
              </Link>
            );
          })}

          {/* Bouton "Plus" */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all"
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${drawerOpen ? "bg-[#F5A623]/12" : ""}`}>
              <div className="flex flex-col gap-[3px]">
                <div className="flex gap-[3px]">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: drawerOpen ? "#F5A623" : "#9ca3af" }}/>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: drawerOpen ? "#F5A623" : "#9ca3af" }}/>
                </div>
                <div className="flex gap-[3px]">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: drawerOpen ? "#F5A623" : "#9ca3af" }}/>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: drawerOpen ? "#F5A623" : "#9ca3af" }}/>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold" style={{ color: drawerOpen ? "#F5A623" : "#9ca3af" }}>
              Plus
            </span>
          </button>
        </div>
      </nav>

      {/* ── Drawer "Tous les modules" ── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) setDrawerOpen(false); }}
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>

          <div className="bg-white rounded-t-3xl overflow-hidden"
            style={{ maxHeight: "82vh", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>

            {/* Handle + header */}
            <div className="px-5 pt-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"/>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Tous les modules</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Accédez à toutes les fonctionnalités</p>
                </div>
                <button onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-xl text-gray-500">
                  <X size={16}/>
                </button>
              </div>
            </div>

            {/* Modules par groupe */}
            <div className="overflow-y-auto pb-8" style={{ maxHeight: "calc(82vh - 90px)" }}>
              {GROUPS.map((group) => (
                <div key={group.label} className="px-4 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-3 rounded-full" style={{ background: group.color }}/>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">{group.label}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDrawerOpen(false)}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all"
                          style={{
                            background: active ? group.color + "15" : "#f9fafb",
                            border: `1px solid ${active ? group.color + "40" : "#f3f4f6"}`,
                          }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: active ? group.color + "20" : "white", border: `1px solid ${active ? group.color + "30" : "#e5e7eb"}` }}>
                            <Icon size={17} style={{ color: active ? group.color : "#6b7280" }}/>
                          </div>
                          <span className="text-[10px] font-semibold text-center leading-tight"
                            style={{ color: active ? group.color : "#6b7280" }}>
                            {item.label}
                          </span>
                          {active && (
                            <div className="w-1 h-1 rounded-full" style={{ background: group.color }}/>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
