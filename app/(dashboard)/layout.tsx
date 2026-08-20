import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { AxiaFloat } from "@/components/dashboard/AxiaFloat";
import { QuotaBanner } from "@/components/dashboard/QuotaBanner";
import { NotificationSound } from "@/components/ui/NotificationSound";
import { quotaCommandesAtteint } from "@/lib/abonnement";

const FULLBLEED_ROUTES: string[] = ["/dashboard/builder", "/dashboard/themes"];

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
  const quotaAtteint = tenantId ? await quotaCommandesAtteint(tenantId) : false;

  return (
    <>
      {/* ─── Desktop : sidebar latérale ─────────────────────────── */}
      <div className="hidden md:flex h-screen bg-[#f0f2f8] text-gray-900 overflow-hidden" style={{ fontFamily: "'Poppins', 'Century Gothic', system-ui, sans-serif" }}>
        <Sidebar boutiqueNom={boutique?.nomBoutique} boutiqueSlug={boutique?.slug} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className={fullBleed ? "flex-1 overflow-hidden flex flex-col" : "flex-1 overflow-y-auto"}>
            {fullBleed ? children : (
              <>
                <Header session={session} boutiqueSlug={boutique?.slug} boutiqueNom={boutique?.nomBoutique}/>
                <div className="px-6 pb-8 max-w-7xl mx-auto w-full">
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
        <MobileHeader boutiqueNom={boutique?.nomBoutique} />
        <main className="flex-1 overflow-y-auto pb-32">
          <div className="px-3 pt-3 max-w-lg mx-auto space-y-4">
            {quotaAtteint && <QuotaBanner />}
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>

      {/* ─── Axia flottante (desktop uniquement — sur mobile, Axia est accessible
           via le bouton central de MobileBottomNav → /dashboard/axia, la bulle
           flottante chevaucherait sinon la barre de navigation basse) ───────── */}
      <div className="hidden md:block">
        <AxiaFloat />
      </div>

      {/* Son audio sur chaque notification toast */}
      <NotificationSound />
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

