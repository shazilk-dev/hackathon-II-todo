# Feature Specification: Task CRUD (Web Interface)

**Feature Branch**: `006-task-crud`
**Created**: 2026-01-12
**Status**: Draft
**Input**: User description: "Create specification for Task CRUD feature in Phase 2. Feature: Web-based Task Management. User Stories: 1. As a user, I can view all my tasks in a list. 2. As a user, I can add a new task with title and description. 3. As a user, I can edit an existing task. 4. As a user, I can delete a task. 5. As a user, I can mark a task as complete/incomplete. API Requirements: GET /api/{user_id}/tasks (list with filters), POST /api/{user_id}/tasks (create), GET /api/{user_id}/tasks/{id} (get single), PUT /api/{user_id}/tasks/{id} (update), DELETE /api/{user_id}/tasks/{id} (delete), PATCH /api/{user_id}/tasks/{id}/complete (toggle). All endpoints require JWT authentication. User can only access their own tasks (user_id must match JWT). Database Schema: tasks table with id, user_id, title, description, completed, created_at, updated_at."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Task List with Filtering (Priority: P1)

As an authenticated user, I can view all my tasks in a list with the ability to filter by completion status (all, pending, completed) so that I can see my todo items and track what's done.

**Why this priority**: Viewing tasks is the core functionality of a todo app. Users must be able to see their tasks before they can interact with them. This is the primary read operation and the landing page experience after sign-in. Without this, the app is non-functional.

**Independent Test**: Can be fully tested by signing in, navigating to /tasks page, and verifying tasks are displayed in a list with task titles, completion checkboxes, and filter buttons. Clicking filters updates the visible tasks. Delivers task viewing and filtering functionality.

**Acceptance Scenarios**:

1. **Given** I am signed in with 5 tasks (3 pending, 2 completed), **When** I navigate to /tasks page, **Then** I see all 5 tasks displayed in a list sorted by creation date (newest first)
2. **Given** I am on the /tasks page with multiple tasks, **When** I click "Pending" filter button, **Then** only incomplete tasks are displayed (completed=false)
3. **Given** I am on the /tasks page, **When** I click "Completed" filter button, **Then** only completed tasks are displayed (completed=true)
4. **Given** I am on the /tasks page with filter active, **When** I click "All" filter button, **Then** all tasks are displayed regardless of completion status
5. **Given** I have 0 tasks, **When** I visit /tasks page, **Then** I see an empty state message "No tasks yet. Create your first task to get started!"
6. **Given** I am signed in, **When** I navigate to /tasks, **Then** the page makes API call GET /api/{user_id}/tasks with my JWT token in Authorization header
7. **Given** my JWT token is expired, **When** I navigate to /tasks, **Then** I am redirected to /auth/signin with message "Session expired, please sign in again"
8. **Given** I filter to "Pending" with 3 pending tasks, **When** tasks load, **Then** the task count shows "3 tasks" and the Pending button is highlighted/active
9. **Given** I have tasks with long titles (150+ characters), **When** displayed in the list, **Then** titles are shown in full or with "Read more" expansion (UX decision)
10. **Given** I have tasks created at different times, **When** the list loads, **Then** tasks are sorted by created_at descending (newest first) by default

---

### User Story 2 - Create New Task (Priority: P1)

As an authenticated user, I can add a new task by clicking an "Add Task" button, filling in a form with title and optional description, and submitting to create the task in the list.

**Why this priority**: Creating tasks is equally critical to viewing them. Without the ability to add tasks, users cannot populate their list. This is the primary write operation and essential for app utility.

**Independent Test**: Can be fully tested by clicking "Add Task" button, filling in title (required) and description (optional), submitting the form, and verifying the new task appears in the list with a success message. Delivers task creation functionality.

**Acceptance Scenarios**:

