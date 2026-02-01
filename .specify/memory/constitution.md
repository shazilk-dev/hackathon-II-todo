<!--
Sync Impact Report - Constitution Update
========================================
Version: 2.0.0 → 3.0.0
Rationale: MAJOR version bump - Phase 3 introduces backward-incompatible architectural changes:
  - Conversational AI interface added as primary interaction method
  - OpenAI Agents SDK integration (new dependency layer)
  - MCP (Model Context Protocol) server architecture for tool execution
  - Conversation persistence in database (new data model requirements)
  - ChatKit frontend component (new UI paradigm)

Principles Modified:
- I. Technology Stack → Added OpenAI Agents SDK, FastMCP, ChatKit frontend library
- II. Architecture Constraints → Added AI Agent layer, MCP Tools layer, Conversation persistence
- III. Code Quality Standards → Extended with agent tool patterns (@function_tool, @mcp.tool)
- VI. Security Principles → Added AI-specific security (prompt injection prevention, tool access control)
- VII. Clean Architecture Requirements → Added Agent Service layer integration

Sections Added:
- VIII. AI Agent Principles (NEW) - Natural language processing, tool calling, conversation management
- Conversational Interface Requirements in Architecture Constraints

Sections Retained:
- All existing Phase 2 principles
- Development Workflow (SDD mandatory sequence)
- Quality Gates (Constitution Check updated for AI components)
- Governance (Amendment, Compliance, Override Protocol)

Templates Requiring Updates:
✅ plan-template.md - Constitution Check updated for AI agent layer
✅ spec-template.md - Requirements include conversational user stories
✅ tasks-template.md - Task format includes agent/MCP tool implementation

Follow-up TODOs:
- None (all placeholders filled)
-->

# Hackathon II - Todo Web App Constitution (Phase 3)

## Core Principles

### I. Technology Stack (NON-NEGOTIABLE)

**Frontend**:
- **Framework**: Next.js 16+ (App Router required)
- **Language**: TypeScript 5.7+ with strict mode enabled
- **Styling**: Tailwind CSS 4+ for all UI styling
- **Chat UI**: OpenAI ChatKit (@openai/chatkit-react) for conversational interface
- **Type Safety**: All components and functions MUST have explicit TypeScript types
- **Build Tool**: Turbopack (default with Next.js 16+)

**Backend**:
- **Framework**: FastAPI (latest stable version)
- **Language**: Python 3.13+ with type hints on ALL functions
- **ORM**: SQLModel for database models and queries
- **Database**: Neon PostgreSQL with async drivers (asyncpg)
- **AI Agent**: OpenAI Agents SDK (openai-agents 0.6.5+)
- **MCP Server**: FastMCP 2.14+ for tool exposure
- **Package Management**: UV for dependency management

**Authentication**:
- **Provider**: Better Auth with JWT token strategy
- **Token Type**: JWT (JSON Web Tokens) for stateless authentication
- **Storage**: HTTP-only cookies for token storage (XSS protection)

**AI Components**:
- **Agent Framework**: OpenAI Agents SDK for natural language processing
- **Tool Protocol**: FastMCP (Model Context Protocol) for standardized tool interfaces
- **Model**: GPT-4o-mini (fast, cost-effective for task management)
- **API Key**: OPENAI_API_KEY environment variable (REQUIRED)

**Development Tools**:
- **Type Checking**: mypy (backend), TypeScript compiler (frontend)
- **Linting**: Ruff (backend), ESLint (frontend)
- **Formatting**: Ruff format (backend), Prettier (frontend)
- **Testing**: pytest (backend), Vitest + Playwright (frontend)
- **MCP Inspector**: fastmcp dev for interactive tool testing

**Rationale**: Phase 3 adds conversational AI capabilities while maintaining Phase 2 foundation. OpenAI Agents SDK provides production-ready agent framework with tool calling. FastMCP standardizes tool interfaces following Model Context Protocol. ChatKit simplifies chat UI implementation. GPT-4o-mini balances speed and cost for todo management use case. MCP architecture enables tool reuse across different agent implementations.

### II. Architecture Constraints

**Multi-Tier Web Architecture with AI Layer** (MANDATORY):

