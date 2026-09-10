import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyserTemplateImporte } from "@/lib/gemini";
import { resolveThemeConfig, type ThemeConfig } from "@/lib/theme-config";
import { TEMPLATE_IDS } from "@/lib/theme-templates";
import { fontEntry } from "@/lib/theme-fonts";

// Import de template — extraction de style par l'IA, jamais exécution du
// fichier envoyé. Le HTML est lu une seule fois côté serveur comme texte
// d'entrée du prompt d'analyse puis jeté ; la boutique obtenue est un
// ThemeConfig AXSO normal (mêmes composants React que les autres thèmes),
// habillé avec les couleurs/polices/ambiance extraites. Voir lib/gemini.ts
// (analyserTemplateImporte) pour le détail de ce que ça évite (XSS stocké,
// sandbox, nouveau moteur de rendu) par rapport à un clonage structurel complet.

const TAILLE_MAX_HTML = 300_000; // 300 Ko — au-delà, prompt trop volumineux
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

const bodySchema = z.object({ url: z.string().url() });

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const tenantId = (session.user as any)?.tenantId;
    if (!tenantId) return NextResponse.json({ error: "Tenant requis" }, { status: 400 });

    const parsedBody = bodySchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "URL de fichier invalide" }, { status: 400 });
    }

    const fichierRes = await fetch(parsedBody.data.url);
    if (!fichierRes.ok) {
      return NextResponse.json({ error: "Impossible de récupérer le fichier envoyé" }, { status: 400 });
    }
    let html = await fichierRes.text();
    if (html.length > TAILLE_MAX_HTML) {
      return NextResponse.json({ error: "Ce fichier est trop volumineux pour être analysé (max 300 Ko)." }, { status: 400 });
    }
    // Le contenu des scripts n'apporte rien à l'analyse de style et n'est de
    // toute façon jamais exécuté — on l'enlève pour alléger le prompt.
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");

    const titreMatch = html.match(/<title>([^<]*)<\/title>/i);
    const nomDetecte = titreMatch?.[1]?.trim().slice(0, 60) || "Mon thème importé";

    const analyse = await analyserTemplateImporte(html);

    const familleProche = TEMPLATE_IDS.has(analyse.familleProche) ? analyse.familleProche : "terre-et-or";
    const base = resolveThemeConfig(familleProche);

    const colors = { ...base.colors };
    for (const cle of ["fond", "accent", "texte", "surface"] as const) {
      const val = analyse.couleurs?.[cle];
      if (typeof val === "string" && HEX_REGEX.test(val)) colors[cle] = val;
    }

    const fonts = { ...base.fonts };
    if (analyse.polices?.titre && fontEntry(analyse.polices.titre)) fonts.titre = analyse.polices.titre;
    if (analyse.polices?.corps && fontEntry(analyse.polices.corps)) fonts.corps = analyse.polices.corps;

    const boutons = { ...base.boutons, style: analyse.styleBouton };
    const radius = analyse.rayonAngles === "arrondi" ? "16px" : "0px";

    const config: ThemeConfig = { ...base, colors, fonts, boutons, radius };

    const slugBase = nomDetecte.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40) || "importe";
    const slug = `custom-${slugBase}-${Date.now()}`;

    const theme = await prisma.theme.create({
      data: {
        tenantId,
        nom: nomDetecte,
        slug,
        description: `Thème généré à partir de votre design importé — ambiance ${analyse.ambiance.join(", ") || "personnalisée"}.`,
        badge: "✦ Importé",
        config: config as any,
        actif: true,
      },
    });

    return NextResponse.json({ theme }, { status: 201 });
  } catch (e) {
    console.error("[THEME IMPORT ERROR]", e);
    return NextResponse.json({ error: "Erreur lors de l'analyse du fichier" }, { status: 500 });
  }
}
