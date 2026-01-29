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
        load_tags: bool = True,
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
            load_tags: Whether to eager load tags (prevents N+1 queries)

        Returns:
            List of tasks matching the filters (with tags loaded if load_tags=True)
        """
        from sqlalchemy import case
        from sqlalchemy.orm import selectinload
        from datetime import timedelta
        from src.models.tag import TaskTag, Tag

        # Base query with user isolation
        statement = select(Task).where(Task.user_id == user_id)

        # Eager load tags to prevent N+1 queries (loads all tags in 1 additional query)
        if load_tags:
            statement = statement.options(
                selectinload(Task.task_tags).selectinload(TaskTag.tag_rel)
            )

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
        load_tags: bool = True,
    ) -> Task:
        """
        Task: T043
        Get a specific task with user isolation.

        Args:
            session: Async database session
            user_id: ID of the user (from JWT)
            task_id: ID of the task to retrieve
            load_tags: Whether to eager load tags (prevents N+1 queries)

        Returns:
            The requested task (with tags loaded if load_tags=True)

        Raises:
            TaskNotFoundError: If task doesn't exist or doesn't belong to user
        """
        from sqlalchemy.orm import selectinload
        from src.models.tag import TaskTag

        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id,
        )

        # Eager load tags to prevent N+1 queries
        if load_tags:
            statement = statement.options(
                selectinload(Task.task_tags).selectinload(TaskTag.tag_rel)
            )

        result = await session.execute(statement)
        task = result.scalar_one_or_none()

        if not task:
            raise TaskNotFoundError(task_id, user_id)

        return task

    @staticmethod
    async def _load_task_tags(task: Task):
        """
        Helper to extract tags from pre-loaded task_tags relationship.

        Returns list of Tag objects from the task's task_tags relationship.
        """
        return [task_tag.tag_rel for task_tag in task.task_tags] if task.task_tags else []

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
        task = await TaskService.get_task(session, user_id, task_id, load_tags=False)

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

        # Reload with tags for response (1 additional query for tags)
        return await TaskService.get_task(session, user_id, task_id, load_tags=True)

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
    async def get_tasks_grouped_by_status(
        session: AsyncSession,
        user_id: str,
    ) -> dict[str, list[Task]]:
        """
        Get tasks grouped by status for kanban view.

        Args:
            session: Async database session
            user_id: ID of the user (from JWT)

        Returns:
            Dictionary with status as keys and lists of tasks as values
        """
        tasks = await TaskService.get_tasks(session, user_id, status="all", sort="created")

        grouped: dict[str, list[Task]] = {
            "backlog": [],
            "in_progress": [],
            "blocked": [],
            "done": []
        }

        for task in tasks:
            grouped[task.status].append(task)

        return grouped

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
        task = await TaskService.get_task(session, user_id, task_id, load_tags=False)

        # Track old status to detect completion
        old_completed = task.completed

        # Toggle completion and sync with status
        task.completed = not task.completed
        task.status = "done" if task.completed else "backlog"
        task.updated_at = datetime.utcnow()

        session.add(task)
        await session.commit()

        # Log completion if task was just marked as complete
        if task.completed and not old_completed:
            from src.services.statistics_service import StatisticsService
            await StatisticsService.log_completion(session, user_id, task_id)

        # Reload with tags for response (1 additional query for tags)
        return await TaskService.get_task(session, user_id, task_id, load_tags=True)

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
        task = await TaskService.get_task(session, user_id, task_id, load_tags=False)

        # Track old status to detect completion
        old_status = task.status

        # Update status and sync completed field
        task.status = new_status
        task.completed = (new_status == "done")
        task.updated_at = datetime.utcnow()

        session.add(task)
        await session.commit()

        # Log completion if task was just marked as done
        if new_status == "done" and old_status != "done":
            from src.services.statistics_service import StatisticsService
            await StatisticsService.log_completion(session, user_id, task_id)

        # Reload with tags for response (1 additional query for tags)
        return await TaskService.get_task(session, user_id, task_id, load_tags=True)
