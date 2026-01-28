/**
 * Test Drizzle with Neon in isolation
 */

import { config } from "dotenv";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

console.log("1. Environment loaded");
console.log("2. Creating Neon client...");

try {
  const sql = neon(process.env.DATABASE_URL);
  console.log("3. Neon client created");

  console.log("4. Creating Drizzle instance...");
  const db = drizzle(sql);
  console.log("5. Drizzle instance created");

  console.log("6. Testing SQL query through Drizzle...");
  const result = await db.execute(sql`SELECT 1 as test`);
  console.log("7. ✅ Query successful:", result);

  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}
