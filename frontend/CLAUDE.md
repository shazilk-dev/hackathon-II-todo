# Claude Code Rules - Frontend (Next.js 16)

This file provides frontend-specific instructions for the Next.js 16 todo application. These rules supplement the root-level CLAUDE.md and constitution.md.

**Project**: Hackathon II - Todo Web App (Frontend)
**Tech Stack**: Next.js 16, TypeScript 5.7+, Tailwind CSS 4+, Better Auth, React 19+
**Architecture**: Multi-tier web app (Frontend tier, communicates with FastAPI backend)

---

## Core Guarantees (Frontend Product Promise)

- **TypeScript Strict Mode**: 100% type coverage, no `any`, no type escape hatches
- **Design Standards**: Professional minimalist aesthetic (2025 industry standards), no emojis, no childish elements
- **Accessibility**: WCAG 2.1 AA compliance (4.5:1 contrast, keyboard navigation, screen reader support)
- **Performance**: LCP < 2.5s, FCP < 1.5s, CLS < 0.1, bundle < 200KB gzipped
- **Security**: JWT in HTTP-only cookies, no XSS vulnerabilities, 401 redirects to /signin
- **Testing**: 80% coverage minimum (60% unit, 30% integration, 10% E2E)

---

## Project Structure (Frontend-Specific)

```
frontend/
├── src/
│   ├── app/                    # Next.js 16 App Router
│   │   ├── (auth)/             # Route group for authentication
│   │   │   ├── signin/         # Sign-in page
│   │   │   │   └── page.tsx
│   │   │   └── signup/         # Sign-up page
│   │   │       └── page.tsx
│   │   ├── tasks/              # Protected tasks page
│   │   │   └── page.tsx
│   │   ├── layout.tsx          # Root layout (providers, fonts)
│   │   ├── page.tsx            # Landing page
│   │   ├── proxy.ts            # Next.js 16 proxy (auth redirect)
│   │   └── error.tsx           # Global error boundary
│   ├── components/             # React components (UI layer)
│   │   ├── ui/                 # Reusable shadcn/ui primitives
│   │   ├── auth/               # Auth-specific components
│   │   └── tasks/              # Task feature components
│   ├── lib/                    # Utilities and API clients
│   │   ├── api/                # Backend API client layer
│   │   ├── auth/               # Better Auth configuration
│   │   ├── hooks/              # Custom React hooks
│   │   ├── contexts/           # Context API providers
│   │   ├── validation/         # Zod schemas
│   │   └── utils.ts            # Utility functions
│   ├── types/                  # TypeScript type definitions
│   │   ├── task.ts             # Task entity types
│   │   ├── auth.ts             # Auth types
│   │   ├── api.ts              # API contract types
│   │   └── ui.ts               # UI state types
│   └── styles/                 # Global styles
│       └── globals.css         # Tailwind directives + custom styles
├── tests/
│   ├── unit/                   # Vitest unit tests
│   ├── integration/            # API integration tests (MSW)
│   └── e2e/                    # Playwright E2E tests
├── public/                     # Static assets
├── .env.local                  # Environment variables (NOT committed)
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript strict configuration
├── vitest.config.ts            # Vitest configuration
└── playwright.config.ts        # Playwright configuration
```

---

## Tech Stack Standards

### Next.js 16 Specific

**App Router (MANDATORY)**:
- All routes in `src/app/` directory
- Use route groups: `(auth)` for authentication routes
- File conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

**proxy.ts (Next.js 16 Breaking Change)**:
- **CRITICAL**: Use `proxy.ts` NOT `middleware.ts` (Next.js 16 renamed it)
- Export `proxy()` function (NOT `middleware()`)
- Keep logic lightweight: redirect checks only, no JWT validation, no database calls
- JWT validation in Server Components/Actions (Node.js runtime)

```typescript
// src/app/proxy.ts (CORRECT)
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')

  if (!token && request.nextUrl.pathname.startsWith('/tasks')) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/tasks/:path*']
}
```

**Server Components vs Client Components**:
- **Default to Server Components** (no "use client" directive)
- Use Client Components ONLY for:
  - Forms with state (useState, useForm)
  - Interactive elements (onClick handlers)
  - Browser APIs (localStorage, window)
  - React hooks (useEffect, useContext)
- Examples:
  - Server: Layout, static task list structure, auth page layout
  - Client: TaskForm, TaskItem (checkbox), FilterButtons, SignInForm

**Caching Strategy (Next.js 16)**:
- Enable `cacheComponents: true` in next.config.ts
- NO default caching (security: prevents data leaks)
- Use `use cache` directive ONLY for static content
- Task data: ALWAYS fetch at request time (user-specific)

