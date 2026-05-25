"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Store, Paintbrush,
  CreditCard, TrendingUp, Megaphone, Truck, Star, Sparkles, BarChart3,
  Settings, ChevronLeft, ChevronRight, Bike, Palette
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Accueil", icone: LayoutDashboard },
  { href: "/dashboard/produits", label: "Produits", icone: Package },
  { href: "/dashboard/commandes", label: "Commandes", icone: ShoppingCart, badge: true },
  { href: "/dashboard/clients", label: "Clients", icone: Users },
  { href: "/dashboard/boutique", label: "Ma Boutique", icone: Store },
  { href: "/dashboard/builder", label: "Constructeur", icone: Paintbrush },
  { href: "/dashboard/themes", label: "Thèmes", icone: Palette },
  { href: "/dashboard/paiements", label: "Paiements", icone: CreditCard },
  { href: "/dashboard/revenus", label: "Revenus", icone: TrendingUp },
  { href: "/dashboard/marketing", label: "Marketing", icone: Megaphone },
  { href: "/dashboard/livraison", label: "Livraison", icone: Truck },
  { href: "/dashboard/livreurs", label: "Livreurs", icone: Bike },
  { href: "/dashboard/avis", label: "Avis clients", icone: Star },
  { href: "/dashboard/ia", label: "Assistant IA", icone: Sparkles },
  { href: "/dashboard/analytics", label: "Analytics", icone: BarChart3 },
  { href: "/dashboard/parametres", label: "Paramètres", icone: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-gray-100 transition-all duration-300 relative shadow-sm",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center px-5 py-4 border-b border-gray-100", collapsed ? "justify-center px-3" : "")}>
        {collapsed ? (
          <div className="w-9 h-9 overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="axso" style={{ height: "36px", width: "auto", objectFit: "contain", objectPosition: "left" }} />
          </div>
        ) : (
          <img src="/logo.png" alt="axso" style={{ height: "48px", width: "auto", objectFit: "contain" }} />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icone = item.icone;
          const actif = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                actif
                  ? "bg-[#F5A623]/12 text-[#1B2A4A] border border-[#F5A623]/30 shadow-sm font-semibold"
                  : "text-gray-500 hover:text-[#1B2A4A] hover:bg-orange-50/60",
                collapsed && "justify-center"
              )}
            >
              <Icone size={17} className="flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {item.badge && !collapsed && actif && (
                <span className="ml-auto bg-[#F5A623] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  3
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-[#F5A623] hover:border-[#F5A623]/40 transition-all z-10 shadow-sm"
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
}
