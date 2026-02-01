# ChatKit Integration - Quick Start Guide

## ✅ Implementation Complete

ChatKit Server support has been successfully added to align with the official Hackathon architecture.

---

## What Changed

### Backend (3 files)

1. **`backend/src/api/routers/chatkit_session.py`** ✅ **NEW**
   - Endpoint: `POST /api/chatkit/session`
   - Creates ChatKit session using OpenAI SDK
   - Returns `client_secret` for frontend widget

2. **`backend/src/config.py`** ✅ **MODIFIED**
   - Added `openai_api_key` configuration field

3. **`backend/src/main.py`** ✅ **MODIFIED**
   - Imported and included `chatkit_session` router

### Frontend (1 file)

1. **`frontend/app/chat/page.tsx`** ✅ **MODIFIED**
   - **Removed**: 216 lines of custom chat UI code
   - **Added**: 46 lines of ChatKit widget integration
   - **Net change**: -170 lines (51% reduction)

---

## Architecture (Official Hackathon)

```
ChatKit Widget (Frontend)
    ↓ (requests client_secret)
POST /api/chatkit/session (Backend)
    ↓ (creates session)
OpenAI ChatKit API
    ↓ (manages conversations)
OpenAI Agents SDK (Backend)
    ↓ (executes tools)
MCP Server (Task Tools)
    ↓ (performs operations)
PostgreSQL Database
```

---

## Configuration Required

### 1. Backend Environment Variables

**File**: `backend/.env`

```bash
# ✅ REQUIRED: Add your OpenAI API key
OPENAI_API_KEY=sk-proj-your-key-here

# ✅ Already configured (verify it matches frontend)
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
DATABASE_URL=postgresql+asyncpg://...
CORS_ORIGINS=http://localhost:3000
```

### 2. Frontend Environment Variables

**File**: `frontend/.env.local`

```bash
# ✅ Already configured
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
NEXTAUTH_URL=http://localhost:3000
```

---

## How to Run

### 1. Start Backend

```bash
cd backend

# Set OPENAI_API_KEY in .env first!
uv run uvicorn src.main:app --reload --port 8000
```

**Verify**: Navigate to http://localhost:8000/docs
- You should see `/api/chatkit/session` endpoint

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

**Verify**: Navigate to http://localhost:3000/chat
- Sign in if not authenticated
- ChatKit widget should render
- Type a message and verify it works

---

## Testing the Integration

### Manual Test Flow

1. **Open Chat Page**
   ```
   Navigate to: http://localhost:3000/chat
   Expected: ChatKit widget loads (message input visible)
   ```

2. **Send First Message**
   ```
   Type: "Add a task to buy groceries"
   Expected:
   - Message sends successfully
   - Assistant responds
   - Task is created in database
   ```

3. **Check Thread Persistence**
   ```
   Refresh page (F5)
   Expected: Previous message still visible (conversation resumed)
   ```

4. **Test New Chat Button**
   ```
   Click: "New Chat" button
   Expected: Page refreshes, conversation cleared
   ```

5. **Verify Network Requests** (DevTools → Network)
   ```
   Look for:
   - POST /api/chatkit/session (status 201)
   - Response contains: {"client_secret": "cs_..."}
   - Authorization header: Bearer <jwt_token>
   ```

---

## Troubleshooting

### Issue: "Failed to get ChatKit client secret"

**Cause**: Missing or invalid OPENAI_API_KEY

**Solution**:
1. Check `backend/.env` has `OPENAI_API_KEY=sk-...`
2. Restart backend server
3. Verify key is valid at https://platform.openai.com/api-keys

```bash
# Test OpenAI SDK
cd backend
python -c "from openai import OpenAI; client = OpenAI(); print('OK')"
```

---

### Issue: Widget not rendering

**Cause**: ChatKit package not installed or import error

**Solution**:
```bash
cd frontend

# Check if installed
npm list | grep chatkit
# Expected: @openai/chatkit-react@1.4.3

# If missing, install
npm install @openai/chatkit-react@latest
```

---

### Issue: 401 Unauthorized

**Cause**: JWT token missing or expired

**Solution**:
1. Clear browser cookies
2. Sign out and sign in again
3. Verify `BETTER_AUTH_SECRET` matches in frontend and backend

---

## API Endpoint Reference

### POST /api/chatkit/session

**Description**: Create ChatKit session for authenticated user

**Authentication**: Required (JWT Bearer token)

