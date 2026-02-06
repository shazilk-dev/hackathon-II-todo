"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession, User } from "@/lib/auth-client";

// Better Auth session data structure
interface SessionData {
  user: User;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface AuthContextType {
  data: SessionData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  data: null,
  isLoading: true,
  isAuthenticated: false
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: sessionData, isPending } = useSession();

  // Better Auth useSession returns { data: { user, session }, isPending }
  // Use the data directly without complex merging logic
  const contextValue: AuthContextType = {
    data: sessionData as SessionData | null,  // Contains both user and session from Better Auth
    isLoading: isPending,
    isAuthenticated: !!sessionData?.user
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
