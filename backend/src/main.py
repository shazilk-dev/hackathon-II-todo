"""
Task: T034, T035, T036, T037, T038
FastAPI application entry point.

Creates and configures the FastAPI app with middleware,
CORS, and route handlers.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.middleware.jwt_auth import jwt_auth_middleware
from src.api.routers import tags, tasks
from src.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Task: T035
    Application lifespan context manager.

    Handles startup and shutdown events.
    """
    # Startup
    print(f"Starting {settings.app_name} v{settings.app_version}")
    print(f"Environment: {settings.environment}")

    yield

    # Shutdown
    print("Shutting down...")


# Task: T034 - Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="FastAPI backend for hackathon todo app with JWT authentication",
    lifespan=lifespan,
)

# Task: T036 - Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Task: T037 - Add JWT authentication middleware
app.middleware("http")(jwt_auth_middleware)

# Task: T049 - Include tasks router
app.include_router(tasks.router)

# Include tags router
app.include_router(tags.router)


# Root endpoint
@app.get(
    "/",
    tags=["root"],
    summary="API Root",
    response_model=dict[str, str],
)
async def root() -> dict[str, str]:
    """
    Root endpoint with API information.

    Returns welcome message and useful links.
    """
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
    }


# Task: T038 - Health check endpoint
@app.get(
    "/health",
    tags=["health"],
    summary="Health check",
    response_model=dict[str, str],
)
async def health_check() -> dict[str, str]:
    """
    Health check endpoint for monitoring.

    Returns application status and environment.
    """
    return {
        "status": "ok",
        "environment": settings.environment,
        "version": settings.app_version,
    }
