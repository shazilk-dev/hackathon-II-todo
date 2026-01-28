/**
 * Test Better Auth initialization
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

async function testAuth() {
  try {
    console.log("Testing Better Auth initialization...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL?.split('@')[1]?.split('?')[0]);
    console.log("BETTER_AUTH_SECRET exists:", !!process.env.BETTER_AUTH_SECRET);

    // Import auth configuration
    const { auth } = await import("./lib/auth");

    console.log("✅ Better Auth initialized successfully!");
    console.log("Auth object:", typeof auth);

    process.exit(0);
  } catch (error) {
    console.error("❌ Better Auth initialization failed:");
    console.error(error);
    process.exit(1);
  }
}

testAuth();
