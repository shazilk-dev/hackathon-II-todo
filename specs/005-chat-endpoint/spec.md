# Feature Specification: Conversational Messaging Endpoint for AI Task Management

**Feature Branch**: `005-chat-endpoint`
**Created**: 2026-01-29
**Status**: Draft
**Input**: User description: "Create specification for Chat API endpoint.

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
9. Return response with tool_calls"

## User Scenarios & Testing

### User Story 1 - Start New Conversation (Priority: P1)

Users can initiate a conversation with the AI assistant by sending their first message without an existing conversation, and the system creates a new conversation thread.

**Why this priority**: This is the entry point for all AI interactions. Without the ability to start new conversations, users cannot access the conversational task management feature at all. This is the foundational capability.

**Independent Test**: Can be fully tested by sending a message without conversation ID, verifying system creates new conversation and returns conversation ID with AI response. Delivers standalone value as the chat initiation capability.

**Acceptance Scenarios**:

1. **Given** authenticated user with no existing conversation, **When** user sends message without conversation_id, **Then** system creates new conversation, saves message, processes with AI, and returns conversation_id with response
2. **Given** authenticated user, **When** user sends "Add task to buy groceries" as first message, **Then** system creates conversation, AI processes intent, executes task creation, and returns confirmation with conversation_id
3. **Given** unauthenticated user, **When** user attempts to send message, **Then** system rejects request with authentication error
4. **Given** authenticated user, **When** user sends empty message, **Then** system rejects request with validation error indicating message is required
5. **Given** authenticated user, **When** user sends very long message (>1000 characters), **Then** system rejects request with error indicating message length limit

---

### User Story 2 - Continue Existing Conversation (Priority: P1)

Users can send additional messages within an existing conversation thread, maintaining context and history throughout the interaction.

**Why this priority**: Equally critical as starting conversations - users need to have multi-turn dialogues where the AI remembers previous context. This enables natural conversation flow like "What's on my list?" followed by "Mark task 3 as done".

**Independent Test**: Can be tested by starting a conversation, noting the conversation_id, then sending follow-up message with that ID and verifying AI has access to previous message history.

**Acceptance Scenarios**:

1. **Given** user has existing conversation with ID 5, **When** user sends message with conversation_id: 5, **Then** system retrieves conversation history, processes message with context, saves new messages, and returns response
2. **Given** user sent "Add task to buy groceries" previously, **When** user sends "Mark that task as done" in same conversation, **Then** system uses conversation context to identify which task to mark complete
3. **Given** conversation_id 99 doesn't exist, **When** user sends message with conversation_id: 99, **Then** system returns error indicating conversation not found
4. **Given** conversation belongs to different user, **When** user attempts to send message to that conversation, **Then** system rejects request with access denied error
5. **Given** conversation has 100+ previous messages, **When** user sends new message, **Then** system loads history efficiently and processes message within acceptable time

---

### User Story 3 - Receive AI-Generated Responses (Priority: P1)

Users receive natural language responses from the AI assistant that confirm actions taken, answer questions, and provide task information.

**Why this priority**: Core value delivery - users need to receive responses to their messages. Without responses, the chat is useless. This completes the request-response cycle.

**Independent Test**: Can be tested by sending various message types (task creation, task query, task completion) and verifying appropriate responses are returned in natural language.

**Acceptance Scenarios**:

1. **Given** user sends "Add task to buy groceries", **When** system processes message, **Then** response includes confirmation like "✅ Task added!" and conversation_id
2. **Given** user sends "Show me my tasks", **When** system processes message, **Then** response includes formatted list of user's tasks
3. **Given** user sends "Mark task 3 as done", **When** system processes message, **Then** response confirms completion like "✅ Marked 'Buy groceries' as complete!"
4. **Given** user sends ambiguous message like "do the thing", **When** system cannot determine intent, **Then** response asks for clarification
5. **Given** system encounters error during processing, **When** error occurs, **Then** response provides user-friendly error message without technical details

---

### User Story 4 - View Tool Execution Details (Priority: P2)

Users receive information about which operations were performed on their behalf, providing transparency into what the AI assistant did in response to their message.

