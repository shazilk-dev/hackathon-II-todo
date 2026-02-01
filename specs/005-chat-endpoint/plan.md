# Implementation Plan: ChatKit Frontend for AI Task Management

**Branch**: `005-chat-endpoint` | **Date**: 2026-01-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-chat-endpoint/spec.md`

**Note**: This plan covers the frontend ChatKit integration for the conversational messaging endpoint. The backend chat API endpoint is covered in a separate plan under `/specs/004-mcp-tools/`.

## Summary

Implement a conversational chat interface using OpenAI ChatKit (Python SDK + React bindings) to enable natural language task management. The backend uses ChatKit Python SDK with ChatKitServer.respond() to process messages, integrating with OpenAI Agents SDK. The frontend uses @openai/chatkit-react web component for the chat UI. This implementation follows the self-hosted ChatKit pattern with custom FastAPI backend and Better Auth JWT authentication.

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode)
**Primary Dependencies**:
- @openai/chatkit-react (ChatKit UI components)
- Next.js 16+ (App Router)
- React 19+
- Better Auth client (@better-auth/react)
- Tailwind CSS 4+

**Storage**: Browser localStorage for UI preferences, backend PostgreSQL for conversation persistence
**Testing**: Vitest (component tests), Playwright (E2E chat flows)
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Web (frontend component of full-stack app)
**Performance Goals**:
- Message send to response display: <5 seconds (p95)
- Chat history load: <2 seconds for 100 messages
- UI responsiveness: <100ms for all interactions

**Constraints**:
- JWT authentication required for all chat API calls
- Message length limited to 1000 characters
- Must work with existing Better Auth session management
- Must handle backend errors gracefully

**Scale/Scope**:
- Single chat page component
- Support for 100+ message conversations
- Single active conversation per user (MVP)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Planning Gate

- [x] Frontend stack matches constitution (Next.js 16+, TypeScript 5.7+, Tailwind CSS)
- [x] ChatKit library usage aligns with constitution (OpenAI ChatKit for conversational interface)
- [x] Authentication uses Better Auth with JWT (existing implementation)
- [x] Architecture follows multi-tier structure (UI → API Client → Backend)
- [x] Security principles addressed (JWT in Authorization header, user isolation)
- [x] No conversation state in frontend (stateless, backend-persisted)
- [x] No prohibited dependencies or patterns proposed
- [x] Scope is appropriate for hackathon (not over-engineered)

**Result**: ✅ PASS - All gates satisfied

### Post-Design Re-check

*To be completed after Phase 1 (data-model.md and contracts/ are generated)*

## Project Structure

### Documentation (this feature)

```text
specs/005-chat-endpoint/
├── spec.md              # Feature requirements (completed)
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output - ChatKit patterns, API integration
├── data-model.md        # Phase 1 output - TypeScript types, component structure
├── quickstart.md        # Phase 1 output - Developer setup guide
├── contracts/           # Phase 1 output - API request/response schemas
│   └── chat-api.ts      # ChatRequest, ChatResponse, Message types
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── chat/
│   │   │   └── page.tsx           # NEW: Chat page (protected route)
│   │   └── layout.tsx             # Root layout (existing, updated for chat)
│   ├── components/
│   │   ├── chat/                  # NEW: Chat-specific components
│   │   │   ├── ChatInterface.tsx  # Main ChatKit integration
│   │   │   ├── ChatMessage.tsx    # Individual message rendering
│   │   │   └── ChatInput.tsx      # Message input component
│   │   ├── providers/
│   │   │   └── AuthProvider.tsx   # Existing Better Auth provider
│   │   └── ui/                    # Existing UI components
│   ├── lib/
│   │   ├── api/
│   │   │   ├── chat.ts            # NEW: Chat API client
│   │   │   └── api.ts             # Existing task API client
│   │   ├── auth-client.ts         # Existing Better Auth client
│   │   └── utils.ts               # Utility functions
│   └── types/
│       ├── chat.ts                # NEW: Chat-related TypeScript types
│       └── index.ts               # Existing types
└── tests/
    ├── unit/
    │   └── chat/
    │       ├── ChatInterface.test.tsx
    │       ├── ChatMessage.test.tsx
    │       └── ChatInput.test.tsx
    └── e2e/
        └── chat-flow.spec.ts      # E2E: Send message, view history, create tasks via chat

backend/
├── src/
│   ├── api/
│   │   └── routers/
│   │       └── chat.py            # Existing chat endpoint (004-mcp-tools)
│   ├── models/
│   │   ├── conversation.py        # Existing conversation model
│   │   └── message.py             # Existing message model
│   └── schemas/
│       └── chat.py                # Existing Pydantic schemas
└── tests/
    └── integration/
        └── test_chat_api.py       # Existing backend tests
