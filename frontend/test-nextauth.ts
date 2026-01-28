/**
 * Test NextAuth v5 initialization
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

console.log("1. Environment loaded");
console.log("   AUTH_SECRET exists:", !!process.env.AUTH_SECRET);
console.log("   DATABASE_URL exists:", !!process.env.DATABASE_URL);

console.log("2. Importing Auth.js module...");

import("./lib/auth")
  .then(({ auth }) => {
    console.log("3. ✅ Auth.js module imported successfully!");
    console.log("   Auth type:", typeof auth);
    console.log("4. ✅ SUCCESS - NextAuth v5 works with Neon!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ FAILED:");
    console.error(error);
    process.exit(1);
  });

// Timeout
setTimeout(() => {
  console.error("⏱️  TIMEOUT - Auth module import is hanging");
  process.exit(1);
}, 10000);
