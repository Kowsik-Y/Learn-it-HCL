/**
 * Next.js Middleware — Server-side JWT validation
 *
 * Validates JWT tokens for protected routes.
 * Uses the 'jose' library (edge-compatible, no Node.js crypto needed).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || "change-this-to-a-random-secret-in-production"
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── API routes: validate Authorization header ──
  if (pathname.startsWith("/api/")) {
    // Public API routes that don't need auth
    const publicAPIs = ["/api/auth/login", "/api/auth/request-access", "/api/auth/refresh"];
    if (publicAPIs.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // All other API routes require a valid Bearer token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    try {
      const token = authHeader.slice(7);
      await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      return NextResponse.next();
    } catch {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: "Invalid or expired token" } },
        { status: 401 }
      );
    }
  }

  // ── Page routes: validate cookie token ──
  const token = request.cookies.get("access_token")?.value;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/request-access");

  // If trying to access an authenticated route without a token
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If there's a token, validate it
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      // Token is valid, redirect away from auth pages
      if (isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Token is invalid/expired
      if (!isAuthPage) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("access_token");
        return response;
      }
      // If they are already on auth page with invalid token, just let them stay
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Page routes
    "/dashboard/:path*",
    "/courses/:path*",
    "/tutor/:path*",
    "/skills/:path*",
    "/assessments/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/org/:path*",
    "/login",
    "/request-access",
    // API routes (except public ones handled inside middleware)
    "/api/:path*",
  ],
};
