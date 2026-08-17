import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET public — portail self-service d'un affilié, sans compte/login (même
// pattern que les liens GPS livreur : token opaque non devinable dans l'URL).
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const affilie = await prisma.affilie.findUnique({
    where: { portalToken: token },
    include: {
      programme: true,
      tenant: { select: { nomBoutique: true, slug: true, logoUrl: true, devise: true } },
      commissions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!affilie) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const paiements = await prisma.paiementCommission.findMany({
    where: { affilieurId: affilie.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Palier actuel (si programme à paliers actif)
  let palier: { nom: string; tauxActuel: number; prochainPalier: string | null; conversionsRestantes: number | null } | null = null;
  if (affilie.programme?.tiersActifs) {
    const p = affilie.programme;
    if (affilie.conversions >= p.tier2Max) {
      palier = { nom: p.tier3Nom, tauxActuel: p.tier3Commission, prochainPalier: null, conversionsRestantes: null };
    } else if (affilie.conversions >= p.tier1Max) {
      palier = { nom: p.tier2Nom, tauxActuel: p.tier2Commission, prochainPalier: p.tier3Nom, conversionsRestantes: p.tier2Max - affilie.conversions };
    } else {
      palier = { nom: p.tier1Nom, tauxActuel: p.tier1Commission, prochainPalier: p.tier2Nom, conversionsRestantes: p.tier1Max - affilie.conversions };
    }
  }

  const tauxConversion = affilie.clics > 0 ? Math.round((affilie.conversions / affilie.clics) * 1000) / 10 : 0;

  return NextResponse.json({
    affilie: {
      nom: affilie.nom,
      email: affilie.email,
      telephone: affilie.telephone,
      codeParrainage: affilie.codeParrainage,
      statut: affilie.statut,
      clics: affilie.clics,
      conversions: affilie.conversions,
      tauxConversion,
      commissionTotal: affilie.commissionTotal,
      commissionPending: affilie.commissionPending,
    },
    programme: affilie.programme,
    palier,
    tenant: affilie.tenant,
    commissions: affilie.commissions,
    paiements,
  });
}
