"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp, X,
  Store, Paintbrush, Palette, Wallet, CreditCard,
  Megaphone, Globe2, Film, Calendar, Radio, Search,
  Truck, Bike, Package2, BarChart3, Settings, Plug,
  Users, MessageCircle, Star, Layers, Globe, Bot,
} from "lucide-react";

const TABS = [
  { href: "/dashboard",           label: "Accueil",   Icon: LayoutDashboard, exact: true },
  { href: "/dashboard/produits",  label: "Produits",  Icon: Package },
  { href: "/dashboard/commandes", label: "Ventes",    Icon: ShoppingBag },
  { href: "/dashboard/revenus",   label: "Revenus",   Icon: TrendingUp },
];

const ALL_MODULES = [
  {
    label: "Boutique", color: "#111111",
    items: [
      { href: "/dashboard",            label: "Accueil",         Icon: LayoutDashboard },
      { href: "/dashboard/boutique",   label: "Ma boutique",     Icon: Store },
      { href: "/dashboard/builder",    label: "Constructeur",    Icon: Paintbrush },
      { href: "/dashboard/themes",     label: "Thèmes",          Icon: Palette },
      { href: "/dashboard/produits",   label: "Produits",        Icon: Package },
      { href: "/dashboard/sourcing",   label: "Sourcing",        Icon: Layers },
    ],
  },
  {
    label: "Commerce", color: "#111111",
    items: [
      { href: "/dashboard/commandes",    label: "Commandes",     Icon: ShoppingBag },
      { href: "/dashboard/clients",      label: "Clients",       Icon: Users },
      { href: "/dashboard/whatsapp",     label: "WhatsApp",      Icon: MessageCircle },
      { href: "/dashboard/avis",         label: "Avis",          Icon: Star },
      { href: "/dashboard/dropshipping", label: "Dropshipping",  Icon: Package2 },
      { href: "/dashboard/affiliation",  label: "Affiliation",   Icon: Globe },
    ],
  },
  {
    label: "Finance", color: "#F5A623",
    items: [
      { href: "/dashboard/wallet",     label: "Wallet",          Icon: Wallet },
      { href: "/dashboard/paiements",  label: "Paiements",       Icon: CreditCard },
      { href: "/dashboard/revenus",    label: "Revenus",         Icon: TrendingUp },
      { href: "/dashboard/abonnement", label: "Abonnement",      Icon: CreditCard },
    ],
  },
  {
    label: "Marketing", color: "#111111",
    items: [
      { href: "/dashboard/marketing",  label: "Marketing",       Icon: Megaphone },
      { href: "/dashboard/messages",   label: "Social",          Icon: Globe2 },
      { href: "/dashboard/studio",     label: "Studio",          Icon: Film },
      { href: "/dashboard/scheduler",  label: "Planificateur",   Icon: Calendar },
      { href: "/dashboard/publicite",  label: "Publicité",       Icon: Radio },
      { href: "/dashboard/veille",     label: "Veille",          Icon: Search },
    ],
  },
  {
    label: "Logistique", color: "#111111",
    items: [
      { href: "/dashboard/livraison",  label: "Livraisons",      Icon: Truck },
      { href: "/dashboard/livreurs",   label: "Livreurs",        Icon: Bike },
      { href: "/dashboard/analytics",  label: "Analytics",       Icon: BarChart3 },
    ],
  },
  {
    label: "Intelligence", color: "#F5A623",
    items: [
      { href: "/dashboard/axia",        label: "AXIA IA",         Icon: Bot },
    ],
  },
  {
    label: "Système", color: "#111111",
    items: [
      { href: "/dashboard/connecteurs",label: "Connecteurs",     Icon: Plug },
      { href: "/dashboard/parametres", label: "Paramètres",      Icon: Settings },
    ],
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E8E8E8]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch">
          {TABS.map(({ href, label, Icon, exact }) => {
            const on = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative transition-all"
                style={{ color: on ? "#111111" : "#AAAAAA" }}
              >
                {on && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#111111] rounded-full" />
                )}
                <Icon size={20} strokeWidth={on ? 2.2 : 1.7} />
                <span className="text-[10px]" style={{ fontWeight: on ? 700 : 400 }}>{label}</span>
              </Link>
            );
          })}

          {/* Plus */}
          <button
            onClick={() => setOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative"
            style={{ color: open ? "#111111" : "#AAAAAA" }}
          >
            <div className="grid grid-cols-2 gap-[3px] w-5 h-5">
              {[0,1,2,3].map(i => (
                <div key={i} className="rounded-[2px]"
                  style={{ background: open ? "#111111" : "#AAAAAA", width: 8, height: 8 }} />
              ))}
            </div>
            <span className="text-[10px]">Plus</span>
          </button>
        </div>
      </nav>

      {/* All modules drawer */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="bg-white rounded-t-2xl overflow-hidden"
            style={{ maxHeight: "84vh", boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }}
          >
            {/* Handle */}
            <div className="pt-3 pb-4 px-5 border-b border-[#F3F3F3]">
              <div className="w-8 h-1 bg-[#E8E8E8] rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-bold text-[#111111]">Tous les modules</p>
                  <p className="text-[11px] text-[#AAAAAA] mt-0.5">Navigation complète</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#666666]"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Modules */}
            <div className="overflow-y-auto pb-10" style={{ maxHeight: "calc(84vh - 88px)" }}>
              {ALL_MODULES.map(section => (
                <div key={section.label} className="px-4 pt-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#BBBBBB] mb-3">
                    {section.label}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {section.items.map(({ href, label, Icon }) => {
                      const on = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(false)}
                          className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all"
                          style={{
                            background: on ? "#111111" : "#F5F5F5",
                            border: `1px solid ${on ? "#111111" : "#EBEBEB"}`,
                          }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: on ? "rgba(255,255,255,0.15)" : "white", border: "1px solid rgba(0,0,0,0.06)" }}>
                            <Icon size={17} style={{ color: on ? "white" : "#555555" }} strokeWidth={1.8} />
                          </div>
                          <span
                            className="text-[10px] font-semibold text-center leading-tight"
                            style={{ color: on ? "white" : "#555555" }}
                          >
                            {label}
                          </span>
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
