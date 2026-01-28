# Implementation Plan: Task CRUD (Web Frontend)

**Branch**: `002-web-todo` | **Date**: 2026-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-task-crud/spec.md` + Authentication spec (003) + User requirements

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a modern Next.js 16 frontend for the todo application with task CRUD operations (view, create, edit, delete, toggle completion), JWT authentication via Better Auth, and a professional minimalist design following 2025 industry standards. The frontend will communicate with the FastAPI backend using REST APIs, maintain strict type safety with TypeScript, and implement responsive UI with Tailwind CSS. Design emphasizes clean aesthetics, accessibility (WCAG AA), and performance optimization (React Server Components, smart caching).

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode enabled)
**Framework**: Next.js 16+ with App Router, React 19+
**Styling**: Tailwind CSS 4+ (utility-first, minimalist design system)
**Authentication**: Better Auth v2+ with JWT strategy (HTTP-only cookies)
**Primary Dependencies**:
  - React 19+ (Server Components, Suspense, transitions)
  - Better Auth (authentication, session management)
  - Zod (schema validation for forms and API contracts)
  - React Hook Form (form state management)
  - shadcn/ui or Radix UI (accessible component primitives)
  - Lucide React (icon library, professional minimalist icons)

**Storage**: Browser-side state (Context API for global state, localStorage for preferences)
**Backend Integration**: REST API client calling FastAPI endpoints at `NEXT_PUBLIC_API_URL`
**Testing**: Vitest (unit/component tests), Playwright (E2E user flows), React Testing Library
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - last 2 versions), responsive 320px-2560px
**Project Type**: Web (frontend tier of multi-tier architecture)
**Performance Goals**:
  - First Contentful Paint (FCP) < 1.5s
  - Largest Contentful Paint (LCP) < 2.5s
  - Time to Interactive (TTI) < 3s
  - Cumulative Layout Shift (CLS) < 0.1

**Constraints**:
  - Client bundle size < 200KB gzipped (excluding vendor chunks)
  - API response rendering < 500ms
  - Accessibility WCAG 2.1 AA compliance (keyboard nav, screen readers, 4.5:1 contrast)
  - No childish design elements (emoji, playful colors) - professional business aesthetic only

**Scale/Scope**:
  - ~10 pages/routes (auth pages, tasks dashboard, settings)
  - ~20-30 React components (UI primitives + feature components)
  - Support 100+ concurrent users (stateless frontend, scales horizontally)
  - Task list rendering up to 1000 tasks without pagination (acceptable for MVP)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Frontend Stack Alignment (Constitution §I)

- [x] **Framework**: Next.js 16+ with App Router ✓ (matches constitution requirement)
- [x] **Language**: TypeScript 5.7+ with strict mode ✓ (matches constitution requirement)
- [x] **Styling**: Tailwind CSS 4+ ✓ (matches constitution requirement)
- [x] **Type Safety**: All components/functions have explicit TypeScript types ✓ (enforced by strict mode)
- [x] **Build Tool**: Turbopack (default with Next.js 16+) ✓ (matches constitution)

### Authentication Stack (Constitution §I)

- [x] **Provider**: Better Auth with JWT token strategy ✓ (matches constitution requirement)
- [x] **Token Storage**: HTTP-only cookies for XSS protection ✓ (matches constitution security principle)
- [x] **Session Management**: Stateless JWT with 7-day expiration ✓ (per authentication spec)

### Architecture Compliance (Constitution §II)

- [x] **Multi-Tier**: Frontend tier separate from backend (Next.js ↔ FastAPI) ✓
- [x] **Layered Separation**: UI components → API client → Backend (no business logic in UI) ✓
- [x] **No Over-Engineering**: Using Context API (not Redux/Zustand), no microservices ✓
- [x] **Async-First**: All API calls use async/await ✓

### Code Quality Standards (Constitution §III)

- [x] **TypeScript Strict Mode**: `strict: true` in tsconfig.json ✓
- [x] **100% Type Coverage**: Every function/component/variable has explicit types ✓
- [x] **Naming Conventions**: camelCase (variables/functions), PascalCase (components/types) ✓
- [x] **No Type Escape Hatches**: Avoid `any`, `@ts-ignore` ✓

### Testing Requirements (Constitution §IV)

- [x] **Coverage Minimum**: 80% code coverage (Vitest + Playwright) ✓
- [x] **Test Pyramid**: 60% unit (Vitest), 30% integration (API mocking), 10% E2E (Playwright) ✓
- [x] **TDD Encouraged**: Write component tests alongside implementation ✓

### Security Principles (Constitution §VI)

- [x] **JWT Validation**: Better Auth handles token validation on protected routes ✓
- [x] **HTTP-Only Cookies**: JWT stored in HTTP-only cookies (prevents XSS) ✓
- [x] **Input Validation**: Zod schemas for form validation before API submission ✓
- [x] **XSS Prevention**: React escapes by default, no `dangerouslySetInnerHTML` without sanitization ✓
- [x] **Environment Secrets**: `NEXT_PUBLIC_API_URL`, `BETTER_AUTH_SECRET` in `.env` ✓

### Clean Architecture (Constitution §VII)

- [x] **Separation of Concerns**: UI (components/) → API Client (lib/api/) → Types (types/) ✓
- [x] **No Business Logic in UI**: Components display data, call APIs (validation in backend) ✓
- [x] **Shared Type Definitions**: TypeScript interfaces match API contracts ✓

### Spec-Driven Workflow (Constitution §V)

- [x] **Task-Based Development**: All code changes reference task IDs ✓
- [x] **No Manual Coding**: Use `/sp.implement` only (enforced by workflow) ✓
- [x] **Traceability**: Requirement → Plan → Task → Code linkage maintained ✓

### **GATE STATUS: ✅ PASSED**

All constitutional requirements met. No violations detected. Proceeding to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
frontend/                        # Next.js 16 application (this feature)
├── src/
│   ├── app/                    # App Router (Next.js 16)
│   │   ├── (auth)/             # Route group for authentication
│   │   │   ├── signin/         # Sign-in page
│   │   │   │   └── page.tsx
│   │   │   └── signup/         # Sign-up page
│   │   │       └── page.tsx
│   │   ├── tasks/              # Protected tasks page
│   │   │   └── page.tsx
│   │   ├── layout.tsx          # Root layout (shared nav, providers)
│   │   ├── page.tsx            # Home/landing page
│   │   └── proxy.ts            # Next.js 16 proxy (replaces middleware.ts)
│   ├── components/             # React components (UI layer)
│   │   ├── ui/                 # Reusable UI primitives (shadcn/ui or Radix)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── auth/               # Authentication-specific components
│   │   │   ├── SignInForm.tsx
│   │   │   └── SignUpForm.tsx
│   │   └── tasks/              # Task feature components
│   │       ├── TaskList.tsx
│   │       ├── TaskItem.tsx
│   │       ├── TaskForm.tsx
│   │       ├── FilterButtons.tsx
│   │       └── DeleteConfirmDialog.tsx
│   ├── lib/                    # Utilities and API clients
│   │   ├── api/                # Backend API client layer
│   │   │   ├── client.ts       # Base fetch wrapper with auth handling
│   │   │   ├── tasks.ts        # Task CRUD API functions
│   │   │   └── auth.ts         # Auth API functions (if needed)
│   │   ├── auth/               # Better Auth configuration
│   │   │   └── config.ts       # Better Auth client setup
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useTasks.ts     # Task data fetching/mutations
│   │   │   └── useAuth.ts      # Auth state management
│   │   └── utils.ts            # Utility functions (cn, date formatting)
│   ├── types/                  # TypeScript type definitions
│   │   ├── task.ts             # Task entity types
│   │   ├── auth.ts             # Auth-related types
│   │   └── api.ts              # API request/response types
│   └── styles/                 # Global styles
│       └── globals.css         # Tailwind directives + custom styles
├── tests/
│   ├── unit/                   # Vitest unit tests (components, utils)
│   │   ├── components/
│   │   └── lib/
│   ├── integration/            # API integration tests (MSW mocks)
│   │   └── api/
│   └── e2e/                    # Playwright end-to-end tests
│       ├── auth.spec.ts        # Sign-up/sign-in/sign-out flows
│       └── tasks.spec.ts       # Task CRUD user flows
├── public/                     # Static assets
├── .env.local                  # Environment variables (not committed)
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration (strict mode)
├── vitest.config.ts            # Vitest test configuration
└── playwright.config.ts        # Playwright E2E configuration

backend/                        # FastAPI application (separate feature)
└── [See 007-fastapi-backend spec]
```

**Structure Decision**: Web application structure (Option 2 from template). Frontend uses Next.js 16 App Router conventions with route groups for authentication, proxy.ts for lightweight routing (replaces middleware.ts per Next.js 16 changes), and layered separation (UI → API client → Backend). All authentication logic delegated to Better Auth. API client layer abstracts fetch calls and provides typed interfaces matching backend contracts.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