1. **Given** I am on /tasks page, **When** I click "Add Task" button, **Then** a modal/form opens with fields for title (required) and description (optional)
2. **Given** the task creation form is open, **When** I enter title "Buy groceries" and description "Milk, eggs, bread", **Then** both fields display my input
3. **Given** I have filled in valid title and description, **When** I click "Create Task" submit button, **Then** API call POST /api/{user_id}/tasks is made with { title, description } in body
4. **Given** the task creation API call succeeds (201), **When** the response is received, **Then** the new task appears at the top of the task list (newest first) and form/modal closes
5. **Given** I try to submit the form without title, **When** I click submit, **Then** I see client-side validation error "Title is required" and form does not submit
6. **Given** I enter a title exceeding 200 characters, **When** I try to submit, **Then** I see validation error "Title must be 200 characters or less" and form does not submit
7. **Given** the API returns 400 error (validation failure), **When** the error is received, **Then** I see error message "Failed to create task" and form remains open for correction
8. **Given** the API returns 401 (expired token), **When** the error is received, **Then** I am redirected to /auth/signin with message "Session expired"
9. **Given** I submit the form with only title (no description), **When** the task is created, **Then** it appears in the list with no description shown
10. **Given** I click "Cancel" button in the form, **When** clicked, **Then** the form/modal closes without creating a task and inputs are cleared

---

### User Story 3 - Mark Task Complete/Incomplete (Priority: P1)

As an authenticated user, I can toggle a task's completion status by clicking a checkbox next to the task so that I can track which tasks are done.

**Why this priority**: Marking tasks complete is the defining feature of a todo app. Without this, it's just a list with no status tracking. This is what differentiates a todo app from a simple notes app. P1 because it's core to the value proposition.

**Independent Test**: Can be fully tested by clicking the checkbox next to a pending task, verifying it becomes checked and the task is visually marked as complete (strikethrough, different color), clicking again to uncheck, and verifying it returns to pending state. Delivers task completion tracking.

**Acceptance Scenarios**:

1. **Given** I have a pending task in the list, **When** I click the checkbox next to it, **Then** API call PATCH /api/{user_id}/tasks/{id}/complete is made
2. **Given** the PATCH API call succeeds, **When** the response is received, **Then** the checkbox becomes checked and the task text shows strikethrough styling (or other completed visual state)
3. **Given** I have a completed task (checked), **When** I click the checkbox again, **Then** the task toggles back to pending (unchecked, no strikethrough)
4. **Given** I toggle a task's completion, **When** the update completes, **Then** the task count updates if filtered (e.g., "Pending" count decreases by 1)
5. **Given** I toggle a task while "Pending" filter is active, **When** the task becomes completed, **Then** it disappears from the list (filtered out) with smooth animation
6. **Given** I toggle a task while "Completed" filter is active, **When** the task becomes pending, **Then** it disappears from the list (filtered out)
7. **Given** I toggle a task while "All" filter is active, **When** the toggle completes, **Then** the task remains visible but visual state changes (strikethrough on/off)
8. **Given** the API call fails (401 expired token), **When** the error occurs, **Then** the checkbox reverts to previous state and I'm redirected to sign-in
9. **Given** I rapidly click the checkbox multiple times, **When** clicks occur, **Then** only the latest state is submitted (debounced or disabled during API call)

---

### User Story 4 - Edit Task Details (Priority: P2)

As an authenticated user, I can edit a task's title and description by clicking an "Edit" button, modifying the fields in a form, and saving the changes.

**Why this priority**: Editing tasks is important for maintaining an accurate list, but users can work around it by deleting and recreating tasks. It's P2 because the core create/read/complete flow is functional without it, though it's a significant UX improvement.

**Independent Test**: Can be fully tested by clicking "Edit" button on a task, modifying title/description in a form, submitting, and verifying the task displays updated content. Delivers task editing functionality.

**Acceptance Scenarios**:

1. **Given** I have a task in the list, **When** I click the "Edit" icon/button next to it, **Then** an edit form/modal opens pre-populated with the task's current title and description
2. **Given** the edit form is open, **When** I modify the title to "Updated task title", **Then** the input reflects my changes
3. **Given** the edit form is open, **When** I modify the description to "Updated description", **Then** the textarea reflects my changes
4. **Given** I have made changes in the edit form, **When** I click "Save" button, **Then** API call PUT /api/{user_id}/tasks/{id} is made with { title, description } in body
5. **Given** the PUT API call succeeds (200), **When** the response is received, **Then** the task in the list displays the updated title and description, and form/modal closes
6. **Given** I try to submit edit form with empty title, **When** I click save, **Then** I see validation error "Title is required" and form does not submit
7. **Given** I try to submit with title exceeding 200 characters, **When** I click save, **Then** I see validation error "Title must be 200 characters or less"
8. **Given** the API returns 404 (task not found), **When** the error is received, **Then** I see error message "Task not found" and the form closes
9. **Given** I click "Cancel" in the edit form, **When** clicked, **Then** the form closes without saving changes
10. **Given** I edit a task, **When** the update completes, **Then** the task's updated_at timestamp is updated (visible if displayed in UI)

