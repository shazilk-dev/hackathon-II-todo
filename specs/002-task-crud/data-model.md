# Data Model: Frontend State Models

**Feature**: Task CRUD Web Interface
**Date**: 2026-01-15
**Purpose**: Define TypeScript types/interfaces for frontend application state, API contracts, and UI state management

---

## 1. Core Domain Entities

### Task Entity

Represents a task in the application (matches backend database model).

```typescript
// types/task.ts

export interface Task {
  id: number                    // Primary key (backend-generated)
  user_id: string               // Foreign key to users table
  title: string                 // Task title (1-200 characters)
  description: string | null    // Optional description (can be null)
  completed: boolean            // Completion status (true/false)
  created_at: string            // ISO 8601 timestamp (e.g., "2026-01-15T10:30:00Z")
  updated_at: string            // ISO 8601 timestamp
}
```

**Field Constraints** (enforced by backend, validated client-side for UX):
- `title`: Required, 1-200 characters
- `description`: Optional, no length limit (practical limit for UX)
- `completed`: Boolean (default: false)
- Timestamps: Backend-generated, read-only on frontend

**Usage**:
- Task list rendering
- Task item display
- Edit form pre-population
- API response parsing

---

### User Entity

Represents the authenticated user (minimal frontend representation).

```typescript
// types/auth.ts

export interface User {
  id: string                    // User ID (from JWT sub claim)
  email: string                 // User email
}
```

**Note**: Frontend only needs user ID and email. Better Auth manages full user session.

**Usage**:
- Display user email in header/navigation
- Include user_id in API requests (path parameter)
- Authorization checks

---

## 2. Form Data Types

### TaskFormData

Input data for creating or editing tasks (form state).

```typescript
// types/task.ts

export interface TaskFormData {
  title: string                 // Required, 1-200 characters
  description: string           // Optional, can be empty string (converted to null before API call)
}
```

**Validation Schema** (Zod):
```typescript
// lib/validation/task.ts

import { z } from 'zod'

export const taskFormSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z.string().optional()
})

export type TaskFormData = z.infer<typeof taskFormSchema>
```

**Usage**:
- React Hook Form integration
- Client-side validation before submission
- Create task form
- Edit task form

---

### AuthFormData

Input data for sign-up and sign-in forms.

```typescript
// types/auth.ts

export interface SignUpFormData {
  email: string                 // Valid email format
  password: string              // Minimum 8 characters
}

export interface SignInFormData {
  email: string                 // Email address
  password: string              // Password (no client-side validation on sign-in)
}
```

**Validation Schema** (Zod):
```typescript
// lib/validation/auth.ts

import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export type SignUpFormData = z.infer<typeof signUpSchema>
export type SignInFormData = z.infer<typeof signInSchema>
```

**Usage**:
- Sign-up form validation
- Sign-in form validation
- POST to Better Auth API routes

---

## 3. API Request/Response Types

### Task API Contracts

TypeScript interfaces matching backend FastAPI endpoints.

```typescript
// types/api.ts

// GET /api/{user_id}/tasks
export interface GetTasksRequest {
  user_id: string
  filter?: 'all' | 'pending' | 'completed'  // Optional filter query param
}

export interface GetTasksResponse {
  tasks: Task[]                 // Array of Task objects
}

// POST /api/{user_id}/tasks
export interface CreateTaskRequest {
  user_id: string               // Path parameter
  title: string                 // Required
  description: string | null    // Optional
}

export interface CreateTaskResponse {
  task: Task                    // Newly created task
}

// GET /api/{user_id}/tasks/{id}
export interface GetTaskRequest {
  user_id: string
  task_id: number
}

export interface GetTaskResponse {
  task: Task
}

// PUT /api/{user_id}/tasks/{id}
export interface UpdateTaskRequest {
  user_id: string
  task_id: number
  title: string
  description: string | null
}

export interface UpdateTaskResponse {
  task: Task                    // Updated task
}

// DELETE /api/{user_id}/tasks/{id}
export interface DeleteTaskRequest {
  user_id: string
  task_id: number
}

export interface DeleteTaskResponse {
  message: string               // Success message (e.g., "Task deleted")
}

// PATCH /api/{user_id}/tasks/{id}/complete
export interface ToggleCompleteRequest {
  user_id: string
  task_id: number
}

export interface ToggleCompleteResponse {
  task: Task                    // Task with updated completed status
}
```

**Usage**:
- Type-safe API client functions
- Request/response validation
- Contract testing

---

### API Error Types

Standardized error responses from backend.

```typescript
// types/api.ts

export interface APIError {
  detail: string                // Error message (user-friendly)
  status: number                // HTTP status code
}

export type APIResponse<T> =
  | { success: true; data: T }
  | { success: false; error: APIError }
```

**Common Status Codes**:
- `200 OK`: Success
- `201 Created`: Resource created (POST)
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid/expired JWT
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

**Usage**:
- Error handling in API client
- Display user-friendly error messages
- Redirect to /signin on 401

---

## 4. UI State Types

### FilterState

Current task filter selection.

```typescript
// types/ui.ts

export type FilterType = 'all' | 'pending' | 'completed'

export interface FilterState {
  current: FilterType           // Currently active filter
}
```

