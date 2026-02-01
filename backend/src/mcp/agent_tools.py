"""
Agent Tools - OpenAI Agents SDK wrapper functions.

This module provides @function_tool decorated wrappers around MCP tools
for integration with OpenAI Agents SDK. Each wrapper delegates to the
corresponding MCP tool function.

These wrappers enable the AI agent to call task management operations
through a standardized function tool interface.
"""

from typing import Optional

from agents import function_tool

from src.mcp.tools import (
    add_task as mcp_add_task_tool,
    complete_task as mcp_complete_task_tool,
    delete_task as mcp_delete_task_tool,
    list_tasks as mcp_list_tasks_tool,
    update_task as mcp_update_task_tool,
)

# Extract the underlying callable functions from FastMCP FunctionTool wrappers
mcp_add_task = mcp_add_task_tool.fn
mcp_list_tasks = mcp_list_tasks_tool.fn
mcp_complete_task = mcp_complete_task_tool.fn
mcp_update_task = mcp_update_task_tool.fn
mcp_delete_task = mcp_delete_task_tool.fn


@function_tool
def add_task(user_id: str, title: str, description: Optional[str] = None) -> dict:
    """
    Add a new task to the user's todo list.

    Creates a new task with the provided title and optional description.
    The task is initially marked as incomplete with default priority and status.

    Args:
        user_id: The unique identifier of the user
        title: The title of the task (required)
        description: Optional description with more details

    Returns:
        Dictionary containing task_id, status, and title
    """
    return mcp_add_task(user_id, title, description)


@function_tool
def list_tasks(user_id: str, status: str = "all") -> list[dict]:
    """
    Retrieve tasks from the user's todo list.

    Returns all tasks, or filters by completion status.

    Args:
        user_id: The unique identifier of the user
        status: Filter - "all", "pending", or "completed" (default: "all")

    Returns:
        List of task objects with id, title, description, and completed status
    """
    return mcp_list_tasks(user_id, status)


@function_tool
def complete_task(user_id: str, task_id: int) -> dict:
    """
    Mark a task as complete.

    Updates the task's completion status to true.

    Args:
        user_id: The unique identifier of the user
        task_id: The ID of the task to complete

    Returns:
        Dictionary with task_id, status, and title
    """
    return mcp_complete_task(user_id, task_id)


@function_tool
def update_task(
    user_id: str,
    task_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
) -> dict:
    """
    Update a task's title or description.

    Modifies one or both fields of an existing task.

    Args:
        user_id: The unique identifier of the user
        task_id: The ID of the task to update
        title: New title (optional)
        description: New description (optional)

    Returns:
        Updated task information with task_id, status, and title
    """
    return mcp_update_task(user_id, task_id, title, description)


@function_tool
def delete_task(user_id: str, task_id: int) -> dict:
    """
    Delete a task from the user's todo list.

    Permanently removes the task from the database.

    Args:
        user_id: The unique identifier of the user
        task_id: The ID of the task to delete

    Returns:
        Deleted task information with task_id, status, and title
    """
    return mcp_delete_task(user_id, task_id)


# Export all tools as a list for agent configuration
ALL_TOOLS = [
    add_task,
    list_tasks,
    complete_task,
    update_task,
    delete_task,
]
