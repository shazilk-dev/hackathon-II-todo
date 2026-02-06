# Task: T013, T015-T035, T046-T050
"""
Chat Router - Conversational Messaging Endpoint for AI Task Management.

POST /api/{user_id}/chat - Send message to AI assistant and receive response.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.agent.todo_agent import create_todo_agent, run_agent_async
from src.db.session import get_db as get_session
from src.models.conversation import Conversation
from src.models.message import Message
from src.schemas.chat import ChatRequest, ChatResponse, ToolCall

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api", tags=["chat"])


@router.get("/{user_id}/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    user_id: str,
    conversation_id: int,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """
    Get all messages from a conversation.

    Args:
        user_id: User identifier from path parameter
        conversation_id: Conversation ID to fetch messages from
        request: FastAPI request object (contains JWT user_id)
        session: Database session

    Returns:
        List of messages with role, content, and tool_calls

    Raises:
        HTTPException 403: User doesn't own this conversation
        HTTPException 404: Conversation not found
    """
    try:
        # Verify user_id matches JWT
        if request.state.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot access resources for other users",
            )

        # Get conversation and verify ownership
        statement = select(Conversation).where(Conversation.id == conversation_id)
        result = await session.execute(statement)
        conversation = result.scalar_one_or_none()

        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        if conversation.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied - conversation belongs to another user",
            )

        # Fetch all messages in chronological order
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        result = await session.execute(statement)
        messages = result.scalars().all()

        # Format messages for frontend
        formatted_messages = [
            {
                "id": f"{msg.role}-{msg.id}",
                "role": msg.role,
                "content": msg.content,
                "tool_calls": msg.tool_calls if msg.tool_calls else None,
                "timestamp": msg.created_at.isoformat(),
            }
            for msg in messages
        ]

        return {"messages": formatted_messages, "count": len(formatted_messages)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversation messages: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch conversation messages",
        )


@router.post("/{user_id}/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat_endpoint(
    user_id: str,
    request_data: ChatRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> ChatResponse:
    """
    Chat with the AI assistant for todo management.

    This endpoint allows users to have natural language conversations with an AI agent
    that can manage their tasks. The agent can create, list, complete, update, and
    delete tasks based on conversational input.

    **User Story Coverage**:
    - US1: Start new conversation (conversation_id=null)
    - US2: Continue existing conversation (conversation_id provided)
    - US3: Receive AI-generated responses
    - US4: View tool execution details (tool_calls in response)
    - US5: Access control and user isolation (enforced via JWT)

    Args:
        user_id: User identifier from path parameter
        request_data: Chat request containing optional conversation_id and message
        session: Database session for persistence

    Returns:
        ChatResponse containing conversation_id, AI response text, and tool_calls

    Raises:
        HTTPException 400: Invalid request (empty message, message too long, invalid conversation_id)
        HTTPException 401: Unauthorized (JWT authentication failure)
        HTTPException 403: Forbidden (accessing another user's conversation)
        HTTPException 404: Not Found (conversation_id doesn't exist)
        HTTPException 500: Internal Server Error (unexpected errors)
        HTTPException 504: Gateway Timeout (agent processing timeout)
    """
    try:
        # T015, T016: JWT authentication and user_id validation
        if request.state.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot access resources for other users",
            )

        # T017: ChatRequest validation (Pydantic handles message length and whitespace)
        message_text = request_data.message

        # T018, T026: Get or create conversation
        conversation: Conversation
        if request_data.conversation_id is None:
            # US1: Create new conversation
            logger.info(f"Creating new conversation for user {user_id}")
            conversation = Conversation(user_id=user_id)
            session.add(conversation)
            await session.flush()  # Get conversation.id without committing
            await session.refresh(conversation)
        else:
            # US2: Retrieve existing conversation
            logger.info(
                f"Retrieving conversation {request_data.conversation_id} for user {user_id}"
            )

            # T026: Retrieve conversation by ID
            statement = select(Conversation).where(Conversation.id == request_data.conversation_id)
            result = await session.execute(statement)
            conversation = result.scalar_one_or_none()

            # T033: Handle conversation not found
            if conversation is None:
                logger.warning(
                    f"Conversation {request_data.conversation_id} not found for user {user_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found",
                )

            # T027: Validate conversation ownership
            if conversation.user_id != user_id:
                logger.warning(
                    f"User {user_id} attempted to access conversation {conversation.id} "
                    f"owned by {conversation.user_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied - conversation belongs to another user",
                )

        # T019, T030: Persist user message
        user_message = Message(
            conversation_id=conversation.id,
            user_id=user_id,
            role="user",
            content=message_text,
        )
        session.add(user_message)

        # T028, T029: Load conversation history and format for agent
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
        )
        result = await session.execute(statement)
        history_messages = result.scalars().all()

        # Format history for agent (exclude the message we just added)
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in history_messages
            if msg.id != user_message.id  # Exclude current message
        ]

        # T020, T031, T042, T043: Invoke agent with message and history
        logger.info(
            f"Invoking agent for user {user_id} with message length {len(message_text)}"
        )
        agent = create_todo_agent()

        # T044, T045: Error handling and timeout (30 seconds handled by agent internally)
        agent_result = await run_agent_async(
            agent=agent,
            user_id=user_id,
            message=message_text,
            conversation_history=conversation_history,
        )

        response_text = agent_result["response"]
        tool_calls_raw = agent_result["tool_calls"]

        # T046, T047: Extract and format tool calls
        tool_calls: list[ToolCall] = []
        for tc in tool_calls_raw:
            tool_calls.append(ToolCall(tool=tc["tool"], args=tc["args"], result=tc["result"]))

        # T021: Persist assistant message with tool_calls
        # T048: Persist tool_calls to JSONB column
        assistant_message = Message(
            conversation_id=conversation.id,
            user_id=user_id,
            role="assistant",
            content=response_text,
            tool_calls=tool_calls_raw if tool_calls_raw else None,  # T050: Handle empty tool_calls
        )
        session.add(assistant_message)

        # T032: Update conversation.updated_at timestamp
        conversation.updated_at = datetime.utcnow()
        session.add(conversation)

        # Commit all changes
        await session.commit()
        await session.refresh(conversation)

        logger.info(
            f"Chat response generated for conversation {conversation.id}, "
            f"tool_calls: {len(tool_calls)}"
        )

        # T022, T049: Return ChatResponse with conversation_id, response, and tool_calls
        return ChatResponse(
            conversation_id=conversation.id, response=response_text, tool_calls=tool_calls
        )

    except HTTPException:
        # Re-raise HTTP exceptions (validation errors, not found, forbidden)
        raise

    except ValueError as e:
        # T023, T024: Handle validation errors
        logger.warning(f"Validation error for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Validation error: {str(e)}"
        )

    except Exception as e:
        # T025, T034, T035: Handle unexpected errors
        logger.error(f"Unexpected error in chat endpoint for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing your message",
        )
