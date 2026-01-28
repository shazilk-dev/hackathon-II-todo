# Feature Specification: Task Management API Endpoints

**Feature Branch**: `005-api-endpoints`
**Created**: 2026-01-12
**Status**: Draft
**Input**: User description: "Create API endpoints specification. Base URL: http://localhost:8000 (dev) | https://api.yourapp.com (prod). Authentication: All endpoints require Authorization: Bearer <jwt_token>. Endpoints: 1. GET /api/{user_id}/tasks with query params status (all|pending|completed, default: all), sort (created|title, default: created), Response: { tasks: Task[], count: number }. 2. POST /api/{user_id}/tasks, Body: { title: string, description?: string }, Response: Task (201 Created). 3. GET /api/{user_id}/tasks/{task_id}, Response: Task. 4. PUT /api/{user_id}/tasks/{task_id}, Body: { title?: string, description?: string }, Response: Task. 5. DELETE /api/{user_id}/tasks/{task_id}, Response: { message: 'Task deleted' } (200). 6. PATCH /api/{user_id}/tasks/{task_id}/complete, Response: Task (with toggled completed status). Error Responses: 400 (Invalid request body), 401 (Missing/invalid JWT), 403 (User ID mismatch), 404 (Task not found), 500 (Server error)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - List User's Tasks with Filtering (Priority: P1)

As an authenticated user, I can retrieve a list of my tasks with optional filtering by completion status and sorting by creation date or title so that I can view and organize my todo list.

**Why this priority**: Viewing tasks is the most fundamental operation. Users need to see their tasks before they can create, update, or delete them. This is the primary read operation and must work first for the application to be usable.

**Independent Test**: Can be fully tested by authenticating as a user, creating multiple tasks with different statuses, then calling GET /api/{user_id}/tasks with various query parameters (status, sort) and verifying the response contains the correct filtered and sorted tasks. Delivers task list viewing functionality.

**Acceptance Scenarios**:

1. **Given** I am authenticated with valid JWT containing user_id=123, **When** I call GET /api/123/tasks, **Then** I receive a 200 response with { tasks: Task[], count: number } containing all my tasks sorted by created_at descending
2. **Given** I have 5 tasks (3 pending, 2 completed), **When** I call GET /api/123/tasks?status=pending, **Then** I receive only the 3 pending tasks with count: 3
3. **Given** I have multiple tasks, **When** I call GET /api/123/tasks?status=completed, **Then** I receive only completed tasks with count matching the number of completed tasks
4. **Given** I have tasks with different titles, **When** I call GET /api/123/tasks?sort=title, **Then** tasks are sorted alphabetically by title (ascending)
5. **Given** I have tasks created at different times, **When** I call GET /api/123/tasks?sort=created (default), **Then** tasks are sorted by created_at descending (newest first)
6. **Given** I am authenticated as user_id=123, **When** I call GET /api/456/tasks (different user), **Then** I receive 403 Forbidden (user ID mismatch)
7. **Given** I call GET /api/123/tasks without Authorization header, **When** the request is processed, **Then** I receive 401 Unauthorized
8. **Given** I call GET /api/123/tasks with invalid JWT, **When** the JWT validation fails, **Then** I receive 401 Unauthorized
9. **Given** I have 0 tasks, **When** I call GET /api/123/tasks, **Then** I receive 200 with { tasks: [], count: 0 }

---

### User Story 2 - Create New Task (Priority: P1)

As an authenticated user, I can create a new task by providing a title and optional description so that I can add items to my todo list.

**Why this priority**: Creating tasks is equally critical to viewing them. Without the ability to create tasks, the application has no data to display. This is the primary write operation and enables the core todo functionality.

**Independent Test**: Can be fully tested by authenticating as a user, calling POST /api/{user_id}/tasks with { title, description }, and verifying a 201 response with the created task including auto-generated id, timestamps, and user_id. Delivers task creation functionality.

**Acceptance Scenarios**:

