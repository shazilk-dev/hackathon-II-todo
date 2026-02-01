# FastMCP Server Skill

## Skill Invocation

**Trigger when user says:**
- "create MCP server"
- "add MCP tools"
- "expose tools via MCP"
- "implement MCP backend"

**What this skill does:**
Generates a FastMCP server that exposes Python functions as tools for AI agents via the Model Context Protocol (MCP).

**Dependencies:**
- Backend API structure (FastAPI)
- Database models (SQLModel)
- OpenAI Agents SDK integration

---

## Execution Steps

When this skill is invoked, execute these steps in order:

### Step 1: Verify Prerequisites

```bash
# Check backend structure
ls backend/app/models
ls backend/app/database.py

# Check dependencies
cat backend/requirements.txt | grep -E "fastmcp|sqlmodel"
```

**Requirements:**
- FastAPI backend exists
- Database connection configured
- SQLModel models defined (Task, User, etc.)

### Step 2: Install FastMCP

**File:** `backend/requirements.txt`

Add dependency:

```txt
fastmcp>=2.14
```

Install:

```bash
cd backend
pip install fastmcp
# or with uv
uv add fastmcp
```

### Step 3: Create MCP Tools Module

**File:** `backend/app/mcp_tools.py`

**Must include:**
1. FastMCP server instance
2. Tool functions decorated with `@mcp.tool`
3. Clear docstrings with Args and Returns
4. Database session management
5. Error handling in tool responses

**Implementation pattern:**

```python
"""
MCP Tools - Expose task management tools via FastMCP.
"""

from fastmcp import FastMCP
from datetime import datetime
from sqlmodel import Session, select
from typing import Optional

from app.database import engine
from app.models import Task

# Create MCP server
mcp = FastMCP(
    name="Todo MCP Server",
    dependencies=["sqlmodel", "asyncpg"]
)


@mcp.tool
def add_task(user_id: str, title: str, description: str = None) -> dict:
    """
    Add a new task to the user's todo list.

    Args:
        user_id: The unique identifier of the user
        title: The title of the task (required)
        description: Optional description with more details

    Returns:
        Dictionary containing task_id, status, and title
    """
    with Session(engine) as session:
        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            completed=False,
            created_at=datetime.utcnow()
        )
        session.add(task)
        session.commit()
        session.refresh(task)

        return {
            "task_id": task.id,
            "status": "created",
            "title": task.title
        }


@mcp.tool
def list_tasks(user_id: str, status: str = "all") -> list[dict]:
    """
    Retrieve tasks from the user's todo list.

    Args:
        user_id: The unique identifier of the user
        status: Filter tasks by status
            - "all": Return all tasks (default)
            - "pending": Return only incomplete tasks
            - "completed": Return only completed tasks

    Returns:
        List of task objects with id, title, description, and completed status
    """
    with Session(engine) as session:
        statement = select(Task).where(Task.user_id == user_id)

        if status == "pending":
            statement = statement.where(Task.completed == False)
        elif status == "completed":
            statement = statement.where(Task.completed == True)

        tasks = session.exec(statement).all()

        return [
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "completed": task.completed
            }
            for task in tasks
        ]


@mcp.tool
def complete_task(user_id: str, task_id: int) -> dict:
    """
    Mark a task as complete.

    Args:
        user_id: The unique identifier of the user
        task_id: The ID of the task to mark as complete

    Returns:
        Dictionary with task_id, status, and title
        Returns error if task not found
    """
    with Session(engine) as session:
        task = session.get(Task, task_id)

        if not task or task.user_id != user_id:
            return {"error": f"Task {task_id} not found"}

        task.completed = True
        task.updated_at = datetime.utcnow()
        session.add(task)
        session.commit()

        return {
            "task_id": task.id,
            "status": "completed",
            "title": task.title
        }


@mcp.tool
def delete_task(user_id: str, task_id: int) -> dict:
    """
    Delete a task from the user's todo list.

    Args:
        user_id: The unique identifier of the user
        task_id: The ID of the task to delete

    Returns:
        Dictionary with task_id, status, and title of deleted task
        Returns error if task not found
    """
    with Session(engine) as session:
        task = session.get(Task, task_id)

        if not task or task.user_id != user_id:
            return {"error": f"Task {task_id} not found"}

        title = task.title
        session.delete(task)
        session.commit()

        return {
            "task_id": task_id,
            "status": "deleted",
            "title": title
        }


@mcp.tool
def update_task(
    user_id: str,
    task_id: int,
    title: str = None,
    description: str = None
) -> dict:
    """
    Update a task's title or description.

    Args:
        user_id: The unique identifier of the user
        task_id: The ID of the task to update
        title: New title for the task (optional)
        description: New description for the task (optional)

    Returns:
        Dictionary with task_id, status, and updated title
        Returns error if task not found
    """
    with Session(engine) as session:
        task = session.get(Task, task_id)

        if not task or task.user_id != user_id:
            return {"error": f"Task {task_id} not found"}

        if title is not None:
            task.title = title
        if description is not None:
            task.description = description

        task.updated_at = datetime.utcnow()
        session.add(task)
        session.commit()

        return {
            "task_id": task.id,
            "status": "updated",
            "title": task.title
        }


# Resource: Get task statistics
@mcp.resource("stats://{user_id}")
def get_stats(user_id: str) -> dict:
    """Get task statistics for a user."""
    with Session(engine) as session:
        all_tasks = session.exec(
            select(Task).where(Task.user_id == user_id)
        ).all()

        total = len(all_tasks)
        completed = sum(1 for t in all_tasks if t.completed)

        return {
            "total": total,
            "completed": completed,
            "pending": total - completed
        }


# Run server (for standalone mode)
if __name__ == "__main__":
    mcp.run(transport="http", port=8000)
```