---

### TypeScript Standards

**Strict Mode (NON-NEGOTIABLE)**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Type Coverage**:
- 100% type coverage (every function, variable, component)
- Explicit return types on all functions
- Component props MUST have interface/type definition
- NO `any`, NO `@ts-ignore`, NO `as unknown as X` (requires justification if used)

**Naming Conventions**:
- **Components**: PascalCase (`TaskList.tsx`, `TaskItem.tsx`)
- **Functions/Variables**: camelCase (`getTasks`, `userId`)
- **Types/Interfaces**: PascalCase (`Task`, `TaskFormData`)
- **Files**: Match content (PascalCase for components, camelCase for utilities)
- **Hooks**: camelCase with `use` prefix (`useTasks`, `useAuth`)

**Type Definitions** (from data-model.md):
```typescript
// types/task.ts
export interface Task {
  id: number
  user_id: string
  title: string
  description: string | null
  completed: boolean
  created_at: string  // ISO 8601
  updated_at: string  // ISO 8601
}

export interface TaskFormData {
  title: string       // 1-200 characters
  description?: string
}

// types/api.ts - API contracts match backend
export interface CreateTaskRequest {
  title: string
  description?: string | null
}

export interface CreateTaskResponse {
  task: Task
}
```

---

### Tailwind CSS Standards

**Professional Minimalist Design (2025)**:
- **Color Palette**: Slate (neutral grays), Blue-600 (accent)
- **NO Emojis**: User explicitly requested no childish elements
- **Typography**: Inter or system-ui font stack
- **Spacing**: Consistent scale (4px base unit)

**Component Styling**:
```typescript
// ✅ GOOD: Professional minimalist
<button className="rounded-md bg-slate-900 px-6 py-3 text-white hover:bg-slate-800">
  Add Task
</button>

// ❌ BAD: Playful, childish
<button className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 text-white">
  ✨ Add Task ✨
</button>
```

**Responsive Design**:
- Mobile-first: 320px+ (sm, md, lg, xl breakpoints)
- Touch targets: Minimum 44x44px (iOS guidelines)
- Test on: Mobile (320px), Tablet (768px), Desktop (1920px)

**Accessibility**:
- Contrast ratio: 4.5:1 minimum (WCAG AA)
- Focus indicators: Visible on all interactive elements
- Screen reader: Proper ARIA labels, semantic HTML

---

### Better Auth Integration

**Configuration** (`lib/auth/config.ts`):
```typescript
import { betterAuth } from 'better-auth'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days
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

**Security Rules**:
- JWT stored in HTTP-only cookies (prevents XSS)
- NO localStorage for tokens
- NO exposing tokens to JavaScript
- 401 errors → redirect to /signin (handled in API client)

**API Routes** (Better Auth provides):
- `/api/auth/signin` - Sign in
- `/api/auth/signup` - Sign up
- `/api/auth/signout` - Sign out

---

## API Client Standards

**Base Client** (`lib/api/client.ts`):
```typescript
class APIClient {
  private baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      credentials: 'include',  // CRITICAL: Include cookies (JWT)
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    // Handle 401 Unauthorized (expired JWT)
    if (response.status === 401) {
      window.location.href = '/signin?error=session_expired'
      throw new Error('Session expired')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || 'Request failed')
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  // ... put, patch, delete methods
}

export const apiClient = new APIClient()
```

**Task API Functions** (`lib/api/tasks.ts`):
```typescript
import { apiClient } from './client'
import type { Task, TaskFormData } from '@/types/task'

export async function getTasks(userId: string, filter?: FilterType): Promise<Task[]> {
  const params = filter && filter !== 'all' ? `?filter=${filter}` : ''
  const response = await apiClient.get<{ tasks: Task[] }>(`/api/${userId}/tasks${params}`)
  return response.tasks
}

export async function createTask(userId: string, data: TaskFormData): Promise<Task> {
  const response = await apiClient.post<{ task: Task }>(`/api/${userId}/tasks`, {
    title: data.title,
    description: data.description || null
  })
  return response.task
}
```

**Rules**:
- All API calls through `apiClient` (centralized error handling)
- TypeScript types for ALL requests/responses
- Automatic 401 redirect (session expired)
- credentials: 'include' (send JWT cookies)

---

## Component Standards

### Component Structure

```typescript
// components/tasks/TaskItem.tsx
'use client'  // Only if needs interactivity

import { Task } from '@/types/task'

