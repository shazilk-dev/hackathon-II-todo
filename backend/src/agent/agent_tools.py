# Task: T011, T041
"""
Agent Tool Wrappers

@function_tool decorated functions that wrap MCP tools for OpenAI Agents SDK.
These wrappers provide LLM-friendly interfaces with clear docstrings.
"""

import contextvars

from agents import function_tool

from src.mcp.tools import (
    add_task as _add_task_tool,
    complete_task as _complete_task_tool,
    delete_task as _delete_task_tool,
    list_tasks as _list_tasks_tool,
    update_task as _update_task_tool,
)

# @mcp.tool returns a FunctionTool wrapper — extract the raw callable via .fn
mcp_add_task = _add_task_tool.fn
mcp_list_tasks = _list_tasks_tool.fn
mcp_complete_task = _complete_task_tool.fn
mcp_update_task = _update_task_tool.fn
mcp_delete_task = _delete_task_tool.fn

# Context variable for tracking tool calls during a single agent run
_tool_call_log: contextvars.ContextVar[list[dict]] = contextvars.ContextVar(
    "tool_call_log", default=[]
)


def reset_tool_call_log() -> None:
    """Reset the tool call log at the start of a new agent run."""
    _tool_call_log.set([])


def get_tool_call_log() -> list[dict]:
    """Retrieve all tracked tool calls from the current run."""
    return _tool_call_log.get()


def _record(tool: str, args: dict, result: object) -> None:
    """Append a single tool invocation record."""
    _tool_call_log.get().append({"tool": tool, "args": args, "result": result})


@function_tool
def add_task(user_id: str, title: str, description: str | None = None) -> dict:
    """
    Add a new task to the user's todo list.

    Use this when the user wants to create, add, or remember a new task.
    Examples: "Add task to buy groceries", "I need to remember to pay bills"

    Args:
        user_id: The user's unique identifier (required)
        title: The title/name of the task to add (required, 1-200 characters)
        description: Optional additional details about the task

    Returns:
        Dictionary containing:
        - task_id: The unique ID of the created task
        - status: "created" to indicate successful creation
        - title: The title of the created task

        On error, returns:
        - error: Human-readable error message
    """
    result = mcp_add_task(user_id, title, description)
    _record("add_task", {"user_id": user_id, "title": title, "description": description}, result)
    return result


@function_tool
def list_tasks(user_id: str, status: str = "all") -> list[dict]:
    """
    Get the user's tasks from their todo list.

    Use this when the user wants to see, view, check, or review their tasks.
    Examples: "Show me my tasks", "What's on my list?", "What do I need to do?"

    Args:
        user_id: The user's unique identifier (required)
        status: Filter tasks by status (optional, default: "all")
            - "all": Return all tasks
            - "pending": Return only incomplete tasks
            - "completed": Return only finished tasks

    Returns:
        List of task dictionaries, each containing:
        - id: The unique task identifier
        - title: The task title
        - description: The task description (may be null)
        - completed: Boolean indicating completion status
    """
    result = mcp_list_tasks(user_id, status)
    _record("list_tasks", {"user_id": user_id, "status": status}, {"tasks": result})
    return result


@function_tool
def complete_task(user_id: str, task_id: int) -> dict:
    """
    Mark a task as complete/done.

    Use this when the user says they finished, completed, or done with a task.
    Examples: "Mark task 3 as done", "I finished the grocery task", "Complete task 1"

    Args:
        user_id: The user's unique identifier (required)
        task_id: The ID number of the task to mark complete (required)

    Returns:
        Dictionary containing:
        - task_id: The unique ID of the completed task
        - status: "completed" to indicate successful update
        - title: The title of the completed task

        On error, returns:
        - error: Human-readable error message
    """
    result = mcp_complete_task(user_id, task_id)
    _record("complete_task", {"user_id": user_id, "task_id": task_id}, result)
    return result


@function_tool
def update_task(
    user_id: str, task_id: int, title: str | None = None, description: str | None = None
) -> dict:
    """
    Update/modify an existing task's title or description.

    Use this when the user wants to change, update, edit, or rename a task.
    Examples: "Change task 1 to 'Call mom tonight'", "Update the grocery task"

    Args:
        user_id: The user's unique identifier (required)
        task_id: The ID number of the task to update (required)
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
    result = mcp_update_task(user_id, task_id, title, description)
    _record(
        "update_task",
        {"user_id": user_id, "task_id": task_id, "title": title, "description": description},
        result,
    )
    return result


@function_tool
def delete_task(user_id: str, task_id: int) -> dict:
    """
    Delete/remove a task from the todo list.

    Use this when the user wants to delete, remove, or cancel a task.
    Examples: "Delete task 2", "Remove the meeting task", "Cancel task 5"

    Args:
        user_id: The user's unique identifier (required)
        task_id: The ID number of the task to delete (required)

    Returns:
        Dictionary containing:
        - task_id: The unique ID of the deleted task
        - status: "deleted" to indicate successful removal
        - title: The title of the deleted task

        On error, returns:
        - error: Human-readable error message
    """
    result = mcp_delete_task(user_id, task_id)
    _record("delete_task", {"user_id": user_id, "task_id": task_id}, result)
    return result


# Export all tools for agent configuration
ALL_TOOLS = [add_task, list_tasks, complete_task, update_task, delete_task]
