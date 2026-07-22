import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import {
  IconAxia, IconProduits, IconMarketing, IconClients, IconLivraisons, IconAnalytics,
} from "@/components/dashboard/AppIcons";

// Aucune route en full-bleed — le plein écran du navigateur est géré côté client
const FULLBLEED_ROUTES: string[] = [];
const WIDE_ROUTES: string[] = [];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/connexion");

  const tenantId = (session.user as any)?.tenantId;
  let boutique: { slug: string; nomBoutique: string } | null = null;
  if (tenantId) {
    boutique = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, nomBoutique: true },
    });
  }

  const pathname = (await headers()).get("x-pathname") || "";
  const fullBleed = FULLBLEED_ROUTES.some(r => pathname.startsWith(r));

  return (
    <>
      {/* ─── Desktop : sidebar latérale ─────────────────────────── */}
      <div className="hidden md:flex h-screen bg-[#f0f2f8] text-gray-900 overflow-hidden" style={{ fontFamily: "'Poppins', 'Century Gothic', system-ui, sans-serif" }}>
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className={fullBleed ? "flex-1 overflow-hidden flex flex-col" : "flex-1 overflow-y-auto"}>
            {fullBleed ? children : (
              <>
                <Header session={session} boutiqueSlug={boutique?.slug} boutiqueNom={boutique?.nomBoutique}/>
                <div className="px-6 pb-8 max-w-7xl mx-auto w-full">{children}</div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ─── Mobile : bottom nav + feed social ──────────────────── */}
      <div className="md:hidden flex flex-col min-h-screen bg-[#f0f2f8] text-gray-900">
        <MobileHeader boutiqueNom={boutique?.nomBoutique} />
        <AgentStoriesRow />
        <main className="flex-1 overflow-y-auto pb-24">
          <div className="px-3 pt-3 max-w-lg mx-auto space-y-4">
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
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

/* ─── Ligne de stories agents (mobile) ─────────────────────────── */
function AgentStoriesRow() {
  const stories = [
    { id: "axia",  nom: "AXIA",  href: "/dashboard/axia",      Icon: IconAxia,      active: true, ring: "#7c3aed" },
    { id: "kira",  nom: "KIRA",  href: "/dashboard/produits",  Icon: IconProduits,  ring: "#14b8a6" },
    { id: "nova",  nom: "NOVA",  href: "/dashboard/marketing", Icon: IconMarketing, ring: "#f87171" },
    { id: "zeta",  nom: "ZETA",  href: "/dashboard/clients",   Icon: IconClients,   ring: "#f472b6" },
    { id: "atlas", nom: "ATLAS", href: "/dashboard/livraison", Icon: IconLivraisons,ring: "#fb923c" },
    { id: "lyra",  nom: "LYRA",  href: "/dashboard/analytics", Icon: IconAnalytics, ring: "#a78bfa" },
  ];

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="flex gap-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {stories.map((s) => (
          <a key={s.id} href={s.href} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="p-0.5 rounded-2xl"
              style={{
                background: s.active
                  ? `linear-gradient(135deg, ${s.ring}, #e8950f)`
                  : `linear-gradient(135deg, ${s.ring}60, ${s.ring}30)`,
              }}>
              <div className="bg-white rounded-xl p-0.5">
                <s.Icon size={48} />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-gray-500">{s.nom}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