---

### User Story 5 - Delete Task (Priority: P2)

As an authenticated user, I can delete a task by clicking a "Delete" button and confirming the deletion so that I can remove tasks I no longer need.

**Why this priority**: Deleting tasks is useful for list maintenance, but the core value (creating, viewing, completing tasks) works without it. Users can tolerate accumulating completed tasks temporarily. P2 balances functionality with MVP focus.

**Independent Test**: Can be fully tested by clicking "Delete" button on a task, confirming in a confirmation dialog, and verifying the task is removed from the list with a success message. Delivers task deletion functionality.

**Acceptance Scenarios**:

1. **Given** I have a task in the list, **When** I click the "Delete" icon/button next to it, **Then** a confirmation dialog appears asking "Are you sure you want to delete this task?"
2. **Given** the delete confirmation dialog is open, **When** I click "Confirm" or "Delete" button, **Then** API call DELETE /api/{user_id}/tasks/{id} is made
3. **Given** the DELETE API call succeeds (200), **When** the response is received, **Then** the task is removed from the list with a fade-out animation and success toast "Task deleted"
4. **Given** the delete confirmation dialog is open, **When** I click "Cancel" button, **Then** the dialog closes and the task remains in the list (no API call)
5. **Given** I delete a task while filtered to "Pending", **When** deletion completes, **Then** the task count updates (e.g., "3 tasks" → "2 tasks")
6. **Given** the API returns 404 (task already deleted), **When** the error is received, **Then** the task is removed from the UI anyway (idempotent) with message "Task already deleted"
7. **Given** the API returns 401 (expired token), **When** the error occurs, **Then** I am redirected to /auth/signin with message "Session expired"
8. **Given** I delete the last task in the list, **When** deletion completes, **Then** I see the empty state message "No tasks yet. Create your first task to get started!"

---

### Edge Cases

- **What happens when I navigate to /tasks without being signed in?** Next.js middleware checks for valid JWT in cookies. If missing or invalid, redirect to /auth/signin. Protected routes require authentication.

- **What happens when my JWT expires while I'm on the /tasks page?** On the next API call (e.g., toggle completion), the backend returns 401. Frontend intercepts this, displays "Session expired" message, and redirects to /auth/signin.

- **What happens when I create two tasks simultaneously (race condition)?** Each POST request is independent. Both tasks will be created. Frontend should disable submit button during API call to prevent accidental double-submission.

- **What happens when I have 1000+ tasks?** Current spec has no pagination. List will load all tasks (may be slow). If this becomes an issue, add pagination or infinite scroll. For MVP, acceptable if most users have <100 tasks.

- **What happens when I filter to "Pending" and complete the last pending task?** The task disappears from the list (filtered out). The count shows "0 tasks" and optionally an empty state message "No pending tasks. Great job!"

- **What happens if two browser tabs are open and I complete a task in one tab?** The other tab is not automatically updated (no real-time sync in MVP). Refreshing the page will show the updated state. Consider WebSocket or polling for real-time updates in future.

- **What happens when I try to edit a task that another session deleted?** PUT request returns 404. Frontend shows error message "Task not found" and removes the task from the UI (or refreshes the list).

- **What happens when the API is slow (>3 seconds)?** Frontend shows loading spinner. Consider adding timeout with error message "Request taking longer than expected. Please check your connection."

- **What happens when I'm offline?** API calls fail. Frontend should detect network errors and show "You're offline. Please check your connection." Consider implementing offline mode with local storage in future.

- **What happens when I delete a task and immediately try to edit it (race condition)?** Edit button should be disabled during delete API call. If somehow both fire, backend DELETE succeeds and PUT returns 404, resulting in task removed from UI.

- **What happens when task description is extremely long (10,000+ characters)?** Frontend should handle gracefully with scrollable text area or "Show more/less" toggle. No backend length limit (TEXT column).

