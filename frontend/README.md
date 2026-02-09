# Todo Application - Frontend

Enterprise-grade Next.js 16 frontend application with authentication, real-time task management, and AI-powered chatbot interface.

## Overview

This is the client-side application for the Hackathon II Todo project, built with modern web technologies and following industry best practices. The frontend supports traditional web-based task management (Phase 2) and conversational AI interaction (Phase 3).

## Technology Stack

- **Framework**: Next.js 16 (App Router, React Server Components)
- **Language**: TypeScript 5.7+ (strict mode)
- **Styling**: Tailwind CSS 4+
- **UI Library**: React 19+
- **Authentication**: NextAuth.js (Auth.js) with JWT
- **State Management**: React Context API
- **API Client**: Custom fetch wrapper with JWT handling
- **Build Tool**: Turbopack (Next.js 16 default)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Client                         │
├─────────────────────────────────────────────────────────────┤
│  App Router Pages                                           │
│  ├── / (landing)                                           │
│  ├── /auth/sign-in                                         │
│  ├── /auth/sign-up                                         │
│  ├── /dashboard (protected - Phase 2)                      │
│  └── /chat (protected - Phase 3)                           │
├─────────────────────────────────────────────────────────────┤
│  Components                                                 │
│  ├── providers/ (AuthProvider)                             │
│  ├── layout/ (Header, Navigation)                          │
│  ├── tasks/ (TaskList, TaskItem, TaskForm)                │
│  └── chat/ (ChatInterface, ChatKit integration)           │
├─────────────────────────────────────────────────────────────┤
│  Libraries                                                  │
│  ├── auth.ts (NextAuth server config)                     │
│  ├── auth-client.ts (NextAuth client)                     │
│  └── api.ts (Backend API client with JWT)                 │
├─────────────────────────────────────────────────────────────┤
│  Middleware (Route Protection)                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌──────────────────────┐
              │  FastAPI Backend     │
              │  (Port 8000)         │
              └──────────────────────┘
```

## Prerequisites

**Required**:
- Node.js 18+ or Bun runtime
- PostgreSQL database (for NextAuth session storage)
- Backend API running (default: `http://localhost:8000`)

**Recommended**:
- pnpm or npm (latest versions)
- VS Code with TypeScript and ESLint extensions

## Prerequisites

**Required**:
- Node.js 18+ or Bun runtime
- PostgreSQL database (for NextAuth session storage)
- Backend API running (default: `http://localhost:8000`)

**Recommended**:
- pnpm or npm (latest versions)
- VS Code with TypeScript and ESLint extensions

---

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

Or using alternative package managers:
```bash
# Using pnpm (recommended for monorepos)
pnpm install

# Using Bun (fastest)
bun install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Authentication Configuration (NextAuth)
AUTH_SECRET=<generate-a-secure-32-character-secret>
NEXT_PUBLIC_AUTH_URL=http://localhost:3000

# Database Configuration (for NextAuth)
DATABASE_URL=postgresql://user:password@localhost:5432/hackathon_todo
```

**Generate a secure secret**:
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**CRITICAL**: The `AUTH_SECRET` must match the secret configured in the backend for JWT signature verification to work.

### 3. Database Setup

NextAuth requires database tables for user management. Run the migration script:

```bash
npm run db:migrate
# Or manually:
npx tsx scripts/migrate-db.ts
```

This creates the following tables:
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth provider accounts (if used)
- `verification_token` - Email verification tokens

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

**Verify Backend Connection**:
- Backend should be running on `http://localhost:8000`
- Check `/api/health` endpoint: `curl http://localhost:8000/health`

---

## Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── page.tsx                 # Landing page (/)
│   ├── globals.css              # Global Tailwind styles
│   ├── auth/                    # Authentication pages
│   │   ├── sign-in/
│   │   │   └── page.tsx        # Sign-in page
│   │   └── sign-up/
│   │       └── page.tsx        # Sign-up page
│   ├── dashboard/               # Task management (Phase 2)
│   │   └── page.tsx            # Dashboard with TaskList
│   ├── chat/                    # AI chatbot (Phase 3)
│   │   └── page.tsx            # Chat interface with ChatKit
│   └── api/                     # API routes
│       └── auth/
│           ├── [...nextauth]/route.ts  # NextAuth endpoints
│           └── token/route.ts         # JWT token minting
├── components/                   # React components
│   ├── providers/
│   │   └── AuthProvider.tsx    # Auth context provider
│   ├── layout/
│   │   └── Header.tsx          # Header with navigation
│   ├── tasks/                   # Task management components
│   │   ├── TaskList.tsx        # Task list container
│   │   ├── TaskItem.tsx        # Individual task item
│   │   └── TaskForm.tsx        # Create task form
│   └── chat/                    # Chatbot components
│       └── ChatInterface.tsx   # Chat UI (Phase 3)
├── lib/                         # Core libraries
│   ├── auth.ts                  # NextAuth server configuration
│   ├── auth-client.ts           # NextAuth client setup
│   └── api.ts                   # Backend API client
├── types/                       # TypeScript type definitions
│   ├── task.ts                  # Task types
│   └── auth.ts                  # Auth types
├── middleware.ts                # Route protection middleware
├── scripts/                     # Utility scripts
│   └── migrate-db.ts           # Database migration script
├── public/                      # Static assets
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── .env.local.example          # Environment variable template
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

