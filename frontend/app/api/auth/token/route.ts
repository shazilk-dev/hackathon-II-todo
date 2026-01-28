import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as jwt from "jsonwebtoken";

/**
 * GET /api/auth/token
 *
 * Exchanges a NextAuth session for a JWT token that can be used with the FastAPI backend.
 *
 * Note: User syncing between NextAuth and backend is handled by the backend on first request.
 */
export async function GET() {
  try {
    // Get the NextAuth session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Generate a JWT token for the backend
    // This JWT will be validated by the FastAPI backend using the same secret
    const token = jwt.sign(
      {
        sub: session.user.id,  // user_id
        email: session.user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
      },
      process.env.AUTH_SECRET!,
      { algorithm: "HS256" }
    );

    return NextResponse.json({
      token,
      user_id: session.user.id,
      email: session.user.email
    });

  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
