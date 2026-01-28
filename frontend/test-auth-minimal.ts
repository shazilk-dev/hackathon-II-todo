/**
 * Minimal test to check if Better Auth can be imported
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

console.log("1. Environment loaded");
console.log("   DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("   BETTER_AUTH_SECRET exists:", !!process.env.BETTER_AUTH_SECRET);

// Dynamic import to catch errors
import("./lib/auth")
  .then(({ auth }) => {
    console.log("2. Auth module imported successfully");
    console.log("   Auth type:", typeof auth);
    console.log("3. ✅ SUCCESS - Better Auth initialized without errors");
    process.exit(0);
  })
  .catch((error) => {
    console.error("2. ❌ FAILED to import auth module:");
    console.error(error);
    process.exit(1);
  });

// Set a timeout to detect hanging
setTimeout(() => {
  console.error("⏱️  TIMEOUT - Auth module import is hanging");
  process.exit(1);
}, 10000);
