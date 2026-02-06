---
id: 0001
title: create-recurring-tasks-spec
stage: spec
date: 2026-02-03
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-recurring-tasks
branch: 001-recurring-tasks
user: khans
command: /sp.specify
labels: ["recurring-tasks", "specification", "event-driven", "kafka"]
links:
  spec: specs/001-recurring-tasks/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-recurring-tasks/spec.md
  - specs/001-recurring-tasks/checklists/requirements.md
tests:
  - Validation: All 14 checklist items passed
---

## Prompt

Feature: Recurring Tasks

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
- Store recurrence metadata in task description or separate field

## Response snapshot

Created comprehensive feature specification for recurring tasks with:

1. **Feature Setup**: Created branch `001-recurring-tasks` and initialized spec directory
2. **User Scenarios**: 5 prioritized user stories (P1-P3):
   - P1: Daily recurring tasks (core MVP)
   - P2: Weekly recurring tasks
   - P3: Monthly recurring tasks
   - P1: Stop/disable recurrence (critical control)
   - P2: View recurring task history
3. **Requirements**: 16 functional requirements covering:
   - Task creation with recurrence patterns
   - Event publishing on task completion
   - Automatic next instance creation
   - Due date calculation logic for each pattern
   - User data isolation and idempotency
4. **Success Criteria**: 10 measurable, technology-agnostic outcomes
5. **Edge Cases**: 8 scenarios covering month-end handling, service failures, duplicates
6. **Scope Management**: Clear assumptions, dependencies, and out-of-scope items
7. **Quality Validation**: Created checklist with all 14 items passing

Specification is ready for `/sp.clarify` or `/sp.plan`.

## Outcome

- ✅ Impact: Complete, validated specification ready for architectural planning. Defines event-driven recurring task system with clear user value and measurable outcomes.
- 🧪 Tests: Quality checklist validated all requirements (14/14 passed). Each user story has Given/When/Then acceptance scenarios.
- 📁 Files: Created spec.md and requirements.md checklist in specs/001-recurring-tasks/
- 🔁 Next prompts: `/sp.clarify` (if questions arise) or `/sp.plan` (to design architecture)
- 🧠 Reflection: Specification balances technical clarity (event-driven patterns) with business focus (user value, no implementation details). Edge cases identified upfront reduce planning/implementation surprises.

## Evaluation notes (flywheel)

- Failure modes observed: None. Spec created without clarification markers by making informed assumptions (e.g., due date calculation based on original date, not completion date).
- Graders run and results (PASS/FAIL): Quality checklist PASS (14/14 items). No unresolved placeholders, all requirements testable, success criteria measurable and technology-agnostic.
- Prompt variant (if applicable): Standard /sp.specify workflow with automatic branch numbering and quality validation.
- Next experiment (smallest change to try): Consider adding visual examples or mockups for recurrence UI patterns in future specs to reduce frontend interpretation ambiguity.
