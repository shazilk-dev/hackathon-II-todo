"""
MCP Tools - FastMCP server exposing task management operations.

This module provides 5 stateless tools for AI agent integration:
- add_task: Create a new task
- list_tasks: Retrieve tasks with filtering
- complete_task: Mark task as complete
- update_task: Modify task title/description
- delete_task: Remove task

Tools use synchronous SQLModel sessions with the existing async engine.
All operations enforce user isolation and return consistent dict responses.
"""

import logging
from datetime import UTC, datetime
from typing import Optional

from fastmcp import FastMCP
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlmodel import select

from src.config import settings
from src.models.task import Task

# Configure logging
logger = logging.getLogger(__name__)

# Create synchronous engine from async database URL
# Convert postgresql+asyncpg:// to postgresql+psycopg2:// for sync sessions
# For SQLite, just replace aiosqlite with pysqlite (no conversion needed)
if "sqlite" in settings.database_url.lower():
    # SQLite: no conversion needed, SQLAlchemy handles it
    sync_database_url = settings.database_url
    sync_engine = create_engine(
        sync_database_url,
        echo=settings.debug,
        connect_args={"check_same_thread": False},  # SQLite specific
    )
else:
    # PostgreSQL: convert async driver to sync driver
    # Also convert asyncpg's ssl= param to psycopg2's sslmode= param
    sync_database_url = settings.database_url.replace(
        "postgresql+asyncpg://", "postgresql+psycopg2://"
    ).replace("ssl=require", "sslmode=require")
    # Create sync engine for MCP tools (reuses connection pool settings)
    sync_engine = create_engine(
        sync_database_url,
        echo=settings.debug,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
    )

# Create MCP server instance
mcp = FastMCP("Hackathon Todo MCP Server")


@mcp.tool
def add_task(user_id: str, title: str, description: Optional[str] = None) -> dict:
    """
    Add a new task to the user's todo list.

    Creates a new task with the provided title and optional description.
    The task is initially marked as incomplete with default priority and status.

    Args:
        user_id: The unique identifier of the user (required)
        title: The title of the task, 1-200 characters (required)
        description: Optional description with more details about the task

    Returns:
        Dictionary containing:
        - task_id: The unique ID of the created task
        - status: "created" to indicate successful creation
        - title: The title of the created task

        On error, returns:
        - error: Human-readable error message
    """
    # Validate inputs
    if not title or not title.strip():
        return {"error": "Title is required and cannot be empty"}

    if len(title) > 200:
        return {"error": "Title cannot exceed 200 characters"}

    if description and len(description) > 2000:
        return {"error": "Description cannot exceed 2000 characters"}

    try:
        with Session(sync_engine) as session:
            # Create new task
            task = Task(
                user_id=user_id,
                title=title.strip(),
                description=description.strip() if description else None,
                completed=False,
                status="backlog",
                priority="medium",
            )

            session.add(task)
            session.commit()
            session.refresh(task)

            logger.info(f"Created task {task.id} for user {user_id}")

            return {"task_id": task.id, "status": "created", "title": task.title}

    except Exception as e:
        logger.error(f"Error creating task for user {user_id}: {e}")
        return {"error": "An unexpected error occurred while creating the task"}


@mcp.tool
def list_tasks(user_id: str, status: str = "all") -> list[dict]:
    """
    Retrieve tasks from the user's todo list with optional filtering.

    Returns all tasks, or filters by completion status based on the status parameter.

    Args:
        user_id: The unique identifier of the user (required)
        status: Filter tasks by status (optional, default: "all")
            - "all": Return all tasks
            - "pending": Return only incomplete tasks
            - "completed": Return only completed tasks

    Returns:
        List of task dictionaries, each containing:
        - id: The unique task identifier
        - title: The task title
        - description: The task description (may be null)
        - completed: Boolean indicating completion status

        On error, returns list with single error dict:
        - error: Human-readable error message
    """
    # Validate status parameter
    valid_statuses = ["all", "pending", "completed"]
    if status not in valid_statuses:
        return [{"error": f"Invalid status '{status}'. Must be one of: {valid_statuses}"}]

    try:
        with Session(sync_engine) as session:
            # Build query with user filter
            statement = select(Task).where(Task.user_id == user_id)

            # Apply status filter
            if status == "pending":
                statement = statement.where(Task.completed == False)  # noqa: E712
            elif status == "completed":
                statement = statement.where(Task.completed == True)  # noqa: E712

            # Order by creation date (newest first)
            statement = statement.order_by(Task.created_at.desc())

            tasks = session.execute(statement).scalars().all()

            logger.info(f"Retrieved {len(tasks)} tasks for user {user_id} (status={status})")

            return [
                {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "completed": task.completed,
                }
                for task in tasks
            ]

    except Exception as e:
        logger.error(f"Error listing tasks for user {user_id}: {e}")
        return [{"error": "An unexpected error occurred while retrieving tasks"}]


