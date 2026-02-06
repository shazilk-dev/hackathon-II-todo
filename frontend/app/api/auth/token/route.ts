import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as jwt from "jsonwebtoken";
import { rateLimit } from "@/lib/rate-limiter";

// Force Node.js runtime (jsonwebtoken requires Node.js APIs, not Edge Runtime)
export const runtime = 'nodejs';

/**
 * GET /api/auth/token
 *
 * Exchanges a Better Auth session (from HTTP-only cookie) for a JWT token
 * that can be used with the FastAPI backend via Authorization header.
 *
 * Authentication Flow:
 * 1. Frontend has Better Auth session cookie (HTTP-only, secure)
 * 2. This endpoint validates the Better Auth session via auth.api.getSession()
 * 3. Returns JWT token in response body (NOT in cookie)
 * 4. Frontend caches JWT in memory and sends via Authorization: Bearer header
 * 5. Backend validates JWT signature and extracts user_id from 'sub' claim
 *
 * Security:
 * - Better Auth session: HTTP-only cookie (XSS-safe)
 * - JWT: Returned in response body, cached in memory, sent in headers
 * - Rate limited: 10 requests/minute per IP
 *
 * Note: User syncing between Better Auth and backend is handled by the backend on first request.
 */
export async function GET(request: Request) {
  try {
    // Implement rate limiting - max 10 requests per minute per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `token_${ip}`;
    const rateLimitResult = rateLimit(rateLimitKey, 10, 60000); // 10 requests per minute

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: { message: rateLimitResult.error } },
        { status: 429 }
      );
    }

    // Get the Better Auth session using the API method
    const session = await auth.api.getSession({
      headers: new Headers(request.headers),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Generate a JWT token for the backend
    // This JWT will be validated by the FastAPI backend using the same secret
    const authSecret = process.env.BETTER_AUTH_SECRET;
    if (!authSecret) {
      throw new Error("BETTER_AUTH_SECRET environment variable is required");
    }

    const token = jwt.sign(
      {
        sub: session.user.id,  // user_id
        email: session.user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
      },
      authSecret,
      { algorithm: "HS256" }
    );

    return NextResponse.json({
      token,
      user_id: session.user.id,
      email: session.user.email
    });

  } catch (error) {
    // Detailed error logging for debugging
    console.error("[Token Endpoint] Error details:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Failed to generate token",
        // Include error details in development mode only
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : String(error)
        })
      },
      { status: 500 }
    );
  }
}
