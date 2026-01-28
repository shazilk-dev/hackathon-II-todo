# Tasks: Task CRUD (Next.js 16 Frontend)

**Input**: Design documents from `/specs/002-task-crud/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/task-api.md, quickstart.md

**Tests**: Tests are REQUIRED per constitution (80% coverage minimum). Test tasks are included and MUST be completed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, SETUP)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/` for all frontend code
- **Tests**: `frontend/tests/` for all test files
- All paths relative to repository root

---

## Phase 1: Project Setup (Shared Infrastructure)

**Purpose**: Initialize Next.js 16 project with all dependencies and configuration

**Duration Estimate**: ~2-3 hours

- [ ] **T001** [P] [SETUP] Create Next.js 16 project in `frontend/` using `npx create-next-app@latest` with TypeScript, Tailwind CSS, App Router, src/ directory, and Turbopack
- [ ] **T002** [P] [SETUP] Install core dependencies: `better-auth`, `zod`, `react-hook-form`, `@hookform/resolvers`, `lucide-react`, `date-fns` in `frontend/`
- [ ] **T003** [P] [SETUP] Install shadcn/ui with `npx shadcn@latest init` (Default style, Slate color, CSS variables) in `frontend/`
- [ ] **T004** [P] [SETUP] Install shadcn/ui components: `button`, `input`, `label`, `textarea`, `dialog`, `toast`, `checkbox` in `frontend/`
- [ ] **T005** [P] [SETUP] Install dev dependencies for testing: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` in `frontend/`
- [ ] **T006** [P] [SETUP] Install Playwright for E2E testing: `playwright`, `@playwright/test` and run `npx playwright install` in `frontend/`
- [ ] **T007** [P] [SETUP] Install linting/formatting: `prettier`, `prettier-plugin-tailwindcss`, `eslint-config-prettier` in `frontend/`

**Checkpoint**: All dependencies installed, ready for configuration

---

## Phase 2: Configuration (Foundational)

**Purpose**: Configure TypeScript, Next.js, Tailwind, testing tools per plan.md standards

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] **T008** [SETUP] Configure `frontend/tsconfig.json` with strict mode enabled (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, `noUncheckedIndexedAccess: true`)
- [ ] **T009** [SETUP] Configure `frontend/next.config.ts` with `cacheComponents: true`, `reactStrictMode: true`, `poweredByHeader: false`
- [ ] **T010** [P] [SETUP] Configure `frontend/tailwind.config.ts` with shadcn/ui theme variables, darkMode: 'class', Inter font family
- [ ] **T011** [P] [SETUP] Create `frontend/vitest.config.ts` with jsdom environment, coverage provider v8, alias @/ to ./src
- [ ] **T012** [P] [SETUP] Create `frontend/tests/setup.ts` with `import '@testing-library/jest-dom'`
- [ ] **T013** [P] [SETUP] Create `frontend/playwright.config.ts` with testDir: './tests/e2e', baseURL: 'http://localhost:3000', chromium/firefox/webkit projects
- [ ] **T014** [P] [SETUP] Create `frontend/.prettierrc` with semi: false, singleQuote: true, tailwindcss plugin, printWidth: 100
- [ ] **T015** [SETUP] Create `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000`, `BETTER_AUTH_SECRET` (generate with openssl), `NEXTAUTH_URL=http://localhost:3000`
- [ ] **T016** [P] [SETUP] Update `frontend/.gitignore` to include `.env.local`, `.env.*.local`, `coverage/`, `playwright-report/`, `test-results/`
- [ ] **T017** [SETUP] Update `frontend/package.json` scripts: `dev` (with --turbopack), `build`, `start`, `lint`, `format`, `test`, `test:watch`, `test:coverage`, `test:e2e`, `type-check`

**Checkpoint**: Configuration complete, project ready for development

---

## Phase 3: Directory Structure & Types

**Purpose**: Create folder structure and TypeScript type definitions per data-model.md

