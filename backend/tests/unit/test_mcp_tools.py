"""
Unit tests for MCP tools.

Tests the 5 core task management tools with mocked database sessions.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Import the MCP tool wrappers and extract the actual functions
from src.mcp.tools import (
    add_task as add_task_tool,
    list_tasks as list_tasks_tool,
    complete_task as complete_task_tool,
    update_task as update_task_tool,
    delete_task as delete_task_tool,
)

# Extract the underlying callable functions from FastMCP FunctionTool wrappers
add_task = add_task_tool.fn
list_tasks = list_tasks_tool.fn
complete_task = complete_task_tool.fn
update_task = update_task_tool.fn
delete_task = delete_task_tool.fn


class TestAddTask:
    """Test cases for add_task tool."""

    @patch("src.mcp.tools.Session")
    def test_add_task_success(self, mock_session_cls):
        """Test successful task creation."""
        # Setup mock
        mock_session = MagicMock()
        mock_session_cls.return_value.__enter__.return_value = mock_session

        mock_task = Mock()
        mock_task.id = 1
        mock_task.title = "Test Task"

        def set_id(task):
            task.id = 1

        mock_session.refresh.side_effect = set_id

        # Execute
        result = add_task("user123", "Test Task", "Test description")

        # Verify
        assert result["task_id"] == 1
        assert result["status"] == "created"
        assert result["title"] == "Test Task"
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()

    def test_add_task_empty_title(self):
        """Test validation error for empty title."""
        result = add_task("user123", "")
        assert "error" in result
        assert "Title is required" in result["error"]

    def test_add_task_whitespace_title(self):
        """Test validation error for whitespace-only title."""
        result = add_task("user123", "   ")
        assert "error" in result
        assert "Title is required" in result["error"]

    def test_add_task_title_too_long(self):
        """Test validation error for title exceeding 200 characters."""
        long_title = "a" * 201
        result = add_task("user123", long_title)
        assert "error" in result
        assert "200 characters" in result["error"]

    def test_add_task_description_too_long(self):
        """Test validation error for description exceeding 2000 characters."""
        long_desc = "a" * 2001
        result = add_task("user123", "Test", long_desc)
        assert "error" in result
        assert "2000 characters" in result["error"]


class TestListTasks:
    """Test cases for list_tasks tool."""

    @patch("src.mcp.tools.Session")
    def test_list_tasks_all(self, mock_session_cls):
        """Test listing all tasks."""
        # Setup mock
        mock_session = MagicMock()
        mock_session_cls.return_value.__enter__.return_value = mock_session

        mock_task1 = Mock(id=1, title="Task 1", description="Desc 1", completed=False)
        mock_task2 = Mock(id=2, title="Task 2", description=None, completed=True)

        mock_session.execute.return_value.scalars.return_value.all.return_value = [mock_task1, mock_task2]

        # Execute
        result = list_tasks("user123", "all")

        # Verify
        assert len(result) == 2
        assert result[0]["id"] == 1
        assert result[0]["title"] == "Task 1"
        assert result[0]["completed"] is False
        assert result[1]["id"] == 2
        assert result[1]["completed"] is True

    @patch("src.mcp.tools.Session")
    def test_list_tasks_pending(self, mock_session_cls):
        """Test listing pending tasks only."""
        # Setup mock
        mock_session = MagicMock()
        mock_session_cls.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.all.return_value = []

        # Execute
        result = list_tasks("user123", "pending")

        # Verify
        assert isinstance(result, list)
        mock_session.execute.assert_called_once()

    def test_list_tasks_invalid_status(self):
        """Test validation error for invalid status filter."""
        result = list_tasks("user123", "invalid")
        assert len(result) == 1
        assert "error" in result[0]
        assert "Invalid status" in result[0]["error"]


class TestCompleteTask:
    """Test cases for complete_task tool."""

    @patch("src.mcp.tools.Session")
    def test_complete_task_success(self, mock_session_cls):
        """Test successful task completion."""
        # Setup mock
        mock_session = MagicMock()
        mock_session_cls.return_value.__enter__.return_value = mock_session

        mock_task = Mock()
        mock_task.id = 1
        mock_task.user_id = "user123"
        mock_task.title = "Test Task"
        mock_task.completed = False

        mock_session.get.return_value = mock_task

        # Execute
        result = complete_task("user123", 1)

        # Verify
        assert result["task_id"] == 1
        assert result["status"] == "completed"
        assert result["title"] == "Test Task"
        assert mock_task.completed is True
        assert mock_task.status == "done"
        mock_session.commit.assert_called_once()

    @patch("src.mcp.tools.Session")
    def test_complete_task_not_found(self, mock_session_cls):
        """Test error when task not found."""
        # Setup mock
        mock_session = MagicMock()
        mock_session_cls.return_value.__enter__.return_value = mock_session
        mock_session.get.return_value = None

        # Execute
        result = complete_task("user123", 99)

        # Verify
        assert "error" in result
        assert "not found" in result["error"]

    @patch("src.mcp.tools.Session")
    def test_complete_task_wrong_user(self, mock_session_cls):
        """Test error when user doesn't own task."""
        # Setup mock
        mock_session = MagicMock()
        mock_session_cls.return_value.__enter__.return_value = mock_session

        mock_task = Mock()
        mock_task.user_id = "other_user"

        mock_session.get.return_value = mock_task

        # Execute
        result = complete_task("user123", 1)

        # Verify
        assert "error" in result
        assert "not found" in result["error"]

    def test_complete_task_invalid_id(self):
        """Test validation error for invalid task ID."""
        result = complete_task("user123", 0)
        assert "error" in result
        assert "positive integer" in result["error"]


