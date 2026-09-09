import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveThemeConfig } from "@/lib/theme-config";
import { PRINCIPAL_THEME_IDS, TEMPLATE_IDS, TEMPLATE_META } from "@/lib/theme-templates";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;

    const themesDB = tenantId
      ? await prisma.theme.findMany({
          where: { OR: [{ tenantId }, { tenantId: null }], actif: true },
          orderBy: [{ ordre: "asc" }, { createdAt: "desc" }],
        })
      : [];

    // Gamme principale : quelques classiques historiques conservés
    // (lib/theme-templates.ts → LEGACY_CLASSIC_IDS_KEPT) + tous les thèmes
    // premium disponibles (structure propre, voir components/storefront/
    // templates/). Les autres classiques restent résolus normalement pour
    // les tenants qui les ont déjà, mais ne sont plus proposés ici.
    const themesBuiltin = PRINCIPAL_THEME_IDS.map((slug) => {
      const isTemplate = TEMPLATE_IDS.has(slug);
      const meta = TEMPLATE_META[slug];
      return {
        id: slug,
        slug,
        nom: meta?.nom || NOMS_BUILTIN[slug] || slug,
        description: meta?.description || DESCS_BUILTIN[slug] || "",
        badge: meta?.badge || BADGES_BUILTIN[slug] || null,
        config: resolveThemeConfig(slug),
        effetId: slug,
        tenantId: null,
        builtin: true,
        actif: true,
        premium: isTemplate,
        ordre: isTemplate ? 10 + Object.keys(TEMPLATE_META).indexOf(slug) : (ORDRE_BUILTIN[slug] || 99),
        createdAt: new Date(),
        updatedAt: new Date(),
        apercu: null,
      };
    });

    const themesCustom = themesDB
      .filter((t) => t.tenantId !== null)
      .map((t) => ({ ...t, builtin: false }));

    return NextResponse.json({ themes: [...themesBuiltin, ...themesCustom] });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const tenantId = (session.user as any)?.tenantId;
    if (!tenantId) return NextResponse.json({ error: "Tenant requis" }, { status: 400 });

    const body = await req.json();
    const { nom, description, config, effetId, badge } = body;
    if (!nom || !config) return NextResponse.json({ error: "nom et config requis" }, { status: 400 });

    const slug = `custom-${nom.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now()}`;

    const theme = await prisma.theme.create({
      data: {
        tenantId,
        nom,
        slug,
        description: description || "",
        badge: badge || "✦ Custom",
        config,
        effetId: effetId || null,
        actif: true,
      },
    });

    return NextResponse.json({ theme }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const NOMS_BUILTIN: Record<string, string> = {
  "noir-obsidien": "Noir Obsidien",
  "violet-cosmos": "Violet Cosmos",
  "terre-et-or": "Terre & Or",
  "ocean-atlantique": "Océan Atlantique",
  "kente-royal": "Kente Royal",
  "bwiti-forest": "Bwiti Forest",
};
const DESCS_BUILTIN: Record<string, string> = {
  "noir-obsidien": "Luxe & Mode Premium",
  "violet-cosmos": "Beauté & Art Digital",
  "terre-et-or": "Artisanat & Culture",
  "ocean-atlantique": "Luxe Côtier & Marine",
  "kente-royal": "Artisanat Africain Premium",
  "bwiti-forest": "Nature & Bien-être Bio",
};
const BADGES_BUILTIN: Record<string, string | null> = {
  "noir-obsidien": "✦ Premium",
  "violet-cosmos": "✦ Premium",
  "terre-et-or": null,
  "ocean-atlantique": "🌊 3D",
  "kente-royal": "👑 3D",
  "bwiti-forest": "🌿 3D",
};
const ORDRE_BUILTIN: Record<string, number> = {
  "terre-et-or": 1,
  "noir-obsidien": 2,
  "violet-cosmos": 3,
  "ocean-atlantique": 4,
  "kente-royal": 5,
  "bwiti-forest": 6,
};