- [ ] **T018** [SETUP] Create directory structure: `frontend/src/app/(auth)/{signin,signup}`, `frontend/src/app/tasks`, `frontend/src/components/{ui,auth,tasks}`, `frontend/src/lib/{api,auth,hooks,validation,contexts}`, `frontend/src/types`, `frontend/tests/{unit,integration,e2e}`
- [ ] **T019** [P] [SETUP] Create `frontend/src/types/task.ts` with `Task` interface, `TaskFormData` interface (per data-model.md)
- [ ] **T020** [P] [SETUP] Create `frontend/src/types/auth.ts` with `User`, `SignUpFormData`, `SignInFormData` interfaces (per data-model.md)
- [ ] **T021** [P] [SETUP] Create `frontend/src/types/api.ts` with API request/response types for 6 endpoints (per contracts/task-api.md)
- [ ] **T022** [P] [SETUP] Create `frontend/src/types/ui.ts` with `FilterType`, `ModalType`, `LoadingState`, `ToastState` types (per data-model.md)
- [ ] **T023** [P] [SETUP] Create `frontend/src/lib/validation/task.ts` with Zod `taskFormSchema` (title: 1-200 chars, description optional)
- [ ] **T024** [P] [SETUP] Create `frontend/src/lib/validation/auth.ts` with Zod `signUpSchema` (email, password min 8 chars) and `signInSchema`

**Checkpoint**: Types and validation schemas complete

---

## Phase 4: Foundational Infrastructure

**Purpose**: Core infrastructure (API client, auth, routing) that BLOCKS all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### API Client Layer

- [ ] **T025** [INFRA] Create `frontend/src/lib/api/client.ts` with base `APIClient` class: fetch wrapper, credentials: 'include', 401 handling (redirect to /signin), error parsing (per contracts/task-api.md)
- [ ] **T026** [INFRA] Create `frontend/src/lib/api/tasks.ts` with typed functions: `getTasks()`, `createTask()`, `updateTask()`, `deleteTask()`, `toggleComplete()` using APIClient (per contracts/task-api.md)

### Better Auth Configuration

- [ ] **T027** [INFRA] Create `frontend/src/lib/auth/config.ts` with Better Auth client configuration: JWT enabled, 7-day expiration, HTTP-only cookies, auth-token cookie name

### Next.js 16 Proxy (Routing)

- [ ] **T028** [INFRA] Create `frontend/src/app/proxy.ts` with `proxy()` function: check auth-token cookie, redirect to /signin if missing and accessing /tasks (per research.md Next.js 16 pattern)

### Utility Functions

- [ ] **T029** [P] [INFRA] Create `frontend/src/lib/utils.ts` with `cn()` function (classnames utility), `formatDate()`, `formatRelativeTime()` (per data-model.md)

### Global Styles

- [ ] **T030** [P] [INFRA] Create `frontend/src/styles/globals.css` with Tailwind directives (@tailwind base/components/utilities), shadcn/ui CSS variables, custom global styles

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 5: User Story 1 - View Task List with Filtering (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can view their task list with filter buttons (All, Pending, Completed)

**Independent Test**: Sign in → navigate to /tasks → see task list with 3 filter buttons → click "Pending" → only incomplete tasks shown

**Acceptance Criteria** (from spec.md):
- Display all user tasks sorted by created_at descending
- Filter buttons: All, Pending, Completed with active state highlighting
- Empty state when no tasks
- API call to GET /api/{user_id}/tasks with JWT
- Redirect to /signin if JWT expired (401)

### Tests for User Story 1 ✅

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] **T031** [P] [US1] Create unit test `frontend/tests/unit/components/TaskList.test.tsx`: renders empty state, renders tasks, applies filter correctly
- [ ] **T032** [P] [US1] Create unit test `frontend/tests/unit/components/FilterButtons.test.tsx`: renders 3 buttons, highlights active filter, calls onChange on click
- [ ] **T033** [P] [US1] Create integration test `frontend/tests/integration/api/tasks.test.ts`: mock GET /api/{user_id}/tasks with MSW, verify fetch calls, handle 401 error
- [ ] **T034** [US1] Create E2E test `frontend/tests/e2e/tasks.spec.ts`: sign in → navigate to /tasks → verify task list renders → click filter → verify filtered list

### Implementation for User Story 1

#### Context & State Management

- [ ] **T035** [US1] Create `frontend/src/lib/contexts/TaskContext.tsx`: TaskContext with state (tasks, filter, loading), actions (fetchTasks, setFilter), provider component wrapping children

