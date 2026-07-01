// Dashboard Marketing et promotions
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatMontant, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Tag,
  Mail,
  Megaphone,
  TrendingUp,
  ArrowRight,
  Users,
  Sparkles,
  Zap,
} from "lucide-react";

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

  const codesActifs = codesPromo.filter((c) => c.actif).length;

  const tools = [
    {
      icone: Tag,
      titre: "Codes Promo",
      description: "Créez des remises pour fidéliser vos clients et booster vos ventes.",
      href: "/dashboard/marketing/codes-promo",
      color: "#F5A623",
      bg: "#F5A62312",
      stat: codesActifs > 0 ? `${codesActifs} code${codesActifs > 1 ? "s" : ""} actif${codesActifs > 1 ? "s" : ""}` : "Aucun code actif",
      statColor: codesActifs > 0 ? "#F5A623" : "#9ca3af",
      cta: "Gérer les codes →",
    },
    {
      icone: Mail,
      titre: "Email Marketing",
      description: "Envoyez des campagnes email ciblées à votre base clients.",
      href: "/dashboard/marketing/email",
      color: "#10b981",
      bg: "#10b98112",
      stat: `${totalClients} client${totalClients > 1 ? "s" : ""} à contacter`,
      statColor: "#10b981",
      cta: "Envoyer une campagne →",
    },
    {
      icone: Megaphone,
      titre: "Campagnes",
      description: "Planifiez et lancez des promotions ciblées sur votre boutique.",
      href: "/dashboard/marketing",
      color: "#7c3aed",
      bg: "#7c3aed12",
      stat: "Bientôt disponible",
      statColor: "#9ca3af",
      cta: "Explorer →",
    },
    {
      icone: TrendingUp,
      titre: "SEO & Visibilité",
      description: "Optimisez le référencement de vos produits pour attirer plus de visiteurs.",
      href: "/dashboard/produits",
      color: "#f59e0b",
      bg: "#f59e0b12",
      stat: "Optimisez vos fiches",
      statColor: "#f59e0b",
      cta: "Voir les produits →",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-poppins">Marketing</h1>
          <p className="text-gray-500 text-sm mt-1">
            Centre de marketing · Boostez vos ventes avec des outils puissants
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: "#F5A62312", color: "#F5A623" }}
        >
          <Sparkles size={14} />
          <span>{totalClients} clients</span>
        </div>
      </div>

      {/* ── Stat rapide ── */}
      {(codesActifs > 0 || totalClients > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Codes actifs",
              value: codesActifs.toString(),
              icon: Tag,
              color: "#F5A623",
              bg: "#F5A62312",
            },
            {
              label: "Total codes",
              value: codesPromo.length.toString(),
              icon: Zap,
              color: "#a78bfa",
              bg: "#a78bfa12",
            },
            {
              label: "Base clients",
              value: totalClients.toString(),
              icon: Users,
              color: "#10b981",
              bg: "#10b98112",
            },
            {
              label: "Taux activation",
              value:
                codesPromo.length > 0
                  ? `${Math.round((codesActifs / codesPromo.length) * 100)}%`
                  : "—",
              icon: TrendingUp,
              color: "#f59e0b",
              bg: "#f59e0b12",
            },
          ].map((stat, i) => {
            const Icone = stat.icon;
            return (
              <div
                key={i}
                className="bg-white shadow-sm border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: stat.bg }}
                >
                  <Icone size={15} style={{ color: stat.color }} />
                </div>
                <p className="text-gray-900 text-xl font-bold font-poppins">{stat.value}</p>
                <p className="text-gray-400 text-xs mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Grid outils marketing ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map((tool, i) => {
          const Icone = tool.icone;
          return (
            <Link key={i} href={tool.href}>
              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200 group cursor-pointer h-full flex flex-col">
                {/* Icône */}
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: tool.bg, border: `1px solid ${tool.color}25` }}
                  >
                    <Icone size={22} style={{ color: tool.color }} />
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 group-hover:text-[#F5A623] group-hover:translate-x-1 transition-all duration-200 mt-1"
                  />
                </div>

                {/* Titre + description */}
                <p className="text-gray-900 font-semibold group-hover:text-[#F5A623] transition-colors duration-200">
                  {tool.titre}
                </p>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed flex-1">
                  {tool.description}
                </p>

                {/* Stat + CTA */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${tool.color}15`, color: tool.statColor }}
                  >
                    {tool.stat}
                  </span>
                  <span
                    className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ color: tool.color }}
                  >
                    {tool.cta}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Codes promo récents ── */}
      {codesPromo.length > 0 && (
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#F5A62312" }}
              >
                <Tag size={15} style={{ color: "#F5A623" }} />
              </div>
              <div>
                <h2 className="text-gray-900 font-semibold text-sm">Codes promo récents</h2>
                <p className="text-gray-400 text-xs">{codesActifs} actif{codesActifs > 1 ? "s" : ""} sur {codesPromo.length}</p>
              </div>
            </div>
            <Link
              href="/dashboard/marketing/codes-promo"
              className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "#F5A623" }}
            >
              Voir tout
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-2">
            {codesPromo.map((code) => (
              <div
                key={code.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <code
                    className="text-sm font-mono font-bold px-3 py-1 rounded-lg"
                    style={{ backgroundColor: "#F5A62315", color: "#F5A623" }}
                  >
                    {code.code}
                  </code>
                  <span className="text-gray-500 text-sm">
                    {code.type === "pourcentage"
                      ? `${code.valeur}% de remise`
                      : `${formatMontant(code.valeur, tenant.devise)} de remise`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs">
                    {code.utilisations}/{code.maxUtilisations ?? "∞"} util.
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      code.actif
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {code.actif ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bloc d'inspiration si base vide ── */}
      {codesPromo.length === 0 && totalClients === 0 && (
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 text-center hover:shadow-md transition-all duration-200">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ backgroundColor: "#F5A62312" }}
          >
            <Megaphone size={28} style={{ color: "#F5A623" }} />
          </div>
          <p className="text-gray-900 font-semibold text-base mb-2">
            Prêt à booster vos ventes ?
          </p>
          <p className="text-gray-400 text-sm mb-5 max-w-sm mx-auto">
            Commencez par créer un code promo pour attirer vos premiers clients et générer du trafic sur votre boutique.
          </p>
          <Link href="/dashboard/marketing/codes-promo">
            <span
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#F5A623", color: "#fff" }}
            >
              <Tag size={15} />
              Créer mon premier code promo
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
