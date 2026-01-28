"""
Task: T030, T031, T032
JWT authentication middleware.

Validates JWT tokens from Better Auth cookies and extracts user information.
Better Auth uses HTTP-only cookies for session tokens (more secure than headers).
"""

from typing import Callable

from fastapi import HTTPException, Request, Response, status
from jose import JWTError, jwt

from src.config import settings

# Public endpoints that don't require authentication
PUBLIC_PATHS = {"/health", "/docs", "/redoc", "/openapi.json"}

# Better Auth cookie names (try multiple for compatibility)
BETTER_AUTH_COOKIE_NAMES = [
    "better-auth.session_token",
    "session_token",
    "auth-token",
    "authjs.session-token",
]


async def jwt_auth_middleware(request: Request, call_next: Callable[[Request], Response]) -> Response:
    """
    Validate JWT token from Better Auth cookie and extract user information.

    Better Auth stores JWT tokens in HTTP-only cookies (not Authorization header).
    This middleware extracts the token from cookies, validates it, and adds
    user info to request.state for downstream handlers.

    Skips authentication for public endpoints (docs, health check).
    Extracts user_id from JWT 'sub' claim and adds to request.state.

    Args:
        request: FastAPI request object
        call_next: Next middleware/handler in chain

    Returns:
        Response from downstream handler

    Raises:
        HTTPException: 401 if token is missing, invalid, or expired
    """
    # Task: T032 - Skip auth for documentation and health endpoints
    if request.url.path in PUBLIC_PATHS:
        return await call_next(request)

    # Skip authentication for CORS preflight requests
    if request.method == "OPTIONS":
        return await call_next(request)

    # Extract JWT token from Better Auth cookie
    token = None
    for cookie_name in BETTER_AUTH_COOKIE_NAMES:
        token = request.cookies.get(cookie_name)
        if token:
            print(f"Found JWT token in cookie: {cookie_name}")
            break

    # Fallback: Try Authorization header (for API clients)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            print("Found JWT token in Authorization header")

    if not token:
        print(f"No token found. Cookies: {list(request.cookies.keys())}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Task: T030 - Decode and validate JWT
    try:
        payload = jwt.decode(
            token,
            settings.better_auth_secret,
            algorithms=["HS256"],
        )

        # Extract user information from JWT claims
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing 'sub' claim",
            )

        # Add user info to request state for downstream handlers
        request.state.user_id = user_id
        request.state.user_email = payload.get("email")

        print(f"Authenticated user: {user_id} ({request.state.user_email})")

    except JWTError as e:
        print(f"JWT validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

    return await call_next(request)