- **What happens when I have special characters in title (emoji, unicode)?** React handles unicode correctly. Title should display emoji and international characters properly. Database stores UTF-8.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Application MUST provide a /tasks page accessible only to authenticated users (protected route)
- **FR-002**: /tasks page MUST display a list of all tasks belonging to the authenticated user
- **FR-003**: Each task in the list MUST show: checkbox (completion status), title, optional description, created date, and action buttons (edit, delete)
- **FR-004**: /tasks page MUST include filter buttons: "All", "Pending", "Completed" with active state highlighting
- **FR-005**: Filter buttons MUST update the task list to show only tasks matching the selected filter
- **FR-006**: Task list MUST be sorted by created_at descending (newest first) by default
- **FR-007**: /tasks page MUST include "Add Task" button that opens a task creation form
- **FR-008**: Task creation form MUST include fields: title (required, max 200 chars), description (optional, textarea)
- **FR-009**: Task creation form MUST validate title is not empty and does not exceed 200 characters before submission
- **FR-010**: Submitting task creation form MUST call POST /api/{user_id}/tasks with JWT authorization
- **FR-011**: Successful task creation MUST add the new task to the list and close the form
- **FR-012**: Each task MUST have a checkbox that toggles completion status on click
- **FR-013**: Clicking completion checkbox MUST call PATCH /api/{user_id}/tasks/{id}/complete with JWT authorization
- **FR-014**: Completed tasks MUST show visual distinction (e.g., strikethrough text, grayed out, checked box)
- **FR-015**: Toggling completion while filtered MUST update the visible list (task may disappear if filtered out)
- **FR-016**: Each task MUST have an "Edit" button/icon that opens an edit form pre-populated with current values
- **FR-017**: Edit form MUST allow modification of title and description with same validation as creation form
- **FR-018**: Submitting edit form MUST call PUT /api/{user_id}/tasks/{id} with JWT authorization
- **FR-019**: Successful task update MUST update the task in the list and close the edit form
- **FR-020**: Each task MUST have a "Delete" button/icon that opens a confirmation dialog
- **FR-021**: Confirmation dialog MUST require explicit user confirmation before deletion
- **FR-022**: Confirming deletion MUST call DELETE /api/{user_id}/tasks/{id} with JWT authorization
- **FR-023**: Successful deletion MUST remove the task from the list with animation
- **FR-024**: All API calls MUST include Authorization: Bearer <jwt_token> header (from HTTP-only cookie)
- **FR-025**: Application MUST handle 401 Unauthorized responses by redirecting to /auth/signin
- **FR-026**: Application MUST show loading states during API calls (spinners, skeleton screens, disabled buttons)
- **FR-027**: Application MUST show error messages for failed operations (API errors, validation errors)
- **FR-028**: Application MUST show success messages for completed operations (task created, updated, deleted)
- **FR-029**: Empty state (0 tasks) MUST show friendly message encouraging user to create first task
- **FR-030**: Application MUST be responsive and work on mobile devices (320px+) and desktop (1024px+)

### Key Entities

- **Task (Frontend Model)**: Represents a task in the UI state
  - Fields: id (number), user_id (string), title (string), description (string | null), completed (boolean), created_at (Date), updated_at (Date)
  - Source: API response (GET /api/{user_id}/tasks)
  - State Management: React state (useState) or Context API

- **TaskFormData**: Represents form input for creating/editing tasks
  - Fields: title (string), description (string)
  - Validation: title required, max 200 chars
  - Used by: Create form, Edit form

- **FilterState**: Represents current filter selection
  - Values: "all" | "pending" | "completed"
  - Default: "all"
  - State Management: URL query parameter or React state

- **UI States**: Represents various UI states
  - Loading: boolean (API call in progress)
  - Error: string | null (error message)
  - Success: string | null (success message for toasts)
  - ModalOpen: "create" | "edit" | "delete" | null (which modal is open)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their task list within 1 second of navigating to /tasks page (including API call)
- **SC-002**: Users can create a new task in under 30 seconds (open form, fill, submit, see result)
- **SC-003**: Users can toggle task completion with a single click and see visual feedback within 500ms
- **SC-004**: Users can edit a task in under 30 seconds (open form, modify, save, see result)
- **SC-005**: Users can delete a task in under 15 seconds (click delete, confirm, see removal)
- **SC-006**: Filtering tasks updates the list within 100ms (client-side filtering, no API call)
- **SC-007**: 95% of task operations (create, update, delete, toggle) succeed on first attempt (5% failure budget for network/server issues)
- **SC-008**: 100% of unauthenticated access attempts to /tasks redirect to sign-in page
- **SC-009**: 100% of expired token scenarios redirect to sign-in with appropriate message
- **SC-010**: All forms validate input 100% of the time before API submission (no invalid requests sent)
- **SC-011**: All API errors display user-friendly error messages (not raw error codes)
- **SC-012**: Task list displays correctly on mobile (320px width) and desktop (1920px width) without horizontal scroll

