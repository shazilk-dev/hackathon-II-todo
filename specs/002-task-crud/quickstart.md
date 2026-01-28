# Quickstart Guide: Next.js 16 Frontend Development

**Feature**: Task CRUD Web Interface
**Prerequisites**: Node.js 20+, npm or pnpm, Backend API running (FastAPI)
**Estimated Setup Time**: 15-20 minutes

---

## 1. Project Initialization

### Create Next.js 16 Project

```bash
cd hackathon-todo/
npx create-next-app@latest frontend

# During setup, select:
✔ Would you like to use TypeScript? Yes
✔ Would you like to use ESLint? Yes
✔ Would you like to use Tailwind CSS? Yes
✔ Would you like to use `src/` directory? Yes
✔ Would you like to use App Router? Yes
✔ Would you like to customize the default import alias (@/*)? Yes (keep default @/*)
✔ Would you like to use Turbopack for next dev? Yes
```

### Navigate to Frontend Directory

```bash
cd frontend/
```

---

## 2. Install Dependencies

### Core Dependencies

```bash
npm install better-auth zod react-hook-form @hookform/resolvers lucide-react date-fns
```

**Package Purposes**:
- `better-auth`: JWT authentication library
- `zod`: Schema validation (forms, API contracts)
- `react-hook-form`: Form state management
- `@hookform/resolvers`: Zod integration for react-hook-form
- `lucide-react`: Icon library (professional minimalist icons)
- `date-fns`: Date formatting utilities

### shadcn/ui Setup

```bash
npx shadcn@latest init

# During setup, select:
✔ Which style would you like to use? Default
✔ Which color would you like to use as base color? Slate
✔ Would you like to use CSS variables for colors? Yes
```

### Install shadcn/ui Components

```bash
npx shadcn@latest add button input label textarea dialog toast checkbox
```

**Components Installed**:
- `button`: Primary/secondary action buttons
- `input`: Text input fields
- `label`: Form field labels
- `textarea`: Multi-line text input
- `dialog`: Modal dialogs (create/edit/delete task)
- `toast`: Notification toasts (success/error messages)
- `checkbox`: Task completion checkbox

---

## 3. Development Dependencies

### Testing Libraries

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### E2E Testing

```bash
npm install -D playwright @playwright/test
npx playwright install
```

### Linting & Formatting

```bash
npm install -D prettier prettier-plugin-tailwindcss eslint-config-prettier
```

---

## 4. Configuration Files

### TypeScript Configuration (`tsconfig.json`)

Ensure strict mode is enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Next.js Configuration (`next.config.ts`)

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    cacheComponents: true  // Next.js 16: disable default caching for security
  },
  reactStrictMode: true,
  poweredByHeader: false   // Security: remove "X-Powered-By" header
}

export default nextConfig
```

### Tailwind Configuration (`tailwind.config.ts`)

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',  // Enable dark mode support (future feature)
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui CSS variables (configured during init)
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

### Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '.next/']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

Create test setup file:

```typescript
// tests/setup.ts
import '@testing-library/jest-dom'
```

### Playwright Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Prettier Configuration (`.prettierrc`)

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## 5. Environment Variables

### Create `.env.local`

```bash
# .env.local (NOT committed to git)

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Secret (shared with backend)
BETTER_AUTH_SECRET=your-32-character-minimum-secret-here

# Next.js URL
NEXTAUTH_URL=http://localhost:3000
```

**Important**:
- Generate `BETTER_AUTH_SECRET` with: `openssl rand -base64 32`
- Same secret must be used in backend `.env`
- Add `.env.local` to `.gitignore`

### Update `.gitignore`

Ensure these are ignored:

```
# Environment variables
.env.local
.env.*.local

# Testing
coverage/
playwright-report/
test-results/

