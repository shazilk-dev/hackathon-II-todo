---
id: 0002
title: Database Schema Specification for Conversations
stage: spec
date: 2026-01-29
surface: agent
model: claude-sonnet-4-5
feature: 005-chat-endpoint
branch: 005-chat-endpoint
user: khans
command: /sp.specify
labels: ["database", "schema", "conversations", "messages", "postgresql"]
links:
  spec: specs/005-chat-endpoint/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-chat-endpoint/spec.md
  - specs/005-chat-endpoint/checklists/requirements.md
tests:
  - Specification quality validation (all checks passed)
---

## Prompt

```text
Create database schema specification for conversations.

Database: Neon PostgreSQL (extending Phase II schema)

New Tables:

1. conversations
   - id: SERIAL PRIMARY KEY
   - user_id: TEXT NOT NULL (references users.id)
   - created_at: TIMESTAMP DEFAULT NOW()
   - updated_at: TIMESTAMP DEFAULT NOW()

2. messages
   - id: SERIAL PRIMARY KEY
   - conversation_id: INTEGER REFERENCES conversations(id)
   - user_id: TEXT NOT NULL
   - role: VARCHAR(20) NOT NULL ("user" | "assistant")
   - content: TEXT NOT NULL
   - tool_calls: JSONB (optional, for assistant messages)
   - created_at: TIMESTAMP DEFAULT NOW()

Indexes:
   - conversations.user_id (for filtering by user)
   - messages.conversation_id (for fetching history)
   - messages.created_at (for ordering)

Relationships:
   - conversations belongs_to users
   - messages belongs_to conversations
```

## Response snapshot

Added comprehensive Database Schema section to existing `005-chat-endpoint` specification with:

**Schema Tables**:
- `conversations`: Stores conversation threads (4 columns: id, user_id, created_at, updated_at)
- `messages`: Stores individual messages (7 columns: id, conversation_id, user_id, role, content, tool_calls, created_at)

**Constraints & Relationships**:
- Foreign keys: conversations.user_id → users.id, messages.conversation_id → conversations.id
- CASCADE deletes ensure data integrity
- CHECK constraint on role ('user' | 'assistant')
- 1:N relationships documented (users → conversations, conversations → messages)

**Performance Optimization**:
- 3 indexes: idx_conversations_user_id, idx_messages_conversation_id, idx_messages_created_at
- Query patterns documented for each index
- JSONB for flexible tool_calls structure

**Migration Strategy**:
- Extends Phase II schema (users, tasks)
- No modifications to existing tables
- Safe to deploy without downtime

**Validation**:
- Created requirements checklist with 8 database schema quality checks (all passed)
- Specification ready for `/sp.plan` phase

## Outcome

- ✅ Impact: Database schema fully specified for conversation persistence, ready for Alembic migration generation
- 🧪 Tests: Specification quality checklist validation (all items passed)
- 📁 Files: Updated spec.md with Database Schema section, created requirements.md checklist
- 🔁 Next prompts: `/sp.plan` to design architecture and implementation approach
- 🧠 Reflection: Schema design cleanly extends existing Phase II infrastructure without breaking changes, uses appropriate data types (JSONB for tool_calls), and includes performance-optimized indexes

## Evaluation notes (flywheel)

- Failure modes observed: None - schema specification complete and validated
- Graders run and results (PASS/FAIL): Specification quality checklist - PASS (all 8 database schema items passed)
- Prompt variant (if applicable): Standard /sp.specify for database schema extension
- Next experiment (smallest change to try): Proceed to planning phase to design API endpoints and service layer
