# Hackathon Todo Backend - FastAPI

Enterprise-grade FastAPI backend service with JWT authentication, async PostgreSQL, and clean architecture for the Hackathon II Todo application.

## Overview

This is the server-side API for the Todo application, built with modern Python technologies and following industry best practices. The backend supports traditional RESTful task management (Phase 2), AI-powered chatbot integration (Phase 3), and is containerized for Kubernetes deployment (Phases 4-5).

## Technology Stack

- **Framework**: FastAPI 0.109+ (Async web framework)
- **ORM**: SQLModel 0.0.14+ (Type-safe SQLAlchemy + Pydantic)
- **Database**: Neon PostgreSQL 15+ (Serverless PostgreSQL)
- **Database Driver**: asyncpg 0.29+ (Async PostgreSQL driver)
- **Authentication**: python-jose (JWT token verification)
- **Migrations**: Alembic 1.13+ (Database schema migrations)
- **Language**: Python 3.13+ (Latest with type hints)
- **Package Manager**: UV (Fast Python package installer)
- **Testing**: pytest with pytest-asyncio and pytest-cov
- **Code Quality**: Ruff (linting and formatting), mypy (type checking)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                        │
├─────────────────────────────────────────────────────────────┤
│  HTTP Middleware                                            │
│  ├── CORS Middleware (origin validation)                   │
│  └── JWT Authentication Middleware                         │
├─────────────────────────────────────────────────────────────┤
│  API Layer (src/api/routers/)                               │
│  ├── tasks.py (RESTful CRUD endpoints)                     │
│  ├── chat.py (AI chatbot endpoint - Phase 3)              │
│  └── health.py (Health check endpoint)                     │
├─────────────────────────────────────────────────────────────┤
│  Service Layer (src/services/)                              │
│  ├── task_service.py (Business logic)                      │
│  └── chat_service.py (AI agent orchestration - Phase 3)   │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (src/models/)                                   │
│  ├── user.py (User SQLModel)                               │
│  ├── task.py (Task SQLModel)                               │
│  └── conversation.py (Chat history - Phase 3)             │
├─────────────────────────────────────────────────────────────┤
│  Database (src/db/)                                         │
│  ├── session.py (Async connection pool)                    │
│  └── migrations/ (Alembic versioning)                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌──────────────────────┐
              │  Neon PostgreSQL     │
              │  (Serverless)        │
              └──────────────────────┘
```

## Prerequisites

**Required**:

- Python 3.13+ or Python 3.12+
- UV package manager ([installation](https://github.com/astral-sh/uv))
- Neon PostgreSQL database (free tier: [neon.tech](https://neon.tech))
- Frontend authentication secret (for JWT validation)

**Optional** (Phase 3+):

- OpenAI API key (for AI chatbot features)

---

## Installation

### 1. Clone and Navigate

```bash
cd backend
```

### 2. Install UV Package Manager

If not already installed:

**macOS/Linux**:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 3. Install Dependencies

```bash
uv sync
```

This creates a virtual environment and installs all dependencies specified in `pyproject.toml`.

### 4. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```bash
# Database Configuration
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/database

# Authentication (MUST match frontend AUTH_SECRET)
AUTH_SECRET=<32-character-secret-matching-frontend>

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Application Settings
ENVIRONMENT=development
DEBUG=true

# OpenAI (Phase 3+ only)
OPENAI_API_KEY=sk-...

# Server Configuration (optional)
HOST=0.0.0.0
PORT=8000
```

**CRITICAL**: The `AUTH_SECRET` must be identical to the frontend `AUTH_SECRET` for JWT signature verification to succeed.

**Generate Neon PostgreSQL URL**:

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy connection string
4. Replace `postgresql://` with `postgresql+asyncpg://` for async support

### 5. Run Database Migrations

```bash
uv run alembic upgrade head
```

This creates all required tables:

