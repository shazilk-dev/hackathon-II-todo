"""
Task: T040, T041, T042, T043, T044, T045, T046
Service layer for task CRUD operations.

Implements business logic isolated from HTTP concerns.
All methods enforce user data isolation.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.exceptions import TaskNotFoundError
from src.models.task import Task
from src.schemas.task import TaskCreate, TaskUpdate


class TaskService:
    """
    Service for task management operations.

    All methods are static and require an async database session.
    Enforces user isolation - users can only access their own tasks.
    """

    @staticmethod
    async def get_tasks(
        session: AsyncSession,
        user_id: str,
        status: str = "all",
        sort: str = "created",
    ) -> list[Task]:
        """
        Task: T041
        Get all tasks for a user with optional filtering and sorting.

        Args:
            session: Async database session
            user_id: ID of the user (from JWT)
            status: Filter by status ('all', 'pending', 'completed')
            sort: Sort order ('created', 'title')

        Returns:
            List of tasks matching the filters
        """
        # Base query with user isolation
        statement = select(Task).where(Task.user_id == user_id)

        # Apply status filter
        if status == "pending":
            statement = statement.where(Task.completed == False)  # noqa: E712
        elif status == "completed":
            statement = statement.where(Task.completed == True)  # noqa: E712

        # Apply sorting
        if sort == "title":
            statement = statement.order_by(Task.title.asc())
        else:  # default: created (newest first)
            statement = statement.order_by(Task.created_at.desc())

        result = await session.execute(statement)
        return list(result.scalars().all())

    @staticmethod
    async def create_task(
        session: AsyncSession,
        user_id: str,
        task_data: TaskCreate,
    ) -> Task:
        """
        Task: T042
        Create a new task for a user.

        Args:
            session: Async database session
            user_id: ID of the user (from JWT)
            task_data: Task creation data

        Returns:
            Created task
        """
        task = Task(
            user_id=user_id,
            title=task_data.title,
            description=task_data.description,
            completed=False,
        )

        session.add(task)
        await session.commit()
        await session.refresh(task)

        return task

    @staticmethod
    async def get_task(
        session: AsyncSession,
        user_id: str,
        task_id: int,
    ) -> Task:
        """
        Task: T043
        Get a specific task with user isolation.

        Args:
            session: Async database session
            user_id: ID of the user (from JWT)
            task_id: ID of the task to retrieve

        Returns:
            The requested task

        Raises:
            TaskNotFoundError: If task doesn't exist or doesn't belong to user
        """
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id,
        )

        result = await session.execute(statement)
        task = result.scalar_one_or_none()

        if not task:
            raise TaskNotFoundError(task_id, user_id)

        return task

    @staticmethod
    async def update_task(
        session: AsyncSession,
        user_id: str,
        task_id: int,
        task_data: TaskUpdate,
    ) -> Task:
        """
        Task: T044
        Update an existing task with user isolation.

        Args:
            session: Async database session
            user_id: ID of the user (from JWT)
            task_id: ID of the task to update
            task_data: Updated task data (partial)

        Returns:
            Updated task

        Raises:
            TaskNotFoundError: If task doesn't exist or doesn't belong to user
        """
        # Get existing task (raises TaskNotFoundError if not found)
        task = await TaskService.get_task(session, user_id, task_id)

        # Apply updates (only non-None fields)
        if task_data.title is not None:
            task.title = task_data.title
        if task_data.description is not None:
            task.description = task_data.description
        if task_data.completed is not None:
            task.completed = task_data.completed

        # Update timestamp
        task.updated_at = datetime.utcnow()

        session.add(task)
        await session.commit()
        await session.refresh(task)

        return task

    @staticmethod
    async def delete_task(
        session: AsyncSession,
        user_id: str,
        task_id: int,
    ) -> int:
        """
        Task: T045
        Delete a task with user isolation.

        Args:
            session: Async database session
            user_id: ID of the user (from JWT)
            task_id: ID of the task to delete

        Returns:
            ID of the deleted task

        Raises:
            TaskNotFoundError: If task doesn't exist or doesn't belong to user
        """
        # Get existing task (raises TaskNotFoundError if not found)
        task = await TaskService.get_task(session, user_id, task_id)

        await session.delete(task)
        await session.commit()

        return task_id

    @staticmethod
    async def toggle_completion(
        session: AsyncSession,
        user_id: str,
        task_id: int,
    ) -> Task:
        """
        Task: T046
        Toggle the completion status of a task.

        Args:
            session: Async database session
            user_id: ID of the user (from JWT)
            task_id: ID of the task to toggle

        Returns:
            Updated task with toggled completion status

        Raises:
            TaskNotFoundError: If task doesn't exist or doesn't belong to user
        """
        # Get existing task (raises TaskNotFoundError if not found)
        task = await TaskService.get_task(session, user_id, task_id)

        # Toggle completion
        task.completed = not task.completed
        task.updated_at = datetime.utcnow()

        session.add(task)
        await session.commit()
        await session.refresh(task)

        return task