#### Components

- [ ] **T036** [P] [US1] Create `frontend/src/components/tasks/FilterButtons.tsx`: 3 buttons (All, Pending, Completed), highlight active, show task counts, call onChange, use Button from shadcn/ui
- [ ] **T037** [P] [US1] Create `frontend/src/components/tasks/TaskItem.tsx`: display task title, description (truncated), checkbox (disabled for now - US3), created date, skeleton for edit/delete buttons (US4/US5)
- [ ] **T038** [US1] Create `frontend/src/components/tasks/TaskList.tsx`: map tasks to TaskItem components, show FilterButtons, handle empty state ("No tasks yet"), loading spinner, use TaskContext
- [ ] **T039** [P] [US1] Create `frontend/src/components/ui/EmptyState.tsx`: reusable empty state component with icon, message, optional action button (used by TaskList)

#### Pages & Routing

- [ ] **T040** [US1] Create `frontend/src/app/layout.tsx`: root layout with Providers (TaskContext, AuthContext), Inter font, globals.css import, <html> and <body> tags
- [ ] **T041** [US1] Create `frontend/src/app/tasks/page.tsx`: TaskList page (Server Component), fetch initial tasks server-side, pass to client TaskList component, handle loading/error states
- [ ] **T042** [P] [US1] Create `frontend/src/app/page.tsx`: landing page with "Todo App" heading, "Sign In" and "Sign Up" links (temporary - will add auth later)

#### Hooks

- [ ] **T043** [US1] Create `frontend/src/lib/hooks/useTasks.ts`: custom hook wrapping TaskContext, provides tasks, filter, setFilter, fetchTasks, loading states

**Checkpoint**: User Story 1 complete - task list displays with filtering, independently testable

---

## Phase 6: User Story 2 - Create New Task (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can create tasks by clicking "Add Task", filling form (title + description), and submitting

**Independent Test**: Click "Add Task" → modal opens → enter title "Buy groceries" → submit → task appears at top of list

**Acceptance Criteria** (from spec.md):
- "Add Task" button opens modal/form
- Form has title (required, max 200 chars) and description (optional)
- Client-side validation before submission
- POST /api/{user_id}/tasks on submit
- New task appears in list, form closes
- Success toast message

### Tests for User Story 2 ✅

- [ ] **T044** [P] [US2] Create unit test `frontend/tests/unit/components/TaskForm.test.tsx`: renders in create mode, validates title (required, max 200), calls onSubmit with data, shows loading state
- [ ] **T045** [P] [US2] Create integration test `frontend/tests/integration/api/tasks-create.test.ts`: mock POST /api/{user_id}/tasks with MSW, verify request body, handle 201 success and 400 error
- [ ] **T046** [US2] Create E2E test `frontend/tests/e2e/tasks-create.spec.ts`: click "Add Task" → fill form → submit → verify task in list → verify toast message

### Implementation for User Story 2

#### Components

- [ ] **T047** [US2] Create `frontend/src/components/tasks/TaskForm.tsx`: form with title input, description textarea, Create/Cancel buttons, React Hook Form + Zod validation, loading state, mode prop (create/edit)
- [ ] **T048** [P] [US2] Create `frontend/src/components/ui/Toast.tsx`: toast notification component (success/error), auto-dismiss after 3s, use shadcn/ui toast primitives

#### Context Updates

- [ ] **T049** [US2] Update `frontend/src/lib/contexts/TaskContext.tsx`: add `createTask(data: TaskFormData)` action, call POST API, update tasks state, show success toast

#### Page Updates

- [ ] **T050** [US2] Update `frontend/src/components/tasks/TaskList.tsx`: add "Add Task" button (opens modal), add Dialog with TaskForm (mode="create"), handle modal open/close state

**Checkpoint**: User Story 2 complete - users can create tasks, independently testable

---

## Phase 7: User Story 3 - Mark Task Complete/Incomplete (Priority: P1) 🎯 MVP

**Goal**: Users toggle task completion by clicking checkbox, task shows visual distinction (strikethrough)

**Independent Test**: Click checkbox on pending task → checkbox becomes checked → task text shows strikethrough → click again → unchecks

