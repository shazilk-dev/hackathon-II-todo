<!--
Sync Impact Report - Constitution Update
========================================
Version: 1.0.0 → 2.0.0
Rationale: MAJOR version bump - Phase 2 transition introduces backward-incompatible changes:
  - Multi-tier web architecture replaces single-module console app
  - New tech stack (Next.js, FastAPI, PostgreSQL) vs. Python stdlib only
  - Security-first principles added (JWT auth, data isolation)
  - Database persistence replaces in-memory storage

Principles Modified:
- I. Technology Stack → Complete replacement for Phase 2 web stack
- II. Architecture Constraints → Single module → Multi-tier (frontend/backend/database)
- III. Code Quality Standards → Extended with TypeScript type safety
- IV. Testing Requirements → Expanded with E2E and API contract testing
- V. Spec-Driven Development Workflow → Enhanced with Test-Driven Development (TDD) mandate

Sections Added:
- Security Principles (Principle VI) - JWT auth, input validation, data isolation
- Clean Architecture Requirements (Principle VII) - Separation of concerns, layered design

Sections Retained:
- Development Workflow (SDD mandatory sequence)
- Quality Gates (Constitution Check, Pre-Commit, Definition of Done)
- Governance (Amendment, Compliance, Override Protocol)

Templates Requiring Updates:
✅ plan-template.md - Constitution Check updated for web app structure
✅ spec-template.md - Requirements align with security-first approach
✅ tasks-template.md - Task format includes frontend/backend path conventions

Follow-up TODOs:
- None (all placeholders filled)
-->

# Hackathon II - Todo Web App Constitution (Phase 2)

## Core Principles

### I. Technology Stack (NON-NEGOTIABLE)

**Frontend**:
- **Framework**: Next.js 16+ (App Router required)
- **Language**: TypeScript 5.7+ with strict mode enabled
- **Styling**: Tailwind CSS 4+ for all UI styling
- **Type Safety**: All components and functions MUST have explicit TypeScript types
- **Build Tool**: Turbopack (default with Next.js 16+)

**Backend**:
- **Framework**: FastAPI (latest stable version)
- **Language**: Python 3.13+ with type hints on ALL functions
- **ORM**: SQLModel for database models and queries
- **Database**: Neon PostgreSQL with async drivers (asyncpg)
- **Package Management**: UV for dependency management

**Authentication**:
- **Provider**: Better Auth with JWT token strategy
- **Token Type**: JWT (JSON Web Tokens) for stateless authentication
- **Storage**: HTTP-only cookies for token storage (XSS protection)

**Development Tools**:
- **Type Checking**: mypy (backend), TypeScript compiler (frontend)
- **Linting**: Ruff (backend), ESLint (frontend)
- **Formatting**: Ruff format (backend), Prettier (frontend)
- **Testing**: pytest (backend), Vitest + Playwright (frontend)

**Rationale**: This stack balances modern best practices with hackathon velocity. Next.js 16 provides excellent TypeScript DX and built-in optimizations. FastAPI enables rapid API development with automatic OpenAPI docs. SQLModel bridges Pydantic and SQLAlchemy for type-safe database access. Neon PostgreSQL provides serverless scaling without infrastructure overhead. Better Auth simplifies JWT implementation while maintaining security standards.

### II. Architecture Constraints

**Multi-Tier Web Architecture** (MANDATORY):

```
frontend/          # Next.js 16+ application
├── src/
│   ├── app/          # App Router pages and layouts
│   ├── components/   # React components (UI layer)
│   ├── lib/          # Client-side utilities and API clients
│   └── types/        # TypeScript type definitions
└── tests/            # Vitest unit tests + Playwright E2E

backend/           # FastAPI application
├── src/
│   ├── models/       # SQLModel database models (data layer)
│   ├── services/     # Business logic (service layer)
│   ├── api/          # FastAPI routers and endpoints (API layer)
│   ├── auth/         # Better Auth configuration and utilities
│   └── db/           # Database connection and migrations
└── tests/            # pytest unit + integration tests
```

**Layered Separation** (NON-NEGOTIABLE):
- **Frontend**: UI components MUST NOT contain business logic
- **Backend API Layer**: Handles HTTP concerns, delegates to services
- **Backend Service Layer**: Contains ALL business logic, isolated from HTTP
- **Backend Data Layer**: SQLModel models, database operations only
- **No Layer Skipping**: API → Service → Data (strict flow enforcement)

**Database Design**:
- **Async-First**: All database operations MUST use async/await
- **Migrations**: Alembic for schema version control (auto-generated from SQLModel)
- **Connection Pooling**: Managed by SQLAlchemy async engine
- **User Isolation**: Row-level security via `user_id` foreign key on ALL user data tables

