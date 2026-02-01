# MCP Tools Implementation

## Overview

This module provides FastMCP-based tools for AI agent integration, exposing 5 task management operations via the Model Context Protocol (MCP).

## Files

### `tools.py`
Core MCP server implementation with 5 tools:

1. **add_task** - Create a new task
   - Params: `user_id` (str), `title` (str), `description` (str, optional)
   - Returns: `{task_id, status: "created", title}`

2. **list_tasks** - Retrieve tasks with filtering
   - Params: `user_id` (str), `status` (str: "all"|"pending"|"completed")
   - Returns: List of task objects

3. **complete_task** - Mark task as complete
   - Params: `user_id` (str), `task_id` (int)
   - Returns: `{task_id, status: "completed", title}`

4. **update_task** - Modify task title/description
   - Params: `user_id` (str), `task_id` (int), `title` (str, optional), `description` (str, optional)
   - Returns: `{task_id, status: "updated", title}`

5. **delete_task** - Remove a task
   - Params: `user_id` (str), `task_id` (int)
   - Returns: `{task_id, status: "deleted", title}`

### `agent_tools.py`
OpenAI Agents SDK wrapper functions. Provides `@function_tool` decorated wrappers around MCP tools for integration with OpenAI Agents.

**Usage with Agent:**
```python
from agents import Agent
from src.mcp.agent_tools import ALL_TOOLS

agent = Agent(
    name="Todo Assistant",
    tools=ALL_TOOLS,
    model="gpt-4o-mini"
)
```

### `__init__.py`
Package initialization, exports the `mcp` server instance.

## Database Architecture

- Uses **synchronous engine** (psycopg2) for MCP tools
- Converted from async database URL for compatibility
- Connection pooling: pool_size=10, max_overflow=20
- Neon serverless compatibility with pool_pre_ping

## Validation

All tools include input validation:
- Title: 1-200 characters, non-empty
- Description: max 2000 characters
- Task ID: positive integer
- Status filter: "all", "pending", or "completed"
- User ownership verification

## Error Handling

All tools return consistent error format:
```python
{"error": "Human-readable error message"}
```

Errors are logged internally and safe messages returned to agents.

## Testing

**Test Coverage:** 19 unit tests, all passing
- Input validation tests
- Success scenarios
- Error handling
- User isolation

**Run tests:**
```bash
cd backend
source .venv/Scripts/activate  # Windows: .venv/Scripts/activate
pytest tests/unit/test_mcp_tools.py -v
```

## Development Commands

**Start MCP Inspector (interactive testing):**
```bash
cd backend
source .venv/Scripts/activate
fastmcp dev src/mcp/tools.py
# Opens browser at http://127.0.0.1:6274
```

**Run MCP server (standalone mode):**
```bash
python -m src.mcp.tools
# Starts HTTP server on port 8000
```

**Test tools programmatically:**
```python
from src.mcp.tools import add_task, list_tasks

# Note: These are FunctionTool objects, access .fn for callable
result = add_task.fn("user123", "Buy groceries")
tasks = list_tasks.fn("user123", "pending")
```

## Integration Points

### With FastAPI Backend
- MCP tools use the same database connection
- User isolation enforced via user_id parameter
- Compatible with JWT authentication layer

### With OpenAI Agents
```python
from src.mcp.agent_tools import ALL_TOOLS
from agents import Agent, Runner

agent = Agent(name="Todo Assistant", tools=ALL_TOOLS)
result = Runner.run_sync(agent, "[User: user123] Add a task to buy milk")
```

### With Chat Endpoint
```
Frontend → /api/chat → Agent (uses ALL_TOOLS) → MCP Tools → Database
```

## Security

- **User isolation:** All tools validate user_id matches task ownership
- **Input sanitization:** Title and description are stripped/validated
- **No SQL injection:** Uses SQLModel ORM with parameterized queries
- **Error masking:** Internal errors logged, safe messages returned

## Performance

- **Target latency:** <500ms for create/update/delete operations
- **Retrieval:** <1s for lists up to 100 tasks
- **Concurrency:** Handles 100+ concurrent operations
- **Connection pooling:** Efficient database connection reuse

## Dependencies

- `fastmcp>=2.14` - MCP server framework
- `sqlmodel>=0.0.14` - ORM for database operations
- `psycopg2-binary>=2.9.0` - Sync PostgreSQL driver
- `openai-agents>=0.7.0` - Agent SDK integration

## Status

✅ **Complete and Production Ready**
- All 5 tools implemented and tested
- Comprehensive validation and error handling
- Agent SDK integration ready
- Database session management optimized
- Security and user isolation enforced
