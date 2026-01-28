"use client";

import { createContext, useContext, ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { useSession, Session } from "@/lib/auth-client";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  isAuthenticated: false
});

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  );
}

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
