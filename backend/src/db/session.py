"""
Task: T012, T013, T014
Async database session management with connection pooling.

Provides async SQLAlchemy engine and session factory optimized
for Neon serverless PostgreSQL.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from src.config import settings

# Task: T012 - Create async engine with connection pooling
# SQLite doesn't support pooling parameters, so use conditional configuration
_is_sqlite = "sqlite" in settings.database_url.lower()

if _is_sqlite:
    # SQLite configuration (for tests)
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        connect_args={"check_same_thread": False},  # SQLite specific
    )
else:
    # PostgreSQL configuration (for production)
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,  # Log SQL queries in debug mode
        pool_size=10,  # Minimum number of connections in pool
        max_overflow=20,  # Maximum additional connections beyond pool_size
        pool_pre_ping=True,  # Verify connection health before use (Neon serverless compatibility)
        pool_recycle=3600,  # Recycle connections after 1 hour (Neon idle timeout)
    )

# Task: T013 - Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Don't expire objects after commit (async compatibility)
    autocommit=False,
    autoflush=False,
)


# Task: T014 - Dependency for FastAPI route injection
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Provide async database session to route handlers.

    Yields:
        AsyncSession: Database session with automatic commit/rollback

    Usage:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initialize database tables.

    NOTE: In production, use Alembic migrations instead.
    This is primarily for testing and local development.
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
