"""
Task: T132-T141
Contract tests for Pydantic schemas.

Validates request/response schema contracts.
"""

import pytest
from pydantic import ValidationError

from src.schemas.task import TaskCreate, TaskResponse, TaskUpdate


@pytest.mark.contract
class TestTaskCreateSchema:
    """Tests for TaskCreate schema validation"""

    def test_task_create_valid(self) -> None:
        """Task: T132 - Valid task creation data"""
        data = {"title": "Test Task", "description": "Test"}
        task = TaskCreate(**data)

        assert task.title == "Test Task"
        assert task.description == "Test"

    def test_task_create_title_required(self) -> None:
        """Task: T133 - Title is required"""
        with pytest.raises(ValidationError) as exc_info:
            TaskCreate(description="No title")

        assert "title" in str(exc_info.value)

    def test_task_create_rejects_empty_title(self) -> None:
        """Task: T134 - Reject whitespace-only title"""
        with pytest.raises(ValidationError) as exc_info:
            TaskCreate(title="   ")

        assert "empty" in str(exc_info.value).lower()

    def test_task_create_trims_whitespace(self) -> None:
        """Task: T135 - Trim whitespace from title"""
        task = TaskCreate(title="  Test  ")

        assert task.title == "Test"

    def test_task_create_description_optional(self) -> None:
        """Task: T136 - Description is optional"""
        task = TaskCreate(title="Test")

        assert task.description is None


@pytest.mark.contract
class TestTaskUpdateSchema:
    """Tests for TaskUpdate schema validation"""

    def test_task_update_all_fields_optional(self) -> None:
        """Task: T137 - All fields optional for partial update"""
        task = TaskUpdate()

        assert task.title is None
        assert task.description is None
        assert task.completed is None

    def test_task_update_title_validation(self) -> None:
        """Task: T138 - Validate title if provided"""
        with pytest.raises(ValidationError):
            TaskUpdate(title="   ")

    def test_task_update_partial(self) -> None:
        """Task: T139 - Partial updates allowed"""
        task = TaskUpdate(completed=True)

        assert task.completed is True
        assert task.title is None


@pytest.mark.contract
class TestTaskResponseSchema:
    """Tests for TaskResponse schema validation"""

    def test_task_response_from_model(self) -> None:
        """Task: T140 - Convert from SQLModel Task"""
        from datetime import datetime, timezone

        from src.models.task import Task

        task = Task(
            id=1,
            user_id="user123",
            title="Test",
            description="Desc",
            completed=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        response = TaskResponse.model_validate(task)

        assert response.id == 1
        assert response.title == "Test"

    def test_task_response_all_fields_required(self) -> None:
        """Task: T141 - All fields required in response"""
        from datetime import datetime, timezone

        with pytest.raises(ValidationError):
            TaskResponse(
                id=1,
                user_id="user123",
                title="Test",
                # Missing: description, completed, created_at, updated_at
            )

        # Valid with all fields
        response = TaskResponse(
            id=1,
            user_id="user123",
            title="Test",
            description=None,
            completed=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        assert response.id == 1