**Acceptance Criteria** (from spec.md):
- Checkbox toggles on click
- PATCH /api/{user_id}/tasks/{id}/complete API call
- Completed tasks show strikethrough styling
- Task disappears from list if filtered (e.g., "Pending" filter active)
- Debounce rapid clicks

### Tests for User Story 3 ✅

- [ ] **T051** [P] [US3] Create unit test `frontend/tests/unit/components/TaskItem.test.tsx`: checkbox click calls onToggle, completed task shows strikethrough class, disabled state during loading
- [ ] **T052** [P] [US3] Create integration test `frontend/tests/integration/api/tasks-toggle.test.ts`: mock PATCH /api/{user_id}/tasks/{id}/complete, verify request, handle 200 response
- [ ] **T053** [US3] Create E2E test `frontend/tests/e2e/tasks-toggle.spec.ts`: click checkbox → verify checked → verify strikethrough → click filter "Pending" → verify task removed

### Implementation for User Story 3

#### Context Updates

- [ ] **T054** [US3] Update `frontend/src/lib/contexts/TaskContext.tsx`: add `toggleComplete(taskId: number)` action, call PATCH API, optimistically update task in state, handle error (revert on failure)

#### Component Updates

- [ ] **T055** [US3] Update `frontend/src/components/tasks/TaskItem.tsx`: enable checkbox, call `toggleComplete(task.id)` on change, add strikethrough + opacity styles when `task.completed === true`, disable during toggle loading

#### Styling

- [ ] **T056** [P] [US3] Add Tailwind classes to `frontend/src/components/tasks/TaskItem.tsx` for completed state: `line-through`, `opacity-60`, transition effects

**Checkpoint**: User Story 3 complete - task completion toggling works, independently testable

---

## Phase 8: User Story 4 - Edit Task Details (Priority: P2)

**Goal**: Users can edit task title/description by clicking "Edit" button, modifying in form, and saving

**Independent Test**: Click "Edit" on task → modal opens with pre-filled data → change title → save → task updates in list

**Acceptance Criteria** (from spec.md):
- "Edit" button/icon next to task
- Edit modal/form pre-populated with current values
- Validation (title required, max 200 chars)
- PUT /api/{user_id}/tasks/{id} on save
- Task updates in list, modal closes

### Tests for User Story 4 ✅

- [ ] **T057** [P] [US4] Update unit test `frontend/tests/unit/components/TaskForm.test.tsx`: add tests for edit mode, verify initialData pre-populates fields
- [ ] **T058** [P] [US4] Create integration test `frontend/tests/integration/api/tasks-update.test.ts`: mock PUT /api/{user_id}/tasks/{id}, verify request body, handle 200/404
- [ ] **T059** [US4] Create E2E test `frontend/tests/e2e/tasks-edit.spec.ts`: click "Edit" → verify form pre-filled → change title → save → verify updated task

### Implementation for User Story 4

#### Context Updates

- [ ] **T060** [US4] Update `frontend/src/lib/contexts/TaskContext.tsx`: add `updateTask(taskId: number, data: TaskFormData)` action, call PUT API, update task in state, show success toast

#### Component Updates

- [ ] **T061** [US4] Update `frontend/src/components/tasks/TaskItem.tsx`: add "Edit" button with pencil icon (lucide-react), call `onEdit(task.id)` when clicked
- [ ] **T062** [US4] Update `frontend/src/components/tasks/TaskList.tsx`: add edit modal state (taskId being edited), render Dialog with TaskForm (mode="edit", initialData from selected task), handle save/cancel

**Checkpoint**: User Story 4 complete - task editing works, independently testable

---

## Phase 9: User Story 5 - Delete Task (Priority: P2)

**Goal**: Users can delete tasks by clicking "Delete" button, confirming in dialog, task removed from list

**Independent Test**: Click "Delete" → confirmation dialog appears → click "Confirm" → task disappears → success toast

**Acceptance Criteria** (from spec.md):
- "Delete" button/icon next to task
- Confirmation dialog ("Are you sure?")
- DELETE /api/{user_id}/tasks/{id} on confirm
- Task removed from list with animation
- Handle 404 as success (idempotent)