# Next.js
.next/
out/
```

---

## 6. Folder Structure Setup

Create the directory structure:

```bash
mkdir -p src/app/\(auth\)/{signin,signup}
mkdir -p src/app/tasks
mkdir -p src/components/{ui,auth,tasks}
mkdir -p src/lib/{api,auth,hooks,validation,contexts}
mkdir -p src/types
mkdir -p tests/{unit,integration,e2e}
```

### Create proxy.ts (Next.js 16)

```typescript
// src/app/proxy.ts
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  // Check for auth token cookie
  const token = request.cookies.get('auth-token')

  // Redirect to sign-in if accessing protected routes without token
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/tasks')

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/tasks/:path*']  // Apply to protected routes only
}
```

**Note**: `proxy.ts` replaces `middleware.ts` in Next.js 16

---

## 7. Better Auth Setup

### Create Better Auth Config

```typescript
// src/lib/auth/config.ts
import { betterAuth } from 'better-auth'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  database: {
    // Backend handles user storage
    // Better Auth in frontend is client-only for session management
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days
    updateAge: 60 * 60 * 24,       // Update session every 24 hours
  },
  jwt: {
    enabled: true,
  },
  cookies: {
    name: 'auth-token',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
})
```

---

## 8. Development Scripts

### Update `package.json`

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 9. Run Development Server

### Start Backend (FastAPI)

Ensure backend is running on `http://localhost:8000`

```bash
# In separate terminal (backend directory)
cd ../backend
uv run uvicorn src.main:app --reload
```

### Start Frontend

```bash
# In frontend directory
npm run dev
```

**Access Application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 10. Verification Checklist

Before starting implementation, verify:

- [ ] Next.js 16 dev server starts without errors
- [ ] TypeScript strict mode enabled (`tsc --noEmit` passes)
- [ ] Tailwind CSS applied (check page has Tailwind classes)
- [ ] shadcn/ui components installed (`src/components/ui/` exists)
- [ ] Environment variables loaded (`.env.local` exists)
- [ ] Backend API accessible (visit http://localhost:8000/docs)
- [ ] Vitest runs (`npm run test` executes successfully)
- [ ] Playwright installed (`npm run test:e2e` shows browser tests)

---

## 11. First Task: Create Landing Page

### Create Home Page

```typescript
// src/app/page.tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Todo App</h1>
      <p className="mt-4 text-lg text-slate-600">
        A modern task management application
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="/signin"
          className="rounded-md bg-slate-900 px-6 py-3 text-white hover:bg-slate-800"
        >
          Sign In
        </a>
        <a
          href="/signup"
          className="rounded-md border border-slate-300 px-6 py-3 hover:bg-slate-50"
        >
          Sign Up
        </a>
      </div>
    </main>
  )
}
```

### Test Page Renders

Visit http://localhost:3000 - should see landing page with "Todo App" heading

---

## 12. Next Steps

After quickstart setup is complete:

1. **Run `/sp.tasks`**: Generate task breakdown from plan
2. **Run `/sp.implement`**: Execute tasks to build features
3. **Follow TDD**: Write tests alongside implementation
4. **Run type-check frequently**: `npm run type-check`
5. **Commit often**: Use task IDs in commit messages

---

## Troubleshooting

### Port 3000 Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Backend Not Accessible

- Verify backend is running: `curl http://localhost:8000`
- Check CORS configuration in backend allows `http://localhost:3000`
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`

### TypeScript Errors

- Run `npm run type-check` to see all errors
- Ensure `tsconfig.json` has `strict: true`
- Check `@types/node` is installed: `npm install -D @types/node`

### Tailwind Not Working

- Verify `globals.css` imports Tailwind directives:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- Check `tailwind.config.ts` content paths include `src/**/*.{ts,tsx}`
- Restart dev server after Tailwind config changes

---

## Summary

This quickstart guide covers:

1. ✅ Project initialization with Next.js 16
2. ✅ Dependency installation (Better Auth, shadcn/ui, Zod, testing libraries)
3. ✅ Configuration (TypeScript strict mode, Tailwind, Vitest, Playwright)
4. ✅ Environment variables (`.env.local` with API URL and auth secret)
5. ✅ Folder structure (App Router, components, lib, types, tests)
6. ✅ Better Auth setup (JWT, HTTP-only cookies)
7. ✅ Development scripts (dev, build, test, lint)
8. ✅ Verification checklist

**Total Time**: ~20 minutes
**Ready for**: `/sp.tasks` → `/sp.implement` workflow

---

**Next Command**: `/sp.tasks` (generates task breakdown for implementation)
