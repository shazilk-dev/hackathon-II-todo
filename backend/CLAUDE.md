# Backend Guidelines - FastAPI

## Stack
- FastAPI 0.109+
- SQLModel 0.0.14+ (ORM)
- Neon PostgreSQL (async with asyncpg)
- python-jose for JWT verification
- Alembic for migrations
- Python 3.13+

## Project Structure
```
src/
├── main.py              # FastAPI app, lifespan, middleware
├── config.py            # Pydantic Settings from environment
├── db/
│   └── session.py       # Async engine, session factory
├── models/
│   ├── user.py          # User SQLModel (Better Auth compatible)
│   └── task.py          # Task SQLModel
├── schemas/
│   └── task.py          # Pydantic request/response schemas
├── api/
│   ├── routers/
│   │   └── tasks.py     # API route handlers
│   └── middleware/
│       └── jwt_auth.py  # JWT verification
└── services/
    └── task_service.py  # Business logic layer
```

## Architecture - Clean Layers (MANDATORY)
```
API Layer → Service Layer → Data Layer
```

- **API Layer**: HTTP concerns only, delegates to services
- **Service Layer**: Business logic, no HTTP dependencies
- **Data Layer**: Database operations only

**RULE**: Never skip layers. API calls Service, Service calls Data.

## Conventions
- All routes under `/api/`
- **Async-only**: All endpoints and DB operations use `async def`
- **Type hints everywhere**: No untyped functions
- Dependency injection for DB sessions
- HTTPException for errors with proper status codes
- User isolation: Always verify `user_id` matches JWT

## JWT Authentication

### Middleware Pattern
```python
# src/api/middleware/jwt_auth.py
from fastapi import Request, HTTPException
from jose import jwt, JWTError
import os

async def jwt_auth_middleware(request: Request, call_next):
    # Skip auth for health/docs
    if request.url.path in ["/health", "/docs", "/openapi.json"]:
        return await call_next(request)

    # Extract Bearer token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid token")

    token = auth_header.split(" ")[1]

    # Verify JWT
    try:
        payload = jwt.decode(
            token,
            os.getenv("BETTER_AUTH_SECRET"),
            algorithms=["HS256"]
        )
        request.state.user_id = payload.get("sub")
        request.state.user_email = payload.get("email")
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

    return await call_next(request)
```

## Route Template

```python
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.session import get_session
from src.services.task_service import TaskService
from src.schemas.task import TaskCreate, TaskResponse

router = APIRouter(prefix="/api", tags=["tasks"])

@router.get("/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """Get all tasks for user with optional filtering."""
    # CRITICAL: Verify user_id matches JWT
    if request.state.user_id != user_id:
        raise HTTPException(403, "Access denied")

    # Delegate to service layer
    tasks = await TaskService.get_tasks(session, user_id)
    return {"tasks": tasks, "count": len(tasks)}

@router.post(
    "/{user_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_task(
    user_id: str,
    task_data: TaskCreate,
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """Create new task for authenticated user."""
    # User isolation check
    if request.state.user_id != user_id:
        raise HTTPException(403, "Cannot create tasks for other users")

    # Delegate to service
    task = await TaskService.create_task(session, user_id, task_data)
    return task
```

## Database Session Management

```python
# src/db/session.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.config import settings

# Async engine with connection pooling
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True  # Neon serverless compatibility
)

# Async session factory
async_session_maker = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Dependency for route injection
async def get_session() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

## SQLModel Patterns

### Model Definition
```python
# src/models/task.py
from sqlmodel import SQLModel, Field
from datetime import datetime

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=200)
    description: str | None = None
    completed: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### Query Patterns
```python
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

# Select with filter
async def get_user_tasks(session: AsyncSession, user_id: str) -> list[Task]:
    statement = select(Task).where(
        Task.user_id == user_id
    ).order_by(Task.created_at.desc())

    result = await session.execute(statement)
    return result.scalars().all()

# Insert
async def create_task(session: AsyncSession, task: Task) -> Task:
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task

# Update
async def update_task(session: AsyncSession, task: Task) -> Task:
    task.updated_at = datetime.utcnow()
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task
```

## Pydantic Schemas

```python
# src/schemas/task.py
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    completed: bool | None = None

class TaskResponse(BaseModel):
    id: int
    user_id: str
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

## Environment Variables

```bash
# .env
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
BETTER_AUTH_SECRET=your-secret-min-32-chars  # MUST match frontend
ENVIRONMENT=development
DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000
```

```python
# src/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    better_auth_secret: str
    environment: str = "development"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env"}

settings = Settings()
```

## Testing Strategy

### Test Pyramid (80% Total Coverage)
- **60% Unit Tests**: Service layer with mocked DB
- **30% Integration Tests**: API endpoints with test DB
- **10% Contract Tests**: Pydantic validation

### Fixtures
```python
# tests/conftest.py
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient

@pytest.fixture
async def test_session():
    """Test DB session with rollback."""
    engine = create_async_engine("postgresql+asyncpg://localhost/test_db")
    async_session = sessionmaker(engine, class_=AsyncSession)

    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def client():
    """Async HTTP client."""
    from src.main import app
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
```

## Development Commands

```bash
# Install dependencies
uv sync

# Run dev server
uv run uvicorn src.main:app --reload --port 8000

# Run tests
uv run pytest

# Coverage
uv run pytest --cov=src --cov-report=term-missing

# Type check
uv run mypy src

# Lint
uv run ruff check src

# Format
uv run ruff format src

# Migrations
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
```

## Common Pitfalls

1. ❌ Skipping layers (API → Data directly)
2. ❌ Using sync code instead of async
3. ❌ Missing type hints
4. ❌ Forgetting user_id JWT verification
5. ❌ Hardcoding secrets
6. ❌ Generic HTTP status codes
7. ❌ No input validation

## Constitution Compliance

- ✅ Spec-Driven: No manual coding (use /sp.implement)
- ✅ Test-Driven: Tests before/with implementation
- ✅ Type Safety: 100% type hints, mypy passing
- ✅ Security: JWT auth + user isolation
- ✅ Clean Architecture: Strict layer separation
- ✅ 80% Coverage: Enforced in CI
