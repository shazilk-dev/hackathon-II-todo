import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

// Create PostgreSQL connection pool
// Using standard 'pg' package for Better Auth compatibility
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false }, // Neon requires SSL
});

// Create Better Auth instance with PostgreSQL Pool
// This is the standard approach from Better Auth docs
export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL,
  trustHost: true,
  trustedOrigins: [
    "http://135.235.178.119",
    "https://fehrist.shazilkhan.dev",
  ],

  // Session configuration
  session: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  // Email & password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // For hackathon simplicity
    minPasswordLength: 8,
    autoSignIn: false, // Industry standard: manual sign-in after signup
  },

  // Account linking
  account: {
    accountLinking: {
      enabled: true,
    },
  },

  // User configuration (Better Auth manages user table automatically)
  user: {},

  // API endpoints
  socialProviders: {
    // Add social providers if needed later
  },

  // Plugins (nextCookies must be last)
  plugins: [
    nextCookies(), // Automatically handles Set-Cookie headers in server actions
  ],
});

// Export types
export type { Session } from "better-auth";
