"""
Integration tests for Chat endpoint.

Tests the POST /api/{user_id}/chat endpoint with mocked OpenAI Agent.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.conversation import Conversation
from src.models.message import Message


class TestChatEndpoint:
    """Test cases for chat endpoint."""

    @pytest.fixture
    async def mock_agent_result(self):
        """Mock agent response for consistent testing."""
        return {
            "response": "✅ Task added! I've created 'Buy groceries' in your todo list.",
            "tool_calls": [
                {
                    "tool": "add_task",
                    "args": {"user_id": "test-user-123", "title": "Buy groceries", "description": None},
                    "result": {"task_id": 1, "status": "created", "title": "Buy groceries"}
                }
            ]
        }

    @patch("src.api.routers.chat.run_agent_async")
    @patch("src.api.routers.chat.create_todo_agent")
    async def test_new_conversation(
        self,
        mock_create_agent,
        mock_run_agent,
        client: AsyncClient,
        test_db: AsyncSession,
        test_user_id: str,
        auth_headers: dict,
        mock_agent_result: dict,
    ):
        """
        Test creating a new conversation.

        Expected behavior:
        - Creates new conversation in database
        - Saves user message
        - Invokes agent with message
        - Saves assistant response
        - Returns conversation_id, response, and tool_calls
        """
        # Setup mocks
        mock_agent = Mock()
        mock_create_agent.return_value = mock_agent
        mock_run_agent.return_value = mock_agent_result

        # Make request
        request_data = {
            "conversation_id": None,
            "message": "Add a task to buy groceries"
        }

        response = await client.post(
            f"/api/{test_user_id}/chat",
            json=request_data,
            headers=auth_headers
        )

        # Verify response
        assert response.status_code == 200
        data = response.json()

        assert "conversation_id" in data
        assert data["conversation_id"] > 0
        assert data["response"] == "✅ Task added! I've created 'Buy groceries' in your todo list."
        assert len(data["tool_calls"]) == 1
        assert data["tool_calls"][0]["tool"] == "add_task"
        assert data["tool_calls"][0]["args"]["title"] == "Buy groceries"
        assert data["tool_calls"][0]["result"]["status"] == "created"

        # Verify database state
        from sqlmodel import select

        # Check conversation was created
        statement = select(Conversation).where(Conversation.user_id == test_user_id)
        result = await test_db.execute(statement)
        conversations = result.scalars().all()
        assert len(conversations) == 1
        conversation = conversations[0]
        assert conversation.user_id == test_user_id

        # Check messages were saved (user + assistant)
        statement = select(Message).where(Message.conversation_id == conversation.id)
        result = await test_db.execute(statement)
        messages = result.scalars().all()
        assert len(messages) == 2

        user_msg = messages[0]
        assert user_msg.role == "user"
        assert user_msg.content == "Add a task to buy groceries"
        assert user_msg.user_id == test_user_id

        assistant_msg = messages[1]
        assert assistant_msg.role == "assistant"
        assert assistant_msg.content == mock_agent_result["response"]
        assert assistant_msg.tool_calls is not None
        assert len(assistant_msg.tool_calls) == 1

        # Verify agent was called correctly
        mock_create_agent.assert_called_once()
        mock_run_agent.assert_called_once()
        call_args = mock_run_agent.call_args
        assert call_args.kwargs["agent"] == mock_agent
        assert call_args.kwargs["user_id"] == test_user_id
        assert call_args.kwargs["message"] == "Add a task to buy groceries"
        assert call_args.kwargs["conversation_history"] == []  # New conversation, no history

    @patch("src.api.routers.chat.run_agent_async")
    @patch("src.api.routers.chat.create_todo_agent")
    async def test_continue_conversation(
        self,
        mock_create_agent,
        mock_run_agent,
        client: AsyncClient,
        test_db: AsyncSession,
        test_user_id: str,
        auth_headers: dict,
        mock_agent_result: dict,
    ):
        """
        Test continuing an existing conversation.

        Expected behavior:
        - Uses existing conversation_id
        - Loads conversation history
        - Passes history to agent
        - Appends new messages to conversation
        """
        # Create existing conversation with messages
        from datetime import datetime, timezone

        conversation = Conversation(
            user_id=test_user_id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        test_db.add(conversation)
        await test_db.flush()
        await test_db.refresh(conversation)

        # Add previous messages
        msg1 = Message(
            conversation_id=conversation.id,
            user_id=test_user_id,
            role="user",
            content="Show me my tasks",
            created_at=datetime.now(timezone.utc),
        )
        msg2 = Message(
            conversation_id=conversation.id,
            user_id=test_user_id,
            role="assistant",
            content="You have no tasks yet.",
            created_at=datetime.now(timezone.utc),
        )
        test_db.add(msg1)
        test_db.add(msg2)
        await test_db.commit()

        # Setup mocks
        mock_agent = Mock()
        mock_create_agent.return_value = mock_agent
        mock_run_agent.return_value = mock_agent_result

        # Make request with existing conversation_id
        request_data = {
            "conversation_id": conversation.id,
            "message": "Add a task to buy groceries"
        }

        response = await client.post(
            f"/api/{test_user_id}/chat",
            json=request_data,
            headers=auth_headers
        )

        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data["conversation_id"] == conversation.id  # Same conversation ID
        assert data["response"] == mock_agent_result["response"]

        # Verify conversation history was passed to agent
        mock_run_agent.assert_called_once()
        call_args = mock_run_agent.call_args
        history = call_args.kwargs["conversation_history"]

        # Should include previous messages but NOT the new user message
        assert len(history) == 2
        assert history[0]["role"] == "user"
        assert history[0]["content"] == "Show me my tasks"
        assert history[1]["role"] == "assistant"
        assert history[1]["content"] == "You have no tasks yet."

        # Verify new messages were appended
        from sqlmodel import select

        statement = select(Message).where(Message.conversation_id == conversation.id).order_by(Message.created_at)
        result = await test_db.execute(statement)
        messages = result.scalars().all()
        assert len(messages) == 4  # 2 original + 2 new (user + assistant)

        # Verify the new messages
        assert messages[2].role == "user"
        assert messages[2].content == "Add a task to buy groceries"
        assert messages[3].role == "assistant"
        assert messages[3].content == mock_agent_result["response"]

    async def test_unauthorized(
        self,
        client: AsyncClient,
        test_user_id: str,
    ):
        """
        Test request without authentication token.

        Expected behavior:
        - Returns 401 Unauthorized
        """
        request_data = {
            "conversation_id": None,
            "message": "Add a task"
        }

        response = await client.post(
            f"/api/{test_user_id}/chat",
            json=request_data,
            # No auth headers
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    async def test_wrong_user(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
        test_user_id: str,
        other_user_id: str,
        other_user_headers: dict,
    ):
        """
        Test accessing another user's conversation.

        Expected behavior:
        - Returns 403 Forbidden when user tries to access conversation they don't own
        """
        # Create conversation for test_user_id
        from datetime import datetime, timezone

        conversation = Conversation(
            user_id=test_user_id,  # Owned by test_user_id
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        test_db.add(conversation)
        await test_db.commit()
        await test_db.refresh(conversation)

        # Try to access with other_user_id credentials
        request_data = {
            "conversation_id": conversation.id,
            "message": "Show my tasks"
        }

        response = await client.post(
            f"/api/{test_user_id}/chat",  # URL has test_user_id
            json=request_data,
            headers=other_user_headers  # But auth is for other_user_id
        )

        # Should fail because other_user doesn't own this conversation
        assert response.status_code == 403
        data = response.json()
        assert "detail" in data
        assert "other users" in data["detail"].lower()

    @patch("src.api.routers.chat.run_agent_async")
    @patch("src.api.routers.chat.create_todo_agent")
    async def test_conversation_not_found(
        self,
        mock_create_agent,
        mock_run_agent,
        client: AsyncClient,
        test_user_id: str,
        auth_headers: dict,
    ):
        """
        Test using non-existent conversation_id.

        Expected behavior:
        - Returns 404 Not Found
        """
        request_data = {
            "conversation_id": 99999,  # Non-existent ID
            "message": "Hello"
        }

        response = await client.post(
            f"/api/{test_user_id}/chat",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()

    @patch("src.api.routers.chat.run_agent_async")
    @patch("src.api.routers.chat.create_todo_agent")
    async def test_empty_message(
        self,
        mock_create_agent,
        mock_run_agent,
        client: AsyncClient,
        test_user_id: str,
        auth_headers: dict,
    ):
        """
        Test sending empty or whitespace-only message.

        Expected behavior:
        - Returns 422 Validation Error (Pydantic validation)
        """
        request_data = {
            "conversation_id": None,
            "message": "   "  # Whitespace only
        }

        response = await client.post(
            f"/api/{test_user_id}/chat",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == 422  # Pydantic validation error

    @patch("src.api.routers.chat.run_agent_async")
    @patch("src.api.routers.chat.create_todo_agent")
    async def test_message_too_long(
        self,
        mock_create_agent,
        mock_run_agent,
        client: AsyncClient,
        test_user_id: str,
        auth_headers: dict,
    ):
        """
        Test sending message exceeding 1000 character limit.

        Expected behavior:
        - Returns 422 Validation Error (Pydantic validation)
        """
        request_data = {
            "conversation_id": None,
            "message": "a" * 1001  # Exceeds max_length=1000
        }

        response = await client.post(
            f"/api/{test_user_id}/chat",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == 422  # Pydantic validation error

    @patch("src.api.routers.chat.run_agent_async")
    @patch("src.api.routers.chat.create_todo_agent")
    async def test_agent_no_tool_calls(
        self,
        mock_create_agent,
        mock_run_agent,
        client: AsyncClient,
        test_db: AsyncSession,
        test_user_id: str,
        auth_headers: dict,
    ):
        """
        Test agent response without tool calls.

        Expected behavior:
        - Response has empty tool_calls list
        - Message saved with tool_calls=None
        """
        # Mock agent response without tool calls
        mock_agent = Mock()
        mock_create_agent.return_value = mock_agent
        mock_run_agent.return_value = {
            "response": "I can help you manage your tasks! What would you like to do?",
            "tool_calls": []  # No tools called
        }

        request_data = {
            "conversation_id": None,
            "message": "Hello"
        }

        response = await client.post(
            f"/api/{test_user_id}/chat",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["tool_calls"] == []  # Empty list

        # Verify message in database has tool_calls=None
        from sqlmodel import select

        statement = select(Message).where(Message.role == "assistant")
        result = await test_db.execute(statement)
        assistant_msg = result.scalar_one()
        assert assistant_msg.tool_calls is None  # Should be None, not empty list

    @patch("src.api.routers.chat.run_agent_async")
    @patch("src.api.routers.chat.create_todo_agent")
    async def test_agent_multiple_tool_calls(
        self,
        mock_create_agent,
        mock_run_agent,
        client: AsyncClient,
        test_user_id: str,
        auth_headers: dict,
    ):
        """
        Test agent response with multiple tool calls.

        Expected behavior:
        - All tool calls included in response
        - Tool calls preserved in database
        """
        # Mock agent response with multiple tools
        mock_agent = Mock()
        mock_create_agent.return_value = mock_agent
        mock_run_agent.return_value = {
            "response": "✅ Task added! ✅ Task completed!",
            "tool_calls": [
                {
                    "tool": "add_task",
                    "args": {"user_id": "test-user-123", "title": "Buy milk"},
                    "result": {"task_id": 1, "status": "created"}
                },
                {
                    "tool": "complete_task",
                    "args": {"user_id": "test-user-123", "task_id": 1},
                    "result": {"task_id": 1, "status": "completed"}
                }
            ]
        }

        request_data = {
            "conversation_id": None,
            "message": "Add a task to buy milk and mark it as done"
        }

        response = await client.post(
            f"/api/{test_user_id}/chat",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["tool_calls"]) == 2
        assert data["tool_calls"][0]["tool"] == "add_task"
        assert data["tool_calls"][1]["tool"] == "complete_task"

    @patch("src.api.routers.chat.run_agent_async")
    @patch("src.api.routers.chat.create_todo_agent")
    async def test_conversation_timestamp_update(
        self,
        mock_create_agent,
        mock_run_agent,
        client: AsyncClient,
        test_db: AsyncSession,
        test_user_id: str,
        auth_headers: dict,
        mock_agent_result: dict,
    ):
        """
        Test that conversation.updated_at is updated on new messages.

        Expected behavior:
        - Conversation.updated_at is set to current time after message
        """
        # Create conversation
        from datetime import datetime
        from time import sleep

        initial_time = datetime.utcnow()
        conversation = Conversation(
            user_id=test_user_id,
            created_at=initial_time,
            updated_at=initial_time,
        )
        test_db.add(conversation)
        await test_db.commit()
        await test_db.refresh(conversation)

        # Small delay to ensure timestamp difference
        sleep(0.1)

        # Setup mocks
        mock_agent = Mock()
        mock_create_agent.return_value = mock_agent
        mock_run_agent.return_value = mock_agent_result

        # Send message
        request_data = {
            "conversation_id": conversation.id,
            "message": "Add a task"
        }

        response = await client.post(
            f"/api/{test_user_id}/chat",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == 200

        # Verify updated_at was changed
        await test_db.refresh(conversation)
        assert conversation.updated_at > initial_time
