# Implementation Plan: FastAPI Backend

**Branch**: `007-fastapi-backend` | **Date**: 2026-01-12 | **Spec**: Multiple (003, 004, 005, 006)

**Input**: Integration of four feature specifications:
- `specs/003-authentication/spec.md` (JWT authentication)
- `specs/004-database-schema/spec.md` (Neon PostgreSQL schema)
- `specs/005-api-endpoints/spec.md` (Task CRUD API)
- `specs/006-task-crud/spec.md` (Frontend requirements)

## Summary

Build an async FastAPI backend service that provides JWT-authenticated REST API endpoints for task management, integrates with Better Auth for authentication, and connects to Neon PostgreSQL via SQLModel with asyncpg. The backend enforces user data isolation through JWT middleware, implements clean architecture (API → Service → Data layers), and follows Phase 2 constitution requirements for type safety, security, and testability.

**Primary Technical Approach:**
- FastAPI async framework with Pydantic v2 validation
- SQLModel for ORM with async database operations
- Custom JWT middleware for authentication and user isolation
- Layered architecture: API routers → Service layer → Database models
- Neon PostgreSQL with connection pooling via asyncpg
- Alembic for database migrations
- pytest for unit, integration, and contract tests

## Technical Context

**Language/Version**: Python 3.13+
**Primary Dependencies**: FastAPI 0.109+, SQLModel 0.0.14+, asyncpg 0.29+, Pydantic v2, python-jose[cryptography] 3.3+, Alembic 1.13+
**Storage**: Neon Serverless PostgreSQL (PostgreSQL 15+)
**Testing**: pytest 8.0+, pytest-asyncio 0.23+, httpx 0.26+ (async test client)
**Target Platform**: Linux server (Docker container, cloud deployment)
**Project Type**: Web API backend
**Performance Goals**: <200ms p95 response time, 100 concurrent requests, <100ms database queries
**Constraints**: Async-only (no sync code), type hints on all functions (mypy --strict), 80% test coverage
**Scale/Scope**: MVP supports 1000 users, 100,000 tasks, single deployment region

## Constitution Check

**Phase 2 Constitution Compliance:**

✅ **Technology Stack** (Principle I):
- FastAPI (latest stable): ✅ Matches constitution backend framework requirement
- Python 3.13+: ✅ Matches constitution language requirement
- SQLModel: ✅ Matches constitution ORM requirement
- Neon PostgreSQL with asyncpg: ✅ Matches constitution database + driver requirement
- UV for dependency management: ✅ Matches constitution package management requirement

✅ **Architecture Constraints** (Principle II):
- Multi-tier: Backend separates API layer, Service layer, Data layer ✅
- Layered separation enforced: API → Service → Data (no skipping) ✅
- Async-first database operations via asyncpg ✅
- User isolation via user_id foreign keys ✅
- YAGNI: No premature abstraction (3-occurrence rule) ✅

✅ **Code Quality Standards** (Principle III):
- Type hints on ALL functions (mypy --strict) ✅
- Pydantic validation for ALL API inputs ✅
- Google-style docstrings on public methods ✅
- snake_case naming for functions/variables ✅

✅ **Testing Requirements** (Principle IV):
- pytest for all tests ✅
- 80% code coverage minimum ✅
- Test pyramid: 60% unit, 30% integration, 10% contract ✅
- Factory pattern for test data ✅

✅ **Spec-Driven Development** (Principle V):
- NO MANUAL CODING: Use only /sp.implement ✅
- Task IDs in file headers and commits ✅

✅ **Security Principles** (Principle VI):
- JWT validation on all endpoints (middleware) ✅
- User data isolation (queries filtered by user_id) ✅
- Pydantic validation prevents injection ✅
- Generic error messages (no sensitive data) ✅
- Secrets in .env only ✅

✅ **Clean Architecture** (Principle VII):
- API Layer: FastAPI routers (HTTP concerns only) ✅
- Service Layer: Business logic (isolated from HTTP) ✅
- Data Layer: SQLModel models (database only) ✅
- No layer skipping ✅

**Constitution Check: PASSED** ✅ - No violations, no complexity justification needed.

## Project Structure

### Documentation (this feature)

