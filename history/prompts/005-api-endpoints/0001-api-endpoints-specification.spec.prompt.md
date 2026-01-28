---
id: 0001
title: API Endpoints Specification
stage: spec
date: 2026-01-12
surface: agent
model: claude-sonnet-4-5-20250929
feature: 005-api-endpoints
branch: 002-web-todo
user: developer
command: /sp.specify
labels: ["api", "rest", "fastapi", "endpoints", "jwt", "task-management"]
links:
  spec: specs/005-api-endpoints/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-api-endpoints/spec.md
tests:
  - null
---

## Prompt

Create API endpoints specification.

Base URL: http://localhost:8000 (dev) | https://api.yourapp.com (prod)

Authentication: All endpoints require Authorization: Bearer <jwt_token>

Endpoints:
1. GET /api/{user_id}/tasks - Query: status (all|pending|completed), sort (created|title) - Response: { tasks: Task[], count: number }
2. POST /api/{user_id}/tasks - Body: { title, description? } - Response: Task (201)
3. GET /api/{user_id}/tasks/{task_id} - Response: Task
4. PUT /api/{user_id}/tasks/{task_id} - Body: { title?, description? } - Response: Task
5. DELETE /api/{user_id}/tasks/{task_id} - Response: { message: "Task deleted" }
6. PATCH /api/{user_id}/tasks/{task_id}/complete - Response: Task (toggled completed)

Error Responses: 400 (invalid request), 401 (missing/invalid JWT), 403 (user ID mismatch), 404 (not found), 500 (server error)

## Response snapshot

Created comprehensive API endpoints specification at `specs/005-api-endpoints/spec.md` with 6 prioritized user stories, 30 functional requirements, complete TypeScript API contracts, and detailed endpoint documentation.

**User Stories**: P1 (List Tasks, Create Task, Toggle Completion), P2 (View Single Task, Update Task, Delete Task)
**Endpoints**: 6 RESTful endpoints with JWT authentication, user data isolation, filtering/sorting
**Authentication**: JWT middleware validates all requests, extracts user_id from sub claim, enforces user ID matching
**Success Criteria**: 100% JWT validation, <200ms response times, 100% data isolation, correct HTTP status codes

## Outcome

- ✅ Impact: Complete REST API specification with 6 endpoints, JWT security, data isolation, filtering/sorting, comprehensive error handling
- 🧪 Tests: Testing strategy defined (contract tests, integration tests, E2E tests covering all status codes)
- 📁 Files: Created specs/005-api-endpoints/spec.md (700+ lines)
- 🔁 Next prompts: Ready to proceed with /sp.plan for all three features (authentication, database, API) together
- 🧠 Reflection: RESTful design with user_id in path ensures explicit user scoping. Middleware pattern enforces JWT validation and user isolation per constitution security principles.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): PASS - Complete endpoint specs, TypeScript contracts, error handling, validation rules
- Prompt variant (if applicable): Standard /sp.specify with REST API details
- Next experiment (smallest change to try): Consider whether user_id in path is necessary or if extracting from JWT only is cleaner (current design makes intent explicit)
