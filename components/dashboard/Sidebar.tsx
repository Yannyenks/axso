"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Home, ShoppingCart, Monitor, Users, Package, Download,
  Star, Truck, MessageSquare, BarChart3, Megaphone,
  DollarSign, CreditCard, Wallet, Map, Box,
  Settings2, ExternalLink, ArrowLeft, UserCheck,
  LayoutGrid, Plug, Link2, Bell, Store, ChevronRight,
  RotateCcw, FileText, Lock, Target, FileBarChart, Sparkles,
  Boxes, Receipt, Calculator,
} from "lucide-react";
import { useAbonnementOverlay } from "@/components/dashboard/AbonnementOverlayProvider";
import { palierAuMoins, type Palier } from "@/lib/plans";
import type { ModuleKey, Niveau } from "@/lib/permissions";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  Icon: React.ElementType;
  badge?: boolean;
  locked?: boolean;
  exact?: boolean;
  excludePrefix?: string;
  requiresPalier?: Palier;
  // Route qui ouvre directement l'overlay abonnement plein écran au lieu de
  // naviguer vers une page classique (le lien "Abonnement" lui-même).
  opensAbonnement?: boolean;
  // Module de permissions dont dépend la VISIBILITÉ de l'item (masqué
  // entièrement si "aucun", pas juste cadenassé — mécanisme différent de
  // requiresPalier ci-dessus : un membre d'équipe sans accès à un module ne
  // doit même pas voir l'entrée exister, contrairement à l'upsell palier.
  moduleKey?: ModuleKey;
}

type Entry = NavItem | { type: "label"; text: string };

export interface SidebarProps {
  boutiqueNom?: string;
  boutiqueSlug?: string;
  userInitials?: string;
  palier?: Palier;
  // Grille de permissions de l'équipe (undefined = propriétaire, tout est
  // affiché sans filtrage — voir permissionsSession() dans lib/permissions.ts).
  permissions?: Record<ModuleKey, Niveau>;
}

// ─── Filtrage par permissions ──────────────────────────────────────────────────
// Masque entièrement les items dont le module est "aucun" pour la session
// courante. Si `permissions` est undefined (propriétaire, pas de ligne
// MembreEquipe), retourne la liste telle quelle — no-op garanti.
function filterNavItems<T extends NavItem>(items: T[], permissions?: Record<ModuleKey, Niveau>): T[] {
  if (!permissions) return items;
  return items.filter(item => !item.moduleKey || permissions[item.moduleKey] !== "aucun");
}

