/**
 * Drop Better Auth tables before recreating with CLI
 */

import { config } from "dotenv";
import { resolve } from "path";
import { Pool } from "pg";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function dropTables() {
  const client = await pool.connect();

  try {
    console.log("Dropping Better Auth tables...");

    await client.query(`DROP TABLE IF EXISTS "verification" CASCADE;`);
    console.log("✓ Dropped verification table");

    await client.query(`DROP TABLE IF EXISTS "account" CASCADE;`);
    console.log("✓ Dropped account table");

    await client.query(`DROP TABLE IF EXISTS "session" CASCADE;`);
    console.log("✓ Dropped session table");

    await client.query(`DROP TABLE IF EXISTS "user" CASCADE;`);
    console.log("✓ Dropped user table");

    console.log("\n✅ All tables dropped successfully!");

  } catch (error) {
    console.error("❌ Failed to drop tables:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

dropTables().catch(console.error);