@mcp.tool
def complete_task(user_id: str, task_id: int) -> dict:
    """
    Mark a task as complete.

    Updates the task's completion status to true. Validates that the user
    owns the task before making the modification.

    Args:
        user_id: The unique identifier of the user (required)
        task_id: The ID of the task to mark as complete (required)

    Returns:
        Dictionary containing:
        - task_id: The unique ID of the completed task
        - status: "completed" to indicate successful update
        - title: The title of the completed task

        On error, returns:
        - error: Human-readable error message
    """
    # Validate task_id
    if task_id <= 0:
        return {"error": "Task ID must be a positive integer"}

    try:
        with Session(sync_engine) as session:
            # Get task
            task = session.get(Task, task_id)

            # Validate ownership (security: prevent cross-user access)
            if not task or task.user_id != user_id:
                return {"error": f"Task {task_id} not found"}

            # Update completion status
            task.completed = True
            task.status = "done"
            task.updated_at = datetime.now(UTC)

            session.add(task)
            session.commit()

            logger.info(f"Completed task {task_id} for user {user_id}")

            return {"task_id": task.id, "status": "completed", "title": task.title}

    except Exception as e:
        logger.error(f"Error completing task {task_id} for user {user_id}: {e}")
        return {"error": "An unexpected error occurred while completing the task"}


@mcp.tool
def update_task(
    user_id: str,
    task_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
) -> dict:
    """
    Update a task's title or description.

    Modifies one or both fields of an existing task. At least one field
    must be provided. Validates user ownership before modification.

    Args:
        user_id: The unique identifier of the user (required)
        task_id: The ID of the task to update (required)
        title: New title for the task (optional)
        description: New description for the task (optional)

    Returns:
        Dictionary containing:
        - task_id: The unique ID of the updated task
        - status: "updated" to indicate successful modification
        - title: The updated title of the task

        On error, returns:
        - error: Human-readable error message
    """
    # Validate task_id
    if task_id <= 0:
        return {"error": "Task ID must be a positive integer"}

    # Validate at least one field provided
    if title is None and description is None:
        return {"error": "At least one field (title or description) must be provided"}

    # Validate title if provided
    if title is not None:
        if not title.strip():
            return {"error": "Title cannot be empty"}
        if len(title) > 200:
            return {"error": "Title cannot exceed 200 characters"}

    # Validate description if provided
    if description is not None and len(description) > 2000:
        return {"error": "Description cannot exceed 2000 characters"}

    try:
        with Session(sync_engine) as session:
            # Get task
            task = session.get(Task, task_id)

            # Validate ownership (security: prevent cross-user access)
            if not task or task.user_id != user_id:
                return {"error": f"Task {task_id} not found"}

            # Update fields
            if title is not None:
                task.title = title.strip()
            if description is not None:
                task.description = description.strip() if description else None

            task.updated_at = datetime.now(UTC)

            session.add(task)
            session.commit()

            logger.info(f"Updated task {task_id} for user {user_id}")

            return {"task_id": task.id, "status": "updated", "title": task.title}

    except Exception as e:
        logger.error(f"Error updating task {task_id} for user {user_id}: {e}")
        return {"error": "An unexpected error occurred while updating the task"}


@mcp.tool
def delete_task(user_id: str, task_id: int) -> dict:
    """
    Delete a task from the user's todo list.

    Permanently removes the task from the database. Validates user ownership
    before deletion. This operation cannot be undone.

    Args:
        user_id: The unique identifier of the user (required)
        task_id: The ID of the task to delete (required)

    Returns:
        Dictionary containing:
        - task_id: The unique ID of the deleted task
        - status: "deleted" to indicate successful removal
        - title: The title of the deleted task

        On error, returns:
        - error: Human-readable error message
    """
    # Validate task_id
    if task_id <= 0:
        return {"error": "Task ID must be a positive integer"}

    try:
        with Session(sync_engine) as session:
            # Get task
            task = session.get(Task, task_id)

            # Validate ownership (security: prevent cross-user access)
            if not task or task.user_id != user_id:
                return {"error": f"Task {task_id} not found"}

            # Store title before deletion
            title = task.title

            # Delete task
            session.delete(task)
            session.commit()

            logger.info(f"Deleted task {task_id} for user {user_id}")

            return {"task_id": task_id, "status": "deleted", "title": title}

    except Exception as e:
        logger.error(f"Error deleting task {task_id} for user {user_id}: {e}")
        return {"error": "An unexpected error occurred while deleting the task"}


# Resource: Get task statistics
@mcp.resource("stats://{user_id}")
def get_stats(user_id: str) -> dict:
    """
    Get task statistics for a user.

    Provides summary metrics about the user's tasks including total count,
    completed count, and pending count.

    Args:
        user_id: The unique identifier of the user

    Returns:
        Dictionary containing:
        - total: Total number of tasks
        - completed: Number of completed tasks
        - pending: Number of pending tasks

        On error, returns:
        - error: Human-readable error message
    """
    try:
        with Session(sync_engine) as session:
            # Get all tasks for user
            statement = select(Task).where(Task.user_id == user_id)
            all_tasks = session.execute(statement).scalars().all()

            total = len(all_tasks)
            completed = sum(1 for t in all_tasks if t.completed)
            pending = total - completed

            logger.info(
                f"Retrieved stats for user {user_id}: "
                f"total={total}, completed={completed}, pending={pending}"
            )

            return {"total": total, "completed": completed, "pending": pending}

    except Exception as e:
        logger.error(f"Error getting stats for user {user_id}: {e}")
        return {"error": "An unexpected error occurred while retrieving statistics"}


# Run server in standalone mode for testing
if __name__ == "__main__":
    mcp.run(transport="http", port=8000)