**Why this priority**: Provides transparency and trust - users can see exactly what actions the AI took. P2 (not P1) because the feature works without this, but transparency improves user confidence and debuggability.

**Independent Test**: Can be tested by sending message that triggers operations (like "Add task to buy groceries"), then verifying response includes tool_calls array showing which operation was executed and its result.

**Acceptance Scenarios**:

1. **Given** user sends "Add task to buy groceries", **When** AI processes message and creates task, **Then** response includes tool_calls with tool name "add_task", arguments used, and result returned
2. **Given** user sends "Show me my tasks", **When** AI retrieves task list, **Then** response includes tool_calls showing "list_tasks" was invoked
3. **Given** user sends conversational message with no operations, **When** AI responds without executing operations, **Then** response has empty or null tool_calls array
4. **Given** user sends message triggering multiple operations, **When** AI executes operations sequentially, **Then** response includes tool_calls array with all operations performed in order
5. **Given** operation fails during execution, **When** error occurs, **Then** tool_calls includes operation that failed and error details

---

### User Story 5 - Access Control and User Isolation (Priority: P1)

System enforces user isolation ensuring users can only access their own conversations and task data through the chat endpoint.

**Why this priority**: Security fundamental - prevents unauthorized access to other users' data. This is P1 because without proper isolation, the feature is insecure and unusable in production.

**Independent Test**: Can be tested by attempting to send message with different user's conversation_id and verifying access is denied, or by verifying all operations executed by AI are scoped to authenticated user.

**Acceptance Scenarios**:

1. **Given** authenticated as user A, **When** user A sends message, **Then** AI operations execute only on user A's tasks and conversations
2. **Given** authenticated as user A, **When** user A provides user B's conversation_id, **Then** system rejects request with access denied error
3. **Given** authenticated user, **When** user's session expires during request, **Then** system returns authentication error
4. **Given** user sends message, **When** AI executes task operations, **Then** all operations validate user ownership before modifying data
5. **Given** user sends "Show me all tasks", **When** AI retrieves tasks, **Then** only authenticated user's tasks are returned, never other users' data

---

### Edge Cases

- **What happens when message contains only whitespace?** System validates message has non-whitespace content and returns error if empty/whitespace-only.

- **What happens when conversation_id is provided but conversation belongs to different user?** System validates user owns conversation before allowing access and returns 403 Forbidden error.

- **What happens when conversation_id is negative or invalid integer format?** System validates conversation_id is positive integer and returns 400 Bad Request for invalid values.

- **What happens when AI processing takes longer than expected (30+ seconds)?** System times out after reasonable duration and returns error indicating temporary unavailability.

- **What happens when AI executes operation but operation fails?** AI receives error from operation and formulates natural language error message to return to user.

- **What happens when user sends message while previous message is still processing?** Requests are processed independently - second request queues behind first (handled at API layer concurrency control).

- **What happens when conversation history becomes very long (500+ messages)?** System loads history efficiently, potentially with pagination or windowing to maintain performance.

- **What happens when message contains malicious content or injection attempts?** System validates and sanitizes inputs; AI processes safely without executing unintended operations.

- **What happens when authentication token is missing or invalid?** System returns 401 Unauthorized before processing message.

- **What happens when user sends non-English message?** System accepts any valid Unicode text; AI processes to best of ability (English-only for MVP per assumptions).

## Requirements

### Functional Requirements

- **FR-001**: System MUST accept messages from authenticated users identified by user_id in endpoint path
- **FR-002**: System MUST validate user authentication before processing any message
- **FR-003**: System MUST accept optional conversation_id (integer or null) to identify conversation thread
- **FR-004**: System MUST accept message text as required input parameter
- **FR-005**: System MUST create new conversation when conversation_id is null
- **FR-006**: System MUST retrieve existing conversation when conversation_id is provided
- **FR-007**: System MUST validate user owns conversation before allowing access
- **FR-008**: System MUST store user's message in conversation history with timestamp and role
- **FR-009**: System MUST load conversation history to provide context for AI processing
- **FR-010**: System MUST process message through AI assistant that understands task management intents
- **FR-011**: System MUST execute task operations (create/list/complete/update/delete) as determined by AI
- **FR-012**: System MUST ensure all operations executed are scoped to authenticated user (user isolation)
- **FR-013**: System MUST store AI's response message in conversation history with timestamp and role
- **FR-014**: System MUST return conversation_id in response (new or existing)
- **FR-015**: System MUST return AI's natural language response text
- **FR-016**: System MUST return information about operations executed during message processing
- **FR-017**: System MUST validate message is non-empty and within length limits (1-1000 characters)
- **FR-018**: System MUST return appropriate error messages when validation fails or processing errors occur
- **FR-019**: System MUST handle concurrent requests to same conversation correctly
- **FR-020**: System MUST complete request within reasonable time limit (30 seconds timeout)

