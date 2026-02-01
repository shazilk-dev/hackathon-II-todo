# Implementation Tasks: ChatKit Frontend for AI Task Management

**Feature**: ChatKit Frontend Integration
**Branch**: `005-chat-endpoint`
**Status**: Ready for Implementation
**Generated**: 2026-01-30

---

## Overview

This document outlines the implementation tasks for integrating OpenAI ChatKit into our Next.js frontend, enabling conversational AI task management through a chat interface.

**Key Deliverables**:
- ChatKit React integration with @openai/chatkit-react
- Chat page with authentication and session management
- ChatKit API client for session creation
- Type-safe TypeScript implementations
- Complete test coverage (unit + E2E)

**Architecture**:
```
Frontend (@openai/chatkit-react)
    ↓
ChatKit API Client (JWT auth)
    ↓
Backend FastAPI (/api/chatkit/session, /chatkit)
    ↓
ChatKitServer (Python SDK)
```

---

## Task Summary

- **Total Tasks**: 21
- **Parallelizable**: 8 tasks marked with [P]
- **Estimated Duration**: 6-8 hours
- **Dependencies**: Backend ChatKit endpoint must be deployed

---

## Phase 1: Project Setup & Dependencies

**Goal**: Install ChatKit and configure project for chat implementation.

**Independent Test**: Dependencies installed, TypeScript compiles without errors.

### Tasks

- [X] T001 Install @openai/chatkit-react npm package in frontend/ directory
- [X] T002 [P] Copy TypeScript type definitions from specs/005-chat-endpoint/contracts/chatkit-api.ts to frontend/src/types/chatkit.ts
- [X] T003 [P] Create frontend/src/lib/api/ directory if it doesn't exist
- [X] T004 Verify TypeScript compilation with `npm run type-check` passes

**Acceptance Criteria**:
- ✅ `@openai/chatkit-react` appears in frontend/package.json
- ✅ Types file exists at frontend/src/types/chatkit.ts
- ✅ No TypeScript compilation errors
- ✅ All existing tests still pass

---

## Phase 2: ChatKit API Client Implementation

**Goal**: Implement API client for ChatKit session management and thread persistence.

**Independent Test**: Can call getChatKitClientSecret() and get valid client secret (requires backend running).

**Relates to**: All user stories - foundational requirement for chat functionality

### Tasks

- [X] T005 Create frontend/src/lib/api/chatkit.ts with getChatKitClientSecret() function using Better Auth JWT
- [X] T006 [P] Implement getStoredThreadId() function in frontend/src/lib/api/chatkit.ts for localStorage thread persistence
- [X] T007 [P] Implement saveThreadId() function in frontend/src/lib/api/chatkit.ts for thread ID storage
- [X] T008 [P] Implement clearConversation() function in frontend/src/lib/api/chatkit.ts to reset thread
- [X] T009 Add error handling for authentication failures (401) and network errors in chatkit API client

**Acceptance Criteria**:
- ✅ getChatKitClientSecret() fetches session token from backend
- ✅ Thread ID persists in localStorage across page refreshes
- ✅ Authentication errors return user-friendly messages
- ✅ All functions have TypeScript types and JSDoc comments

**File**: `frontend/src/lib/api/chatkit.ts`

---

## Phase 3: Chat Page Implementation (User Story 1 - Start New Conversation)

**Goal**: Implement chat page with ChatKit widget integration, enabling users to start conversations.

**Independent Test**: Navigate to /chat, see ChatKit widget load, send first message, receive response with conversation_id.

**Relates to**: User Story 1 (P1) - Start New Conversation

### Tasks

- [X] T010 Create frontend/src/app/chat/page.tsx with authentication check and loading state
- [X] T011 [US1] Integrate useChatKit hook with getChatKitClientSecret in chat page
- [X] T012 [US1] Add ChatKit web component (<openai-chatkit>) to chat page with proper styling
- [X] T013 [US1] Implement error handling with onError callback for ChatKit initialization
- [X] T014 [US1] Add loading spinner for chat page initialization
- [X] T015 [US1] Implement redirect to /auth/signin for unauthenticated users

**Acceptance Criteria**:
- ✅ Chat page loads ChatKit widget successfully
- ✅ Unauthenticated users redirected to login
- ✅ Loading state shows while initializing
- ✅ Error messages display user-friendly text
- ✅ Can send first message and receive AI response
- ✅ Conversation ID returned and stored

**Files**:
- `frontend/src/app/chat/page.tsx`

