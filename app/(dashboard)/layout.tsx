import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/connexion");
  }

  const tenantId = (session.user as any)?.tenantId;
  let boutique: { slug: string; nomBoutique: string } | null = null;

  if (tenantId) {
    boutique = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, nomBoutique: true },
    });
  }

  return (
    <div className="flex h-screen bg-[#f5f7ff] text-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header session={session} boutiqueSlug={boutique?.slug} boutiqueNom={boutique?.nomBoutique} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
