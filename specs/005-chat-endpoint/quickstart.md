# QuickStart Guide: ChatKit Frontend Integration

**Feature**: ChatKit Frontend for AI Task Management
**Estimated Setup Time**: 15-20 minutes
**Prerequisites**: Backend chat endpoint (004-mcp-tools) deployed and running

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- ✅ **Node.js**: 18.x or higher
- ✅ **pnpm/npm/yarn**: Package manager installed
- ✅ **Backend API**: FastAPI backend with ChatKit endpoint running
- ✅ **Better Auth**: Authentication already configured
- ✅ **OpenAI API Key**: For ChatKit functionality

### Backend Requirements

Ensure the backend has these endpoints:
- `POST /api/chatkit/session` - Create ChatKit session
- `POST /chatkit` - Main ChatKit message processing

To verify backend is running:
```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

---

## Installation

### Step 1: Install ChatKit Dependencies

```bash
cd frontend

# Install ChatKit React bindings
npm install @openai/chatkit-react

# Install peer dependencies (if not already installed)
npm install react@^19 react-dom@^19
```

### Step 2: Verify Installation

```bash
# Check installed version
npm list @openai/chatkit-react

# Expected output:
# └── @openai/chatkit-react@1.x.x
```

---

## Configuration

### Step 1: Environment Variables

Create or update `frontend/.env.local`:

```env
# API URL (backend)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth configuration (should already exist)
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
```

For production (`frontend/.env.production`):

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_AUTH_URL=https://your-frontend-url.com
```

### Step 2: TypeScript Configuration

Ensure `frontend/tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Step 3: Create Type Definitions

Copy type definitions from contracts:

```bash
# Create types directory if not exists
mkdir -p frontend/src/types

# Copy ChatKit types
cp specs/005-chat-endpoint/contracts/chatkit-api.ts frontend/src/types/
```

---

## Development Workflow

### Step 1: Create ChatKit API Client

Create `frontend/src/lib/api/chatkit.ts`:

```typescript
import { getSession } from '@/lib/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    throw new Error('Failed to create ChatKit session');
  }

  const data = await response.json();
  return data.client_secret;
}

export function getStoredThreadId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('chatkit_thread_id');
}

export function saveThreadId(threadId: string | null): void {
  if (typeof window === 'undefined') return;

  if (threadId) {
    localStorage.setItem('chatkit_thread_id', threadId);
  } else {
    localStorage.removeItem('chatkit_thread_id');
  }
}
```

### Step 2: Create Chat Page

Create `frontend/src/app/chat/page.tsx`:

```typescript
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

  useEffect(() => {
    const handleThreadChange = (event: CustomEvent) => {
      const newThreadId = event.detail.threadId;
      setThreadId(newThreadId);
      saveThreadId(newThreadId);
    };

    window.addEventListener('chatkit.thread.change', handleThreadChange);
    return () => window.removeEventListener('chatkit.thread.change', handleThreadChange);
  }, []);

  const handleNewChat = () => {
    chatKit.setThreadId(null);
    setThreadId(null);
    saveThreadId(null);
  };

  if (!isAuthLoading && !session) {
    window.location.href = '/auth/signin';
    return null;
  }

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

        <div className="bg-white rounded-xl shadow-lg overflow-hidden"
             style={{ height: 'calc(100vh - 200px)' }}>
          <openai-chatkit ref={chatKit.ref} />
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Add Navigation Link

Update your navigation component (e.g., `frontend/src/components/Navigation.tsx`):

```typescript
<Link
  href="/chat"
  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100"
>
  <MessageSquareIcon className="w-5 h-5" />
  <span>Chat Assistant</span>
</Link>
```

### Step 4: Run Development Server

```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:3000/chat`

---

## Testing

### Manual Testing Checklist

1. **Authentication Flow**
   - [ ] Navigate to `/chat` while logged out → Redirects to login
   - [ ] Log in → Redirected back to chat page
   - [ ] Chat page loads ChatKit widget

