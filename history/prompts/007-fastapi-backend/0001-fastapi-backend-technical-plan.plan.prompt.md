---
id: 0001
title: FastAPI Backend Technical Plan
stage: plan
date: 2026-01-12
surface: agent
model: claude-sonnet-4-5-20250929
feature: 007-fastapi-backend
branch: 002-web-todo
user: developer
command: /sp.plan
labels: ["fastapi", "backend", "api", "sqlmodel", "jwt", "async", "architecture"]
links:
  spec: specs/007-fastapi-backend/plan.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/007-fastapi-backend/plan.md
tests:
  - null
---

## Prompt

Create technical plan for FastAPI backend based on specs.

Reference specs:
- task-crud (006)
- authentication (003)
- database-schema (004)
- api-endpoints (005)

Requirements:
- Async FastAPI with SQLModel
- Neon PostgreSQL with asyncpg
- JWT verification middleware
- Proper error handling
- Type hints everywhere

## Response snapshot

Created comprehensive FastAPI backend technical plan at `specs/007-fastapi-backend/plan.md` integrating all four specifications (authentication, database, API endpoints, frontend requirements).

**Architecture**: Clean layered design (API → Service → Data)
- API Layer: FastAPI routers, JWT middleware, HTTP concerns
- Service Layer: Business logic (TaskService with CRUD operations), isolated from HTTP
- Data Layer: SQLModel models (User, Task), async database operations

**Key Components**:
- JWT Middleware: Validates Bearer tokens, extracts user_id from sub claim, enforces user ID matching
- Task Service: 6 methods (get_tasks, create, get, update, delete, toggle_completion) with user isolation
- Async Session Factory: asyncpg connection pooling (10 min, 30 max)
- Pydantic Schemas: TaskCreate, TaskUpdate, TaskResponse, TaskListResponse
- SQLModel Models: User (Better Auth compatible), Task (with foreign key to users)

**Testing Strategy**: Test pyramid (60% unit, 30% integration, 10% contract)
- Fixtures: async db session with rollback, async HTTP client, JWT generation
- Unit: Service layer mocked (test logic only)
- Integration: API endpoints with test database
- Contract: Pydantic schema validation

**Constitution Compliance**: All Phase 2 requirements met (async-only, type hints, 80% coverage, JWT auth, user isolation, clean architecture)

## Outcome

- ✅ Impact: Complete technical plan with detailed designs for all layers (API, Service, Data), JWT middleware, testing, and deployment
- 🧪 Tests: Testing strategy defined (pytest-asyncio, httpx, test fixtures, coverage targets)
- 📁 Files: Created specs/007-fastapi-backend/plan.md (1000+ lines)
- 🔁 Next prompts: Run /sp.tasks to generate implementation tasks, then /sp.implement
- 🧠 Reflection: Plan successfully integrates 4 specs into cohesive backend architecture. Clean separation enforces constitution requirements. JWT middleware is critical integration point with Better Auth.

## Evaluation notes (flywheel)

- Failure modes observed: None - comprehensive plan with code examples
- Graders run and results (PASS/FAIL): PASS - Constitution check passed, all layers designed, risks documented
- Prompt variant (if applicable): Standard /sp.plan with backend focus
- Next experiment (smallest change to try): Validate JWT secret sharing between Better Auth and FastAPI during implementation (environment variable naming)
