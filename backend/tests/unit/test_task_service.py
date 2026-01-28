"""
Task: T094-T100
Unit tests for TaskService.

Tests business logic with real database (integration style).
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import TaskNotFoundError
from src.models.task import Task
from src.models.user import User
from src.schemas.task import TaskCreate, TaskUpdate
from src.services.task_service import TaskService


@pytest.mark.unit
class TestTaskServiceGetTasks:
    """Tests for TaskService.get_tasks"""

    async def test_get_tasks_returns_all_tasks(
        self,
        test_db: AsyncSession,
        test_user: User,
        multiple_test_tasks: list[Task],
    ) -> None:
        """Task: T094 - Get all tasks for user"""
        tasks = await TaskService.get_tasks(test_db, test_user.id)

        assert len(tasks) == 3
        assert all(t.user_id == test_user.id for t in tasks)

    async def test_get_tasks_filters_by_pending(
        self,
        test_db: AsyncSession,
        test_user: User,
        multiple_test_tasks: list[Task],
    ) -> None:
        """Task: T094 - Filter tasks by pending status"""
        tasks = await TaskService.get_tasks(test_db, test_user.id, status="pending")

        assert len(tasks) == 2
        assert all(not t.completed for t in tasks)

    async def test_get_tasks_filters_by_completed(
        self,
        test_db: AsyncSession,
        test_user: User,
        multiple_test_tasks: list[Task],
    ) -> None:
        """Task: T094 - Filter tasks by completed status"""
        tasks = await TaskService.get_tasks(test_db, test_user.id, status="completed")

        assert len(tasks) == 1
        assert tasks[0].completed is True

    async def test_get_tasks_sorts_by_created(
        self,
        test_db: AsyncSession,
        test_user: User,
        multiple_test_tasks: list[Task],
    ) -> None:
        """Task: T094 - Sort tasks by creation date (newest first)"""
        tasks = await TaskService.get_tasks(test_db, test_user.id, sort="created")

        # Most recently created should be first
        assert tasks[0].title == "Pending Task 2"

    async def test_get_tasks_sorts_by_title(
        self,
        test_db: AsyncSession,
        test_user: User,
        multiple_test_tasks: list[Task],
    ) -> None:
        """Task: T094 - Sort tasks alphabetically by title"""
        tasks = await TaskService.get_tasks(test_db, test_user.id, sort="title")

        titles = [t.title for t in tasks]
        assert titles == sorted(titles)


@pytest.mark.unit
class TestTaskServiceCreateTask:
    """Tests for TaskService.create_task"""

    async def test_create_task_success(
        self,
        test_db: AsyncSession,
        test_user: User,
    ) -> None:
        """Task: T095 - Create a new task"""
        task_data = TaskCreate(title="New Task", description="Test")

        task = await TaskService.create_task(test_db, test_user.id, task_data)

        assert task.id is not None
        assert task.user_id == test_user.id
        assert task.title == "New Task"
        assert task.description == "Test"
        assert task.completed is False

    async def test_create_task_sets_timestamps(
        self,
        test_db: AsyncSession,
        test_user: User,
    ) -> None:
        """Task: T095 - Verify timestamps are set on creation"""
        task_data = TaskCreate(title="New Task")

        task = await TaskService.create_task(test_db, test_user.id, task_data)

        assert task.created_at is not None
        assert task.updated_at is not None


@pytest.mark.unit
class TestTaskServiceGetTask:
    """Tests for TaskService.get_task"""

    async def test_get_task_success(
        self,
        test_db: AsyncSession,
        test_user: User,
        test_task: Task,
    ) -> None:
        """Task: T096 - Get a specific task by ID"""
        task = await TaskService.get_task(test_db, test_user.id, test_task.id)

        assert task.id == test_task.id
        assert task.title == test_task.title

    async def test_get_task_not_found(
        self,
        test_db: AsyncSession,
        test_user: User,
    ) -> None:
        """Task: T096 - Raise error when task doesn't exist"""
        with pytest.raises(TaskNotFoundError) as exc_info:
            await TaskService.get_task(test_db, test_user.id, 99999)

        assert "99999" in str(exc_info.value)

    async def test_get_task_enforces_user_isolation(
        self,
        test_db: AsyncSession,
        test_task: Task,
    ) -> None:
        """Task: T096 - Users can't access other users' tasks"""
        other_user_id = "different-user-456"

        with pytest.raises(TaskNotFoundError):
            await TaskService.get_task(test_db, other_user_id, test_task.id)


