// NextAuth v5 client-side exports
// This file provides a compatibility layer for the auth client
// The actual NextAuth configuration is in lib/auth.ts

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession as nextAuthUseSession, getSession as nextAuthGetSession } from "next-auth/react";

export const signIn = nextAuthSignIn;
export const signOut = nextAuthSignOut;
export const useSession = nextAuthUseSession;
export const getSession = nextAuthGetSession;

// Re-export session type
export type { Session } from "next-auth";

// Export a user type based on the session
export type User = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

// SignUp wrapper to maintain compatibility with Better Auth pattern
export const signUp = {
  email: async (data: { email: string; password: string; name?: string }) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || { message: "Signup failed" } };
      }

      // After successful signup, sign in the user
      const signInResult = await nextAuthSignIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        return { error: { message: signInResult.error } };
      }

      return { data: result.user };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Signup failed",
        },
      };
    }
  },
};