1. **Given** I am authenticated as user_id=123, **When** I POST /api/123/tasks with { title: "Buy groceries", description: "Milk, eggs, bread" }, **Then** I receive 201 Created with the new task object including id, user_id=123, title, description, completed=false, created_at, updated_at
2. **Given** I POST a task with only title, **When** I omit description, **Then** the task is created successfully with description=null
3. **Given** I POST /api/123/tasks with missing title, **When** validation fails, **Then** I receive 400 Bad Request with error message "title is required"
4. **Given** I POST /api/123/tasks with title exceeding 200 characters, **When** validation fails, **Then** I receive 400 Bad Request with error message "title must be 200 characters or less"
5. **Given** I POST /api/123/tasks with empty title (title: ""), **When** validation fails, **Then** I receive 400 Bad Request with error message "title cannot be empty"
6. **Given** I am authenticated as user_id=123, **When** I POST /api/456/tasks (different user), **Then** I receive 403 Forbidden (user ID mismatch)
7. **Given** I POST /api/123/tasks without Authorization header, **When** the request is processed, **Then** I receive 401 Unauthorized
8. **Given** I POST /api/123/tasks with malformed JSON body, **When** parsing fails, **Then** I receive 400 Bad Request with error message "Invalid JSON"

---

### User Story 3 - View Single Task Details (Priority: P2)

As an authenticated user, I can retrieve a specific task by its ID so that I can view full details of an individual task.

**Why this priority**: While viewing individual tasks is useful, users can function with the list view (P1). This is P2 because it's a convenience feature that improves UX but isn't blocking for core todo functionality. It becomes important when tasks have long descriptions.

**Independent Test**: Can be fully tested by creating a task, then calling GET /api/{user_id}/tasks/{task_id} and verifying the response contains the complete task object. Delivers individual task viewing.

**Acceptance Scenarios**:

1. **Given** I am authenticated as user_id=123 and I have a task with id=1, **When** I call GET /api/123/tasks/1, **Then** I receive 200 with the complete task object
2. **Given** I request a task that doesn't exist, **When** I call GET /api/123/tasks/9999, **Then** I receive 404 Not Found with error message "Task not found"
3. **Given** I am authenticated as user_id=123, **When** I call GET /api/123/tasks/5 (task owned by user_id=456), **Then** I receive 404 Not Found (not 403, to prevent information disclosure)
4. **Given** I am authenticated as user_id=123, **When** I call GET /api/456/tasks/1 (different user ID in path), **Then** I receive 403 Forbidden (user ID mismatch)
5. **Given** I call GET /api/123/tasks/1 without Authorization header, **When** the request is processed, **Then** I receive 401 Unauthorized
6. **Given** I call GET /api/123/tasks/abc (invalid task_id format), **When** validation fails, **Then** I receive 400 Bad Request with error message "Invalid task ID"

---

### User Story 4 - Update Task Details (Priority: P2)

As an authenticated user, I can update a task's title and/or description so that I can modify task information as my needs change.

**Why this priority**: Updating tasks is important for maintaining an accurate todo list, but users can work around it by deleting and recreating tasks (though not ideal). It's P2 because the core create/read/delete flow is functional without it.

**Independent Test**: Can be fully tested by creating a task, calling PUT /api/{user_id}/tasks/{task_id} with updated fields, and verifying the response reflects the changes with updated updated_at timestamp. Delivers task editing functionality.

**Acceptance Scenarios**:

1. **Given** I have a task with id=1, **When** I PUT /api/123/tasks/1 with { title: "Updated title", description: "Updated description" }, **Then** I receive 200 with the updated task and updated_at timestamp is newer
2. **Given** I want to update only title, **When** I PUT /api/123/tasks/1 with { title: "New title" }, **Then** only title is updated, description remains unchanged
3. **Given** I want to update only description, **When** I PUT /api/123/tasks/1 with { description: "New description" }, **Then** only description is updated, title remains unchanged
4. **Given** I PUT /api/123/tasks/1 with empty body {}, **When** validation fails, **Then** I receive 400 Bad Request with error message "At least one field (title or description) must be provided"
5. **Given** I PUT /api/123/tasks/1 with title exceeding 200 characters, **When** validation fails, **Then** I receive 400 Bad Request with error message "title must be 200 characters or less"
6. **Given** I PUT /api/123/tasks/1 with empty title (title: ""), **When** validation fails, **Then** I receive 400 Bad Request with error message "title cannot be empty"
7. **Given** I PUT a non-existent task, **When** I call PUT /api/123/tasks/9999, **Then** I receive 404 Not Found
8. **Given** I am authenticated as user_id=123, **When** I PUT /api/123/tasks/5 (task owned by user_id=456), **Then** I receive 404 Not Found
9. **Given** I am authenticated as user_id=123, **When** I PUT /api/456/tasks/1 (different user ID in path), **Then** I receive 403 Forbidden

