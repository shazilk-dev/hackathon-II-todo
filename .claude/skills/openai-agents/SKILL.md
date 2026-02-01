# OpenAI Agents SDK Skill

## Skill Invocation

**Trigger when user says:**
- "create AI agent"
- "implement agent"
- "add OpenAI agent"
- "build chat agent"

**What this skill does:**
Generates an AI agent using OpenAI Agents SDK that processes natural language and calls tools to accomplish tasks.

**Dependencies:**
- `fastmcp-server` - provides tools via agent_tools.py
- FastAPI backend structure
- Chat endpoint to receive messages

---

## Execution Steps

When this skill is invoked, execute these steps in order:

### Step 1: Verify Prerequisites

```bash
# Check that tools exist
ls backend/app/agent_tools.py

# Check environment
echo $OPENAI_API_KEY
```

**Requirements:**
- `OPENAI_API_KEY` environment variable set
- Agent tools defined (from fastmcp-server skill)
- FastAPI backend structure exists

### Step 2: Install OpenAI Agents SDK

**File:** `backend/requirements.txt`

Add dependency:

```txt
openai-agents>=0.6.5
```

Install:

```bash
cd backend
pip install openai-agents
# or with uv
uv add openai-agents
```

### Step 3: Create Agent Module

**File:** `backend/app/agent.py`

**Must include:**
1. Agent creation function
2. Clear instructions for the agent
3. Tool imports from agent_tools.py
4. Chat function to process messages
5. Error handling

**Implementation pattern:**

```python
"""
AI Agent - OpenAI Agents SDK implementation for todo management.
"""

from agents import Agent, Runner
from app.agent_tools import ALL_TOOLS


# Agent instructions
INSTRUCTIONS = """
You are a friendly Todo Assistant. Help users manage their task list.

## Your Capabilities:
- **Add tasks**: When users want to create/add/remember something
- **List tasks**: When users ask to see/show/view their tasks
- **Complete tasks**: When users say done/finished/complete
- **Update tasks**: When users want to change task details
- **Delete tasks**: When users want to remove tasks

## Tools Available:
- add_task: Create a new task
- list_tasks: Show tasks (all/pending/completed)
- complete_task: Mark a task as done
- update_task: Change task title or description
- delete_task: Remove a task

## Response Style:
- Be friendly and concise
- Always confirm actions (e.g., "Task added!", "Marked as complete!")
- Use checkmark emoji (✅) for completed actions
- Format task lists clearly with numbers
- If user asks about tasks, always call list_tasks first

## Important Rules:
- Never make up task IDs - always list tasks first if you need IDs
- Always include user_id when calling tools
- If unsure what the user wants, ask for clarification
- If a tool returns an error, explain it clearly to the user
"""


def create_agent() -> Agent:
    """
    Create and configure the Todo Agent.

    Returns:
        Configured Agent instance ready to process messages
    """
    return Agent(
        name="Todo Assistant",
        instructions=INSTRUCTIONS,
        tools=ALL_TOOLS,
        model="gpt-4o-mini"  # Fast and cost-effective
    )


def chat(user_id: str, message: str, history: list = None) -> str:
    """
    Process a chat message and return the agent's response.

    Args:
        user_id: The user's unique identifier
        message: The user's message
        history: Optional conversation history (list of message dicts)

    Returns:
        Agent's response as a string
    """
    agent = create_agent()

    # Build context with user_id embedded
    full_message = f"[User: {user_id}] {message}"

    # Build message list
    messages = []
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": full_message})

    try:
        # Run agent synchronously
        result = Runner.run_sync(agent, messages)
        return result.final_output
    except Exception as e:
        # Log error and return user-friendly message
        print(f"Agent error: {e}")
        return "I encountered an issue processing your request. Please try again."


async def chat_async(user_id: str, message: str, history: list = None) -> str:
    """
    Async version of chat for FastAPI endpoints.

    Args:
        user_id: The user's unique identifier
        message: The user's message
        history: Optional conversation history

    Returns:
        Agent's response as a string
    """
    agent = create_agent()

    full_message = f"[User: {user_id}] {message}"

    messages = []
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": full_message})

    try:
        result = await Runner.run(agent, messages)
        return result.final_output
    except Exception as e:
        print(f"Agent error: {e}")
        return "I encountered an issue processing your request. Please try again."
```

### Step 4: Create Chat Route

**File:** `backend/app/routes/chat.py`

**Must include:**
1. Chat endpoint at `/api/{user_id}/chat`
2. Authentication dependency
3. Conversation management
4. Request/response models

**Implementation pattern:**