```text
specs/007-fastapi-backend/
├── plan.md              # This file
├── research.md          # Environment setup, dependency analysis
├── data-model.md        # SQLModel models, database schema
├── quickstart.md        # Local development setup
├── contracts/           # API contracts (Pydantic schemas)
│   ├── task_schemas.py.md    # Task request/response models
│   ├── auth_schemas.py.md    # Auth-related schemas
│   └── error_schemas.py.md   # Error response models
└── tasks.md             # Implementation tasks (created by /sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Settings (env vars, Pydantic BaseSettings)
│   │
│   ├── api/                    # API Layer (HTTP concerns)
│   │   ├── __init__.py
│   │   ├── deps.py             # Dependencies (get_db, get_current_user)
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   └── tasks.py        # Task CRUD endpoints
│   │   └── middleware/
│   │       ├── __init__.py
│   │       └── jwt_auth.py     # JWT validation middleware
│   │
│   ├── services/               # Service Layer (business logic)
│   │   ├── __init__.py
│   │   └── task_service.py     # Task CRUD business logic
│   │
│   ├── models/                 # Data Layer (database models)
│   │   ├── __init__.py
│   │   ├── base.py             # Base SQLModel class
│   │   ├── user.py             # User model (Better Auth compatibility)
│   │   └── task.py             # Task model
│   │
│   ├── schemas/                # Pydantic schemas (API contracts)
│   │   ├── __init__.py
│   │   ├── task.py             # TaskCreate, TaskUpdate, TaskResponse
│   │   └── common.py           # Common schemas (ErrorResponse, etc.)
│   │
│   ├── core/                   # Core utilities
│   │   ├── __init__.py
│   │   ├── security.py         # JWT encoding/decoding utilities
│   │   └── exceptions.py       # Custom exceptions
│   │
│   └── db/                     # Database setup
│       ├── __init__.py
│       ├── session.py          # Async session factory
│       └── migrations/         # Alembic migrations
│           ├── env.py
│           └── versions/
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # Pytest fixtures (test db, client, auth)
│   │
│   ├── unit/                   # Unit tests (60% of tests)
│   │   ├── __init__.py
│   │   ├── test_task_service.py    # Service layer tests
│   │   └── test_security.py        # JWT utilities tests
│   │
│   ├── integration/            # Integration tests (30% of tests)
│   │   ├── __init__.py
│   │   ├── test_task_api.py        # API + DB integration
│   │   └── test_auth_flow.py       # JWT middleware integration
│   │
│   └── contract/               # Contract tests (10% of tests)
│       ├── __init__.py
│       └── test_task_contracts.py  # Pydantic schema validation
│
├── alembic.ini                 # Alembic configuration
├── pyproject.toml              # UV project config (dependencies)
├── .env.example                # Example environment variables
└── README.md                   # Backend setup instructions
```

**Structure Decision**: Web application backend structure (Option 2 from template) with enhanced organization:
- **API Layer** (`api/routers/`, `api/middleware/`): Handles HTTP requests, delegates to services
- **Service Layer** (`services/`): Contains business logic, isolated from HTTP
- **Data Layer** (`models/`): SQLModel database models only
- **Schemas** (`schemas/`): Pydantic models for request/response validation
- **Core** (`core/`): Shared utilities (security, exceptions)
- **DB** (`db/`): Database connection and Alembic migrations

This structure enforces clean architecture and prevents layer violations.

## Complexity Tracking

**No Constitution Violations** - This section is empty as all requirements align with Phase 2 constitution.

---

## Phase 0: Research & Environment Setup

### Objective
Verify dependencies, understand Better Auth JWT structure, test Neon PostgreSQL connectivity, and validate async patterns.

### Research Tasks

1. **Better Auth JWT Structure Investigation**
   - **Goal**: Understand exact JWT payload structure from Better Auth
   - **Method**: Review Better Auth documentation, test JWT generation
   - **Output**: Document JWT claims (sub, email, exp, iat) and signature algorithm (HS256)
   - **Validate**: Ensure FastAPI can verify Better Auth JWTs with shared secret

2. **Neon PostgreSQL Async Connection**
   - **Goal**: Verify asyncpg works with Neon serverless PostgreSQL
   - **Method**: Test connection string format, connection pooling behavior
   - **Output**: Optimal connection pool settings (min_size=5, max_size=20)
   - **Validate**: Confirm async queries work (<100ms typical response time)

