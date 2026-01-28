/**
 * Test importing db module
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

console.log("1. Environment loaded");
console.log("2. Importing db module...");

import("./lib/db")
  .then(({ db }) => {
    console.log("3. ✅ DB module imported");
    console.log("4. DB type:", typeof db);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ FAILED:");
    console.error(error);
    process.exit(1);
  });

setTimeout(() => {
  console.error("⏱️  TIMEOUT");
  process.exit(1);
}, 5000);