---

### User Story 5 - Delete Task (Priority: P2)

As an authenticated user, I can delete a task so that I can remove items from my todo list that are no longer needed.

**Why this priority**: Deleting tasks is important for list maintenance, but the core value (creating and viewing tasks) works without it. Users can tolerate accumulating completed tasks temporarily. P2 priority balances functionality with MVP focus.

**Independent Test**: Can be fully tested by creating a task, calling DELETE /api/{user_id}/tasks/{task_id}, verifying 200 response with success message, then confirming the task no longer exists via GET. Delivers task deletion functionality.

**Acceptance Scenarios**:

1. **Given** I have a task with id=1, **When** I call DELETE /api/123/tasks/1, **Then** I receive 200 with { message: "Task deleted" }
2. **Given** I just deleted task id=1, **When** I call GET /api/123/tasks/1, **Then** I receive 404 Not Found (task no longer exists)
3. **Given** I DELETE a non-existent task, **When** I call DELETE /api/123/tasks/9999, **Then** I receive 404 Not Found
4. **Given** I am authenticated as user_id=123, **When** I DELETE /api/123/tasks/5 (task owned by user_id=456), **Then** I receive 404 Not Found
5. **Given** I am authenticated as user_id=123, **When** I DELETE /api/456/tasks/1 (different user ID in path), **Then** I receive 403 Forbidden
6. **Given** I DELETE /api/123/tasks/1 without Authorization header, **When** the request is processed, **Then** I receive 401 Unauthorized

---

### User Story 6 - Toggle Task Completion Status (Priority: P1)

As an authenticated user, I can mark a task as complete or incomplete by toggling its status so that I can track which tasks are done.

**Why this priority**: Marking tasks complete is core todo functionality. Without it, the app is just a list with no status tracking. This is what makes it a "todo" app vs a simple notes app. P1 priority because it's essential to the value proposition.

**Independent Test**: Can be fully tested by creating a task (completed=false), calling PATCH /api/{user_id}/tasks/{task_id}/complete, verifying the response shows completed=true, calling again, and verifying it toggles back to completed=false. Delivers task completion tracking.

**Acceptance Scenarios**:

1. **Given** I have a pending task (completed=false) with id=1, **When** I call PATCH /api/123/tasks/1/complete, **Then** I receive 200 with the task object showing completed=true and updated updated_at
2. **Given** I have a completed task (completed=true) with id=1, **When** I call PATCH /api/123/tasks/1/complete, **Then** the task toggles to completed=false (undo completion)
3. **Given** I call PATCH on a task multiple times, **When** I alternate requests, **Then** the completed status toggles each time (true → false → true)
4. **Given** I PATCH a non-existent task, **When** I call PATCH /api/123/tasks/9999/complete, **Then** I receive 404 Not Found
5. **Given** I am authenticated as user_id=123, **When** I PATCH /api/123/tasks/5/complete (task owned by user_id=456), **Then** I receive 404 Not Found
6. **Given** I am authenticated as user_id=123, **When** I PATCH /api/456/tasks/1/complete (different user ID in path), **Then** I receive 403 Forbidden
7. **Given** I PATCH /api/123/tasks/1/complete without Authorization header, **When** the request is processed, **Then** I receive 401 Unauthorized

---

### Edge Cases

- **What happens when JWT is expired?** FastAPI middleware validates JWT expiration (exp claim). If expired, return 401 Unauthorized with error message "Token expired". Frontend redirects to sign-in page.

- **What happens when user_id in JWT doesn't match user_id in path?** Middleware extracts user_id from JWT (sub claim) and compares to path parameter. If mismatch, return 403 Forbidden with error message "User ID mismatch". Prevents users from accessing other users' tasks.

- **What happens when task_id is not a valid integer?** FastAPI path parameter validation fails. Return 400 Bad Request with error message "Invalid task ID format".

- **What happens when query parameter values are invalid?** Validate status in ["all", "pending", "completed"] and sort in ["created", "title"]. If invalid, return 400 Bad Request with error message "Invalid status/sort parameter".