3. **SQLModel Async Support**
   - **Goal**: Confirm SQLModel supports async SQLAlchemy operations
   - **Method**: Review SQLModel docs, test async select/insert/update/delete
   - **Output**: Code patterns for async database operations
   - **Validate**: No sync-only operations in codebase (enforce async-only)

4. **FastAPI Middleware Best Practices**
   - **Goal**: Understand FastAPI middleware execution order and async handling
   - **Method**: Review FastAPI docs, test middleware with async dependencies
   - **Output**: JWT middleware implementation pattern
   - **Validate**: Middleware can extract user_id from JWT before route handlers

5. **Alembic + SQLModel Integration**
   - **Goal**: Verify Alembic can auto-generate migrations from SQLModel
   - **Method**: Test `alembic revision --autogenerate` with SQLModel models
   - **Output**: Migration workflow (model change → autogenerate → review → apply)
   - **Validate**: Migrations create correct PostgreSQL schema (match 004-database-schema spec)

6. **Environment Variable Management**
   - **Goal**: Clarify required secrets (BETTER_AUTH_SECRET vs JWT_SECRET_KEY)
   - **Method**: Review Better Auth and FastAPI JWT libraries
   - **Output**: Definitive list of environment variables:
     - `DATABASE_URL`: Neon PostgreSQL connection string
     - `BETTER_AUTH_SECRET`: Shared secret for JWT signature verification (32+ chars)
     - `CORS_ORIGINS`: Allowed frontend origins (comma-separated)
     - `ENVIRONMENT`: dev | staging | production
   - **Validate**: Both Better Auth (Next.js) and FastAPI use same `BETTER_AUTH_SECRET`

### Research Output (research.md)

Expected findings documented in `specs/007-fastapi-backend/research.md`:
- Better Auth JWT payload structure with example
- Neon connection string format and pool settings
- SQLModel async query patterns
- FastAPI middleware execution flow diagram
- Alembic migration workflow
- Environment variable requirements table

---

## Phase 1: Design & Architecture

### Data Model Design (data-model.md)

#### SQLModel Models

**Base Model** (`models/base.py`):
```python
from sqlmodel import SQLModel
from datetime import datetime

class TimestampMixin(SQLModel):
    """Mixin for created_at and updated_at timestamps."""
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
```

**User Model** (`models/user.py`):
```python
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    """
    User model compatible with Better Auth schema.
    Better Auth manages this table; FastAPI only reads from it.
    """
    __tablename__ = "users"

    id: str = Field(primary_key=True)  # TEXT (Better Auth UUIDs)
    email: str = Field(unique=True, index=True, nullable=False)
    name: str | None = None
    emailVerified: bool | None = Field(default=None, sa_column_kwargs={"name": "emailVerified"})
    image: str | None = None
    createdAt: datetime = Field(sa_column_kwargs={"name": "createdAt"})
    updatedAt: datetime = Field(sa_column_kwargs={"name": "updatedAt"})
```

**Task Model** (`models/task.py`):
```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class Task(TimestampMixin, table=True):
    """
    Task model for user todo items.
    Enforces user data isolation via user_id foreign key.
    """
    __tablename__ = "tasks"

    id: int | None = Field(default=None, primary_key=True)  # SERIAL
    user_id: str = Field(foreign_key="users.id", nullable=False, index=True)
    title: str = Field(max_length=200, nullable=False)
    description: str | None = None  # TEXT (no length limit)
    completed: bool = Field(default=False, nullable=False)

    # Relationships (optional, for convenience)
    # user: User = Relationship(back_populates="tasks")
```

#### Pydantic Schemas (API Contracts)

**Task Schemas** (`schemas/task.py`):
```python
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class TaskBase(BaseModel):
    """Shared properties for task creation and updates."""
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None

class TaskCreate(TaskBase):
    """Schema for POST /api/{user_id}/tasks"""
    pass

class TaskUpdate(BaseModel):
    """Schema for PUT /api/{user_id}/tasks/{id}"""
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None

    model_config = ConfigDict(extra="forbid")  # Reject extra fields

    def has_updates(self) -> bool:
        """Ensure at least one field is provided."""
        return self.title is not None or self.description is not None

class TaskResponse(TaskBase):
    """Schema for task responses (all endpoints return this)."""
    id: int
    user_id: str
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)  # Enable ORM mode

class TaskListResponse(BaseModel):
    """Schema for GET /api/{user_id}/tasks response."""
    tasks: list[TaskResponse]
    count: int
```