### Key Entities

- **Chat Message Request**: User's input to the conversation endpoint
  - User identification (from authenticated session)
  - Optional conversation identifier (null for new, integer for existing)
  - Message text content
  - Requires authentication for all requests

- **Chat Message Response**: System's output from conversation endpoint
  - Conversation identifier (new or existing)
  - AI-generated response text
  - List of operations executed (for transparency)
  - Each operation includes tool name, arguments, and result

- **Conversation Thread**: Ongoing dialogue between user and AI
  - Belongs to single user (user isolation enforced)
  - Contains chronological message history
  - Provides context for multi-turn conversations
  - Persists across sessions

- **Message History**: Chronological record of conversation turns
  - Each message has role (user or assistant)
  - Each message has content (text)
  - Each message has timestamp
  - Loaded to provide context for AI processing

- **Operation Execution Record**: Trace of actions performed by AI
  - Operation name (which task operation was called)
  - Operation arguments (inputs provided)
  - Operation result (output returned)
  - Included in response for transparency

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users receive AI response within 5 seconds for 95% of messages
- **SC-002**: Users can start new conversations and receive response in single request (no additional setup required)
- **SC-003**: Users can send messages to existing conversations and maintain context across 100% of turns
- **SC-004**: System correctly enforces user isolation - zero unauthorized cross-user conversation access
- **SC-005**: 99% of valid messages receive successful AI responses
- **SC-006**: System processes 100 concurrent chat requests without degradation
- **SC-007**: Conversation history loads efficiently (under 2 seconds) for conversations with 100+ messages
- **SC-008**: Operation transparency - 100% of responses include accurate information about operations executed

### User Experience Criteria

- **UX-001**: AI responses are conversational and friendly (not technical or robotic)
- **UX-002**: Error messages are user-friendly and actionable (no stack traces or technical jargon)
- **UX-003**: Users can seamlessly continue conversations across multiple sessions
- **UX-004**: Operation execution is transparent - users understand what actions AI took
- **UX-005**: System responds appropriately to ambiguous or unclear messages (asks for clarification)

## Assumptions

- Authentication is handled by API layer before reaching chat endpoint (JWT token validation)
- User ID is extracted from authenticated session and used for all operations
- Conversation IDs are positive integers auto-generated by system
- Message length is limited to 1000 characters (prevent abuse and excessive processing)
- Conversation history is loaded in full for each request (windowing not required for MVP)
- AI processing is synchronous (request waits for AI response before returning)
- English language only for MVP (AI instructions and responses)
- Conversation history retained indefinitely (no automatic purging)
- Tool calls array includes all operations executed, in chronological order
- Errors from operation execution are handled gracefully by AI (converted to natural language)
- Request timeout is 30 seconds (covers AI processing and operation execution)
- Concurrent requests to same conversation are handled safely (no race conditions)

## Database Schema

### Overview

This section defines the database schema for conversation and message persistence using Neon PostgreSQL. The schema extends the existing Phase II database structure (users and tasks tables) with new tables for conversational messaging.

### Schema Design

#### Table: conversations

Stores conversation threads between users and the AI assistant.

**Columns**:
- `id` (SERIAL PRIMARY KEY): Auto-incrementing unique identifier for each conversation
- `user_id` (TEXT NOT NULL): References the user who owns this conversation (foreign key to users.id)
- `created_at` (TIMESTAMP DEFAULT NOW()): Timestamp when conversation was created
- `updated_at` (TIMESTAMP DEFAULT NOW()): Timestamp when conversation was last updated (on new message)

