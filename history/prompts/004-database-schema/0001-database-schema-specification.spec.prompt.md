---
id: 0001
title: Database Schema Specification
stage: spec
date: 2026-01-12
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-database-schema
branch: 002-web-todo
user: developer
command: /sp.specify
labels: ["database", "neon", "postgresql", "schema", "better-auth", "migrations", "alembic"]
links:
  spec: specs/004-database-schema/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-database-schema/spec.md
tests:
  - null
---

## Prompt

Create database schema specification.

Database: Neon Serverless PostgreSQL

Tables:

1. users (managed by Better Auth)
   - id: TEXT PRIMARY KEY
   - email: TEXT UNIQUE NOT NULL
   - name: TEXT
   - emailVerified: BOOLEAN
   - image: TEXT
   - createdAt: TIMESTAMP
   - updatedAt: TIMESTAMP

2. sessions (managed by Better Auth)
   - id: TEXT PRIMARY KEY
   - userId: TEXT REFERENCES users(id)
   - token: TEXT UNIQUE
   - expiresAt: TIMESTAMP
   - createdAt: TIMESTAMP
   - updatedAt: TIMESTAMP

3. accounts (managed by Better Auth)
   - id: TEXT PRIMARY KEY
   - userId: TEXT REFERENCES users(id)
   - providerId: TEXT
   - accountId: TEXT
   - ... (other Better Auth fields)

4. tasks (our table)
   - id: SERIAL PRIMARY KEY
   - user_id: TEXT NOT NULL (references users.id)
   - title: VARCHAR(200) NOT NULL
   - description: TEXT
   - completed: BOOLEAN DEFAULT FALSE
   - created_at: TIMESTAMP DEFAULT NOW()
   - updated_at: TIMESTAMP DEFAULT NOW()

Indexes:
   - tasks.user_id (for filtering by user)
   - tasks.completed (for status filtering)

## Response snapshot

Created comprehensive database schema specification at `specs/004-database-schema/spec.md` with 4 prioritized user stories, 20 functional requirements, complete DDL reference, and migration strategy.

**User Stories**: P1 (Schema Init, Data Isolation, Better Auth Integration), P2 (Migration Versioning)
**Tables**: users, sessions, accounts (Better Auth camelCase), tasks (application snake_case)
**Constraints**: Foreign keys with CASCADE DELETE, UNIQUE (email, token), NOT NULL (user_id, title)
**Indexes**: tasks.user_id, tasks.completed (10x performance improvement target)
**Success Criteria**: 100% constraint enforcement, <10ms queries, idempotent migrations

## Outcome

- ✅ Impact: Complete database schema specification with 4 tables, comprehensive constraints, indexes, and Alembic migration strategy
- 🧪 Tests: Testing strategy defined (EXPLAIN ANALYZE for indexes, constraint violation tests, cascade deletion verification)
- 📁 Files: Created specs/004-database-schema/spec.md (600+ lines)
- 🔁 Next prompts: Run `/sp.plan` to design database integration (Alembic setup, SQLModel models, async connections)
- 🧠 Reflection: Mixed naming conventions necessary for Better Auth integration. ON DELETE CASCADE ensures data integrity per constitution security principles.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): PASS - Complete DDL, migration strategy, constraint documentation
- Prompt variant (if applicable): Standard /sp.specify with technical schema details
- Next experiment (smallest change to try): Verify Better Auth schema compatibility during planning