```python
"""
Chat Routes - API endpoints for conversational AI.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlmodel import Session, select

from app.database import get_session
from app.auth import get_current_user
from app.models import User, Conversation, Message as DBMessage
from app.agent import chat_async


router = APIRouter()


class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str


class ChatResponse(BaseModel):
    conversation_id: int
    response: str
    tool_calls: Optional[list] = None


@router.post("/api/{user_id}/chat", response_model=ChatResponse)
async def chat_endpoint(
    user_id: str,
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Chat with the AI agent.

    Args:
        user_id: User identifier from path
        request: Chat request with message and optional conversation_id
        current_user: Authenticated user
        session: Database session

    Returns:
        Agent response with conversation ID
    """
    # Verify user matches authenticated user
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get or create conversation
    conversation = None
    if request.conversation_id:
        conversation = session.get(Conversation, request.conversation_id)
        if not conversation or conversation.user_id != user_id:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Create new conversation
        conversation = Conversation(user_id=user_id)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

    # Save user message
    user_message = DBMessage(
        conversation_id=conversation.id,
        role="user",
        content=request.message
    )
    session.add(user_message)
    session.commit()

    # Get conversation history
    history_messages = session.exec(
        select(DBMessage)
        .where(DBMessage.conversation_id == conversation.id)
        .order_by(DBMessage.created_at)
    ).all()

    history = [
        {"role": msg.role, "content": msg.content}
        for msg in history_messages[:-1]  # Exclude the message we just added
    ]

    # Call agent
    response = await chat_async(user_id, request.message, history)

    # Save agent response
    agent_message = DBMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=response
    )
    session.add(agent_message)
    session.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        response=response,
        tool_calls=None  # TODO: Extract from agent result if needed
    )
```

### Step 5: Add Conversation Models

**File:** Add to `backend/app/models.py`

```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional

class Conversation(SQLModel, table=True):
    """Conversation thread between user and agent."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    messages: list["Message"] = Relationship(back_populates="conversation")


class Message(SQLModel, table=True):
    """Individual message in a conversation."""
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id", index=True)
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    conversation: Conversation = Relationship(back_populates="messages")
```

### Step 6: Register Chat Router

**File:** `backend/app/main.py`

Add chat router:

```python
from fastapi import FastAPI
from app.routes import chat

app = FastAPI()

# Register routers
app.include_router(chat.router)
```

### Step 7: Set Environment Variable

**File:** `backend/.env`

Add OpenAI API key:

```env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
```

---

## Validation Checklist

After implementation, verify:

- [ ] `openai-agents` installed in requirements.txt
- [ ] `OPENAI_API_KEY` environment variable set
- [ ] Agent created with clear instructions
- [ ] Tools imported from `agent_tools.py`
- [ ] Chat endpoint defined at `/api/{user_id}/chat`
- [ ] Conversation and Message models added
- [ ] Database migrations run for new models
- [ ] Error handling in chat function
- [ ] Authentication required for chat endpoint
- [ ] Conversation history passed to agent

---

## Testing Commands

```bash
# Set API key
export OPENAI_API_KEY=sk-...

# Test agent directly
cd backend
python
>>> from app.agent import chat
>>> response = chat("test-user", "Add a task to buy groceries")
>>> print(response)

# Run backend server
uvicorn app.main:app --reload

# Test chat endpoint with curl
curl -X POST http://localhost:8000/api/test-user/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task to buy groceries"}'

# Expected response:
# {
#   "conversation_id": 1,
#   "response": "✅ Task added! I've created a task to buy groceries.",
#   "tool_calls": null
# }
```

---

## Integration Points

### With fastmcp-server Skill
- Agent imports `ALL_TOOLS` from `agent_tools.py`
- Tools are MCP wrappers that call actual MCP server
- Each tool has proper type hints and docstrings

**Import structure:**
```python
from app.agent_tools import ALL_TOOLS  # From fastmcp-server skill
agent = Agent(tools=ALL_TOOLS)
```

### With chatkit-frontend Skill
- Frontend sends messages to `/api/{user_id}/chat`
- Receives response with conversation_id
- Can continue conversation by passing conversation_id

**Request flow:**
```
Frontend → POST /api/chat → Agent → Tools → Database
                 ↓            ↓
              Response ← Natural language
```

### With FastAPI Backend
- Chat route integrated into main app
- Uses existing auth system
- Shares database connection
- Conversation persistence in database

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `OPENAI_API_KEY not set` | Export environment variable: `export OPENAI_API_KEY=sk-...` |
| Agent not calling tools | Check tool docstrings are clear, ensure type hints present |
| "Invalid request" from OpenAI | Verify API key is valid, check account has credits |
| Agent loops infinitely | Add max iterations in Runner config |
| Tools not found | Verify `from app.agent_tools import ALL_TOOLS` |
| Conversation not persisting | Check database models and migrations |

---

## Best Practices

### Agent Instructions

**DO:**
- Be specific about capabilities
- Explain when to use each tool
- Define response style
- Set clear boundaries

**DON'T:**
- Make instructions too vague
- Forget to mention tools available
- Mix multiple personalities
- Leave error handling unclear

### Tool Usage