- **What happens when request body contains extra fields?** Pydantic models ignore extra fields by default (with proper config). No error, extra fields are silently discarded.

- **What happens when description is extremely long (e.g., 1MB)?** FastAPI has default request body size limit (100MB). For description specifically, no length limit enforced (TEXT column). Consider adding validation if needed (e.g., max 10,000 characters).

- **What happens when multiple requests try to update the same task simultaneously?** Database handles concurrency via transactions. Last write wins. No optimistic locking in MVP. Consider adding version field if conflicts become an issue.

- **What happens when database is unavailable during request?** FastAPI catches database connection errors. Return 503 Service Unavailable with error message "Database temporarily unavailable".

- **What happens when calling DELETE on an already-deleted task?** Returns 404 Not Found (idempotent - same result as first DELETE).

- **What happens when filtering returns no tasks?** Return 200 with { tasks: [], count: 0 } (empty array, not 404).

- **What happens when user_id in path doesn't exist in database?** If authenticated user_id doesn't exist (shouldn't happen with valid JWT), middleware should catch this. If path user_id doesn't match JWT user_id, return 403 Forbidden before database lookup.

- **What happens with CORS preflight requests (OPTIONS)?** FastAPI CORS middleware handles OPTIONS requests automatically. Return appropriate CORS headers for frontend domain.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: API MUST be accessible at http://localhost:8000 in development and https://api.yourapp.com in production
- **FR-002**: All endpoints MUST require Authorization: Bearer <jwt_token> header (except health check if implemented)
- **FR-003**: API MUST validate JWT signature, expiration, and extract user_id (sub claim) on every request
- **FR-004**: API MUST return 401 Unauthorized for missing, invalid, or expired JWT tokens
- **FR-005**: API MUST return 403 Forbidden when authenticated user_id doesn't match user_id in path parameter
- **FR-006**: API MUST implement GET /api/{user_id}/tasks to list user's tasks with optional filtering and sorting
- **FR-007**: GET /api/{user_id}/tasks MUST support query parameter status (values: "all", "pending", "completed", default: "all")
- **FR-008**: GET /api/{user_id}/tasks MUST support query parameter sort (values: "created", "title", default: "created")
- **FR-009**: GET /api/{user_id}/tasks MUST return { tasks: Task[], count: number } with 200 status code
- **FR-010**: API MUST implement POST /api/{user_id}/tasks to create new tasks
- **FR-011**: POST /api/{user_id}/tasks MUST validate request body { title: string (required, max 200 chars), description?: string }
- **FR-012**: POST /api/{user_id}/tasks MUST return created Task with 201 status code
- **FR-013**: API MUST implement GET /api/{user_id}/tasks/{task_id} to retrieve individual tasks
- **FR-014**: GET /api/{user_id}/tasks/{task_id} MUST return Task with 200 status code or 404 if not found
- **FR-015**: API MUST implement PUT /api/{user_id}/tasks/{task_id} to update tasks
- **FR-016**: PUT /api/{user_id}/tasks/{task_id} MUST validate request body { title?: string (max 200 chars), description?: string }
- **FR-017**: PUT /api/{user_id}/tasks/{task_id} MUST require at least one field (title or description) in request body
- **FR-018**: PUT /api/{user_id}/tasks/{task_id} MUST return updated Task with 200 status code
- **FR-019**: API MUST implement DELETE /api/{user_id}/tasks/{task_id} to delete tasks
- **FR-020**: DELETE /api/{user_id}/tasks/{task_id} MUST return { message: "Task deleted" } with 200 status code
- **FR-021**: API MUST implement PATCH /api/{user_id}/tasks/{task_id}/complete to toggle task completion status
- **FR-022**: PATCH /api/{user_id}/tasks/{task_id}/complete MUST return updated Task with toggled completed field
- **FR-023**: API MUST return 400 Bad Request for invalid request bodies, query parameters, or path parameters
- **FR-024**: API MUST return 404 Not Found when task_id doesn't exist or doesn't belong to authenticated user
- **FR-025**: API MUST return 500 Internal Server Error for unexpected server errors
- **FR-026**: API MUST enforce user data isolation - users can only access their own tasks (verified via JWT user_id)
- **FR-027**: API MUST use JSON for all request and response bodies
- **FR-028**: API MUST set appropriate Content-Type headers (application/json)
- **FR-029**: API MUST validate path parameter task_id is a valid integer
- **FR-030**: API MUST update updated_at timestamp on task modification (PUT, PATCH)

### Key Entities

- **Task (Response Object)**: Represents a task in API responses
  - Fields: id (number), user_id (string), title (string, max 200), description (string | null), completed (boolean), created_at (ISO 8601 timestamp), updated_at (ISO 8601 timestamp)
  - Example: `{ id: 1, user_id: "123", title: "Buy groceries", description: "Milk, eggs", completed: false, created_at: "2026-01-12T10:00:00Z", updated_at: "2026-01-12T10:00:00Z" }`

- **TaskCreate (Request Body for POST)**: Represents task creation request
  - Fields: title (string, required, 1-200 chars), description (string, optional)
  - Validation: title cannot be empty, title max 200 characters
  - Example: `{ title: "Buy groceries", description: "Milk, eggs, bread" }`

- **TaskUpdate (Request Body for PUT)**: Represents task update request
  - Fields: title (string, optional, 1-200 chars if provided), description (string, optional)
  - Validation: At least one field must be provided, title cannot be empty if provided
  - Example: `{ title: "Updated title" }` or `{ description: "Updated description" }` or both

- **TaskList (Response for GET list)**: Represents list of tasks response
  - Fields: tasks (Task[]), count (number)
  - Example: `{ tasks: [Task, Task], count: 2 }`

- **DeleteResponse**: Represents successful deletion response
  - Fields: message (string)
  - Example: `{ message: "Task deleted" }`

- **ErrorResponse**: Represents error response structure
  - Fields: error (string), detail (string, optional)
  - Example: `{ error: "Task not found" }` or `{ error: "Validation error", detail: "title is required" }`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 6 endpoints return correct status codes (200, 201, 400, 401, 403, 404, 500) in 100% of test scenarios
- **SC-002**: GET /api/{user_id}/tasks responds within 100ms for lists up to 1000 tasks (with database indexes)
- **SC-003**: POST /api/{user_id}/tasks responds within 200ms for task creation
- **SC-004**: PUT, PATCH, DELETE operations respond within 150ms
- **SC-005**: JWT validation occurs on 100% of requests (no bypass scenarios)
- **SC-006**: User ID mismatch detection occurs 100% of the time (403 returned for all mismatches)
- **SC-007**: Data isolation is enforced 100% - users never receive tasks owned by other users
- **SC-008**: Request body validation catches 100% of invalid inputs (missing required fields, exceeding max length, invalid types)
- **SC-009**: Query parameter validation catches 100% of invalid status/sort values
- **SC-010**: API handles 100 concurrent requests without errors or degradation
- **SC-011**: All endpoints return valid JSON responses with correct Content-Type headers
- **SC-012**: Task completion toggle (PATCH) correctly alternates status 100% of the time

### API Contract Compliance

- **API-001**: All response schemas match documented TypeScript interfaces
- **API-002**: All error responses follow consistent { error, detail? } structure
- **API-003**: All timestamps are in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- **API-004**: All endpoints respect HTTP method semantics (GET=read, POST=create, PUT=update, PATCH=partial update, DELETE=delete)
- **API-005**: Idempotent operations (GET, PUT, DELETE) produce same result on repeated calls
- **API-006**: Status codes align with HTTP standards (2xx success, 4xx client error, 5xx server error)

### Security Metrics

- **SEC-001**: 100% of requests without JWT are rejected with 401
- **SEC-002**: 100% of requests with expired JWT are rejected with 401
- **SEC-003**: 100% of requests with tampered JWT are rejected with 401
- **SEC-004**: 100% of cross-user access attempts are rejected with 403 or 404
- **SEC-005**: No sensitive information (user emails, passwords) in error messages
- **SEC-006**: All requests/responses use HTTPS in production (enforced by infrastructure)

### User Experience Metrics

- **UX-001**: Error messages are clear and actionable (e.g., "title is required" not "validation error")
- **UX-002**: Filtering by status="pending" returns only incomplete tasks 100% of the time
- **UX-003**: Sorting by title returns alphabetically ordered tasks 100% of the time
- **UX-004**: Task creation returns the created task immediately (no need for subsequent GET)
- **UX-005**: Updated tasks include new updated_at timestamp (visible to frontend)

## Technical Constraints

### Framework and Tools
- **Framework**: FastAPI (Python 3.13+)
- **API Router**: FastAPI APIRouter for modular endpoint organization
- **Validation**: Pydantic v2 models for request/response validation
- **JWT Handling**: python-jose or PyJWT for token validation
- **Middleware**: Custom FastAPI middleware for JWT validation and user ID extraction
- **CORS**: FastAPI CORSMiddleware for frontend (Next.js) origin
- **Database**: Async SQLModel queries via asyncpg

### Request/Response Format
- **Content-Type**: application/json (all requests and responses)
- **Timestamp Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
- **Date Handling**: Python datetime objects serialized to ISO 8601 strings
- **JSON Serialization**: FastAPI's built-in JSON encoder with Pydantic

### Authentication Flow
1. Frontend sends request with Authorization: Bearer <jwt_token>
2. FastAPI middleware extracts token from header
3. Middleware validates JWT signature using BETTER_AUTH_SECRET
4. Middleware checks exp claim (expiration)
5. Middleware extracts user_id from sub claim
6. Middleware compares JWT user_id to path parameter user_id
7. If all checks pass, request proceeds to endpoint handler
8. Endpoint handler filters database queries by user_id

### Endpoint Path Structure
- **Base**: /api/{user_id}/tasks
- **Collection**: GET /api/{user_id}/tasks (list), POST /api/{user_id}/tasks (create)
- **Resource**: GET /api/{user_id}/tasks/{task_id} (read), PUT /api/{user_id}/tasks/{task_id} (update), DELETE /api/{user_id}/tasks/{task_id} (delete)
- **Action**: PATCH /api/{user_id}/tasks/{task_id}/complete (toggle completion)
- **Rationale**: RESTful design with user_id in path for explicit user scoping (alternative: extract user_id from JWT only, but path makes intent clearer)

### Error Handling
- **400 Bad Request**: Invalid JSON, validation errors, invalid query params
- **401 Unauthorized**: Missing JWT, invalid JWT signature, expired JWT
- **403 Forbidden**: User ID mismatch (authenticated user trying to access different user's resources)
- **404 Not Found**: Task doesn't exist or doesn't belong to authenticated user
- **500 Internal Server Error**: Database errors, unexpected exceptions
- **503 Service Unavailable**: Database connection failures

### Validation Rules
- **title**: Required for POST, optional for PUT, 1-200 characters, cannot be empty string
- **description**: Optional for POST and PUT, no length limit (TEXT column)
- **status query param**: Must be in ["all", "pending", "completed"], default "all"
- **sort query param**: Must be in ["created", "title"], default "created"
- **task_id path param**: Must be valid integer (positive)
- **user_id path param**: TEXT format (matches JWT sub claim)

## Non-Functional Requirements

- **Performance**: 95th percentile response time <200ms for all endpoints
- **Scalability**: API supports 1000 concurrent users (stateless design, horizontal scaling)
- **Reliability**: 99.9% uptime (excluding planned maintenance)
- **Security**: All endpoints protected by JWT, data isolation enforced, HTTPS in production
- **Maintainability**: OpenAPI (Swagger) documentation auto-generated by FastAPI
- **Testability**: All endpoints have contract tests, integration tests, and E2E tests
- **Observability**: All requests logged with user_id, endpoint, status code, response time

## Out of Scope (Explicitly Not Included)

- **Pagination**: Not implemented in MVP (filter returns all matching tasks). Future enhancement for large task lists.
- **Bulk operations**: No batch create/update/delete endpoints
- **Task search**: No full-text search or advanced filtering (only status filter in MVP)
- **Task ordering**: No custom ordering field (default sort by created_at or title only)
- **Task sharing**: No endpoints for sharing tasks with other users
- **Task comments**: No commenting functionality
- **Task attachments**: No file upload endpoints
- **Task history/audit**: No endpoint to view task edit history
- **Rate limiting**: Not implemented in MVP (future enhancement for production)
- **API versioning**: No /v1/ prefix in MVP (add when breaking changes needed)
- **Webhooks**: No webhook notifications for task changes
- **Batch export**: No endpoint to export tasks to CSV/JSON
- **Task templates**: No template creation/management endpoints
- **Health check endpoint**: Not specified (can add /health for monitoring)

## Assumptions

- JWT contains user_id in sub claim and email in email claim
- BETTER_AUTH_SECRET is shared between Next.js (Better Auth) and FastAPI
- Frontend handles token refresh (no refresh token endpoint in this spec)
- CORS allows requests from Next.js frontend domain
- Database user_id column matches JWT sub claim (TEXT type)
- All dates/times are in UTC (no timezone conversion needed)
- Frontend displays tasks in order received from API (no client-side re-sorting)
- Task completion toggle is sufficient (no separate "mark complete" and "mark incomplete" endpoints)
- 200 character title limit is enforced by both API validation and database constraint
- User deletion is handled outside this API (Better Auth handles user management)

## Dependencies

- **FastAPI**: Web framework for API endpoints
- **Pydantic**: Request/response validation and serialization
- **python-jose or PyJWT**: JWT validation and decoding
- **SQLModel**: Database ORM for task queries
- **asyncpg**: Async PostgreSQL driver
- **Better Auth**: Issues JWTs that this API validates
- **Neon PostgreSQL**: Database containing tasks table
- **CORS middleware**: FastAPI CORSMiddleware for frontend origin

## API Contract (TypeScript Interfaces)

```typescript
// Task model
interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// Request bodies
interface TaskCreate {
  title: string; // 1-200 chars, required
  description?: string; // optional
}

interface TaskUpdate {
  title?: string; // 1-200 chars, optional
  description?: string; // optional
  // At least one field required
}

// Response types
interface TaskListResponse {
  tasks: Task[];
  count: number;
}

interface DeleteResponse {
  message: string;
}

interface ErrorResponse {
  error: string;
  detail?: string;
}

// Query parameters
interface TaskListParams {
  status?: "all" | "pending" | "completed"; // default: "all"
  sort?: "created" | "title"; // default: "created"
}
```

## Endpoint Specifications

### 1. GET /api/{user_id}/tasks - List Tasks

**Description**: Retrieve all tasks for authenticated user with optional filtering and sorting

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string, required): Must match JWT sub claim

**Query Parameters**:
- `status` (string, optional): Filter by completion status ("all", "pending", "completed"). Default: "all"
- `sort` (string, optional): Sort order ("created", "title"). Default: "created"

**Response 200** (Success):
```json
{
  "tasks": [
    {
      "id": 1,
      "user_id": "123",
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "completed": false,
      "created_at": "2026-01-12T10:00:00Z",
      "updated_at": "2026-01-12T10:00:00Z"
    }
  ],
  "count": 1
}
```

**Response 400** (Bad Request): Invalid query parameters
**Response 401** (Unauthorized): Missing/invalid JWT
**Response 403** (Forbidden): User ID mismatch

---

### 2. POST /api/{user_id}/tasks - Create Task

**Description**: Create a new task for authenticated user

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string, required): Must match JWT sub claim

