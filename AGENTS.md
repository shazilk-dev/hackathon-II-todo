# AGENTS.md


## Repository layout (big picture)
This repo currently contains two “phases” of the todo app:
- Console todo app (Phase 1) at repo root: `main.py` + `tests/` + `pyproject.toml`.
- Full-stack web todo app (Phase 2):
  - `frontend/`: Next.js app (App Router) with authentication and UI.
  - `backend/`: FastAPI API with JWT validation and PostgreSQL persistence.
- Spec-driven artifacts live in `specs/` and session history in `history/`.
- Architecture constraints and quality gates are described in `.specify/memory/constitution.md`.

## Common commands

### Root (console todo app)
Dependencies / environment:
- `uv sync`

Run:
- `uv run python main.py`

Tests:
- `uv run pytest`
- Single test file: `uv run pytest tests/test_todo.py`
- Single test: `uv run pytest tests/test_todo.py::TestClassName::test_name` (or `...::test_name`)

Type checking:
- `uv run mypy --strict main.py`

### Backend (FastAPI)
From `backend/`:

Dependencies:
- `uv sync`

Run dev server:
- `uv run uvicorn src.main:app --reload --port 8000`

Migrations:
- Apply: `uv run alembic upgrade head`
- Create: `uv run alembic revision --autogenerate -m "describe change"`

Tests:
- `uv run pytest`
- Coverage: `uv run pytest --cov=src --cov-report=term-missing`
- Run a single test file: `uv run pytest tests/unit/test_something.py`
- Run a single test: `uv run pytest tests/unit/test_something.py::test_name`
- Run by marker (see `backend/pyproject.toml` markers):
  - `uv run pytest -m unit`
  - `uv run pytest -m integration`
  - `uv run pytest -m contract`

Lint / format / typecheck:
- `uv run ruff check src tests`
- `uv run ruff format src tests`
- `uv run mypy src`

Required environment variables (see `backend/.env.example` and `backend/src/config.py`):
- `DATABASE_URL` (must start with `postgresql+asyncpg://`)
- `BETTER_AUTH_SECRET` (used to validate the JWT signature)
- `CORS_ORIGINS`
- `ENVIRONMENT` and `DEBUG` (optional)

### Frontend (Next.js)
From `frontend/`:

Dependencies:
- `npm install`

Run:
- `npm run dev`

Build / start:
- `npm run build`
- `npm run start`

Lint / typecheck:
- `npm run lint`
- `npm run type-check`

Database setup (auth tables):
- `npx tsx scripts/migrate-db.ts` (documented in `STARTUP_GUIDE.md` / `frontend/AUTH_SETUP_GUIDE.md`)

Required environment variables (see `frontend/.env.local.example`, plus code in `frontend/lib/auth.ts`):
- `DATABASE_URL` (used by Drizzle adapter)
- `AUTH_SECRET` (required by `frontend/lib/auth.ts` and used to sign the backend JWT)
- `NEXT_PUBLIC_API_URL` (FastAPI base URL)
- `NEXT_PUBLIC_AUTH_URL` (base URL used when fetching `/api/auth/token`)

## Architecture overview

### Console app (Phase 1)
- Entry point: `main.py`.
- Core domain is in a single module:
  - `Task` dataclass with validation in `__post_init__`.
  - `TaskManager` provides in-memory CRUD and completion toggling.
  - CLI/menu handlers orchestrate user input/output.

### Full-stack web app (Phase 2)

#### Frontend
- Framework: Next.js (App Router) under `frontend/app/`.
- Authentication:
  - Server-side config: `frontend/lib/auth.ts` (NextAuth/Auth.js).
  - Client wrapper: `frontend/lib/auth-client.ts`.
  - `frontend/components/providers/AuthProvider.tsx` exposes `useAuth()` for session state.
  - Route protection: `frontend/middleware.ts` redirects unauthenticated users away from `/dashboard`.
- Backend API client:
  - `frontend/lib/api.ts` is the single place for talking to the FastAPI backend.
  - It first verifies there is a NextAuth session, then calls `GET /api/auth/token` to mint a JWT for the backend (`frontend/app/api/auth/token/route.ts`).
  - The minted token is cached in-memory (`cachedToken`) and sent to the backend via `Authorization: Bearer <token>`.
- UI:
  - Dashboard: `frontend/app/dashboard/page.tsx` renders `Header` + `TaskList`.
  - Tasks UI is primarily in `frontend/components/tasks/*`.

#### Backend
- Entry point: `backend/src/main.py`.
  - Adds CORS middleware.
  - Adds HTTP middleware `jwt_auth_middleware` (`backend/src/api/middleware/jwt_auth.py`).
  - Registers task router `backend/src/api/routers/tasks.py` under `/api/...`.
- Authentication / authorization:
  - `jwt_auth_middleware` validates a JWT and sets `request.state.user_id`.
  - Task endpoints call `verify_user_access()` to ensure the `user_id` path param matches the JWT `sub` claim (user isolation).
- Layering:
  - API layer: `backend/src/api/routers/*`
  - Service layer: `backend/src/services/*` (e.g., `TaskService` in `task_service.py`)
  - Data layer: `backend/src/models/*` (`Task` is a SQLModel table with `user_id` foreign key)
  - DB session factory: `backend/src/db/session.py` (`get_db` dependency)

#### End-to-end auth/token flow (frontend → backend)
1. User signs in via NextAuth.
2. Frontend mints a backend JWT via `GET frontend/app/api/auth/token/route.ts` (signed with `AUTH_SECRET`).
3. Frontend calls the backend with `Authorization: Bearer <jwt>`.
4. Backend validates the JWT using `BETTER_AUTH_SECRET` from `backend/.env` (these secrets must match for signature verification to succeed).

## Conventions and constraints worth knowing
- See `.specify/memory/constitution.md` for the “non-negotiables” (tech stack, layered separation, user isolation, coverage expectations).
- Many docs mention “Better Auth” and `BETTER_AUTH_SECRET`; the current frontend implementation uses NextAuth/Auth.js and requires `AUTH_SECRET` (used to sign the backend JWT). When debugging auth, confirm which env vars the code is actually reading.
- Specs and task artifacts live under `specs/` (e.g., referenced from `README.md` / `CLAUDE.md`).