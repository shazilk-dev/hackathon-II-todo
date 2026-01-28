import { NextResponse } from "next/server";
import { testConnection } from "@/lib/db";

/**
 * Health check endpoint to test database connectivity
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now();

  try {
    const dbConnected = await testConnection();
    const elapsed = Date.now() - startTime;

    if (dbConnected) {
      return NextResponse.json({
        status: "healthy",
        database: "connected",
        latency_ms: elapsed,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          status: "unhealthy",
          database: "failed",
          latency_ms: elapsed,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        latency_ms: elapsed,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