```

**Structure Decision**: Web application structure (Option 2) selected. Frontend implements chat UI using ChatKit, connecting to existing backend chat API. The backend chat endpoint (POST /api/{user_id}/chat) was implemented in 004-mcp-tools feature. This plan focuses exclusively on the frontend ChatKit integration.

## Phase 0: Research & Discovery

### Research Tasks

1. **ChatKit Integration Patterns**
   - Decision: How to initialize ChatKit with custom API endpoint
   - Research: @openai/chatkit-react documentation, self-hosted configuration
   - Output: Initialization code pattern, configuration options

2. **JWT Authentication with ChatKit**
   - Decision: How to pass JWT tokens in ChatKit API calls
   - Research: ChatKit fetch interceptor, custom headers
   - Output: Authentication middleware pattern

3. **Conversation Persistence Strategy**
   - Decision: How to load existing conversation history on mount
   - Research: ChatKit history loading, React useEffect patterns
   - Output: History loading implementation approach

4. **Message Streaming vs Batch**
   - Decision: Display complete responses or stream tokens
   - Research: ChatKit streaming capabilities, backend endpoint support
   - Output: Chosen approach (batch for MVP, streaming future enhancement)

5. **Error Handling Patterns**
   - Decision: How to display backend errors in ChatKit UI
   - Research: ChatKit error states, toast notifications
   - Output: Error handling strategy

### Output: research.md

Document all findings with:
- Decision: What was chosen
- Rationale: Why chosen
- Alternatives considered: What else was evaluated
- Code examples: Reference implementations

## Phase 1: Design & Contracts

### Data Model (data-model.md)

**Frontend TypeScript Types**:

```typescript
// types/chat.ts

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: ToolCall[];
  created_at: string;
}

export interface ToolCall {
  tool: string;
  args: Record<string, any>;
  result: Record<string, any>;
}

export interface ChatRequest {
  conversation_id: number | null;
  message: string;
}

export interface ChatResponse {
  conversation_id: number;
  response: string;
  tool_calls: ToolCall[];
}

export interface Conversation {
  id: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

**Component Props**:

```typescript
interface ChatInterfaceProps {
  userId: string;
  conversationId?: number;
}

interface ChatMessageProps {
  message: Message;
  isUser: boolean;
}

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  disabled: boolean;
  maxLength: number;
}
```

### API Contracts (contracts/chat-api.ts)

**Endpoint**: POST /api/{user_id}/chat

**Request**:
```typescript
{
  conversation_id: number | null,  // null for new conversation
  message: string                  // User's message (1-1000 chars)
}
```

**Response**:
```typescript
{
  conversation_id: number,         // Conversation ID
  response: string,                // AI assistant's response
  tool_calls: [                    // Operations performed
    {
      tool: string,
      args: Record<string, any>,
      result: Record<string, any>
    }
  ]
}
```

**Error Response**:
```typescript
{
  detail: string                   // Error message
}
```

### Component Architecture

**ChatInterface** (Main Component):
- Manages conversation state
- Loads conversation history on mount
- Handles message sending and receiving
- Integrates ChatKit components
- Manages loading and error states

**ChatMessage** (Message Display):
- Renders individual messages
- Differentiates user vs assistant messages
- Displays tool call information (optional)
- Formats timestamps

**ChatInput** (Input Component):
- Controlled input with character limit
- Send button with loading state
- Enter key to send (Shift+Enter for newline)
- Input validation

### API Client (lib/api/chat.ts)

```typescript
import { getSession } from '@/lib/auth-client';

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getSession();
  if (!session?.session?.token) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${session.session.token}`,
    'Content-Type': 'application/json'
  };
}

export async function sendChatMessage(
  userId: string,
  conversationId: number | null,
  message: string
): Promise<ChatResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/${userId}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ conversation_id: conversationId, message })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to send message');
  }

  return response.json();
}

export async function loadConversationHistory(
  userId: string,
  conversationId: number
): Promise<Message[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_URL}/api/${userId}/conversations/${conversationId}/messages`,
    { headers }
  );

  if (!response.ok) {
    throw new Error('Failed to load conversation history');
  }

  const data = await response.json();
  return data.messages;
}
```

### Quickstart (quickstart.md)