---

## Available Scripts

Run these commands from the `frontend/` directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint linter |
| `npm run type-check` | Run TypeScript type checking |
| `npm run db:migrate` | Run database migrations for NextAuth |

---

## Key Features

### Authentication (Phase 2)

**Sign-Up Flow**:
1. User navigates to `/auth/sign-up`
2. Enters email and password
3. NextAuth creates user account in PostgreSQL
4. User is redirected to `/dashboard`

**Sign-In Flow**:
1. User navigates to `/auth/sign-in`
2. Enters credentials
3. NextAuth validates and creates session
4. JWT token stored in HTTP-only cookie (secure)
5. User is redirected to `/dashboard`

**Session Management**:
- Sessions persisted in PostgreSQL via Drizzle ORM
- JWT tokens included in API requests to backend
- Automatic token refresh on expiration
- Secure HTTP-only cookies prevent XSS attacks

**Route Protection**:
- Middleware intercepts requests to protected routes
- Unauthenticated users redirected to `/auth/sign-in`
- Protected routes: `/dashboard`, `/chat`

### Task Management (Phase 2)

**Features**:
- Create tasks with title and optional description
- View tasks with three filter modes:
  - All tasks
  - Pending tasks only
  - Completed tasks only
- Toggle task completion status
- Edit task details inline
- Delete tasks with confirmation
- Real-time UI updates after mutations

**Technical Implementation**:
- Optimistic UI updates for instant feedback
- Error boundaries for graceful error handling
- Loading states for all async operations
- Accessibility features (ARIA labels, keyboard navigation)

### AI Chatbot Interface (Phase 3)

**Natural Language Task Management**:
- Conversational interface using OpenAI ChatKit
- Natural language processing via OpenAI Agents SDK
- Context-aware responses
- Conversation history persistence

**Example Interactions**:
```
User: "Add a task to buy groceries"
AI: "I've added 'Buy groceries' to your task list."

User: "Show me my pending tasks"
AI: "You have 2 pending tasks: 1. Buy groceries, 2. Call mom"

User: "Mark the first one as done"
AI: "'Buy groceries' has been marked as complete."
```

---

## API Integration

The frontend communicates with the FastAPI backend using the API client in `lib/api.ts`.

### API Client Features

- **Automatic JWT Injection**: Includes JWT token in `Authorization` header
- **Token Minting**: Calls `/api/auth/token` to generate backend JWT
- **Error Handling**: Standardized error responses
- **Type Safety**: Full TypeScript type definitions
- **Retry Logic**: Automatic retry on transient failures

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{user_id}/tasks` | List tasks (with filters) |
| POST | `/api/{user_id}/tasks` | Create new task |
| GET | `/api/{user_id}/tasks/{task_id}` | Get specific task |
| PUT | `/api/{user_id}/tasks/{task_id}` | Update task |
| PATCH | `/api/{user_id}/tasks/{task_id}/complete` | Toggle completion |
| DELETE | `/api/{user_id}/tasks/{task_id}` | Delete task |
| POST | `/api/{user_id}/chat` | Send chat message (Phase 3) |

**Query Parameters** (GET list):
- `status`: `all` | `pending` | `completed`
- `sort`: `created` | `title`

---

## TypeScript Configuration

The project uses TypeScript strict mode for maximum type safety:

**tsconfig.json highlights**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Type Safety Guidelines**:
- 100% type coverage (no `any` types)
- Explicit return types on all functions
- Proper typing for all props and state
- Type guards for runtime validation
- Discriminated unions for complex states

---

## Styling and Design System

### Tailwind CSS Configuration

**Color Palette** (Professional Minimalist):
- **Primary**: Blue 600 (accent color)
- **Neutral**: Slate 50-900 (grayscale)
- **Success**: Green 600
- **Error**: Red 600
- **Warning**: Amber 600

**Typography**:
- Font Family: System font stack (native look and feel)
- Headings: `text-2xl`, `text-xl`, `text-lg` (semantic sizes)
- Body: `text-base`, `text-sm`, `text-xs`
- Font Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

**Responsive Breakpoints**:
```css
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

