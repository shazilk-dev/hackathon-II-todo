---
id: 0006
title: ChatKit Frontend Plan
stage: plan
date: 2026-01-30
surface: agent
model: claude-sonnet-4-5-20250929
feature: 005-chat-endpoint
branch: 005-chat-endpoint
user: khans
command: /sp.plan
labels: ["chatkit", "frontend", "chat-ui", "nextjs", "typescript"]
links:
  spec: specs/005-chat-endpoint/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/005-chat-endpoint/plan.md
 - specs/005-chat-endpoint/research.md
 - specs/005-chat-endpoint/data-model.md
 - specs/005-chat-endpoint/contracts/chatkit-api.ts
 - specs/005-chat-endpoint/quickstart.md
 - CLAUDE.md (updated)
tests:
 - none
---

## Prompt

Create technical plan for ChatKit frontend implementation.

Reference specs:
- @specs/ai-chatbot.md

Requirements:
- Use OpenAI ChatKit (@openai/chatkit-react)
- Self-hosted option (not Agent Builder)
- Connect to our FastAPI backend
- JWT authentication
- Conversation persistence

Architecture:
- ChatKit component renders chat UI
- Custom API client sends messages to backend
- Session management with Better Auth

Follow patterns(use skills) from:
- @.claude/skills/nextjs-frontend/SKILL.md

## Response snapshot

Created comprehensive technical plan for ChatKit frontend implementation:

**Summary**: Implement conversational chat interface using OpenAI ChatKit (@openai/chatkit-react) to enable natural language task management. Frontend connects to FastAPI backend's chat endpoint with JWT authentication via Better Auth.

**Key Decisions**:
1. Technology Stack: ChatKit (@openai/chatkit-react), Next.js 16+, TypeScript 5.7+, Tailwind CSS 4+
2. Architecture: UI Layer (ChatKit) → API Client → Backend Chat Endpoint
3. Authentication: Better Auth JWT tokens in Authorization headers
4. Conversation Loading: Full history on mount (no pagination for MVP)
5. Message Display: Batch responses (no streaming for MVP)

**Components**:
- ChatInterface: Main component managing conversation state and ChatKit integration
- ChatMessage: Individual message rendering with user/assistant differentiation
- ChatInput: Message input with character limit and validation

**API Client**: JWT-authenticated fetch wrapper for chat endpoint (POST /api/{user_id}/chat)

**Constitution Check**: ✅ PASS - All gates satisfied

**Next Steps**:
1. Phase 0: Research ChatKit patterns → research.md
2. Phase 1: Design data model and contracts → data-model.md, contracts/, quickstart.md
3. Update agent context with ChatKit dependencies
4. User runs /sp.tasks to generate tasks
5. User runs /sp.implement to execute tasks

**ADR Suggestion**: ChatKit library adoption for chat UI (impacts long-term architecture)

## Outcome

- ✅ Impact: Complete technical plan created for ChatKit frontend implementation with clear architecture, component design, and API contracts
- 🧪 Tests: No tests run (planning phase)
- 📁 Files: Created specs/005-chat-endpoint/plan.md
- 🔁 Next prompts: Phase 0 research, Phase 1 design artifacts, ADR creation for ChatKit decision
- 🧠 Reflection: Plan successfully separates frontend concerns from backend chat API (004-mcp-tools). Clear component architecture follows Next.js 16 App Router patterns. JWT authentication strategy aligns with existing Better Auth implementation. MVP scope appropriately limited (batch responses, full history loading).

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Constitution Check: PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Execute Phase 0 research to validate ChatKit integration patterns
