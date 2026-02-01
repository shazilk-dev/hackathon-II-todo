---
id: 0003
title: Update constitution Phase III
stage: constitution
date: 2026-01-29
surface: agent
model: claude-sonnet-4-5
feature: none
branch: main
user: hackathon-dev
command: /sp.constitution
labels: ["phase-3", "ai-chatbot", "constitution", "governance"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - null
---

## Prompt

Update constitution for Phase III AI Chatbot.

Phase III Principles:
- Conversational interface for todo management
- Natural language understanding via OpenAI Agents SDK
- MCP server architecture for tool operations
- Stateless backend with DB-persisted conversations
- ChatKit frontend for chat UI

Tech stack additions:
- OpenAI Agents SDK (openai-agents 0.6.5+)
- FastMCP for MCP server (fastmcp 2.14+)
- OpenAI ChatKit (@openai/chatkit-react)

Key patterns:
- @function_tool decorator for agent tools
- @mcp.tool decorator for MCP tools
- Stateless request/response cycle
- Conversation history stored in database

Constraints:
- All task operations go through MCP tools
- Agent must confirm actions with friendly responses
- Handle errors gracefully
- Support conversation resumption after server restart

## Response snapshot

Constitution updated from version 2.0.0 to 3.0.0 (MAJOR version bump).

**Key Changes:**

**I. Technology Stack** - Added:
- OpenAI Agents SDK (openai-agents 0.6.5+)
- FastMCP 2.14+ for MCP server
- OpenAI ChatKit (@openai/chatkit-react)
- GPT-4o-mini model
- OPENAI_API_KEY environment variable
- fastmcp dev for MCP tool testing

**II. Architecture Constraints** - Added:
- AI Agent layer (agent/ directory)
- MCP Tools layer (mcp_tools/ directory)
- Conversation and Message database models
- Stateless request/response cycle with DB persistence
- Chat endpoint architecture flow
- No in-memory state requirement

**III. Code Quality Standards** - Added:
- Agent tool docstring requirements (@function_tool)
- MCP tool type hint requirements (@mcp.tool)
- Chat message type definitions
- Agent tool naming conventions (verb-noun format)

**IV. Testing Requirements** - Added:
- Agent unit tests (mock OpenAI API)
- MCP tool unit tests
- Chat component tests
- ConversationFactory for test data

**VI. Security Principles** - Added:
- Prompt injection prevention
- Tool access control (user_id validation)
- Chat endpoint authentication
- Conversation isolation
- OPENAI_API_KEY security requirements
- Rate limiting for chat endpoint

**VII. Clean Architecture** - Added:
- Agent layer responsibilities
- Agent Tools layer (wraps MCP tools)
- MCP Tools layer (business logic)
- AI agent integration flow
- Prohibited direct service calls from chat API

**VIII. AI Agent Principles** (NEW Section):
- Natural language understanding requirements
- Agent instruction format
- Tool calling patterns
- Conversation management (stateless design)
- Error handling and graceful degradation
- Cost management (model selection, rate limiting)

**Quality Gates** - Updated:
- Constitution check includes AI stack verification
- Pre-commit checks for agent tool docstrings
- Definition of done includes tool access control

## Outcome

- ✅ Impact: Constitution successfully updated to 3.0.0, establishing governance for Phase III AI chatbot implementation
- 🧪 Tests: No tests modified (constitutional document update)
- 📁 Files: 1 file modified (.specify/memory/constitution.md)
- 🔁 Next prompts: Ready for /sp.specify to define Phase III conversational interface feature
- 🧠 Reflection: MAJOR version bump warranted due to introduction of new AI layer (agent + MCP tools) representing fundamental architectural change. All Phase 2 principles retained with AI extensions added.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A (constitutional governance)
- Prompt variant (if applicable): Standard constitution update workflow
- Next experiment (smallest change to try): N/A