- `user` - User accounts
- `task` - Tasks with user foreign key
- `conversation` - Chat history (Phase 3)

### 6. Start Development Server

```bash
uv run uvicorn src.main:app --reload --port 8000
```

**Verify Server is Running**:

- API Documentation: `http://localhost:8000/docs` (Swagger UI)
- Alternative Docs: `http://localhost:8000/redoc` (ReDoc)
- Health Check: `http://localhost:8000/health`

---

## Project Structure

```
backend/
├── src/
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Pydantic Settings (env vars)
│   ├── api/
│   │   ├── routers/             # API endpoint definitions
│   │   │   ├── tasks.py        # Task CRUD endpoints
│   │   │   ├── chat.py         # AI chatbot endpoint (Phase 3)
│   │   │   └── health.py       # Health check endpoint
│   │   └── middleware/
│   │       └── jwt_auth.py     # JWT authentication middleware
│   ├── services/                # Business logic layer
│   │   ├── task_service.py     # Task operations
│   │   └── chat_service.py     # AI agent service (Phase 3)
│   ├── models/                  # SQLModel table definitions
│   │   ├── user.py             # User model (NextAuth compatible)
│   │   ├── task.py             # Task model
│   │   └── conversation.py     # Conversation model (Phase 3)
│   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── task.py             # Task schemas
│   │   ├── chat.py             # Chat schemas (Phase 3)
│   │   └── common.py           # Shared schemas
│   ├── core/
│   │   ├── exceptions.py       # Custom exception classes
│   │   └── security.py         # JWT utilities
│   └── db/
│       ├── session.py          # Async database session factory
│       └── migrations/          # Alembic migration scripts
│           ├── env.py          # Alembic environment
│           └── versions/        # Versioned migration files
├── tests/                       # Test suite
│   ├── conftest.py             # Pytest fixtures
│   ├── unit/                   # Service layer tests (mocked)
│   │   └── test_task_service.py
│   ├── integration/             # API + DB tests (real database)
│   │   └── test_tasks_api.py
│   └── contract/                # Schema validation tests
│       └── test_task_schemas.py
├── alembic.ini                  # Alembic configuration
├── Dockerfile                   # Phase 4: Multi-stage Docker build
├── docker-start.sh              # Phase 4: Container entrypoint
├── pyproject.toml               # UV dependencies and metadata
├── .env.example                 # Environment variable template
└── README.md                    # This file
```

---

## API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header (except `/health`).

### Health Check

| Method | Endpoint  | Description          | Auth Required |
| ------ | --------- | -------------------- | ------------- |
| GET    | `/health` | Server health status | No            |

### Task Management (Phase 2)

| Method | Endpoint                                  | Description                      | Auth Required |
| ------ | ----------------------------------------- | -------------------------------- | ------------- |
| GET    | `/api/{user_id}/tasks`                    | List all tasks with filtering    | Yes           |
| POST   | `/api/{user_id}/tasks`                    | Create a new task                | Yes           |
| GET    | `/api/{user_id}/tasks/{task_id}`          | Get specific task details        | Yes           |
| PUT    | `/api/{user_id}/tasks/{task_id}`          | Update task (title, description) | Yes           |
| DELETE | `/api/{user_id}/tasks/{task_id}`          | Delete a task                    | Yes           |
| PATCH  | `/api/{user_id}/tasks/{task_id}/complete` | Toggle task completion status    | Yes           |

**Query Parameters** (GET list):

- `status` (optional): Filter by status
  - `all` (default) - All tasks
  - `pending` - Incomplete tasks only
  - `completed` - Completed tasks only
- `sort` (optional): Sort order
  - `created` (default) - Sort by creation date
  - `title` - Sort alphabetically

**User Isolation**: All endpoints automatically enforce that the `user_id` in the path matches the authenticated user's ID from the JWT token. Returns `403 Forbidden` if mismatch detected.

### AI Chatbot (Phase 3)

