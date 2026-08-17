import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { analyserBusinessEtCreerPlan, type PlanBoutique } from "@/lib/ai-agent";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schemaAnalyser = z.object({
  phase: z.literal("analyser"),
  description: z.string().min(10),
});

const schemaExecuter = z.object({
  phase: z.literal("executer"),
  plan: z.object({
    nomBoutique: z.string(),
    slug: z.string(),
    categorie: z.string(),
    pays: z.string(),
    devise: z.string(),
    themeId: z.string(),
    description: z.string().optional(),
    produits: z.array(z.object({
      nom: z.string(),
      description: z.string().optional(),
      prix: z.number(),
      stock: z.number().optional(),
      categorie: z.string(),
      imageUrl: z.string().optional(),
      type: z.enum(["physique", "digital"]).optional(),
    })),
    livraison: z.object({
      locale: z.number(),
      nationale: z.number(),
      gratuite: z.number(),
    }).optional(),
    sections: z.array(z.object({
      type: z.string(),
      label: z.string(),
      config: z.record(z.string(), z.any()),
    })).optional(),
  }),
  compte: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    whatsapp: z.string().min(8).optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.phase === "analyser") {
      const { description } = schemaAnalyser.parse(body);

      const plan = await analyserBusinessEtCreerPlan(description);

      // Vérifier unicité du slug et ajuster si nécessaire
      let slug = plan.slug || slugify(plan.nomBoutique);
      const slugExiste = await prisma.tenant.findUnique({ where: { slug } });
      if (slugExiste) slug = `${slug}-${Date.now().toString(36)}`;

      return NextResponse.json({ plan: { ...plan, slug }, messageIA: plan.messageIA });
    }

    if (body.phase === "executer") {
      const { plan, compte } = schemaExecuter.parse(body);

      // Vérifier que l'email n'existe pas déjà
      const emailExiste = await prisma.user.findUnique({ where: { email: compte.email } });
      if (emailExiste) {
        return NextResponse.json({ message: "Cet email est déjà utilisé" }, { status: 400 });
      }

      // Vérifier unicité du slug
      let slug = plan.slug;
      const slugExiste = await prisma.tenant.findUnique({ where: { slug } });
      if (slugExiste) slug = `${slug}-${Date.now().toString(36)}`;

      const parametresLivraison = plan.livraison ? {
        locale: plan.livraison.locale,
        nationale: plan.livraison.nationale,
        gratuiteA: plan.livraison.gratuite,
      } : {};

      // Transformer les sections du plan IA en CustomSection pour le themeConfig
      const customSections = (plan.sections ?? []).map((s: any, i: number) => ({
        id: `ia-${s.type}-${i}`,
        type: s.type,
        label: s.label,
        actif: true,
        ordre: i + 1,
        config: s.config ?? {},
      }));

      // Transaction : créer tenant + user + produits
      const { tenant, produitsCreees } = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            slug,
            nomBoutique: plan.nomBoutique,
            categorie: plan.categorie,
            pays: plan.pays,
            devise: plan.devise,
            whatsapp: compte.whatsapp || "",
            email: compte.email,
            themeId: plan.themeId,
            description: plan.description || "",
            parametresLivraison,
            commissionRate: 0.06,
            statut: "active",
            planType: "gratuit",
            themeConfig: customSections.length > 0
              ? { customSections }
              : {},
          },
        });

        await tx.user.create({
          data: {
            name: compte.name,
            email: compte.email,
            password: await hash(compte.password, 10),
            tenantId: tenant.id,
            role: "owner",
          },
        });

        const produitsCreees: string[] = [];
        for (const p of plan.produits.slice(0, 5)) {
          const produitSlug = slugify(p.nom) || `produit-${Date.now()}`;
          try {
            await tx.produit.create({
              data: {
                tenantId: tenant.id,
                nom: p.nom,
                slug: produitSlug,
                description: p.description || "",
                prix: p.prix,
                stock: p.stock ?? 10,
                categorie: p.categorie,
                images: p.imageUrl ? [p.imageUrl] : [],
                type: p.type ?? "physique",
                actif: true,
                featured: true,
              },
            });
            produitsCreees.push(p.nom);
          } catch {
            // Ignorer les doublons de slug produit
          }
        }

        return { tenant, produitsCreees };
      });

      return NextResponse.json({
        success: true,
        slug: tenant.slug,
        tenantId: tenant.id,
        produitsCreees: produitsCreees.length,
      }, { status: 201 });
    }

    return NextResponse.json({ message: "Phase invalide" }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: "Données invalides", erreurs: err.issues }, { status: 400 });
    }
    if ((err as any)?.message?.includes("configuré") || (err as any)?.message?.includes("GEMINI_API_KEY")) {
      return NextResponse.json({ message: "Aucun fournisseur IA configuré. Ajoute GEMINI_API_KEY dans .env.local" }, { status: 503 });
    }
    console.error("[API/AI/ONBOARDING]", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
