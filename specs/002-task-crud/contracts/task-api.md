# API Contract: Task CRUD Endpoints

**Backend**: FastAPI (007-fastapi-backend)
**Frontend**: Next.js 16 (002-task-crud)
**Base URL**: `${NEXT_PUBLIC_API_URL}` (environment variable)

---

## Authentication

All endpoints require JWT authentication via HTTP-only cookie.

**Cookie Name**: `auth-token` (or as configured by Better Auth)
**Header** (alternative): `Authorization: Bearer <jwt_token>`

**Authorization Rule**: User can only access their own tasks (`user_id` in path must match JWT `sub` claim)

---

## Endpoints

### 1. List Tasks

Get all tasks for the authenticated user with optional filtering.

**Endpoint**: `GET /api/{user_id}/tasks`

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT sub claim)

**Query Parameters**:
- `filter` (string, optional): Filter by status
  - Values: `all`, `pending`, `completed`
  - Default: `all`

**Request Example**:
```http
GET /api/user123/tasks?filter=pending HTTP/1.1
Host: localhost:8000
Cookie: auth-token=<jwt_token>
```

**Success Response** (200 OK):
```json
{
  "tasks": [
    {
      "id": 1,
      "user_id": "user123",
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "completed": false,
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "user_id": "user123",
      "title": "Finish report",
      "description": null,
      "completed": false,
      "created_at": "2026-01-14T09:00:00Z",
      "updated_at": "2026-01-14T09:00:00Z"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: JWT missing, invalid, or expired
- `403 Forbidden`: `user_id` does not match JWT `sub` claim
- `500 Internal Server Error`: Server error

**TypeScript Type**:
```typescript
interface GetTasksResponse {
  tasks: Task[]
}
```

---

### 2. Create Task

Create a new task for the authenticated user.

**Endpoint**: `POST /api/{user_id}/tasks`

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT sub claim)

**Request Body** (JSON):
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

**Field Validation**:
- `title` (string, required): 1-200 characters
- `description` (string, optional): Can be null or omitted

**Request Example**:
```http
POST /api/user123/tasks HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Cookie: auth-token=<jwt_token>

