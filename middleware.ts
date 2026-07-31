import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role as string | undefined;

  // ── Rediriger les utilisateurs connectés depuis les pages auth ────────────
  if (pathname === "/connexion" || pathname === "/inscription") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(
        role === "livreur" ? "/livreur" : role === "admin" ? "/admin" : "/dashboard",
        req.url
      ));
    }
    return NextResponse.next();
  }

  // ── Protection dashboard marchand ─────────────────────────────────────────
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
    return NextResponse.next();
  }

  // ── Protection panneau admin ──────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/connexion", req.url));
    if (role !== "admin" && role !== "superadmin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ── Protection espace livreur ─────────────────────────────────────────────
  if (pathname.startsWith("/livreur") && !pathname.startsWith("/inscription/livreur")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/connexion", req.url));
    if (role !== "livreur") return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // ── En-têtes de sécurité OWASP ────────────────────────────────────────────
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "on");

  return response;
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