@pytest.mark.unit
class TestTaskServiceUpdateTask:
    """Tests for TaskService.update_task"""

    async def test_update_task_title(
        self,
        test_db: AsyncSession,
        test_user: User,
        test_task: Task,
    ) -> None:
        """Task: T097 - Update task title"""
        update_data = TaskUpdate(title="Updated Title")

        task = await TaskService.update_task(test_db, test_user.id, test_task.id, update_data)

        assert task.title == "Updated Title"
        assert task.description == test_task.description  # Unchanged

    async def test_update_task_completion(
        self,
        test_db: AsyncSession,
        test_user: User,
        test_task: Task,
    ) -> None:
        """Task: T097 - Update task completion status"""
        update_data = TaskUpdate(completed=True)

        task = await TaskService.update_task(test_db, test_user.id, test_task.id, update_data)

        assert task.completed is True

    async def test_update_task_updates_timestamp(
        self,
        test_db: AsyncSession,
        test_user: User,
        test_task: Task,
    ) -> None:
        """Task: T097 - Verify updated_at changes on update"""
        original_updated_at = test_task.updated_at
        update_data = TaskUpdate(title="New")

        task = await TaskService.update_task(test_db, test_user.id, test_task.id, update_data)

        assert task.updated_at > original_updated_at


@pytest.mark.unit
class TestTaskServiceDeleteTask:
    """Tests for TaskService.delete_task"""

    async def test_delete_task_success(
        self,
        test_db: AsyncSession,
        test_user: User,
        test_task: Task,
    ) -> None:
        """Task: T098 - Delete a task"""
        task_id = test_task.id

        deleted_id = await TaskService.delete_task(test_db, test_user.id, task_id)

        assert deleted_id == task_id

        # Verify task is gone
        with pytest.raises(TaskNotFoundError):
            await TaskService.get_task(test_db, test_user.id, task_id)

    async def test_delete_task_not_found(
        self,
        test_db: AsyncSession,
        test_user: User,
    ) -> None:
        """Task: T098 - Raise error when deleting non-existent task"""
        with pytest.raises(TaskNotFoundError):
            await TaskService.delete_task(test_db, test_user.id, 99999)


@pytest.mark.unit
class TestTaskServiceToggleCompletion:
    """Tests for TaskService.toggle_completion"""

    async def test_toggle_completion_false_to_true(
        self,
        test_db: AsyncSession,
        test_user: User,
        test_task: Task,
    ) -> None:
        """Task: T099 - Toggle task from pending to completed"""
        assert test_task.completed is False

        task = await TaskService.toggle_completion(test_db, test_user.id, test_task.id)

        assert task.completed is True

    async def test_toggle_completion_true_to_false(
        self,
        test_db: AsyncSession,
        test_user: User,
    ) -> None:
        """Task: T099 - Toggle task from completed to pending"""
        # Create completed task
        completed_task = Task(user_id=test_user.id, title="Done", completed=True)
        test_db.add(completed_task)
        await test_db.commit()
        await test_db.refresh(completed_task)

        task = await TaskService.toggle_completion(test_db, test_user.id, completed_task.id)

        assert task.completed is False

    async def test_toggle_completion_updates_timestamp(
        self,
        test_db: AsyncSession,
        test_user: User,
        test_task: Task,
    ) -> None:
        """Task: T099 - Verify updated_at changes on toggle"""
        original_updated_at = test_task.updated_at

        task = await TaskService.toggle_completion(test_db, test_user.id, test_task.id)

        assert task.updated_at > original_updated_at
