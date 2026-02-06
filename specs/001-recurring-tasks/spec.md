# Feature Specification: Recurring Tasks

**Feature Branch**: `001-recurring-tasks`
**Created**: 2026-02-03
**Status**: Draft
**Input**: User description: "Feature: Recurring Tasks

Description:
Implement recurring tasks that automatically create the next occurrence when marked
complete. Users can set recurrence patterns (daily, weekly, monthly) and the system
auto-generates new tasks with adjusted due dates.

Acceptance Criteria:
1. Users can create tasks with recurrence patterns: daily, weekly, monthly
2. When a recurring task is completed, a Kafka event is published
3. A background service consumes the event and creates the next occurrence
4. Next task due date is calculated based on recurrence pattern
5. Original task remains in history, new task is created as separate entity
6. Users can stop recurrence by updating the task

Technical Approach:
- Add recurrence_pattern field to Task model (enum: NONE, DAILY, WEEKLY, MONTHLY)
- Publish "task.completed" event to Kafka when task is marked done
- Create RecurringTaskService to consume events and create next occurrence
- Use Dapr Pub/Sub for event streaming
- Store recurrence metadata in task description or separate field"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Up Daily Recurring Task (Priority: P1)

A user wants to create a task that repeats every day (e.g., "Take vitamins", "Check emails", "Daily standup"). When they complete today's task, tomorrow's task is automatically created with an updated due date.

**Why this priority**: This is the most fundamental recurring task pattern and delivers immediate value. Users can see the recurring task system working with the simplest pattern, providing a complete MVP experience.

**Independent Test**: Can be fully tested by creating a task with daily recurrence, marking it complete, and verifying a new task is created with tomorrow's due date. Delivers value of never forgetting daily habits.

**Acceptance Scenarios**:

1. **Given** a user is creating a new task, **When** they set the recurrence pattern to "Daily" and save, **Then** the task is created with daily recurrence enabled
2. **Given** a user has a daily recurring task with a due date, **When** they mark it as complete, **Then** a new task is created with the same title, description, and priority, but with the due date set to tomorrow
3. **Given** a user has completed a daily recurring task, **When** they view their task list, **Then** they see both the completed original task and the new recurring task
4. **Given** a user has a daily recurring task without a due date, **When** they mark it as complete, **Then** a new task is created immediately with today's date as the creation date

---

### User Story 2 - Set Up Weekly Recurring Task (Priority: P2)

A user wants to create a task that repeats every week (e.g., "Team meeting", "Grocery shopping", "Backup data"). When they complete this week's task, next week's task is automatically created.

**Why this priority**: Weekly recurrence is the second most common pattern and builds on the daily implementation. It can be developed and tested independently after daily recurrence works.

**Independent Test**: Can be fully tested by creating a task with weekly recurrence, marking it complete, and verifying a new task is created with a due date 7 days later.

**Acceptance Scenarios**:

1. **Given** a user is creating a new task, **When** they set the recurrence pattern to "Weekly" and save, **Then** the task is created with weekly recurrence enabled
2. **Given** a user has a weekly recurring task with a due date, **When** they mark it as complete, **Then** a new task is created with the due date set to 7 days after the original due date
3. **Given** a user completes a weekly task on Monday that was due on Friday, **When** the new task is created, **Then** the new due date is the following Friday (7 days from original due date, not completion date)

---

### User Story 3 - Set Up Monthly Recurring Task (Priority: P3)

A user wants to create a task that repeats every month (e.g., "Pay rent", "Submit timesheet", "Review budget"). When they complete this month's task, next month's task is automatically created.

**Why this priority**: Monthly recurrence is less common but still valuable. It can be developed independently after the other patterns are working.

**Independent Test**: Can be fully tested by creating a task with monthly recurrence, marking it complete, and verifying a new task is created with a due date 1 month later.

**Acceptance Scenarios**:

