# Task: T005
# Hackathon Todo Backend - FastAPI

FastAPI backend service for the hackathon todo web application with JWT authentication and PostgreSQL storage.

## Tech Stack

- **FastAPI 0.109+**: Async web framework
- **SQLModel 0.0.14+**: Type-safe ORM (SQLAlchemy + Pydantic)
- **Neon PostgreSQL 15+**: Serverless PostgreSQL database
- **asyncpg 0.29+**: Async PostgreSQL driver
- **python-jose**: JWT token verification
- **Alembic 1.13+**: Database migrations
- **Python 3.13+**: Latest Python with type hints

## Quick Start

### Prerequisites

- Python 3.13+
- UV package manager ([installation](https://github.com/astral-sh/uv))
- Neon PostgreSQL database (free tier available at [neon.tech](https://neon.tech))
- Access to Better Auth secret from frontend (JWT signature verification)

### Installation

1. **Clone and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Install dependencies with UV**:
   ```bash
   uv sync
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values:
   # - DATABASE_URL: Your Neon PostgreSQL connection string
   # - BETTER_AUTH_SECRET: MUST match your Next.js frontend secret
   # - CORS_ORIGINS: Your frontend URL (e.g., http://localhost:3000)
   ```

4. **Run database migrations**:
   ```bash
   uv run alembic upgrade head
   ```

5. **Start development server**:
   ```bash
   uv run uvicorn src.main:app --reload --port 8000
   ```

6. **Verify server is running**:
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

## Project Structure

```
backend/
├── src/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Pydantic Settings (env vars)
│   ├── api/
│   │   ├── routers/         # API endpoints
│   │   │   └── tasks.py     # Task CRUD routes
│   │   └── middleware/
│   │       └── jwt_auth.py  # JWT validation
│   ├── services/
│   │   └── task_service.py  # Business logic
│   ├── models/
│   │   ├── user.py          # User SQLModel (Better Auth)
│   │   └── task.py          # Task SQLModel
│   ├── schemas/
│   │   ├── task.py          # Pydantic request/response
│   │   └── common.py        # Common schemas
│   ├── core/
│   │   └── exceptions.py    # Custom exceptions
│   └── db/
│       ├── session.py       # Async database session
│       └── migrations/      # Alembic migrations
├── tests/
│   ├── unit/                # Service layer tests (mocked)
│   ├── integration/         # API + DB tests
│   └── contract/            # Schema validation tests
├── pyproject.toml           # UV dependencies & config
└── .env.example             # Environment variable template
```

## API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Task Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{user_id}/tasks` | List all tasks (with filtering) |
| POST | `/api/{user_id}/tasks` | Create a new task |
| GET | `/api/{user_id}/tasks/{task_id}` | Get a specific task |
| PUT | `/api/{user_id}/tasks/{task_id}` | Update a task |
| DELETE | `/api/{user_id}/tasks/{task_id}` | Delete a task |
| PATCH | `/api/{user_id}/tasks/{task_id}/complete` | Toggle task completion |

**Query Parameters** (GET list):
- `status`: `all` (default), `pending`, `completed`
- `sort`: `created` (default), `title`

**User Isolation**: All endpoints verify that the `user_id` in the URL matches the JWT `sub` claim. Returns 403 if mismatch.

## Development

### Running Tests

```bash
# Run all tests
uv run pytest

# Run with coverage report
uv run pytest --cov=src --cov-report=term-missing

# Run specific test type
uv run pytest -m unit           # Unit tests only
uv run pytest -m integration    # Integration tests only
uv run pytest -m contract       # Contract tests only
```

**Coverage Requirement**: Minimum 80% (enforced by Phase 2 constitution)

### Code Quality

```bash
# Lint and format with ruff
uv run ruff check src tests
uv run ruff format src tests

# Type check with mypy
uv run mypy src

# Run all checks
uv run ruff check src tests && uv run mypy src && uv run pytest
```

### Database Migrations

```bash
# Create a new migration (after model changes)
uv run alembic revision --autogenerate -m "Description of changes"

# Review the generated migration in src/db/migrations/versions/

# Apply migrations
uv run alembic upgrade head

# Rollback last migration
uv run alembic downgrade -1

# View migration history
uv run alembic history
```

## Architecture

### Clean Layers (MANDATORY)

```
API Layer → Service Layer → Data Layer
```

- **API Layer** (`src/api/routers/`): HTTP concerns only, delegates to services
- **Service Layer** (`src/services/`): Business logic, isolated from HTTP
- **Data Layer** (`src/models/`): Database operations only

**RULE**: Never skip layers. API calls Service, Service calls Data.

### Async-Only Design

All database operations and endpoint handlers use `async def` and `await` for optimal performance with Neon's serverless PostgreSQL.

### JWT Authentication Flow

1. Client sends request with `Authorization: Bearer <jwt_token>`
2. JWT middleware validates token signature with `BETTER_AUTH_SECRET`
3. Middleware extracts `user_id` from JWT `sub` claim
4. Middleware adds `user_id` to `request.state.user_id`
5. Route handler verifies path `user_id` matches `request.state.user_id`
6. Service layer enforces user data isolation in queries

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string (asyncpg format) |
| `BETTER_AUTH_SECRET` | Yes | JWT secret (MUST match frontend, 32+ chars) |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |
| `ENVIRONMENT` | Yes | `development`, `staging`, or `production` |
| `DEBUG` | No | Enable SQL query logging (default: `false`) |

## Security

- **JWT Validation**: All endpoints require valid JWT from Better Auth
- **User Isolation**: Users can only access their own data (enforced at query level)
- **Input Validation**: Pydantic schemas validate all request data
- **SQL Injection Prevention**: SQLModel parameterized queries
- **Secrets Management**: All secrets in `.env` (never committed to git)

## Troubleshooting

### Database Connection Issues

**Problem**: `asyncpg.exceptions.InvalidPasswordError`
- **Solution**: Verify `DATABASE_URL` in `.env` matches your Neon credentials

**Problem**: `asyncpg.exceptions.TooManyConnectionsError`
- **Solution**: Check connection pool settings in `src/db/session.py` (default: pool_size=10, max_overflow=20)

### JWT Authentication Errors

**Problem**: `401 Unauthorized - Invalid or expired token`
- **Solution**: Verify `BETTER_AUTH_SECRET` matches your Next.js frontend exactly

**Problem**: `403 Forbidden - Access denied`
- **Solution**: Ensure the `user_id` in the URL matches the JWT `sub` claim

### Migration Issues

**Problem**: Alembic can't find models
- **Solution**: Ensure all models are imported in `src/db/migrations/env.py`

## Contributing

Follow Phase 2 Constitution requirements:
- ✅ Spec-Driven Development: No manual coding (use `/sp.implement`)
- ✅ Test-Driven: Write tests before/with implementation
- ✅ Type Safety: 100% type hints, `mypy --strict` passing
- ✅ Security First: JWT auth, user isolation, input validation
- ✅ Clean Architecture: Strict layer separation
- ✅ 80% Test Coverage: Enforced in CI

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com)
- [Neon Documentation](https://neon.tech/docs)
- [Alembic Documentation](https://alembic.sqlalchemy.org)
- [Pydantic Documentation](https://docs.pydantic.dev)
