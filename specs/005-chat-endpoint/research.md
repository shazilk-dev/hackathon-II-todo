# Phase 0 Research: ChatKit Frontend Integration (REVISED)

**Date**: 2026-01-30
**Research Focus**: ChatKit integration patterns for self-hosted backend with FastAPI and JWT authentication
**Revision**: Corrected ChatKit compatibility information

---

## Research Task 1: ChatKit Initialization with Custom API Endpoint

### Decision
Use ChatKit Python SDK (`openai-chatkit`) on backend + ChatKit React (`@openai/chatkit-react`) on frontend with custom FastAPI integration.

### Research Findings

According to [OpenAI's Custom ChatKit documentation](https://platform.openai.com/docs/guides/custom-chatkit) and the [ChatKit Python SDK docs](https://openai.github.io/chatkit-python/), ChatKit **IS fully compatible** with custom FastAPI backends.

**ChatKit Architecture Options**:

1. **OpenAI-Hosted Backend** (Agent Builder): Fully managed by OpenAI
2. **Self-Hosted Backend** (Custom): Run on your infrastructure with full control ✅ **We choose this**

### Integration Pattern

**Backend**: FastAPI + ChatKit Python SDK

```python
# backend/src/chatkit_server.py

from chatkit import ChatKitServer, ThreadStreamEvent, UserMessageItem
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, Response

app = FastAPI()

class TodoChatKitServer(ChatKitServer):
    """Custom ChatKit server for todo management"""

    async def respond(
        self,
        thread: dict,
        input: UserMessageItem | None,
        context: dict
    ) -> AsyncIterator[ThreadStreamEvent]:
        """
        Override respond method to handle user messages.
        This is called each time a user sends a message.
        """
        if not input:
            return

        # Extract user_id from context (passed from FastAPI endpoint)
        user_id = context.get("user_id")

        # Use OpenAI Agents SDK or custom logic
        async for event in self.stream_agent_response(
            user_id=user_id,
            message=input.content
        ):
            yield event

server = TodoChatKitServer()

@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    """ChatKit endpoint that processes chat messages"""

    # Get user_id from JWT token (Better Auth)
    user_id = request.state.user_id  # Set by auth middleware

    # Process request through ChatKit server
    result = await server.process(
        await request.body(),
        context={"user_id": user_id}
    )

    # Return streaming or JSON response
    if isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")
    return Response(content=result.json, media_type="application/json")
```

**Frontend**: Next.js + ChatKit React

```typescript
// app/chat/page.tsx
"use client";

import { useChatKit } from "@openai/chatkit-react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ChatPage() {
  const { session } = useAuth();

  const chatKit = useChatKit({
    api: {
      getClientSecret: async () => {
        // Get session token from our FastAPI backend
        const response = await fetch(
          `${API_URL}/api/chatkit/session`,
          {
            headers: {
              'Authorization': `Bearer ${session.session.token}`
            }
          }
        );
        const data = await response.json();
        return data.client_secret;
      }
    }
  });

  return <openai-chatkit ref={chatKit.ref} />;
}
```

### Rationale

- **Official support**: ChatKit designed for this pattern
- **Streaming**: Built-in SSE streaming support
- **Widgets**: Can add custom UI elements (buttons, forms)
- **Maintained**: Actively maintained by OpenAI
- **Integration**: Works with Agents SDK via `stream_agent_response` helper

### Architecture Flow

```
User types message
    ↓
@openai/chatkit-react frontend
    ↓
POST /chatkit endpoint (FastAPI)
    ↓
ChatKitServer.process()
    ↓
ChatKitServer.respond() override
    ↓
OpenAI Agents SDK / Custom logic
    ↓
Stream events back (SSE)
    ↓
ChatKit frontend displays response
```

### Key Resources

- [Advanced ChatKit Integration](https://platform.openai.com/docs/guides/custom-chatkit)
- [ChatKit Python SDK Server Integration](https://openai.github.io/chatkit-python/server/)
- [ChatKit Advanced Samples (FastAPI + React)](https://github.com/openai/openai-chatkit-advanced-samples)
- [Integrating ChatKit with FastAPI Guide](https://dev.to/rajeev_3ce9f280cbae73b234/--3hhn)

---

## Research Task 2: JWT Authentication with ChatKit

### Decision
Implement two-layer authentication: JWT for FastAPI endpoints + ChatKit session tokens for widget access.

### Research Findings

From the [ChatKit server integration docs](https://openai.github.io/chatkit-python/server/) and [FastAPI ChatKit examples](https://github.com/openai/openai-chatkit-advanced-samples), the authentication pattern is:

1. **FastAPI Authentication**: JWT from Better Auth protects `/chatkit` endpoint
2. **ChatKit Session**: Short-lived session token for ChatKit widget

### Implementation Pattern

**Backend Session Endpoint**:

```python
# backend/src/api/routers/chatkit.py

from fastapi import APIRouter, Depends
from openai import OpenAI
from src.auth.jwt import get_current_user

router = APIRouter()
client = OpenAI()

@router.post("/api/chatkit/session")
async def create_chatkit_session(
    user = Depends(get_current_user)  # Better Auth JWT validation
):
    """
    Create ChatKit session for authenticated user.
    This endpoint is protected by JWT authentication.
    """

    # Create ChatKit session via OpenAI SDK
    session = client.sessions.create(
        metadata={"user_id": user.id}  # Embed user_id in session
    )

    return {
        "client_secret": session.client_secret
    }

@router.post("/chatkit")
async def chatkit_endpoint(
    request: Request,
    user = Depends(get_current_user)  # JWT validation
):
    """
    Main ChatKit endpoint for processing messages.
    Protected by Better Auth JWT.
    """
    result = await chatkit_server.process(
        await request.body(),
        context={"user_id": user.id}  # Pass user_id to respond method
    )

    # Return streaming response
    if isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")
    return Response(content=result.json, media_type="application/json")
```

**Frontend Session Retrieval**:

```typescript
// lib/api/chatkit.ts

import { getSession } from '@/lib/auth-client';

export async function getChatKitClientSecret(): Promise<string> {
  const session = await getSession();

  if (!session?.session?.token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${API_URL}/api/chatkit/session`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.session.token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to create ChatKit session');
  }

  const data = await response.json();
  return data.client_secret;
}
```

### Rationale

- **Security**: JWT validates user identity at FastAPI layer
- **Isolation**: User context embedded in ChatKit session metadata
- **Consistency**: Reuses Better Auth JWT tokens
- **Standard**: Follows OpenAI's recommended pattern

### Authentication Flow

```
1. User logs in → Better Auth → JWT token (HTTP-only cookie)
2. Frontend calls /api/chatkit/session with JWT
3. Backend validates JWT → user_id extracted
4. Backend creates ChatKit session → client_secret returned
5. Frontend initializes ChatKit widget with client_secret
6. User sends message → ChatKit → /chatkit endpoint
7. Backend validates JWT → extracts user_id → passes to respond()
8. respond() method has user context for operations
```

---

## Research Task 3: Conversation Persistence Strategy

### Decision
Let ChatKit handle conversation persistence through its built-in thread management. Use thread IDs for conversation tracking.

### Research Findings

From [ChatKit.js documentation](https://openai.github.io/chatkit-js/guides/methods/), ChatKit provides:

- **Thread Management**: `setThreadId(threadId: string | null)` to load existing conversations
- **Events**: `chatkit.thread.load.start` and `chatkit.thread.load.end` for history loading
- **Persistence**: OpenAI infrastructure handles message storage for 30 days

### Implementation Pattern

**Frontend Thread Management**:

```typescript
// app/chat/page.tsx

"use client";

import { useChatKit } from "@openai/chatkit-react";
import { useEffect } from "react";

export default function ChatPage() {
  const chatKit = useChatKit({
    api: {
      getClientSecret: getChatKitClientSecret
    },
    initialThread: localStorage.getItem('chatkit_thread_id') || undefined
  });

  // Save thread ID when it changes
  useEffect(() => {
    const handleThreadChange = (event: CustomEvent) => {
      const threadId = event.detail.threadId;
      if (threadId) {
        localStorage.setItem('chatkit_thread_id', threadId);
      }
    };

    window.addEventListener('chatkit.thread.change', handleThreadChange);
    return () => window.removeEventListener('chatkit.thread.change', handleThreadChange);
  }, []);

  // Start new conversation
  const startNewChat = () => {
    chatKit.setThreadId(null);
    localStorage.removeItem('chatkit_thread_id');
  };

  return (
    <div>
      <button onClick={startNewChat}>New Chat</button>
      <openai-chatkit ref={chatKit.ref} />
    </div>
  );
}
```

**Backend Conversation Access** (if needed for history):

```python
# backend/src/chatkit_server.py

from chatkit import ChatKitServer

class TodoChatKitServer(ChatKitServer):
    async def respond(self, thread, input, context):
        # Access conversation history from thread metadata
        thread_id = thread.get("id")
        user_id = context.get("user_id")

        # Thread history is automatically provided by ChatKit
        # Messages are in thread["messages"]

        # Your agent logic here...
        async for event in self.process_with_agent(input, thread):
            yield event
```

### Rationale

- **Built-in**: ChatKit handles persistence automatically
- **Simple**: No custom database tables needed
- **Reliable**: OpenAI infrastructure manages state
- **30-day retention**: Automatic cleanup

### Alternatives Considered

1. **Custom database tables** (conversations, messages)
   - Rejected: ChatKit already provides this
   - Would duplicate functionality

2. **ChatKit thread management** (CHOSEN)
   - Simpler, maintained by OpenAI
   - Built-in persistence

**Note**: If we need longer retention (>30 days) or custom conversation features, we can implement custom persistence alongside ChatKit threads.

---

## Research Task 4: Error Handling Strategies

### Decision
Use ChatKit's built-in error handling + custom error widgets for user-friendly messages.

### Research Findings

ChatKit provides event-based error handling through the widget lifecycle.

### Implementation Pattern

**Frontend Error Handling**:

```typescript
// app/chat/page.tsx

const chatKit = useChatKit({
  api: {
    getClientSecret: getChatKitClientSecret
  },
  onError: (error) => {
    console.error('ChatKit error:', error);

    // Handle authentication errors
    if (error.status === 401) {
      window.location.href = '/auth/signin';
      return;
    }

    // Display user-friendly error
    toast.error(
      error.status === 429
        ? 'Too many requests. Please wait a moment.'
        : 'Something went wrong. Please try again.'
    );
  }
});

// Listen for error events
useEffect(() => {
  const handleError = (event: CustomEvent) => {
    console.error('ChatKit error event:', event.detail);
  };

  window.addEventListener('chatkit.error', handleError);
  return () => window.removeEventListener('chatkit.error', handleError);
}, []);
```

**Backend Error Handling**:

```python
# backend/src/chatkit_server.py

from chatkit import ChatKitServer, ErrorEvent

class TodoChatKitServer(ChatKitServer):
    async def respond(self, thread, input, context):
        try:
            # Process message with agent
            async for event in self.process_message(input, context):
                yield event

        except AuthenticationError as e:
            # Yield error event to frontend
            yield ErrorEvent(
                error={
                    "message": "Authentication failed. Please log in again.",
                    "code": "auth_error"
                }
            )

        except RateLimitError as e:
            yield ErrorEvent(
                error={
                    "message": "Too many requests. Please try again in a moment.",
                    "code": "rate_limit"
                }
            )

        except Exception as e:
            # Log full error server-side
            logger.error(f"ChatKit error: {e}", exc_info=True)

            # Return user-friendly error
            yield ErrorEvent(
                error={
                    "message": "Sorry, something went wrong. Please try again.",
                    "code": "internal_error"
                }
            )
```

### Rationale

- **Built-in**: ChatKit has error event system
- **User-friendly**: Map technical errors to readable messages
- **Recoverable**: Authentication errors trigger re-login
- **Logged**: Server errors logged for debugging

---

## Research Task 5: Message Streaming vs Batch Responses

### Decision
Use ChatKit's built-in streaming via Server-Sent Events (SSE). Streaming is the default behavior.

### Research Findings

From [ChatKit server integration](https://openai.github.io/chatkit-python/server/), **ChatKit is designed for streaming by default**. The `respond` method returns an `AsyncIterator[ThreadStreamEvent]`.

### Implementation Pattern

**Backend Streaming** (built-in):

```python
# backend/src/chatkit_server.py

from chatkit import ChatKitServer, AssistantMessageItem
from agents import Runner

class TodoChatKitServer(ChatKitServer):
    async def respond(self, thread, input, context):
        if not input:
            return

        # ChatKit provides helper for Agents SDK integration
        # This automatically streams responses
        async for event in self.stream_agent_response(
            agent=self.agent,
            input=input.content,
            context=context
        ):
            yield event  # Streams to frontend in real-time
```

**Frontend Streaming** (automatic):

```typescript
// ChatKit React handles streaming automatically
// No custom code needed - responses appear as they stream

<openai-chatkit ref={chatKit.ref} />
```

### Rationale

- **Default behavior**: ChatKit designed for streaming
- **Better UX**: Text appears as it's generated
- **No extra work**: Built into ChatKit architecture
- **Real-time**: Uses Server-Sent Events (SSE)

### Streaming Flow

```
1. User sends message
2. Frontend → POST /chatkit
3. Backend → ChatKitServer.respond()
4. respond() → yield events (async iterator)
5. FastAPI → StreamingResponse (SSE)
6. Frontend → Receives events → Updates UI in real-time
```

### Batch vs Streaming Comparison

| Feature | Batch (Not ChatKit) | Streaming (ChatKit) |
|---------|---------------------|---------------------|
| UX | Wait then show | Shows as it types |
| Implementation | Simple fetch | Built into ChatKit ✅ |
| Backend support | Single response | AsyncIterator ✅ |
| Perceived speed | Slower | Faster ✅ |

**Conclusion**: Streaming is built into ChatKit, so we get it automatically. No choice needed - it's the default.

---

## Summary of Decisions (REVISED)

| Research Task | Decision | Rationale |
|---------------|----------|-----------|
| **1. ChatKit SDK** | ✅ Use ChatKit (Python SDK + React) | Designed for custom FastAPI backends |
| **2. Authentication** | JWT + ChatKit session tokens | Two-layer: FastAPI auth + widget access |
| **3. History Loading** | ChatKit thread management | Built-in persistence (30 days) |
| **4. Error Handling** | ChatKit error events + custom widgets | Event-based, user-friendly |
| **5. Streaming** | Built-in SSE streaming | Default ChatKit behavior |

---

## Implementation Architecture (REVISED)

```
Frontend (Next.js 16)
├── @openai/chatkit-react
├── <openai-chatkit> web component
└── useChatKit hook

Backend (FastAPI)
├── POST /api/chatkit/session → Create ChatKit session
├── POST /chatkit → Main ChatKit endpoint
└── ChatKitServer
    └── respond() method override
        └── OpenAI Agents SDK integration
```

---

## Next Steps

1. ✅ Phase 0 complete: Research decisions documented
2. ⏭️ Phase 1: Create data-model.md (ChatKit-based types)
3. ⏭️ Phase 1: Create contracts/chatkit-api.ts (ChatKit endpoints)
4. ⏭️ Phase 1: Create quickstart.md (ChatKit setup)
5. ⏭️ Update agent context with ChatKit dependencies

---

## References

### Official Documentation
- [ChatKit | OpenAI API](https://platform.openai.com/docs/guides/chatkit)
- [Advanced ChatKit Integration](https://platform.openai.com/docs/guides/custom-chatkit)
- [ChatKit Python SDK](https://openai.github.io/chatkit-python/)
- [ChatKit Python Server Integration](https://openai.github.io/chatkit-python/server/)
- [ChatKit.js Documentation](https://openai.github.io/chatkit-js/)

### Implementation Guides
- [Integrating ChatKit with FastAPI: Practical Guide](https://dev.to/rajeev_3ce9f280cbae73b234/--3hhn)
- [ChatKit Advanced Samples (FastAPI + React)](https://github.com/openai/openai-chatkit-advanced-samples)
- [Learn OpenAI ChatKit Self-Hosted](https://github.com/ahmad2b/learn-openai-chatkit-self-hosted)
- [ChatKit + Next.js Integration](https://www.buildwithmatija.com/blog/chatkit-nextjs-integration)

### Code Examples
- [openai-chatkit-advanced-samples](https://github.com/openai/openai-chatkit-advanced-samples)
- [ChatKit.js GitHub](https://github.com/openai/chatkit-js)

---

**Research Phase Complete (Revised)**: 2026-01-30
**Correction**: ChatKit IS compatible with custom FastAPI backends using the Python SDK + React bindings.