### Tests for User Story 5 ✅

- [ ] **T063** [P] [US5] Create unit test `frontend/tests/unit/components/DeleteConfirmDialog.test.tsx`: renders with task title, calls onConfirm on "Delete" click, calls onCancel on "Cancel"
- [ ] **T064** [P] [US5] Create integration test `frontend/tests/integration/api/tasks-delete.test.ts`: mock DELETE /api/{user_id}/tasks/{id}, verify request, handle 200/404
- [ ] **T065** [US5] Create E2E test `frontend/tests/e2e/tasks-delete.spec.ts`: click "Delete" → confirm dialog → click "Confirm" → verify task removed → verify toast

### Implementation for User Story 5

#### Components

- [ ] **T066** [US5] Create `frontend/src/components/tasks/DeleteConfirmDialog.tsx`: Dialog with warning message, task title display, "Cancel" and "Delete" buttons, loading state on delete

#### Context Updates

- [ ] **T067** [US5] Update `frontend/src/lib/contexts/TaskContext.tsx`: add `deleteTask(taskId: number)` action, call DELETE API, remove task from state, show success toast, handle 404 as success

#### Component Updates

- [ ] **T068** [US5] Update `frontend/src/components/tasks/TaskItem.tsx`: add "Delete" button with trash icon (lucide-react), call `onDelete(task.id)` when clicked
- [ ] **T069** [US5] Update `frontend/src/components/tasks/TaskList.tsx`: add delete modal state (taskId being deleted), render DeleteConfirmDialog, handle confirm/cancel

**Checkpoint**: User Story 5 complete - task deletion works with confirmation, independently testable

---

## Phase 10: Authentication Pages (User Stories from 003-authentication spec)

**Goal**: Users can sign up, sign in, and sign out using Better Auth

**Prerequisites**: Better Auth configured (T027), API client ready (T025-T026)

### Sign-Up Page

- [ ] **T070** [P] [AUTH] Create `frontend/src/components/auth/SignUpForm.tsx`: form with email input, password input (min 8 chars), "Sign Up" button, React Hook Form + Zod validation, call Better Auth sign-up API
- [ ] **T071** [AUTH] Create `frontend/src/app/(auth)/signup/page.tsx`: render SignUpForm, handle success (redirect to /signin), handle errors (display message), styling with Tailwind

### Sign-In Page

- [ ] **T072** [P] [AUTH] Create `frontend/src/components/auth/SignInForm.tsx`: form with email input, password input, "Sign In" button, React Hook Form + Zod validation, call Better Auth sign-in API
- [ ] **T073** [AUTH] Create `frontend/src/app/(auth)/signin/page.tsx`: render SignInForm, handle success (redirect to /tasks), handle errors (generic "Invalid credentials"), styling with Tailwind

### Auth Context

- [ ] **T074** [AUTH] Create `frontend/src/lib/contexts/AuthContext.tsx`: AuthContext with user state, `signIn()`, `signUp()`, `signOut()` actions, integrate with Better Auth client
- [ ] **T075** [AUTH] Update `frontend/src/app/layout.tsx`: wrap children with AuthContext provider

### Sign-Out

- [ ] **T076** [AUTH] Update `frontend/src/app/layout.tsx`: add header/navigation with user email display, "Sign Out" button, call AuthContext.signOut() on click

### E2E Auth Tests

- [ ] **T077** [AUTH] Create E2E test `frontend/tests/e2e/auth.spec.ts`: full auth flow (sign up → sign in → access /tasks → sign out → redirected to /signin)

**Checkpoint**: Authentication complete - users can sign up, sign in, sign out

---

## Phase 11: Protected Routes & Session Management

**Goal**: Enforce authentication on /tasks routes, redirect unauthenticated users to /signin

- [ ] **T078** [AUTH] Verify `frontend/src/app/proxy.ts` (created in T028) correctly redirects to /signin when auth-token cookie missing
- [ ] **T079** [AUTH] Create `frontend/src/lib/hooks/useAuth.ts`: custom hook wrapping AuthContext, provides user, loading, signIn, signUp, signOut
- [ ] **T080** [AUTH] Update `frontend/src/app/tasks/page.tsx`: check auth status, show loading spinner if checking, redirect to /signin if not authenticated (use useAuth hook)