| Method | Endpoint              | Description                | Auth Required |
| ------ | --------------------- | -------------------------- | ------------- |
| POST   | `/api/{user_id}/chat` | Send message to AI chatbot | Yes           |

**Request Body**:

```json
{
  "message": "Add a task to buy groceries"
}
```

---

## Development

### Running the Server

**Development mode** (with hot reload):

```bash
uv run uvicorn src.main:app --reload --port 8000
```

**Production mode**:

```bash
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Running Tests

```bash
# Run all tests
uv run pytest

# Run with coverage report
uv run pytest --cov=src --cov-report=term-missing

# Run specific test type (using markers)
uv run pytest -m unit           # Unit tests only
uv run pytest -m integration    # Integration tests only
uv run pytest -m contract       # Contract tests only

# Run single test file
uv run pytest tests/unit/test_task_service.py

# Run single test function
uv run pytest tests/unit/test_task_service.py::test_create_task

# Run tests with verbose output
uv run pytest -v

# Run tests and stop on first failure
uv run pytest -x
```

**Coverage Requirements**:

- Minimum: 80% (enforced by CI)
- Target: 90%+
- Service layer: 100% coverage (business logic critical)

### Code Quality

**Linting and Formatting** (Ruff):

```bash
# Check for issues
uv run ruff check src tests

# Auto-fix issues
uv run ruff check --fix src tests

# Format code
uv run ruff format src tests
```

**Type Checking** (mypy):

```bash
# Type check all source code
uv run mypy src

# Type check with verbose output
uv run mypy src --verbose

# Type check specific file
uv run mypy src/services/task_service.py
```

**Run All Quality Checks**:

```bash
# Complete validation pipeline
uv run ruff check src tests && \
uv run ruff format --check src tests && \
uv run mypy src && \
uv run pytest --cov=src --cov-report=term-missing
```

### Database Migrations

**Create a new migration** (after model changes):

```bash
uv run alembic revision --autogenerate -m "Description of changes"
```

**Review the generated migration**:

- Check `src/db/migrations/versions/<revision>.py`
- Verify `upgrade()` and `downgrade()` functions
- Test migration on development database

**Apply migrations**:

```bash
# Upgrade to latest version
uv run alembic upgrade head

# Upgrade by one version
uv run alembic upgrade +1

# Downgrade by one version
uv run alembic downgrade -1

# Downgrade to specific revision
uv run alembic downgrade <revision>
```

**View migration history**:

```bash
# Show all migrations
uv run alembic history

# Show current version
uv run alembic current

# Show pending migrations
uv run alembic heads
```

---

## Architecture

### Clean Layered Design (Mandatory)

The backend strictly follows a three-layer architecture:

```
┌──────────────────────────────────────┐
│          API Layer                   │  HTTP concerns only
│  (src/api/routers/)                 │  Request/response handling
│  - Parse request                     │  Input validation
│  - Call service                      │  Delegates to Service
│  - Return response                   │  No business logic
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│        Service Layer                 │  Business logic only
│  (src/services/)                     │  Pure Python functions
│  - Validate business rules           │  No HTTP concerns
│  - Orchestrate operations            │  Calls Data Layer
│  - Return domain objects             │  No SQL queries
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│          Data Layer                  │  Database operations only
│  (src/models/)                       │  SQLModel table definitions
│  - CRUD operations                   │  No business logic
│  - Query execution                   │  No HTTP concerns
│  - Data persistence                  │  Returns models
└──────────────────────────────────────┘
```

**Rules**:

1. **No layer skipping**: API → Service → Data (never API → Data)
2. **Dependency direction**: Outer layers depend on inner layers
3. **Pure business logic**: Service layer is HTTP and DB agnostic
4. **Single responsibility**: Each layer has one concern

### Async-First Design

All database operations and API handlers use `async def` and `await`:

```python
# Async endpoint
@router.get("/tasks")
async def list_tasks(
    user_id: str,
    db: AsyncSession = Depends(get_db)
) -> list[TaskResponse]:
    tasks = await task_service.get_tasks(db, user_id)
    return tasks

