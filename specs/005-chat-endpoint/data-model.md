# Data Model: ChatKit Frontend Integration

**Feature**: ChatKit Frontend for AI Task Management
**Date**: 2026-01-30
**Status**: Phase 1 - Design

---

## Overview

This document defines the TypeScript types, component structure, and data models for the ChatKit frontend integration with our FastAPI backend.

---

## Frontend TypeScript Types

### ChatKit Session Types

```typescript
// types/chatkit.ts

/**
 * ChatKit client secret returned from backend session endpoint
 */
export interface ChatKitSession {
  client_secret: string;
}

/**
 * ChatKit configuration for useChatKit hook
 */
export interface ChatKitConfig {
  api: {
    getClientSecret: () => Promise<string>;
  };
  initialThread?: string;
  onError?: (error: ChatKitError) => void;
}

/**
 * ChatKit error structure
 */
export interface ChatKitError {
  status?: number;
  message: string;
  code?: string;
}
```

### Thread Management Types

```typescript
// types/chatkit.ts

/**
 * ChatKit thread (conversation) metadata
 */
export interface ChatKitThread {
  id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * Thread change event detail
 */
export interface ThreadChangeEvent extends CustomEvent {
  detail: {
    threadId: string | null;
  };
}

/**
 * Thread load events
 */
export interface ThreadLoadEvent extends CustomEvent {
  detail: {
    threadId: string;
    loading: boolean;
  };
}
```

### Message Types (for custom components if needed)

```typescript
// types/chatkit.ts

/**
 * ChatKit message item
 * Note: ChatKit handles message rendering internally,
 * but these types are useful for custom widgets
 */
export interface ChatKitMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    tool_calls?: ToolCall[];
  };
}

/**
 * Tool call executed by agent
 */
export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}
```

### Authentication Types

```typescript
// types/auth.ts (extends existing auth types)

/**
 * Better Auth session extended for ChatKit
 */
export interface ExtendedSession {
  user: {
    id: string;
    name: string;
    email: string;
  };
  session: {
    token: string;  // JWT token for API authentication
  };
}
```

---

## Component Structure

### Component Hierarchy

```
ChatPage (app/chat/page.tsx)
└── ChatKitWidget (ChatKit web component)
    ├── ChatKitHeader (built-in)
    ├── ChatKitMessages (built-in)
    │   ├── UserMessage (built-in)
    │   └── AssistantMessage (built-in)
    └── ChatKitInput (built-in)
```

**Note**: ChatKit provides built-in UI components. We primarily configure and integrate, rather than building custom components.

### Component Props

#### ChatPage Component

```typescript
// app/chat/page.tsx

interface ChatPageProps {
  // No props - uses session from AuthProvider
}

interface ChatPageState {
  isLoadingSession: boolean;
  sessionError: string | null;
  threadId: string | null;
}
```

#### Custom Widget Components (if needed)

```typescript
// components/chat/ToolCallWidget.tsx (optional enhancement)

interface ToolCallWidgetProps {
  toolCall: ToolCall;
  onRetry?: () => void;
}
```

---

## Backend Data Models (reference)

### ChatKitServer Context

```python
# backend/src/chatkit_server.py

@dataclass
class ChatContext:
    """Context passed to ChatKitServer.respond() method"""
    user_id: str
    session_metadata: dict[str, Any]

@dataclass
class ThreadMetadata:
    """Thread metadata structure"""
    id: str
    messages: list[dict]  # ChatKit provides message history
    metadata: dict[str, Any]
```

---

## State Management

### Local State (React)

```typescript
// app/chat/page.tsx

const ChatPage = () => {
  // ChatKit ref from useChatKit hook
  const chatKit = useChatKit(config);

  // Thread ID persistence (localStorage)
  const [threadId, setThreadId] = useState<string | null>(
    () => localStorage.getItem('chatkit_thread_id')
  );

  // Session loading state
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Error state
  const [error, setError] = useState<string | null>(null);

  return (/* ... */);
};
```

### Persistent State (localStorage)

```typescript
// Local storage keys

const STORAGE_KEYS = {
  THREAD_ID: 'chatkit_thread_id',       // Current conversation thread
  USER_PREFERENCES: 'chat_preferences'  // UI preferences (optional)
} as const;
```

### Global State (AuthProvider)

```typescript
// Existing AuthProvider provides:
// - session: ExtendedSession | null
// - isLoading: boolean
// - isAuthenticated: boolean

// ChatKit uses session.session.token for API authentication
```

---

## API Client Functions

### ChatKit Session Management

```typescript
// lib/api/chatkit.ts

import { getSession } from '@/lib/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Get ChatKit client secret for initializing widget
 */
export async function getChatKitClientSecret(): Promise<string> {
  const session = await getSession();

  if (!session?.session?.token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/chatkit/session`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.session.token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to create ChatKit session');
  }

  const data: ChatKitSession = await response.json();
  return data.client_secret;
}
```

### Thread Management Functions

```typescript
// lib/api/chatkit.ts

/**
 * Load thread ID from localStorage
 */
export function getStoredThreadId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.THREAD_ID);
}

/**
 * Save thread ID to localStorage
 */
export function saveThreadId(threadId: string | null): void {
  if (typeof window === 'undefined') return;

  if (threadId) {
    localStorage.setItem(STORAGE_KEYS.THREAD_ID, threadId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.THREAD_ID);
  }
}

/**
 * Clear current conversation
 */
export function clearConversation(): void {
  saveThreadId(null);
}
```

---

## Event Handlers

### ChatKit Event Listeners

```typescript
// app/chat/page.tsx

