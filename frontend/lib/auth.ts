import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, withRetry } from "./db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users, accounts } from "./auth-schema";

// Validate required environment variables
if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET environment variable is required");
}

console.log("Initializing Auth.js with Neon database");

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Trust host for development (required for NextAuth v5)
  trustHost: true,

  // Session strategy - use JWT for serverless compatibility (no database needed)
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },

  // Authentication providers
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("❌ Missing email or password");
          return null;
        }

        try {
          console.log("🔍 Looking for user:", credentials.email);

          // Find user by email (with retry for Neon cold starts)
          const [user] = await withRetry(async () => {
            return db
              .select()
              .from(users)
              .where(eq(users.email, credentials.email as string))
              .limit(1);
          });

          if (!user) {
            console.error("❌ User not found:", credentials.email);
            return null;
          }

          console.log("✅ User found:", user.id);

          // Get password from accounts table (with retry for Neon cold starts)
          const [account] = await withRetry(async () => {
            return db
              .select()
              .from(accounts)
              .where(eq(accounts.userId, user.id))
              .limit(1);
          });

          if (!account?.password) {
            console.error("❌ No password found for user:", user.id);
            return null;
          }

          console.log("✅ Account found, verifying password...");

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            account.password
          );

          if (!isPasswordValid) {
            console.error("❌ Invalid password for user:", user.id);
            return null;
          }

          console.log("✅ Password valid, authentication successful");

          // Return user object (will be encoded in JWT)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("❌ Auth error:", error);
          return null;
        }
      },
    }),
  ],

  // Callbacks for JWT and session
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  // Pages
  pages: {
    signIn: "/auth/sign-in",
    signOut: "/auth/sign-out",
    error: "/auth/error",
  },

  // Secret for JWT signing
  secret: process.env.AUTH_SECRET,
});

console.log("Auth.js initialized successfully");

// Export types
export type { Session } from "next-auth";