**Common Schemas** (`schemas/common.py`):
```python
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    """Standard error response structure."""
    error: str
    detail: str | None = None

class DeleteResponse(BaseModel):
    """Response for successful deletion."""
    message: str
```

### Service Layer Design

**Task Service** (`services/task_service.py`):
```python
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Literal

from models.task import Task
from schemas.task import TaskCreate, TaskUpdate
from core.exceptions import TaskNotFoundError

class TaskService:
    """
    Business logic for task CRUD operations.
    Enforces user data isolation by filtering all queries with user_id.
    """

    @staticmethod
    async def get_tasks(
        session: AsyncSession,
        user_id: str,
        status: Literal["all", "pending", "completed"] = "all",
        sort: Literal["created", "title"] = "created"
    ) -> list[Task]:
        """
        Retrieve all tasks for a user with optional filtering and sorting.

        Args:
            session: Async database session
            user_id: Authenticated user's ID (from JWT)
            status: Filter by completion status
            sort: Sort order (created_at desc or title asc)

        Returns:
            List of tasks matching filters
        """
        query = select(Task).where(Task.user_id == user_id)

        # Apply status filter
        if status == "pending":
            query = query.where(Task.completed == False)
        elif status == "completed":
            query = query.where(Task.completed == True)

        # Apply sorting
        if sort == "created":
            query = query.order_by(Task.created_at.desc())
        elif sort == "title":
            query = query.order_by(Task.title.asc())

        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create_task(
        session: AsyncSession,
        user_id: str,
        task_data: TaskCreate
    ) -> Task:
        """Create a new task for the authenticated user."""
        task = Task(
            user_id=user_id,
            title=task_data.title,
            description=task_data.description,
            completed=False
        )
        session.add(task)
        await session.commit()
        await session.refresh(task)
        return task

    @staticmethod
    async def get_task(
        session: AsyncSession,
        user_id: str,
        task_id: int
    ) -> Task:
        """
        Retrieve a specific task by ID.
        Returns 404 if task doesn't exist or doesn't belong to user.
        """
        result = await session.execute(
            select(Task).where(Task.id == task_id, Task.user_id == user_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            raise TaskNotFoundError(f"Task {task_id} not found")
        return task

    @staticmethod
    async def update_task(
        session: AsyncSession,
        user_id: str,
        task_id: int,
        task_data: TaskUpdate
    ) -> Task:
        """Update task title and/or description."""
        task = await TaskService.get_task(session, user_id, task_id)

        if task_data.title is not None:
            task.title = task_data.title
        if task_data.description is not None:
            task.description = task_data.description

        task.updated_at = datetime.utcnow()
        await session.commit()
        await session.refresh(task)
        return task

    @staticmethod
    async def delete_task(
        session: AsyncSession,
        user_id: str,
        task_id: int
    ) -> None:
        """Delete a task permanently."""
        task = await TaskService.get_task(session, user_id, task_id)
        await session.delete(task)
        await session.commit()

    @staticmethod
    async def toggle_completion(
        session: AsyncSession,
        user_id: str,
        task_id: int
    ) -> Task:
        """Toggle task completion status (true ↔ false)."""
        task = await TaskService.get_task(session, user_id, task_id)
        task.completed = not task.completed
        task.updated_at = datetime.utcnow()
        await session.commit()
        await session.refresh(task)
        return task
```

### API Layer Design

**JWT Middleware** (`api/middleware/jwt_auth.py`):
```python
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Callable

from config import settings

security = HTTPBearer(auto_error=False)

async def jwt_auth_middleware(request: Request, call_next: Callable):
    """
    Middleware to validate JWT on all requests.
    Extracts user_id from JWT and adds to request.state.

    Skips validation for:
    - /docs, /redoc, /openapi.json (API documentation)
    - /health (health check endpoint)
    """
    # Skip auth for documentation endpoints
    if request.url.path in ["/docs", "/redoc", "/openapi.json", "/health"]:
        return await call_next(request)

    # Extract JWT from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.split(" ")[1]

    try:
        # Decode and validate JWT
        payload = jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=["HS256"]
        )

        # Extract user_id from 'sub' claim
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )

        # Add user_id to request state for route handlers
        request.state.user_id = user_id

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    response = await call_next(request)
    return response
```

