---
name: better-auth
description: Configure Better Auth for authentication with JWT tokens. Use when implementing sign-up, sign-in, sign-out, or JWT token handling between Next.js frontend and FastAPI backend.
allowed-tools: Read, Write, Glob, Grep
---

# Better Auth Skill

## Overview

Better Auth handles authentication on the Next.js frontend and issues JWT tokens that the FastAPI backend can verify.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS FRONTEND                           │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐│
│  │  Better Auth    │    │         Your App                    ││
│  │  (/api/auth/*) │    │  ┌─────────────────────────────────┐││
│  │                 │    │  │  Auth Pages                     │││
│  │  - Sign Up     │◄───┤  │  /auth/sign-in                  │││
│  │  - Sign In     │    │  │  /auth/sign-up                  │││
│  │  - Sign Out    │    │  └─────────────────────────────────┘││
│  │  - Get Session │    │  ┌─────────────────────────────────┐││
│  │                 │    │  │  Protected Pages                │││
│  │  Creates JWT ──┼────┼──┤  /dashboard                     │││
│  │  token         │    │  │  Uses JWT for API calls         │││
│  └─────────────────┘    │  └─────────────────────────────────┘││
└─────────────────────────┴─────────────────────────────────────┘│
                                      │
                                      │ Authorization: Bearer <JWT>
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  JWT Middleware                                             ││
│  │  - Extracts token from Authorization header                ││
│  │  - Verifies signature using BETTER_AUTH_SECRET             ││
│  │  - Extracts user_id from payload                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Installation

```bash
# Frontend
npm install better-auth @better-auth/react
```

## Environment Variables

Both frontend and backend need the same secret:

```env
# Shared between frontend and backend
BETTER_AUTH_SECRET=your-super-secret-key-at-least-32-characters-long

# Frontend only
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@host/db

# Backend only
# Same BETTER_AUTH_SECRET as frontend
```

## Frontend Setup

### 1. Server Auth Config (lib/auth.ts)

```typescript
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

// Create a connection pool for Better Auth
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const auth = betterAuth({
  // Database configuration
  database: {
    type: "postgres",
    // Use raw pg pool (Better Auth handles this)
  },
  
  // Enable email/password authentication
  emailAndPassword: {
    enabled: true,
    // Require email verification (optional)
    requireEmailVerification: false,
    // Password requirements
    minPasswordLength: 8
  },
  
  // Session configuration - USE JWT!
  session: {
    strategy: "jwt",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update token daily
  },
  
  // Secret for signing JWTs
  secret: process.env.BETTER_AUTH_SECRET,
  
  // Base URL
  baseURL: process.env.BETTER_AUTH_URL,
  
  // Plugins
  plugins: [
    nextCookies() // Handle cookies in Next.js
  ],
  
  // Trust host in production
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000"
  ]
});

// Export types
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

### 2. API Route Handler (app/api/auth/[...all]/route.ts)

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### 3. Client Auth Config (lib/auth-client.ts)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000"
});

// Export auth functions
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession
} = authClient;

// Export types for use in components
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
```

### 4. Sign In Page (app/auth/sign-in/page.tsx)

```tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await signIn.email({
        email,
        password
      });
      
      if (result.error) {
        setError(result.error.message || "Sign in failed");
        return;
      }
      
      // Redirect to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/auth/sign-up" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### 5. Sign Up Page (app/auth/sign-up/page.tsx)

```tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await signUp.email({
        name,
        email,
        password
      });
      
      if (result.error) {
        setError(result.error.message || "Sign up failed");
        return;
      }
      
      // Redirect to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 8 characters
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### 6. Get JWT Token for API Calls

```typescript
// In your API client or component
import { getSession } from "@/lib/auth-client";

async function makeAuthenticatedRequest(url: string) {
  const session = await getSession();
  
  if (!session?.session?.token) {
    throw new Error("Not authenticated");
  }
  
  // The token is the JWT
  const jwt = session.session.token;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json"
    }
  });
  
  return response.json();
}
```

## Backend JWT Verification

### FastAPI JWT Middleware (backend/src/auth/jwt.py)

```python
import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import os

# Get secret from environment
BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")

if not BETTER_AUTH_SECRET:
    raise ValueError("BETTER_AUTH_SECRET environment variable is required")

security = HTTPBearer()

def decode_jwt(token: str) -> dict:
    """
    Decode and verify a JWT token.
    
    Better Auth JWT payload typically contains:
    - sub: user ID
    - email: user email
    - name: user name
    - iat: issued at timestamp
    - exp: expiration timestamp
    """
    try:
        payload = jwt.decode(
            token,
            BETTER_AUTH_SECRET,
            algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """
    FastAPI dependency to get current authenticated user.
    
    Usage:
        @router.get("/protected")
        async def protected_route(user: dict = Depends(get_current_user)):
            user_id = user["sub"]
            # ...
    """
    token = credentials.credentials
    return decode_jwt(token)

def verify_user_access(current_user: dict, user_id: str) -> None:
    """
    Verify that the authenticated user has access to the requested resource.
    
    Usage:
        @router.get("/{user_id}/tasks")
        async def get_tasks(
            user_id: str,
            current_user: dict = Depends(get_current_user)
        ):
            verify_user_access(current_user, user_id)
            # ...
    """
    if current_user.get("sub") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this resource"
        )
```

## Database Tables

Better Auth creates these tables automatically:

```sql
-- users table
CREATE TABLE "user" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    "emailVerified" BOOLEAN DEFAULT FALSE,
    image TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- sessions table
CREATE TABLE "session" (
    id TEXT PRIMARY KEY,
    "userId" TEXT REFERENCES "user"(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- accounts table (for OAuth providers)
CREATE TABLE "account" (
    id TEXT PRIMARY KEY,
    "userId" TEXT REFERENCES "user"(id) ON DELETE CASCADE,
    "providerId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    -- ... other fields
);
```

## JWT Payload Structure

When Better Auth creates a JWT, it typically contains:

```json
{
  "sub": "user_abc123",          // User ID
  "email": "user@example.com",   // User email
  "name": "John Doe",            // User name
  "iat": 1704067200,             // Issued at (Unix timestamp)
  "exp": 1704672000              // Expires at (Unix timestamp)
}
```

## Troubleshooting

### Common Issues

1. **"Invalid token" error**
   - Check that BETTER_AUTH_SECRET is the same in frontend and backend
   - Ensure token hasn't expired

2. **"No token provided" error**
   - Check Authorization header format: `Bearer <token>`
   - Ensure frontend is sending the token

3. **Database connection issues**
   - Better Auth needs direct DB access for user management
   - FastAPI backend only needs JWT verification (no DB for auth)

4. **CORS issues**
   - Add frontend URL to backend CORS origins
   - Ensure credentials are included in fetch requests

### Debug Tips

```python
# Backend: Log JWT payload for debugging
@router.get("/debug/token")
async def debug_token(current_user: dict = Depends(get_current_user)):
    return {
        "user_id": current_user.get("sub"),
        "email": current_user.get("email"),
        "expires": current_user.get("exp")
    }
```

```typescript
// Frontend: Log session for debugging
const session = await getSession();
console.log("Session:", session);
console.log("Token:", session?.session?.token);
```