### User Experience Metrics

- **UX-001**: Loading states are visible during all API calls (no "frozen" UI perception)
- **UX-002**: Success messages appear as non-intrusive toasts that auto-dismiss after 3 seconds
- **UX-003**: Error messages are clear and actionable (e.g., "Title is required" not "Validation error")
- **UX-004**: Task creation form clears inputs after successful submission (ready for next task)
- **UX-005**: Delete confirmation prevents accidental deletions (explicit "Cancel" and "Delete" buttons)
- **UX-006**: Completed tasks are visually distinct from pending tasks (strikethrough, color change, or opacity)
- **UX-007**: Empty state provides clear next action ("Create your first task" button)
- **UX-008**: Mobile users can tap targets easily (minimum 44x44px tap targets per iOS guidelines)

### Functional Correctness

- **FUNC-001**: Creating a task adds it to the list with correct data (title, description, completed=false)
- **FUNC-002**: Toggling completion changes only the completed field (title/description unchanged)
- **FUNC-003**: Editing a task updates title/description without affecting completion status or timestamps (except updated_at)
- **FUNC-004**: Deleting a task removes it permanently (404 on subsequent operations)
- **FUNC-005**: Filtering to "Pending" shows only tasks with completed=false
- **FUNC-006**: Filtering to "Completed" shows only tasks with completed=true
- **FUNC-007**: Filtering to "All" shows all tasks regardless of completion status
- **FUNC-008**: Task count reflects the number of tasks in the current filtered view

## Technical Constraints

### Frontend Technology Stack
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript 5.7+ (strict mode)
- **UI Library**: React 19+ (server and client components)
- **Styling**: Tailwind CSS 4+
- **Forms**: React Hook Form + Zod validation (or native React state)
- **API Client**: Fetch API with custom wrapper (or axios)
- **State Management**: React Context API (or Zustand if needed)
- **Authentication**: Better Auth (provides JWT in HTTP-only cookies)

### Page Structure (App Router)
- **Route**: `/app/tasks/page.tsx` (protected route)
- **Layout**: `/app/layout.tsx` (shared layout with navigation)
- **Middleware**: `/middleware.ts` (checks JWT, redirects if unauthenticated)
- **Components**: `/components/TaskList.tsx`, `/components/TaskItem.tsx`, `/components/TaskForm.tsx`, `/components/FilterButtons.tsx`
- **API Client**: `/lib/api/tasks.ts` (API wrapper functions)
- **Types**: `/types/task.ts` (TypeScript interfaces)