# Async service
async def get_tasks(
    db: AsyncSession,
    user_id: str
) -> list[Task]:
    result = await db.execute(
        select(Task).where(Task.user_id == user_id)
    )
    return result.scalars().all()
```

**Benefits**:

- Non-blocking I/O for better concurrency
- Optimal performance with Neon serverless PostgreSQL
- Efficient connection pool utilization

### JWT Authentication Flow

1. **Client Request**: Frontend sends request with `Authorization: Bearer <jwt_token>`
2. **Middleware Validation**:
   - Extract JWT from Authorization header
   - Verify signature using `AUTH_SECRET`
   - Decode payload and extract `user_id` from `sub` claim
   - Add `user_id` to `request.state.user_id`
3. **Endpoint Authorization**:
   - Compare path `user_id` parameter with `request.state.user_id`
   - Return `403 Forbidden` if mismatch (user isolation)
4. **Service Execution**: Service layer operates on authorized user data only

### User Data Isolation

**Database-level enforcement**:

```python
# All queries filter by user_id
async def get_tasks(db: AsyncSession, user_id: str) -> list[Task]:
    result = await db.execute(
        select(Task)
        .where(Task.user_id == user_id)  # User isolation
        .order_by(Task.created_at.desc())
    )
    return result.scalars().all()
