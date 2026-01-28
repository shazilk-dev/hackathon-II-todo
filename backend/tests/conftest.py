"""
Task: T086-T093
Pytest fixtures for testing infrastructure.

Provides test database, HTTP client, and JWT authentication fixtures.
"""

import os
from collections.abc import AsyncGenerator
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from src.config import settings
from src.db.session import get_db
from src.main import app
from src.models.task import Task
from src.models.user import User

# Test database URL - use in-memory SQLite for fast tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="function")
async def test_engine_instance():
    """Create async engine for test database."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},  # SQLite specific
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    yield engine

    # Drop all tables after test
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

    await engine.dispose()


@pytest.fixture(scope="function")
async def test_db(test_engine_instance) -> AsyncGenerator[AsyncSession, None]:
    """
    Task: T086
    Provide a test database session with automatic rollback.

    Creates tables before each test and drops them after.
    Each test gets a fresh database.
    """
    # Test session factory
    TestSessionLocal = async_sessionmaker(
        test_engine_instance,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # Provide session
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest.fixture(scope="function")
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Task: T087
    Provide an async HTTP client for API testing.

    Overrides the database dependency to use the test database.
    """

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def test_user_id() -> str:
    """Task: T088 - Test user ID for authentication"""
    return "test-user-123"


@pytest.fixture
def test_user_email() -> str:
    """Task: T089 - Test user email"""
    return "test@example.com"


@pytest.fixture
def jwt_token(test_user_id: str, test_user_email: str) -> str:
    """
    Task: T090
    Generate a valid JWT token for testing.

    Uses the same secret and algorithm as the application.
    """
    payload = {
        "sub": test_user_id,
        "email": test_user_email,
        "exp": 9999999999,  # Far future expiration
    }

    token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")
    return token


@pytest.fixture
def auth_headers(jwt_token: str) -> dict[str, str]:
    """
    Task: T091
    Provide authentication headers with JWT token.
    """
    return {"Authorization": f"Bearer {jwt_token}"}


@pytest.fixture
async def test_user(test_db: AsyncSession, test_user_id: str, test_user_email: str) -> User:
    """
    Task: T092
    Create a test user in the database.
    """
    user = User(
        id=test_user_id,
        email=test_user_email,
        name="Test User",
        emailVerified=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest.fixture
async def test_task(test_db: AsyncSession, test_user_id: str) -> Task:
    """
    Task: T093
    Create a test task in the database.
    """
    task = Task(
        user_id=test_user_id,
        title="Test Task",
        description="Test description",
        completed=False,
    )
    test_db.add(task)
    await test_db.commit()
    await test_db.refresh(task)
    return task


@pytest.fixture
async def multiple_test_tasks(test_db: AsyncSession, test_user_id: str) -> list[Task]:
    """
    Task: T093
    Create multiple test tasks with different statuses.
    """
    tasks = [
        Task(user_id=test_user_id, title="Completed Task", completed=True),
        Task(user_id=test_user_id, title="Pending Task 1", completed=False),
        Task(user_id=test_user_id, title="Pending Task 2", completed=False),
    ]

    for task in tasks:
        test_db.add(task)

    await test_db.commit()

    for task in tasks:
        await test_db.refresh(task)

    return tasks


@pytest.fixture
def other_user_id() -> str:
    """Different user ID for testing user isolation."""
    return "other-user-456"


@pytest.fixture
def other_user_token(other_user_id: str) -> str:
    """Generate JWT token for a different user (user isolation tests)."""
    payload = {
        "sub": other_user_id,
        "email": "other@example.com",
        "exp": 9999999999,
    }
    return jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")


@pytest.fixture
def other_user_headers(other_user_token: str) -> dict[str, str]:
    """Authentication headers for different user."""
    return {"Authorization": f"Bearer {other_user_token}"}


@pytest.fixture
def invalid_token() -> str:
    """Invalid JWT token for testing auth failures."""
    return "invalid.token.here"


@pytest.fixture
def expired_token(test_user_id: str) -> str:
    """Expired JWT token for testing auth failures."""
    payload = {
        "sub": test_user_id,
        "email": "test@example.com",
        "exp": 1,  # Expired in 1970
    }
    return jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")


@pytest.fixture
def task_create_payload() -> dict[str, Any]:
    """Valid task creation payload."""
    return {
        "title": "New Task",
        "description": "Task description",
    }


@pytest.fixture
def task_update_payload() -> dict[str, Any]:
    """Valid task update payload."""
    return {
        "title": "Updated Title",
        "description": "Updated description",
    }
