import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const url = request.nextUrl.clone();

  const mainDomain = process.env.NEXT_PUBLIC_AXSO_DOMAIN ?? "axso.vercel.app";
  const host = hostname.replace(/^www\./, "").split(":")[0];

  // Sous-domaine détecté : myboutique.axso.vercel.app ou myboutique.axso.com
  if (host !== mainDomain && host.endsWith(`.${mainDomain}`)) {
    const slug = host.replace(`.${mainDomain}`, "");

    // Réserver les sous-domaines système
    if (["admin", "api", "www", "dashboard", "app"].includes(slug)) {
      return NextResponse.next();
    }

    // Réécrire /path → /[slug]/path sans changer l'URL visible
    const rewritePath = url.pathname === "/" ? `/${slug}` : `/${slug}${url.pathname}`;
    url.pathname = rewritePath;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|icons|images).*)"],
};
