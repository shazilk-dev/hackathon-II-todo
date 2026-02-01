# ChatKit Frontend Skill

## Skill Invocation

**Trigger when user says:**
- "add chat interface"
- "implement chatkit frontend"
- "create conversational UI"
- "add chat to the app"

**What this skill does:**
Generates a complete ChatKit-based chat interface for conversational AI interactions with the todo backend.

**Dependencies:**
- `nextjs-frontend` - requires Next.js app structure
- `ui-design-2026` - follows modern design patterns
- Backend API at `/api/{user_id}/chat` (provided by fastmcp-server + openai-agents)

---

## Execution Steps

When this skill is invoked, execute these steps in order:

### Step 1: Verify Prerequisites

```bash
# Check that backend API exists
ls backend/app/routes/chat.py

# Check Next.js structure
ls frontend/app
ls frontend/components
```

**Requirements:**
- Backend must have `/api/{user_id}/chat` endpoint
- Next.js 16+ with App Router
- Authentication provider (for user_id and token)

### Step 2: Create Chat Interface Component

**File:** `frontend/components/ChatInterface.tsx`

**Must include:**
1. **State management**: messages, input, loading, conversationId, error
2. **Message handling**: sendMessage function with error handling
3. **Auto-scroll**: scroll to bottom on new messages
4. **UI sections**: Header, Messages, Input Area
5. **Sub-components**: WelcomeMessage, MessageBubble, TypingIndicator

**Implementation pattern:**

```tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

interface ChatInterfaceProps {
  userId: string;
  authToken: string;
  apiUrl?: string;
}

export function ChatInterface({
  userId,
  authToken,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to backend
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/${userId}/chat`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: userMessage.content
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Update conversation ID
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        toolCalls: data.tool_calls
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, userId, authToken, apiUrl, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div>
          <h2 className="text-lg font-semibold">Todo Assistant</h2>
          <p className="text-sm text-blue-100">
            Ask me to manage your tasks!
          </p>
        </div>
        <button
          onClick={clearConversation}
          className="text-sm px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded-lg transition"
        >
          New Chat
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && <WelcomeMessage />}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (e.g., 'Add task to buy groceries')"
            className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function WelcomeMessage() {
  const suggestions = [
    "Add a task to buy groceries",
    "Show me my tasks",
    "Mark task 1 as complete",
    "What have I completed?"
  ];

  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-4">👋</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Hi! I'm your Todo Assistant
      </h3>
      <p className="text-gray-500 mb-6">
        I can help you manage your task list using natural language.
      </p>
      <div className="space-y-2">
        <p className="text-sm text-gray-400">Try saying:</p>
        {suggestions.map((suggestion, i) => (
          <div
            key={i}
            className="inline-block mx-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
          >
            "{suggestion}"
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Show tool calls for assistant messages */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs opacity-70">
              Tools used: {message.toolCalls.map(tc => tc.tool).join(", ")}
            </p>
          </div>
        )}

        <p className={`text-xs mt-1 ${isUser ? "text-blue-200" : "text-gray-400"}`}>
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
               style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
               style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
               style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Create Chat Page

**File:** `frontend/app/chat/page.tsx`

**Must include:**
1. Authentication check with redirect
2. Loading state
3. Full-height layout
4. ChatInterface integration with session data

**Implementation:**

```tsx
"use client";

import { useEffect } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { useAuth } from "@/components/providers/AuthProvider";
import { redirect } from "next/navigation";

export default function ChatPage() {
  const { session, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !session) {
      redirect("/auth/signin");
    }
  }, [session, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4 h-[calc(100vh-4rem)]">
        <ChatInterface
          userId={session.user.id}
          authToken={session.session.token}
        />
      </div>
    </div>
  );
}
```

### Step 4: Update Navigation

**File:** Update navigation component to include chat link

Add to `frontend/components/Navigation.tsx` or dashboard:

```tsx
<Link
  href="/chat"
  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100"
>
  <MessageSquareIcon className="w-5 h-5" />
  <span>Chat Assistant</span>
</Link>
```

### Step 5: Environment Configuration

**File:** `frontend/.env.local`

Add or verify:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**File:** `frontend/.env.production`

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Step 6: Add TypeScript Types (if needed)

**File:** `frontend/types/chat.ts`

```typescript
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface ChatRequest {
  conversation_id?: number | null;
  message: string;
}

export interface ChatResponse {
  conversation_id: number;
  response: string;
  tool_calls?: ToolCall[];
}
```

---

## Validation Checklist

After implementation, verify:

- [ ] Chat interface loads without errors
- [ ] Authentication required (redirects if not logged in)
- [ ] Can send messages to backend
- [ ] Assistant responses appear
- [ ] Tool calls are displayed (if any)
- [ ] Auto-scroll works
- [ ] Error handling shows appropriate messages
- [ ] "New Chat" clears conversation
- [ ] Enter key sends message
- [ ] Loading state shows typing indicator
- [ ] Mobile responsive (test on small screens)
- [ ] Timestamps display correctly

---

## Testing Commands

```bash
# Run frontend
cd frontend
npm run dev

# Test in browser
# 1. Navigate to http://localhost:3000/chat
# 2. Login if needed
# 3. Send message: "Add a task to buy groceries"
# 4. Verify assistant responds
# 5. Send: "Show my tasks"
# 6. Verify task list appears
```

---

## Integration Points

### With fastmcp-server Skill
- Backend provides `/api/{user_id}/chat` endpoint
- Returns `{ conversation_id, response, tool_calls }`
- Expects `{ conversation_id?, message }`

### With openai-agents Skill
- Agent processes messages through backend
- Tools (add_task, list_tasks, etc.) are called automatically
- Results are formatted in natural language

### With ui-design-2026 Skill
- Follows modern design patterns
- Uses Tailwind CSS utilities
- Implements accessible ARIA labels
- Responsive layout with mobile-first approach

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module '@/components/ChatInterface'" | Ensure TypeScript paths configured in `tsconfig.json` |
| CORS error when calling API | Add frontend URL to backend CORS origins |
| "useAuth is not defined" | Verify AuthProvider exists in `components/providers/` |
| Messages not showing | Check browser console, verify API response format |
| Redirect loop | Check authentication logic in page.tsx |

---

## Optional Enhancements

After basic implementation works, consider adding:

### Streaming Responses
- Modify backend to support SSE
- Update frontend to handle streamed chunks
- Show partial responses as they arrive

### Conversation History
- Load previous conversations from backend
- Add conversation list sidebar
- Persist conversation_id in URL or state

### File Attachments
- Add file upload button
- Support image/PDF attachments
- Display uploaded files in chat

### Voice Input
- Add microphone button
- Use Web Speech API
- Transcribe and send as text

---

## Design Patterns Used

### Component Architecture
```
ChatInterface (main component)
├── WelcomeMessage (initial state)
├── MessageBubble (individual messages)
└── TypingIndicator (loading state)
```

### State Management
- Local state with `useState` for UI state
- `useCallback` for optimized event handlers
- `useRef` for DOM references (scroll)
- `useEffect` for side effects (auth, scroll)

### Error Handling
- Try/catch for API calls
- Error state displayed in banner
- Error messages added to chat
- Graceful degradation

### Accessibility
- Semantic HTML structure
- Keyboard navigation (Enter to send)
- ARIA labels (would add in enhancement)
- Focus management

---

## Technology Stack

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 16.x | React framework |
| React | 19.x | UI library |
| TypeScript | 5.7+ | Type safety |
| Tailwind CSS | Latest | Styling |

---

## References

- [OpenAI ChatKit Docs](https://platform.openai.com/docs/guides/chatkit)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hooks](https://react.dev/reference/react)
