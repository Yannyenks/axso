"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { AxiaFloat } from "@/components/dashboard/AxiaFloat";
import { QuotaBanner } from "@/components/dashboard/QuotaBanner";
import type { Palier } from "@/lib/plans";

const FULLBLEED_PREFIXES: string[] = ["/dashboard/builder", "/dashboard/themes"];

// Toute la logique dépendant de la route vit ici, dans un composant client,
// plutôt que dans le layout serveur : les layouts Next.js ne se ré-exécutent
// pas à chaque navigation entre pages soeurs (c'est voulu, pour ne pas
// re-render la sidebar à chaque clic) — une décision "faut-il afficher la
// sidebar" basée sur headers() côté serveur restait donc figée sur l'état du
// tout premier chargement. usePathname() côté client, lui, se met à jour de
// façon fiable à chaque navigation.
export function DashboardShell({
  children, session, boutique, quotaAtteint, palier,
}: {
  children: React.ReactNode;
  session: any;
  boutique: { slug: string; nomBoutique: string } | null;
  quotaAtteint: boolean;
  palier: Palier;
}) {
  const pathname = usePathname();
  const estAccueilAxia = pathname === "/dashboard";
  const fullBleed = estAccueilAxia || FULLBLEED_PREFIXES.some(r => pathname.startsWith(r));

  return (
    <>
      {/* ─── Desktop : sidebar latérale ─────────────────────────── */}
      <div className="hidden md:flex h-screen bg-[#f0f2f8] text-gray-900 overflow-hidden" style={{ fontFamily: "'Poppins', 'Century Gothic', system-ui, sans-serif" }}>
        {/* Écran d'accueil AXIA = plein écran réel, la sidebar AXSO ne doit
            pas rester visible à côté — le retour au dashboard classique se
            fait via le bouton dédié dans la barre supérieure d'AXIA. */}
        {!estAccueilAxia && <Sidebar boutiqueNom={boutique?.nomBoutique} boutiqueSlug={boutique?.slug} palier={palier} />}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className={fullBleed ? "flex-1 overflow-hidden flex flex-col" : "flex-1 overflow-y-auto"}>
            {fullBleed ? children : (
              <>
                <Header session={session} boutiqueSlug={boutique?.slug} boutiqueNom={boutique?.nomBoutique}/>
                <div key={pathname} className="ax-page-enter px-6 pb-8 max-w-7xl mx-auto w-full">
                  {quotaAtteint && <QuotaBanner />}
                  {children}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ─── Mobile : bottom nav îlot ────────────────────────────── */}
      <div className="md:hidden flex flex-col min-h-screen bg-[#f0f2f8] text-gray-900">
        {!estAccueilAxia && <MobileHeader boutiqueNom={boutique?.nomBoutique} />}
        <main className={estAccueilAxia ? "flex-1 overflow-hidden flex flex-col" : "flex-1 overflow-y-auto pb-32"}>
          {estAccueilAxia ? children : (
            <div key={pathname} className="ax-page-enter px-3 pt-3 max-w-lg mx-auto space-y-4 pb-32">
              {quotaAtteint && <QuotaBanner />}
              {children}
            </div>
          )}
        </main>
        {!estAccueilAxia && <MobileBottomNav />}
      </div>

      {/* ─── Axia flottante — masquée sur l'écran d'accueil /dashboard,
           qui EST déjà l'expérience Axia plein écran. ───────── */}
      {!estAccueilAxia && (
        <div className="hidden md:block">
          <AxiaFloat />
        </div>
      )}
    </>
  );
}

/* ─── Header mobile ────────────────────────────────────────────── */
function MobileHeader({ boutiqueNom }: { boutiqueNom?: string }) {
  return (
    <header className="sticky top-0 z-40 bg-white/96 backdrop-blur-xl border-b border-gray-100"
      style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between px-4 h-14">
        <img src="/logo.png" alt="axso" style={{ height: "32px", width: "auto", objectFit: "contain" }}/>
        {boutiqueNom && (
          <div className="flex items-center gap-1.5 bg-[#F5A623]/8 border border-[#F5A623]/20 rounded-full px-3 py-1 max-w-[150px]">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0"/>
            <span className="text-xs font-semibold text-[#F5A623] truncate">{boutiqueNom}</span>
          </div>
        )}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F5A623] to-[#e8950f] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">A</span>
        </div>
      </div>
    </header>
  );
}