### API Integration
- **Base URL**: Environment variable `NEXT_PUBLIC_API_URL` (http://localhost:8000 dev, https://api.yourapp.com prod)
- **Authentication**: JWT token automatically included via HTTP-only cookies (Better Auth handles this)
- **Error Handling**: Axios interceptor or fetch wrapper catches 401 (redirect to sign-in), displays user-friendly errors for 400/404/500
- **Request Format**: JSON (Content-Type: application/json)
- **Response Format**: JSON (parsed into TypeScript types)

### UI Components
- **TaskList**: Renders list of TaskItem components, handles filtering, shows empty state
- **TaskItem**: Displays single task with checkbox, title, description, edit/delete buttons
- **TaskForm**: Reusable form for create/edit, validates inputs, submits to API
- **FilterButtons**: Radio-style buttons for "All", "Pending", "Completed" filters
- **ConfirmDialog**: Reusable confirmation modal for delete action
- **Toast**: Notification component for success/error messages

### State Management
- **Task List**: useState or Context for storing tasks array
- **Filter**: useState for current filter ("all" | "pending" | "completed")
- **Modals**: useState for which modal is open (create, edit, delete)
- **Form Data**: useState or React Hook Form for form inputs
- **Loading**: useState for API call in progress states
- **Errors**: useState for error messages

### Validation Rules
- **Title**: Required, 1-200 characters, no empty string
- **Description**: Optional, no length limit (but practical limit for UX, e.g., 10,000 chars)
- **Client-side**: Validate before API call (prevent unnecessary network requests)
- **Server-side**: API also validates (security, don't trust client)

### Responsive Design
- **Mobile (<640px)**: Single column, stacked layout, full-width buttons
- **Tablet (640-1024px)**: Single column with more padding
- **Desktop (>1024px)**: Centered container (max-width: 1024px), multi-column if appropriate
- **Touch Targets**: Minimum 44x44px for mobile (iOS Human Interface Guidelines)

### Accessibility
- **Keyboard Navigation**: All interactive elements accessible via Tab/Enter/Space
- **Screen Readers**: Proper ARIA labels on buttons, form fields, checkboxes
- **Focus States**: Visible focus indicators on all interactive elements
- **Color Contrast**: WCAG AA compliance (4.5:1 for normal text)
- **Form Labels**: Explicit <label> elements for all inputs

## Non-Functional Requirements

- **Performance**: Initial page load <2 seconds, subsequent interactions <500ms
- **Usability**: Users can complete any task operation without instructions
- **Accessibility**: WCAG 2.1 AA compliance for keyboard navigation and screen readers
- **Responsiveness**: Works on all screen sizes from 320px to 2560px width
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge) - last 2 versions
- **Error Recovery**: Users can retry failed operations without data loss
- **Data Consistency**: UI always reflects server state (refresh after mutations)

## Out of Scope (Explicitly Not Included)

- **Real-time updates**: No WebSocket or polling (tasks don't auto-update across tabs/devices)
- **Offline mode**: No service worker or local storage cache
- **Drag-and-drop reordering**: Tasks sorted by created_at only (no manual ordering)
- **Bulk operations**: No multi-select, bulk delete, bulk complete
- **Task search**: No search bar or text filtering (only status filter)
- **Task categories/tags**: No categorization or labeling
- **Task priorities**: No priority levels (high, medium, low)
- **Task due dates**: No date pickers or deadline tracking
- **Task sharing**: No collaboration or sharing tasks with other users
- **Task history**: No audit log or undo functionality
- **Keyboard shortcuts**: No hotkeys (besides standard Tab/Enter navigation)
- **Dark mode**: Light mode only in MVP (can add later)
- **Pagination**: All tasks loaded at once (acceptable for <1000 tasks)
- **Infinite scroll**: All tasks displayed initially
- **Task templates**: No predefined task templates
- **Export/import**: No CSV or JSON export functionality

## Assumptions

- Users are already authenticated (Better Auth handles sign-up/sign-in)
- JWT is stored in HTTP-only cookie and automatically included in API requests
- Backend API (005-api-endpoints) is implemented and accessible
- Database schema (004-database-schema) is deployed and populated
- Better Auth provides user_id that matches database user_id
- CORS is configured to allow Next.js frontend origin
- Users have stable internet connection (no offline support)
- Most users will have <100 tasks (no pagination needed)
- Tasks are personal (no sharing, so no permission checks beyond user_id match)
- Timestamps from API are in ISO 8601 format and can be parsed to Date objects
- All API responses follow documented contracts (TypeScript interfaces)

## Dependencies

- **Next.js 16+**: App Router, middleware for auth checks
- **React 19+**: Component library, hooks (useState, useEffect)
- **TypeScript 5.7+**: Type safety, interfaces for API contracts
- **Tailwind CSS 4+**: Utility-first CSS for styling
- **Better Auth**: Provides JWT in HTTP-only cookies
- **Backend API (005-api-endpoints)**: All task CRUD operations
- **Database (004-database-schema)**: tasks table with user_id foreign key
- **React Hook Form (optional)**: Form state management and validation
- **Zod (optional)**: Schema validation for forms
- **Axios or Fetch API**: HTTP client for API calls

## UI/UX Design (High-Level)

### Layout Structure

```
┌─────────────────────────────────────────┐
│ Header (Logo, User Menu, Sign Out)     │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Filter Buttons: [All] [Pending] │   │
│  │ [Completed]   [+ Add Task]      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ☐ Task title                    │   │
│  │   Description preview           │   │
│  │   [Edit] [Delete]               │   │
│  ├─────────────────────────────────┤   │
│  │ ☑ Completed task (strikethrough)│   │
│  │   Description preview           │   │
│  │   [Edit] [Delete]               │   │
│  ├─────────────────────────────────┤   │
│  │ ... more tasks ...              │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Task Item Design
- **Checkbox**: Left-aligned, large tap target (44x44px), toggles completion
- **Title**: Bold text, strikethrough if completed, truncate if >100 chars with "..."
- **Description**: Lighter text, optional, truncate to 2 lines with "Show more"
- **Actions**: Edit (pencil icon), Delete (trash icon), right-aligned or revealed on hover
- **Visual States**: Hover (background change), Completed (strikethrough + opacity), Loading (disabled)

### Modal/Form Design
- **Create/Edit Modal**: Centered overlay, dimmed background, close on Esc or overlay click
- **Title Input**: Single-line text input, shows character count "150/200"
- **Description Input**: Multi-line textarea, auto-resize or fixed height with scroll
- **Buttons**: Primary "Save"/"Create" (colored), Secondary "Cancel" (outlined)
- **Validation Errors**: Red text below input, icon indicator

### Filter Buttons
- **Style**: Radio-button style (only one active), rounded pills or tabs
- **Active State**: Highlighted background color, bold text
- **Count**: Optional count badge "Pending (5)"

### Empty State
- **Icon**: Large illustration or icon (e.g., empty checkbox)
- **Message**: "No tasks yet. Create your first task to get started!"
- **Action**: "Add Task" button prominently displayed

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| API slow response (>3s) | Medium - poor UX | Medium | Show loading spinner, timeout at 10s with error message, optimize backend queries |
| User creates 1000+ tasks | Medium - performance degradation | Low | Monitor usage, add pagination if users frequently exceed 100 tasks |
| JWT expires during session | Medium - user disruption | Medium | Handle 401 gracefully with redirect to sign-in, consider token refresh flow |
| Network errors during API call | Medium - operation fails | Medium | Retry logic (1-2 retries), clear error messages, allow user to retry manually |
| Accidental task deletion | Low - data loss | Medium | Require confirmation dialog, consider "undo" toast (future), educate users |
| Multiple tabs/devices not synced | Low - confusion | High | Acceptable for MVP, document limitation, add real-time updates in future |
| Form validation mismatch (client vs server) | Low - validation error after submit | Low | Keep validation rules in sync, test both sides, handle 400 errors gracefully |
| Long task titles/descriptions break layout | Low - UI broken | Medium | CSS truncation with "Show more", word-break for long words, test with extreme inputs |
| Mobile usability issues (tap targets too small) | Medium - poor mobile UX | Low | Follow iOS 44x44px guideline, test on real devices, use touch-friendly spacing |

## Acceptance Checklist

Before considering this feature complete, verify:

- [ ] /tasks page is protected (redirects unauthenticated users to /auth/signin)
- [ ] Task list displays all user's tasks sorted by created_at descending
- [ ] Filter buttons (All, Pending, Completed) work correctly
- [ ] Active filter button is visually highlighted
- [ ] Task count updates when filter changes
- [ ] "Add Task" button opens creation form
- [ ] Task creation form validates title (required, max 200 chars)
- [ ] Submitting creation form calls POST API and adds task to list
- [ ] Success message shows after task creation
- [ ] Form closes and clears after successful creation
- [ ] Checkbox toggles task completion with PATCH API call
- [ ] Completed tasks show visual distinction (strikethrough/color)
- [ ] Toggling completion updates task count if filtered
- [ ] "Edit" button opens edit form pre-populated with task data
- [ ] Edit form validates and submits PUT API call
- [ ] Successful edit updates task in list
- [ ] "Delete" button shows confirmation dialog
- [ ] Confirming delete calls DELETE API and removes task from list
- [ ] Empty state shows when no tasks exist
- [ ] Loading states display during API calls
- [ ] Error messages display for failed operations
- [ ] 401 errors redirect to sign-in page
- [ ] Page is responsive on mobile (320px) and desktop (1920px)
- [ ] All interactive elements have 44x44px tap targets on mobile
- [ ] All forms have proper labels and ARIA attributes
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] TypeScript types match API contracts (no type errors)
- [ ] All API calls include JWT authorization header

## Integration Points

This feature integrates with:

1. **003-authentication**: Requires authenticated user with valid JWT
2. **004-database-schema**: Reads/writes to tasks table via API
3. **005-api-endpoints**: Uses all 6 task endpoints (GET list, POST, GET single, PUT, DELETE, PATCH)

Integration must be verified during planning and implementation phases.