2. **Chat Functionality**
   - [ ] Send message: "Add task to buy groceries"
   - [ ] Verify AI responds with confirmation
   - [ ] Send message: "Show me my tasks"
   - [ ] Verify task list appears in chat

3. **Conversation Persistence**
   - [ ] Send several messages
   - [ ] Refresh page
   - [ ] Verify conversation history loads

4. **New Chat**
   - [ ] Click "New Chat" button
   - [ ] Verify conversation clears
   - [ ] Send new message
   - [ ] Verify new conversation starts

5. **Error Handling**
   - [ ] Disconnect internet → Send message
   - [ ] Verify error message appears
   - [ ] Reconnect → Verify can send messages again

### Automated Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Specific test file
npm run test src/app/chat/page.test.tsx
```

---

## Troubleshooting

### Common Issues

#### 1. "Failed to create ChatKit session"

**Symptoms**: Error when loading chat page

**Causes**:
- Backend `/api/chatkit/session` endpoint not available
- JWT token expired or invalid
- CORS issues

**Solutions**:
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check backend logs
cd backend
tail -f logs/app.log

# Verify JWT token
# Open browser DevTools → Application → Cookies
# Check for "better-auth.session_token"
```

#### 2. ChatKit widget not rendering

**Symptoms**: Blank white box where chat should be

**Causes**:
- ChatKit React not properly installed
- JavaScript errors in console

**Solutions**:
```bash
# Reinstall ChatKit
npm uninstall @openai/chatkit-react
npm install @openai/chatkit-react

# Check browser console for errors
# Open DevTools → Console
```

#### 3. Messages not sending

**Symptoms**: Type message, click send, nothing happens

**Causes**:
- Backend `/chatkit` endpoint not responding
- Network errors

**Solutions**:
```bash
# Test backend endpoint directly
curl -X POST http://localhost:8000/chatkit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Check network tab in DevTools
# Look for failed requests to /chatkit
```

#### 4. Conversation history not loading

**Symptoms**: Previous messages don't appear after refresh

**Causes**:
- Thread ID not saved in localStorage
- ChatKit session expired (>30 days)

**Solutions**:
```javascript
// Check localStorage in browser console
localStorage.getItem('chatkit_thread_id')

// Clear and restart
localStorage.removeItem('chatkit_thread_id')
window.location.reload()
```

#### 5. CORS Errors

**Symptoms**: "Access to fetch at '...' has been blocked by CORS policy"

**Causes**:
- Backend CORS not configured for frontend origin

**Solutions**:
```python
# backend/src/main.py

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Verification Checklist

Before moving to production:

- [ ] ChatKit widget loads successfully
- [ ] Can send and receive messages
- [ ] Conversation history persists across refreshes
- [ ] "New Chat" button starts fresh conversation
- [ ] Error messages display user-friendly text
- [ ] Authentication errors redirect to login
- [ ] All TypeScript types are properly defined
- [ ] No console errors or warnings
- [ ] Mobile responsive (test on small screens)
- [ ] Environment variables configured for production

---

## Next Steps

After completing setup:

1. **Customize ChatKit UI**: Explore theming options in ChatKit docs
2. **Add Analytics**: Track chat usage with analytics service
3. **Enhance Error Handling**: Add more specific error messages
4. **Performance Optimization**: Implement lazy loading for heavy components
5. **Testing**: Write comprehensive unit and E2E tests

---

## Resources

### Documentation
- [ChatKit Python SDK Docs](https://openai.github.io/chatkit-python/)
- [ChatKit React Docs](https://openai.github.io/chatkit-js/)
- [Better Auth Docs](https://better-auth.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

### Example Code
- [ChatKit Advanced Samples](https://github.com/openai/openai-chatkit-advanced-samples)
- [FastAPI + ChatKit Example](https://github.com/ahmad2b/learn-openai-chatkit-self-hosted)

### Support
- **Backend Issues**: Check backend logs in `backend/logs/`
- **Frontend Issues**: Check browser console (F12 → Console)
- **ChatKit Issues**: OpenAI ChatKit GitHub Issues

---

**QuickStart Guide Complete** - Ready to implement ChatKit frontend!
