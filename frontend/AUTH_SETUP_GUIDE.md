# Authentication Setup Guide

## Fixed Issues

### Problem
Sign-in was getting stuck at "Signing you in..." and not redirecting to the dashboard.

### Root Causes
1. **Database Connection Issue**: Frontend Better Auth was trying to connect to a local PostgreSQL database that didn't exist
2. **SSL Configuration**: Database URL had incorrect SSL mode for Neon PostgreSQL
3. **Connection Pool**: Using `pg.Pool` directly was causing connection timeout issues with serverless databases
4. **Missing Database Tables**: Better Auth tables hadn't been created in the database

### Solutions Applied

#### 1. Updated Database Configuration
- **File**: `frontend/.env.local`
- **Change**: Updated `DATABASE_URL` to use Neon PostgreSQL with correct SSL mode
- **Before**: `postgresql://user:password@localhost:5432/hackathon_todo`
- **After**: `postgresql://neondb_owner:***@ep-dark-sky-a13pc5ob-pooler.ap-southeast-1.aws.neon.tech/neondb?ssl=true`

#### 2. Fixed Better Auth Configuration
- **File**: `frontend/lib/auth.ts`
- **Change**: Switched from manual `Pool` connection to Better Auth's built-in database config
- **Improvement**: Better compatibility with Neon's serverless architecture

```typescript
// BEFORE (using manual Pool)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const auth = betterAuth({
  database: pool as any,
  // ...
});

// AFTER (using Better Auth's database config)
export const auth = betterAuth({
  database: {
    provider: "postgres",
    url: process.env.DATABASE_URL as string,
  },
  // ...
});
```

#### 3. Ran Database Migrations
- **Command**: `npx tsx scripts/migrate-db.ts`
- **Result**: Created all required Better Auth tables:
  - `user` table (id, email, emailVerified, name, image, timestamps)
  - `session` table (id, userId, expiresAt, token, ipAddress, userAgent, timestamps)
  - `account` table (id, userId, accountId, providerId, password, tokens, timestamps)
  - `verification` table (id, identifier, value, expiresAt, timestamps)

#### 4. Improved Sign-In/Sign-Up Flow
- **Files**: `frontend/app/auth/sign-in/page.tsx`, `frontend/app/auth/sign-up/page.tsx`
- **Changes**:
  - Removed artificial 800ms delay
  - Added console logging for debugging
  - Improved error messages
  - Added fullscreen loading overlay
  - Fixed redirect logic using `router.replace()` instead of `router.push()`

#### 5. Enhanced Middleware Cookie Detection
- **File**: `frontend/middleware.ts`
- **Changes**:
  - Check multiple cookie variations for Better Auth sessions
  - Added return URL support for better UX
  - Improved redirect logic

## How to Start the Application

### Prerequisites
- Node.js 18+ installed
- Backend server running on port 8000
- Environment variables configured

### Step 1: Start Backend (if not already running)
```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uvicorn src.main:app --reload --port 8000
```

Verify backend is running:
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok","environment":"development","version":"..."}
```

### Step 2: Start Frontend
```bash
cd frontend
npm run dev
```

The application will start on http://localhost:3000

### Step 3: Test Authentication

#### Create a New Account
1. Navigate to http://localhost:3000/auth/sign-up
2. Fill in:
   - Full name (e.g., "John Doe")
   - Email (e.g., "john@example.com")
   - Password (minimum 8 characters with mixed case, numbers, symbols)
3. Click "Create account"
4. You should see the fullscreen loading overlay: "Creating your account..."
5. Upon success, you'll be instantly redirected to `/dashboard`

#### Sign In with Existing Account
1. Navigate to http://localhost:3000/auth/sign-in
2. Enter your email and password
3. Click "Sign in"
4. You should see the fullscreen loading overlay: "Signing you in..."
5. Upon success, you'll be instantly redirected to `/dashboard`

### Step 4: Debug Issues (if needed)

#### Check Browser Console
Open browser DevTools (F12) and check the Console tab for:
- "Starting sign-in process..." - indicates authentication request started
- "Sign-in response: {...}" - shows the response from Better Auth
- "Sign-in successful, redirecting to dashboard" - indicates success
- Any error messages will be logged as "Sign-in exception: ..."

#### Common Error Messages
- **"Cannot connect to authentication server"**: Backend server not running on port 8000
- **"Network error"**: Check your internet connection or database connectivity
- **"Invalid email or password"**: Credentials are incorrect
- **"Authentication failed: [error]"**: Check browser console for detailed error

#### Verify Database Connection
```bash
# From frontend directory
npx tsx scripts/migrate-db.ts