export interface TaskItemProps {
  task: Task
  onToggle: (taskId: number) => Promise<void>
  onEdit: (taskId: number) => void
  onDelete: (taskId: number) => void
  disabled: boolean
}

export function TaskItem({ task, onToggle, onEdit, onDelete, disabled }: TaskItemProps) {
  return (
    <div className="flex items-center gap-4 border-b p-4">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        disabled={disabled}
        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <div className="flex-1">
        <h3 className={task.completed ? 'line-through opacity-60' : ''}>
          {task.title}
        </h3>
        {task.description && (
          <p className="text-sm text-slate-600">{task.description}</p>
        )}
      </div>
      <button onClick={() => onEdit(task.id)} aria-label={`Edit ${task.title}`}>
        Edit
      </button>
      <button onClick={() => onDelete(task.id)} aria-label={`Delete ${task.title}`}>
        Delete
      </button>
    </div>
  )
}
```

**Component Rules**:
- Props interface ALWAYS defined
- All props typed explicitly
- Accessibility: ARIA labels on interactive elements
- Event handlers: specific names (onToggle, not onClick)
- Conditional rendering: use ternary or short-circuit evaluation

---

### Context API (State Management)

**TaskContext** (`lib/contexts/TaskContext.tsx`):
```typescript
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Task, TaskFormData } from '@/types/task'
import { FilterType } from '@/types/ui'
import * as tasksAPI from '@/lib/api/tasks'

interface TaskContextValue {
  tasks: Task[]
  filter: FilterType
  loading: {
    fetching: boolean
    creating: boolean
    updating: boolean
    deleting: boolean
  }

  fetchTasks: () => Promise<void>
  createTask: (data: TaskFormData) => Promise<void>
  updateTask: (taskId: number, data: TaskFormData) => Promise<void>
  deleteTask: (taskId: number) => Promise<void>
  toggleComplete: (taskId: number) => Promise<void>
  setFilter: (filter: FilterType) => void
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  // ... implementation

  const value: TaskContextValue = {
    tasks,
    filter,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    setFilter,
  }

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTasks must be used within TaskProvider')
  }
  return context
}
```

**Context Rules**:
- ONE context per feature (TaskContext, AuthContext)
- Provide type-safe hook (useTasks, useAuth)
- Throw error if used outside provider
- Keep business logic in context (components stay presentational)

---

## Testing Standards

### Unit Tests (Vitest + React Testing Library)

**Component Tests** (`tests/unit/components/TaskItem.test.tsx`):
```typescript
import { describe, test, expect, vi } from 'vitest'
import { render, screen, userEvent } from '@testing-library/react'
import { TaskItem } from '@/components/tasks/TaskItem'

describe('TaskItem', () => {
  const mockTask = {
    id: 1,
    user_id: 'user123',
    title: 'Test task',
    description: 'Description',
    completed: false,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
  }

  test('renders task title and description', () => {
    render(
      <TaskItem
        task={mockTask}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        disabled={false}
      />
    )

    expect(screen.getByText('Test task')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  test('calls onToggle when checkbox clicked', async () => {
    const onToggle = vi.fn()
    render(<TaskItem task={mockTask} onToggle={onToggle} onEdit={vi.fn()} onDelete={vi.fn()} disabled={false} />)

    const checkbox = screen.getByRole('checkbox')
    await userEvent.click(checkbox)

    expect(onToggle).toHaveBeenCalledWith(1)
  })

  test('shows strikethrough when completed', () => {
    const completedTask = { ...mockTask, completed: true }
    render(<TaskItem task={completedTask} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} disabled={false} />)

    const title = screen.getByText('Test task')
    expect(title).toHaveClass('line-through')
  })
})
```

**Test Rules**:
- Test user behavior, NOT implementation
- Use `getByRole`, `getByLabelText` (accessibility-first)
- Mock API calls with MSW
- 60% unit test coverage target

---

### Integration Tests (MSW for API Mocking)

**MSW Handlers** (`tests/mocks/handlers.ts`):
```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/:userId/tasks', () => {
    return HttpResponse.json({
      tasks: [
        { id: 1, title: 'Task 1', description: null, completed: false, /* ... */ },
        { id: 2, title: 'Task 2', description: 'Desc', completed: true, /* ... */ },
      ]
    })
  }),

  http.post('/api/:userId/tasks', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      { task: { id: 3, ...body, completed: false, /* ... */ } },
      { status: 201 }
    )
  }),
]
```

**Integration Test**:
```typescript
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/handlers'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('fetches and displays tasks', async () => {
  render(<TaskList />)

  await waitFor(() => {
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })
})
```

---

### E2E Tests (Playwright)

**E2E Test** (`tests/e2e/tasks.spec.ts`):
```typescript
import { test, expect } from '@playwright/test'

