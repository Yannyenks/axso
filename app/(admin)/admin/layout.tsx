import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Store, DollarSign, Users, Truck, BarChart3, Settings, LogOut, Shield } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Vue globale", icon: LayoutDashboard },
  { href: "/admin/boutiques", label: "Boutiques", icon: Store },
  { href: "/admin/finances", label: "Finances", icon: DollarSign },
  { href: "/admin/livreurs", label: "Livreurs", icon: Truck },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/connexion");

  const role = (session.user as any)?.role;
  if (role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#050508] text-white flex">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-gray-50 border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1B4FD8] to-[#7B9EFF] flex items-center justify-center">
              <Shield size={14} className="text-black" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Axso HQ</p>
              <p className="text-gray-500 text-[10px]">Admin Plateforme</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm">
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-gray-600 transition-all text-sm">
            <LogOut size={16} />
            Tableau de bord
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