1. **Given** a user is creating a new task, **When** they set the recurrence pattern to "Monthly" and save, **Then** the task is created with monthly recurrence enabled
2. **Given** a user has a monthly recurring task due on the 15th, **When** they mark it as complete, **Then** a new task is created with the due date set to the 15th of the next month
3. **Given** a user has a monthly task due on January 31st, **When** they mark it as complete in a month with fewer days (e.g., February), **Then** the new task is created with the due date set to the last day of that month (e.g., February 28th or 29th)

---

### User Story 4 - Stop Recurring Task (Priority: P1)

A user wants to stop a task from recurring (e.g., they no longer need daily vitamin reminders, or the weekly team meeting is cancelled). They should be able to disable recurrence without deleting the task.

**Why this priority**: This is critical for user control and is part of the core recurring task workflow. Without this, users cannot manage their recurring tasks effectively.

**Independent Test**: Can be fully tested by creating a recurring task, changing its recurrence pattern to "None", completing it, and verifying no new task is created.

**Acceptance Scenarios**:

1. **Given** a user has a recurring task, **When** they edit the task and change the recurrence pattern to "None" and save, **Then** the task is updated and will not create new occurrences when completed
2. **Given** a user has updated a recurring task to no longer recur, **When** they mark it as complete, **Then** only that task is marked complete and no new task is created
3. **Given** a user wants to pause a recurring task temporarily, **When** they change the recurrence pattern to "None", **Then** they can later re-enable recurrence by selecting a pattern again

---

### User Story 5 - View Recurring Task History (Priority: P2)

A user wants to see all completed instances of a recurring task to track their consistency (e.g., see how many days they completed "Exercise" or "Meditation").

**Why this priority**: This provides value for tracking habits and consistency but is not critical for the core recurring functionality to work.

**Independent Test**: Can be fully tested by completing multiple instances of a recurring task and verifying all completed tasks are visible in the task history or filtered view.

**Acceptance Scenarios**:

1. **Given** a user has completed multiple instances of a recurring task, **When** they view their completed tasks, **Then** they see all historical instances with their completion dates
2. **Given** a user wants to track a recurring task's history, **When** they filter by task title or tag, **Then** they can see all instances (completed and active) of that recurring task
3. **Given** a user views a recurring task's details, **When** they look at the task metadata, **Then** they can see an indicator that this task is part of a recurring series

---

### Edge Cases

- What happens when a user completes a recurring task multiple times before the next occurrence's due date arrives? (e.g., completing Tuesday's task on Monday)
- How does the system handle monthly recurrence for tasks due on the 29th, 30th, or 31st when the next month has fewer days?
- What happens if the event processing service is down when a recurring task is completed?
- How does the system handle a user deleting a recurring task vs. just marking it complete?
- What happens if a user changes the due date of a recurring task before completing it?
- How does the system handle timezone differences for tasks with specific due dates?
- What happens if a user tries to set recurrence on a task that already has a manually created "next instance"?
- How does the system prevent duplicate task creation if the event is processed multiple times?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to specify a recurrence pattern when creating or editing a task (options: None, Daily, Weekly, Monthly)
- **FR-002**: System MUST display the recurrence pattern clearly in the task list and detail views
- **FR-003**: System MUST preserve the recurrence pattern when a user edits other task properties (title, description, priority, etc.)
- **FR-004**: System MUST publish an event when a recurring task is marked as complete (event contains task ID, user ID, recurrence pattern, and original due date)
- **FR-005**: System MUST create a new task instance when a recurring task is completed, using the recurrence pattern to calculate the next due date
- **FR-006**: System MUST copy the title, description, priority, tags, and recurrence pattern from the completed task to the new task instance
- **FR-007**: System MUST NOT copy the completion status to the new task instance (new task starts as incomplete)
- **FR-008**: System MUST calculate daily recurrence as original_due_date + 1 day (or current_date + 1 day if no due date exists)
- **FR-009**: System MUST calculate weekly recurrence as original_due_date + 7 days
- **FR-010**: System MUST calculate monthly recurrence as the same day of the following month, handling edge cases for month-end dates
- **FR-011**: System MUST maintain both the completed original task and the new task instance in the database (no deletion of history)
- **FR-012**: System MUST prevent creation of duplicate recurring task instances through idempotent event processing
- **FR-013**: System MUST allow users to change a task's recurrence pattern from any value to any other value (including None to stop recurrence)
- **FR-014**: System MUST NOT create a new task instance if the recurrence pattern is "None" at the time of completion
- **FR-015**: System MUST handle event processing failures gracefully with retry logic and dead-letter queue for unprocessable events
- **FR-016**: System MUST preserve user data isolation (recurring tasks only create new instances for the same user)

