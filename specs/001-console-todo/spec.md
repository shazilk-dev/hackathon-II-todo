# Feature Specification: Phase 1 Console Todo App

**Feature Branch**: `001-console-todo`
**Created**: 2026-01-10
**Status**: Draft
**Input**: User description: "Create specification for 'phase1-console-todo' feature with 5 core user stories: ADD, VIEW, UPDATE, DELETE, and MARK tasks. Tasks stored in memory only (no persistence)."

## Clarifications

### Session 2026-01-10

- Q: How should users interact with the todo app? → A: Menu-driven: Show numbered menu (1=Add, 2=View, etc.), user selects by number, then prompted for details
- Q: Should the system allow multiple tasks with the same title? → A: Allow duplicates - Users can create multiple tasks with identical titles
- Q: How should the creation date be displayed in the task list? → A: Relative format - Human-friendly like "2 hours ago", "3 days ago", "just now"
- Q: How should task descriptions be displayed when viewing the task list? → A: Show on demand - List shows only title/status/date; separate detail view for full description
- Q: What should happen when a user enters an invalid menu selection? → A: Show error and re-prompt - Display "Invalid selection" message and show menu again

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Tasks (Priority: P1)

As a user, I can add a task with a title and optional description so that I can track things I need to do.

**Why this priority**: Core functionality - users cannot use a todo app without being able to create tasks. This is the foundational capability that enables all other features.

**Independent Test**: Can be fully tested by launching the app, adding a task with title "Buy groceries", and verifying it was created. Delivers immediate value as users can start tracking tasks.

**Acceptance Scenarios**:

1. **Given** the app is running, **When** I provide a title "Complete project report", **Then** a new task is created with that title
2. **Given** the app is running, **When** I provide a title "Call dentist" and description "Schedule cleaning appointment for next month", **Then** a new task is created with both title and description
3. **Given** the app is running, **When** I try to add a task with an empty title, **Then** the system rejects it and displays an error message
4. **Given** the app is running, **When** I try to add a task with a title exceeding 200 characters, **Then** the system rejects it and displays an error message
5. **Given** the app is running, **When** I try to add a task with a description exceeding 1000 characters, **Then** the system rejects it and displays an error message

---

### User Story 2 - View Tasks (Priority: P2)

As a user, I can view all my tasks in a numbered list so that I can see what I need to do and track my progress.

**Why this priority**: Second most critical - users need to see their tasks to know what to work on. Without viewing capability, adding tasks provides no value.

**Independent Test**: Can be fully tested by adding 3 tasks and verifying they display in a numbered list showing task number, title, completion status, and creation date. Delivers value by enabling users to review their task inventory.

**Acceptance Scenarios**:

1. **Given** I have no tasks, **When** I view the task list, **Then** I see a message indicating the list is empty
2. **Given** I have 3 tasks, **When** I view the task list, **Then** I see all 3 tasks displayed with numbers (1, 2, 3)
3. **Given** I have tasks with different completion statuses, **When** I view the task list, **Then** each task shows either ✓ (complete) or ✗ (incomplete)
4. **Given** I have multiple tasks, **When** I view the task list, **Then** each task displays its title and creation date in relative format (e.g., "2 hours ago", "just now")
5. **Given** I have a task with a description, **When** I request to view that task's details by number, **Then** the full task information including description is displayed

---

### User Story 3 - Mark Tasks Complete/Incomplete (Priority: P3)

As a user, I can mark a task as complete or incomplete by its number so that I can track what I've finished and what still needs attention.

**Why this priority**: Essential for task tracking workflow - users need to update task status to reflect progress. This enables the core "check off" behavior expected in todo apps.

**Independent Test**: Can be fully tested by adding a task, marking it complete by number, verifying status shows ✓, then toggling back to incomplete and verifying status shows ✗. Delivers value by enabling progress tracking.

**Acceptance Scenarios**:

