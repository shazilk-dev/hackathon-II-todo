// Better Auth client-side exports
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : (process.env.BETTER_AUTH_URL || 'http://localhost:3000'),
});

// Re-export session type
export type { Session } from "better-auth";

// Export a user type based on the session
export type User = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

// Export the auth client functions
export const { signIn, signOut, useSession, getSession, signUp } = authClient;