**Usage**:
- FilterButtons component
- Task list filtering logic
- URL query parameter sync (optional)

---

### ModalState

Tracks which modal/dialog is currently open.

```typescript
// types/ui.ts

export type ModalType = 'create' | 'edit' | 'delete' | null

export interface ModalState {
  open: ModalType               // Which modal is open (null if closed)
  taskId?: number               // Task ID for edit/delete modals
}
```

**Usage**:
- Modal open/close logic
- Conditional rendering of modals
- Pre-populate edit form with task data

---

### LoadingState

Tracks API call in-progress states.

```typescript
// types/ui.ts

export interface LoadingState {
  fetching: boolean             // Loading task list
  creating: boolean             // Creating new task
  updating: boolean             // Updating task
  deleting: boolean             // Deleting task
  toggling: Record<number, boolean>  // Toggling completion (per task ID)
}
```

**Usage**:
- Display loading spinners
- Disable buttons during API calls
- Prevent double-submission

---

### ToastState

Success/error notification messages.

```typescript
// types/ui.ts

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string                    // Unique ID (for dismissal)
  type: ToastType
  message: string               // User-friendly message
  duration?: number             // Auto-dismiss duration in ms (default: 3000)
}

export interface ToastState {
  messages: ToastMessage[]      // Array of active toasts
}
```

**Usage**:
- Display success messages ("Task created")
- Display error messages ("Failed to delete task")
- Auto-dismiss after duration

---

## 5. Component Props Types

### TaskList Props

```typescript
// components/tasks/TaskList.tsx

export interface TaskListProps {
  tasks: Task[]                 // Filtered task array
  filter: FilterType            // Current filter
  onFilterChange: (filter: FilterType) => void
  onToggle: (taskId: number) => Promise<void>
  onEdit: (taskId: number) => void
  onDelete: (taskId: number) => void
  loading: boolean              // Is task list loading?
}
```

---

### TaskItem Props

```typescript
// components/tasks/TaskItem.tsx

export interface TaskItemProps {
  task: Task                    // Task to display
  onToggle: (taskId: number) => Promise<void>
  onEdit: (taskId: number) => void
  onDelete: (taskId: number) => void
  disabled: boolean             // Disable interactions during loading
}
```

---

### TaskForm Props

```typescript
// components/tasks/TaskForm.tsx

export interface TaskFormProps {
  mode: 'create' | 'edit'       // Form mode
  initialData?: TaskFormData    // Pre-populate for edit mode
  onSubmit: (data: TaskFormData) => Promise<void>
  onCancel: () => void
  loading: boolean              // Submit in progress
}
```

---

### FilterButtons Props

```typescript
// components/tasks/FilterButtons.tsx

export interface FilterButtonsProps {
  current: FilterType           // Currently active filter
  onChange: (filter: FilterType) => void
  taskCounts: {                 // Task counts for each filter
    all: number
    pending: number
    completed: number
  }
}
```

---

## 6. Utility Types

### Date Formatting

```typescript
// lib/utils.ts

/**
 * Format ISO 8601 timestamp to user-friendly date
 * Example: "2026-01-15T10:30:00Z" → "Jan 15, 2026"
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format ISO 8601 timestamp to relative time
 * Example: "2026-01-14T10:30:00Z" → "1 day ago"
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 60) return `${diffMins} minutes ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hours ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} days ago`
}
```

---

## 7. Context API State (Global State)

### TaskContext

Global state for task list management.

```typescript
// lib/contexts/TaskContext.tsx

export interface TaskContextValue {
  tasks: Task[]                 // All tasks for current user
  filter: FilterType            // Current filter
  loading: LoadingState         // Loading states
  error: string | null          // Global error message

  // Actions
  fetchTasks: () => Promise<void>
  createTask: (data: TaskFormData) => Promise<void>
  updateTask: (taskId: number, data: TaskFormData) => Promise<void>
  deleteTask: (taskId: number) => Promise<void>
  toggleComplete: (taskId: number) => Promise<void>
  setFilter: (filter: FilterType) => void
}
```

**Usage**:
- Provide global task state to component tree
- Centralize API call logic
- Share state between TaskList, TaskForm, FilterButtons

---

### AuthContext

Global state for authentication (Better Auth integration).

```typescript
// lib/contexts/AuthContext.tsx

export interface AuthContextValue {
  user: User | null             // Current authenticated user (null if not signed in)
  loading: boolean              // Is auth status being checked?
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}
```

**Usage**:
- Check if user is authenticated
- Redirect to /signin if not authenticated
- Display user email in navigation

---

## Summary

This data model provides:

1. **Type Safety**: All entities, forms, and API calls are strongly typed
2. **Validation**: Zod schemas ensure data integrity before API submission
3. **Separation of Concerns**: Domain entities separate from UI state
4. **API Contracts**: Frontend types match backend Pydantic models
5. **Reusability**: Component props types enable reusable, testable components

**Key Files**:
- `types/task.ts`: Task entity, form data, API contracts
- `types/auth.ts`: User entity, auth form data
- `types/api.ts`: API request/response types, error types
- `types/ui.ts`: UI state types (filter, modal, loading, toast)
- `lib/validation/`: Zod validation schemas
- `lib/contexts/`: Context API state management

**Next Steps**: Generate API client functions in `lib/api/` using these types.
