"""
ChatKit Session Router

Provides ChatKit session creation endpoint for frontend widget authentication.
Uses OpenAI Python SDK to create short-lived client secrets.

Architecture: Frontend ChatKit Widget → /api/chatkit/session → OpenAI ChatKit API
"""

from fastapi import APIRouter, HTTPException, Request, status
from openai import OpenAI
from pydantic import BaseModel

from src.config import settings

router = APIRouter(prefix="/api", tags=["chatkit"])


class CreateChatKitSessionResponse(BaseModel):
    """Response model for ChatKit session creation."""

    client_secret: str


@router.post(
    "/chatkit/session",
    response_model=CreateChatKitSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create ChatKit session",
    description="Creates a new ChatKit session for authenticated users. Returns a short-lived client_secret for the frontend widget.",
)
async def create_chatkit_session(request: Request) -> CreateChatKitSessionResponse:
    """
    Create ChatKit session for authenticated user.

    This endpoint:
    1. Validates JWT token (via middleware - request.state.user_id set)
    2. Creates ChatKit session using OpenAI SDK
    3. Returns client_secret for frontend ChatKit widget

    The client_secret is a short-lived credential that the ChatKit frontend
    uses to authenticate with OpenAI's ChatKit service.

    Args:
        request: FastAPI request object (contains user_id from JWT middleware)

    Returns:
        CreateChatKitSessionResponse with client_secret

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 500 if session creation fails
    """
    # Verify user is authenticated (JWT middleware sets request.state.user_id)
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )

    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=settings.openai_api_key)

        # Create ChatKit session using OpenAI SDK
        # See: https://platform.openai.com/docs/api-reference/chatkit
        chat_session = client.beta.chatkit.sessions.create(
            user=user_id,
            # Note: workflow configuration would go here if using workflow-based ChatKit
            # For now, using default session behavior
        )

        # Return client secret for frontend widget
        return CreateChatKitSessionResponse(
            client_secret=chat_session.client_secret
        )

    except Exception as e:
        # Log error and return user-friendly message
        print(f"ChatKit session creation failed for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat session: {str(e)}",
        ) from e