**Design Principles**:
- Intelligent minimalism (clarity without clutter)
- Consistent spacing (4px grid system)
- High contrast for accessibility (WCAG AA compliant)
- Smooth transitions (200-300ms)
- Purposeful animations (no gratuitous effects)

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL | `http://localhost:8000` |
| `AUTH_SECRET` | Yes | NextAuth JWT signing secret (32+ chars) | `<generated-secret>` |
| `NEXT_PUBLIC_AUTH_URL` | Yes | Frontend base URL for auth callbacks | `http://localhost:3000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `NODE_ENV` | No | Environment mode | `development` | `production` |

---

## Security Considerations

### Authentication Security

- **JWT Tokens**: Stored in HTTP-only cookies (not accessible via JavaScript)
- **CSRF Protection**: Built-in NextAuth CSRF tokens
- **Password Hashing**: bcrypt with salt rounds (handled by NextAuth)
- **Session Expiration**: Configurable session lifetime
- **Token Rotation**: Automatic refresh token rotation

### API Security

- **CORS**: Backend validates origin headers
- **Input Validation**: All inputs validated client-side and server-side
- **XSS Prevention**: React auto-escapes rendered content
- **SQL Injection**: Drizzle ORM uses parameterized queries

### Production Hardening

**Content Security Policy** (CSP):
```typescript
// next.config.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL};
`
```

**Security Headers**:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

---

## Testing

While there are no automated tests in the current implementation, here's the recommended testing strategy:

### Manual Testing Checklist

**Authentication**:
- [ ] Sign-up with valid email/password
- [ ] Sign-up with invalid inputs (validation)
- [ ] Sign-in with correct credentials
- [ ] Sign-in with incorrect credentials
- [ ] Access protected route while logged out (should redirect)
- [ ] Sign-out and verify session cleared

**Task Management**:
- [ ] Create task with title only
- [ ] Create task with title and description
- [ ] View all tasks
- [ ] Filter by pending tasks
- [ ] Filter by completed tasks
- [ ] Toggle task completion
- [ ] Edit task title and description
- [ ] Delete task
- [ ] Verify empty state when no tasks

**Chatbot** (Phase 3):
- [ ] Send message to create task
- [ ] Ask AI to list tasks
- [ ] Request task completion via chat
- [ ] Verify conversation history persists

### Recommended Testing Tools

For production applications, consider adding:
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Playwright or Cypress
- **Type Tests**: `tsd` or `vitest`
- **Accessibility**: `axe-core` or `jest-axe`
- **Visual Regression**: Chromatic or Percy

---

## Troubleshooting

### Common Issues and Solutions

**Issue: "Authentication not working"**
- **Cause**: `AUTH_SECRET` mismatch between frontend and backend
- **Solution**: Verify both `.env.local` (frontend) and `.env` (backend) use identical secrets

**Issue: "API calls failing with 401 Unauthorized"**
- **Cause**: Backend not running or CORS misconfigured
- **Solution**: 
  1. Verify backend is running: `curl http://localhost:8000/health`
  2. Check backend `CORS_ORIGINS` includes `http://localhost:3000`

**Issue: "Cannot connect to database"**
- **Cause**: Invalid `DATABASE_URL` or PostgreSQL not running
- **Solution**:
  1. Verify PostgreSQL is running
  2. Test connection: `psql $DATABASE_URL`
  3. Check credentials and database name

**Issue: "TypeScript errors in

**Issue: "TypeScript errors in IDE"**
- **Cause**: Dependencies not installed or outdated
- **Solution**:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm run type-check
  ```

**Issue: "Styles not applying"**
- **Cause**: Tailwind CSS not compiling
- **Solution**:
  1. Verify `globals.css` is imported in `app/layout.tsx`
  2. Check `tailwind.config.ts` content paths
  3. Restart dev server: `npm run dev`

**Issue: "Slow development server"**
- **Cause**: Large node_modules or file watchers
- **Solution**:
  - Use Turbopack: `npm run dev --turbo` (Next.js 16 default)
  - Exclude `node_modules` from file watchers in VS Code

---

## Performance Optimization

### Production Build

```bash
npm run build
npm run start
```

**Build Optimizations**:
- Tree shaking removes unused code
- Code splitting per route
- Image optimization (Next.js Image component)
- Font optimization (next/font)
- Minification and compression

### Performance Metrics

**Target Metrics** (Lighthouse):
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

**Core Web Vitals**:
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

---

## Deployment

### Deploy to Vercel (Recommended)

Vercel is the creator of Next.js and provides optimal hosting:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Configuration**:
1. Connect GitHub repository in Vercel dashboard
2. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_AUTH_URL`
   - `DATABASE_URL`