**Checkpoint**: Protected routes working - unauthenticated access redirects to /signin

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, accessibility, performance optimization

### Accessibility

- [ ] **T081** [P] [POLISH] Add ARIA labels to all interactive elements in `frontend/src/components/tasks/`: buttons, checkboxes, form inputs (per WCAG AA)
- [ ] **T082** [P] [POLISH] Add keyboard navigation support: Tab order, Enter/Space for buttons, Escape to close modals (test with keyboard only)
- [ ] **T083** [P] [POLISH] Verify color contrast ratios meet WCAG AA (4.5:1 for text) using browser DevTools or axe

### Performance

- [ ] **T084** [P] [POLISH] Optimize TaskList rendering: add React.memo to TaskItem, virtualize list if >100 tasks (react-window or native), use Suspense boundaries
- [ ] **T085** [P] [POLISH] Add loading skeletons for TaskList, TaskItem during fetch (improve perceived performance, prevent CLS)
- [ ] **T086** [POLISH] Run Lighthouse audit: verify LCP < 2.5s, FCP < 1.5s, CLS < 0.1, fix any issues

### Error Handling

- [ ] **T087** [P] [POLISH] Add global error boundary in `frontend/src/app/error.tsx`: catch unhandled errors, display user-friendly message, log to console
- [ ] **T088** [P] [POLISH] Add network error handling in API client: detect offline, show "You're offline" toast, retry logic for transient errors

### Documentation

- [ ] **T089** [P] [POLISH] Create `frontend/README.md`: setup instructions (reference quickstart.md), available scripts, environment variables, testing commands
- [ ] **T090** [P] [POLISH] Add JSDoc comments to all exported functions in `frontend/src/lib/api/`, `frontend/src/lib/hooks/`

### Testing Coverage

- [ ] **T091** [POLISH] Run `npm run test:coverage`: verify 80% coverage minimum, add tests for uncovered branches if needed
- [ ] **T092** [POLISH] Run `npm run test:e2e`: verify all E2E tests pass (auth flow, task CRUD, filtering)

### Validation & Cleanup

- [ ] **T093** [POLISH] Run `npm run type-check`: fix any TypeScript errors, ensure strict mode compliance
- [ ] **T094** [POLISH] Run `npm run lint`: fix all ESLint errors and warnings
- [ ] **T095** [POLISH] Run `npm run format`: apply Prettier formatting to all files
- [ ] **T096** [POLISH] Run quickstart.md validation: follow all steps from scratch, ensure setup works, update if needed

**Checkpoint**: All polish tasks complete - production-ready frontend

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Project Setup)**: No dependencies - start immediately
- **Phase 2 (Configuration)**: Depends on Phase 1 completion
- **Phase 3 (Directory & Types)**: Depends on Phase 2 completion
- **Phase 4 (Foundational Infrastructure)**: Depends on Phase 3 completion - **BLOCKS all user stories**
- **Phase 5-9 (User Stories 1-5)**: All depend on Phase 4 completion, can proceed in parallel if staffed
- **Phase 10 (Authentication)**: Depends on Phase 4 completion, can proceed in parallel with US1-5
- **Phase 11 (Protected Routes)**: Depends on Phase 10 completion
- **Phase 12 (Polish)**: Depends on all desired user stories + auth being complete

### User Story Dependencies

- **US1 (View Tasks)**: Can start after Phase 4 - No dependencies on other stories ✅ MVP
- **US2 (Create Task)**: Can start after Phase 4 - No dependencies, but UX improved if US1 done ✅ MVP
- **US3 (Toggle Complete)**: Can start after Phase 4 - No dependencies, but requires US1 for UI ✅ MVP
- **US4 (Edit Task)**: Can start after Phase 4 - No dependencies, but requires US1 for UI
- **US5 (Delete Task)**: Can start after Phase 4 - No dependencies, but requires US1 for UI
- **Auth**: Can start after Phase 4 - Independent from US1-5

### Within Each User Story

1. Tests MUST be written FIRST and FAIL before implementation
2. Context/state before components
3. Components before page integration
4. Story complete and tested before moving to next priority

### Parallel Opportunities