**Request Body**:
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

**Response 201** (Created):
```json
{
  "id": 1,
  "user_id": "123",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "created_at": "2026-01-12T10:00:00Z",
  "updated_at": "2026-01-12T10:00:00Z"
}
```

**Response 400** (Bad Request): Missing title, title too long, invalid JSON
**Response 401** (Unauthorized): Missing/invalid JWT
**Response 403** (Forbidden): User ID mismatch

---

### 3. GET /api/{user_id}/tasks/{task_id} - Get Task

**Description**: Retrieve a specific task by ID

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string, required): Must match JWT sub claim
- `task_id` (integer, required): Task ID

**Response 200** (Success):
```json
{
  "id": 1,
  "user_id": "123",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "created_at": "2026-01-12T10:00:00Z",
  "updated_at": "2026-01-12T10:00:00Z"
}
```

**Response 400** (Bad Request): Invalid task_id format
**Response 401** (Unauthorized): Missing/invalid JWT
**Response 403** (Forbidden): User ID mismatch
**Response 404** (Not Found): Task doesn't exist or doesn't belong to user

---

### 4. PUT /api/{user_id}/tasks/{task_id} - Update Task

**Description**: Update task title and/or description

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string, required): Must match JWT sub claim
- `task_id` (integer, required): Task ID