class TestUpdateTask:
    """Test cases for update_task tool."""

    @patch("src.mcp.tools.Session")
    def test_update_task_title(self, mock_session_cls):
        """Test updating task title."""
        # Setup mock
        mock_session = MagicMock()
        mock_session_cls.return_value.__enter__.return_value = mock_session

        mock_task = Mock()
        mock_task.id = 1
        mock_task.user_id = "user123"
        mock_task.title = "Old Title"

        mock_session.get.return_value = mock_task

        # Execute
        result = update_task("user123", 1, title="New Title")

        # Verify
        assert result["task_id"] == 1
        assert result["status"] == "updated"
        assert mock_task.title == "New Title"
        mock_session.commit.assert_called_once()

    @patch("src.mcp.tools.Session")
    def test_update_task_description(self, mock_session_cls):
        """Test updating task description."""
        # Setup mock
        mock_session = MagicMock()
        mock_session_cls.return_value.__enter__.return_value = mock_session

        mock_task = Mock()
        mock_task.id = 1
        mock_task.user_id = "user123"
        mock_task.title = "Task Title"
        mock_task.description = None

        mock_session.get.return_value = mock_task

        # Execute
        result = update_task("user123", 1, description="New Description")

        # Verify
        assert result["status"] == "updated"
        assert mock_task.description == "New Description"

    def test_update_task_no_fields(self):
        """Test validation error when no fields provided."""
        result = update_task("user123", 1)
        assert "error" in result
        assert "At least one field" in result["error"]

    def test_update_task_empty_title(self):
        """Test validation error for empty title."""
        result = update_task("user123", 1, title="")
        assert "error" in result
        assert "cannot be empty" in result["error"]


class TestDeleteTask:
    """Test cases for delete_task tool."""

    @patch("src.mcp.tools.Session")
    def test_delete_task_success(self, mock_session_cls):
        """Test successful task deletion."""
        # Setup mock
        mock_session = MagicMock()
        mock_session_cls.return_value.__enter__.return_value = mock_session

        mock_task = Mock()
        mock_task.id = 1
        mock_task.user_id = "user123"
        mock_task.title = "Test Task"

        mock_session.get.return_value = mock_task

        # Execute
        result = delete_task("user123", 1)

        # Verify
        assert result["task_id"] == 1
        assert result["status"] == "deleted"
        assert result["title"] == "Test Task"
        mock_session.delete.assert_called_once_with(mock_task)
        mock_session.commit.assert_called_once()

    @patch("src.mcp.tools.Session")
    def test_delete_task_not_found(self, mock_session_cls):
        """Test error when task not found."""
        # Setup mock
        mock_session = MagicMock()
        mock_session_cls.return_value.__enter__.return_value = mock_session
        mock_session.get.return_value = None

        # Execute
        result = delete_task("user123", 99)

        # Verify
        assert "error" in result
        assert "not found" in result["error"]

    def test_delete_task_invalid_id(self):
        """Test validation error for invalid task ID."""
        result = delete_task("user123", -1)
        assert "error" in result
        assert "positive integer" in result["error"]
