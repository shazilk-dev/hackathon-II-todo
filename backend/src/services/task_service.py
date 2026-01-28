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
        priority_filter: Optional[str] = None,
        due_date_filter: Optional[str] = None,
        tag_filter: Optional[list[int]] = None,
    ) -> list[Task]:
        """
        Task: T041
        Get all tasks for a user with optional filtering and sorting.

        Args:
            session: Async database session
            user_id: ID of the user (from JWT)
            status: Filter by status ('all', 'pending', 'completed')
            sort: Sort order ('created', 'title', 'priority', 'due_date')
            priority_filter: Filter by priority ('low', 'medium', 'high', 'critical')
            due_date_filter: Filter by due date ('overdue', 'today', 'this_week', 'all')
            tag_filter: Filter by tag IDs (tasks with ANY of these tags)

        Returns:
            List of tasks matching the filters
        """
        from sqlalchemy import case
        from datetime import timedelta
        from src.models.tag import TaskTag

        # Base query with user isolation
        statement = select(Task).where(Task.user_id == user_id)

        # Apply tag filter (tasks with any of the specified tags)
        if tag_filter and len(tag_filter) > 0:
            statement = statement.join(TaskTag, TaskTag.task_id == Task.id).where(
                TaskTag.tag_id.in_(tag_filter)
            ).distinct()

        # Apply status filter
        # Support both old (pending/completed) and new (backlog/in_progress/blocked/done) filters
        if status == "pending":
            statement = statement.where(Task.completed == False)  # noqa: E712
        elif status == "completed":
            statement = statement.where(Task.completed == True)  # noqa: E712
        elif status in ["backlog", "in_progress", "blocked", "done"]:
            # Direct status filtering
            statement = statement.where(Task.status == status)

        # Apply priority filter
        if priority_filter and priority_filter in ["low", "medium", "high", "critical"]:
            statement = statement.where(Task.priority == priority_filter)

        # Apply due date filter
        if due_date_filter:
            now = datetime.utcnow()
            if due_date_filter == "overdue":
                statement = statement.where(
                    Task.due_date != None,  # noqa: E711
                    Task.due_date < now
                )
            elif due_date_filter == "today":
                today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                today_end = today_start + timedelta(days=1)
                statement = statement.where(
                    Task.due_date != None,  # noqa: E711
                    Task.due_date >= today_start,
                    Task.due_date < today_end
                )
            elif due_date_filter == "this_week":
                week_end = now + timedelta(days=7)
                statement = statement.where(
                    Task.due_date != None,  # noqa: E711
                    Task.due_date >= now,
                    Task.due_date <= week_end
                )

        # Apply sorting
        if sort == "title":
            statement = statement.order_by(Task.title.asc())
        elif sort == "priority":
            # Sort by priority: critical > high > medium > low
            priority_order = case(
                (Task.priority == "critical", 1),
                (Task.priority == "high", 2),
                (Task.priority == "medium", 3),
                (Task.priority == "low", 4),
                else_=5
            )
            statement = statement.order_by(priority_order.asc())
        elif sort == "due_date":
            # Sort by due date, nulls last
            statement = statement.order_by(Task.due_date.asc().nullslast())
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
            due_date=task_data.due_date,
            priority=task_data.priority,
            status=task_data.status,
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
            # Sync status with completed for backwards compatibility
            task.status = "done" if task_data.completed else "backlog"
        if task_data.due_date is not None:
            task.due_date = task_data.due_date
        if task_data.priority is not None:
            task.priority = task_data.priority
        if task_data.status is not None:
            task.status = task_data.status
            # Sync completed with status for backwards compatibility
            task.completed = (task_data.status == "done")

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

        Maps to status changes: done ↔ backlog

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

        # Toggle completion and sync with status
        task.completed = not task.completed
        task.status = "done" if task.completed else "backlog"
        task.updated_at = datetime.utcnow()

        session.add(task)
        await session.commit()
        await session.refresh(task)

        return task

    @staticmethod
    async def change_status(
        session: AsyncSession,
        user_id: str,
        task_id: int,
        new_status: str,
    ) -> Task:
        """
        Change the status of a task.

        Args:
            session: Async database session
            user_id: ID of the user (from JWT)
            task_id: ID of the task to update
            new_status: New status value (backlog, in_progress, blocked, done)

        Returns:
            Updated task with new status

        Raises:
            TaskNotFoundError: If task doesn't exist or doesn't belong to user
        """
        # Get existing task (raises TaskNotFoundError if not found)
        task = await TaskService.get_task(session, user_id, task_id)

        # Update status and sync completed field
        task.status = new_status
        task.completed = (new_status == "done")
        task.updated_at = datetime.utcnow()

        session.add(task)
        await session.commit()
        await session.refresh(task)

        return task
