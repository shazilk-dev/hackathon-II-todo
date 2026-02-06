---
id: 0001
title: create-priorities-tags-spec
stage: spec
date: 2026-02-03
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-priorities-tags
branch: 002-priorities-tags
user: khans
command: /sp.specify
labels: ["priorities", "tags", "organization", "filtering"]
links:
  spec: specs/002-priorities-tags/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-priorities-tags/spec.md
  - specs/002-priorities-tags/checklists/requirements.md
tests:
  - Validation: All 14 checklist items passed
---

## Prompt

Feature: Task Priorities & Tags

Description:
Add priority levels (High, Medium, Low) and tags/categories to tasks for better
organization and filtering.

Acceptance Criteria:
1. Tasks have priority field (enum: HIGH, MEDIUM, LOW, default: MEDIUM)
2. Tasks can have multiple tags (many-to-many relationship)
3. Users can create custom tags
4. UI displays priority with visual indicators (colors/icons)
5. Tags shown as chips in task cards
6. MCP tools updated to support priority and tags parameters

Technical Approach:
- Add priority field to Task model (enum)
- Create Tag model with many-to-many relationship (TaskTag join table)
- Update MCP tools: add_task, update_task to accept priority and tags
- Frontend: Priority dropdown, Tag multi-select component
- Database migration for new fields and tables

## Response snapshot

Created comprehensive feature specification for task priorities and tags with:

1. **Feature Setup**: Created branch `002-priorities-tags` and initialized spec directory
2. **Backend Discovery**: Identified that priority and tag models already exist in backend (Task.priority, Tag, TaskTag models), so spec focuses on UI/UX and tool integration requirements
3. **User Scenarios**: 6 prioritized user stories (P1-P3):
   - P1: Assign priority to tasks (core visual organization)
   - P1: Create and apply tags (core categorization)
   - P2: Filter by priority (focused viewing)
   - P2: Filter by tags (context-based viewing)
   - P3: Manage tags (edit/delete lifecycle)
   - P3: Combine priority and tags (advanced organization)
4. **Requirements**: 34 functional requirements covering:
   - Priority assignment and display with visual indicators
   - Tag creation with names and colors
   - Many-to-many tag-task associations
   - Filtering by priority and tags (OR/AND logic)
   - User data isolation for tags
   - Integration requirements for APIs/tools
5. **Success Criteria**: 12 measurable, technology-agnostic outcomes (10s, 20s, 90%, 40%, 100%)
6. **Edge Cases**: 10 scenarios covering empty names, long names, duplicates, mass operations, special characters, mobile display
7. **Scope Management**: Clear assumptions (14 items), dependencies, and out-of-scope items (no custom priorities, no nested tags, no bulk operations)
8. **Quality Validation**: Created checklist with all 14 items passing

Specification is ready for `/sp.clarify` or `/sp.plan`.

## Outcome

- ✅ Impact: Complete specification documenting UI/UX and integration requirements for priorities and tags. Backend models already exist; spec guides frontend implementation and MCP tool updates.
- 🧪 Tests: Quality checklist validated all requirements (14/14 passed). Each user story has Given/When/Then acceptance scenarios covering both priority and tag workflows independently and combined.
- 📁 Files: Created spec.md and requirements.md checklist in specs/002-priorities-tags/
- 🔁 Next prompts: `/sp.clarify` (if questions arise) or `/sp.plan` (to design UI components and integration architecture)
- 🧠 Reflection: Spec balances two related but independent features (priority and tags). Each can be implemented independently (P1 stories) before combining (P3). Backend exists, so planning should focus on frontend state management, tag color management, and filter UX.

## Evaluation notes (flywheel)

- Failure modes observed: None. Initial check revealed backend already implemented; adjusted spec to focus on missing UI/UX and integration aspects without duplicating backend requirements.
- Graders run and results (PASS/FAIL): Quality checklist PASS (14/14 items). No unresolved placeholders, all requirements testable, success criteria measurable and technology-agnostic.
- Prompt variant (if applicable): Standard /sp.specify workflow. Adapted to document existing backend implementation while specifying new frontend requirements.
- Next experiment (smallest change to try): For features with partial implementation, consider adding a "Current State" section to the spec template to explicitly document what exists vs. what needs to be built. This would reduce planning confusion.