useEffect(() => {
  // Thread change event
  const handleThreadChange = (event: ThreadChangeEvent) => {
    const threadId = event.detail.threadId;
    setThreadId(threadId);
    saveThreadId(threadId);
  };

  // Thread load events
  const handleThreadLoadStart = (event: ThreadLoadEvent) => {
    console.log('Loading thread:', event.detail.threadId);
  };

  const handleThreadLoadEnd = (event: ThreadLoadEvent) => {
    console.log('Thread loaded:', event.detail.threadId);
  };

  // Error event
  const handleError = (event: CustomEvent<ChatKitError>) => {
    console.error('ChatKit error:', event.detail);
    setError(event.detail.message);
  };

  // Register event listeners
  window.addEventListener('chatkit.thread.change', handleThreadChange);
  window.addEventListener('chatkit.thread.load.start', handleThreadLoadStart);
  window.addEventListener('chatkit.thread.load.end', handleThreadLoadEnd);
  window.addEventListener('chatkit.error', handleError);

  // Cleanup
  return () => {
    window.removeEventListener('chatkit.thread.change', handleThreadChange);
    window.removeEventListener('chatkit.thread.load.start', handleThreadLoadStart);
    window.removeEventListener('chatkit.thread.load.end', handleThreadLoadEnd);
    window.removeEventListener('chatkit.error', handleError);
  };
}, []);
```

---

## Validation Rules

### Frontend Validation

```typescript
// lib/validation/chatkit.ts

/**
 * Validate ChatKit session response
 */
export function validateChatKitSession(data: unknown): data is ChatKitSession {
  return (
    typeof data === 'object' &&
    data !== null &&
    'client_secret' in data &&
    typeof (data as ChatKitSession).client_secret === 'string'
  );
}

/**
 * Validate thread ID format
 */
export function isValidThreadId(threadId: unknown): threadId is string {
  return typeof threadId === 'string' && threadId.length > 0;
}
```

---

## Error Handling Types

```typescript
// types/errors.ts

/**
 * Chat-specific error types
 */
export class ChatAuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'ChatAuthenticationError';
  }
}

export class ChatSessionError extends Error {
  constructor(message: string = 'Failed to create chat session') {
    super(message);
    this.name = 'ChatSessionError';
  }
}

export class ChatKitLoadError extends Error {
  constructor(message: string = 'Failed to load ChatKit') {
    super(message);
    this.name = 'ChatKitLoadError';
  }
}
```

---

## Component Implementation Examples

### ChatPage with ChatKit Integration

```typescript
// app/chat/page.tsx

"use client";

import { useChatKit } from "@openai/chatkit-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import {
  getChatKitClientSecret,
  getStoredThreadId,
  saveThreadId
} from "@/lib/api/chatkit";

export default function ChatPage() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(getStoredThreadId);
  const [error, setError] = useState<string | null>(null);

  // Initialize ChatKit
  const chatKit = useChatKit({
    api: {
      getClientSecret: getChatKitClientSecret
    },
    initialThread: threadId || undefined,
    onError: (err) => {
      console.error('ChatKit error:', err);

      if (err.status === 401) {
        window.location.href = '/auth/signin';
        return;
      }

      setError(err.message);
    }
  });

  // Handle thread changes
  useEffect(() => {
    const handleThreadChange = (event: CustomEvent) => {
      const newThreadId = event.detail.threadId;
      setThreadId(newThreadId);
      saveThreadId(newThreadId);
    };

    window.addEventListener('chatkit.thread.change', handleThreadChange);
    return () => window.removeEventListener('chatkit.thread.change', handleThreadChange);
  }, []);

  // Clear conversation
  const handleNewChat = () => {
    chatKit.setThreadId(null);
    setThreadId(null);
    saveThreadId(null);
  };

  // Redirect if not authenticated
  if (!isAuthLoading && !session) {
    window.location.href = '/auth/signin';
    return null;
  }

  // Loading state
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Todo Assistant
          </h1>
          <button
            onClick={handleNewChat}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Chat
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-900 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* ChatKit widget */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden"
             style={{ height: 'calc(100vh - 200px)' }}>
          <openai-chatkit ref={chatKit.ref} />
        </div>
      </div>
    </div>
  );
}
```

---

## Performance Considerations

### Lazy Loading

```typescript
// Lazy load ChatKit React bindings
const ChatKitComponent = dynamic(
  () => import('@/components/chat/ChatKitWrapper'),
  { ssr: false }
);
```

### Memoization

```typescript
// Memoize client secret getter
const getChatKitClientSecretMemo = useCallback(
  getChatKitClientSecret,
  []
);
```

---

## Testing Data Structures

### Mock Data

```typescript
// tests/mocks/chatkit.ts

export const mockChatKitSession: ChatKitSession = {
  client_secret: 'cs_test_1234567890abcdef'
};

export const mockThreadId = 'thread_test_abc123';

export const mockChatKitError: ChatKitError = {
  status: 500,
  message: 'Internal server error',
  code: 'internal_error'
};
```

---

## Summary

**Frontend TypeScript Types**:
- ChatKitSession, ChatKitConfig, ChatKitError
- ChatKitThread, ThreadChangeEvent, ThreadLoadEvent
- ChatKitMessage, ToolCall (for custom widgets)

**Component Structure**:
- ChatPage (main page component)
- ChatKit web component (provided by @openai/chatkit-react)

**API Functions**:
- getChatKitClientSecret() - Get session token
- getStoredThreadId(), saveThreadId(), clearConversation()

**Event Handling**:
- chatkit.thread.change
- chatkit.thread.load.start / chatkit.thread.load.end
- chatkit.error

**State Management**:
- Local state: threadId, error, isLoadingSession
- Persistent state: localStorage for thread ID
- Global state: AuthProvider for session

---

**Next**: Create contracts/chatkit-api.ts with API endpoint schemas