**Task Router** (`api/routers/tasks.py`):
```python
from fastapi import APIRouter, Depends, HTTPException, status, Request, Path, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Literal

from api.deps import get_db
from services.task_service import TaskService
from schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskListResponse
from schemas.common import DeleteResponse, ErrorResponse
from core.exceptions import TaskNotFoundError

router = APIRouter(prefix="/api/{user_id}/tasks", tags=["tasks"])

@router.get(
    "",
    response_model=TaskListResponse,
    summary="List user's tasks",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        403: {"model": ErrorResponse, "description": "User ID mismatch"},
    }
)
async def list_tasks(
    request: Request,
    user_id: str = Path(..., description="User ID from URL path"),
    status_filter: Literal["all", "pending", "completed"] = Query("all", alias="status"),
    sort: Literal["created", "title"] = Query("created"),
    db: AsyncSession = Depends(get_db)
) -> TaskListResponse:
    """
    Retrieve all tasks for the authenticated user with optional filtering and sorting.

    - **status**: Filter by completion status (all, pending, completed)
    - **sort**: Sort order (created = created_at desc, title = title asc)
    """
    # Verify user_id in path matches authenticated user from JWT
    if request.state.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch"
        )

    tasks = await TaskService.get_tasks(db, user_id, status_filter, sort)
    return TaskListResponse(tasks=tasks, count=len(tasks))

@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task"
)
async def create_task(
    request: Request,
    user_id: str = Path(...),
    task_data: TaskCreate = ...,
    db: AsyncSession = Depends(get_db)
) -> TaskResponse:
    """Create a new task for the authenticated user."""
    if request.state.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")

    task = await TaskService.create_task(db, user_id, task_data)
    return task

@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get a specific task"
)
async def get_task(
    request: Request,
    user_id: str = Path(...),
    task_id: int = Path(...),
    db: AsyncSession = Depends(get_db)
) -> TaskResponse:
    """Retrieve a specific task by ID."""
    if request.state.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")

    try:
        task = await TaskService.get_task(db, user_id, task_id)
        return task
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update a task"
)
async def update_task(
    request: Request,
    user_id: str = Path(...),
    task_id: int = Path(...),
    task_data: TaskUpdate = ...,
    db: AsyncSession = Depends(get_db)
) -> TaskResponse:
    """Update task title and/or description."""
    if request.state.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")

    if not task_data.has_updates():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field (title or description) must be provided"
        )

    try:
        task = await TaskService.update_task(db, user_id, task_id, task_data)
        return task
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete(
    "/{task_id}",
    response_model=DeleteResponse,
    summary="Delete a task"
)
async def delete_task(
    request: Request,
    user_id: str = Path(...),
    task_id: int = Path(...),
    db: AsyncSession = Depends(get_db)
) -> DeleteResponse:
    """Delete a task permanently."""
    if request.state.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")

    try:
        await TaskService.delete_task(db, user_id, task_id)
        return DeleteResponse(message="Task deleted")
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.patch(
    "/{task_id}/complete",
    response_model=TaskResponse,
    summary="Toggle task completion"
)
async def toggle_completion(
    request: Request,
    user_id: str = Path(...),
    task_id: int = Path(...),
    db: AsyncSession = Depends(get_db)
) -> TaskResponse:
    """Toggle task completion status (true ↔ false)."""
    if request.state.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")

    try:
        task = await TaskService.toggle_completion(db, user_id, task_id)
        return task
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
```

### Database Connection Design

**Async Session Factory** (`db/session.py`):
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from config import settings

# Create async engine with connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "dev",  # Log SQL in development
    pool_size=10,  # Min connections in pool
    max_overflow=20,  # Max connections beyond pool_size
    pool_pre_ping=True,  # Verify connections before use
)

# Async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncSession:
    """Dependency for FastAPI routes to get async database session."""
    async with AsyncSessionLocal() as session:
        yield session