**Request Body** (at least one field required):
```json
{
  "title": "Updated title",
  "description": "Updated description"
}
```

**Response 200** (Success):
```json
{
  "id": 1,
  "user_id": "123",
  "title": "Updated title",
  "description": "Updated description",
  "completed": false,
  "created_at": "2026-01-12T10:00:00Z",
  "updated_at": "2026-01-12T11:00:00Z"
}
```

**Response 400** (Bad Request): No fields provided, title too long, invalid JSON
**Response 401** (Unauthorized): Missing/invalid JWT
**Response 403** (Forbidden): User ID mismatch
**Response 404** (Not Found): Task doesn't exist or doesn't belong to user

---

### 5. DELETE /api/{user_id}/tasks/{task_id} - Delete Task

**Description**: Delete a task permanently

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string, required): Must match JWT sub claim
- `task_id` (integer, required): Task ID

**Response 200** (Success):
```json
{
  "message": "Task deleted"
}
```

**Response 400** (Bad Request): Invalid task_id format
**Response 401** (Unauthorized): Missing/invalid JWT
**Response 403** (Forbidden): User ID mismatch
**Response 404** (Not Found): Task doesn't exist or doesn't belong to user

---

### 6. PATCH /api/{user_id}/tasks/{task_id}/complete - Toggle Completion

