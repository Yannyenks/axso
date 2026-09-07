import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { planActif } from "@/lib/abonnement";

// Endpoint minimal — expose le palier actif au tenant connecté pour les
// composants client qui ont besoin de savoir "suis-je Pro ?" (ex: tutoriel
// AXIA) sans dupliquer la logique déjà en place côté layout serveur.
export async function GET() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { plan } = await planActif(tenantId);
  return NextResponse.json({ palier: plan });
}
