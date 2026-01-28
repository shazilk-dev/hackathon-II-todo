---
id: 0002
title: Frontend task breakdown generation
stage: tasks
date: 2026-01-15
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-task-crud
branch: 002-web-todo
user: system
command: /sp.tasks
labels: ["frontend", "task-breakdown", "nextjs16", "tdd"]
links:
  spec: /mnt/f/PROJECTS/hackathone-II/hackathon-todo/specs/002-task-crud/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - /mnt/f/PROJECTS/hackathone-II/hackathon-todo/specs/002-task-crud/tasks.md
tests:
  - Test tasks included in tasks.md (T031-T034, T044-T046, T051-T053, T057-T059, T063-T065, T077)
---

## Prompt

```text
Break down frontend plan into tasks.

Reference:

Tasks should cover:
1. Project setup (create-next-app)
2. Configure Better Auth
3. Create auth pages (sign-in, sign-up)
4. Create dashboard layout
5. Task components (list, form, item)
6. API client with JWT
7. Protected routes
```

## Response snapshot

**Task Breakdown Generated**: 96 tasks across 12 phases

### Phase Breakdown

**Phase 1: Project Setup (7 tasks)**
- T001-T007: Next.js 16 initialization, dependency installation (Better Auth, shadcn/ui, testing libraries)

**Phase 2: Configuration (10 tasks)**
- T008-T017: TypeScript strict mode, Next.js config (cacheComponents: true), Tailwind, Vitest, Playwright, Prettier, environment variables

**Phase 3: Directory Structure & Types (7 tasks)**
- T018-T024: Create folder structure, TypeScript types (Task, User, API contracts), Zod validation schemas

**Phase 4: Foundational Infrastructure (6 tasks)**
- T025-T030: API client with 401 handling, Better Auth config, proxy.ts (Next.js 16), utility functions, global styles
- **CRITICAL BLOCKING PHASE**: All user stories depend on this

**Phase 5: User Story 1 - View Task List (13 tasks, P1 MVP)**
- T031-T034: Tests (unit, integration, E2E)
- T035-T043: TaskContext, FilterButtons, TaskItem, TaskList, empty state, pages, hooks
- **Delivers**: Task list with filtering (All/Pending/Completed)

**Phase 6: User Story 2 - Create Task (7 tasks, P1 MVP)**
- T044-T046: Tests
- T047-T050: TaskForm, Toast, context updates, modal integration
- **Delivers**: Create new tasks with validation

**Phase 7: User Story 3 - Toggle Complete (6 tasks, P1 MVP)**
- T051-T053: Tests
- T054-T056: Toggle logic, checkbox enable, strikethrough styling
- **Delivers**: Mark tasks complete/incomplete

**Phase 8: User Story 4 - Edit Task (6 tasks, P2)**
- T057-T059: Tests
- T060-T062: Update task logic, edit button, edit modal
- **Delivers**: Edit existing tasks

**Phase 9: User Story 5 - Delete Task (7 tasks, P2)**
- T063-T065: Tests
- T066-T069: DeleteConfirmDialog, delete logic, delete button
- **Delivers**: Delete tasks with confirmation

**Phase 10: Authentication (8 tasks)**
- T070-T077: SignUpForm, SignInForm, auth pages, AuthContext, sign-out, E2E auth tests
- **Delivers**: Complete auth flow (sign-up, sign-in, sign-out)

**Phase 11: Protected Routes (3 tasks)**
- T078-T080: Verify proxy.ts, useAuth hook, protect /tasks page
- **Delivers**: Auth enforcement on protected routes

**Phase 12: Polish (16 tasks)**
- T081-T096: Accessibility (ARIA, keyboard nav, contrast), performance (memo, virtualization, Lighthouse), error handling, testing coverage (80%), validation, documentation
- **Delivers**: Production-ready frontend

### Key Features

**Test-Driven Development (TDD)**:
- All user stories have tests written FIRST (T031-T034, T044-T046, T051-T053, etc.)
- Tests MUST fail before implementation begins
- 80% coverage minimum (constitution requirement)

**Parallel Execution Opportunities**:
- Setup tasks (T001-T007) can run in parallel
- Type creation (T019-T024) can run in parallel
- User stories (US1-US5, Auth) can be worked on in parallel after Phase 4 complete
- Polish tasks (many marked [P]) can run in parallel

**MVP Scope** (Phases 1-7 + 10-11):
- 64 tasks
- Time estimate: 15-21 hours
- Delivers: View tasks → Create tasks → Toggle completion → Full auth

**Full Feature Scope** (All 96 tasks):
- Time estimate: 25-35 hours
- Adds: Edit tasks → Delete tasks → Polish (accessibility, performance, docs)

### Implementation Strategy

**MVP First**:
1. Foundation (Phases 1-4): ~4-6 hours
2. US1 + US2 + US3 (View, Create, Toggle): ~7-10 hours
3. Auth + Protected Routes (Phases 10-11): ~4-5 hours
4. Validate MVP end-to-end before proceeding

**Incremental Delivery**:
- Each user story independently testable
- Can demo after each story completion
- Foundation → US1 → US2 → US3 → Auth → US4 → US5 → Polish

**Parallel Team (3 developers)**:
- All work on Foundation together (Phase 4)
- Then split: Dev A (US1, US4), Dev B (US2, US5), Dev C (US3, Auth)
- Converge on Polish

### Design Decisions Reflected in Tasks

- **Next.js 16**: proxy.ts instead of middleware.ts (T028, T078)
- **Better Auth**: JWT with HTTP-only cookies (T027, T070-T076)
- **shadcn/ui**: Professional minimalist components (T003-T004)
- **TypeScript Strict**: 100% type coverage enforced (T008, T093)
- **Tailwind CSS**: Utility-first styling, Slate palette (T010)
- **Performance**: Server Components, caching strategy (T041, T084-T086)
- **Accessibility**: WCAG AA compliance (T081-T083)

## Outcome

- ✅ Impact: Complete task breakdown (96 tasks) ready for /sp.implement execution
- 🧪 Tests: 21 test tasks included (unit, integration, E2E) covering all user stories
- 📁 Files: 1 file created (tasks.md)
- 🔁 Next prompts: `/sp.implement` to execute tasks in TDD workflow
- 🧠 Reflection: Tasks organized by user story for independent implementation. Foundation phase (T025-T030) blocks all user stories. MVP scope (64 tasks) clearly defined. Parallel execution opportunities marked with [P]. Test-first approach enforced. Time estimates provided (15-21 hours MVP, 25-35 hours full).

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Task structure follows template (PASS), user stories mapped correctly (PASS), dependencies clear (PASS)
- Prompt variant (if applicable): Standard /sp.tasks workflow with TDD emphasis
- Next experiment (smallest change to try): Execute MVP tasks (T001-T080) with /sp.implement and validate foundation blocking behavior