**Description**: Toggle task completion status (true ↔ false)

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string, required): Must match JWT sub claim
- `task_id` (integer, required): Task ID

**Response 200** (Success):
```json
{
  "id": 1,
  "user_id": "123",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": true,
  "created_at": "2026-01-12T10:00:00Z",
  "updated_at": "2026-01-12T12:00:00Z"
}
```

**Response 400** (Bad Request): Invalid task_id format
**Response 401** (Unauthorized): Missing/invalid JWT
**Response 403** (Forbidden): User ID mismatch
**Response 404** (Not Found): Task doesn't exist or doesn't belong to user

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| JWT secret mismatch (frontend/backend) | Critical - all auth fails | Low | Document shared secret in .env setup, test during integration |
| User ID mismatch not detected | Critical - security breach | Low | Middleware test coverage, explicit 403 handling, E2E tests |
| Database query N+1 problem | Medium - slow list endpoint | Low | Use SQLModel eager loading, index on user_id, test with 1000+ tasks |
| No pagination on list endpoint | Medium - memory issues with large task lists | Medium | Monitor task counts per user, add pagination if users exceed 1000 tasks |
| Inconsistent error messages | Low - poor UX | Medium | Standardize error responses with Pydantic validators, test all validation paths |
| CORS misconfiguration | Medium - frontend blocked | Low | Test CORS in dev environment matching production origin setup |
| Missing updated_at update | Low - stale timestamps | Low | Test PUT/PATCH update timestamps, use SQLModel auto-update or trigger |
| Task ID integer overflow | Very Low - at billions of tasks | Very Low | Use SERIAL (int32) sufficient for MVP, migrate to BIGSERIAL if needed |
| Concurrent task updates | Low - last write wins | Medium | Acceptable for MVP, document behavior, add optimistic locking if conflicts occur |

## Acceptance Checklist

Before considering this feature complete, verify:

- [ ] All 6 endpoints respond with correct status codes
- [ ] JWT validation rejects missing/invalid/expired tokens (401)
- [ ] User ID mismatch returns 403 Forbidden
- [ ] GET /api/{user_id}/tasks filters by status correctly
- [ ] GET /api/{user_id}/tasks sorts by created/title correctly
- [ ] POST /api/{user_id}/tasks creates tasks with correct user_id
- [ ] POST validates title (required, max 200 chars)
- [ ] PUT validates at least one field provided
- [ ] PUT updates updated_at timestamp
- [ ] DELETE removes task and returns 404 on subsequent GET
- [ ] PATCH toggles completed status correctly
- [ ] All endpoints return valid JSON with correct Content-Type
- [ ] All timestamps in ISO 8601 format
- [ ] Error responses follow { error, detail? } structure
- [ ] OpenAPI/Swagger docs generated correctly
- [ ] CORS allows frontend origin
- [ ] 80% test coverage on API endpoints
- [ ] Contract tests verify request/response schemas
- [ ] E2E tests cover all 6 endpoints with authentication
