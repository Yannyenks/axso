import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/livraison/calculer
// Body: { tenantId, zone, poids, montantCommande }
// Returns applicable shipping rules sorted by price
export async function POST(req: Request) {
  const body = await req.json();
  const { tenantId, zone, poids = 0, montantCommande = 0 } = body;

  if (!tenantId || !zone) {
    return NextResponse.json({ error: "tenantId et zone requis" }, { status: 400 });
  }

  const regles = await prisma.reglePort.findMany({
    where: { tenantId, actif: true },
    orderBy: { frais: "asc" },
  });

  // Filter rules matching zone (exact or contains "International")
  const matching = regles.filter((r) => {
    const zoneMatch =
      r.zone.toLowerCase() === zone.toLowerCase() ||
      r.zone.toLowerCase().includes("international") ||
      zone.toLowerCase().includes(r.zone.toLowerCase());

    if (!zoneMatch) return false;

    const poidsOk = poids >= r.poidsMin && (r.poidsMax === null || poids <= r.poidsMax);
    const montantMinOk = r.montantMin === null || montantCommande >= r.montantMin;
    const montantMaxOk = r.montantMax === null || montantCommande <= r.montantMax;

    return poidsOk && montantMinOk && montantMaxOk;
  });

  const options = matching.map((r) => {
    let fraisTotal = r.gratuit ? 0 : r.frais + Math.max(0, poids - r.poidsMin) * r.fraisKg;
    return {
      id: r.id,
      nom: r.nom,
      transporteur: r.transporteur,
      delai: r.delai,
      frais: fraisTotal,
      gratuit: r.gratuit || fraisTotal === 0,
    };
  });

  // Fallback: if no rule matches, return a default option
  if (options.length === 0) {
    options.push({
      id: "default",
      nom: "Livraison standard",
      transporteur: null,
      delai: "7-14 jours",
      frais: 0,
      gratuit: false,
    });
  }

  return NextResponse.json({ options });
}
