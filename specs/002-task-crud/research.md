# Research: Next.js 16 Frontend Implementation

**Date**: 2026-01-15
**Feature**: Task CRUD Web Interface
**Research Focus**: Design trends 2025, Better Auth integration, Next.js 16 best practices

---

## 1. Design Trends & UI Best Practices (2025)

### Professional Minimalist Aesthetic

**Key Findings**:
- 2025 web design emphasizes **clean visuals, smooth transitions, and optimized performance**
- Modern Tailwind templates present **sharp text and easy-to-understand layouts**
- Design philosophy focuses on **adaptability, simplicity, and seamless integration across platforms**
- Minimalist designs **reduce cognitive load** while maintaining professional business aesthetics

**Decision**: Adopt **shadcn/ui** component library
- **Rationale**: shadcn/ui gained significant traction in 2025 for "incredible flexibility" and professional out-of-the-box aesthetics
- Built on Radix UI primitives (WCAG AA compliance by default)
- Seamless Tailwind CSS integration with design tokens
- Component-based architecture aligns with modern workflows
- Zero runtime dependencies (copy components into codebase)

**Alternatives Considered**:
- Material UI: More opinionated, heavier bundle size, less Tailwind integration
- Hero UI: Good option but less community adoption than shadcn/ui
- DaisyUI: Plugin-based, less flexibility for custom design

