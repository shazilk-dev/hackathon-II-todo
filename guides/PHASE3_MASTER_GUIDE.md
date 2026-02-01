# 🤖 Phase III: AI-Powered Todo Chatbot
## Complete Step-by-Step Guide

**Points: 200 | Technology: OpenAI Agents SDK, Official MCP SDK (FastMCP), OpenAI ChatKit**

---

## Table of Contents

1. [Phase Overview](#phase-overview)
2. [Architecture Deep Dive](#architecture-deep-dive)
3. [Technology Stack (Latest 2025-2026)](#technology-stack-latest-2025-2026)
4. [Project Structure](#project-structure)
5. [Pre-Setup: Skills & Subagents](#pre-setup-skills--subagents)
6. [Step 1: Create Specifications](#step-1-create-specifications)
7. [Step 2: Build MCP Server](#step-2-build-mcp-server)
8. [Step 3: Build OpenAI Agent](#step-3-build-openai-agent)
9. [Step 4: Create Chat Endpoint](#step-4-create-chat-endpoint)
10. [Step 5: Build ChatKit Frontend](#step-5-build-chatkit-frontend)
11. [Step 6: Database Models](#step-6-database-models)
12. [Step 7: Testing](#step-7-testing)
13. [Step 8: Deployment](#step-8-deployment)
14. [Verification Checklist](#verification-checklist)

---

## Phase Overview

### What You're Building

Transform Phase II web app into an **AI-powered chatbot** that manages todos through natural language:

```
User: "Add a task to buy groceries"
AI: "✅ I've added 'Buy groceries' to your task list!"

User: "What's on my list?"
AI: "You have 3 tasks: 1. Buy groceries (pending), 2. Call mom (pending), 3. Finish report (completed)"

User: "Mark the groceries task as done"
AI: "✅ 'Buy groceries' has been marked as complete!"
```

### Key Requirements (from Hackathon PDF)

| Requirement | Description |
|-------------|-------------|
| **OpenAI Agents SDK** | AI logic with function tools |
| **Official MCP SDK** | MCP server exposing task operations |
| **OpenAI ChatKit** | Frontend chat UI |
| **Stateless Backend** | Conversation state persisted to database |
| **5 MCP Tools** | add_task, list_tasks, complete_task, delete_task, update_task |

### MCP Tools Specification

| Tool | Purpose | Parameters |
|------|---------|------------|
| `add_task` | Create new task | user_id, title, description? |
| `list_tasks` | Get tasks | user_id, status (all/pending/completed) |
| `complete_task` | Mark complete | user_id, task_id |
| `delete_task` | Remove task | user_id, task_id |
| `update_task` | Modify task | user_id, task_id, title?, description? |

---

## Architecture Deep Dive

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                                   │
│                      (OpenAI ChatKit React UI)                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ POST /api/{user_id}/chat
                                    │ { message: "Add task..." }
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI SERVER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    CHAT ENDPOINT                                     ││
│  │   1. Receive user message                                           ││
│  │   2. Fetch conversation history from DB                             ││
│  │   3. Store user message in DB                                       ││
│  │   4. Build message array for agent                                  ││
│  └──────────────────────────┬──────────────────────────────────────────┘│
│                             │                                            │
│                             ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                 OPENAI AGENTS SDK                                    ││
│  │   Agent(                                                            ││
│  │     name="Todo Assistant",                                          ││
│  │     instructions="Help manage todos...",                            ││
│  │     tools=[add_task, list_tasks, complete_task, ...]               ││
│  │   )                                                                 ││
│  │                                                                     ││
│  │   Runner.run_sync(agent, messages) → AI decides which tools to use ││
│  └──────────────────────────┬──────────────────────────────────────────┘│
│                             │ Tool calls                                 │
│                             ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    MCP SERVER (FastMCP)                             ││
│  │   @mcp.tool                                                         ││
│  │   def add_task(user_id, title, description) → Task                  ││
│  │                                                                     ││
│  │   @mcp.tool                                                         ││
│  │   def list_tasks(user_id, status) → List[Task]                      ││
│  │                                                                     ││
│  │   Each tool performs DB operations via SQLModel                     ││
│  └──────────────────────────┬──────────────────────────────────────────┘│
└─────────────────────────────┼───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NEON SERVERLESS POSTGRESQL                            │
│                                                                          │
│   Tables: tasks, conversations, messages, users (from Phase II)          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Stateless Request Flow

```
1. User sends message via ChatKit
2. Backend receives POST /api/{user_id}/chat
3. Fetch conversation history from DB
4. Build message array: [history..., new_user_message]
5. Store user message in messages table
6. Create Agent with MCP tools
7. Run Agent with message array
8. Agent invokes MCP tool(s) as needed
9. MCP tools perform DB operations
10. Agent generates response
11. Store assistant response in messages table
12. Return response to ChatKit
13. Server holds NO state (stateless!)
```

### Why Stateless Architecture?

| Benefit | Description |
|---------|-------------|
| **Scalability** | Any server instance can handle any request |
| **Resilience** | Server restarts don't lose conversation state |
| **Horizontal Scaling** | Load balancer can route to any backend |
| **Testability** | Each request is independent and reproducible |

---

## Technology Stack (Latest 2025-2026)

### Core Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **AI Framework** | OpenAI Agents SDK | 0.6.5+ | Agent logic, tool orchestration |
| **MCP Server** | FastMCP | 2.14+ | Expose task operations as MCP tools |
| **Frontend** | OpenAI ChatKit | Latest | Chat UI components |
| **Backend** | FastAPI | 0.115+ | API endpoints |
| **ORM** | SQLModel | 0.0.22+ | Database operations |
| **Database** | Neon PostgreSQL | - | Serverless PostgreSQL |
| **Auth** | Better Auth + JWT | - | From Phase II |

### OpenAI Agents SDK Key Concepts

```python
from agents import Agent, Runner, function_tool

# 1. Define tools using @function_tool decorator
@function_tool
def add_task(user_id: str, title: str) -> dict:
    """Add a new task for the user."""
    # Tool logic here
    return {"task_id": 1, "status": "created"}

# 2. Create Agent with tools
agent = Agent(
    name="Todo Assistant",
    instructions="You help users manage their todo list...",
    tools=[add_task, list_tasks, complete_task, ...]
)

# 3. Run agent with user input
result = Runner.run_sync(agent, "Add a task to buy groceries")
print(result.final_output)
```

### FastMCP Key Concepts

```python
from fastmcp import FastMCP

# Create MCP server
mcp = FastMCP("Todo MCP Server")

# Define tools with @mcp.tool decorator
@mcp.tool
def add_task(user_id: str, title: str, description: str = None) -> dict:
    """
    Add a new task to the user's todo list.
    
    Args:
        user_id: The ID of the user
        title: Title of the task (required)
        description: Optional description
    
    Returns:
        Task object with id, status, and title
    """
    # Create task in database
    task = Task(user_id=user_id, title=title, description=description)
    # ... save to DB
    return {"task_id": task.id, "status": "created", "title": task.title}

# Run server
if __name__ == "__main__":
    mcp.run(transport="stdio")  # or transport="http"
```

---

## Project Structure

### Phase III Directory Layout

```
hackathon-todo/
├── .claude/
│   ├── skills/
│   │   ├── openai-agents/
│   │   │   └── SKILL.md           # OpenAI Agents SDK patterns
│   │   ├── fastmcp-server/
│   │   │   └── SKILL.md           # FastMCP MCP server patterns
│   │   └── chatkit-frontend/
│   │       └── SKILL.md           # OpenAI ChatKit patterns
│   └── agents/
│       ├── mcp-validator.md       # Validate MCP tools
│       └── chatbot-tester.md      # Test chatbot functionality
├── .spec-kit/
│   └── config.yaml
├── specs/
│   ├── overview.md
│   ├── features/
│   │   ├── ai-chatbot.md          # Chatbot feature spec
│   │   └── mcp-tools.md           # MCP tools spec
│   ├── api/
│   │   └── chat-endpoint.md       # Chat API spec
│   └── database/
│       └── conversation-schema.md # New tables
├── frontend/                       # ChatKit React App
│   ├── CLAUDE.md
│   ├── package.json
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── chat/
│   │       └── page.tsx           # ChatKit page
│   ├── components/
│   │   └── ChatInterface.tsx      # ChatKit wrapper
│   └── lib/
│       └── chatkit-client.ts      # ChatKit API client
├── backend/
│   ├── CLAUDE.md
│   ├── pyproject.toml
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI app
│   │   ├── config.py              # Settings
│   │   ├── database.py            # DB connection
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── task.py            # From Phase II
│   │   │   ├── conversation.py    # NEW: Conversation model
│   │   │   └── message.py         # NEW: Message model
│   │   ├── mcp/
│   │   │   ├── __init__.py
│   │   │   ├── server.py          # FastMCP server
│   │   │   └── tools.py           # MCP tool implementations
│   │   ├── agent/
│   │   │   ├── __init__.py
│   │   │   ├── todo_agent.py      # OpenAI Agent definition
│   │   │   └── tools.py           # Agent function tools
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── tasks.py           # From Phase II
│   │   │   └── chat.py            # NEW: Chat endpoint
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── task.py
│   │       └── chat.py            # NEW: Chat schemas
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_mcp_tools.py      # MCP tool tests
│       └── test_chat.py           # Chat endpoint tests
├── CLAUDE.md
├── docker-compose.yml
└── README.md
```

---

## Pre-Setup: Skills & Subagents

### Step 0.1: Create Skills Directory

```bash
cd /mnt/f/PROJECTS/hackathone-II/hackathon-todo

# Create Phase 3 skills directories
mkdir -p .claude/skills/openai-agents
mkdir -p .claude/skills/fastmcp-server
mkdir -p .claude/skills/chatkit-frontend

# Create agents directory (if not exists)
mkdir -p .claude/agents
```

### Step 0.2: Copy Skill Files

Copy the provided skill files:
- `SKILL_openai_agents.md` → `.claude/skills/openai-agents/SKILL.md`
- `SKILL_fastmcp_server.md` → `.claude/skills/fastmcp-server/SKILL.md`
- `SKILL_chatkit_frontend.md` → `.claude/skills/chatkit-frontend/SKILL.md`

### Step 0.3: Copy Subagent Files

- `AGENT_mcp_validator.md` → `.claude/agents/mcp-validator.md`
- `AGENT_chatbot_tester.md` → `.claude/agents/chatbot-tester.md`

---

## Step 1: Create Specifications

### 1.1 Start Claude Code

```bash
cd /mnt/f/PROJECTS/hackathone-II/hackathon-todo
claude
```

### 1.2 Update Constitution for Phase III

```
/sp.constitution

Prompt:
Update constitution for Phase III AI Chatbot.

Phase III Principles:
- Conversational interface for todo management
- Natural language understanding via OpenAI Agents SDK
- MCP server architecture for tool operations
- Stateless backend with DB-persisted conversations
- ChatKit frontend for chat UI

Tech stack additions:
- OpenAI Agents SDK (openai-agents 0.6.5+)
- FastMCP for MCP server (fastmcp 2.14+)
- OpenAI ChatKit (@openai/chatkit-react)

Key patterns:
- @function_tool decorator for agent tools
- @mcp.tool decorator for MCP tools
- Stateless request/response cycle
- Conversation history stored in database

Constraints:
- All task operations go through MCP tools
- Agent must confirm actions with friendly responses
- Handle errors gracefully
- Support conversation resumption after server restart
```

### 1.3 Create AI Chatbot Feature Spec

```
/sp.specify

Prompt:
Create specification for AI Chatbot feature.

Feature: Natural Language Todo Management

User Stories:
1. As a user, I can chat with an AI assistant to manage my tasks
2. As a user, I can add tasks using natural language ("Add task to buy groceries")
3. As a user, I can view my tasks by asking ("What's on my list?")
4. As a user, I can complete tasks ("Mark task 3 as done")
5. As a user, I can delete tasks ("Remove the grocery task")
6. As a user, I can update tasks ("Change task 1 to 'Call mom tonight'")
7. As a user, my conversation history persists across sessions

Natural Language Examples:
| User Says | Agent Action |
|-----------|--------------|
| "Add a task to buy groceries" | add_task("Buy groceries") |
| "Show me all my tasks" | list_tasks(status="all") |
| "What's pending?" | list_tasks(status="pending") |
| "Mark task 3 as complete" | complete_task(task_id=3) |
| "Delete the meeting task" | list_tasks() → delete_task(task_id) |
| "I need to remember to pay bills" | add_task("Pay bills") |

Agent Behavior:
- Always confirm actions with friendly response
- Handle ambiguous requests by asking clarification
- Handle errors gracefully
- Never expose internal errors to user

Save to: specs/features/ai-chatbot.md
```

### 1.4 Create MCP Tools Spec

```
/sp.specify

Prompt:
Create specification for MCP Tools.

Feature: MCP Server with Task Operations

MCP Server: FastMCP-based server exposing 5 tools

Tool 1: add_task
- Purpose: Create a new task
- Parameters:
  - user_id (string, required): User's ID
  - title (string, required): Task title
  - description (string, optional): Task description
- Returns: {task_id, status: "created", title}
- Example: add_task("user123", "Buy groceries", "Milk, eggs, bread")

Tool 2: list_tasks
- Purpose: Retrieve user's tasks
- Parameters:
  - user_id (string, required): User's ID
  - status (string, optional): "all" | "pending" | "completed"
- Returns: Array of task objects
- Example: list_tasks("user123", "pending")

Tool 3: complete_task
- Purpose: Mark task as complete
- Parameters:
  - user_id (string, required): User's ID
  - task_id (integer, required): Task ID
- Returns: {task_id, status: "completed", title}
- Example: complete_task("user123", 3)

Tool 4: delete_task
- Purpose: Remove a task
- Parameters:
  - user_id (string, required): User's ID
  - task_id (integer, required): Task ID
- Returns: {task_id, status: "deleted", title}
- Example: delete_task("user123", 2)

Tool 5: update_task
- Purpose: Modify task title/description
- Parameters:
  - user_id (string, required): User's ID
  - task_id (integer, required): Task ID
  - title (string, optional): New title
  - description (string, optional): New description
- Returns: {task_id, status: "updated", title}
- Example: update_task("user123", 1, "Buy groceries and fruits")

Error Handling:
- Task not found: Return error message for agent
- Invalid parameters: Return validation error
- Database errors: Log and return generic error

Save to: specs/features/mcp-tools.md
```

### 1.5 Create Chat API Spec

```
/sp.specify

Prompt:
Create specification for Chat API endpoint.

Feature: Chat Endpoint

Endpoint: POST /api/{user_id}/chat

Request Body:
{
  "conversation_id": integer | null,  // Existing conversation or null for new
  "message": string                   // User's natural language message
}

Response:
{
  "conversation_id": integer,         // The conversation ID
  "response": string,                 // AI assistant's response
  "tool_calls": [                     // List of MCP tools invoked
    {
      "tool": "add_task",
      "args": {"title": "Buy groceries"},
      "result": {"task_id": 5, "status": "created"}
    }
  ]
}

Request Flow:
1. Validate JWT token (from Authorization header)
2. If conversation_id is null, create new conversation
3. Fetch conversation history from messages table
4. Store user message in messages table
5. Build message array for OpenAI Agent
6. Run agent with MCP tools
7. Agent processes and invokes tools as needed
8. Store assistant response in messages table
9. Return response with tool_calls info

Error Responses:
- 400: Invalid request body
- 401: Missing/invalid JWT
- 403: User ID mismatch
- 500: Server error

Save to: specs/api/chat-endpoint.md
```

### 1.6 Create Conversation Schema Spec

```
/sp.specify

Prompt:
Create database schema specification for conversations.

Database: Neon PostgreSQL (extending Phase II schema)

New Tables:

1. conversations
   - id: SERIAL PRIMARY KEY
   - user_id: TEXT NOT NULL (references users.id)
   - created_at: TIMESTAMP DEFAULT NOW()
   - updated_at: TIMESTAMP DEFAULT NOW()

2. messages
   - id: SERIAL PRIMARY KEY
   - conversation_id: INTEGER REFERENCES conversations(id)
   - user_id: TEXT NOT NULL
   - role: VARCHAR(20) NOT NULL ("user" | "assistant")
   - content: TEXT NOT NULL
   - tool_calls: JSONB (optional, for assistant messages)
   - created_at: TIMESTAMP DEFAULT NOW()

Indexes:
   - conversations.user_id (for filtering by user)
   - messages.conversation_id (for fetching history)
   - messages.created_at (for ordering)

Relationships:
   - conversations belongs_to users
   - messages belongs_to conversations

Save to: specs/database/conversation-schema.md
```

---

## Step 2: Build MCP Server

### 2.1 Generate MCP Server Plan

```
/sp.plan

Prompt:
Create technical plan for FastMCP server implementation.

Reference specs:
- @specs/features/mcp-tools.md

Requirements:
- Use FastMCP (fastmcp package, not mcp.server.fastmcp)
- Implement 5 tools: add_task, list_tasks, complete_task, delete_task, update_task
- Each tool performs database operations via SQLModel
- Tools are stateless - no in-memory state
- Proper error handling and logging

Architecture:
- MCP server runs as part of FastAPI process (not separate)
- Tools imported into OpenAI Agent as function_tool
- Database operations use existing SQLModel setup

Follow patterns from:
- @.claude/skills/fastmcp-server/SKILL.md

Output to: specs/plans/mcp-server-plan.md
```

### 2.2 Implement MCP Tools

```
/sp.implement

Prompt:
Implement MCP server tools based on @specs/plans/mcp-server-plan.md

Create backend/src/mcp/tools.py with:
1. Database session management
2. add_task tool
3. list_tasks tool
4. complete_task tool
5. delete_task tool
6. update_task tool

Key patterns:
- Use SQLModel for DB operations
- Return dictionaries with task info
- Include proper docstrings for agent understanding
- Handle errors gracefully

Follow patterns from:
- @.claude/skills/fastmcp-server/SKILL.md
- @.claude/skills/openai-agents/SKILL.md
```

### 2.3 Key MCP Tools Implementation

**backend/src/mcp/tools.py:**

```python
"""
MCP Tools for Todo Task Operations.

These tools are used by the OpenAI Agent to manage user tasks.
Each tool performs database operations and returns structured results.
"""

from datetime import datetime
from sqlmodel import Session, select
from src.database import engine
from src.models.task import Task


def add_task(user_id: str, title: str, description: str = None) -> dict:
    """
    Add a new task to the user's todo list.
    
    Args:
        user_id: The unique identifier of the user
        title: The title of the task (required)
        description: Optional description of the task
    
    Returns:
        Dictionary with task_id, status, and title
    """
    with Session(engine) as session:
        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            completed=False
        )
        session.add(task)
        session.commit()
        session.refresh(task)
        
        return {
            "task_id": task.id,
            "status": "created",
            "title": task.title
        }


def list_tasks(user_id: str, status: str = "all") -> list[dict]:
    """
    Retrieve tasks from the user's todo list.
    
    Args:
        user_id: The unique identifier of the user
        status: Filter by status - "all", "pending", or "completed"
    
    Returns:
        List of task objects with id, title, description, completed status
    """
    with Session(engine) as session:
        statement = select(Task).where(Task.user_id == user_id)
        
        if status == "pending":
            statement = statement.where(Task.completed == False)
        elif status == "completed":
            statement = statement.where(Task.completed == True)
        
        statement = statement.order_by(Task.created_at.desc())
        tasks = session.exec(statement).all()
        
        return [
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "created_at": task.created_at.isoformat()
            }
            for task in tasks
        ]


def complete_task(user_id: str, task_id: int) -> dict:
    """
    Mark a task as complete.
    
    Args:
        user_id: The unique identifier of the user
        task_id: The ID of the task to complete
    
    Returns:
        Dictionary with task_id, status, and title
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


def delete_task(user_id: str, task_id: int) -> dict:
    """
    Delete a task from the user's todo list.
    
    Args:
        user_id: The unique identifier of the user
        task_id: The ID of the task to delete
    
    Returns:
        Dictionary with task_id, status, and title
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
        Dictionary with task_id, status, and title
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
```

---

## Step 3: Build OpenAI Agent

### 3.1 Generate Agent Plan

```
/sp.plan

Prompt:
Create technical plan for OpenAI Agent implementation.

Reference specs:
- @specs/features/ai-chatbot.md
- @specs/features/mcp-tools.md

Requirements:
- Use OpenAI Agents SDK (openai-agents package)
- Create Agent with instructions for todo management
- Register MCP tools as function_tool decorated functions
- Handle conversation context
- Generate friendly, helpful responses

Agent Configuration:
- Name: "Todo Assistant"
- Model: gpt-4o or gpt-4o-mini
- Tools: 5 MCP tool functions

Follow patterns from:
- @.claude/skills/openai-agents/SKILL.md

Output to: specs/plans/agent-plan.md
```

### 3.2 Implement Todo Agent

```
/sp.implement

Prompt:
Implement Todo Agent based on @specs/plans/agent-plan.md

Create backend/src/agent/todo_agent.py with:
1. Import function_tool decorator from agents
2. Wrap MCP tools with @function_tool
3. Create Agent with instructions
4. Function to run agent with conversation history

Key patterns:
- Use @function_tool to expose tools to agent
- Include detailed docstrings for tool descriptions
- Agent instructions guide behavior
- Return structured results

Follow patterns from:
- @.claude/skills/openai-agents/SKILL.md
```

### 3.3 Key Agent Implementation

**backend/src/agent/todo_agent.py:**

```python
"""
Todo Assistant Agent using OpenAI Agents SDK.

This agent handles natural language todo management through MCP tools.
"""

from agents import Agent, Runner, function_tool
from src.mcp.tools import (
    add_task as mcp_add_task,
    list_tasks as mcp_list_tasks,
    complete_task as mcp_complete_task,
    delete_task as mcp_delete_task,
    update_task as mcp_update_task
)


# Wrap MCP tools with @function_tool decorator
@function_tool
def add_task(user_id: str, title: str, description: str = None) -> dict:
    """
    Add a new task to the user's todo list.
    
    Use this when the user wants to create, add, or remember a new task.
    
    Args:
        user_id: The user's unique identifier
        title: The title/name of the task to add
        description: Optional additional details about the task
    
    Returns:
        Result with task_id, status, and title of created task
    """
    return mcp_add_task(user_id, title, description)


@function_tool
def list_tasks(user_id: str, status: str = "all") -> list[dict]:
    """
    Get the user's tasks from their todo list.
    
    Use this when the user wants to see, view, or check their tasks.
    
    Args:
        user_id: The user's unique identifier
        status: Filter - "all" for all tasks, "pending" for incomplete, 
                "completed" for finished tasks
    
    Returns:
        List of task objects with id, title, completed status
    """
    return mcp_list_tasks(user_id, status)


@function_tool
def complete_task(user_id: str, task_id: int) -> dict:
    """
    Mark a task as complete/done.
    
    Use this when the user says they finished, completed, or done with a task.
    
    Args:
        user_id: The user's unique identifier
        task_id: The ID number of the task to mark complete
    
    Returns:
        Result with task_id, status, and title of completed task
    """
    return mcp_complete_task(user_id, task_id)


@function_tool
def delete_task(user_id: str, task_id: int) -> dict:
    """
    Delete/remove a task from the todo list.
    
    Use this when the user wants to delete, remove, or cancel a task.
    
    Args:
        user_id: The user's unique identifier
        task_id: The ID number of the task to delete
    
    Returns:
        Result with task_id, status, and title of deleted task
    """
    return mcp_delete_task(user_id, task_id)


@function_tool
def update_task(
    user_id: str, 
    task_id: int, 
    title: str = None, 
    description: str = None
) -> dict:
    """
    Update/modify an existing task's title or description.
    
    Use this when the user wants to change, update, edit, or rename a task.
    
    Args:
        user_id: The user's unique identifier
        task_id: The ID number of the task to update
        title: New title for the task (optional)
        description: New description for the task (optional)
    
    Returns:
        Result with task_id, status, and updated title
    """
    return mcp_update_task(user_id, task_id, title, description)


# Agent instructions
AGENT_INSTRUCTIONS = """
You are a friendly and helpful Todo Assistant. Your job is to help users manage 
their todo list through natural conversation.

## Your Capabilities:
- Add new tasks to the user's list
- Show tasks (all, pending, or completed)
- Mark tasks as complete
- Delete tasks
- Update task titles or descriptions

## Behavior Guidelines:
1. Always be friendly and helpful
2. Confirm every action you take with a clear message
3. When listing tasks, format them nicely with numbers
4. If a user's request is ambiguous, ask for clarification
5. If a task is not found, let the user know politely
6. Never expose technical errors - give user-friendly messages

## Response Style:
- Use emojis sparingly (✅ for success, ❌ for errors)
- Keep responses concise but informative
- When listing tasks, use a clear format like:
  1. [✓] Task title (completed)
  2. [ ] Task title (pending)

## Important:
- The user_id will be provided in the context - use it for all operations
- Always use the tools to perform actions - don't just say you did something
- If you need the task ID and don't have it, list tasks first to find it
"""


def create_todo_agent() -> Agent:
    """Create and return the Todo Assistant agent."""
    return Agent(
        name="Todo Assistant",
        instructions=AGENT_INSTRUCTIONS,
        tools=[
            add_task,
            list_tasks,
            complete_task,
            delete_task,
            update_task
        ]
    )


def run_agent(
    agent: Agent,
    user_id: str,
    message: str,
    conversation_history: list[dict] = None
) -> dict:
    """
    Run the agent with a user message and conversation history.
    
    Args:
        agent: The Todo Assistant agent
        user_id: The user's unique identifier
        message: The user's current message
        conversation_history: Previous messages in the conversation
    
    Returns:
        Dictionary with response and tool_calls
    """
    # Build the full message with user context
    context_message = f"[User ID: {user_id}]\n\n{message}"
    
    # Build messages array
    messages = []
    if conversation_history:
        for msg in conversation_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
    
    messages.append({
        "role": "user",
        "content": context_message
    })
    
    # Run the agent
    result = Runner.run_sync(agent, messages)
    
    return {
        "response": result.final_output,
        "tool_calls": [
            {
                "tool": item.name,
                "args": item.args,
                "result": item.output
            }
            for item in result.new_items
            if hasattr(item, 'name')  # Filter for tool calls
        ]
    }
```

---

## Step 4: Create Chat Endpoint

### 4.1 Generate Chat Endpoint Plan

```
/sp.plan

Prompt:
Create technical plan for Chat endpoint implementation.

Reference specs:
- @specs/api/chat-endpoint.md
- @specs/database/conversation-schema.md

Requirements:
- POST /api/{user_id}/chat endpoint
- JWT authentication (from Phase II)
- Create/continue conversations
- Store messages in database
- Stateless request handling
- Return response with tool_calls

Follow patterns from:
- @backend/CLAUDE.md

Output to: specs/plans/chat-endpoint-plan.md
```

### 4.2 Implement Chat Endpoint

**backend/src/routes/chat.py:**

```python
"""
Chat API endpoint for AI-powered todo management.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from src.database import get_session
from src.auth.jwt import get_current_user, verify_user_access
from src.models.conversation import Conversation
from src.models.message import Message
from src.schemas.chat import ChatRequest, ChatResponse, ToolCallInfo
from src.agent.todo_agent import create_todo_agent, run_agent
import json

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/{user_id}/chat", response_model=ChatResponse)
def chat(
    user_id: str,
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message to the AI assistant and get a response.
    
    The assistant can manage tasks through natural language.
    """
    # Verify user access
    verify_user_access(current_user, user_id)
    
    # Get or create conversation
    if request.conversation_id:
        conversation = session.get(Conversation, request.conversation_id)
        if not conversation or conversation.user_id != user_id:
            raise HTTPException(404, "Conversation not found")
    else:
        # Create new conversation
        conversation = Conversation(user_id=user_id)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)
    
    # Fetch conversation history
    history_stmt = (
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    history_messages = session.exec(history_stmt).all()
    
    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in history_messages
    ]
    
    # Store user message
    user_message = Message(
        conversation_id=conversation.id,
        user_id=user_id,
        role="user",
        content=request.message
    )
    session.add(user_message)
    session.commit()
    
    # Run agent
    agent = create_todo_agent()
    result = run_agent(
        agent=agent,
        user_id=user_id,
        message=request.message,
        conversation_history=conversation_history
    )
    
    # Store assistant response
    assistant_message = Message(
        conversation_id=conversation.id,
        user_id=user_id,
        role="assistant",
        content=result["response"],
        tool_calls=json.dumps(result["tool_calls"]) if result["tool_calls"] else None
    )
    session.add(assistant_message)
    session.commit()
    
    return ChatResponse(
        conversation_id=conversation.id,
        response=result["response"],
        tool_calls=[
            ToolCallInfo(
                tool=tc["tool"],
                args=tc["args"],
                result=tc["result"]
            )
            for tc in result["tool_calls"]
        ]
    )
```

**backend/src/schemas/chat.py:**

```python
"""
Pydantic schemas for Chat API.
"""

from pydantic import BaseModel
from typing import Optional, Any


class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str


class ToolCallInfo(BaseModel):
    tool: str
    args: dict[str, Any]
    result: dict[str, Any]


class ChatResponse(BaseModel):
    conversation_id: int
    response: str
    tool_calls: list[ToolCallInfo] = []
```

---

## Step 5: Build ChatKit Frontend

### 5.1 Generate ChatKit Plan

```
/sp.plan

Prompt:
Create technical plan for ChatKit frontend implementation.

Reference specs:
- @specs/features/ai-chatbot.md

Requirements:
- Use OpenAI ChatKit (@openai/chatkit-react)
- Self-hosted option (not Agent Builder)
- Connect to our FastAPI backend
- JWT authentication
- Conversation persistence

Architecture:
- ChatKit component renders chat UI
- Custom API client sends messages to backend
- Session management with Better Auth

Follow patterns from:
- @.claude/skills/chatkit-frontend/SKILL.md

Output to: specs/plans/chatkit-frontend-plan.md
```

### 5.2 Key ChatKit Implementation

**frontend/components/ChatInterface.tsx:**

```tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ChatInterface() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const userId = session?.user?.id;
  const token = session?.session?.token;
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !userId || !token) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/${userId}/chat`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: userMessage.content
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      const data = await response.json();
      
      // Update conversation ID if new
      if (!conversationId) {
        setConversationId(data.conversation_id);
      }
      
      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, userId, token, conversationId]);
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please sign in to use the chat.</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
        <h2 className="text-lg font-semibold">Todo Assistant</h2>
        <p className="text-sm text-gray-500">
          Ask me to manage your tasks!
        </p>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-lg mb-2">👋 Hi! I'm your Todo Assistant.</p>
            <p className="text-sm">Try saying:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>"Add a task to buy groceries"</li>
              <li>"Show me my tasks"</li>
              <li>"Mark task 1 as complete"</li>
            </ul>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

**frontend/app/chat/page.tsx:**

```tsx
import { ChatInterface } from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">
          AI Todo Assistant
        </h1>
        <ChatInterface />
      </div>
    </div>
  );
}
```

---

## Step 6: Database Models

### 6.1 Conversation Model

**backend/src/models/conversation.py:**

```python
"""Conversation model for storing chat sessions."""

from datetime import datetime
from sqlmodel import SQLModel, Field


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"
    
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### 6.2 Message Model

**backend/src/models/message.py:**

```python
"""Message model for storing chat messages."""

from datetime import datetime
from sqlmodel import SQLModel, Field
from typing import Optional


class Message(SQLModel, table=True):
    __tablename__ = "messages"
    
    id: int | None = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    user_id: str = Field(nullable=False)
    role: str = Field(max_length=20, nullable=False)  # "user" or "assistant"
    content: str = Field(nullable=False)
    tool_calls: Optional[str] = Field(default=None)  # JSON string
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## Step 7: Testing

### 7.1 Test MCP Tools

```
/sp.implement

Prompt:
Create tests for MCP tools.

Test file: backend/tests/test_mcp_tools.py

Tests:
1. test_add_task - Creates task successfully
2. test_list_tasks_all - Returns all tasks
3. test_list_tasks_pending - Returns only pending
4. test_complete_task - Marks task complete
5. test_delete_task - Removes task
6. test_update_task - Updates title/description
7. test_task_not_found - Handles missing task

Use pytest fixtures for test database.
```

### 7.2 Test Chat Endpoint

```
/sp.implement

Prompt:
Create tests for Chat endpoint.

Test file: backend/tests/test_chat.py

Tests:
1. test_new_conversation - Creates conversation and returns response
2. test_continue_conversation - Uses existing conversation_id
3. test_unauthorized - Returns 401 without token
4. test_wrong_user - Returns 403 for wrong user

Mock the OpenAI Agent for consistent testing.
```

### 7.3 Run Tests

```bash
cd backend

# Install test dependencies
uv sync --extra dev

# Run all tests
uv run pytest -v

# Run with coverage
uv run pytest --cov=src --cov-report=html

# Run specific test file
uv run pytest tests/test_mcp_tools.py -v
```

---

## Step 8: Deployment

### 8.1 Environment Variables

**Add to .env:**

```env
# From Phase II
DATABASE_URL=postgresql+asyncpg://...
BETTER_AUTH_SECRET=...

# Phase III additions
OPENAI_API_KEY=sk-...  # Required for OpenAI Agents SDK
```

### 8.2 Update Backend Dependencies

**backend/pyproject.toml:**

```toml
[project]
name = "todo-backend"
version = "0.3.0"
requires-python = ">=3.13"
dependencies = [
    # From Phase II
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlmodel>=0.0.22",
    "asyncpg>=0.30.0",
    "pyjwt>=2.9.0",
    "python-dotenv>=1.0.0",
    "pydantic-settings>=2.6.0",
    
    # Phase III additions
    "openai-agents>=0.6.5",   # OpenAI Agents SDK
    "fastmcp>=2.14.0",        # FastMCP for MCP server
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=6.0.0",
    "httpx>=0.28.0",
]
```

### 8.3 Docker Compose Update

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
    depends_on:
      - backend

  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=todo_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### 8.4 OpenAI Domain Allowlist (for ChatKit)

If using hosted ChatKit:

1. Deploy frontend to get production URL
2. Go to: https://platform.openai.com/settings/organization/security/domain-allowlist
3. Add your frontend domain (e.g., `https://your-app.vercel.app`)
4. Get domain key
5. Add to environment: `NEXT_PUBLIC_OPENAI_DOMAIN_KEY=...`

---

## Verification Checklist

### Before Submission

- [ ] **Specs Complete**
  - [ ] `specs/features/ai-chatbot.md`
  - [ ] `specs/features/mcp-tools.md`
  - [ ] `specs/api/chat-endpoint.md`
  - [ ] `specs/database/conversation-schema.md`

- [ ] **Backend Complete**
  - [ ] MCP tools implemented (5 tools)
  - [ ] OpenAI Agent configured
  - [ ] Chat endpoint working
  - [ ] Conversation persistence
  - [ ] JWT authentication
  - [ ] Tests passing

- [ ] **Frontend Complete**
  - [ ] Chat interface working
  - [ ] Messages display correctly
  - [ ] Loading states
  - [ ] Error handling

- [ ] **Integration**
  - [ ] Natural language commands work
  - [ ] Conversation history persists
  - [ ] Server restart doesn't lose conversations

- [ ] **Deployment**
  - [ ] Frontend deployed
  - [ ] Backend deployed
  - [ ] Environment variables set
  - [ ] OPENAI_API_KEY configured

### Demo Video (90 seconds max)

Show:
1. Start new conversation
2. "Add a task to buy groceries"
3. "Show me my tasks"
4. "Mark task 1 as complete"
5. "What have I completed?"
6. "Delete the groceries task"
7. Refresh page - conversation persists

---

## Quick Reference Commands

```bash
# Navigate to project
cd /mnt/f/PROJECTS/hackathone-II/hackathon-todo

# Start backend
cd backend && uv run uvicorn src.main:app --reload --port 8000

# Start frontend
cd frontend && npm run dev

# Run tests
cd backend && uv run pytest -v

# Start Claude Code
claude

# Spec-Kit commands
/sp.constitution
/sp.specify
/sp.plan
/sp.tasks
/sp.implement
```

---

## Next Steps

After completing Phase 3:
1. Commit all code to GitHub
2. Deploy frontend and backend
3. Record 90-second demo video
4. Submit via Google Form
5. Prepare for Phase 4 (Kubernetes Deployment)

---

*Phase 3 Guide Version: 1.0*
*Aligned with Hackathon II Requirements*
*Technologies: OpenAI Agents SDK 0.6.5+, FastMCP 2.14+, ChatKit*