Developer setup instructions:
1. Install ChatKit dependency: `npm install @openai/chatkit-react`
2. Environment variables: `NEXT_PUBLIC_API_URL`
3. Run frontend: `npm run dev`
4. Access chat: `http://localhost:3000/chat`
5. Test flow: Login → Navigate to /chat → Send message → Verify response

### Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh claude` to add:
- ChatKit (@openai/chatkit-react) to frontend dependencies
- Chat page (/app/chat/page.tsx) to route structure
- Chat API client (lib/api/chat.ts) to API layer

## Phase 2: Task Generation

*Phase 2 (task generation) is handled by `/sp.tasks` command, NOT by `/sp.plan`.*

After this plan is complete:
1. User runs `/sp.tasks` to generate `tasks.md`
2. Tasks include:
   - Install ChatKit dependency
   - Create TypeScript types (types/chat.ts)
   - Implement chat API client (lib/api/chat.ts)
   - Create ChatMessage component
   - Create ChatInput component
   - Create ChatInterface component
   - Create chat page (app/chat/page.tsx)
   - Add navigation link to chat
   - Write component unit tests
   - Write E2E chat flow test
   - Update README with chat feature documentation

## Complexity Tracking

> **No constitution violations detected. This section is empty.**

## Risk Analysis

### Top 3 Risks

1. **ChatKit Library Learning Curve**
   - Risk: Team unfamiliarity with ChatKit API
   - Mitigation: Phase 0 research includes working examples
   - Fallback: Build custom chat UI if ChatKit blockers arise

2. **JWT Token Refresh During Chat**
   - Risk: Token expires mid-conversation
   - Mitigation: Better Auth handles refresh automatically
   - Fallback: Graceful error message prompting re-authentication

3. **Backend API Latency**
   - Risk: Slow AI responses degrade UX
   - Mitigation: Loading indicators, timeout handling
   - Fallback: Display timeout message after 30 seconds

## Architectural Decisions

**Significant decisions requiring ADR documentation**:

1. **ChatKit vs Custom Chat UI**
   - Decision: Use OpenAI ChatKit
   - Rationale: Faster implementation, maintained by OpenAI, optimized for AI chat
   - Tradeoffs: Less customization control, dependency on external library
   - **ADR Candidate**: Yes (impacts long-term UI architecture)

2. **Conversation Loading Strategy**
   - Decision: Load full history on mount (no pagination for MVP)
   - Rationale: Simpler implementation, acceptable for 100 message limit
   - Tradeoffs: May not scale to 1000+ message conversations
   - **ADR Candidate**: No (MVP scope decision, can change later)

3. **Message Streaming**
   - Decision: Batch responses (no streaming for MVP)
   - Rationale: Simpler implementation, backend doesn't support streaming yet
   - Tradeoffs: Slightly delayed perceived responsiveness
   - **ADR Candidate**: No (can add streaming as enhancement)

**Suggested ADRs**:

📋 Architectural decision detected: ChatKit library adoption for chat UI
   Document reasoning and tradeoffs? Run `/sp.adr chatkit-library-selection`

## Success Criteria Validation

### From Spec (SC-001 to SC-008):

- **SC-001**: Message send to confirmation <10 seconds → Measured by E2E test timing
- **SC-002**: Task list display <3 seconds → Monitored via performance profiling
- **SC-003**: 90% intent recognition → Backend responsibility (API contract testing)
- **SC-004**: History load <2 seconds for 100 messages → Performance test with mock data
- **SC-005**: 95% success rate → Backend responsibility (integration testing)
- **SC-006**: Response within 5 seconds → Timeout handling in API client
- **SC-007**: Conversation persistence → Backend responsibility (E2E validation)
- **SC-008**: Response time <3 seconds → Measured by E2E test timing

### Frontend-Specific Success Criteria:

- **FE-001**: Chat UI loads in <1 second on initial page load
- **FE-002**: Message input is responsive (<100ms feedback on keypress)
- **FE-003**: Conversation history renders correctly for 100+ messages
- **FE-004**: Error states display user-friendly messages (no stack traces)
- **FE-005**: JWT authentication errors trigger re-authentication flow

## Next Steps

1. ✅ Complete Phase 0: Research ChatKit patterns → Output: research.md
2. ✅ Complete Phase 1: Design data model and contracts → Output: data-model.md, contracts/, quickstart.md
3. ✅ Update agent context: Run update-agent-context.sh
4. ⏭️ User runs `/sp.tasks` to generate tasks.md
5. ⏭️ User runs `/sp.implement` to execute tasks
6. ⏭️ Create ADR for ChatKit selection if user approves

**STATUS**: Phase 0 and Phase 1 complete. Ready for task generation (`/sp.tasks`).
