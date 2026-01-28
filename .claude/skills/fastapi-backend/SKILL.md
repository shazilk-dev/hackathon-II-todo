---
name: fastapi-backend
description: Generate FastAPI backend code with async SQLModel, Neon PostgreSQL, and JWT authentication. Use when implementing API endpoints, database models, or backend features for the todo app.
allowed-tools: Read, Write, Glob, Grep, Bash
---

# FastAPI Backend Skill

## Stack
- FastAPI 0.115+
- SQLModel 0.0.22+ (async)
- Neon PostgreSQL with asyncpg
- PyJWT for token verification
- Python 3.13+
- UV package manager

## Project Structure

```
backend/
├── pyproject.toml
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, lifespan, CORS
│   ├── config.py            # Settings from environment
│   ├── database.py          # Async engine and session
│   ├── models/
│   │   ├── __init__.py
│   │   └── task.py          # SQLModel table models
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── task.py          # Pydantic request/response
│   ├── routes/
│   │   ├── __init__.py
│   │   └── tasks.py         # API route handlers
│   └── auth/
│       ├── __init__.py
│       └── jwt.py           # JWT verification
└── tests/
    ├── __init__.py
    ├── conftest.py
    └── test_tasks.py
```

## Code Patterns

### Config (src/config.py)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    BETTER_AUTH_SECRET: str
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Async Database (src/database.py)

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from src.config import settings

# Create async engine for Neon PostgreSQL
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # Set False in production
    pool_pre_ping=True
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_db():
    """Create tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session() -> AsyncSession:
    """Dependency for route handlers."""
    async with async_session() as session:
        yield session
```

### SQLModel Model (src/models/task.py)

```python
from datetime import datetime
from sqlmodel import SQLModel, Field

class Task(SQLModel, table=True):
    __tablename__ = "tasks"
    
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    title: str = Field(max_length=200, nullable=False)
    description: str | None = Field(default=None)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### Pydantic Schemas (src/schemas/task.py)

```python
from datetime import datetime
from pydantic import BaseModel, Field

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None

class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None

class TaskResponse(BaseModel):
    id: int
    user_id: str
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    count: int
```

### JWT Verification (src/auth/jwt.py)

```python
import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.config import settings

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """
    Verify JWT token and return user payload.
    
    Expected JWT payload:
    - sub: user_id
    - email: user email
    - exp: expiration timestamp
    """
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

def verify_user_access(current_user: dict, user_id: str) -> None:
    """Verify that the authenticated user matches the requested user_id."""
    if current_user.get("sub") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
```

### Route Handler (src/routes/tasks.py)

```python
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.database import get_session
from src.auth.jwt import get_current_user, verify_user_access
from src.models.task import Task
from src.schemas.task import (
    TaskCreate, TaskUpdate, TaskResponse, TaskListResponse
)

router = APIRouter(prefix="/api", tags=["tasks"])

@router.get("/{user_id}/tasks", response_model=TaskListResponse)
async def get_tasks(
    user_id: str,
    status: str = Query("all", regex="^(all|pending|completed)$"),
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get all tasks for a user."""
    verify_user_access(current_user, user_id)
    
    statement = select(Task).where(Task.user_id == user_id)
    
    if status == "pending":
        statement = statement.where(Task.completed == False)
    elif status == "completed":
        statement = statement.where(Task.completed == True)
    
    statement = statement.order_by(Task.created_at.desc())
    
    results = await session.exec(statement)
    tasks = results.all()
    
    return TaskListResponse(tasks=tasks, count=len(tasks))

@router.post("/{user_id}/tasks", response_model=TaskResponse, status_code=201)
async def create_task(
    user_id: str,
    task_data: TaskCreate,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Create a new task."""
    verify_user_access(current_user, user_id)
    
    task = Task(
        user_id=user_id,
        title=task_data.title,
        description=task_data.description
    )
    
    session.add(task)
    await session.commit()
    await session.refresh(task)
    
    return task

@router.get("/{user_id}/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    user_id: str,
    task_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific task."""
    verify_user_access(current_user, user_id)
    
    task = await session.get(Task, task_id)
    
    if not task or task.user_id != user_id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task

@router.put("/{user_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    user_id: str,
    task_id: int,
    task_data: TaskUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Update a task."""
    verify_user_access(current_user, user_id)
    
    task = await session.get(Task, task_id)
    
    if not task or task.user_id != user_id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    
    task.updated_at = datetime.utcnow()
    
    session.add(task)
    await session.commit()
    await session.refresh(task)
    
    return task

@router.delete("/{user_id}/tasks/{task_id}")
async def delete_task(
    user_id: str,
    task_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Delete a task."""
    verify_user_access(current_user, user_id)
    
    task = await session.get(Task, task_id)
    
    if not task or task.user_id != user_id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await session.delete(task)
    await session.commit()
    
    return {"message": "Task deleted successfully"}

@router.patch("/{user_id}/tasks/{task_id}/complete", response_model=TaskResponse)
async def toggle_complete(
    user_id: str,
    task_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Toggle task completion status."""
    verify_user_access(current_user, user_id)
    
    task = await session.get(Task, task_id)
    
    if not task or task.user_id != user_id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.completed = not task.completed
    task.updated_at = datetime.utcnow()
    
    session.add(task)
    await session.commit()
    await session.refresh(task)
    
    return task
```

### Main App (src/main.py)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.database import init_db
from src.routes import tasks

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown."""
    await init_db()
    yield

app = FastAPI(
    title="Todo API",
    description="Phase 2 - Full Stack Web Application",
    version="2.0.0",
    lifespan=lifespan
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "phase": "2"}
```

## Testing Pattern

```python
# tests/conftest.py
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from src.main import app

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def mock_jwt_token():
    """Create a mock JWT for testing."""
    import jwt
    payload = {"sub": "test-user-123", "email": "test@example.com"}
    return jwt.encode(payload, "test-secret", algorithm="HS256")
```

## pyproject.toml

```toml
[project]
name = "todo-backend"
version = "0.1.0"
requires-python = ">=3.13"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlmodel>=0.0.22",
    "asyncpg>=0.30.0",
    "pyjwt>=2.9.0",
    "python-dotenv>=1.0.0",
    "pydantic-settings>=2.6.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=6.0.0",
    "httpx>=0.28.0",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

## Commands

```bash
# Install dependencies
uv sync

# Run development server
uv run uvicorn src.main:app --reload --port 8000

# Run tests
uv run pytest -v --cov=src

# Generate coverage report
uv run pytest --cov=src --cov-report=html
```

## Error Handling

Always use HTTPException with appropriate status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid JWT)
- 403: Forbidden (accessing other user's data)
- 404: Not Found (task doesn't exist)
- 500: Internal Server Error

## Important Notes

1. **Always use async/await** - This is an async backend
2. **Verify user access** - Always check JWT user matches URL user_id
3. **Type hints** - Use them everywhere for better IDE support
4. **Dependency injection** - Use Depends() for session and auth
5. **Response models** - Always specify response_model for type safety