### Step 4: Test MCP Server (Standalone)

Run MCP inspector for interactive testing:

```bash
cd backend
fastmcp dev app/mcp_tools.py
```

This opens browser at `http://127.0.0.1:6274` with interactive tool testing.

**Test each tool:**
1. `add_task` - Create a test task
2. `list_tasks` - Verify task appears
3. `complete_task` - Mark as complete
4. `update_task` - Modify task
5. `delete_task` - Remove task

### Step 5: Export Tools for Agent Integration

**File:** `backend/app/agent_tools.py`

Create wrapper functions that import MCP tools for OpenAI Agents:

```python
"""
Agent Tools - Wrapper functions for OpenAI Agents SDK.
"""

from agents import function_tool
from app.mcp_tools import (
    add_task as mcp_add_task,
    list_tasks as mcp_list_tasks,
    complete_task as mcp_complete_task,
    update_task as mcp_update_task,
    delete_task as mcp_delete_task
)


@function_tool
def add_task(user_id: str, title: str, description: str = None) -> dict:
    """
    Add a new task to the user's todo list.

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

    Args:
        user_id: The unique identifier of the user
        status: Filter - "all", "pending", or "completed"

    Returns:
        List of task objects
    """
    return mcp_list_tasks(user_id, status)


@function_tool
def complete_task(user_id: str, task_id: int) -> dict:
    """
    Mark a task as complete.

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
    title: str = None,
    description: str = None
) -> dict:
    """
    Update a task's title or description.

    Args:
        user_id: The unique identifier of the user
        task_id: The ID of the task to update
        title: New title (optional)
        description: New description (optional)

    Returns:
        Updated task information
    """
    return mcp_update_task(user_id, task_id, title, description)


@function_tool
def delete_task(user_id: str, task_id: int) -> dict:
    """
    Delete a task from the user's todo list.

    Args:
        user_id: The unique identifier of the user
        task_id: The ID of the task to delete

    Returns:
        Deleted task information
    """
    return mcp_delete_task(user_id, task_id)


# Export all tools as a list
ALL_TOOLS = [
    add_task,
    list_tasks,
    complete_task,
    update_task,
    delete_task
]
```

### Step 6: Update Project Structure

Ensure files are organized:

```
backend/
├── app/
│   ├── mcp_tools.py        # MCP server and tools
│   ├── agent_tools.py      # Agent wrapper functions
│   ├── models.py           # Database models
│   ├── database.py         # DB connection
│   └── routes/
│       └── chat.py         # Chat endpoint (uses agent)
├── requirements.txt
└── main.py
```

---

## Validation Checklist

After implementation, verify:

- [ ] FastMCP installed in requirements.txt
- [ ] MCP server runs with `fastmcp dev app/mcp_tools.py`
- [ ] All 5 tools defined (add, list, complete, update, delete)
- [ ] Tools have complete docstrings with Args/Returns
- [ ] Type hints on all parameters
- [ ] Database operations use context manager (Session)
- [ ] Error handling returns dict with "error" key
- [ ] Resources defined (stats endpoint)
- [ ] Agent wrapper functions created
- [ ] All tools exported in ALL_TOOLS list

---

## Testing Commands

```bash
# Install FastMCP
cd backend
uv add fastmcp

# Run MCP inspector
fastmcp dev app/mcp_tools.py

# Test tools in browser (http://127.0.0.1:6274)
# 1. Call add_task with user_id="test", title="Test task"
# 2. Call list_tasks with user_id="test"
# 3. Call complete_task with task_id from step 1
# 4. Call delete_task to clean up

# Test programmatically
python
>>> from app.mcp_tools import add_task, list_tasks
>>> result = add_task("test", "My task")
>>> print(result)
>>> tasks = list_tasks("test")
>>> print(tasks)
```

---

## Integration Points

### With openai-agents Skill
- Agent imports tools from `agent_tools.py`
- Uses `ALL_TOOLS` list in agent configuration
- Tools are called automatically by the agent