{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

**Success Response** (201 Created):
```json
{
  "task": {
    "id": 3,
    "user_id": "user123",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "created_at": "2026-01-15T11:00:00Z",
    "updated_at": "2026-01-15T11:00:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error (e.g., title missing, title > 200 chars)
  ```json
  {
    "detail": "Title is required"
  }
  ```
- `401 Unauthorized`: JWT missing, invalid, or expired
- `403 Forbidden`: `user_id` does not match JWT `sub` claim
- `500 Internal Server Error`: Server error

**TypeScript Type**:
```typescript
interface CreateTaskRequest {
  title: string
  description?: string | null
}

interface CreateTaskResponse {
  task: Task
}
```

---

### 3. Get Single Task

Retrieve a specific task by ID.

**Endpoint**: `GET /api/{user_id}/tasks/{task_id}`

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT sub claim)
- `task_id` (integer, required): Task ID

**Request Example**:
```http
GET /api/user123/tasks/1 HTTP/1.1
Host: localhost:8000
Cookie: auth-token=<jwt_token>
```

**Success Response** (200 OK):
```json
{
  "task": {
    "id": 1,
    "user_id": "user123",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: JWT missing, invalid, or expired
- `403 Forbidden`: `user_id` does not match JWT `sub` claim or task belongs to different user
- `404 Not Found`: Task with `task_id` does not exist
- `500 Internal Server Error`: Server error

**TypeScript Type**:
```typescript
interface GetTaskResponse {
  task: Task
}
```

---

### 4. Update Task

Update title and/or description of an existing task.

**Endpoint**: `PUT /api/{user_id}/tasks/{task_id}`

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT sub claim)
- `task_id` (integer, required): Task ID

**Request Body** (JSON):
```json
{
  "title": "Buy groceries (updated)",
  "description": "Milk, eggs, bread, coffee"
}
```

**Field Validation**:
- `title` (string, required): 1-200 characters
- `description` (string, optional): Can be null

**Request Example**:
```http
PUT /api/user123/tasks/1 HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Cookie: auth-token=<jwt_token>

{
  "title": "Buy groceries (updated)",
  "description": "Milk, eggs, bread, coffee"
}
```

**Success Response** (200 OK):
```json
{
  "task": {
    "id": 1,
    "user_id": "user123",
    "title": "Buy groceries (updated)",
    "description": "Milk, eggs, bread, coffee",
    "completed": false,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-15T12:00:00Z"
  }
}
```

**Notes**:
- `updated_at` timestamp is updated by backend
- `completed` status is NOT changed by this endpoint (use PATCH /complete instead)

**Error Responses**:
- `400 Bad Request`: Validation error (e.g., title missing, title > 200 chars)
- `401 Unauthorized`: JWT missing, invalid, or expired
- `403 Forbidden`: `user_id` does not match JWT `sub` claim or task belongs to different user
- `404 Not Found`: Task with `task_id` does not exist
- `500 Internal Server Error`: Server error

**TypeScript Type**:
```typescript
interface UpdateTaskRequest {
  title: string
  description?: string | null
}

interface UpdateTaskResponse {
  task: Task
}
```

---

### 5. Delete Task

Permanently delete a task.

**Endpoint**: `DELETE /api/{user_id}/tasks/{task_id}`

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT sub claim)
- `task_id` (integer, required): Task ID

**Request Example**:
```http
DELETE /api/user123/tasks/1 HTTP/1.1
Host: localhost:8000
Cookie: auth-token=<jwt_token>
```

**Success Response** (200 OK):
```json
{
  "message": "Task deleted successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: JWT missing, invalid, or expired
- `403 Forbidden`: `user_id` does not match JWT `sub` claim or task belongs to different user
- `404 Not Found`: Task with `task_id` does not exist (idempotent - frontend can treat 404 as success)
- `500 Internal Server Error`: Server error

**TypeScript Type**:
```typescript
interface DeleteTaskResponse {
  message: string
}
```

---

### 6. Toggle Task Completion

Toggle the completion status of a task (completed: true ↔ false).

**Endpoint**: `PATCH /api/{user_id}/tasks/{task_id}/complete`

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT sub claim)
- `task_id` (integer, required): Task ID

**Request Body**: None (toggle operation, no body needed)

**Request Example**:
```http
PATCH /api/user123/tasks/1/complete HTTP/1.1
Host: localhost:8000
Cookie: auth-token=<jwt_token>
```

**Success Response** (200 OK):
```json
{
  "task": {
    "id": 1,
    "user_id": "user123",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": true,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-15T12:30:00Z"
  }
}
```

**Notes**:
- If `completed` was `false`, it becomes `true`
- If `completed` was `true`, it becomes `false`
- `updated_at` timestamp is updated by backend

**Error Responses**:
- `401 Unauthorized`: JWT missing, invalid, or expired
- `403 Forbidden`: `user_id` does not match JWT `sub` claim or task belongs to different user
- `404 Not Found`: Task with `task_id` does not exist
- `500 Internal Server Error`: Server error

**TypeScript Type**:
```typescript
interface ToggleCompleteResponse {
  task: Task
}
```

---

## Error Handling

### Standard Error Response Format

All error responses follow this format:

```json
{
  "detail": "Human-readable error message"
}
```

### Common Error Messages

| Status Code | Error Message | Frontend Action |
|-------------|---------------|-----------------|
| `400` | "Title is required" | Display validation error below input field |
| `400` | "Title must be 200 characters or less" | Display validation error |
| `401` | "Invalid or expired token" | Redirect to /signin, display "Session expired" |
| `403` | "Forbidden" | Display "Access denied" (should not happen in normal flow) |
| `404` | "Task not found" | Display "Task not found" (or silently remove from UI if delete) |
| `500` | "Internal server error" | Display "Something went wrong. Please try again later." |

---

## Frontend Implementation Guidelines

### API Client Structure

```typescript
// lib/api/tasks.ts

import { apiClient } from './client'

export async function getTasks(userId: string, filter?: FilterType): Promise<Task[]> {
  const params = filter && filter !== 'all' ? `?filter=${filter}` : ''
  const response = await apiClient.get<GetTasksResponse>(`/api/${userId}/tasks${params}`)
  return response.tasks
}

export async function createTask(userId: string, data: TaskFormData): Promise<Task> {
  const response = await apiClient.post<CreateTaskResponse>(`/api/${userId}/tasks`, {
    title: data.title,
    description: data.description || null
  })
  return response.task
}

export async function updateTask(userId: string, taskId: number, data: TaskFormData): Promise<Task> {
  const response = await apiClient.put<UpdateTaskResponse>(`/api/${userId}/tasks/${taskId}`, {
    title: data.title,
    description: data.description || null
  })
  return response.task
}

export async function deleteTask(userId: string, taskId: number): Promise<void> {
  await apiClient.delete(`/api/${userId}/tasks/${taskId}`)
}

export async function toggleComplete(userId: string, taskId: number): Promise<Task> {
  const response = await apiClient.patch<ToggleCompleteResponse>(`/api/${userId}/tasks/${taskId}/complete`)
  return response.task
}
```

### Base API Client with Auth

```typescript
// lib/api/client.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class APIClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      credentials: 'include',  // Include cookies (JWT)
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    // Handle 401 Unauthorized (redirect to sign-in)
    if (response.status === 401) {
      window.location.href = '/signin?error=session_expired'
      throw new Error('Session expired')
    }

    // Handle errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || 'Request failed')
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    })
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    })
  }

  async delete(endpoint: string): Promise<void> {
    await this.request(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new APIClient(API_URL)
```

---

## Testing

### Contract Tests (Vitest)

Verify request/response types match contracts:

```typescript
// tests/contract/task-api.test.ts

import { describe, test, expect } from 'vitest'
import { taskFormSchema } from '@/lib/validation/task'

test('CreateTaskRequest validates correctly', () => {
  const validData = { title: 'Test task', description: 'Description' }
  const result = taskFormSchema.safeParse(validData)
  expect(result.success).toBe(true)

  const invalidData = { title: '', description: 'Description' }
  const result2 = taskFormSchema.safeParse(invalidData)
  expect(result2.success).toBe(false)
})
```

### Integration Tests (MSW Mocks)

Mock API responses for component testing:

```typescript
// tests/mocks/handlers.ts

import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/:userId/tasks', () => {
    return HttpResponse.json({
      tasks: [
        { id: 1, user_id: 'user123', title: 'Task 1', description: null, completed: false, created_at: '2026-01-15T10:00:00Z', updated_at: '2026-01-15T10:00:00Z' }
      ]
    })
  }),

  http.post('/api/:userId/tasks', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      task: { id: 2, user_id: 'user123', ...body, completed: false, created_at: '2026-01-15T11:00:00Z', updated_at: '2026-01-15T11:00:00Z' }
    }, { status: 201 })
  })
]
```

---

## Summary

This API contract defines:

1. **6 RESTful Endpoints**: Complete CRUD operations + toggle completion
2. **Type Safety**: All requests/responses have TypeScript interfaces
3. **Authentication**: JWT via HTTP-only cookies, 401 redirects to /signin
4. **Authorization**: User can only access their own tasks
5. **Error Handling**: Standardized error format, user-friendly messages
6. **Frontend Integration**: Base API client with automatic auth handling

**Next Steps**: Implement API client in `frontend/src/lib/api/` using these contracts.