async def init_db() -> None:
    """Initialize database (create tables). NOT USED - Alembic handles migrations."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
```

### Configuration Design

**Settings** (`config.py`):
```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Uses Pydantic BaseSettings for type validation and .env file support.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Environment
    ENVIRONMENT: Literal["dev", "staging", "production"] = "dev"

    # Database
    DATABASE_URL: str  # Required: Neon PostgreSQL connection string

    # Authentication
    BETTER_AUTH_SECRET: str  # Required: Shared secret for JWT validation (32+ chars)

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"  # Comma-separated frontend origins

    # API
    API_TITLE: str = "Todo API"
    API_VERSION: str = "1.0.0"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS comma-separated string into list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

settings = Settings()
```

### Main Application Design

**FastAPI App** (`main.py`):
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from api.routers import tasks
from api.middleware.jwt_auth import jwt_auth_middleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    # Startup: could initialize database pool (already done in session.py)
    yield
    # Shutdown: could close database connections (handled automatically)

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    lifespan=lifespan,
)

# CORS middleware (before JWT middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT authentication middleware (after CORS)
app.middleware("http")(jwt_auth_middleware)

# Include routers
app.include_router(tasks.router)

@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint (no auth required)."""
    return {"status": "ok", "environment": settings.ENVIRONMENT}
```

### Quickstart Guide (quickstart.md)

Local development setup instructions:

```markdown
# FastAPI Backend Quickstart

## Prerequisites
- Python 3.13+
- UV package manager
- Neon PostgreSQL database

## Setup

1. Clone repository and navigate to backend:
   ```bash
   cd backend
   ```

2. Install dependencies with UV:
   ```bash
   uv sync
   ```

3. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:pass@host/db
   BETTER_AUTH_SECRET=your-32-character-secret-here
   CORS_ORIGINS=http://localhost:3000
   ENVIRONMENT=dev
   ```

5. Run database migrations:
   ```bash
   uv run alembic upgrade head
   ```

6. Start development server:
   ```bash
   uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

7. Access API documentation:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Testing

Run all tests:
```bash
uv run pytest
```

Run with coverage:
```bash
uv run pytest --cov=src --cov-report=html
```

Run specific test types:
```bash
uv run pytest tests/unit/
uv run pytest tests/integration/
uv run pytest tests/contract/
```

## Type Checking

```bash
uv run mypy src --strict
```

## Database Migrations

Create new migration after model changes:
```bash
uv run alembic revision --autogenerate -m "Description"
```

Apply migrations:
```bash
uv run alembic upgrade head
```

Rollback last migration:
```bash
uv run alembic downgrade -1
```
```

---

## Dependencies

### Production Dependencies (pyproject.toml)

```toml
[project]
name = "todo-backend"
version = "1.0.0"
requires-python = ">=3.13"
dependencies = [
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "sqlmodel>=0.0.14",
    "asyncpg>=0.29.0",
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    "python-jose[cryptography]>=3.3.0",
    "alembic>=1.13.0",
    "python-multipart>=0.0.6",  # For form data if needed
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=4.1.0",
    "httpx>=0.26.0",  # Async test client
    "mypy>=1.8.0",
    "ruff>=0.1.0",
]
```

### Dependency Justification

- **FastAPI 0.109+**: Async web framework, OpenAPI generation, Pydantic v2 support
- **SQLModel 0.0.14+**: ORM combining SQLAlchemy + Pydantic, async support
- **asyncpg 0.29+**: Fast async PostgreSQL driver for Neon
- **python-jose[cryptography]**: JWT encoding/decoding with cryptographic signing
- **Alembic 1.13+**: Database migration tool (works with SQLModel/SQLAlchemy)
- **pydantic-settings**: Environment variable management with type validation
- **pytest-asyncio**: Async test support for pytest
- **httpx**: Async HTTP client for testing FastAPI endpoints

---

## Testing Strategy

### Test Pyramid Distribution

- **Unit Tests (60%)**: Test service layer functions in isolation (mock database)
- **Integration Tests (30%)**: Test API endpoints with real test database
- **Contract Tests (10%)**: Validate Pydantic schemas match API contracts

### Test Fixtures (conftest.py)

```python
import pytest
from sqlmodel import SQLModel, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from httpx import AsyncClient
from typing import AsyncGenerator