**Integration code (in agent):**
```python
from agents import Agent
from app.agent_tools import ALL_TOOLS

agent = Agent(
    name="Todo Assistant",
    tools=ALL_TOOLS
)
```

### With FastAPI Backend
- MCP tools use the same database connection
- Can be exposed as HTTP endpoints if needed
- Shares models and validation logic

### With chatkit-frontend Skill
- Frontend calls chat endpoint
- Chat endpoint uses agent
- Agent calls MCP tools
- Response flows back to frontend

**Data flow:**
```
Frontend → /api/chat → Agent → MCP Tools → Database
                ↓         ↓
            Response ← Agent ← Tool Results
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'fastmcp'` | Run `pip install fastmcp` or `uv add fastmcp` |
| Tool not appearing in inspector | Check `@mcp.tool` decorator is present |
| Type validation error | Ensure all parameters have type hints |
| Database connection error | Verify `database.py` exports `engine` |
| "Tool execution failed" | Add try/except, return `{"error": "..."}` |
| Import circular dependency | Keep MCP tools separate from routes |

---

## Best Practices

### Tool Design

**DO:**
- Use descriptive, action-oriented names (`add_task`, not `task_add`)
- Include complete docstrings with Args/Returns sections
- Add type hints for all parameters
- Return consistent dict format
- Handle errors gracefully (return error dict, don't raise)

**DON'T:**
- Mix business logic with tool definitions
- Return bare strings (use dict with keys)
- Forget to validate user ownership
- Raise exceptions (return error info instead)

### Security

```python
@mcp.tool
def secure_tool(user_id: str, resource_id: int) -> dict:
    """Always validate user owns the resource."""
    with Session(engine) as session:
        resource = session.get(Task, resource_id)

        # Validate ownership
        if not resource or resource.user_id != user_id:
            return {"error": "Access denied"}

        # Proceed with operation
        return {"status": "success"}
```

### Error Handling

```python
@mcp.tool
def robust_tool(user_id: str, param: str) -> dict:
    """Return errors as dict, don't raise."""
    # Validate input
    if not param or len(param) < 3:
        return {
            "status": "error",
            "code": "INVALID_INPUT",
            "message": "Parameter must be at least 3 characters"
        }

    try:
        # Main logic
        result = process(param)
        return {"status": "success", "data": result}
    except Exception as e:
        # Log internally, return safe message
        logger.error(f"Error: {e}")
        return {
            "status": "error",
            "code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred"
        }
```

---

## Optional Enhancements

After basic implementation works:

### 1. Add Context and Logging

```python
from fastmcp import FastMCP, Context

@mcp.tool
async def tool_with_logging(data: str, ctx: Context) -> dict:
    """Tool with progress reporting."""
    await ctx.info(f"Processing: {data}")
    await ctx.report_progress(0, 100)

    # Process...

    await ctx.report_progress(100, 100)
    await ctx.info("Complete")
    return {"result": data}
```

### 2. Add Async Tools

```python
import httpx

@mcp.tool
async def async_tool(url: str) -> dict:
    """Async I/O operation."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return {"status": response.status_code}
```

### 3. Add Authentication

```python
from fastmcp.server.auth import BearerAuthProvider

auth = BearerAuthProvider(token="your-secret-token")
mcp = FastMCP("Authenticated Server", auth=auth)
```

### 4. HTTP Server Mode

Run as standalone HTTP server:

```python
if __name__ == "__main__":
    mcp.run(transport="http", port=8000)
```

Then connect via HTTP client:

```python
from fastmcp import Client

async with Client("http://localhost:8000/mcp") as client:
    result = await client.call_tool("add_task", {...})
```

---

## Tool Design Template

When adding new tools, follow this template:

```python
@mcp.tool
def action_resource(
    user_id: str,
    resource_id: int,
    optional_param: str = None
) -> dict:
    """
    Single-sentence description of what this tool does.

    Longer explanation if needed. Explain when to use this tool
    and what the expected outcome is.

    Args:
        user_id: The unique identifier of the user (always required)
        resource_id: ID of the resource to act upon
        optional_param: Optional parameter description

    Returns:
        Dictionary with:
        - status: "success" or "error"
        - data: Result data (if success)
        - error/message: Error details (if error)
    """
    # Validate inputs
    if not user_id:
        return {"status": "error", "message": "user_id required"}

    # Database operation
    with Session(engine) as session:
        # Get resource
        resource = session.get(Resource, resource_id)

        # Validate ownership
        if not resource or resource.user_id != user_id:
            return {"status": "error", "message": "Not found"}

        # Perform action
        try:
            # ... operation ...
            session.commit()
            return {"status": "success", "data": {...}}
        except Exception as e:
            return {"status": "error", "message": str(e)}
```

---

## References

- [FastMCP Documentation](https://gofastmcp.com/)
- [FastMCP GitHub](https://github.com/jlowin/fastmcp)
- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP Inspector Guide](https://gofastmcp.com/docs/inspector)
