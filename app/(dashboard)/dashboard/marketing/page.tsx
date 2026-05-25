// Dashboard  Marketing et promotions
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatMontant, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Tag, Mail, Megaphone, TrendingUp } from "lucide-react";

export default async function MarketingPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const tenantId = (session.user as any)?.tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) redirect("/inscription");

  const [codesPromo, totalClients] = await Promise.all([
    prisma.codePromo.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.client.count({ where: { tenantId } }),
  ]);

  const tools = [
    {
      icone: Tag,
      titre: "Codes Promo",
      desc: `${codesPromo.length} code(s) actif(s)`,
      href: "/dashboard/marketing/codes-promo",
      color: "#F5A623",
      badge: codesPromo.filter((c) => c.actif).length,
    },
    {
      icone: Mail,
      titre: "Email Marketing",
      desc: `${totalClients} clients à contacter`,
      href: "/dashboard/marketing/email",
      color: "#10b981",
      badge: null,
    },
    {
      icone: Megaphone,
      titre: "Campagnes",
      desc: "Créez des promotions ciblées",
      href: "/dashboard/marketing",
      color: "#7c3aed",
      badge: null,
    },
    {
      icone: TrendingUp,
      titre: "SEO",
      desc: "Optimisez votre visibilité",
      href: "/dashboard/produits",
      color: "#f59e0b",
      badge: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-playfair">Marketing</h1>
        <p className="text-gray-400 text-sm mt-1">Boostez vos ventes avec des outils marketing puissants</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tools.map((tool, i) => {
          const Icone = tool.icone;
          return (
            <Link key={i} href={tool.href}>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#F5A623]/20 transition-all group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${tool.color}15`, border: `1px solid ${tool.color}30` }}>
                    <Icone size={22} style={{ color: tool.color }} />
                  </div>
                  {tool.badge !== null && (
                    <span className="text-xs px-2 py-1 rounded-lg font-semibold bg-[#F5A623]/20 text-[#F5A623]">
                      {tool.badge} actif{tool.badge > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="text-gray-800 font-semibold group-hover:text-[#F5A623] transition-colors">{tool.titre}</p>
                <p className="text-gray-400 text-sm mt-1">{tool.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Codes promo récents */}
      {codesPromo.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800 font-semibold">Codes promo récents</h2>
            <Link href="/dashboard/marketing/codes-promo" className="text-sm text-[#F5A623] hover:opacity-80">Voir tout ?</Link>
          </div>
          <div className="space-y-3">
            {codesPromo.map((code) => (
              <div key={code.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <code className="text-[#F5A623] bg-[#F5A623]/10 px-3 py-1 rounded-lg text-sm font-mono">{code.code}</code>
                  <span className="text-gray-400 text-sm">
                    {code.type === "pourcentage" ? `${code.valeur}%` : formatMontant(code.valeur, tenant.devise)} de remise
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs">{code.utilisations}/{code.maxUtilisations || "8"} util.</span>
                  <span className={`text-xs px-2 py-1 rounded-lg ${code.actif ? "text-green-400 bg-green-400/10 border border-green-400/30" : "text-gray-500 bg-gray-500/10 border border-gray-500/30"}`}>
                    {code.actif ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

