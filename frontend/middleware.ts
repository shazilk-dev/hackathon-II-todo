import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/chat"];
const authRoutes = ["/auth/sign-in", "/auth/sign-up"];

/**
 * Middleware for optimistic authentication redirects.
 *
 * IMPORTANT: This uses lightweight cookie checks only (no database calls).
 * Full session validation happens in Server Components/Actions.
 *
 * Following Better Auth best practices:
 * "It's recommended to only check for the existence of a session cookie
 * to handle redirection. To avoid blocking requests by making API or database calls."
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check if path is an auth route
  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check for Better Auth session cookie (lightweight check, no validation)
  const sessionCookie = request.cookies.get("better-auth.session_token") ||
                        request.cookies.get("session_token");

  // Redirect to sign-in if accessing protected route without session cookie
  if (isProtectedRoute && !sessionCookie) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to dashboard if accessing auth pages with session cookie
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/chat/:path*", "/auth/:path*"]
};

// Node.js runtime (though not needed for cookie checks)
export const runtime = "nodejs";
