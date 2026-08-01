import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const tenantId = (session.user as any)?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Pas de boutique" }, { status: 400 });

  const [
    totalAffilies,
    affiliesActifs,
    commissions,
    topAffilies,
    totalClics,
    totalConversions,
  ] = await Promise.all([
    // Nombre total d'affiliés
    prisma.affilie.count({ where: { tenantId } }),

    // Affiliés actifs
    prisma.affilie.count({ where: { tenantId, statut: "actif" } }),

    // Toutes les commissions pour calculer les totaux
    prisma.commissionAffilie.findMany({
      where: { tenantId },
      select: { montantCommission: true, statut: true, valeurCommande: true },
    }),

    // Top 5 affiliés par commissions totales
    prisma.affilie.findMany({
      where: { tenantId },
      include: {
        commissions: {
          select: { montantCommission: true, statut: true, valeurCommande: true },
        },
      },
      orderBy: { commissionTotal: "desc" },
      take: 5,
    }),

    // Clics totaux agrégés
    prisma.affilie.aggregate({
      where: { tenantId },
      _sum: { clics: true },
    }),

    // Conversions totales agrégées
    prisma.affilie.aggregate({
      where: { tenantId },
      _sum: { conversions: true },
    }),
  ]);

  const commissionsPaid = commissions
    .filter((c) => c.statut === "payee")
    .reduce((sum, c) => sum + c.montantCommission, 0);

  const commissionsPending = commissions
    .filter((c) => c.statut === "pending" || c.statut === "approuvee")
    .reduce((sum, c) => sum + c.montantCommission, 0);

  const gmvAffilies = commissions.reduce((sum, c) => sum + c.valeurCommande, 0);

  const clics = totalClics._sum.clics ?? 0;
  const conversions = totalConversions._sum.conversions ?? 0;
  const tauxConversion = clics > 0 ? ((conversions / clics) * 100).toFixed(1) : "0";

  const topAffiliesFormatted = topAffilies.map((a) => ({
    id: a.id,
    nom: a.nom,
    email: a.email,
    codeParrainage: a.codeParrainage,
    statut: a.statut,
    clics: a.clics,
    conversions: a.conversions,
    commissionPending: a.commissionPending,
    commissionTotal: a.commissionTotal,
    ventes: a.commissions.length,
  }));

  // Données funnel (clics → conversions → paiements effectués)
  const funnel = {
    clics,
    conversions,
    paiements: commissions.filter((c) => c.statut === "payee").length,
  };

  return NextResponse.json({
    stats: {
      totalAffilies,
      affiliesActifs,
      commissionsPaid,
      commissionsPending,
      gmvAffilies,
      clics,
      conversions,
      tauxConversion: parseFloat(tauxConversion),
      funnel,
    },
    topAffilies: topAffiliesFormatted,
  });
}