**No Over-Engineering** (YAGNI):
- Avoid abstractions until pattern appears 3+ times
- No microservices (monolithic backend acceptable for hackathon scope)
- No complex state management (React Context sufficient, no Redux/Zustand unless justified)
- No premature optimization (measure before optimizing)

**Rationale**: Multi-tier architecture enforces separation of concerns and enables independent scaling. Layered design prevents logic leakage and makes testing straightforward. Async database operations maximize throughput under concurrency. YAGNI principles prevent scope creep and keep velocity high during hackathon timeframe.

### III. Code Quality Standards (NON-NEGOTIABLE)

**TypeScript (Frontend)**:
- **Strict Mode**: `strict: true` in tsconfig.json (no implicit any, null checks enforced)
- **Type Coverage**: 100% - every function, component, and variable MUST have explicit types
- **Component Types**: Props interfaces for ALL React components
- **API Types**: Shared types for API request/response contracts
- **No Type Escape Hatches**: Avoid `any`, `@ts-ignore`, `as unknown as X` (requires justification if used)

**Python (Backend)**:
- **Type Hints**: Required on ALL function signatures (parameters + return types)
- **Type Checking**: Code MUST pass `mypy --strict` with no errors
- **Docstrings**: Required on all public methods and classes (Google style)
- **Private Methods**: No docstrings required for underscore-prefixed methods
- **Pydantic Validation**: All API inputs MUST use Pydantic models for validation

**Naming Conventions**:
- **Frontend**: camelCase (variables/functions), PascalCase (components/types)
- **Backend**: snake_case (variables/functions/modules), PascalCase (classes)
- **Database**: snake_case (tables/columns), plural table names (e.g., `tasks`, `users`)
- **API Routes**: kebab-case (e.g., `/api/task-lists`)
- **Files**: Match language convention (camelCase.tsx, snake_case.py)

**Code Organization**:
- **Single Responsibility**: Each file/class/function has ONE clear purpose
- **DRY Principle**: Avoid duplication (extract to shared utilities after 3rd occurrence)
- **Explicit Imports**: No wildcard imports (`import *`), prefer named imports
- **Dependency Direction**: Higher layers import lower layers (never reverse)

**Rationale**: TypeScript strict mode catches entire classes of bugs at compile time. Type hints enable IDE intelligence and prevent runtime type errors. Pydantic validation ensures API boundary safety. Consistent naming reduces cognitive load. Single responsibility and explicit imports improve code navigability and testability.

### IV. Testing Requirements

**Coverage Minimum**: 80% code coverage across frontend and backend (enforced in CI)

**Test Pyramid** (MANDATORY):

```
        E2E Tests (10%)
       /              \
    API/Integration (30%)
   /                      \
Unit Tests (60%)
```

**Backend Testing** (pytest):
- **Unit Tests**: Service layer functions (business logic isolation)
  - File: `tests/unit/test_<service>.py`
  - Naming: `test_<function>_<scenario>`
  - Mocking: Mock database calls, test logic only
- **Integration Tests**: API endpoints with test database
  - File: `tests/integration/test_<endpoint>.py`
  - Naming: `test_<method>_<route>_<scenario>`
  - Test DB: Use pytest fixtures with database rollback per test
- **Contract Tests**: Verify API request/response schemas
  - File: `tests/contract/test_<endpoint>_contract.py`
  - Validation: Ensure Pydantic models match OpenAPI specs

**Frontend Testing** (Vitest + Playwright):
- **Unit Tests**: Component logic and utilities (Vitest)
  - File: `tests/unit/<ComponentName>.test.tsx`
  - Naming: `test('<ComponentName> <behavior>')`
  - Isolation: Mock API calls, test rendering and interactions
- **E2E Tests**: Complete user flows (Playwright)
  - File: `tests/e2e/<flow-name>.spec.ts`
  - Naming: `test('<user journey>')`
  - Scope: Authentication, task CRUD, full workflows

**Test-Driven Development (TDD)** (ENCOURAGED):
- **Red-Green-Refactor**: Write failing test → implement → refactor
- **Contract-First**: For APIs, write contract tests before implementation
- **Parallel Safe**: All tests MUST be runnable independently and in parallel

**Test Data Management**:
- **Backend**: Factory pattern for test models (e.g., `TaskFactory`, `UserFactory`)
- **Frontend**: Mock service workers (MSW) for API mocking
- **Isolation**: Each test creates and cleans up its own data

