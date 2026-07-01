// Proxy multi-tenant Axso — Next.js 16 (remplace middleware.ts)
// Routage par sous-domaine ou domaine custom
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DOMAINE_APP = process.env.NEXT_PUBLIC_AXSO_DOMAIN || "localhost:3000";

// Routes protégées (auth requise)
function estRouteDashboard(pathname: string): boolean {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/d/");
}

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

  // Détecter si c'est un sous-domaine de boutique
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

  // Expose pathname to server components via REQUEST header (not response header)
  // Server components read request headers via headers() — response headers are invisible to them
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