**Sources**:
- [UI Component Libraries: 5 Must-Try Picks for Next.js in 2025](https://varbintech.com/blog/ui-component-libraries-5-must-try-picks-for-next-js-in-2025)
- [Top 10 Next.js UI Libraries in 2025 | RetroUI Blogs](https://www.retroui.dev/blogs/top-10-nextjs-ui-library)
- [Modern Tailwind CSS in 2025: A Utility-First Revolution Refined](https://medium.com/@habiburrahman_62774/modern-tailwind-css-in-2025-a-utility-first-revolution-refined-2cd3dfe58104)

---

### Color Palette & Typography

**2025 Standards**:
- **Neutral Grays**: Professional business aesthetic (slate-50 to slate-900)
- **Accent Colors**: Subtle blues or purples for CTAs (not vibrant playful colors)
- **Contrast Ratio**: WCAG AA minimum 4.5:1 for normal text, 3:1 for large text
- **Typography**: System font stacks for performance, clear hierarchy (headings, body, captions)

**Decision**: Tailwind Default Palette with Customization
- **Primary**: Slate (neutral gray scale) for backgrounds and text
- **Accent**: Blue-600 for primary actions (professional, trustworthy)
- **Success/Error**: Green-600/Red-600 (standard semantic colors)
- **Font**: Inter or system-ui font stack (modern, readable, performant)

**No Emoji or Playful Elements**: Per user requirements, strictly professional design

---

### Dark Mode & Theming

**2025 Trend**: Dark mode is now standard expectation
- Tailwind provides built-in `dark:` variant support
- Design tokens with CSS variables enable seamless theme switching

**Decision**: **Light mode only for MVP** (Constitution: not in scope)
- Future enhancement: Add dark mode using Tailwind `dark:` classes + localStorage preference
- Architecture prepared: CSS variables for colors (easy migration to dark mode later)

**Sources**:
- [Elevate Your Designs: Advanced Tailwind CSS Techniques for 2025](https://dev.to/hexadecimalsoftware/elevate-your-designs-advanced-tailwind-css-techniques-for-2025-16i9)
- [Modern Tailwind CSS in 2025](https://medium.com/@habiburrahman_62774/modern-tailwind-css-in-2025-a-utility-first-revolution-refined-2cd3dfe58104)

---

## 2. Next.js 16 Architecture Best Practices

### Server Components vs Client Components

**2025 Best Practice**: **Default to Server Components**, use Client Components only when necessary

**When to Use Client Components** (add `"use client"` directive):
- Interactive UI (forms, buttons with onClick handlers)
- Browser APIs (localStorage, geolocation)
- React hooks (useState, useEffect, useContext)
- Event listeners

**When to Use Server Components** (default):
- Static content rendering
- Data fetching from backend
- SEO-critical content
- Layout components

**Decision**:
- **Server Components**: Layout, static task list structure, auth pages layout
- **Client Components**: TaskForm, TaskItem (checkbox toggle), FilterButtons, SignInForm, SignUpForm

**Rationale**: Reduces client bundle size, improves initial load performance (LCP < 2.5s)

**Sources**:
- [Next.js Best Practices in 2025: Performance & Architecture](https://www.raftlabs.com/blog/building-with-next-js-best-practices-and-benefits-for-performance-first-teams/)
- [Frontend Development Trends in 2025](https://dev.to/faeze_hsnzade_70cf09e87f0/frontend-development-trends-in-2025-what-every-developer-should-know-28ni)

---

### Proxy.ts vs Middleware.ts (Breaking Change in Next.js 16)

**Critical Finding**: Next.js 16 **renames `middleware.ts` to `proxy.ts`**

**Key Changes**:
- `middleware.ts` → `proxy.ts`
- Export function renamed: `export function proxy() { ... }`
- Purpose: Lightweight routing layer (redirects, A/B testing, geofencing)

**What NOT to Do in Proxy**:
- ❌ Validate JWTs or call databases (use Server Components/Actions instead)
- ❌ Run heavy business logic
- ❌ Granular authorization checks

**What TO Do in Proxy**:
- ✅ Quick allow/deny routing
- ✅ Redirect unauthenticated users to /signin
- ✅ Early redirects based on cookies (check JWT presence, not validation)

**Decision**: Use `proxy.ts` for Basic Auth Redirect
```typescript
// proxy.ts (lightweight)
export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  if (!token && request.nextUrl.pathname.startsWith('/tasks')) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }
}
```

**JWT Validation**: Move to Server Components/Actions (Node.js runtime, stable, can call database)

**Sources**:
- [Next.js 16: What's New for Authentication and Authorization](https://medium.com/@reactjsbd/next-js-16-whats-new-for-authentication-and-authorization-1fed6647cfcc)
- [Next.js 16: What's New for Authentication and Authorization | Auth0](https://auth0.com/blog/whats-new-nextjs-16/)
- [Next.js Authentication Best Practices in 2025](https://www.franciscomoretti.com/blog/modern-nextjs-authentication-best-practices)

---

### Caching Strategy (Next.js 16 Changes)

**Breaking Change**: `cacheComponents: true` disables default caching
- **Before**: Next.js cached data fetching by default
- **Now**: Data fetching runs at request time unless explicitly using `use cache` directive

**Security Benefit**: Reduces risk of accidental data leaks (authorization checks run in real-time)

**Decision**:
- **Enable `cacheComponents: true`** in next.config.ts
- **No automatic caching** for task data (ensures fresh data per user)
- Use `use cache` directive only for static content (e.g., public landing page)

**Rationale**: Task data is user-specific and changes frequently (create/edit/delete). Real-time fetching ensures correct data isolation.

**Sources**:
- [Next.js 16: What's New for Authentication and Authorization](https://medium.com/@reactjsbd/next-js-16-whats-new-for-authentication-and-authorization-1fed6647cfcc)
- [Next.js Authentication Best Practices in 2025](https://www.franciscomoretti.com/blog/modern-nextjs-authentication-best-practices)

---

## 3. Better Auth Integration with Next.js 16

### Setup & Configuration

**Better Auth Compatibility**: Fully compatible with Next.js 16

**Key Integration Points**:
1. **Client Setup**: `lib/auth/config.ts` (Better Auth client configuration)
2. **API Routes**: Better Auth provides built-in API routes for sign-up/sign-in/sign-out
3. **Session Management**: HTTP-only cookies (JWT storage), automatic cookie handling
4. **Proxy Integration**: Check cookie presence in `proxy.ts` (lightweight redirect)

**Decision**: Use Better Auth Default API Routes
- Better Auth provides `/api/auth/signin`, `/api/auth/signup`, `/api/auth/signout`
- Frontend forms POST to these routes
- Better Auth handles JWT creation, cookie storage, and validation

**Shared Secret**: `BETTER_AUTH_SECRET` environment variable
- Used by both Next.js (Better Auth) and FastAPI (JWT validation)
- Minimum 32 characters, cryptographically random
- Stored in `.env.local` (Next.js) and `.env` (FastAPI)

**Sources**:
- [Better-Auth with Next.js — A Complete Guide for Modern Authentication](https://medium.com/@amitupadhyay878/better-auth-with-next-js-a-complete-guide-for-modern-authentication-06eec09d6a64)
- [Next.js integration | Better Auth](https://www.better-auth.com/docs/integrations/next)

---

### JWT Security Best Practices (2025)

**Key Security Measures**:
1. **HTTP-Only Cookies**: Prevents XSS attacks (JavaScript cannot access token)
2. **Signed JWTs**: HMAC-SHA256 signature with `BETTER_AUTH_SECRET`
3. **CSRF Protection**: CSRF tokens on sign-in requests (Better Auth built-in)
4. **Short Expiration**: 7-day expiration (balance between UX and security)
5. **Secure Flag**: HTTPS-only cookies in production

**Decision**: Trust Better Auth Defaults
- Better Auth handles all security measures above
- No custom JWT implementation needed
- Focus on integration and UI

**Backend Validation**: FastAPI middleware validates JWT signature and expiration
- Use `python-jose` or `PyJWT` library
- Verify signature with same `BETTER_AUTH_SECRET`
- Extract `user_id` from `sub` claim for data isolation

**Sources**:
- [Implementing JWT Middleware in Next.js: A Complete Guide to Auth](https://dev.to/leapcell/implementing-jwt-middleware-in-nextjs-a-complete-guide-to-auth-1b2d)
- [NextAuth.js 2025: Secure Authentication for Next.js Apps](https://strapi.io/blog/nextauth-js-secure-authentication-next-js-guide)

---

### Data Access Layer Pattern

**2025 Best Practice**: Centralize data fetching with authentication checks

**Pattern**:
```typescript
// lib/api/data-access.ts
export async function getTasksForUser(userId: string) {
  // Centralized authorization check
  const session = await getSession()
  if (session.user.id !== userId) {
    throw new Error('Unauthorized')
  }

  // Fetch data from backend
  return await fetch(`${API_URL}/api/${userId}/tasks`)
}
```

**Benefits**:
- Single source of truth for authorization logic
- Easier to audit and test
- Prevents accidental data leaks

**Decision**: Implement Data Access Layer in `lib/api/`
- All API calls go through typed wrapper functions
- Centralized error handling (401 → redirect to /signin)
- Automatic JWT inclusion from cookies

**Sources**:
- [Next.js Authentication Best Practices in 2025](https://www.franciscomoretti.com/blog/modern-nextjs-authentication-best-practices)

---

## 4. Performance Optimization (2025 Standards)

### Core Web Vitals Targets

**Industry Standards**:
- **LCP (Largest Contentful Paint)**: < 2.5s (good), < 4.0s (needs improvement)
- **FCP (First Contentful Paint)**: < 1.5s (good)
- **TTI (Time to Interactive)**: < 3.5s (good)
- **CLS (Cumulative Layout Shift)**: < 0.1 (good)

**Decision**: Optimize for LCP and CLS
- Use Next.js Image component for optimized images
- Preload critical fonts with `next/font`
- Skeleton screens during loading (prevents CLS)
- Server Components reduce client bundle size (faster TTI)

**Bundle Size Target**: < 200KB gzipped (excluding vendor chunks)
- Tailwind tree-shaking removes unused CSS (most projects ship < 10KB CSS)
- shadcn/ui components are tree-shakeable (only import what's used)

**Sources**:
- [Next.js Best Practices in 2025: Performance & Architecture](https://www.raftlabs.com/blog/building-with-next-js-best-practices-and-benefits-for-performance-first-teams/)
- [Modern Tailwind CSS in 2025](https://medium.com/@habiburrahman_62774/modern-tailwind-css-in-2025-a-utility-first-revolution-refined-2cd3dfe58104)

---

### Lazy Loading & Code Splitting

**Next.js 16 Features**:
- Automatic code splitting per route
- Dynamic imports with `next/dynamic`
- Streaming with React Suspense

**Decision**: Use Suspense for Lazy Loading
```typescript
import { Suspense } from 'react'

<Suspense fallback={<TaskListSkeleton />}>
  <TaskList />
</Suspense>
```

**Benefits**:
- Faster initial page load
- Progressive rendering (show skeleton → show content)
- Better perceived performance

---

## 5. Testing Strategy

### Unit Tests (Vitest + React Testing Library)

**2025 Best Practice**: Test component logic, not implementation details

**Decision**: 60% Unit Test Coverage
- Test component rendering with different props
- Test user interactions (click, type, submit)
- Mock API calls with MSW (Mock Service Worker)

**Example**:
```typescript
// TaskItem.test.tsx
test('TaskItem toggles completion on checkbox click', async () => {
  const mockToggle = vi.fn()
  render(<TaskItem task={mockTask} onToggle={mockToggle} />)

  const checkbox = screen.getByRole('checkbox')
  await userEvent.click(checkbox)

  expect(mockToggle).toHaveBeenCalledWith(mockTask.id)
})
```

---

### E2E Tests (Playwright)

**2025 Best Practice**: Test critical user flows end-to-end

**Decision**: 10% E2E Test Coverage
- Full authentication flow (sign-up → sign-in → sign-out)
- Complete task CRUD flow (create → edit → complete → delete)
- Cross-browser testing (Chrome, Firefox, Safari)

**Example**:
```typescript
// tasks.spec.ts
test('user can create and complete a task', async ({ page }) => {
  await page.goto('/signin')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  await page.click('text=Add Task')
  await page.fill('[name="title"]', 'Buy groceries')
  await page.click('text=Create Task')

  await page.click('[role="checkbox"]')
  await expect(page.locator('text=Buy groceries')).toHaveClass(/line-through/)
})
```

---

## Summary of Decisions

| **Aspect** | **Decision** | **Rationale** |
|------------|-------------|---------------|
| **Component Library** | shadcn/ui + Radix UI | Flexibility, accessibility, Tailwind integration |
| **Color Palette** | Slate (neutral) + Blue accent | Professional minimalist aesthetic |
| **Server/Client Split** | Default Server, Client only when needed | Bundle size reduction, performance |
| **Routing** | proxy.ts for auth redirect | Next.js 16 standard, lightweight |
| **Auth Integration** | Better Auth default routes | Security built-in, less custom code |
| **Caching** | cacheComponents: true, no default caching | Real-time data, security (no leaks) |
| **Data Access** | Centralized data-access.ts layer | Authorization consistency, auditability |
| **Performance** | LCP < 2.5s, bundle < 200KB | Industry standards, Core Web Vitals |
| **Testing** | Vitest (60%) + Playwright (10%) | Fast feedback, critical flow coverage |

---

## Sources Referenced

**Design Trends**:
- [UI Component Libraries: 5 Must-Try Picks for Next.js in 2025](https://varbintech.com/blog/ui-component-libraries-5-must-try-picks-for-next-js-in-2025)
- [Modern Tailwind CSS in 2025: A Utility-First Revolution Refined](https://medium.com/@habiburrahman_62774/modern-tailwind-css-in-2025-a-utility-first-revolution-refined-2cd3dfe58104)

**Next.js 16 Best Practices**:
- [Next.js 16: What's New for Authentication and Authorization](https://medium.com/@reactjsbd/next-js-16-whats-new-for-authentication-and-authorization-1fed6647cfcc)
- [Next.js Best Practices in 2025: Performance & Architecture](https://www.raftlabs.com/blog/building-with-next-js-best-practices-and-benefits-for-performance-first-teams/)

**Better Auth Integration**:
- [Better-Auth with Next.js — A Complete Guide for Modern Authentication](https://medium.com/@amitupadhyay878/better-auth-with-next-js-a-complete-guide-for-modern-authentication-06eec09d6a64)
- [Next.js integration | Better Auth](https://www.better-auth.com/docs/integrations/next)

**Security & Performance**:
- [Next.js Authentication Best Practices in 2025](https://www.franciscomoretti.com/blog/modern-nextjs-authentication-best-practices)
- [Implementing JWT Middleware in Next.js: A Complete Guide to Auth](https://dev.to/leapcell/implementing-jwt-middleware-in-nextjs-a-complete-guide-to-auth-1b2d)