3. Deploy automatically on push to `main` branch

### Deploy to Other Platforms

#### Docker Container

```dockerfile
# Use Node.js Alpine for smaller image
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t todo-frontend .
docker run -p 3000:3000 --env-file .env.local todo-frontend
```

#### Kubernetes

See Phase 4 manifests in `k8s/base/frontend-deployment.yaml` and Phase 5 for Azure AKS deployment.

---

## Development Guidelines

### Code Style

**File Naming**:
- Components: PascalCase (`TaskList.tsx`)
- Utilities: camelCase (`api.ts`)
- Pages: lowercase (`page.tsx`, `layout.tsx`)

**Component Structure**:
```typescript
// 1. Imports (grouped: React, Next.js, UI, types)
import { useState } from 'react'
import Link from 'next/link'

// 2. Type definitions
interface TaskItemProps {
  task: Task
  onToggle: (id: string) => Promise<void>
}

// 3. Component
export function TaskItem({ task, onToggle }: TaskItemProps) {
  // 4. Hooks
  const [isLoading, setIsLoading] = useState(false)
  
  // 5. Handlers
  const handleToggle = async () => {
    setIsLoading(true)
    await onToggle(task.id)
    setIsLoading(false)
  }
  
  // 6. Render
  return (
    <div>
      {/* ... */}
    </div>
  )
}
```

**Best Practices**:
- Use Server Components by default (add `'use client'` only when needed)
- Prefer composition over prop drilling
- Extract complex logic into custom hooks
- Use TypeScript discriminated unions for state management
- Implement error boundaries for production robustness

### Accessibility

**WCAG 2.1 AA Compliance**:
- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators
- Color contrast ratios  4.5:1
- Screen reader compatibility

**Example**:
```typescript
<button
  onClick={handleDelete}
  aria-label={`Delete task ${task.title}`}
  className="focus:ring-2 focus:ring-blue-600 focus:outline-none"
>
  Delete
</button>
```

### State Management

**Local State**: Use `useState` for component-level state
```typescript
const [isOpen, setIsOpen] = useState(false)
```

**Server State**: Use React Server Components and `fetch` with Next.js caching
```typescript
async function TaskList() {
  const tasks = await fetchTasks() // Automatically cached
  return <>{/* ... */}</>
}
```

**Global State**: Use Context API for cross-component state
```typescript
// providers/AuthProvider.tsx
export const AuthContext = createContext<AuthContextType>(null!)

// Usage
const { user, signOut } = useAuth()
```

---

## Additional Resources

### Documentation

- **Project Docs**:
  - [Backend README](../backend/README.md) - FastAPI backend setup
  - [Main README](../README.md) - Complete project overview
  - [Phase 3 Guide](../guides/PHASE3_MASTER_GUIDE.md) - AI chatbot implementation
  
- **External Docs**:
  - [Next.js Documentation](https://nextjs.org/docs)
  - [React Documentation](https://react.dev)
  - [Tailwind CSS](https://tailwindcss.com/docs)
  - [NextAuth.js](https://next-auth.js.org)
  - [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Development Tools

- **VS Code Extensions** (Recommended):
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features
  - Path Intellisense
  - Error Lens

- **Browser Extensions** (Testing):
  - React Developer Tools
  - Redux DevTools (if using Redux)
  - Lighthouse
  - axe DevTools (accessibility)

---

## Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes with type-safe code
3. Run linter: `npm run lint`
4. Run type check: `npm run type-check`
5. Test manually in browser
6. Commit with descriptive message
7. Push and create pull request

### Code Review Checklist

- [ ] TypeScript strict mode passing
- [ ] ESLint warnings resolved
- [ ] All props properly typed
- [ ] Accessibility considerations addressed
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] Error states handled gracefully
- [ ] Loading states implemented
- [ ] No console errors or warnings

---

## License

This project was created as part of Hackathon II following Spec-Driven Development (SDD) principles.

---

## Support

For issues or questions:
- Review [CLAUDE.md](./CLAUDE.md) for detailed development guidelines
- Check [Backend README](../backend/README.md) for API integration
- Consult [Main README](../README.md) for overall project context
- Refer to [Phase-specific guides](../guides/) for detailed workflows

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: Production Ready