1. **Given** I have an incomplete task at position 1, **When** I mark task 1 as complete, **Then** its status changes to ✓ and I see a confirmation message
2. **Given** I have a complete task at position 2, **When** I mark task 2 as incomplete, **Then** its status changes to ✗ and I see a confirmation message
3. **Given** I have 5 tasks, **When** I try to mark task number 10, **Then** the system displays an error indicating that task number doesn't exist
4. **Given** I have tasks, **When** I try to mark a task with an invalid number (negative, zero, or non-numeric), **Then** the system displays an error about invalid task number

---

### User Story 4 - Update Tasks (Priority: P4)

As a user, I can update a task's title or description by its number so that I can correct mistakes or refine task details as my understanding evolves.

**Why this priority**: Important for task management flexibility - users often need to modify task details after creation. However, users can work around this by deleting and re-adding tasks if needed.

**Independent Test**: Can be fully tested by adding a task, updating its title from "Buy milk" to "Buy almond milk", and verifying the change is reflected. Delivers value by enabling task refinement without deletion/recreation.

**Acceptance Scenarios**:

1. **Given** I have a task at position 1 with title "Old title", **When** I update task 1's title to "New title", **Then** the task title changes and I see a confirmation message
2. **Given** I have a task at position 2 with description "Old description", **When** I update task 2's description to "New description", **Then** the task description changes and I see a confirmation message
3. **Given** I have a task at position 3, **When** I update both its title and description, **Then** both fields change and I see a confirmation message
4. **Given** I have 5 tasks, **When** I try to update task number 10, **Then** the system displays an error indicating that task number doesn't exist
5. **Given** I'm updating a task, **When** I provide a title exceeding 200 characters, **Then** the system rejects it and displays an error message
6. **Given** I'm updating a task, **When** I provide an empty title, **Then** the system rejects it and displays an error message

---

### User Story 5 - Delete Tasks (Priority: P5)

As a user, I can delete a task by its number so that I can remove tasks that are no longer relevant or were added by mistake.

**Why this priority**: Useful for task management hygiene but least critical - users can simply leave irrelevant tasks unmarked or mark them complete. Deletion is a convenience feature.

**Independent Test**: Can be fully tested by adding 3 tasks, deleting task 2, verifying it's removed and remaining tasks are renumbered. Delivers value by enabling task list cleanup.

**Acceptance Scenarios**:

1. **Given** I have a task at position 2, **When** I request to delete task 2, **Then** the system asks for confirmation
2. **Given** the system asks for deletion confirmation, **When** I confirm, **Then** the task is deleted and I see a success message
3. **Given** the system asks for deletion confirmation, **When** I cancel, **Then** the task is NOT deleted and remains in the list
4. **Given** I have 5 tasks, **When** I try to delete task number 10, **Then** the system displays an error indicating that task number doesn't exist
5. **Given** I delete a task from the middle of the list, **When** I view the task list, **Then** the remaining tasks are renumbered sequentially

---

### Edge Cases

