// Public affiliate click tracker — redirects to storefront with cookie set
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  try {
    const lien = await prisma.affiliationLien.findUnique({
      where: { code },
      include: {
        tenant: { select: { slug: true } },
        produit: { select: { slug: true } },
      },
    });

    if (!lien || !lien.actif) {
      return NextResponse.redirect(appUrl || "/");
    }

    // Increment click counter (fire-and-forget)
    prisma.affiliationLien.update({
      where: { id: lien.id },
      data: { clics: { increment: 1 } },
    }).catch(() => {});

    // Determine destination
    const shopSlug = lien.tenant.slug;
    const prodSlug = lien.produit?.slug;
    const dest = prodSlug
      ? `${appUrl}/${shopSlug}/produits/${prodSlug}`
      : `${appUrl}/${shopSlug}`;

    const url = new URL(dest);
    url.searchParams.set("ref", code);

    const response = NextResponse.redirect(url.toString(), { status: 302 });

    // Set attribution cookie (duration = cookieJours)
    const maxAge = (lien.cookieJours ?? 30) * 86400;
    response.cookies.set(`aff_ref`, code, {
      maxAge,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch {
    return NextResponse.redirect(appUrl || "/");
  }
}