from src.main import app
from src.db.session import get_db
from src.config import settings

# Test database URL (separate from production)
TEST_DATABASE_URL = "postgresql+asyncpg://test_user:test_pass@localhost/test_db"

@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide async database session with rollback after test."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with AsyncSession(engine) as session:
        yield session
        await session.rollback()

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide async HTTP client for testing FastAPI endpoints."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(test_user_id: str = "test-user-123") -> dict[str, str]:
    """Generate valid JWT for testing (mock Better Auth token)."""
    from jose import jwt
    from datetime import datetime, timedelta

    payload = {
        "sub": test_user_id,
        "email": "test@example.com",
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.BETTER_AUTH_SECRET, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}
```

### Example Tests

**Unit Test** (`tests/unit/test_task_service.py`):
```python
import pytest
from unittest.mock import AsyncMock, MagicMock
from src.services.task_service import TaskService
from src.schemas.task import TaskCreate

@pytest.mark.asyncio
async def test_create_task():
    """Test task creation service logic."""
    # Mock database session
    mock_session = AsyncMock()

    # Test data
    user_id = "test-user-123"
    task_data = TaskCreate(title="Test task", description="Test description")

    # Call service
    task = await TaskService.create_task(mock_session, user_id, task_data)

    # Assertions
    assert task.title == "Test task"
    assert task.user_id == user_id
    assert task.completed == False
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()
```

**Integration Test** (`tests/integration/test_task_api.py`):
```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_task_endpoint(client: AsyncClient, auth_headers: dict):
    """Test POST /api/{user_id}/tasks endpoint."""
    user_id = "test-user-123"
    response = await client.post(
        f"/api/{user_id}/tasks",
        json={"title": "Buy groceries", "description": "Milk, eggs"},
        headers=auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Buy groceries"
    assert data["user_id"] == user_id
    assert data["completed"] == False
    assert "id" in data
    assert "created_at" in data
```

**Contract Test** (`tests/contract/test_task_contracts.py`):
```python
import pytest
from pydantic import ValidationError
from src.schemas.task import TaskCreate, TaskUpdate, TaskResponse

def test_task_create_schema():
    """Validate TaskCreate schema accepts valid input."""
    valid_data = {"title": "Test task", "description": "Test"}
    task = TaskCreate(**valid_data)
    assert task.title == "Test task"

def test_task_create_validation_title_required():
    """Validate TaskCreate rejects missing title."""
    with pytest.raises(ValidationError) as exc_info:
        TaskCreate(description="No title")

    assert "title" in str(exc_info.value)

def test_task_create_validation_title_max_length():
    """Validate TaskCreate rejects title > 200 chars."""
    with pytest.raises(ValidationError):
        TaskCreate(title="a" * 201)
```

---

## Performance Considerations

### Database Connection Pooling
- Pool size: 10 connections (min)
- Max overflow: 20 connections (total 30 max)
- Pre-ping: Verify connections before use (prevents stale connections)

### Query Optimization
- Indexes on `tasks.user_id` and `tasks.completed` (per database schema spec)
- Eager loading if relationships added (avoid N+1 queries)
- Use `select()` with filters instead of loading all then filtering in Python

### Response Time Targets
- Database queries: <100ms (p95)
- API endpoints: <200ms (p95)
- Concurrent requests: 100 without degradation

---

## Security Implementation

### JWT Validation
- **Algorithm**: HS256 (symmetric signing)
- **Secret**: `BETTER_AUTH_SECRET` (shared with Better Auth)
- **Claims**: Verify `sub` (user_id), `exp` (expiration)
- **Middleware**: Applied to all routes except `/docs`, `/redoc`, `/health`

### User Data Isolation
- **Enforcement**: All database queries filter by `user_id == authenticated_user_id`
- **Path Parameter Check**: Verify `user_id` in path matches JWT `sub` claim (403 if mismatch)
- **404 vs 403**: Return 404 if task doesn't exist OR doesn't belong to user (prevents information disclosure)

### Input Validation
- **Pydantic**: All request bodies validated with Pydantic models
- **SQL Injection**: Prevented by SQLModel parameterized queries
- **XSS**: Not applicable (API only, no HTML rendering)

### Error Handling
- **Generic Messages**: Don't leak sensitive info ("Task not found" vs "Task 123 belongs to user 456")
- **Status Codes**: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server error)

---

## Deployment Considerations

### Environment Variables (Production)
```env
DATABASE_URL=postgresql+asyncpg://prod_user:secure_pass@neon.tech/prod_db
BETTER_AUTH_SECRET=<32-character-cryptographically-random-secret>
CORS_ORIGINS=https://yourapp.com,https://www.yourapp.com
ENVIRONMENT=production
```

### Docker (Optional)
```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install uv && uv sync

COPY . .

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Health Checks
- Endpoint: `GET /health`
- Response: `{"status": "ok", "environment": "production"}`
- Use for container orchestration (Kubernetes liveness/readiness probes)

---

## Open Questions / Decisions Needed

1. **Environment Variable Naming** (HIGH PRIORITY):
   - Confirm Better Auth uses `BETTER_AUTH_SECRET` or `NEXTAUTH_SECRET`
   - Ensure FastAPI and Better Auth share the same secret
   - Document in both frontend and backend .env.example

2. **User Table Management**:
   - Better Auth manages `users` table schema
   - FastAPI should NOT run migrations on `users` table
   - How to handle schema drift if Better Auth updates?
   - **Decision**: FastAPI reads only, Better Auth owns schema

3. **Error Logging**:
   - Should errors be logged to external service (Sentry, Datadog)?
   - **Decision**: Use Python `logging` module, configure handler per environment

4. **Rate Limiting**:
   - Out of scope for MVP per specs
   - **Future**: Add `slowapi` or `fastapi-limiter` for production

5. **Database Migrations in Production**:
   - How to run migrations safely (blue-green deployment, downtime window)?
   - **Decision**: Document in deployment runbook (not code)

---

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| JWT secret mismatch (frontend ≠ backend) | Critical - all auth fails | Medium | Document shared secret in .env.example, integration test |
| SQLModel async query bugs | High - database errors | Low | Thorough unit tests, research phase validates patterns |
| Neon connection pool exhaustion | Medium - 503 errors | Low | Monitor pool metrics, tune pool_size/max_overflow |
| Better Auth schema changes break FastAPI | Medium - user queries fail | Low | Version lock Better Auth, test schema compatibility |
| Missing user_id filtering in query | Critical - data leak | Low | Code review, integration tests verify isolation |
| Slow database queries (>200ms) | Medium - poor UX | Medium | Add indexes (per schema spec), monitor query performance |
| Middleware ordering issues (CORS vs JWT) | Medium - CORS errors | Low | Document middleware order, test CORS in dev |

---

## Success Criteria

Before marking this plan complete, verify:

- [ ] Constitution check passed (all requirements align)
- [ ] Project structure documented with file paths
- [ ] SQLModel models designed (User, Task) with relationships
- [ ] Pydantic schemas designed (request/response contracts)
- [ ] Service layer designed with business logic isolation
- [ ] API layer designed with routers and middleware
- [ ] JWT middleware design validates tokens and extracts user_id
- [ ] Database session factory supports async operations
- [ ] Testing strategy defined (unit, integration, contract)
- [ ] Dependencies listed in pyproject.toml
- [ ] Quickstart guide provides local setup instructions
- [ ] Open questions documented for resolution
- [ ] Risks identified with mitigations

---

## Next Steps

After this plan is approved:

1. Run `/sp.tasks` to generate implementation tasks from this plan
2. Run `/sp.implement` to execute tasks (NO MANUAL CODING)
3. Create ADRs for architectural decisions:
   - ADR-001: JWT vs Session-Based Authentication (chose JWT for stateless scaling)
   - ADR-002: SQLModel vs SQLAlchemy Core (chose SQLModel for type safety)
   - ADR-003: Async-Only Design (chose async for Neon serverless optimization)

📋 **Architectural decision detected**: JWT authentication strategy (stateless vs session-based)
   Document reasoning and tradeoffs? Run `/sp.adr jwt-authentication-strategy`

📋 **Architectural decision detected**: SQLModel for ORM (vs SQLAlchemy Core, Tortoise ORM)
   Document reasoning and tradeoffs? Run `/sp.adr sqlmodel-orm-selection`