**Request**:
```http
POST /api/chatkit/session HTTP/1.1
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response** (201 Created):
```json
{
  "client_secret": "cs_example_secret_abc123"
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: OpenAI API error (check API key)

---

## Code Examples

### Backend: ChatKit Session Creation

```python
# backend/src/api/routers/chatkit_session.py

from openai import OpenAI
from src.config import settings

@router.post("/api/chatkit/session")
async def create_chatkit_session(request: Request):
    # Get user_id from JWT (set by middleware)
    user_id = request.state.user_id

    # Create ChatKit session
    client = OpenAI(api_key=settings.openai_api_key)
    session = client.beta.chatkit.sessions.create(user=user_id)

    # Return client secret
    return {"client_secret": session.client_secret}
```

### Frontend: ChatKit Widget Integration

```typescript
// frontend/app/chat/page.tsx

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { getChatKitClientSecret } from '@/lib/api/chatkit';

export default function ChatPage() {
  const { control, thread } = useChatKit({
    api: {
      async getClientSecret() {
        return await getChatKitClientSecret();
      }
    },
    initialThread: getStoredThreadId() || undefined
  });

  return <ChatKit control={control} className="h-full w-full" />;
}
```

### Frontend: API Client

```typescript
// frontend/lib/api/chatkit.ts

export async function getChatKitClientSecret(): Promise<string> {
  // 1. Get JWT token from Better Auth
  const tokenRes = await fetch('/api/auth/token', { credentials: 'include' });
  const { token } = await tokenRes.json();

  // 2. Call backend session endpoint
  const response = await fetch(`${API_URL}/api/chatkit/session`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // 3. Return client secret
  const data = await response.json();
  return data.client_secret;
}
```

---

## Key Features

### ✅ Authentication
- JWT-based authentication via Better Auth
- User isolation (each user has separate ChatKit sessions)
- Session expiration handled automatically

### ✅ Thread Persistence
- Conversation history saved in localStorage
- Resume conversations after page refresh
- "New Chat" button to start fresh

### ✅ Error Handling
- User-friendly error messages
- Automatic retry on network errors
- 401 redirect to sign-in page

### ✅ Tool Integration
- AI can call MCP tools (add_task, list_tasks, etc.)
- Tool calls visualized in chat
- Results shown to user

---

## Differences from Custom Chat UI

| Feature | Custom UI (Before) | ChatKit Widget (After) |
|---------|-------------------|------------------------|
| **Code Lines** | 335 lines | 165 lines (-51%) |
| **Message State** | Manual useState | Automatic (built-in) |
| **Streaming** | Not supported | ✅ Real-time streaming |
| **Thread Persistence** | Manual implementation | ✅ Built-in with localStorage |
| **Tool Visualization** | Custom rendering | ✅ Automatic display |
| **UI Design** | Custom components | ✅ Professional OpenAI design |
| **Error Handling** | Manual try/catch | ✅ Built-in error UI |
| **Maintenance** | Manual updates | ✅ Automatic (OpenAI maintains) |

---

## Dependencies

### Backend
```toml
openai = "^2.16.0"  # ✅ Already installed
fastapi = "^0.109.0"
python-jose = "^3.3.0"
```

### Frontend
```json
{
  "@openai/chatkit-react": "^1.4.3",  // ✅ Already installed
  "next": "^15.1.3",
  "react": "^19.0.0"
}
```

---

## Resources

- **Official Hackathon Guide**: Page 17 - ChatKit Architecture
- **OpenAI ChatKit Docs**: https://platform.openai.com/docs/guides/chatkit
- **ChatKit React Docs**: https://openai.github.io/chatkit-js/
- **Implementation Details**: See `.claude/skills/chatkit-frontend/IMPLEMENTATION.md`

---

## Next Steps

1. **Test the Integration**
   - [ ] Manual testing (see checklist above)
   - [ ] Verify session creation works
   - [ ] Test thread persistence
   - [ ] Verify tool calls work

2. **Configure OpenAI API Key**
   - [ ] Get API key from https://platform.openai.com/api-keys
   - [ ] Add to `backend/.env`
   - [ ] Restart backend server

3. **Optional Enhancements**
   - [ ] Add conversation history sidebar (Phase IV)
   - [ ] Custom tool call rendering
   - [ ] Analytics tracking
   - [ ] Voice input support

---

**Status**: ✅ **Ready for Testing**
**Date**: 2026-01-31
**Branch**: `005-chat-endpoint`
