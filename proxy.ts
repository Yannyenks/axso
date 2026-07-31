// Proxy multi-tenant Axso — Next.js 16 (remplace middleware.ts)
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DOMAINE_APP = process.env.NEXT_PUBLIC_AXSO_DOMAIN || "localhost:3000";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Ignorer les fichiers statiques
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ── Auth JWT (Edge-compatible, sans Prisma) ───────────────────────────────
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;
  const role = token?.role as string | undefined;

  // Rediriger les utilisateurs connectés depuis les pages auth
  if (pathname === "/connexion" || pathname === "/inscription") {
    if (isLoggedIn) {
      const dest = role === "livreur" ? "/livreur" : role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // Protéger /dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (role === "livreur") {
      return NextResponse.redirect(new URL("/livreur", request.url));
    }
  }

  // Protéger /admin
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/connexion", request.url));
    if (role !== "admin" && role !== "superadmin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Protéger /livreur
  if (pathname.startsWith("/livreur") && !pathname.startsWith("/inscription/livreur")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/connexion", request.url));
    if (role !== "livreur") return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Multi-tenant routing ──────────────────────────────────────────────────
  const estSousDomaine =
    hostname !== DOMAINE_APP &&
    hostname.endsWith(`.${DOMAINE_APP}`) &&
    !hostname.startsWith("www.");

  const estDomainePropre =
    hostname !== DOMAINE_APP &&
    !hostname.endsWith(`.${DOMAINE_APP}`) &&
    !hostname.startsWith("localhost");

  if (estSousDomaine || estDomainePropre) {
    const slug = estSousDomaine
      ? hostname.replace(`.${DOMAINE_APP}`, "")
      : hostname;
    const url = request.nextUrl.clone();
    url.pathname = `/${slug}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Expose pathname aux server components + headers sécurité
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
