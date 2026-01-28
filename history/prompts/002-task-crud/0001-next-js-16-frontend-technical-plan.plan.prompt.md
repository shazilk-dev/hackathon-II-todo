---
id: 0001
title: Next.js 16 frontend technical plan
stage: plan
date: 2026-01-15
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-task-crud
branch: 002-web-todo
user: system
command: /sp.plan
labels: ["frontend", "nextjs16", "design-research", "better-auth"]
links:
  spec: /mnt/f/PROJECTS/hackathone-II/hackathon-todo/specs/002-task-crud/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - /mnt/f/PROJECTS/hackathone-II/hackathon-todo/specs/002-task-crud/plan.md
  - /mnt/f/PROJECTS/hackathone-II/hackathon-todo/specs/002-task-crud/research.md
  - /mnt/f/PROJECTS/hackathone-II/hackathon-todo/specs/002-task-crud/data-model.md
  - /mnt/f/PROJECTS/hackathone-II/hackathon-todo/specs/002-task-crud/contracts/task-api.md
  - /mnt/f/PROJECTS/hackathone-II/hackathon-todo/specs/002-task-crud/quickstart.md
  - /mnt/f/PROJECTS/hackathone-II/hackathon-todo/CLAUDE.md
tests:
  - None (planning phase, no tests generated)
---

## Prompt

```text
Create technical plan for Next.js 16 frontend.

Reference specs:
- task-crud
- authentication
- ui

Requirements:
- Next.js 16 with App Router
- TypeScript strict mode
- Modern, aesthetic and minimalist design following industry standards 2025 trends
- Professional design, no childish emojis or any other unprofessional things
- Research about the design from web get up to date info, best designs, trends and then plan
- Tailwind CSS
- Better Auth for authentication
- API client for backend calls
```

## Response snapshot

**Planning Artifacts Generated**:

1. **plan.md**: Complete technical plan with:
   - Technical Context (Next.js 16, TypeScript 5.7+, Tailwind CSS 4+, Better Auth, shadcn/ui)
   - Constitution Check (all requirements met, gate PASSED)
   - Project Structure (App Router with proxy.ts, layered architecture)
   - Performance goals (LCP < 2.5s, bundle < 200KB, WCAG AA compliance)

2. **research.md**: Web research findings on:
   - 2025 design trends (shadcn/ui for professional minimalist aesthetics)
   - Next.js 16 breaking changes (proxy.ts replaces middleware.ts)
   - Better Auth integration (JWT, HTTP-only cookies, security best practices)
   - Performance optimization (Server Components, caching strategy)
   - Testing strategy (Vitest 60%, Playwright 10%)

3. **data-model.md**: TypeScript type definitions for:
   - Core entities (Task, User)
   - Form data types (TaskFormData, AuthFormData with Zod validation)
   - API request/response types (6 endpoints)
   - UI state types (FilterState, ModalState, LoadingState, ToastState)
   - Context API interfaces (TaskContext, AuthContext)

4. **contracts/task-api.md**: API contracts for 6 RESTful endpoints:
   - GET /api/{user_id}/tasks (list with filtering)
   - POST /api/{user_id}/tasks (create)
   - GET /api/{user_id}/tasks/{id} (get single)
   - PUT /api/{user_id}/tasks/{id} (update)
   - DELETE /api/{user_id}/tasks/{id} (delete)
   - PATCH /api/{user_id}/tasks/{id}/complete (toggle completion)
   - Includes TypeScript implementations for base API client with 401 handling

5. **quickstart.md**: Step-by-step setup guide:
   - Project initialization (Next.js 16, TypeScript strict mode)
   - Dependency installation (Better Auth, shadcn/ui, Zod, testing libraries)
   - Configuration files (tsconfig.json, next.config.ts, tailwind.config.ts)
   - Better Auth setup (JWT, HTTP-only cookies)
   - Development scripts and verification checklist

**Key Decisions Made**:
- **Component Library**: shadcn/ui (flexibility, accessibility, Tailwind integration)
- **Authentication**: Better Auth with JWT in HTTP-only cookies
- **Proxy Pattern**: Use proxy.ts for lightweight auth redirect (Next.js 16 standard)
- **Caching**: Enable cacheComponents: true, no default caching for security
- **Color Palette**: Slate (neutral) + Blue accent (professional business aesthetic)
- **Testing**: Vitest (60% unit), Playwright (10% E2E)
- **Performance**: LCP < 2.5s, FCP < 1.5s, bundle < 200KB gzipped

**Web Research Sources**:
- UI component libraries for Next.js 2025
- Tailwind CSS design trends
- Better Auth Next.js 16 integration
- Next.js authentication best practices
- Core Web Vitals optimization

**Agent Context Updated**: TypeScript 5.7+ and Browser-side state added to CLAUDE.md

## Outcome

- ✅ Impact: Complete technical plan for Next.js 16 frontend with modern 2025 design standards
- 🧪 Tests: None (planning phase)
- 📁 Files: 6 files created/modified (plan.md, research.md, data-model.md, task-api.md, quickstart.md, CLAUDE.md)
- 🔁 Next prompts: `/sp.tasks` to generate task breakdown for implementation
- 🧠 Reflection: Web research successfully identified key 2025 trends (shadcn/ui, Next.js 16 proxy.ts pattern, Better Auth security practices). Constitution check passed all requirements. Ready for task generation.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Constitution Check PASS (all gates satisfied)
- Prompt variant (if applicable): Standard /sp.plan workflow with web research integration
- Next experiment (smallest change to try): Generate tasks with `/sp.tasks` and validate plan completeness during implementation
