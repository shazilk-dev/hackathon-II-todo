/**
 * Test Neon connection in isolation
 */

import { config } from "dotenv";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

console.log("1. Environment loaded");
console.log("2. Creating Neon client...");

try {
  const sql = neon(process.env.DATABASE_URL);
  console.log("3. Neon client created successfully");

  console.log("4. Testing query...");
  const result = await sql`SELECT 1 as test`;
  console.log("5. ✅ Query successful:", result);

  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}