```
frontend/          # Next.js 16+ application
├── src/
│   ├── app/          # App Router pages and layouts
│   │   └── chat/     # Conversational interface (NEW in Phase 3)
│   ├── components/   # React components (UI layer)
│   │   └── ChatInterface.tsx  # ChatKit integration (NEW)
│   ├── lib/          # Client-side utilities and API clients
│   └── types/        # TypeScript type definitions
│       └── chat.ts   # Chat message types (NEW)
└── tests/            # Vitest unit tests + Playwright E2E

backend/           # FastAPI application
├── src/
│   ├── models/       # SQLModel database models (data layer)
│   │   ├── conversation.py  # Conversation model (NEW)
│   │   └── message.py       # Message model (NEW)
│   ├── services/     # Business logic (service layer)
│   ├── api/          # FastAPI routers and endpoints (API layer)
│   │   └── chat.py   # Chat endpoint (NEW in Phase 3)
│   ├── agent/        # AI agent implementation (NEW)
│   │   ├── agent.py       # OpenAI Agents SDK agent (NEW)
│   │   └── agent_tools.py # Agent function tools (NEW)
│   ├── mcp_tools/    # MCP server tools (NEW)
│   │   └── mcp_tools.py   # FastMCP tool definitions (NEW)
│   ├── auth/         # Better Auth configuration and utilities
│   └── db/           # Database connection and migrations
└── tests/            # pytest unit + integration tests
```

**Layered Separation with AI Integration** (NON-NEGOTIABLE):
- **Frontend UI Layer**: ChatInterface component (presentation, no business logic)
- **Frontend API Client**: Calls chat endpoint with message history
- **Backend API Layer**: Chat route receives messages, delegates to agent
- **Backend Agent Layer**: OpenAI Agents SDK processes natural language (NEW)
- **Backend MCP Tools Layer**: FastMCP exposes task operations as tools (NEW)
- **Backend Service Layer**: Business logic invoked by MCP tools
- **Backend Data Layer**: SQLModel models, database operations

**AI Agent Architecture** (NEW in Phase 3):

```
User Message → ChatInterface → POST /api/{user_id}/chat
                                       ↓
                                  Chat Route
                                       ↓
                            Agent (OpenAI Agents SDK)
                                       ↓
                            Agent Tools (@function_tool)
                                       ↓
                            MCP Tools (@mcp.tool)
                                       ↓
                            Service Layer
                                       ↓
                            Database
```

**Stateless Request/Response Cycle** (CRITICAL):
- **No In-Memory State**: Agent does not retain state between requests
- **Conversation Persistence**: All messages stored in database (Conversation, Message models)
- **History Loading**: Each request loads conversation history from database
- **Resumable**: Server restart does not lose conversations

**Database Design**:
- **Async-First**: All database operations MUST use async/await
- **Migrations**: Alembic for schema version control (auto-generated from SQLModel)
- **Connection Pooling**: Managed by SQLAlchemy async engine
- **User Isolation**: Row-level security via `user_id` foreign key on ALL user data tables
- **Conversation Tables** (NEW):
  - `conversation`: Tracks conversation threads (user_id, created_at, updated_at)
  - `message`: Individual messages (conversation_id, role, content, created_at)

**No Over-Engineering** (YAGNI):
- Avoid abstractions until pattern appears 3+ times
- No microservices (monolithic backend acceptable for hackathon scope)
- No complex state management (React Context sufficient, no Redux/Zustand unless justified)
- No premature optimization (measure before optimizing)
- Single agent per user (no multi-agent workflows unless explicitly required)

**Rationale**: AI agent layer adds conversational interface while preserving clean architecture. MCP tools provide standardized interface between agent and services. Stateless design enables horizontal scaling and fault tolerance. Database-persisted conversations survive server restarts. Layered separation keeps agent logic testable and maintainable.

### III. Code Quality Standards (NON-NEGOTIABLE)

**TypeScript (Frontend)**:
- **Strict Mode**: `strict: true` in tsconfig.json (no implicit any, null checks enforced)
- **Type Coverage**: 100% - every function, component, and variable MUST have explicit types
- **Component Types**: Props interfaces for ALL React components
- **API Types**: Shared types for API request/response contracts
- **Chat Types**: Message, ToolCall, ChatRequest, ChatResponse interfaces (NEW)
- **No Type Escape Hatches**: Avoid `any`, `@ts-ignore`, `as unknown as X` (requires justification if used)

**Python (Backend)**:
- **Type Hints**: Required on ALL function signatures (parameters + return types)
- **Type Checking**: Code MUST pass `mypy --strict` with no errors
- **Docstrings**: Required on all public methods and classes (Google style)
- **Private Methods**: No docstrings required for underscore-prefixed methods
- **Pydantic Validation**: All API inputs MUST use Pydantic models for validation
- **Agent Tool Docstrings** (NEW): Tools MUST have clear docstrings with Args/Returns sections (LLM uses these)
- **MCP Tool Annotations** (NEW): Tools MUST have type hints (auto-generates JSON schema)

