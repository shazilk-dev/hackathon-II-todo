/**
 * Better Auth Database Migration
 *
 * Creates the required database tables for Better Auth.
 * Run with: npx tsx scripts/migrate-db.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { Pool } from "pg";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("Starting Better Auth migration...");

    // Create user table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
        name TEXT NOT NULL,
        image TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✓ Created user table");

    // Create session table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
      );
    `);
    console.log("✓ Created session table");

    // Create account table (for email/password auth)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "account" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        password TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE,
        UNIQUE("providerId", "accountId")
      );
    `);
    console.log("✓ Created account table");

    // Create verification table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✓ Created verification table");

    console.log("\n✅ Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
