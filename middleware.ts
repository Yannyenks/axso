import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;
  const role = token?.role as string | undefined;
  const { pathname } = req.nextUrl;

  // ── Rediriger les utilisateurs connectés depuis les pages auth ──────────────
  if (pathname === "/connexion" || pathname === "/inscription") {
    if (isLoggedIn) {
      const dest = role === "livreur" ? "/livreur" : role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // ── Protection dashboard marchand ───────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const url = req.nextUrl.clone();
      url.pathname = "/connexion";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (role === "livreur") {
      return NextResponse.redirect(new URL("/livreur", req.url));
    }
  }

  // ── Protection panneau admin ────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/connexion", req.url));
    if (role !== "admin" && role !== "superadmin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // ── Protection espace livreur ───────────────────────────────────────────────
  if (pathname.startsWith("/livreur") && !pathname.startsWith("/inscription/livreur")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/connexion", req.url));
    if (role !== "livreur") return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