**AI Agent Code Patterns** (NEW in Phase 3):

**Agent Tool Definition** (@function_tool):
```python
from agents import function_tool

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
```

**MCP Tool Definition** (@mcp.tool):
```python
from fastmcp import FastMCP

mcp = FastMCP("Todo MCP Server")

@mcp.tool
def add_task(user_id: str, title: str, description: str = None) -> dict:
    """
    Add a new task to the user's todo list.

    Args:
        user_id: The unique identifier of the user
        title: The title of the task (required)
        description: Optional description

    Returns:
        Dictionary with task_id, status, and title
    """
    # Implementation...
    return {"task_id": 1, "status": "created", "title": title}
```

**Naming Conventions**:
- **Frontend**: camelCase (variables/functions), PascalCase (components/types)
- **Backend**: snake_case (variables/functions/modules), PascalCase (classes)
- **Database**: snake_case (tables/columns), plural table names (e.g., `tasks`, `users`, `conversations`)
- **API Routes**: kebab-case (e.g., `/api/task-lists`, `/api/{user_id}/chat`)
- **Files**: Match language convention (camelCase.tsx, snake_case.py)
- **Agent Tools**: Verb-noun format (add_task, list_tasks, complete_task)
- **MCP Resources**: URI format (stats://{user_id})

**Code Organization**:
- **Single Responsibility**: Each file/class/function has ONE clear purpose
- **DRY Principle**: Avoid duplication (extract to shared utilities after 3rd occurrence)
- **Explicit Imports**: No wildcard imports (`import *`), prefer named imports
- **Dependency Direction**: Higher layers import lower layers (never reverse)
- **Agent Separation**: Agent logic separate from MCP tools (agent_tools.py wraps mcp_tools.py)

**Rationale**: TypeScript strict mode catches entire classes of bugs at compile time. Type hints enable IDE intelligence and prevent runtime type errors. Pydantic validation ensures API boundary safety. Agent tool docstrings guide LLM decision-making. Clear naming reduces cognitive load. Separation of agent and MCP layers enables tool reuse.

### IV. Testing Requirements

**Coverage Minimum**: 80% code coverage across frontend, backend, and AI components (enforced in CI)

**Test Pyramid** (MANDATORY):

```
        E2E Tests (10%)
       /              \
    API/Integration (30%)
   /                      \
Unit Tests (60%)
```

**Backend Testing** (pytest):
- **Unit Tests**: Service layer functions (business logic isolation)
  - File: `tests/unit/test_<service>.py`
  - Naming: `test_<function>_<scenario>`
  - Mocking: Mock database calls, test logic only
- **Integration Tests**: API endpoints with test database
  - File: `tests/integration/test_<endpoint>.py`
  - Naming: `test_<method>_<route>_<scenario>`
  - Test DB: Use pytest fixtures with database rollback per test
- **Contract Tests**: Verify API request/response schemas
  - File: `tests/contract/test_<endpoint>_contract.py`
  - Validation: Ensure Pydantic models match OpenAPI specs
- **Agent Tests** (NEW): Test agent tool calling behavior
  - File: `tests/unit/test_agent.py`
  - Mock OpenAI API calls
  - Verify correct tool selection and invocation
- **MCP Tool Tests** (NEW): Test individual tool logic
  - File: `tests/unit/test_mcp_tools.py`
  - Test tool functions directly (no agent involved)
  - Verify return format and error handling

**Frontend Testing** (Vitest + Playwright):
- **Unit Tests**: Component logic and utilities (Vitest)
  - File: `tests/unit/<ComponentName>.test.tsx`
  - Naming: `test('<ComponentName> <behavior>')`
  - Isolation: Mock API calls, test rendering and interactions
- **Chat Component Tests** (NEW): ChatInterface behavior
  - Test message sending
  - Test conversation history loading
  - Test error handling
- **E2E Tests**: Complete user flows (Playwright)
  - File: `tests/e2e/<flow-name>.spec.ts`
  - Naming: `test('<user journey>')`
  - Scope: Authentication, task CRUD, conversational flows (NEW)

**AI Testing Patterns** (NEW in Phase 3):

**Mock OpenAI API**:
```python
from unittest.mock import patch

@patch('agents.Runner.run_sync')
def test_agent_adds_task(mock_run):
    mock_run.return_value.final_output = "Task added!"
    response = chat("user123", "Add task to buy milk")
    assert "added" in response.lower()
```

**Test MCP Tools Directly**:
```python
def test_add_task_tool():
    result = add_task("user123", "Buy groceries")
    assert result["status"] == "created"
    assert "task_id" in result
```

**Test-Driven Development (TDD)** (ENCOURAGED):
- **Red-Green-Refactor**: Write failing test → implement → refactor
- **Contract-First**: For APIs, write contract tests before implementation
- **Parallel Safe**: All tests MUST be runnable independently and in parallel

**Test Data Management**:
- **Backend**: Factory pattern for test models (e.g., `TaskFactory`, `UserFactory`, `ConversationFactory`)
- **Frontend**: Mock service workers (MSW) for API mocking
- **Isolation**: Each test creates and cleans up its own data
- **Agent Mocking**: Mock OpenAI API calls in tests (use pytest fixtures)

**Rationale**: 80% coverage balances thoroughness with velocity. Test pyramid ensures fast feedback (unit tests) while catching integration issues. Agent testing verifies tool calling logic without incurring API costs. MCP tool tests ensure tools work correctly independent of agent. TDD reduces defect rates and improves design.

### V. Spec-Driven Development Workflow (MANDATORY)

All development MUST follow this strict sequence:

1. **Specify** (`/sp.specify`): Define feature requirements in `specs/<feature>/spec.md`
2. **Plan** (`/sp.plan`): Document architecture decisions in `specs/<feature>/plan.md`
3. **Tasks** (`/sp.tasks`): Create testable task breakdown in `specs/<feature>/tasks.md`
4. **Implement** (`/sp.implement`): Execute tasks with NO manual coding

**Non-negotiable rules**:
- **NO CODE WITHOUT TASK**: Every code change MUST correspond to a task in `tasks.md`
- **NO MANUAL CODING**: Use ONLY `/sp.implement` - no direct code editing by developers
- **Commit Messages**: MUST reference Task ID format: `[TASK-001] Add JWT authentication middleware`
- **File Headers**: All modified files MUST include Task ID comment at top:
  - Frontend: `// Task: TASK-001`
  - Backend: `# Task: TASK-001`
- **Traceability**: Requirement → Plan → Task → Code linkage MUST be maintained

**Spec-Driven Flow**:

```
User Request → /sp.specify → spec.md (WHAT to build)
            ↓
         /sp.plan → plan.md (HOW to build it)
            ↓
        /sp.tasks → tasks.md (BREAKDOWN into steps)
            ↓
     /sp.implement → Code (EXECUTION, no manual edits)
```

**Checkpoint**: Each phase MUST be complete before proceeding. No skipping allowed.

**Rationale**: Spec-Driven Development ensures traceability from requirement to implementation. NO MANUAL CODING prevents ad-hoc changes that bypass planning, reducing technical debt and scope creep. Task IDs create accountability and enable precise change tracking. This workflow is essential for team collaboration and audit trails in production systems.

### VI. Security Principles (NON-NEGOTIABLE)

**Authentication & Authorization**:
- **All API Routes Protected**: Every backend endpoint MUST validate JWT (except public routes like `/auth/login`)
- **JWT Validation**: Verify token signature, expiration, and user claims on EVERY request
- **HTTP-Only Cookies**: Store JWT in HTTP-only cookies (prevents XSS token theft)
- **CORS Configuration**: Restrict origins to frontend domain (no wildcard `*` in production)
- **Session Management**: Implement token refresh flow (short-lived access tokens + refresh tokens)
- **Chat Endpoint**: `/api/{user_id}/chat` MUST validate user_id matches authenticated user

**Data Isolation** (CRITICAL):
- **User Ownership**: Every user-owned resource (tasks, lists, conversations) MUST have `user_id` foreign key
- **Query Filtering**: ALL database queries MUST filter by authenticated user's ID
- **Prohibited**: Cross-user data access (users CANNOT see/modify other users' data or conversations)
- **Enforcement**: Database queries MUST use `WHERE user_id = <authenticated_user_id>`
- **Conversation Isolation**: Users can ONLY access their own conversation threads

**AI-Specific Security** (NEW in Phase 3):

**Prompt Injection Prevention**:
- **System Instructions**: Agent instructions are fixed (users cannot override via input)
- **User Context Separation**: User messages clearly marked with `[User: {user_id}]` prefix
- **Tool Parameter Validation**: All tool inputs validated before execution
- **No Dynamic Tool Addition**: Tool set is static (users cannot add custom tools)

**Tool Access Control**:
- **User ID Required**: ALL MCP tools MUST require user_id parameter
- **Ownership Validation**: Tools MUST verify user owns resource before modification
- **Error Messages**: Tools return `{"error": "Access denied"}` for unauthorized access
- **No Admin Tools**: Agent has NO access to admin operations or other users' data

**Input Validation**:
- **Backend**: ALL API inputs MUST use Pydantic models with validation rules
  - Example: `title: str = Field(min_length=1, max_length=200)`
- **Frontend**: Form validation before submission (client-side UX, not security)
- **SQL Injection Prevention**: Use SQLModel parameterized queries (NEVER string concatenation)
- **XSS Prevention**: React escapes by default; avoid `dangerouslySetInnerHTML` unless sanitized
- **Chat Input**: Validate message length (prevent excessively long inputs)

**Error Handling**:
- **No Sensitive Data in Errors**: Log full details server-side, return generic messages to client
  - Bad: `{"error": "User john@example.com not found in users table"}`
  - Good: `{"error": "Authentication failed"}`
- **Status Codes**: Use appropriate HTTP codes (401 Unauthorized, 403 Forbidden, 404 Not Found)
- **Rate Limiting**: Implement on auth endpoints and chat endpoint (prevent abuse)
- **Agent Errors**: Return user-friendly messages when agent fails

**Environment Secrets**:
- **No Hardcoded Secrets**: Use `.env` files (NEVER commit `.env` to git)
- **Required Secrets**: `DATABASE_URL`, `JWT_SECRET_KEY`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY` (NEW)
- **Secret Rotation**: Document rotation procedures in README
- **API Key Security**: Treat OPENAI_API_KEY as highly sensitive (same level as database credentials)

**Rationale**: JWT authentication provides stateless scalability while HTTP-only cookies prevent XSS attacks. User ID filtering enforces data isolation at the database level. Prompt injection prevention protects against adversarial inputs. Tool access control ensures agent cannot perform unauthorized operations. API key security prevents unauthorized OpenAI API usage and cost overruns.

### VII. Clean Architecture Requirements

**Separation of Concerns** (MANDATORY):

**Frontend Layers**:
1. **UI Layer** (`components/`): React components (presentation only, no business logic)
2. **Chat UI** (`components/ChatInterface.tsx`): ChatKit integration (NEW)
3. **API Client** (`lib/api/`): Fetch wrappers, API call abstraction
4. **State Management** (`lib/store/` if needed): Application state (Context API or Zustand)
5. **Type Definitions** (`types/`): Shared TypeScript interfaces

**Backend Layers**:
1. **API Layer** (`api/routers/`): FastAPI routers (HTTP concerns, request/response mapping)
2. **Agent Layer** (`agent/`): AI agent and agent tools (NEW in Phase 3)
3. **MCP Tools Layer** (`mcp_tools/`): Tool definitions and MCP server (NEW)
4. **Service Layer** (`services/`): Business logic (isolated from HTTP, reusable)
5. **Data Layer** (`models/`): SQLModel models (database schema, queries)
6. **Auth Layer** (`auth/`): Better Auth configuration, JWT utilities

**Dependency Flow** (ENFORCED):
- **Frontend**: Chat UI → API Client → Backend
- **Backend**: API → Agent → Agent Tools → MCP Tools → Service → Data
- **Prohibited**: UI calling Service directly, Agent calling Data directly, API calling Service directly (MUST go through Agent for chat endpoint)

**AI Agent Integration** (NEW in Phase 3):

**Agent Layer Responsibilities**:
- Process natural language input
- Select appropriate tools based on user intent
- Format tool results into natural language responses
- Manage conversation context

**Agent Tools Layer** (agent_tools.py):
- Define `@function_tool` decorated functions
- Import and wrap MCP tools
- Provide LLM-friendly docstrings
- Return consistent response format

**MCP Tools Layer** (mcp_tools.py):
- Define `@mcp.tool` decorated functions
- Implement actual business logic calls
- Validate user ownership
- Return structured data (dict format)

**Example - Task Creation with AI**:

```typescript
// ❌ BAD: Business logic in UI component
function ChatInput() {
  const handleSubmit = (message: string) => {
    if (message.includes("add task")) {
      const title = extractTitle(message)
      createTask({ title }) // Direct business logic
    }
  }
}

// ✅ GOOD: UI delegates to API, agent handles intent
function ChatInput() {
  const handleSubmit = async (message: string) => {
    try {
      const response = await sendChatMessage(message)
      // Agent determines if it's a task creation request
      // Agent calls appropriate tools
      displayMessage(response)
    } catch (error) {
      toast.error(error.message)
    }
  }
}

# Backend agent (natural language processing)
def chat(user_id: str, message: str) -> str:
    agent = create_agent()
    # Agent analyzes message: "add task to buy groceries"
    # Agent calls add_task tool automatically
    result = Runner.run_sync(agent, f"[User: {user_id}] {message}")
    return result.final_output  # "✅ Task added!"

# Agent tool (wraps MCP tool)
@function_tool
def add_task(user_id: str, title: str, description: str = None) -> dict:
    """Add a new task to the user's todo list."""
    return mcp_add_task(user_id, title, description)

# MCP tool (business logic)
@mcp.tool
def add_task(user_id: str, title: str, description: str = None) -> dict:
    """Create task in database."""
    with Session(engine) as session:
        task = Task(user_id=user_id, title=title, description=description)
        session.add(task)
        session.commit()
        return {"task_id": task.id, "status": "created", "title": title}
```

**Business Logic Location**:
- **MCP Tools Layer**: All validation, calculations, database operations
- **Agent Layer**: Natural language understanding, tool selection, response formatting
- **Not in API Layer**: Routers delegate to agent (thin controllers)
- **Not in Data Layer**: Models are pure data structures (no complex methods)
- **Not in Frontend**: UI components display data, call APIs (no business rules)

**Interface Contracts**:
- **API Contracts**: Shared TypeScript types (ChatRequest, ChatResponse)
- **Tool Contracts**: MCP tools return standardized dict format
- **Version API**: Use `/api/v1/` prefix for future compatibility
- **Consistent Responses**: Standardize success/error response shapes

**Rationale**: Separation of concerns enables independent testing, reuse, and scaling. Agent layer isolates natural language processing from business logic. MCP tools provide reusable interface for future agent implementations. Thin API controllers keep routing simple. Shared type definitions prevent frontend/backend drift.

### VIII. AI Agent Principles (NEW in Phase 3)

**Natural Language Understanding** (MANDATORY):

**Agent Instructions**:
- **Clear Capabilities**: Define what the agent CAN do (add/list/complete/update/delete tasks)
- **Response Style**: Friendly, concise confirmations with emoji (✅ for success)
- **Tool Guidance**: Explain when to use each tool
- **Boundaries**: Specify what agent CANNOT do (no admin operations, no other users' data)
- **Clarification**: Agent MUST ask for clarification when intent is unclear

**Agent Configuration**:
```python
INSTRUCTIONS = """
You are a friendly Todo Assistant. Help users manage their task list.

## Your Capabilities:
- Add tasks: When users want to create/add/remember something
- List tasks: When users ask to see/show/view their tasks
- Complete tasks: When users say done/finished/complete
- Update tasks: When users want to change task details
- Delete tasks: When users want to remove tasks

## Response Style:
- Be friendly and concise
- Always confirm actions (e.g., "Task added!", "Marked as complete!")
- Use checkmark emoji (✅) for completed actions
- Format task lists clearly with numbers

## Important Rules:
- Never make up task IDs - always list tasks first if you need IDs
- Always include user_id when calling tools
- If unsure what the user wants, ask for clarification
- If a tool returns an error, explain it clearly to the user
"""
```

**Tool Calling** (CRITICAL):

**Tool Design Requirements**:
- **Type Hints**: ALL parameters MUST have type hints (generates JSON schema)
- **Docstrings**: MUST include description, Args section, Returns section
- **User Context**: MUST accept user_id parameter (for data isolation)
- **Error Handling**: Return error dict instead of raising exceptions
- **Consistent Format**: Return dict with predictable keys (status, data, error)

**Tool Response Format**:
```python
# Success
{"status": "success", "task_id": 1, "title": "Buy groceries"}

# Error
{"status": "error", "message": "Task not found"}
```

**Conversation Management**:

**Stateless Design** (NON-NEGOTIABLE):
- **No In-Memory State**: Agent instance created fresh for each request
- **History Loading**: Load conversation history from database on each request
- **Persistence**: Save user message and agent response to database after each turn
- **Resumability**: Conversations survive server restarts

**Conversation Database Schema**:
```python
class Conversation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    created_at: datetime
    updated_at: datetime

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id")
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime
```

**Error Handling**:

**Graceful Degradation** (MANDATORY):
- **Agent Errors**: Return user-friendly message ("I encountered an issue. Please try again.")
- **Tool Errors**: Agent explains error in natural language
- **OpenAI API Errors**: Log full error, show generic message to user
- **Timeout Handling**: Return error after reasonable timeout (30s default)

**Error Logging**:
```python
try:
    result = Runner.run_sync(agent, message)
    return result.final_output
except Exception as e:
    logger.error(f"Agent error: {e}", exc_info=True)  # Log with stack trace
    return "I encountered an issue processing your request. Please try again."
```

**Agent Testing** (REQUIRED):

**Unit Tests**:
- Mock OpenAI API calls
- Test tool selection logic
- Verify response formatting

**Integration Tests**:
- Test agent with real tools (mock database)
- Verify conversation flow
- Test error scenarios

**Cost Management**:

**API Usage Control**:
- **Model Selection**: Use gpt-4o-mini (fast, cost-effective)
- **Token Limits**: Set reasonable max_tokens (prevent runaway costs)
- **Rate Limiting**: Limit requests per user per minute
- **Monitoring**: Log token usage per request
- **Budget Alerts**: Set up OpenAI usage alerts

**Rationale**: Clear agent instructions guide LLM behavior and reduce errors. Type-safe tools prevent runtime failures. Stateless design enables horizontal scaling. Database persistence ensures reliability. Graceful error handling provides good user experience. Cost management prevents unexpected API bills.

## Development Workflow

### Mandatory SDD Sequence

```
User Request → /sp.specify → /sp.plan → /sp.tasks → /sp.implement
```

**Flow Details**:

1. **Specify Phase**: Capture WHAT needs to be built (user stories, requirements, success criteria)
2. **Plan Phase**: Define HOW it will be built (architecture, technical approach, design decisions)
3. **Tasks Phase**: Break down INTO executable tasks (concrete, testable, independently verifiable)
4. **Implement Phase**: Execute tasks with `/sp.implement` (NO manual coding allowed)

**Checkpoint**: Each phase MUST be complete before proceeding to next phase. No skipping allowed.

### Task Tracking

- **Task IDs**: Sequential format `TASK-001`, `TASK-002`, etc. within each feature
- **Task Status**: Tracked with checkboxes in `tasks.md`:
  - `[ ]` - Pending (not started)
  - `[>]` - In Progress (actively being worked)
  - `[x]` - Completed (done and verified)
- **Code Annotation**: All code changes MUST include Task ID reference (file headers)
- **Commit Messages**: MUST include Task ID for traceability

### Prompt History Records (PHR)

Every user interaction MUST create a PHR in `history/prompts/`:

- **Constitution changes** → `history/prompts/constitution/`
- **Feature work** → `history/prompts/<feature-name>/`
- **General queries** → `history/prompts/general/`

**PHR Purpose**: Capture decision context, document why choices were made, enable learning from past interactions, provide audit trail for project evolution.

### Architecture Decision Records (ADR)

Significant architectural decisions MUST be documented in `history/adr/`.

**ADR Significance Test** (ALL must be true):
1. **Long-term impact**: Decision affects system design for extended period
2. **Multiple alternatives**: More than one viable approach was considered
3. **Cross-cutting concerns**: Decision influences multiple components or system design

**Process**: Agent suggests ADR when significance test passes. User must approve ADR creation. ADRs are NEVER auto-created.

**Suggestion Format**:
```
📋 Architectural decision detected: <brief description>
   Document reasoning and tradeoffs? Run `/sp.adr <decision-title>`
```

## Quality Gates

### Constitution Check (Pre-Planning Gate)

Before any planning work begins, verify:

- [ ] Frontend stack matches constitution (Next.js 16+, TypeScript 5.7+, Tailwind CSS, ChatKit)
- [ ] Backend stack matches constitution (FastAPI, Python 3.13+, SQLModel, Neon PostgreSQL)
- [ ] AI stack matches constitution (OpenAI Agents SDK 0.6.5+, FastMCP 2.14+)
- [ ] Authentication uses Better Auth with JWT
- [ ] Architecture follows multi-tier structure with AI agent layer
- [ ] Security principles addressed (JWT protection, user data isolation, tool access control)
- [ ] Conversation persistence in database (stateless agent design)
- [ ] OPENAI_API_KEY environment variable configured
- [ ] No prohibited dependencies or patterns proposed
- [ ] Scope is appropriate for hackathon (not over-engineered)

**Action**: If violations detected, STOP and either adjust plan or justify complexity with ADR.

### Pre-Commit Checks

Before any commit:

**Backend**:
- [ ] Type checking passes (`mypy --strict`)
- [ ] All tests pass (`pytest`)
- [ ] Coverage >= 80% for modified modules (`pytest --cov`)
- [ ] Linting passes (`ruff check`)
- [ ] Formatting applied (`ruff format`)
- [ ] Agent tool docstrings complete (if modified)
- [ ] MCP tool type hints present (if modified)

**Frontend**:
- [ ] Type checking passes (`tsc --noEmit`)
- [ ] All tests pass (`vitest run`)
- [ ] Linting passes (`eslint`)
- [ ] Formatting applied (`prettier --write`)
- [ ] Chat component types defined (if modified)

**Both**:
- [ ] Every modified file has Task ID reference
- [ ] Commit message includes Task ID
- [ ] No `.env` files committed (secrets safety)
- [ ] OPENAI_API_KEY not hardcoded anywhere

**Action**: If any check fails, FIX before committing. No exceptions.

### Definition of Done

A task is complete ONLY when ALL criteria met:

- [ ] Code implements task requirements as specified in `tasks.md`
- [ ] Type hints (Python) or TypeScript types (frontend) present on all functions/components
- [ ] Docstrings (Python) or JSDoc comments (TypeScript) on all public APIs
- [ ] Agent tool docstrings include Args/Returns sections (if applicable)
- [ ] MCP tools have type hints and return dict format (if applicable)
- [ ] Tests written and passing for new/changed functionality
- [ ] Code coverage >= 80% maintained
- [ ] Security checks pass (JWT validation, input validation, user isolation where applicable)
- [ ] Tool access control verified (user_id parameter, ownership checks)
- [ ] Task ID referenced in code headers and commit message
- [ ] PHR created documenting work session
- [ ] No console errors or warnings in browser/terminal
- [ ] Agent errors handled gracefully (if applicable)

**Verification**: Review checklist before marking task as `[x]` completed in `tasks.md`.

## Governance

### Constitution Authority

This constitution supersedes all other development practices and preferences. When conflicts arise between constitution rules and other guidance, constitution rules MUST be followed.

### Amendment Process

1. **Propose**: Document proposed change with clear rationale
2. **Approve**: Get explicit user approval for amendment
3. **Version**: Bump version according to semantic versioning:
   - **MAJOR** (x.0.0): Backward incompatible principle removals or redefinitions (e.g., tech stack change, architectural paradigm shift)
   - **MINOR** (0.x.0): New principles/sections added or materially expanded guidance
   - **PATCH** (0.0.x): Clarifications, wording fixes, non-semantic refinements
4. **Document**: Create ADR documenting the amendment reasoning
5. **Propagate**: Update all dependent templates/scripts affected by change
6. **Sync**: Update Sync Impact Report at top of constitution file

### Compliance Verification

The SDD agent is responsible for:

- **Blocking non-compliant implementations**: Refuse to proceed if constitution violated (e.g., manual coding attempted)
- **Suggesting corrections**: When violations detected, propose compliant alternatives
- **Creating PHRs**: Document all user interactions per PHR guidelines
- **Recommending ADRs**: Suggest ADRs when significance test passes
- **Enforcing NO MANUAL CODING**: Only `/sp.implement` allowed for code changes
- **Validating AI Security**: Ensure prompt injection prevention and tool access control

### Override Protocol

User CAN override specific constitution constraints with **explicit approval**:

1. Agent detects constitutional violation
2. Agent explains which rule is being violated and why
3. User provides explicit override approval with justification
4. Agent documents override in PHR with justification
5. If significant, agent suggests ADR to document reasoning

**Documentation Requirement**: All overrides MUST be documented. No silent violations allowed.

**Common Override Scenarios**:
- Emergency hotfix (bypass `/sp.specify` for critical bug)
- Exploration spike (manual coding to prototype before spec)
- Third-party library addition (justify why stdlib/approved stack insufficient)
- Alternative AI model (justify why gpt-4o-mini insufficient)

### Enforcement

Constitution compliance is verified at:

- **Planning**: Constitution Check gate before design work begins
- **Task Generation**: Tasks must align with SDD workflow requirements
- **Implementation**: Pre-commit checks enforce quality gates
- **Review**: Definition of Done checklist verification before task completion

**Escalation**: If systematic violations occur, revisit constitution to determine if amendment needed or if enforcement needs strengthening.

---

**Version**: 3.0.0 | **Ratified**: 2026-01-12 | **Last Amended**: 2026-01-29
