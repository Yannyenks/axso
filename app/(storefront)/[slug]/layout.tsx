import { prisma } from "@/lib/prisma";
import { resolveThemeConfigAsync } from "@/lib/theme-config-server";
import { AxiaStorefront } from "@/components/storefront/AxiaStorefront";
import { StorefrontPopups } from "@/components/storefront/StorefrontPopups";
import { MetaPixel } from "@/components/storefront/MetaPixel";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function StorefrontLayout({ children, params }: Props) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, nomBoutique: true, themeId: true, themeConfig: true, metaPixelId: true },
  });

  if (!tenant) return <>{children}</>;

  const cfg = await resolveThemeConfigAsync(tenant.themeId, tenant.id, (tenant.themeConfig as Record<string, any>) || {});
  const accent = cfg.colors?.accent ?? "#F5A623";

  return (
    <>
      {children}
      <AxiaStorefront slug={slug} nomBoutique={tenant.nomBoutique} accentColor={accent} />
      <StorefrontPopups slug={slug} accentColor={accent} />
      {tenant.metaPixelId && <MetaPixel pixelId={tenant.metaPixelId} />}
    </>
  );
}