// Variante pour MAIN_NAV, qui mélange NavItem et labels de section : filtre
// les items puis retire les labels devenus orphelins (plus aucun item avant
// le label suivant ou la fin de liste) pour éviter un séparateur "flottant".
function filterNavEntries(entries: Entry[], permissions?: Record<ModuleKey, Niveau>): Entry[] {
  if (!permissions) return entries;
  const kept = entries.filter(entry => "type" in entry || !entry.moduleKey || permissions[entry.moduleKey] !== "aucun");
  return kept.filter((entry, i) => {
    if (!("type" in entry)) return true;
    for (let j = i + 1; j < kept.length; j++) {
      const next = kept[j];
      if ("type" in next) return false; // prochain label direct => orphelin
      return true;
    }
    return false; // rien après => orphelin
  });
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

// ─── Routes point de vente (POS) ───────────────────────────────────────────────
// /dashboard/pos redirige vers /dashboard/logistique?tab=pos — donc le mode
// POS de la sidebar doit aussi reconnaître ce cas précis (même pathname que
// les autres onglets logistique, distingué par le paramètre ?tab=).
const POS_ROUTES = [
  "/dashboard/pos",
  "/dashboard/logistique/encaissements",
  "/dashboard/factures",
];

// ─── Navigation principale ────────────────────────────────────────────────────
const MAIN_NAV: Entry[] = [
  { type: "label", text: "VENTES" },
  { href: "/dashboard",                  label: "AXIA",              Icon: Sparkles,      exact: true },
  { href: "/dashboard/accueil",          label: "Tableau de bord",   Icon: Home,          exact: true },
  { href: "/dashboard/commandes",        label: "Commandes",         Icon: ShoppingCart,  badge: true, moduleKey: "commandes" },
  { href: "/dashboard/pos",              label: "Point de vente",    Icon: Monitor,       moduleKey: "pos" },
  { href: "/dashboard/factures",         label: "Factures",          Icon: FileText,      moduleKey: "finance" },
  { href: "/dashboard/retours",          label: "Retours",           Icon: RotateCcw,     moduleKey: "commandes" },

  { type: "label", text: "CLIENTS" },
  { href: "/dashboard/clients",          label: "Clients",           Icon: Users,         moduleKey: "clients" },
  { href: "/dashboard/avis",             label: "Avis clients",      Icon: Star,          moduleKey: "clients" },
  { href: "/dashboard/whatsapp",         label: "WhatsApp",          Icon: MessageSquare, badge: true, moduleKey: "clients" },
  { href: "/dashboard/livreurs",         label: "Livreurs",          Icon: Truck,         moduleKey: "clients" },

  { type: "label", text: "CATALOGUE" },
  { href: "/dashboard/produits",         label: "Produits",          Icon: Package,       excludePrefix: "/dashboard/produits/digital", moduleKey: "produits" },
  { href: "/dashboard/produits/digital", label: "Produits Digitaux", Icon: Download,      moduleKey: "produits" },
  { href: "/dashboard/sourcing",         label: "Sourcing",          Icon: Map,           requiresPalier: "palier2", moduleKey: "produits" },
  { href: "/dashboard/entrepots",        label: "Entrepôts",         Icon: Box,           moduleKey: "produits" },

  { type: "label", text: "CROISSANCE" },
  { href: "/dashboard/analytics",        label: "Analytics",         Icon: BarChart3,     moduleKey: "produits" },
  { href: "/dashboard/objectifs",        label: "Objectifs",         Icon: Target,        moduleKey: "produits" },
  { href: "/dashboard/rapports",         label: "Rapports",          Icon: FileBarChart,  moduleKey: "produits" },
  { href: "/dashboard/marketing",        label: "Marketing",         Icon: Megaphone,     requiresPalier: "palier1", moduleKey: "marketing" },
  { href: "/dashboard/affiliation",      label: "Affiliation",       Icon: UserCheck,     moduleKey: "marketing" },

  { type: "label", text: "FINANCE" },
  { href: "/dashboard/revenus",          label: "Revenus",           Icon: DollarSign,    moduleKey: "finance" },
  { href: "/dashboard/paiements",        label: "Paiements",         Icon: CreditCard,    moduleKey: "finance" },
  { href: "/dashboard/wallet",           label: "Wallet",            Icon: Wallet,        moduleKey: "finance" },

  { type: "label", text: "COMPTE" },
  { href: "/dashboard/abonnement",       label: "Abonnement",        Icon: CreditCard,    opensAbonnement: true, moduleKey: "parametres" },
];

// ─── Navigation boutique ──────────────────────────────────────────────────────
const BOUTIQUE_NAV: NavItem[] = [
  { href: "/dashboard/boutique",         label: "Dashboard",          Icon: Home,         exact: true },
  { href: "/dashboard/commandes",        label: "Commandes",          Icon: ShoppingCart, badge: true, moduleKey: "commandes" },
  { href: "/dashboard/produits",         label: "Produits",           Icon: Package,      excludePrefix: "/dashboard/produits/digital", moduleKey: "produits" },
  { href: "/dashboard/produits/digital", label: "Produits Digitaux",  Icon: Download,     moduleKey: "produits" },
  { href: "/dashboard/themes",           label: "Thèmes",             Icon: LayoutGrid,   moduleKey: "boutique" },
  { href: "/dashboard/builder",          label: "Constructeur",       Icon: LayoutGrid,   moduleKey: "boutique" },
  { href: "/dashboard/transporteurs",    label: "Transporteurs",      Icon: Truck,        moduleKey: "boutique" },
  { href: "/dashboard/connecteurs",      label: "Connecteurs",        Icon: Plug,         moduleKey: "boutique" },
  { href: "/dashboard/feeds",            label: "Flux produits",      Icon: Link2,        moduleKey: "boutique" },
  { href: "/dashboard/campagnes",        label: "Campagnes",          Icon: Bell,         moduleKey: "boutique" },
  { href: "/dashboard/parametres",       label: "Réglages",           Icon: Settings2,    moduleKey: "parametres" },
];

// ─── Navigation point de vente ─────────────────────────────────────────────────
const POS_NAV: NavItem[] = [
  { href: "/dashboard/logistique?tab=pos",       label: "Caisse POS",          Icon: Monitor,       moduleKey: "pos" },
  { href: "/dashboard/commandes",                label: "Historique des ventes", Icon: ShoppingCart, badge: true, moduleKey: "pos" },
  { href: "/dashboard/pos/stock",                label: "Gestion des stocks",  Icon: Boxes,         moduleKey: "pos" },
  { href: "/dashboard/pos/tracabilite",          label: "Traçabilité",         Icon: Package,       moduleKey: "pos" },
  // Comptabilité/Charges/Encaissements/Factures = sous-outils financiers du
  // module POS, gérés par la permission "finance" (pas "pos") : un caissier
  // pur (pos:ecriture, finance:aucun) voit la caisse mais pas la compta.
  { href: "/dashboard/pos/comptabilite",         label: "Comptabilité",        Icon: Calculator,    moduleKey: "finance" },
  { href: "/dashboard/pos/charges",              label: "Charges d'exploitation", Icon: Receipt,    moduleKey: "finance" },
  { href: "/dashboard/logistique/encaissements", label: "Encaissements COD",   Icon: Wallet,        moduleKey: "finance" },
  { href: "/dashboard/factures",                 label: "Factures",            Icon: FileText,      moduleKey: "finance" },
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
  item, pathname, palier,
  accent = "#F5A623",
  activeBg = "#FFF7ED",
  activeText = "#92400E",
  activeOverride,
}: {
  item: NavItem;
  pathname: string;
  palier?: Palier;
  accent?: string;
  activeBg?: string;
  activeText?: string;
  // Pour les items dont l'état actif dépend d'un paramètre de requête (ex:
  // ?tab=pos) plutôt que du seul pathname — isActive() ne voit jamais la
  // query string, usePathname() ne la retourne pas.
  activeOverride?: boolean;
}) {
  const { openAbonnement } = useAbonnementOverlay();
  const active = activeOverride ?? isActive(item, pathname);
  const locked = !!item.requiresPalier && !palierAuMoins(palier ?? "palier0", item.requiresPalier);

  const content = (
    <>
      {/* Indicateur actif */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
          style={{ backgroundColor: accent }}
        />
      )}

      {/* Icône */}
      <span
        className="flex-shrink-0 flex items-center justify-center w-[30px] h-[30px] rounded-lg transition-all"
        style={active
          ? { backgroundColor: `${accent}22`, color: accent }
          : { backgroundColor: "transparent", color: locked ? "#D1D5DB" : "#9CA3AF" }
        }
      >
        <item.Icon size={16} />
      </span>

      {/* Label */}
      <span className={cn(
        "flex-1 truncate leading-none font-medium",
        locked ? "text-gray-400" : !active && "text-gray-500 group-hover:text-gray-800"
      )}>
        {item.label}
      </span>

      {/* Cadenas — fonctionnalité hors du plan actuel */}
      {locked && <Lock size={12} className="flex-shrink-0 text-gray-300" />}

      {/* Badge live */}
      {!locked && item.badge && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
          style={{ backgroundColor: accent }}
        />
      )}
    </>
  );

  const className = cn(
    "relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 group",
    !active && !locked && "hover:bg-gray-50",
    locked && "cursor-pointer hover:bg-gray-50/60"
  );

  if (locked) {
    return (
      <button type="button" onClick={() => openAbonnement(item.requiresPalier)} className={cn(className, "w-full text-left")}>
        {content}
      </button>
    );
  }

  if (item.opensAbonnement) {
    return (
      <button type="button" onClick={() => openAbonnement()} className={cn(className, "w-full text-left")}
        style={active ? { backgroundColor: activeBg, color: activeText } : undefined}>
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      style={active ? { backgroundColor: activeBg, color: activeText } : undefined}
    >
      {content}
    </Link>
  );
}

