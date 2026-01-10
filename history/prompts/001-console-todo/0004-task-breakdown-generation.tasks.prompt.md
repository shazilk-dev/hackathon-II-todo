---
id: 0004
title: Task breakdown generation
stage: tasks
date: 2026-01-10
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-console-todo
branch: 001-console-todo
user: developer
command: /sp.tasks
labels: ["tasks", "tdd", "user-stories", "breakdown", "implementation"]
links:
  spec: specs/001-console-todo/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-console-todo/tasks.md
tests:
  - N/A (task planning phase - test tasks defined in tasks.md)
---

## Prompt

/sp.tasks

Break down the Phase I plan into implementable tasks.

Requirements:
- Organize by user story
- TDD approach: test tasks before implementation
- Mark dependencies between tasks
- Include checkpoints for verification

## Response snapshot

Generated comprehensive task breakdown with 80 executable tasks organized by user story following TDD approach.

**Task Organization**:
- **10 Phases**: Setup → Foundational → 5 User Stories → View Detail → Main Loop → Polish
- **80 Total Tasks**: 31 test tasks + 43 implementation tasks + 6 setup/polish
- **User Story Mapping**: Each story (US1-US5) gets dedicated phase with tests-first approach

**Phase Structure**:
1. **Setup (6 tasks)**: UV init, pytest/mypy setup, project structure
2. **Foundational (5 tasks)**: Task dataclass, TaskManager init, format_relative_time, display_menu - BLOCKS all user stories
3. **US1 - Add Tasks (12 tasks)**: 9 tests + 3 implementation (P1 - MVP)
4. **US2 - View Tasks (12 tasks)**: 7 tests + 5 implementation (P2 - MVP)
5. **US3 - Mark Complete (11 tasks)**: 6 tests + 5 implementation (P3)
6. **US4 - Update Tasks (9 tasks)**: 5 tests + 4 implementation (P4)
7. **US5 - Delete Tasks (7 tasks)**: 3 tests + 4 implementation (P5)
8. **View Detail (5 tasks)**: 1 test + 4 implementation (US2 enhancement)
9. **Main Loop (6 tasks)**: 1 integration test + 5 implementation
10. **Polish (7 tasks)**: Type hints, docstrings, mypy, coverage, README

**TDD Compliance**:
- Every user story has test tasks BEFORE implementation tasks
- Explicit checkpoints: "Write tests FIRST, ensure they FAIL before implementation"
- Implementation tasks include "Run pytest, verify tests PASS"

**Dependencies & Parallelization**:
- 35 tasks marked [P] for parallel execution
- Clear dependency chain: Setup → Foundational → User Stories (parallel) → Main Loop → Polish
- User stories are independent (can implement in any order after Foundational)

**Verification Checkpoints**:
- Foundation ready checkpoint before user stories
- Per-story checkpoints after test writing ("tests FAILING") and after implementation ("tests PASSING")
- Final checkpoint: manual testing + coverage >= 80%

**MVP Scope Defined**: 40 tasks (Setup + Foundational + US1 + US2 + Basic Main Loop)

**Implementation Strategies**:
- MVP First: Just US1 + US2 for demo
- Incremental Delivery: Add one story at a time
- Parallel Team: 5 developers on 5 stories simultaneously

## Outcome

- ✅ Impact: Complete executable task breakdown ready for /sp.implement
- 🧪 Tests: 31 test tasks defined following TDD (write test → verify FAIL → implement → verify PASS)
- 📁 Files: 1 file created (tasks.md with 80 tasks)
- 🔁 Next prompts: /sp.implement to execute tasks with TDD workflow
- 🧠 Reflection: Task breakdown follows strict checklist format (checkbox, ID, [P]/[Story] labels, file paths). Organized by user story priority (P1-P5) enabling independent implementation. TDD approach ensures tests written before code. Foundational phase prevents premature user story work. 35 parallel opportunities identified. MVP scope (40 tasks) provides clear first-delivery target.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Format validation PASS (all 80 tasks follow required checklist format)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