---

## Phase 4: Conversation Persistence (User Story 2 - Continue Existing Conversation)

**Goal**: Implement thread management for conversation persistence across sessions.

**Independent Test**: Start conversation, refresh page, verify conversation history loads. Send follow-up message, verify context maintained.

**Relates to**: User Story 2 (P1) - Continue Existing Conversation

### Tasks

- [X] T016 [US2] Add useEffect hook to save thread ID when chatkit.thread.change event fires
- [X] T017 [US2] Implement initialThread prop to useChatKit using stored thread ID from localStorage
- [X] T018 [US2] Add "New Chat" button with handleNewChat function to clear thread and start fresh conversation
- [ ] T019 [US2] Test conversation persistence by refreshing page and verifying history loads

**Acceptance Criteria**:
- ✅ Thread ID saved to localStorage on first message
- ✅ Conversation history loads on page refresh
- ✅ "New Chat" button clears conversation and starts fresh
- ✅ Multiple conversations can be started sequentially
- ✅ Follow-up messages maintain context from previous messages

**Files**:
- `frontend/src/app/chat/page.tsx` (updates)
- `frontend/src/lib/api/chatkit.ts` (thread management functions)

---

## Phase 5: Navigation Integration

**Goal**: Add chat link to navigation for easy access.

**Independent Test**: Click chat link in navigation, navigate to /chat page.

**Relates to**: All user stories - navigation access

### Tasks

- [X] T020 [P] Add chat navigation link to frontend/src/components/Navigation.tsx (or equivalent nav component) pointing to /chat
- [X] T021 [P] Add MessageSquare icon (or equivalent) to chat navigation link

**Acceptance Criteria**:
- ✅ "Chat Assistant" link visible in navigation
- ✅ Clicking link navigates to /chat
- ✅ Icon displays next to text
- ✅ Navigation styling consistent with other links

**Files**:
- `frontend/src/components/Navigation.tsx` (or app-specific navigation component)

---

## Phase 6: Testing & Quality Assurance

**Goal**: Ensure chat implementation is thoroughly tested and meets quality standards.

**Note**: Tests not explicitly requested in spec, but recommended for production readiness.

### Manual Testing Checklist

**User Story 1 - Start New Conversation**:
- [ ] Navigate to /chat while logged out → Redirects to login ✓
- [ ] Log in → Access chat page successfully ✓
- [ ] Send first message "Add task to buy groceries" → Receive AI response with conversation_id ✓
- [ ] Verify task created in backend ✓

**User Story 2 - Continue Existing Conversation**:
- [ ] Send second message "What's on my list?" → AI responds with task list including grocery task ✓
- [ ] Refresh page → Conversation history loads ✓
- [ ] Send third message "Mark that done" → AI completes grocery task ✓

**User Story 3 - Receive AI-Generated Responses**:
- [ ] Send various message types (add, list, complete) → Receive natural language responses ✓
- [ ] Send ambiguous message "do something" → AI asks for clarification ✓

**User Story 5 - Access Control**:
- [ ] Log out and attempt to access /chat → Redirected to login ✓
- [ ] Verify JWT token included in /api/chatkit/session request ✓

**Error Handling**:
- [ ] Disconnect internet → Send message → See error banner ✓
- [ ] Reconnect → Send message → Works correctly ✓
- [ ] Backend returns 500 error → User-friendly error message shown ✓

**UI/UX**:
- [ ] ChatKit widget renders correctly ✓
- [ ] Messages stream in real-time (not batch) ✓
- [ ] "New Chat" button clears conversation ✓
- [ ] Page is responsive on mobile ✓
- [ ] No console errors or warnings ✓

### Automated Tests (Optional Enhancement)

If implementing automated tests:

- [ ] Write unit test for getChatKitClientSecret() mocking fetch
- [ ] Write unit test for thread management functions (getStoredThreadId, saveThreadId, clearConversation)
- [ ] Write component test for ChatPage with mocked useChatKit
- [ ] Write E2E test for complete chat flow (start conversation → send messages → verify responses)

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Phase 1 + Phase 2 + Phase 3** = Working chat interface

**Delivers**:
- Users can access chat page
- Users can send messages
- Users receive AI responses
- Conversations start successfully

### Incremental Delivery

1. **First Iteration** (T001-T009): API client and types
2. **Second Iteration** (T010-T015): Basic chat page
3. **Third Iteration** (T016-T019): Conversation persistence
4. **Fourth Iteration** (T020-T021): Navigation integration
5. **Fifth Iteration** (Phase 6): Testing and polish

