import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatMontant, formatDate } from "@/lib/utils";
import { ExternalLink, BadgeCheck, Settings2 } from "lucide-react";
import Link from "next/link";
import { getAdminSession, estAdminComplet } from "@/lib/admin-auth";
import { PLATFORM_TENANT_SLUG } from "@/lib/wallet";
import { TenantStatutToggle } from "@/components/admin/TenantStatutToggle";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminBoutiquesPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) redirect("/dashboard");
  const { q } = await searchParams;

  const boutiques = await prisma.tenant.findMany({
    where: {
      slug: { not: PLATFORM_TENANT_SLUG },
      ...(q ? { OR: [{ nomBoutique: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { produits: true, commandes: true, clients: true } },
      commissions: { where: { statut: "captured" }, select: { montantCommission: true } },
    },
  });

  const th = "px-5 py-3 text-left text-xs font-medium";
  const td = "px-5 py-4";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-playfair" style={{ color: "#ffffff" }}>Boutiques</h1>
          <p className="text-sm mt-1" style={{ color: "#8A93A8" }}>{boutiques.length} boutique{boutiques.length !== 1 ? "s" : ""} {q ? `pour "${q}"` : "enregistrées sur la plateforme"}</p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher une boutique…"
            className="px-4 py-2 text-sm rounded-xl border focus:outline-none"
            style={{ background: "#0E1220", borderColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}
          />
        </form>
      </div>

      <div className="rounded-2xl overflow-hidden border" style={{ background: "#0E1220", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {["Boutique", "Pays", "Plan", "Produits", "Commandes", "Clients", "Revenus Axso", "Statut", "Créée le", ""].map(h => (
                  <th key={h} className={th} style={{ color: "#8A93A8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {boutiques.map(b => {
                const revenu = b.commissions.reduce((s, c) => s + c.montantCommission, 0);
                return (
                  <tr key={b.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", color: "#F5A623" }}>
                          {b.nomBoutique.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/admin/boutiques/${b.id}`} className="font-medium flex items-center gap-1.5 hover:underline" style={{ color: "#ffffff" }}>
                            {b.nomBoutique}
                            {b.certifie && <BadgeCheck size={13} style={{ color: "#60a5fa" }} />}
                          </Link>
                          <a href={`/${b.slug}`} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] flex items-center gap-1 hover:underline" style={{ color: "#F5A623" }}>
                            {b.slug} <ExternalLink size={9} />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className={td} style={{ color: "#8A93A8" }}>{b.pays}</td>
                    <td className={td}>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,166,35,0.1)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.2)" }}>
                        {b.planType}
                      </span>
                    </td>
                    <td className={td} style={{ color: "#ffffff" }}>{b._count.produits}</td>
                    <td className={td} style={{ color: "#ffffff" }}>{b._count.commandes}</td>
                    <td className={td} style={{ color: "#ffffff" }}>{b._count.clients}</td>
                    <td className={td} style={{ color: "#34d399" }}>{formatMontant(revenu, b.devise)}</td>
                    <td className={td}>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={b.statut === "active"
                          ? { background: "rgba(52,211,153,0.15)", color: "#34d399" }
                          : { background: "rgba(248,113,113,0.15)", color: "#f87171" }}>
                        {b.statut === "active" ? "Active" : b.statut === "suspendu" ? "Suspendue" : b.statut === "supprime" ? "Supprimée" : b.statut}
                      </span>
                    </td>
                    <td className={td} style={{ color: "#4A5268" }}>{formatDate(b.createdAt)}</td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/boutiques/${b.id}`} className="p-1.5 rounded-lg transition-all hover:bg-white/5" style={{ color: "#8A93A8" }} title="Gérer">
                          <Settings2 size={14} />
                        </Link>
                        {estAdminComplet(session) && <TenantStatutToggle tenantId={b.id} statutActuel={b.statut} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