- **Setup tasks (T001-T007)**: All can run in parallel
- **Config tasks marked [P]**: T010-T014, T016 can run in parallel
- **Type creation (T019-T024)**: All can run in parallel
- **Foundational tasks (T029-T030)**: Can run in parallel with T025-T028
- **User Story 1-5 tests**: Within each story, tests marked [P] can run in parallel
- **Different user stories**: US1, US2, US3, US4, US5, Auth can all be worked on in parallel by different team members after Phase 4

---

## Implementation Strategy

### MVP First (US1 + US2 + US3 + Auth)

1. Complete Phase 1-4: Setup + Foundation (~4-6 hours)
2. Complete Phase 5: User Story 1 (View Tasks) (~3-4 hours)
3. Complete Phase 6: User Story 2 (Create Task) (~2-3 hours)
4. Complete Phase 7: User Story 3 (Toggle Complete) (~2-3 hours)
5. Complete Phase 10-11: Authentication + Protected Routes (~4-5 hours)
6. **STOP and VALIDATE**: Test MVP end-to-end (sign up → sign in → view tasks → create → complete → sign out)
7. Deploy/demo MVP

**Total MVP Time**: ~15-21 hours

### Incremental Delivery

1. Foundation → Test independently
2. + US1 (View) → Test independently → Demo
3. + US2 (Create) → Test independently → Demo (can create + view!)
4. + US3 (Toggle) → Test independently → Demo (full task lifecycle!)
5. + Auth → Test independently → Demo (secure MVP!)
6. + US4 (Edit) → Test independently → Demo
7. + US5 (Delete) → Test independently → Demo (complete CRUD!)
8. + Polish → Production-ready

### Parallel Team Strategy

With 3 developers after Phase 4:

- **Developer A**: US1 (View) → US4 (Edit) → Polish (accessibility)
- **Developer B**: US2 (Create) → US5 (Delete) → Polish (performance)
- **Developer C**: US3 (Toggle) → Auth (sign-up/sign-in/sign-out) → Polish (testing coverage)

Stories integrate independently without conflicts.

---

## Notes

- **[P] tasks**: Different files, no dependencies, safe to parallelize
- **[Story] labels**: Map tasks to user stories for traceability (US1, US2, AUTH, SETUP, INFRA, POLISH)
- **Tests FIRST**: Write tests before implementation, verify they FAIL, then implement until they PASS
- **Type-check frequently**: Run `npm run type-check` after each task or group
- **Commit after each task**: Use format `[TASK-XXX] Description` (e.g., `[TASK-025] Create API client base class`)
- **Stop at checkpoints**: Validate story works independently before proceeding
- **Constitution compliance**: All tasks follow spec-driven workflow, no manual coding allowed

---

## Task Count Summary

- **Phase 1 (Setup)**: 7 tasks (T001-T007)
- **Phase 2 (Config)**: 10 tasks (T008-T017)
- **Phase 3 (Types)**: 7 tasks (T018-T024)
- **Phase 4 (Foundation)**: 6 tasks (T025-T030)
- **Phase 5 (US1 - View)**: 13 tasks (T031-T043)
- **Phase 6 (US2 - Create)**: 7 tasks (T044-T050)
- **Phase 7 (US3 - Toggle)**: 6 tasks (T051-T056)
- **Phase 8 (US4 - Edit)**: 6 tasks (T057-T062)
- **Phase 9 (US5 - Delete)**: 7 tasks (T063-T069)
- **Phase 10 (Auth)**: 8 tasks (T070-T077)
- **Phase 11 (Protected Routes)**: 3 tasks (T078-T080)
- **Phase 12 (Polish)**: 16 tasks (T081-T096)

**Total**: 96 tasks

**MVP Tasks** (Phases 1-7 + 10-11): 64 tasks (~15-21 hours)
**Full Feature Tasks** (All phases): 96 tasks (~25-35 hours)

---

## Next Command

Run `/sp.implement` to execute tasks in order. The system will:
1. Execute foundational tasks (T001-T030) sequentially
2. Allow parallel execution of user stories after foundation complete
3. Run tests before implementation (TDD)
4. Validate each checkpoint before proceeding
5. Create commits with task IDs
