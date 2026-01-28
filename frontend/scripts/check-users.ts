import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../lib/db";
import { users, accounts } from "../lib/auth-schema";
import { eq } from "drizzle-orm";

async function checkUsers() {
  try {
    console.log("🔍 Checking database for users...\n");

    const allUsers = await db.select().from(users);

    console.log(`Found ${allUsers.length} user(s):\n`);

    for (const user of allUsers) {
      console.log("User:", {
        id: user.id,
        email: user.email,
        name: user.name,
      });

      const userAccounts = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, user.id));

      console.log(`  - Has ${userAccounts.length} account(s)`);
      console.log("");
    }

    if (allUsers.length === 0) {
      console.log("⚠️  No users found in database!");
      console.log("💡 You need to sign up first at http://localhost:3000/auth/sign-up\n");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking users:", error);
    process.exit(1);
  }
}

checkUsers();