```python
# Embed user context in message
full_message = f"[User: {user_id}] {message}"

# This ensures tools receive correct user_id
# Agent will extract and use it when calling tools
```

### Error Handling

```python
def safe_chat(user_id: str, message: str) -> str:
    """Always wrap agent calls in try/except."""
    try:
        result = Runner.run_sync(agent, message)
        return result.final_output
    except Exception as e:
        # Log error for debugging
        logger.error(f"Agent error: {e}", exc_info=True)
        # Return user-friendly message
        return "I encountered an issue. Please try again."
```

---

## Optional Enhancements

After basic implementation works:

### 1. Streaming Responses

```python
async def chat_streaming(user_id: str, message: str):
    """Stream agent response as it's generated."""
    agent = create_agent()
    result = Runner.run_streamed(agent, message)

    async for event in result.stream_events():
        if event.type == "raw_response_event":
            yield event.data.delta
```

### 2. Tool Call Tracking

```python
async def chat_with_tool_tracking(user_id: str, message: str):
    """Track which tools were called."""
    agent = create_agent()
    result = await Runner.run(agent, message)

    # Extract tool calls from result
    tool_calls = extract_tool_calls(result)

    return {
        "response": result.final_output,
        "tool_calls": tool_calls
    }
```

### 3. Context Injection

```python
from dataclasses import dataclass
from agents import Agent

@dataclass
class UserContext:
    user_id: str
    is_premium: bool
    preferences: dict

agent = Agent[UserContext](
    name="Todo Assistant",
    tools=ALL_TOOLS
)

context = UserContext(user_id="123", is_premium=True, preferences={})
result = Runner.run_sync(agent, message, context=context)
```

### 4. Guardrails

```python
from agents import InputGuardrail, GuardrailFunctionOutput

async def check_appropriate(ctx, agent, input_data):
    """Validate input is appropriate."""
    if contains_inappropriate_content(input_data):
        return GuardrailFunctionOutput(
            output_info={"reason": "Inappropriate content"},
            tripwire_triggered=True
        )
    return GuardrailFunctionOutput(
        output_info={"status": "ok"},
        tripwire_triggered=False
    )

agent = Agent(
    name="Safe Agent",
    tools=ALL_TOOLS,
    input_guardrails=[InputGuardrail(guardrail_function=check_appropriate)]
)
```

### 5. Multi-Agent Handoffs

```python
from agents import Agent

# Specialized agents
task_agent = Agent(
    name="Task Agent",
    instructions="Manage tasks only",
    tools=[add_task, list_tasks, complete_task]
)

analytics_agent = Agent(
    name="Analytics Agent",
    instructions="Provide statistics and insights",
    tools=[get_stats]
)

# Main agent with handoffs
triage_agent = Agent(
    name="Triage Agent",
    instructions="Route to appropriate agent",
    handoffs=[task_agent, analytics_agent]
)
```

---

## Agent Prompt Template

When creating or modifying agent instructions:

```python
INSTRUCTIONS = """
You are a [ROLE]. [PRIMARY GOAL].

## Your Capabilities:
- [Capability 1]: [When to use]
- [Capability 2]: [When to use]
- [Capability 3]: [When to use]

## Tools Available:
- tool_name: Brief description
- tool_name: Brief description

## Response Style:
- [Tone guidance]
- [Formatting preferences]
- [Emoji usage rules]
- [Special phrases to use]

## Important Rules:
- [Critical constraint 1]
- [Critical constraint 2]
- [Error handling approach]
- [Clarification strategy]
"""
```

---

## Testing Agent Behavior

```python
import pytest
from app.agent import chat

def test_agent_adds_task():
    """Test agent correctly adds a task."""
    response = chat("test-user", "Add a task to buy milk")
    assert "added" in response.lower() or "created" in response.lower()

def test_agent_lists_tasks():
    """Test agent lists tasks."""
    response = chat("test-user", "Show me my tasks")
    # Agent should call list_tasks tool
    assert "task" in response.lower()

def test_agent_handles_unclear_input():
    """Test agent asks for clarification."""
    response = chat("test-user", "Do the thing")
    assert "?" in response  # Should ask question
```

---

## Model Selection Guide

| Model | Use When | Cost | Speed |
|-------|----------|------|-------|
| gpt-4o-mini | Production, high volume | Low | Fast |
| gpt-4o | Need better reasoning | Medium | Medium |
| gpt-4-turbo | Complex tasks | High | Slower |

**Recommendation for todo app:** `gpt-4o-mini`
- Fast responses
- Cost-effective for chat
- Good enough for task management

---

## References

- [OpenAI Agents SDK Docs](https://openai.github.io/openai-agents-python/)
- [GitHub Repository](https://github.com/openai/openai-agents-python)
- [Examples](https://github.com/openai/openai-agents-python/tree/main/examples)
- [OpenAI Cookbook - Agents](https://cookbook.openai.com/topic/agents)
