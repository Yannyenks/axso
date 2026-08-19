export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { pourcentageRemise } from "@/lib/utils";
import { prixClient } from "@/lib/pricing";
import { resolveThemeConfigAsync } from "@/lib/theme-config-server";
import { ViewContentTracker } from "@/components/storefront/ViewContentTracker";
import { StorefrontNavbar } from "@/components/storefront/StorefrontNavbar";
import { ThemeEffect } from "@/components/themes/ThemeEffect";
import { ProductPageClient } from "@/components/storefront/ProductPageClient";

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const produit = await prisma.produit.findUnique({ where: { id } });
  if (!produit) return { title: "Produit introuvable" };
  const ogImageUrl = (produit as any).ogImage || produit.images[0] || null;
  return {
    title: produit.metaTitle || produit.nom,
    description: produit.metaDesc || produit.description || "",
    openGraph: {
      title: produit.metaTitle || produit.nom,
      description: produit.metaDesc || produit.description || "",
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : [],
    },
  };
}

export default async function ProduitPage({ params }: Props) {
  const { slug, id } = await params;

  const [tenant, produit] = await Promise.all([
    prisma.tenant.findUnique({
      where: { slug },
      include: { collections: { where: { actif: true }, take: 5 } },
    }),
    prisma.produit.findUnique({
      where: { id },
      include: {
        variantes: { orderBy: { nom: "asc" } },
        avis: {
          where: { approuve: true },
          include: { client: { select: { nom: true } } },
          take: 20,
          orderBy: { createdAt: "desc" },
        },
        collections: { select: { nom: true, slug: true } },
      },
    }),
  ]);

  if (!tenant || tenant.statut !== "active") notFound();
  if (!produit || produit.tenantId !== tenant.id || !produit.actif) notFound();

  const cfg = await resolveThemeConfigAsync(tenant.themeId, tenant.id, tenant.themeConfig as Record<string, any>);
  const { colors: c, radius } = cfg;

  const taux = tenant.commissionRate ?? 0.06;
  const prixAffiche = prixClient(produit.prix, taux);
  const prixCompareAffiche = produit.prixCompare ? prixClient(produit.prixCompare, taux) : null;
  const remise = prixCompareAffiche && prixCompareAffiche > prixAffiche
    ? pourcentageRemise(prixAffiche, prixCompareAffiche)
    : 0;
  const noteMoyenne = produit.avis.length > 0
    ? produit.avis.reduce((s, a) => s + a.note, 0) / produit.avis.length
    : 0;

  const produitsSimilairesRaw = await prisma.produit.findMany({
    where: {
      tenantId: tenant.id,
      actif: true,
      id: { not: produit.id },
      OR: produit.categorie ? [{ categorie: produit.categorie }] : undefined,
    },
    take: 4,
    orderBy: { ventes: "desc" },
  });

  const produitsSimilaires = produitsSimilairesRaw.map(p => ({
    id: p.id,
    nom: p.nom,
    images: p.images,
    prixAffiche: prixClient(p.prix, taux),
  }));

  const produitProps = {
    id: produit.id,
    nom: produit.nom,
    description: produit.description,
    descriptionIA: produit.descriptionIA,
    images: produit.images,
    prixAffiche,
    prixCompareAffiche,
    remise,
    stock: produit.stock,
    type: produit.type,
    fichierUrl: produit.fichierUrl,
    fichierNom: produit.fichierNom,
    categorie: produit.categorie,
    marque: (produit as any).marque ?? null,
    masquerVentes: (produit as any).masquerVentes ?? false,
    texteBoutonAchat: (produit as any).texteBoutonAchat ?? null,
    faq: Array.isArray((produit as any).faq) ? (produit as any).faq as { question: string; reponse: string }[] : [],
    variantes: produit.variantes.map(v => ({
      id: v.id,
      nom: v.nom,
      valeur: v.valeur,
      prix: v.prix ? prixClient(v.prix, taux) : null,
      stock: v.stock,
    })),
    avis: produit.avis.map(a => ({
      id: a.id,
      note: a.note,
      titre: a.titre,
      commentaire: a.commentaire,
      verifie: a.verifie,
      client: a.client,
      createdAt: a.createdAt.toISOString(),
    })),
    collections: produit.collections,
    noteMoyenne,
  };

  const tenantProps = {
    id: tenant.id,
    slug,
    nomBoutique: tenant.nomBoutique,
    devise: tenant.devise,
    certifie: tenant.certifie,
    accent: c.accent,
    fond: c.fond,
    texte: c.texte,
    surface: c.surface,
    radius,
    whatsapp: tenant.whatsapp ?? null,
    whatsappNumero: tenant.whatsappNumero ?? null,
    productPage: cfg.productPage ?? null,
  };

  return (
    <>
      <ThemeEffect themeId={tenant.themeId} />
      <ViewContentTracker produitId={produit.id} nom={produit.nom} prix={prixAffiche} devise={tenant.devise} />
      <StorefrontNavbar
        slug={slug}
        nomBoutique={tenant.nomBoutique}
        logoUrl={tenant.logoUrl}
        accent={c.accent}
        fond={c.fond}
        texte={c.texte}
        radius={radius}
        collections={tenant.collections}
        certifie={tenant.certifie}
      />
      <ProductPageClient
        produit={produitProps}
        tenant={tenantProps}
        produitsSimilaires={produitsSimilaires}
      />
    </>
  );
}
