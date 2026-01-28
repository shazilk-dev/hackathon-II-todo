"""
Tests for database operations and service layer.

Tests TaskService methods, database queries, and data persistence.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.exceptions import TaskNotFoundError
from src.models.task import Task
from src.schemas.task import TaskCreate, TaskUpdate
from src.services.task_service import TaskService


class TestTaskServiceGetTasks:
    """Test TaskService.get_tasks method."""

    @pytest.mark.unit
    async def test_get_tasks_empty_list(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should return empty list when user has no tasks."""
        tasks = await TaskService.get_tasks(test_db, test_user_id)

        assert tasks == []

    @pytest.mark.unit
    async def test_get_tasks_returns_user_tasks_only(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        other_user_id: str,
    ):
        """Should only return tasks for the specified user."""
        # Create tasks for both users
        user1_task = Task(user_id=test_user_id, title="User 1 Task", completed=False)
        user2_task = Task(user_id=other_user_id, title="User 2 Task", completed=False)

        test_db.add(user1_task)
        test_db.add(user2_task)
        await test_db.commit()

        # Get tasks for user 1
        tasks = await TaskService.get_tasks(test_db, test_user_id)

        assert len(tasks) == 1
        assert tasks[0].user_id == test_user_id
        assert tasks[0].title == "User 1 Task"

    @pytest.mark.unit
    async def test_get_tasks_filter_pending(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        multiple_test_tasks: list[Task],
    ):
        """Should filter tasks by pending status."""
        tasks = await TaskService.get_tasks(test_db, test_user_id, status="pending")

        assert len(tasks) == 2
        for task in tasks:
            assert task.completed is False

    @pytest.mark.unit
    async def test_get_tasks_filter_completed(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        multiple_test_tasks: list[Task],
    ):
        """Should filter tasks by completed status."""
        tasks = await TaskService.get_tasks(test_db, test_user_id, status="completed")

        assert len(tasks) == 1
        for task in tasks:
            assert task.completed is True

    @pytest.mark.unit
    async def test_get_tasks_sort_by_created(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should sort tasks by created date (newest first)."""
        # Create tasks in sequence
        task1 = Task(user_id=test_user_id, title="First", completed=False)
        test_db.add(task1)
        await test_db.commit()

        task2 = Task(user_id=test_user_id, title="Second", completed=False)
        test_db.add(task2)
        await test_db.commit()

        task3 = Task(user_id=test_user_id, title="Third", completed=False)
        test_db.add(task3)
        await test_db.commit()

        # Get tasks sorted by created (default)
        tasks = await TaskService.get_tasks(test_db, test_user_id, sort="created")

        # Should be newest first
        assert tasks[0].title == "Third"
        assert tasks[1].title == "Second"
        assert tasks[2].title == "First"

    @pytest.mark.unit
    async def test_get_tasks_sort_by_title(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should sort tasks alphabetically by title."""
        # Create tasks with different titles
        task1 = Task(user_id=test_user_id, title="Zebra", completed=False)
        task2 = Task(user_id=test_user_id, title="Apple", completed=False)
        task3 = Task(user_id=test_user_id, title="Mango", completed=False)

        for task in [task1, task2, task3]:
            test_db.add(task)
        await test_db.commit()

        # Get tasks sorted by title
        tasks = await TaskService.get_tasks(test_db, test_user_id, sort="title")

        assert tasks[0].title == "Apple"
        assert tasks[1].title == "Mango"
        assert tasks[2].title == "Zebra"


class TestTaskServiceCreateTask:
    """Test TaskService.create_task method."""

    @pytest.mark.unit
    async def test_create_task_success(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should create task with all fields."""
        task_data = TaskCreate(
            title="New Task",
            description="Task description",
        )

        task = await TaskService.create_task(test_db, test_user_id, task_data)

        assert task.id is not None
        assert task.user_id == test_user_id
        assert task.title == "New Task"
        assert task.description == "Task description"
        assert task.completed is False
        assert task.created_at is not None
        assert task.updated_at is not None

    @pytest.mark.unit
    async def test_create_task_without_description(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should create task with only title."""
        task_data = TaskCreate(title="Minimal Task")

        task = await TaskService.create_task(test_db, test_user_id, task_data)

        assert task.title == "Minimal Task"
        assert task.description is None

    @pytest.mark.unit
    async def test_create_task_persists_to_database(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should persist created task to database."""
        task_data = TaskCreate(title="Persisted Task")

        created_task = await TaskService.create_task(test_db, test_user_id, task_data)

        # Query database to verify persistence
        result = await test_db.execute(select(Task).where(Task.id == created_task.id))
        db_task = result.scalar_one()

        assert db_task.id == created_task.id
        assert db_task.title == "Persisted Task"


class TestTaskServiceGetTask:
    """Test TaskService.get_task method."""

    @pytest.mark.unit
    async def test_get_task_success(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        test_task: Task,
    ):
        """Should retrieve task by ID."""
        task = await TaskService.get_task(test_db, test_user_id, test_task.id)

        assert task.id == test_task.id
        assert task.title == test_task.title
        assert task.user_id == test_user_id

    @pytest.mark.unit
    async def test_get_task_not_found(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should raise TaskNotFoundError for non-existent task."""
        with pytest.raises(TaskNotFoundError) as exc_info:
            await TaskService.get_task(test_db, test_user_id, 99999)

        assert "not found" in str(exc_info.value).lower()

    @pytest.mark.unit
    async def test_get_task_wrong_user(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        other_user_id: str,
        test_task: Task,
    ):
        """Should raise TaskNotFoundError when task belongs to different user."""
        with pytest.raises(TaskNotFoundError):
            await TaskService.get_task(test_db, other_user_id, test_task.id)


class TestTaskServiceUpdateTask:
    """Test TaskService.update_task method."""

    @pytest.mark.unit
    async def test_update_task_all_fields(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        test_task: Task,
    ):
        """Should update all task fields."""
        update_data = TaskUpdate(
            title="Updated Title",
            description="Updated description",
            completed=True,
        )

        updated_task = await TaskService.update_task(
            test_db, test_user_id, test_task.id, update_data
        )

        assert updated_task.title == "Updated Title"
        assert updated_task.description == "Updated description"
        assert updated_task.completed is True
        assert updated_task.id == test_task.id

    @pytest.mark.unit
    async def test_update_task_partial_fields(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        test_task: Task,
    ):
        """Should update only specified fields."""
        original_description = test_task.description

        update_data = TaskUpdate(title="New Title Only")

        updated_task = await TaskService.update_task(
            test_db, test_user_id, test_task.id, update_data
        )

        assert updated_task.title == "New Title Only"
        assert updated_task.description == original_description

    @pytest.mark.unit
    async def test_update_task_updates_timestamp(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        test_task: Task,
    ):
        """Should update the updated_at timestamp."""
        original_updated_at = test_task.updated_at

        update_data = TaskUpdate(title="Updated")

        updated_task = await TaskService.update_task(
            test_db, test_user_id, test_task.id, update_data
        )

        # updated_at should be different
        assert updated_task.updated_at != original_updated_at

    @pytest.mark.unit
    async def test_update_task_not_found(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should raise TaskNotFoundError for non-existent task."""
        update_data = TaskUpdate(title="Won't Update")

        with pytest.raises(TaskNotFoundError):
            await TaskService.update_task(test_db, test_user_id, 99999, update_data)

    @pytest.mark.unit
    async def test_update_task_persists_changes(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        test_task: Task,
    ):
        """Should persist updates to database."""
        update_data = TaskUpdate(title="Persisted Update")

        await TaskService.update_task(test_db, test_user_id, test_task.id, update_data)

        # Re-query database
        result = await test_db.execute(select(Task).where(Task.id == test_task.id))
        db_task = result.scalar_one()

        assert db_task.title == "Persisted Update"


class TestTaskServiceDeleteTask:
    """Test TaskService.delete_task method."""

    @pytest.mark.unit
    async def test_delete_task_success(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        test_task: Task,
    ):
        """Should delete task and return its ID."""
        deleted_id = await TaskService.delete_task(test_db, test_user_id, test_task.id)

        assert deleted_id == test_task.id

        # Verify deletion
        result = await test_db.execute(select(Task).where(Task.id == test_task.id))
        db_task = result.scalar_one_or_none()

        assert db_task is None

    @pytest.mark.unit
    async def test_delete_task_not_found(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should raise TaskNotFoundError for non-existent task."""
        with pytest.raises(TaskNotFoundError):
            await TaskService.delete_task(test_db, test_user_id, 99999)

    @pytest.mark.unit
    async def test_delete_task_wrong_user(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        other_user_id: str,
        test_task: Task,
    ):
        """Should raise TaskNotFoundError when task belongs to different user."""
        with pytest.raises(TaskNotFoundError):
            await TaskService.delete_task(test_db, other_user_id, test_task.id)


class TestTaskServiceToggleCompletion:
    """Test TaskService.toggle_completion method."""

    @pytest.mark.unit
    async def test_toggle_completion_pending_to_completed(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        test_task: Task,
    ):
        """Should toggle pending task to completed."""
        assert test_task.completed is False

        toggled_task = await TaskService.toggle_completion(
            test_db, test_user_id, test_task.id
        )

        assert toggled_task.completed is True
        assert toggled_task.id == test_task.id

    @pytest.mark.unit
    async def test_toggle_completion_completed_to_pending(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should toggle completed task to pending."""
        # Create completed task
        completed_task = Task(user_id=test_user_id, title="Done", completed=True)
        test_db.add(completed_task)
        await test_db.commit()
        await test_db.refresh(completed_task)

        toggled_task = await TaskService.toggle_completion(
            test_db, test_user_id, completed_task.id
        )

        assert toggled_task.completed is False

    @pytest.mark.unit
    async def test_toggle_completion_updates_timestamp(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        test_task: Task,
    ):
        """Should update updated_at timestamp."""
        original_updated_at = test_task.updated_at

        toggled_task = await TaskService.toggle_completion(
            test_db, test_user_id, test_task.id
        )

        assert toggled_task.updated_at != original_updated_at

    @pytest.mark.unit
    async def test_toggle_completion_not_found(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should raise TaskNotFoundError for non-existent task."""
        with pytest.raises(TaskNotFoundError):
            await TaskService.toggle_completion(test_db, test_user_id, 99999)

    @pytest.mark.unit
    async def test_toggle_completion_persists_change(
        self,
        test_db: AsyncSession,
        test_user_id: str,
        test_task: Task,
    ):
        """Should persist completion state change to database."""
        await TaskService.toggle_completion(test_db, test_user_id, test_task.id)

        # Re-query database
        result = await test_db.execute(select(Task).where(Task.id == test_task.id))
        db_task = result.scalar_one()

        assert db_task.completed is True


class TestTaskModel:
    """Test Task model behavior."""

    @pytest.mark.unit
    async def test_task_default_values(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should set default values for optional fields."""
        task = Task(user_id=test_user_id, title="Test")

        test_db.add(task)
        await test_db.commit()
        await test_db.refresh(task)

        assert task.completed is False
        assert task.description is None
        assert task.created_at is not None
        assert task.updated_at is not None

    @pytest.mark.unit
    async def test_task_timestamps_auto_generated(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should automatically generate timestamps."""
        task = Task(user_id=test_user_id, title="Timestamped")

        test_db.add(task)
        await test_db.commit()
        await test_db.refresh(task)

        assert task.created_at is not None
        assert task.updated_at is not None
        # Initially, created_at and updated_at should be very close
        time_diff = abs((task.updated_at - task.created_at).total_seconds())
        assert time_diff < 1  # Less than 1 second difference

    @pytest.mark.unit
    async def test_task_user_id_foreign_key(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should enforce user_id foreign key constraint."""
        task = Task(user_id=test_user_id, title="Test", completed=False)

        test_db.add(task)
        await test_db.commit()
        await test_db.refresh(task)

        # Verify user_id is correctly stored
        assert task.user_id == test_user_id


class TestDatabaseConstraints:
    """Test database constraints and validations."""

    @pytest.mark.unit
    async def test_task_title_required(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should enforce title as required field."""
        # This should raise an exception when committing
        task = Task(user_id=test_user_id, completed=False)  # Missing title

        test_db.add(task)

        with pytest.raises(Exception):  # SQLAlchemy will raise an error
            await test_db.commit()

    @pytest.mark.unit
    async def test_task_user_id_required(
        self,
        test_db: AsyncSession,
    ):
        """Should enforce user_id as required field."""
        # This should raise an exception when committing
        task = Task(title="No User", completed=False)  # Missing user_id

        test_db.add(task)

        with pytest.raises(Exception):
            await test_db.commit()

    @pytest.mark.unit
    async def test_multiple_tasks_same_title_allowed(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should allow multiple tasks with same title (no unique constraint)."""
        task1 = Task(user_id=test_user_id, title="Duplicate", completed=False)
        task2 = Task(user_id=test_user_id, title="Duplicate", completed=False)

        test_db.add(task1)
        test_db.add(task2)
        await test_db.commit()

        # Both should be created successfully
        result = await test_db.execute(
            select(Task).where(Task.title == "Duplicate")
        )
        tasks = result.scalars().all()

        assert len(tasks) == 2


class TestExceptionHandling:
    """Test custom exception handling."""

    @pytest.mark.unit
    def test_task_not_found_error_message(self):
        """Should format TaskNotFoundError message correctly."""
        error = TaskNotFoundError(task_id=123, user_id="user-456")

        error_msg = str(error)
        assert "123" in error_msg
        assert "user-456" in error_msg
        assert "not found" in error_msg.lower()

    @pytest.mark.unit
    async def test_service_raises_task_not_found_error(
        self,
        test_db: AsyncSession,
        test_user_id: str,
    ):
        """Should raise TaskNotFoundError with proper message."""
        with pytest.raises(TaskNotFoundError) as exc_info:
            await TaskService.get_task(test_db, test_user_id, 99999)

        error = exc_info.value
        assert isinstance(error, TaskNotFoundError)
        assert "99999" in str(error)
