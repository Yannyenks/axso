import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DOMAINE_APP = process.env.NEXT_PUBLIC_AXSO_DOMAIN || "localhost:3000";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
