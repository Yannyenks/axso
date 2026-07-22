import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { AxiaFloat } from "@/components/dashboard/AxiaFloat";

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

  return (
    <>
      {/* ── Desktop ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex h-screen bg-[#F5F5F5] text-[#111111] overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header session={session} boutiqueSlug={boutique?.slug} boutiqueNom={boutique?.nomBoutique} />
          <main className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      <AxiaFloat />

      {/* ── Mobile ──────────────────────────────────────────────────── */}
      <div className="md:hidden min-h-screen bg-[#F5F5F5] text-[#111111] pb-20">
        <MobileTopBar boutiqueNom={boutique?.nomBoutique} boutiqueSlug={boutique?.slug} />
        <main className="px-4 py-4">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </>
  );
}

/* ── Mobile top bar ──────────────────────────────────────────────────────── */
function MobileTopBar({ boutiqueNom, boutiqueSlug }: { boutiqueNom?: string; boutiqueSlug?: string }) {
  return (
    <header className="bg-white border-b border-[#E8E8E8] px-4 h-13 flex items-center justify-between" style={{ height: 52 }}>
      <img src="/logo.png" alt="axso" className="h-7 w-auto object-contain" />
      <div className="flex items-center gap-2">
        {boutiqueNom && (
          <div className="flex items-center gap-1.5 bg-[#F5F5F5] border border-[#E8E8E8] rounded-full px-3 py-1 max-w-[140px]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] flex-shrink-0" />
            <span className="text-[11px] font-semibold text-[#111111] truncate">{boutiqueNom}</span>
          </div>
        )}
        {boutiqueSlug && (
          <a href={`/${boutiqueSlug}`} target="_blank" rel="noopener noreferrer"
            className="w-8 h-8 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        )}
      </div>
    </header>
  );
}