**Rationale**: 80% coverage balances thoroughness with velocity. Test pyramid ensures fast feedback (unit tests) while catching integration issues. TDD reduces defect rates and improves design. Contract tests prevent frontend/backend drift. Factory pattern and MSW enable reliable, fast test execution.

### V. Spec-Driven Development Workflow (MANDATORY)

All development MUST follow this strict sequence:

1. **Specify** (`/sp.specify`): Define feature requirements in `specs/<feature>/spec.md`
2. **Plan** (`/sp.plan`): Document architecture decisions in `specs/<feature>/plan.md`
3. **Tasks** (`/sp.tasks`): Create testable task breakdown in `specs/<feature>/tasks.md`
4. **Implement** (`/sp.implement`): Execute tasks with NO manual coding

**Non-negotiable rules**:
- **NO CODE WITHOUT TASK**: Every code change MUST correspond to a task in `tasks.md`
- **NO MANUAL CODING**: Use ONLY `/sp.implement` - no direct code editing by developers
- **Commit Messages**: MUST reference Task ID format: `[TASK-001] Add JWT authentication middleware`
- **File Headers**: All modified files MUST include Task ID comment at top:
  - Frontend: `// Task: TASK-001`
  - Backend: `# Task: TASK-001`
- **Traceability**: Requirement → Plan → Task → Code linkage MUST be maintained

**Spec-Driven Flow**:

```
User Request → /sp.specify → spec.md (WHAT to build)
            ↓
         /sp.plan → plan.md (HOW to build it)
            ↓
        /sp.tasks → tasks.md (BREAKDOWN into steps)
            ↓
     /sp.implement → Code (EXECUTION, no manual edits)
```

**Checkpoint**: Each phase MUST be complete before proceeding. No skipping allowed.

**Rationale**: Spec-Driven Development ensures traceability from requirement to implementation. NO MANUAL CODING prevents ad-hoc changes that bypass planning, reducing technical debt and scope creep. Task IDs create accountability and enable precise change tracking. This workflow is essential for team collaboration and audit trails in production systems.

### VI. Security Principles (NON-NEGOTIABLE)

**Authentication & Authorization**:
- **All API Routes Protected**: Every backend endpoint MUST validate JWT (except public routes like `/auth/login`)
- **JWT Validation**: Verify token signature, expiration, and user claims on EVERY request
- **HTTP-Only Cookies**: Store JWT in HTTP-only cookies (prevents XSS token theft)
- **CORS Configuration**: Restrict origins to frontend domain (no wildcard `*` in production)
- **Session Management**: Implement token refresh flow (short-lived access tokens + refresh tokens)

