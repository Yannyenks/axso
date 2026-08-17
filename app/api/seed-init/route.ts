// Route temporaire — créer les 3 comptes de test sur Neon
// Appeler UNE SEULE FOIS : GET /api/seed-init?token=axso-seed-2024
// Supprimer ce fichier après utilisation
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

const SECRET = "axso-seed-2024";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("token") !== SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const password = await hash("axso2024", 10);

    const boutiques = [
      {
        slug: "mode-aminata",
        nomBoutique: "Mode Aminata",
        description: "La mode africaine contemporaine à votre portée",
        categorie: "Mode & Vêtements",
        pays: "SN",
        devise: "XOF",
        whatsapp: "+221771234567",
        email: "aminata@modeaminata.sn",
        telephone: "+221771234567",
        adresse: "Rue 10, Almadies, Dakar",
        themeId: "noir-obsidien",
        planType: "premium",
        userName: "Aminata Diallo",
      },
      {
        slug: "beaute-grace",
        nomBoutique: "Beauté Grâce",
        description: "Cosmétiques naturels africains pour une peau rayonnante",
        categorie: "Beauté & Cosmétiques",
        pays: "CI",
        devise: "XOF",
        whatsapp: "+2250701234567",
        email: "grace@beautegrace.ci",
        telephone: "+2250701234567",
        adresse: "Cocody Riviera 3, Abidjan",
        themeId: "violet-cosmos",
        planType: "gratuit",
        userName: "Grâce Kouassi",
      },
      {
        slug: "marche-douala",
        nomBoutique: "Marché Douala",
        description: "Produits artisanaux et alimentaires du Cameroun",
        categorie: "Alimentation & Artisanat",
        pays: "CM",
        devise: "XAF",
        whatsapp: "+237691234567",
        email: "contact@marchedouala.cm",
        telephone: "+237691234567",
        adresse: "Bonanjo, Douala",
        themeId: "terre-et-or",
        planType: "gratuit",
        userName: "Jean-Pierre Mbarga",
      },
    ];

    const created: string[] = [];

    for (const b of boutiques) {
      // Upsert tenant
      const tenant = await prisma.tenant.upsert({
        where: { slug: b.slug },
        update: {},
        create: {
          slug: b.slug,
          nomBoutique: b.nomBoutique,
          description: b.description,
          categorie: b.categorie,
          pays: b.pays,
          devise: b.devise,
          whatsapp: b.whatsapp,
          email: b.email,
          telephone: b.telephone,
          adresse: b.adresse,
          themeId: b.themeId,
          commissionRate: 0.06,
          statut: "active",
          planType: b.planType,
        },
      });

      // Upsert user
      await prisma.user.upsert({
        where: { email: b.email },
        update: {},
        create: {
          name: b.userName,
          email: b.email,
          password,
          tenantId: tenant.id,
          role: "owner",
        },
      });

      created.push(`${b.nomBoutique} (${b.email})`);
    }

    return NextResponse.json({
      ok: true,
      message: "Comptes créés avec succès",
      comptes: created,
      credentials: [
        "aminata@modeaminata.sn / axso2024",
        "grace@beautegrace.ci / axso2024",
        "contact@marchedouala.cm / axso2024",
      ],
    });
  } catch (err: any) {
    console.error("[seed-init]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