- What happens when the user provides a task number of 0, negative number, or non-numeric value? (System displays error: "Invalid task number")
- What happens when the user tries to operate on a task number that doesn't exist? (System displays error: "Task not found")
- What happens when the user provides input with leading/trailing whitespace? (System trims whitespace from title and description)
- What happens when the task list is empty and user tries to view/update/delete/mark tasks? (View shows "No tasks", other operations show "No tasks to operate on")
- What happens when the user adds many tasks (e.g., 100+)? (System handles gracefully with pagination or scrolling if needed)
- What happens when the user provides special characters in title/description? (System accepts all printable characters)
- What happens when confirmation is requested but user provides invalid input? (System re-prompts for valid yes/no response)
- What happens when the user creates multiple tasks with the same title? (System allows duplicates; tasks remain distinguishable by number)
- What happens when the user enters an invalid menu selection? (System displays "Invalid selection" error and re-displays menu)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept task creation with a required title (1-200 characters) and optional description (max 1000 characters)
- **FR-002**: System MUST validate title length (1-200 chars) and reject empty or oversized titles with clear error messages
- **FR-003**: System MUST validate description length (max 1000 chars) and reject oversized descriptions with clear error messages
- **FR-004**: System MUST display all tasks in a numbered list format showing: number, title, completion status (✓ or ✗), and creation date in relative format (e.g., "just now", "2 hours ago", "3 days ago") without descriptions
- **FR-005**: System MUST provide a detail view that displays full task information (number, title, description, status, creation date) when user requests details for a specific task number
- **FR-006**: System MUST allow users to update task title, description, or both by specifying the task number
- **FR-007**: System MUST allow users to toggle task completion status by specifying the task number
- **FR-008**: System MUST display the new status after marking a task complete/incomplete
- **FR-009**: System MUST request confirmation before deleting a task
- **FR-010**: System MUST only delete the task if the user confirms the deletion request
- **FR-011**: System MUST display appropriate error messages when users provide invalid task numbers (non-existent, negative, zero, non-numeric)
- **FR-012**: System MUST renumber remaining tasks sequentially after a deletion
- **FR-013**: System MUST store all tasks in memory during the application session
- **FR-014**: System MUST clear all tasks when the application terminates (no persistence)
- **FR-015**: System MUST trim leading and trailing whitespace from title and description inputs
- **FR-016**: System MUST display a meaningful message when the task list is empty
- **FR-017**: System MUST display a numbered menu of available actions (Add, View, View Detail, Update, Delete, Mark, Exit) and prompt user to select by number
- **FR-018**: System MUST re-display the menu after each operation completes, allowing continuous task management until user exits
- **FR-019**: System MUST format creation dates as relative time (e.g., "just now" for <1 min, "X minutes ago", "X hours ago", "X days ago") for human-friendly display
- **FR-020**: System MUST display an "Invalid selection" error message and re-display the menu when user enters an invalid menu option

### Assumptions

- **A-001**: Application runs in a console/terminal environment with text-based interaction
- **A-002**: User interacts via menu-driven interface: numbered menu options, user selects by number, then system prompts for operation-specific details
- **A-003**: All text is UTF-8 encoded, supporting international characters
- **A-004**: Task creation date is captured automatically using system time
- **A-005**: Tasks are numbered starting from 1, incrementing sequentially
- **A-006**: When viewing tasks, all fields fit within standard terminal width (80+ columns) or wrap gracefully
- **A-007**: Confirmation prompts accept common affirmative/negative responses (yes/no, y/n, case-insensitive)
- **A-008**: Each application session starts with an empty task list (no persistence across sessions)

### Key Entities

- **Task**: Represents a todo item with attributes:
  - Number (integer, auto-assigned, sequential starting from 1, unique identifier for each task)
  - Title (string, 1-200 characters, required, duplicate titles allowed)
  - Description (string, 0-1000 characters, optional)
  - Status (boolean: complete/incomplete, defaults to incomplete)
  - Creation Date (timestamp, auto-captured on creation)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new task with title and description in under 15 seconds
- **SC-002**: Users can view their complete task list instantly (under 1 second for lists up to 100 tasks)
- **SC-003**: Users can mark a task complete or incomplete in under 10 seconds
- **SC-004**: Users can update task details in under 20 seconds
- **SC-005**: Users can delete a task (including confirmation) in under 15 seconds
- **SC-006**: System correctly handles edge cases (invalid numbers, empty list, boundary values) without crashing
- **SC-007**: 100% of validation errors display clear, actionable error messages guiding user correction
- **SC-008**: Users can successfully complete all 5 core operations (add, view, update, delete, mark) on first attempt without documentation
- **SC-009**: Task list remains accurate after any sequence of operations (adds, updates, deletes, status changes)
- **SC-010**: Application maintains stable performance with task lists up to 100 items

### Quality Criteria

- All error messages are user-friendly and explain what went wrong and how to fix it
- Task numbering remains consistent and sequential after all operations
- Confirmation prompts are clear and prevent accidental data loss
- Console output is readable, well-formatted, and appropriately aligned
- Application gracefully handles unexpected input without crashing