test('user can create and complete a task', async ({ page }) => {
  await page.goto('/signin')

  // Sign in
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  // Wait for redirect to /tasks
  await page.waitForURL('/tasks')

  // Create task
  await page.click('text=Add Task')
  await page.fill('[name="title"]', 'Buy groceries')
  await page.fill('[name="description"]', 'Milk, eggs, bread')
  await page.click('text=Create Task')

  // Verify task appears
  await expect(page.locator('text=Buy groceries')).toBeVisible()

  // Toggle completion
  await page.click('[role="checkbox"]:has-text("Buy groceries")')

  // Verify strikethrough
  await expect(page.locator('text=Buy groceries')).toHaveClass(/line-through/)
})
```

**E2E Rules**:
- Test complete user flows (auth → task CRUD)
- Use `data-testid` for stable selectors (if role-based fails)
- Run on chromium, firefox, webkit (cross-browser)
- 10% E2E coverage target

---

## Validation Standards (Zod)

**Form Validation** (`lib/validation/task.ts`):
```typescript
import { z } from 'zod'

export const taskFormSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z.string().optional()
})

export type TaskFormData = z.infer<typeof taskFormSchema>
```

**React Hook Form Integration**:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskFormSchema, TaskFormData } from '@/lib/validation/task'

function TaskForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema)
  })

  const onSubmit = (data: TaskFormData) => {
    // data is typed and validated
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
    </form>
  )
}
```

---

## Performance Standards

**Core Web Vitals Targets**:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FCP** (First Contentful Paint): < 1.5s
- **TTI** (Time to Interactive): < 3s
- **CLS** (Cumulative Layout Shift): < 0.1

**Optimization Techniques**:
- Server Components (reduce client bundle)
- React.memo for TaskItem (prevent re-renders)
- Virtualization for >100 tasks (react-window)
- Lazy load modals (dynamic import)
- Optimize images (next/image)
- Font optimization (next/font)

**Bundle Size**:
- Target: < 200KB gzipped (excluding vendor)
- Tailwind tree-shaking (most projects < 10KB CSS)
- shadcn/ui components tree-shakeable

**Measurement**:
- Run `npm run build` → check bundle size
- Lighthouse audit in Chrome DevTools
- Fix any issues before marking task complete

---

## Development Workflow

### Command Reference

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server

# Code Quality
npm run type-check       # TypeScript validation (must pass)
npm run lint             # ESLint (must pass)
npm run format           # Prettier formatting

# Testing
npm run test             # Run Vitest unit/integration tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (80% minimum)
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode
```

### Pre-Commit Checklist

Before committing ANY code:

- [ ] `npm run type-check` passes (no TypeScript errors)
- [ ] `npm run lint` passes (no ESLint errors)
- [ ] `npm run format` applied
- [ ] `npm run test` passes (all tests green)
- [ ] Coverage >= 80% for modified files
- [ ] File includes Task ID comment at top (e.g., `// Task: TASK-025`)
- [ ] Commit message includes Task ID (e.g., `[TASK-025] Create API client`)

---

## Environment Variables

**Required Variables** (`.env.local`):
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Secret (shared with backend)
BETTER_AUTH_SECRET=<32-character-minimum-secret>

