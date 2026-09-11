// Route temporaire — construit UNE FOIS le manifeste de la bibliothèque
// AXSO Design (Templates/*.html) en appelant Gemini (indisponible en local,
// clé API différente/refusée) depuis l'environnement de production qui a la
// vraie clé. Appeler UNE SEULE FOIS : GET /api/internal/build-library-manifest?token=axso-library-2026
// Supprimer ce fichier après utilisation.
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { extraireGabaritsLibrairie, analyserTemplateImporte } from "@/lib/gemini";

const SECRET = "axso-library-2026";

export const maxDuration = 300;

const FICHIERS: Array<{ fichier: string; nom: string; categories: string[] }> = [
  { fichier: "aube-site.html", nom: "AUBE", categories: ["jewelry"] },
  { fichier: "cadran-site.html", nom: "CADRAN", categories: ["jewelry", "accessories"] },
  { fichier: "circuit-site.html", nom: "CIRCUIT", categories: ["auto", "sport"] },
  { fichier: "clarte-site.html", nom: "CLARTÉ", categories: ["beauty"] },
  { fichier: "equilibre-site.html", nom: "ÉQUILIBRE", categories: ["health", "services"] },
  { fichier: "grind-site.html", nom: "GRIND", categories: ["sport"] },
  { fichier: "halle-site.html", nom: "HALLE", categories: ["home"] },
  { fichier: "ignite-site.html", nom: "IGNITE", categories: ["food"] },
  { fichier: "ndop-site.html", nom: "NDOP", categories: ["fashion", "artisan"] },
  { fichier: "nexus-site.html", nom: "NEXUS", categories: ["tech"] },
  { fichier: "onze-site.html", nom: "ONZE", categories: ["sport"] },
  { fichier: "opal-site.html", nom: "OPAL", categories: ["tech"] },
  { fichier: "pop-site.html", nom: "POP!", categories: ["general", "books"] },
  { fichier: "ring-site.html", nom: "RING", categories: ["sport"] },
  { fichier: "sentier-site.html", nom: "SENTIER", categories: ["agriculture", "auto"] },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("token") !== SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Traite un seul fichier par appel (?fichier=aube-site.html) — évite tout
  // risque de dépassement du maxDuration de la fonction en cumulant les 15
  // fichiers x 2 appels Gemini dans une seule requête.
  const nomFichier = searchParams.get("fichier");
  if (!nomFichier) {
    return NextResponse.json({ fichiers: FICHIERS.map((f) => f.fichier) });
  }
  const f = FICHIERS.find((x) => x.fichier === nomFichier);
  if (!f) return NextResponse.json({ error: "Fichier inconnu" }, { status: 404 });

  try {
    const htmlBrut = readFileSync(path.join(process.cwd(), "Templates", f.fichier), "utf-8");
    const [gabarits, analyse] = await Promise.all([
      extraireGabaritsLibrairie(htmlBrut),
      analyserTemplateImporte(htmlBrut),
    ]);
    return NextResponse.json({
      fichier: f.fichier,
      nom: f.nom,
      categories: f.categories,
      carteTemplate: gabarits.carteTemplate,
      selecteurVisuelPdp: gabarits.selecteurVisuelPdp,
      couleurs: analyse.couleurs,
      polices: analyse.polices,
      ambiance: analyse.ambiance,
    });
  } catch (err: any) {
    return NextResponse.json({ fichier: f.fichier, erreur: err?.message || String(err) }, { status: 500 });
  }
}