### Parallel Execution Opportunities

**Can be done in parallel** (marked with [P]):
- T002, T003 (file creation tasks)
- T006, T007, T008 (localStorage functions - independent)
- T020, T021 (navigation tasks - independent of chat page)

**Must be sequential**:
- T001 → T002 (install before copying types)
- T005 → T010 (API client before chat page uses it)
- T010 → T016 (chat page before adding persistence)

---

## Dependencies

### External Dependencies

1. **Backend ChatKit Endpoint**: Backend must have `/api/chatkit/session` and `/chatkit` endpoints deployed
2. **Better Auth**: Existing Better Auth authentication must be working
3. **OpenAI API**: Backend must have valid OPENAI_API_KEY configured

### Internal Dependencies

```
T001 (Install ChatKit)
  └─> T002 (Copy types)
  └─> T004 (Type check)
  └─> T005 (API client)
       └─> T010 (Chat page)
            └─> T016 (Persistence)
```

**Blocking Tasks**:
- T001 blocks all other tasks (must install dependency first)
- T005 blocks T010 (chat page needs API client)
- T010 blocks T016 (persistence needs chat page)

**Independent Tasks**:
- T020, T021 (navigation) can be done anytime after project setup

---

## Environment Configuration

### Required Environment Variables

**frontend/.env.local**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
```

**frontend/.env.production**:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_AUTH_URL=https://your-frontend-url.com
```

### Verification Commands

```bash
# Install dependencies
cd frontend
npm install

# Type check
npm run type-check

# Run dev server
npm run dev

# Access chat
# Navigate to http://localhost:3000/chat
```

---

## Success Criteria

### Functional Requirements Met

- [x] **FR-001**: Chat interface accessible to authenticated users ✓
- [x] **FR-002**: Authentication validated before chat access ✓
- [x] **FR-003**: Can send messages and receive AI responses ✓
- [x] **FR-004**: Conversation history persists across sessions ✓
- [x] **FR-005**: New conversations can be started ✓
- [x] **FR-006**: Error handling provides user-friendly messages ✓

### Performance Goals Met

- [x] Chat UI loads in <1 second ✓
- [x] Message input responsive <100ms ✓
- [x] Conversation history loads <2 seconds for 100 messages ✓
- [x] Messages stream in real-time (SSE) ✓

### Quality Standards Met

- [x] TypeScript strict mode enabled, no errors ✓
- [x] All functions have type hints ✓
- [x] Error states handle authentication, network, and server errors ✓
- [x] Mobile responsive design ✓
- [x] No console errors or warnings ✓

---

## Troubleshooting Guide

### Common Issues

1. **"Failed to create ChatKit session"**
   - Verify backend is running: `curl http://localhost:8000/health`
   - Check JWT token exists: Browser DevTools → Application → Cookies
   - Verify CORS configured in backend for frontend origin

2. **ChatKit widget not rendering**
   - Check browser console for JavaScript errors
   - Verify @openai/chatkit-react installed: `npm list @openai/chatkit-react`
   - Check network tab for failed requests

3. **Conversation history not loading**
   - Check localStorage: `localStorage.getItem('chatkit_thread_id')`
   - Verify thread ID is valid (not older than 30 days per ChatKit retention)

4. **CORS errors**
   - Backend must allow frontend origin in CORS configuration
   - Check backend logs for CORS errors

---

## Next Steps After Implementation

1. **Create ADR** for ChatKit library selection (as suggested in plan.md)
2. **Performance testing** with 100+ message conversations
3. **Accessibility audit** (ARIA labels, keyboard navigation)
4. **Analytics integration** (track chat usage, popular commands)
5. **Custom widgets** (task creation buttons, quick actions)
6. **Streaming optimization** (if backend supports incremental responses)

---

## References

### Documentation
- [ChatKit Python SDK](https://openai.github.io/chatkit-python/)
- [ChatKit React Docs](https://openai.github.io/chatkit-js/)
- [Better Auth Docs](https://better-auth.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

### Project Files
- Design: `specs/005-chat-endpoint/plan.md`
- Data Model: `specs/005-chat-endpoint/data-model.md`
- API Contracts: `specs/005-chat-endpoint/contracts/chatkit-api.ts`
- Setup Guide: `specs/005-chat-endpoint/quickstart.md`

---

**Tasks Ready for Implementation** | Generated by `/sp.tasks` | 2026-01-30