**Data Isolation** (CRITICAL):
- **User Ownership**: Every user-owned resource (tasks, lists) MUST have `user_id` foreign key
- **Query Filtering**: ALL database queries MUST filter by authenticated user's ID
- **Prohibited**: Cross-user data access (users CANNOT see/modify other users' data)
- **Enforcement**: Database queries MUST use `WHERE user_id = <authenticated_user_id>`

**Input Validation**:
- **Backend**: ALL API inputs MUST use Pydantic models with validation rules
  - Example: `title: str = Field(min_length=1, max_length=200)`
- **Frontend**: Form validation before submission (client-side UX, not security)
- **SQL Injection Prevention**: Use SQLModel parameterized queries (NEVER string concatenation)
- **XSS Prevention**: React escapes by default; avoid `dangerouslySetInnerHTML` unless sanitized

**Error Handling**:
- **No Sensitive Data in Errors**: Log full details server-side, return generic messages to client
  - Bad: `{"error": "User john@example.com not found in users table"}`
  - Good: `{"error": "Authentication failed"}`
- **Status Codes**: Use appropriate HTTP codes (401 Unauthorized, 403 Forbidden, 404 Not Found)
- **Rate Limiting**: Implement on auth endpoints (prevent brute force attacks)

**Environment Secrets**:
- **No Hardcoded Secrets**: Use `.env` files (NEVER commit `.env` to git)
- **Required Secrets**: `DATABASE_URL`, `JWT_SECRET_KEY`, `NEXTAUTH_SECRET`
- **Secret Rotation**: Document rotation procedures in README

**Rationale**: JWT authentication provides stateless scalability while HTTP-only cookies prevent XSS attacks. User ID filtering enforces data isolation at the database level. Pydantic validation prevents injection attacks and ensures data integrity. Generic error messages prevent information leakage. Environment variable secrets enable rotation without code changes.

### VII. Clean Architecture Requirements

**Separation of Concerns** (MANDATORY):

**Frontend Layers**:
1. **UI Layer** (`components/`): React components (presentation only, no business logic)
2. **API Client** (`lib/api/`): Fetch wrappers, API call abstraction
3. **State Management** (`lib/store/` if needed): Application state (Context API or Zustand)
4. **Type Definitions** (`types/`): Shared TypeScript interfaces

**Backend Layers**:
1. **API Layer** (`api/routers/`): FastAPI routers (HTTP concerns, request/response mapping)
2. **Service Layer** (`services/`): Business logic (isolated from HTTP, reusable)
3. **Data Layer** (`models/`): SQLModel models (database schema, queries)
4. **Auth Layer** (`auth/`): Better Auth configuration, JWT utilities

**Dependency Flow** (ENFORCED):
- **Frontend**: UI → API Client → Backend
- **Backend**: API → Service → Data
- **Prohibited**: UI calling Service directly, API calling Data directly

**Business Logic Location**:
- **Backend Service Layer ONLY**: All validation, calculations, workflows
- **Not in API Layer**: Routers delegate to services (thin controllers)
- **Not in Data Layer**: Models are pure data structures (no complex methods)
- **Not in Frontend**: UI components display data, call APIs (no business rules)

**Example - Task Creation**:

```typescript
// ❌ BAD: Business logic in UI component
function TaskForm() {
  const handleSubmit = (data) => {
    if (data.title.length < 1 || data.title.length > 200) {
      toast.error("Title must be 1-200 characters")
      return
    }
    // API call...
  }
}

// ✅ GOOD: UI delegates to API, validation in backend service
function TaskForm() {
  const handleSubmit = async (data) => {
    try {
      await createTask(data) // API client handles call
    } catch (error) {
      toast.error(error.message) // Display server validation error
    }
  }
}

# Backend service (business logic)
def create_task(task_data: TaskCreate, user_id: int) -> Task:
    if len(task_data.title) < 1 or len(task_data.title) > 200:
        raise ValidationError("Title must be 1-200 characters")
    # Create task...
```

**Interface Contracts**:
- **API Contracts**: Shared TypeScript types (generated from OpenAPI or manually synced)
- **Version API**: Use `/api/v1/` prefix for future compatibility
- **Consistent Responses**: Standardize success/error response shapes

**Rationale**: Separation of concerns enables independent testing, reuse, and scaling. Service layer isolation allows business logic testing without HTTP mocking. Thin API controllers keep routing simple. Shared type definitions prevent frontend/backend drift. Versioned APIs enable backward-compatible evolution.

## Development Workflow

### Mandatory SDD Sequence

```
User Request → /sp.specify → /sp.plan → /sp.tasks → /sp.implement
```

**Flow Details**:

1. **Specify Phase**: Capture WHAT needs to be built (user stories, requirements, success criteria)
2. **Plan Phase**: Define HOW it will be built (architecture, technical approach, design decisions)
3. **Tasks Phase**: Break down INTO executable tasks (concrete, testable, independently verifiable)
4. **Implement Phase**: Execute tasks with `/sp.implement` (NO manual coding allowed)

**Checkpoint**: Each phase MUST be complete before proceeding to next phase. No skipping allowed.

### Task Tracking

- **Task IDs**: Sequential format `TASK-001`, `TASK-002`, etc. within each feature
- **Task Status**: Tracked with checkboxes in `tasks.md`:
  - `[ ]` - Pending (not started)
  - `[>]` - In Progress (actively being worked)
  - `[x]` - Completed (done and verified)
- **Code Annotation**: All code changes MUST include Task ID reference (file headers)
- **Commit Messages**: MUST include Task ID for traceability

### Prompt History Records (PHR)

Every user interaction MUST create a PHR in `history/prompts/`:

- **Constitution changes** → `history/prompts/constitution/`
- **Feature work** → `history/prompts/<feature-name>/`
- **General queries** → `history/prompts/general/`

**PHR Purpose**: Capture decision context, document why choices were made, enable learning from past interactions, provide audit trail for project evolution.

### Architecture Decision Records (ADR)

Significant architectural decisions MUST be documented in `history/adr/`.

**ADR Significance Test** (ALL must be true):
1. **Long-term impact**: Decision affects system design for extended period
2. **Multiple alternatives**: More than one viable approach was considered
3. **Cross-cutting concerns**: Decision influences multiple components or system design

**Process**: Agent suggests ADR when significance test passes. User must approve ADR creation. ADRs are NEVER auto-created.

**Suggestion Format**:
```
📋 Architectural decision detected: <brief description>
   Document reasoning and tradeoffs? Run `/sp.adr <decision-title>`
```

## Quality Gates

### Constitution Check (Pre-Planning Gate)

Before any planning work begins, verify:

- [ ] Frontend stack matches constitution (Next.js 16+, TypeScript 5.7+, Tailwind CSS)
- [ ] Backend stack matches constitution (FastAPI, Python 3.13+, SQLModel, Neon PostgreSQL)
- [ ] Authentication uses Better Auth with JWT
- [ ] Architecture follows multi-tier structure (frontend/backend separation)
- [ ] Security principles addressed (JWT protection, user data isolation)
- [ ] No prohibited dependencies or patterns proposed
- [ ] Scope is appropriate for hackathon (not over-engineered)

**Action**: If violations detected, STOP and either adjust plan or justify complexity with ADR.

### Pre-Commit Checks

Before any commit:

**Backend**:
- [ ] Type checking passes (`mypy --strict`)
- [ ] All tests pass (`pytest`)
- [ ] Coverage >= 80% for modified modules (`pytest --cov`)
- [ ] Linting passes (`ruff check`)
- [ ] Formatting applied (`ruff format`)

**Frontend**:
- [ ] Type checking passes (`tsc --noEmit`)
- [ ] All tests pass (`vitest run`)
- [ ] Linting passes (`eslint`)
- [ ] Formatting applied (`prettier --write`)

**Both**:
- [ ] Every modified file has Task ID reference
- [ ] Commit message includes Task ID
- [ ] No `.env` files committed (secrets safety)

**Action**: If any check fails, FIX before committing. No exceptions.

### Definition of Done

A task is complete ONLY when ALL criteria met:

- [ ] Code implements task requirements as specified in `tasks.md`
- [ ] Type hints (Python) or TypeScript types (frontend) present on all functions/components
- [ ] Docstrings (Python) or JSDoc comments (TypeScript) on all public APIs
- [ ] Tests written and passing for new/changed functionality
- [ ] Code coverage >= 80% maintained
- [ ] Security checks pass (JWT validation, input validation, user isolation where applicable)
- [ ] Task ID referenced in code headers and commit message
- [ ] PHR created documenting work session
- [ ] No console errors or warnings in browser/terminal

**Verification**: Review checklist before marking task as `[x]` completed in `tasks.md`.

## Governance

### Constitution Authority

This constitution supersedes all other development practices and preferences. When conflicts arise between constitution rules and other guidance, constitution rules MUST be followed.

### Amendment Process

1. **Propose**: Document proposed change with clear rationale
2. **Approve**: Get explicit user approval for amendment
3. **Version**: Bump version according to semantic versioning:
   - **MAJOR** (x.0.0): Backward incompatible principle removals or redefinitions (e.g., tech stack change)
   - **MINOR** (0.x.0): New principles/sections added or materially expanded guidance
   - **PATCH** (0.0.x): Clarifications, wording fixes, non-semantic refinements
4. **Document**: Create ADR documenting the amendment reasoning
5. **Propagate**: Update all dependent templates/scripts affected by change
6. **Sync**: Update Sync Impact Report at top of constitution file

### Compliance Verification

The SDD agent is responsible for:

- **Blocking non-compliant implementations**: Refuse to proceed if constitution violated (e.g., manual coding attempted)
- **Suggesting corrections**: When violations detected, propose compliant alternatives
- **Creating PHRs**: Document all user interactions per PHR guidelines
- **Recommending ADRs**: Suggest ADRs when significance test passes
- **Enforcing NO MANUAL CODING**: Only `/sp.implement` allowed for code changes

### Override Protocol

User CAN override specific constitution constraints with **explicit approval**:

1. Agent detects constitutional violation
2. Agent explains which rule is being violated and why
3. User provides explicit override approval with justification
4. Agent documents override in PHR with justification
5. If significant, agent suggests ADR to document reasoning

**Documentation Requirement**: All overrides MUST be documented. No silent violations allowed.

**Common Override Scenarios**:
- Emergency hotfix (bypass `/sp.specify` for critical bug)
- Exploration spike (manual coding to prototype before spec)
- Third-party library addition (justify why stdlib/approved stack insufficient)

### Enforcement

Constitution compliance is verified at:

- **Planning**: Constitution Check gate before design work begins
- **Task Generation**: Tasks must align with SDD workflow requirements
- **Implementation**: Pre-commit checks enforce quality gates
- **Review**: Definition of Done checklist verification before task completion

**Escalation**: If systematic violations occur, revisit constitution to determine if amendment needed or if enforcement needs strengthening.

---

**Version**: 2.0.0 | **Ratified**: 2026-01-12 | **Last Amended**: 2026-01-12