# Should output:
# ✓ Created user table
# ✓ Created session table
# ✓ Created account table
# ✓ Created verification table
# ✅ Migration completed successfully!
```

## Environment Variables

### Frontend (.env.local)
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Configuration
BETTER_AUTH_SECRET=DYzLOUg2P7Tk03JxLmIItv7dvBLyyMTzr43yOOUBWJc=
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_URL=http://localhost:3000

# Database URL for Better Auth (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:***@ep-dark-sky-a13pc5ob-pooler.ap-southeast-1.aws.neon.tech/neondb?ssl=true
```

### Backend (.env)
```bash
# Database Configuration
DATABASE_URL=postgresql+asyncpg://neondb_owner:***@ep-dark-sky-a13pc5ob-pooler.ap-southeast-1.aws.neon.tech/neondb?ssl=require

# Authentication (MUST match frontend)
BETTER_AUTH_SECRET=DYzLOUg2P7Tk03JxLmIItv7dvBLyyMTzr43yOOUBWJc=

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Application Environment
ENVIRONMENT=development
DEBUG=true
```

**CRITICAL**: Both frontend and backend MUST use the same `BETTER_AUTH_SECRET` for JWT validation to work!

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Sign-In    │───▶│ Better Auth  │───▶│  Dashboard   │  │
│  │    Page      │    │  (lib/auth)  │    │    Page      │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                               │
│         │                    │                               │
│         ▼                    ▼                               │
│  ┌──────────────────────────────────┐                       │
│  │   Neon PostgreSQL Database       │                       │
│  │   - user table                   │                       │
│  │   - session table                │                       │
│  │   - account table                │                       │
│  │   - verification table           │                       │
│  └──────────────────────────────────┘                       │
│                     ▲                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
┌─────────────────────┼────────────────────────────────────────┐
│                     │         Backend (FastAPI)              │
│                     │                                        │
│  ┌──────────────────▼──────┐    ┌──────────────┐           │
│  │  JWT Middleware         │───▶│  Task API    │           │
│  │  (validates tokens)     │    │  Endpoints   │           │
│  └─────────────────────────┘    └──────────────┘           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Authentication Flow
1. User submits sign-in form
2. Better Auth creates user session in database
3. Better Auth returns JWT token in HTTP-only cookie
4. Frontend redirects to dashboard
5. Middleware checks for session cookie
6. API requests include JWT cookie
7. Backend validates JWT and processes request

## Production Deployment Checklist

When deploying to production:

- [ ] Update `BETTER_AUTH_URL` to production URL
- [ ] Update `NEXT_PUBLIC_API_URL` to production backend URL
- [ ] Update `CORS_ORIGINS` in backend to include production frontend URL
- [ ] Ensure `useSecureCookies` is enabled (automatically done when `NODE_ENV=production`)
- [ ] Run database migrations on production database
- [ ] Verify `BETTER_AUTH_SECRET` matches between frontend and backend
- [ ] Test authentication flow in production environment
- [ ] Remove console.log statements (or use production logging service)

## Files Changed

1. `frontend/.env.local` - Updated database URL and configuration
2. `frontend/lib/auth.ts` - Fixed Better Auth database configuration
3. `frontend/app/auth/sign-in/page.tsx` - Improved sign-in flow
4. `frontend/app/auth/sign-up/page.tsx` - Improved sign-up flow
5. `frontend/middleware.ts` - Enhanced cookie detection
6. `frontend/scripts/migrate-db.ts` - Database migration script (already existed)

## Next Steps

1. Start both backend and frontend servers
2. Test the complete authentication flow
3. If issues persist, check browser console and server logs
4. Verify database connectivity using the migration script

## Support

If you encounter issues:
1. Check browser console for detailed error messages
2. Verify backend server is running: `curl http://localhost:8000/health`
3. Check database connection: `npx tsx scripts/migrate-db.ts`
4. Ensure environment variables match between frontend and backend
5. Review this guide's "Debug Issues" section