**Constraints**:
- Primary Key: `id`
- Foreign Key: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- Index: `idx_conversations_user_id` on `user_id` (for efficient filtering by user)

**Notes**:
- Each conversation belongs to exactly one user (enforces user isolation)
- Cascade delete ensures conversations are removed when user is deleted
- `updated_at` is automatically updated when new messages are added

#### Table: messages

Stores individual messages within conversations, maintaining complete chat history.

**Columns**:
- `id` (SERIAL PRIMARY KEY): Auto-incrementing unique identifier for each message
- `conversation_id` (INTEGER NOT NULL): References the conversation this message belongs to (foreign key to conversations.id)
- `user_id` (TEXT NOT NULL): User who owns this message (redundant with conversation.user_id but enables efficient queries)
- `role` (VARCHAR(20) NOT NULL): Message role - either "user" or "assistant"
- `content` (TEXT NOT NULL): The actual message text content
- `tool_calls` (JSONB): Optional JSON array containing tool execution details (only for assistant messages)
- `created_at` (TIMESTAMP DEFAULT NOW()): Timestamp when message was created

**Constraints**:
- Primary Key: `id`
- Foreign Key: `conversation_id` REFERENCES `conversations(id)` ON DELETE CASCADE
- Index: `idx_messages_conversation_id` on `conversation_id` (for fetching conversation history)
- Index: `idx_messages_created_at` on `created_at` (for chronological ordering)
- Check Constraint: `role IN ('user', 'assistant')`

**Notes**:
- Messages are ordered chronologically by `created_at` when building conversation history
- `tool_calls` structure (when present):
  ```json
  [
    {
      "tool": "add_task",
      "args": {"title": "Buy groceries"},
      "result": {"task_id": 5, "status": "created"}
    }
  ]
  ```
- Cascade delete ensures messages are removed when conversation is deleted
- `user_id` denormalization enables efficient user-scoped queries without joining conversations table

### Relationships

```
users (1) ──< (many) conversations
conversations (1) ──< (many) messages
```

- One user can have many conversations (1:N)
- One conversation can have many messages (1:N)
- Messages inherit user ownership through conversation relationship

### Indexes and Performance

**Primary Indexes** (automatic from PRIMARY KEY):
- `conversations.id`
- `messages.id`

**Foreign Key Indexes** (for query performance):
- `idx_conversations_user_id` on `conversations(user_id)`: Enables fast lookup of user's conversations
- `idx_messages_conversation_id` on `messages(conversation_id)`: Enables fast retrieval of conversation history

**Ordering Index**:
- `idx_messages_created_at` on `messages(created_at)`: Supports chronological ordering when loading message history

**Query Patterns**:
- List user's conversations: Uses `idx_conversations_user_id`
- Load conversation history: Uses `idx_messages_conversation_id` + `idx_messages_created_at`
- Validate conversation ownership: Uses `idx_conversations_user_id`

### Migration Notes

- Schema extends existing Phase II database (users, tasks tables)
- New tables are independent - no modifications to existing tables required
- Safe to deploy without downtime (no ALTER TABLE operations on existing tables)
- Foreign key to `users.id` assumes Phase II authentication is deployed
- Alembic migration will create both tables in single transaction

### Data Retention

- Conversations and messages are retained indefinitely (no automatic purging for MVP)
- Deletion only occurs when user account is deleted (cascade)
- Future enhancements may add conversation archival or manual deletion

## Out of Scope

- Conversation deletion or archiving
- Conversation search or filtering
- Conversation sharing between users
- Conversation export functionality
- Multi-language support (English only)
- Voice input/output
- Message editing or deletion after sent
- Conversation branching or forking
- Real-time streaming of AI responses (responses returned as complete text)
- Conversation metadata (title, summary, tags)
- Message reactions or threading
- File attachments or media in messages
- Rate limiting per user (handled at API gateway layer)
- Conversation analytics or insights
- Custom AI personality or behavior per user
- Integration with external messaging platforms
- Conversation templates or presets
- Scheduled messages or reminders
