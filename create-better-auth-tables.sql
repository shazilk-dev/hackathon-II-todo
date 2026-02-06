-- Better Auth Required Tables for PostgreSQL
-- Run this on your Neon database

-- 1. User table (core authentication)
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN DEFAULT FALSE NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Account table (OAuth + credentials)
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  password TEXT, -- Hashed password for credentials provider
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE("userId", "providerId")
);

-- 3. Session table
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "expiresAt" TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Verification table (email verification, password reset)
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_account_userId ON account("userId");
CREATE INDEX IF NOT EXISTS idx_session_userId ON session("userId");
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);

-- Success message
SELECT 'Better Auth tables created successfully!' AS status;