```

**API-level verification**:

```python
# Endpoint checks user_id matches JWT claim
@router.get("/{user_id}/tasks")
async def list_tasks(
    user_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> list[TaskResponse]:
    verify_user_access(request, user_id)  # Raises 403 if mismatch
    tasks = await task_service.get_tasks(db, user_id)
    return tasks
```

---

## Environment Variables Reference

| Variable         | Required    | Description                                          | Example                                       |
| ---------------- | ----------- | ---------------------------------------------------- | --------------------------------------------- |
| `DATABASE_URL`   | Yes         | Neon PostgreSQL connection string (asyncpg format)   | `postgresql+asyncpg://user:pass@host/db`      |
| `AUTH_SECRET`    | Yes         | JWT secret key (32+ characters, must match frontend) | Generated with `openssl rand -base64 32`      |
| `CORS_ORIGINS`   | Yes         | Comma-separated allowed origins                      | `http://localhost:3000,http://localhost:3001` |
| `ENVIRONMENT`    | Yes         | Application environment                              | `development` \| `staging` \| `production`    |
| `DEBUG`          | No          | Enable debug logging (default: `false`)              | `true` \| `false`                             |
| `OPENAI_API_KEY` | Conditional | OpenAI API key (required for Phase 3)                | `sk-...`                                      |
| `HOST`           | No          | Server bind address (default: `0.0.0.0`)             | `0.0.0.0` \| `127.0.0.1`                      |
| `PORT`           | No          | Server port (default: `8000`)                        | `8000`                                        |

---

## Security

### Authentication & Authorization

- **JWT Validation**: All endpoints (except `/health`) require valid JWT
- **Signature Verification**: Tokens validated with `AUTH_SECRET`
- **User Isolation**: Users can only access their own data (enforced at query level)
- **Token Expiration**: Configurable expiration (default: 1 hour)

### Input Validation

- **Pydantic Schemas**: All request data validated via Pydantic models
- **Field Constraints**: Length limits, regex patterns, enum values
- **Type Coercion**: Automatic type validation and coercion

Example:

```python
class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(None, max_length=1000)
```

### SQL Injection Prevention

- **Parameterized Queries**: SQLModel uses SQLAlchemy Core (always parameterized)
- **ORM Protection**: No raw SQL execution in application code
- **Type Safety**: Python type hints prevent injection vectors

### Secrets Management

- **Environment Variables**: All secrets in `.env` (never committed)
- **Kubernetes Secrets**: Production secrets in K8s Secret objects (Phase 4-5)
- **Secret Rotation**: Support for zero-downtime secret updates

### CORS Configuration

- **Whitelist Only**: Explicit origin validation (no `*` wildcards in production)
- **Credentials Allowed**: Supports cookies and Authorization headers
- **Method Restrictions**: Only required HTTP methods allowed

---

## Troubleshooting

### Common Issues

**Issue: `asyncpg.exceptions.InvalidPasswordError`**

- **Cause**: Incorrect database credentials
- **Solution**:

  ```bash
  # Verify DATABASE_URL format
  postgresql+asyncpg://username:password@host:port/database

  # Test connection
  psql "$DATABASE_URL"
  ```

**Issue: `401 Unauthorized - Invalid or expired token`**

- **Cause**: `AUTH_SECRET` mismatch between frontend and backend
- **Solution**: Verify both `.env` files use identical secrets

**Issue: `403 Forbidden - Access denied`**

- **Cause**: `user_id` in path doesn't match JWT `sub` claim
- **Solution**: Ensure frontend sends correct user_id in API calls

**Issue: `asyncpg.exceptions.TooManyConnectionsError`**

- **Cause**: Database connection pool exhausted
- **Solution**: Adjust pool settings in `src/db/session.py`:
  ```python
  engine = create_async_engine(
      DATABASE_URL,
      pool_size=10,        # Increase if needed
      max_overflow=20,     # Increase if needed
      pool_timeout=30
  )
  ```

**Issue: Alembic can't find models**

- **Cause**: Models not imported in `src/db/migrations/env.py`
- **Solution**: Add import statement:
  ```python
  from src.models.user import User
  from src.models.task import Task
  ```

**Issue: Tests failing with database errors**

- **Cause**: Test database not configured or migrations not applied
- **Solution**:
  ```bash
  # Use separate test database
  export DATABASE_URL=postgresql+asyncpg://user:pass@host/test_db
  uv run alembic upgrade head
  uv run pytest
  ```

---

## Performance Optimization

### Database Query Optimization

**Use Indexes**:

```python
class Task(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(index=True, foreign_key="user.id")  # Indexed
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
```

**Eager Loading** (avoid N+1 queries):

```python
# Load related data in single query
result = await db.execute(
    select(Task)
    .options(selectinload(Task.user))
    .where(Task.user_id == user_id)
)
```

**Connection Pooling**:

- Default: pool_size=10, max_overflow=20
- Tune based on load: `engine = create_async_engine(url, pool_size=20)`

### API Response Optimization

**Pagination**:

```python
@router.get("/tasks")
async def list_tasks(
    skip: int = 0,
    limit: int = 100
) -> list[TaskResponse]:
    # Limit results for large datasets
    tasks = await task_service.get_tasks(db, user_id, skip=skip, limit=limit)
    return tasks
```

**Response Compression**:

```python
# Add GZipMiddleware in main.py
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### Monitoring

**Health Check Endpoint**:

```python
@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    # Verify database connectivity
    await db.execute(text("SELECT 1"))
    return {"status": "healthy", "timestamp": datetime.utcnow()}
```

**Logging**:

```python
import logging
logger = logging.getLogger(__name__)

@router.post("/tasks")
async def create_task(...):
    logger.info(f"Creating task for user {user_id}")
    # ...
```

---

## Deployment

### Docker Container (Phase 4)

Build and run:

```bash
# Build image
docker build -t todo-backend .

# Run container
docker run -p 8000:8000 --env-file .env todo-backend
```

### Kubernetes (Phase 4-5)

Deploy using Helm:

```bash
# Phase 4: Local (Minikube)
helm install todo-chatbot ./helm/todo-chatbot -n todo-chatbot

# Phase 5: Cloud (Azure AKS)
./scripts/deploy.sh latest
```

Manifests located in:

- `k8s/base/backend-deployment.yaml`
- `k8s/base/backend-service.yaml`
- `k8s/base/backend-hpa.yaml`

---

## Contributing

### Development Workflow

1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Run quality checks:
   - | GET | `/api/{user_id}/tasks` | List all tasks (with filtering) |
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

| Variable             | Required | Description                                        |
| -------------------- | -------- | -------------------------------------------------- |
| `DATABASE_URL`       | Yes      | Neon PostgreSQL connection string (asyncpg format) |
| `BETTER_AUTH_SECRET` | Yes      | JWT secret (MUST match frontend, 32+ chars)        |
| `CORS_ORIGINS`       | Yes      | Comma-separated allowed origins                    |
| `ENVIRONMENT`        | Yes      | `development`, `staging`, or `production`          |
| `DEBUG`              | No       | Enable SQL query logging (default: `false`)        |

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

### Development Workflow

1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Run quality checks:
   ```bash
   uv run ruff check --fix src tests
   uv run ruff format src tests
   uv run mypy src
   uv run pytest --cov=src
   ```
5. Commit and push
6. Create pull request

### Code Review Checklist

- [ ] All tests passing (unit, integration, contract)
- [ ] 80%+ test coverage
- [ ] Type hints on all functions
- [ ] mypy strict mode passing
- [ ] Ruff linting passing
- [ ] Clean architecture followed (no layer skipping)
- [ ] User isolation enforced
- [ ] Error handling implemented
- [ ] Docstrings for complex functions

---

## Additional Resources

### Documentation

**Project Docs**:

- [Frontend README](../frontend/README.md) - Next.js frontend setup
- [Main README](../README.md) - Complete project overview
- [Phase 3 Guide](../guides/PHASE3_MASTER_GUIDE.md) - AI chatbot implementation

**External Docs**:

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com)
- [Neon Documentation](https://neon.tech/docs)
- [Alembic Documentation](https://alembic.sqlalchemy.org)
- [Pydantic Documentation](https://docs.pydantic.dev)

### Test Markers

Defined in `pyproject.toml`:

```toml
[tool.pytest.ini_options]
markers = [
    "unit: Unit tests (service layer, mocked dependencies)",
    "integration: Integration tests (API + real database)",
    "contract: Contract tests (schema validation)"
]
```

Usage:

```bash
uv run pytest -m unit          # Run only unit tests
uv run pytest -m integration   # Run only integration tests
uv run pytest -m "not integration"  # Skip integration tests
```

---

## Phase 3: AI Chatbot Integration

The backend includes AI-powered task management via OpenAI Agents SDK and MCP (Model Context Protocol).

### MCP Server

**Five MCP Tools**:

1. `add_task(user_id, title, description)` - Create tasks
2. `list_tasks(user_id, status)` - Query tasks
3. `complete_task(user_id, task_id)` - Mark complete
4. `delete_task(user_id, task_id)` - Remove tasks
5. `update_task(user_id, task_id, title, description)` - Modify tasks

### Chat Endpoint

```python
POST /api/{user_id}/chat
Content-Type: application/json
Authorization: Bearer <jwt>

{
  "message": "Add a task to buy groceries"
}
```

Response:

```json
{
  "response": "I've added 'Buy groceries' to your task list.",
  "conversation_id": "uuid",
  "timestamp": "2026-02-09T12:00:00Z"
}
```

### Configuration

Add to `.env`:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
```

---

## License

This project was created as part of Hackathon II following Spec-Driven Development (SDD) principles.

---

## Support

For issues or questions:

- Review [CLAUDE.md](./CLAUDE.md) for detailed development guidelines
- Check [Frontend README](../frontend/README.md) for client integration
- Consult [Main README](../README.md) for overall project context
- Refer to [Phase-specific guides](../guides/) for detailed workflows

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: Production Ready