### Key Entities

- **Task (Extended)**: Existing task entity with new recurrence_pattern field
  - New attribute: `recurrence_pattern` (enum: NONE, DAILY, WEEKLY, MONTHLY)
  - Relationship: Multiple tasks may share the same conceptual "recurring series" but are independent database entities
  - No explicit parent-child relationship; historical linking is implicit via shared title and creation sequence

- **Recurring Task Event**: Event published to message queue when a recurring task is completed
  - Attributes: task_id, user_id, recurrence_pattern, original_due_date, completed_at, title, description, priority, tags
  - Purpose: Decouples task completion from next instance creation, enabling async processing

- **Recurring Task Service**: Background service that consumes events and creates new task instances
  - Responsibilities: Event consumption, due date calculation, new task creation, idempotency enforcement
  - Not a data entity, but a critical architectural component

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create and configure recurring tasks (daily, weekly, monthly) in under 30 seconds without documentation
- **SC-002**: 95% of recurring task completions result in successful creation of the next instance within 5 seconds
- **SC-003**: System maintains complete history of all recurring task instances with zero data loss
- **SC-004**: Users can disable recurrence on any task in under 3 clicks/actions
- **SC-005**: System handles month-end edge cases correctly for 100% of monthly recurring tasks (e.g., Jan 31 → Feb 28/29)
- **SC-006**: Event processing service achieves 99.9% uptime with automatic retry for failed events
- **SC-007**: Zero duplicate recurring tasks created even under high concurrency or event replay scenarios
- **SC-008**: Users report increased task completion rates for habits/routines by at least 30% (measured via user surveys or analytics)
- **SC-009**: System processes recurring task events with average latency under 2 seconds from completion to new task creation
- **SC-010**: 90% of users successfully understand and use the recurring task feature without support tickets

## Assumptions

- Users understand the difference between daily, weekly, and monthly recurrence patterns
- The system already has a functioning task completion mechanism (marking tasks as done)
- The existing authentication and user isolation mechanisms are sufficient for recurring tasks
- Users prefer automatic creation of next instances over manual scheduling
- The event streaming infrastructure (Kafka/Dapr) is available and operational
- Due dates are optional on tasks; recurrence works with or without due dates
- Recurrence is calculated based on the original due date, not the completion date (preserves intended schedule)
- Monthly recurrence uses calendar months, not 30-day intervals
- The system does not need to support custom recurrence intervals (e.g., every 3 days, every 2 weeks) in this phase

## Dependencies

- Event streaming infrastructure (Kafka via Dapr Pub/Sub)
- Existing task model and API endpoints
- Background worker/service framework for event consumption
- Database migration capability for adding recurrence_pattern field

## Out of Scope

- Custom recurrence patterns (e.g., "every 3 days", "every 2 weeks", "every 6 months")
- Specific days of the week for weekly recurrence (e.g., "every Monday and Wednesday")
- End dates or maximum occurrence counts for recurring tasks (e.g., "repeat 10 times then stop")
- Editing multiple instances of a recurring series at once
- Smart scheduling (e.g., skipping weekends, adjusting for holidays)
- Notifications or reminders for upcoming recurring tasks
- Undo/rollback of automatically created recurring task instances
- Migration of existing tasks to recurring tasks with historical backfill