# Next.js URL
NEXTAUTH_URL=http://localhost:3000
```

**Generate Secret**:
```bash
openssl rand -base64 32
```

**Rules**:
- NEVER commit `.env.local` (in .gitignore)
- Same `BETTER_AUTH_SECRET` in frontend and backend
- Use `NEXT_PUBLIC_` prefix for client-side variables ONLY

---

## Error Handling Standards

**API Errors**:
```typescript
try {
  const tasks = await getTasks(userId)
  setTasks(tasks)
} catch (error) {
  if (error instanceof Error) {
    toast.error(error.message)
  } else {
    toast.error('Something went wrong. Please try again.')
  }
}
```

**Global Error Boundary** (`app/error.tsx`):
```typescript
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="mt-4 text-slate-600">{error.message}</p>
        <button onClick={reset} className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white">
          Try again
        </button>
      </div>
    </div>
  )
}
```

---

## Design System (shadcn/ui)

**Installed Components**:
- `button` - Primary/secondary action buttons
- `input` - Text input fields
- `label` - Form field labels
- `textarea` - Multi-line text input
- `dialog` - Modal dialogs
- `toast` - Notification toasts
- `checkbox` - Checkboxes

**Usage**:
```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function Example() {
  return (
    <>
      <Button variant="default">Primary Action</Button>
      <Button variant="outline">Secondary Action</Button>
      <Input type="text" placeholder="Enter title..." />
    </>
  )
}
```

**Customization**:
- Modify `components/ui/*` files directly (shadcn/ui copies into codebase)
- Tailwind classes for styling
- CSS variables in `globals.css` for theme colors

---

## Common Pitfalls & Solutions

### ❌ WRONG: Using middleware.ts (Next.js 15)
```typescript
// middleware.ts (OUTDATED)
export function middleware(request: NextRequest) { ... }
```

### ✅ CORRECT: Using proxy.ts (Next.js 16)
```typescript
// proxy.ts (CURRENT)
export function proxy(request: NextRequest) { ... }
```

---

### ❌ WRONG: Heavy logic in proxy.ts
```typescript
export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  // ❌ Don't validate JWT signature here
  const decoded = verifyJWT(token)
  // ❌ Don't call database here
  const user = await db.users.findById(decoded.sub)
}
```

### ✅ CORRECT: Lightweight redirect only
```typescript
export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }
}
```

---

### ❌ WRONG: Missing credentials in fetch
```typescript
fetch('/api/tasks')  // ❌ JWT cookie NOT sent
```

### ✅ CORRECT: Include credentials
```typescript
fetch('/api/tasks', { credentials: 'include' })  // ✅ JWT cookie sent
```

---

### ❌ WRONG: Type escape hatch
```typescript
const tasks = data as any  // ❌ Never use 'any'
```

### ✅ CORRECT: Proper typing
```typescript
const tasks: Task[] = data.tasks  // ✅ Explicit type
```

---

## Active Technologies (Frontend)

- **Framework**: Next.js 16+ (App Router, Turbopack)
- **Language**: TypeScript 5.7+ (strict mode)
- **Styling**: Tailwind CSS 4+
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **State**: Context API
- **Auth**: Better Auth (JWT, HTTP-only cookies)
- **Testing**: Vitest (unit/integration), Playwright (E2E), React Testing Library
- **API Client**: Fetch API with custom wrapper

---

## Recent Changes

- **2026-01-15**: Created frontend project structure and CLAUDE.md
- **Next.js 16**: Using proxy.ts (replaces middleware.ts), cacheComponents: true
- **Design**: Professional minimalist (shadcn/ui, Slate palette, no emojis)
- **Auth**: Better Auth with JWT in HTTP-only cookies (7-day expiration)
- **Performance**: LCP < 2.5s, bundle < 200KB, Server Components by default

---

## Reference Documents

- **Spec**: `/specs/002-task-crud/spec.md`
- **Plan**: `/specs/002-task-crud/plan.md`
- **Research**: `/specs/002-task-crud/research.md`
- **Data Model**: `/specs/002-task-crud/data-model.md`
- **API Contracts**: `/specs/002-task-crud/contracts/task-api.md`
- **Tasks**: `/specs/002-task-crud/tasks.md`
- **Quickstart**: `/specs/002-task-crud/quickstart.md`
- **Constitution**: `/.specify/memory/constitution.md`

---

## Task Execution Flow

When implementing tasks from `tasks.md`:

1. **Read Task**: Understand requirements, file paths, acceptance criteria
2. **Write Test FIRST**: Create failing test (TDD approach)
3. **Implement**: Write code to make test pass
4. **Validate**: Run type-check, lint, test, coverage
5. **Commit**: Format `[TASK-XXX] Description` with Task ID in file header
6. **Checkpoint**: Validate at phase completion (e.g., after US1, test independently)

**Example Task Execution**:
```bash
# Task: T025 - Create API client base class

# 1. Write test first
# tests/integration/api/client.test.ts

# 2. Implement
# src/lib/api/client.ts

# 3. Validate
npm run type-check  # Must pass
npm run lint        # Must pass
npm run test        # Must pass

# 4. Commit
git add src/lib/api/client.ts tests/integration/api/client.test.ts
git commit -m "[TASK-025] Create API client base class with 401 handling"
```

---

## Support & Resources

- **Next.js 16 Docs**: https://nextjs.org/docs
- **Better Auth Docs**: https://www.better-auth.com/docs
- **shadcn/ui Docs**: https://ui.shadcn.com/
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Vitest Docs**: https://vitest.dev/
- **Playwright Docs**: https://playwright.dev/

---

**Version**: 1.0.0 | **Last Updated**: 2026-01-15 | **Branch**: 002-web-todo