// ─── Sidebar principale ────────────────────────────────────────────────────────
function MainSidebar({
  pathname, boutiqueNom, userInitials, onBoutique, onPos, palier, permissions,
}: {
  pathname: string;
  boutiqueNom?: string;
  userInitials?: string;
  onBoutique: () => void;
  onPos: () => void;
  palier?: Palier;
  permissions?: Record<ModuleKey, Niveau>;
}) {
  const navEntries = filterNavEntries(MAIN_NAV, permissions);
  return (
    <>
      {/* Slogan */}
      <div className="h-[60px] flex items-center px-5 flex-shrink-0 border-b border-gray-100/80">
        <span
          className="text-[15px] font-bold tracking-tight leading-tight"
          style={{
            background: "linear-gradient(135deg,#1B2A4A 0%,#2c4270 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Build your empire here
        </span>
      </div>

      {/* Ma boutique CTA */}
      <div className="px-3.5 pt-3.5 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={onBoutique}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl active:scale-[0.98] transition-all group"
          style={{
            background: "linear-gradient(135deg,#1B2A4A 0%,#2c4270 100%)",
            boxShadow: "0 2px 12px rgba(27,42,74,0.25)",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <Store size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[13px] font-bold text-white leading-tight truncate">
              {boutiqueNom || "Ma boutique"}
            </div>
            <div className="text-[10.5px] text-white/50 leading-none mt-1">Gérer la boutique</div>
          </div>
          <ChevronRight
            size={14}
            className="text-white/40 group-hover:text-white/80 flex-shrink-0 transition-all group-hover:translate-x-0.5"
          />
        </button>
      </div>

      {/* Point de vente CTA — même logique que Ma boutique, en jaune */}
      <div className="px-3.5 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={onPos}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl active:scale-[0.98] transition-all group"
          style={{
            background: "linear-gradient(135deg,#F5A623 0%,#D4911A 100%)",
            boxShadow: "0 2px 12px rgba(245,166,35,0.3)",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
          >
            <Monitor size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[13px] font-bold text-white leading-tight truncate">
              Point de vente
            </div>
            <div className="text-[10.5px] text-white/60 leading-none mt-1">Caisse & ventes en boutique</div>
          </div>
          <ChevronRight
            size={14}
            className="text-white/50 group-hover:text-white/90 flex-shrink-0 transition-all group-hover:translate-x-0.5"
          />
        </button>
      </div>

      {/* Séparateur */}
      <div className="mx-4 border-t border-gray-100 mb-1" />

      {/* Nav */}
      <nav
        className="flex-1 px-3 pb-3 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="space-y-0.5">
          {navEntries.map((entry, i) => {
            if ("type" in entry) {
              return (
                <div key={i} className="pt-4 pb-1.5 px-1 flex items-center gap-2">
                  <span
                    className="text-[10.5px] font-bold tracking-[0.15em] uppercase"
                    style={{ color: "#B0B8C8" }}
                  >
                    {entry.text}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: "#F1F4F9" }} />
                </div>
              );
            }
            return <NavLink key={entry.href} item={entry} pathname={pathname} palier={palier} />;
          })}
        </div>
      </nav>

      {/* Bottom — paramètres */}
      <div
        className="flex-shrink-0 px-3.5 py-3"
        style={{ borderTop: "1px solid #F1F4F9" }}
      >
        <Link
          href="/dashboard/parametres"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
            pathname.startsWith("/dashboard/parametres") ? "bg-[#FFF7ED]" : "hover:bg-gray-50"
          )}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[13px] font-bold"
            style={{
              background: "linear-gradient(135deg,#F5A623,#D4911A)",
              boxShadow: "0 2px 8px rgba(245,166,35,0.3)",
            }}
          >
            {userInitials || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-gray-700 leading-tight">Mon compte</div>
            <div className="text-[11px] text-gray-400 leading-none mt-1">Paramètres</div>
          </div>
          <Settings2 size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
        </Link>
      </div>
    </>
  );
}

// ─── Sidebar boutique ─────────────────────────────────────────────────────────
function BoutiqueSidebar({
  pathname, boutiqueNom, boutiqueSlug, onRetour, permissions,
}: {
  pathname: string;
  boutiqueNom?: string;
  boutiqueSlug?: string;
  onRetour: () => void;
  permissions?: Record<ModuleKey, Niveau>;
}) {
  const navItems = filterNavItems(BOUTIQUE_NAV, permissions);
  return (
    <>
      {/* Retour */}
      <button
        type="button"
        onClick={onRetour}
        className="h-[60px] w-full flex items-center gap-3 px-5 border-b border-gray-100/80 group transition-all hover:bg-gray-50 flex-shrink-0"
      >
        <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
          <ArrowLeft size={14} className="text-gray-500" />
        </span>
        <span className="text-[13.5px] font-medium text-gray-500 group-hover:text-gray-800 transition-colors">
          Retour au dashboard
        </span>
      </button>

      {/* Store identity */}
      <div className="px-4 py-4 flex-shrink-0">
        <div
          className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
          style={{ backgroundColor: "#F0F6FF" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg,#1B2A4A,#3a5480)",
              boxShadow: "0 2px 10px rgba(27,42,74,0.3)",
            }}
          >
            <Store size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[13.5px] font-bold text-gray-800 truncate leading-tight">
              {boutiqueNom || "Ma boutique"}
            </div>
            <div className="text-[11px] font-semibold mt-1" style={{ color: "#0284c7" }}>
              Module Boutique
            </div>
          </div>
        </div>
      </div>

      {/* Séparateur */}
      <div className="mx-4 border-t border-gray-100 mb-1" />

      {/* Nav boutique */}
      <nav
        className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        {navItems.map(item => (
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
      <div className="flex-shrink-0 px-3.5 py-3" style={{ borderTop: "1px solid #F1F4F9" }}>
        {boutiqueSlug ? (
          <a
            href={`/${boutiqueSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl active:scale-[0.98] transition-all group"
            style={{
              background: "linear-gradient(135deg,#0284c7,#0369a1)",
              boxShadow: "0 2px 12px rgba(2,132,199,0.25)",
            }}
          >
            <ExternalLink size={15} className="text-white/80 flex-shrink-0" />
            <span className="text-[13px] font-bold text-white flex-1">Voir ma boutique</span>
            <ChevronRight size={13} className="text-white/40 group-hover:text-white/80 transition-all group-hover:translate-x-0.5" />
          </a>
        ) : (
          <div className="px-3 py-3 text-[12px] text-gray-400 text-center bg-gray-50 rounded-xl">
            Boutique non configurée
          </div>
        )}
      </div>
    </>
  );
}

// ─── Sidebar point de vente ─────────────────────────────────────────────────────
function PosSidebar({
  pathname, boutiqueNom, onRetour, permissions,
}: {
  pathname: string;
  boutiqueNom?: string;
  onRetour: () => void;
  permissions?: Record<ModuleKey, Niveau>;
}) {
  const searchParams = useSearchParams();
  const caisseActive = pathname === "/dashboard/logistique" && searchParams.get("tab") === "pos";
  const navItems = filterNavItems(POS_NAV, permissions);

  return (
    <>
      {/* Retour */}
      <button
        type="button"
        onClick={onRetour}
        className="h-[60px] w-full flex items-center gap-3 px-5 border-b border-gray-100/80 group transition-all hover:bg-gray-50 flex-shrink-0"
      >
        <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
          <ArrowLeft size={14} className="text-gray-500" />
        </span>
        <span className="text-[13.5px] font-medium text-gray-500 group-hover:text-gray-800 transition-colors">
          Retour au dashboard
        </span>
      </button>

      {/* Identité module */}
      <div className="px-4 py-4 flex-shrink-0">
        <div
          className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
          style={{ backgroundColor: "#FFF8EC" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg,#F5A623,#D4911A)",
              boxShadow: "0 2px 10px rgba(245,166,35,0.35)",
            }}
          >
            <Monitor size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[13.5px] font-bold text-gray-800 truncate leading-tight">
              {boutiqueNom || "Ma boutique"}
            </div>
            <div className="text-[11px] font-semibold mt-1" style={{ color: "#D4911A" }}>
              Module Point de vente
            </div>
          </div>
        </div>
      </div>

      {/* Séparateur */}
      <div className="mx-4 border-t border-gray-100 mb-1" />

      {/* Nav POS */}
      <nav
        className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        {navItems.map(item => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            accent="#F5A623"
            activeBg="#FFF7ED"
            activeText="#92400E"
            activeOverride={item.href.startsWith("/dashboard/logistique?tab=") ? caisseActive : undefined}
          />
        ))}
      </nav>

      {/* Ouvrir la caisse */}
      <div className="flex-shrink-0 px-3.5 py-3" style={{ borderTop: "1px solid #F1F4F9" }}>
        <Link
          href="/dashboard/logistique?tab=pos"
          className="flex items-center gap-3 px-3.5 py-3 rounded-xl active:scale-[0.98] transition-all group"
          style={{
            background: "linear-gradient(135deg,#F5A623,#D4911A)",
            boxShadow: "0 2px 12px rgba(245,166,35,0.3)",
          }}
        >
          <Monitor size={15} className="text-white/90 flex-shrink-0" />
          <span className="text-[13px] font-bold text-white flex-1">Ouvrir la caisse</span>
          <ChevronRight size={13} className="text-white/50 group-hover:text-white/90 transition-all group-hover:translate-x-0.5" />
        </Link>
      </div>
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function Sidebar({ boutiqueNom, boutiqueSlug, userInitials, palier, permissions }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"main" | "boutique" | "pos">("main");

  useEffect(() => {
    const surLogistiquePos = pathname === "/dashboard/logistique" && searchParams.get("tab") === "pos";
    if (BOUTIQUE_ROUTES.some(r => pathname.startsWith(r))) setMode("boutique");
    else if (surLogistiquePos || POS_ROUTES.some(r => pathname.startsWith(r))) setMode("pos");
    else setMode("main");
  }, [pathname, searchParams]);

  return (
    <aside
      className="flex-shrink-0 h-screen flex flex-col bg-white border-r border-gray-100/80"
      style={{
        width: "252px",
        boxShadow: "2px 0 20px rgba(0,0,0,0.04)",
        fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif",
      }}
    >
      {mode === "boutique" ? (
        <BoutiqueSidebar
          pathname={pathname}
          boutiqueNom={boutiqueNom}
          boutiqueSlug={boutiqueSlug}
          onRetour={() => setMode("main")}
          permissions={permissions}
        />
      ) : mode === "pos" ? (
        <PosSidebar
          pathname={pathname}
          boutiqueNom={boutiqueNom}
          onRetour={() => setMode("main")}
          permissions={permissions}
        />
      ) : (
        <MainSidebar
          pathname={pathname}
          boutiqueNom={boutiqueNom}
          userInitials={userInitials}
          onBoutique={() => setMode("boutique")}
          onPos={() => setMode("pos")}
          palier={palier}
          permissions={permissions}
        />
      )}
    </aside>
  );
}
