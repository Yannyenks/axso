// API Route — Création de tenant (inscription boutique)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const schemaCreation = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  nomBoutique: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  categorie: z.string(),
  pays: z.string(),
  whatsapp: z.string().min(8),
  devise: z.string().default("XOF"),
  themeId: z.string().default("terre-et-or"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schemaCreation.parse(body);

    // Vérifier si l'email ou slug existe déjà
    const [emailExiste, slugExiste] = await Promise.all([
      prisma.user.findUnique({ where: { email: data.email } }),
      prisma.tenant.findUnique({ where: { slug: data.slug } }),
    ]);

    if (emailExiste) {
      return NextResponse.json(
        { message: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    if (slugExiste) {
      return NextResponse.json(
        { message: `L'URL "${data.slug}" est déjà prise. Essayez un autre nom.` },
        { status: 400 }
      );
    }

    // Créer le tenant et l'utilisateur en transaction
    const { tenant, user } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug: data.slug,
          nomBoutique: data.nomBoutique,
          categorie: data.categorie,
          pays: data.pays,
          devise: data.devise,
          whatsapp: data.whatsapp,
          email: data.email,
          themeId: data.themeId,
          commissionRate: 0.06,
          statut: "active",
          planType: "gratuit",
        },
      });

      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: await hash(data.password, 10),
          tenantId: tenant.id,
          role: "owner",
        },
      });

      return { tenant, user };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Boutique créée avec succès !",
        slug: tenant.slug,
        tenantId: tenant.id,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Données invalides", erreurs: err.issues },
        { status: 400 }
      );
    }

    console.error("[API/TENANTS] Erreur création:", err);
    return NextResponse.json(
      { message: "Erreur serveur — veuillez réessayer" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { auth } = await import("@/lib/auth");
    const { revalidatePath } = await import("next/cache");
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const tenantId = (session.user as any)?.tenantId;
    if (!tenantId) return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });

    const body = await request.json();
    const champs: Record<string, any> = {};
    const autorises = [
      "themeId", "logoUrl", "bannerUrl", "description", "metaTitle", "metaDescription",
      "whatsapp", "nomBoutique", "telephone", "adresse", "email", "categorie", "pays", "devise",
      "socialLinks", "parametresLivraison", "parametresPaiement", "themeConfig",
      "parametresCommande", "metaPixelId", "tiktokPixelId", "snapPixelId", "gtmId", "trackingScripts",
    ];
    for (const key of autorises) {
      if (body[key] !== undefined) champs[key] = body[key];
    }
    if (body.domainePropre !== undefined) champs.customDomain = body.domainePropre || null;

    // Le marchand ne peut basculer sa boutique qu'entre "active" et "pause" —
    // jamais écraser un statut administratif (ex: suspendu par Axso).
    if (body.statut === "active" || body.statut === "pause") {
      const actuel = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { statut: true } });
      if (actuel && (actuel.statut === "active" || actuel.statut === "pause")) {
        champs.statut = body.statut;
      }
    }

    const tenant = await prisma.tenant.update({ where: { id: tenantId }, data: champs });

    // Invalider le cache de toutes les pages storefront de cette boutique
    revalidatePath(`/${tenant.slug}`, "layout");

    return NextResponse.json({ success: true, tenant });
  } catch (err) {
    console.error("[API/TENANTS] Erreur PATCH:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        slug: true,
        nomBoutique: true,
        pays: true,
        statut: true,
        createdAt: true,
        _count: { select: { produits: true, commandes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tenants });
  } catch (err) {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
