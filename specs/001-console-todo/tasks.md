---
description: "Task list for Phase 1 Console Todo App"
---

# Tasks: Phase 1 Console Todo App

**Input**: Design documents from `/specs/001-console-todo/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/, research.md, quickstart.md

**Tests**: Tests are included per TDD approach specified in user requirements. Tests written and verified to FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `main.py` at repository root, `tests/` directory at repository root
- All code in single module (main.py) per constitution constraint

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize UV project with Python 3.13+ in repository root
- [x] T002 [P] Add pytest and pytest-cov as dev dependencies via UV
- [x] T003 [P] Add mypy as dev dependency via UV for type checking
- [x] T004 Create tests/ directory and tests/test_todo.py file
- [x] T005 Create empty main.py file at repository root
- [x] T006 [P] Create basic README.md with project description and usage

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Implement Task dataclass with type hints in main.py (title, description, completed, created_at fields)
- [x] T008 Add __post_init__ validation to Task dataclass in main.py (title 1-200 chars, description 0-1000 chars)
- [x] T009 Implement TaskManager class __init__ method with empty task list in main.py
- [x] T010 Implement format_relative_time() helper function in main.py (just now, X minutes/hours/days ago)
- [x] T011 Implement display_menu() function in main.py (show 7 menu options)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Add Tasks (Priority: P1) 🎯 MVP

**Goal**: Users can create tasks with title and optional description

**Independent Test**: Launch app, add task "Buy groceries", verify it's created and displays in list

### Tests for User Story 1 (TDD - Write First, Verify FAIL)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T012 [P] [US1] Write test for Task dataclass valid creation with all fields in tests/test_todo.py
- [x] T013 [P] [US1] Write test for Task dataclass valid creation with title only in tests/test_todo.py
- [x] T014 [P] [US1] Write test for Task validation: empty title raises ValueError in tests/test_todo.py
- [x] T015 [P] [US1] Write test for Task validation: title >200 chars raises ValueError in tests/test_todo.py
- [x] T016 [P] [US1] Write test for Task validation: description >1000 chars raises ValueError in tests/test_todo.py
- [x] T017 [P] [US1] Write test for Task whitespace trimming on title and description in tests/test_todo.py
- [x] T018 [P] [US1] Write test for TaskManager.add_task() returns task number in tests/test_todo.py
- [x] T019 [P] [US1] Write test for TaskManager.add_task() with invalid title raises ValueError in tests/test_todo.py

**Checkpoint**: All US1 tests written and FAILING - ready for implementation

### Implementation for User Story 1

- [x] T020 [US1] Implement TaskManager.add_task() method in main.py (create Task, append to list, return number)
- [x] T021 [US1] Implement handle_add_task() function in main.py (prompt for title/description, call add_task, handle errors)
- [ ] T022 [US1] Add menu option 1 handler in main() function in main.py (call handle_add_task)
- [x] T023 [US1] Run pytest for US1 tests - verify all tests PASS

**Checkpoint**: User Story 1 complete - users can add tasks successfully

---

## Phase 4: User Story 2 - View Tasks (Priority: P2)

**Goal**: Users can view all tasks in numbered list with status and relative timestamps

**Independent Test**: Add 3 tasks, select View option, verify all 3 display with numbers, status (✗), and relative time

### Tests for User Story 2 (TDD - Write First, Verify FAIL)

- [x] T024 [P] [US2] Write test for TaskManager.list_tasks() returns empty list when no tasks in tests/test_todo.py
- [x] T025 [P] [US2] Write test for TaskManager.list_tasks() returns all tasks in tests/test_todo.py
- [x] T026 [P] [US2] Write test for TaskManager.list_tasks() returns copy not reference in tests/test_todo.py
- [x] T027 [P] [US2] Write test for TaskManager.task_count() returns 0 when empty in tests/test_todo.py
- [x] T028 [P] [US2] Write test for TaskManager.task_count() returns correct count in tests/test_todo.py
- [x] T029 [P] [US2] Write test for format_relative_time() with time <1 minute returns "just now" in tests/test_todo.py
- [x] T030 [P] [US2] Write test for format_relative_time() with minutes returns "X minutes ago" in tests/test_todo.py

**Checkpoint**: All US2 tests written and FAILING - ready for implementation

### Implementation for User Story 2

- [x] T031 [US2] Implement TaskManager.list_tasks() method in main.py (return copy of tasks list)
- [x] T032 [US2] Implement TaskManager.task_count() method in main.py (return len of tasks)
- [x] T033 [US2] Implement display_task_list() function in main.py (show numbered list with status ✓/✗ and relative time)
- [ ] T034 [US2] Add menu option 2 handler in main() function in main.py (call display_task_list)
- [x] T035 [US2] Run pytest for US2 tests - verify all tests PASS

**Checkpoint**: User Story 2 complete - users can view task lists

---

## Phase 5: User Story 3 - Mark Tasks Complete/Incomplete (Priority: P3)

**Goal**: Users can toggle task completion status by number

**Independent Test**: Add task, mark complete (shows ✓), mark incomplete (shows ✗), verify status changes

### Tests for User Story 3 (TDD - Write First, Verify FAIL)

- [ ] T036 [P] [US3] Write test for TaskManager.get_task() with valid number returns task in tests/test_todo.py
- [ ] T037 [P] [US3] Write test for TaskManager.get_task() with invalid number raises IndexError in tests/test_todo.py
- [ ] T038 [P] [US3] Write test for TaskManager.toggle_complete() changes False to True in tests/test_todo.py
- [ ] T039 [P] [US3] Write test for TaskManager.toggle_complete() changes True to False in tests/test_todo.py
- [ ] T040 [P] [US3] Write test for TaskManager.toggle_complete() returns new status in tests/test_todo.py
- [ ] T041 [P] [US3] Write test for TaskManager.toggle_complete() with invalid number raises IndexError in tests/test_todo.py

**Checkpoint**: All US3 tests written and FAILING - ready for implementation

### Implementation for User Story 3

- [ ] T042 [US3] Implement TaskManager.get_task() method in main.py (validate number, return task from list)
- [ ] T043 [US3] Implement TaskManager.toggle_complete() method in main.py (get task, flip completed, return new status)
- [ ] T044 [US3] Implement handle_mark_complete() function in main.py (prompt for number, toggle, show confirmation, handle errors)
- [ ] T045 [US3] Add menu option 6 handler in main() function in main.py (call handle_mark_complete)
- [ ] T046 [US3] Run pytest for US3 tests - verify all tests PASS

**Checkpoint**: User Story 3 complete - users can mark tasks complete/incomplete

---

## Phase 6: User Story 4 - Update Tasks (Priority: P4)

**Goal**: Users can update task title and/or description by number

**Independent Test**: Add task "Buy milk", update title to "Buy almond milk", verify change persists

### Tests for User Story 4 (TDD - Write First, Verify FAIL)

- [ ] T047 [P] [US4] Write test for TaskManager.update_task() updates title only in tests/test_todo.py
- [ ] T048 [P] [US4] Write test for TaskManager.update_task() updates description only in tests/test_todo.py
- [ ] T049 [P] [US4] Write test for TaskManager.update_task() updates both title and description in tests/test_todo.py
- [ ] T050 [P] [US4] Write test for TaskManager.update_task() with invalid title raises ValueError in tests/test_todo.py
- [ ] T051 [P] [US4] Write test for TaskManager.update_task() with invalid number raises IndexError in tests/test_todo.py

**Checkpoint**: All US4 tests written and FAILING - ready for implementation

### Implementation for User Story 4

- [ ] T052 [US4] Implement TaskManager.update_task() method in main.py (get task, update title/description with validation)
- [ ] T053 [US4] Implement handle_update_task() function in main.py (prompt for number and fields, call update_task, handle errors)
- [ ] T054 [US4] Add menu option 4 handler in main() function in main.py (call handle_update_task)
- [ ] T055 [US4] Run pytest for US4 tests - verify all tests PASS

**Checkpoint**: User Story 4 complete - users can update tasks

---

## Phase 7: User Story 5 - Delete Tasks (Priority: P5)

**Goal**: Users can delete tasks by number with confirmation

**Independent Test**: Add 3 tasks, delete task 2 with confirmation, verify removed and tasks renumbered 1-2

### Tests for User Story 5 (TDD - Write First, Verify FAIL)

- [ ] T056 [P] [US5] Write test for TaskManager.delete_task() removes task from list in tests/test_todo.py
- [ ] T057 [P] [US5] Write test for TaskManager.delete_task() with invalid number raises IndexError in tests/test_todo.py
- [ ] T058 [P] [US5] Write test for TaskManager.delete_task() renumbers remaining tasks (delete middle) in tests/test_todo.py

**Checkpoint**: All US5 tests written and FAILING - ready for implementation

### Implementation for User Story 5

- [ ] T059 [US5] Implement TaskManager.delete_task() method in main.py (validate number, delete from list)
- [ ] T060 [US5] Implement handle_delete_task() function in main.py (prompt for number, confirm deletion, call delete_task, handle errors)
- [ ] T061 [US5] Add menu option 5 handler in main() function in main.py (call handle_delete_task)
- [ ] T062 [US5] Run pytest for US5 tests - verify all tests PASS

**Checkpoint**: User Story 5 complete - users can delete tasks with confirmation

---

## Phase 8: View Task Details (Enhancement to US2)

**Goal**: Users can view full task details including description

**Independent Test**: Add task with description, select View Detail, enter task number, verify all fields display

### Tests for View Detail (TDD - Write First, Verify FAIL)

- [ ] T063 [P] [US2] Write test for display_task_detail() shows all task fields in tests/test_todo.py (integration test)

**Checkpoint**: Detail view test written and FAILING - ready for implementation

### Implementation for View Detail

- [ ] T064 [US2] Implement display_task_detail() function in main.py (show task number, title, description, status, created time)
- [ ] T065 [US2] Implement handle_view_detail() function in main.py (prompt for number, get task, call display_task_detail, handle errors)
- [ ] T066 [US2] Add menu option 3 handler in main() function in main.py (call handle_view_detail)
- [ ] T067 [US2] Run pytest for detail view test - verify test PASSES

**Checkpoint**: View Detail complete - users can see full task information

---

## Phase 9: Main Loop & Menu Navigation

**Goal**: Complete menu loop with exit option and error handling

**Independent Test**: Launch app, test all 7 menu options, verify loop continues until Exit selected

### Tests for Main Loop

- [ ] T068 [P] Write integration test for full app flow (add, view, mark, update, delete) in tests/test_todo.py

**Checkpoint**: Integration test written and FAILING - ready for implementation

### Implementation for Main Loop

- [ ] T069 Implement main() function with while loop in main.py (display menu, get choice, route to handlers, loop until exit)
- [ ] T070 Add invalid menu selection handling in main() function in main.py (show error, re-display menu)
- [ ] T071 Add menu option 7 (Exit) handler in main() function in main.py (print goodbye, break loop)
- [ ] T072 Add if __name__ == "__main__" block calling main() in main.py
- [ ] T073 Run integration test - verify test PASSES

**Checkpoint**: Application complete with full menu loop

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T074 [P] Add type hints to all functions in main.py (params + return types)
- [ ] T075 [P] Add Google-style docstrings to all public functions and classes in main.py
- [ ] T076 [P] Run mypy --strict on main.py and fix any type errors
- [ ] T077 Run pytest with coverage (pytest --cov=main --cov-report=term-missing)
- [ ] T078 Verify coverage >= 80% - add tests for uncovered lines if needed
- [ ] T079 [P] Update README.md with installation, usage, and testing instructions
- [ ] T080 Manual testing: Run through all acceptance scenarios from spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed) or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Main Loop (Phase 9)**: Depends on all user stories being complete
- **Polish (Phase 10)**: Depends on Main Loop completion

### User Story Dependencies

- **User Story 1 (P1 - Add Tasks)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2 - View Tasks)**: Can start after Foundational (Phase 2) - No dependencies on other stories (independent)
- **User Story 3 (P3 - Mark Complete)**: Can start after Foundational (Phase 2) - No dependencies on other stories (independent)
- **User Story 4 (P4 - Update Tasks)**: Can start after Foundational (Phase 2) - No dependencies on other stories (independent)
- **User Story 5 (P5 - Delete Tasks)**: Can start after Foundational (Phase 2) - No dependencies on other stories (independent)
- **View Detail (US2 Enhancement)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Tests (TDD) MUST be written and FAIL before implementation
- Implementation tasks must complete in order within each story
- Story complete when all tests PASS

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003, T006)
- All test-writing tasks within a user story marked [P] can run in parallel
- Once Foundational phase completes, ALL user stories (Phase 3-8) can start in parallel (if team capacity allows)
- Polish tasks marked [P] can run in parallel (T074, T075, T076, T079)

---

## Parallel Example: User Story 1 (Add Tasks)

```bash
# Phase 3: Write all tests for US1 in parallel
Parallel Tasks:
- T012: Write test for Task valid creation with all fields
- T013: Write test for Task valid creation with title only
- T014: Write test for Task validation empty title
- T015: Write test for Task validation title >200 chars
- T016: Write test for Task validation description >1000 chars
- T017: Write test for Task whitespace trimming
- T018: Write test for TaskManager.add_task() returns number
- T019: Write test for TaskManager.add_task() invalid title

# Verify all tests FAIL
pytest tests/test_todo.py::test_task* -v

# Then implement sequentially:
T020 → T021 → T022 → T023 (run tests, verify PASS)
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T011) - CRITICAL blocker
3. Complete Phase 3: User Story 1 - Add Tasks (T012-T023)
4. Complete Phase 4: User Story 2 - View Tasks (T024-T035)
5. Complete Phase 9: Basic Main Loop (T069-T073 - just options 1, 2, 7)
6. **STOP and VALIDATE**: Test add + view + exit workflow
7. Deploy/demo MVP

### Incremental Delivery (All User Stories)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 + 2 → Test independently → MVP!
3. Add User Story 3 (Mark) → Test independently → Feature release
4. Add User Story 4 (Update) → Test independently → Feature release
5. Add User Story 5 (Delete) → Test independently → Feature release
6. Add View Detail → Test independently → Feature release
7. Complete Main Loop integration
8. Polish (type hints, docstrings, coverage)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (T012-T023)
   - Developer B: User Story 2 (T024-T035)
   - Developer C: User Story 3 (T036-T046)
   - Developer D: User Story 4 (T047-T055)
   - Developer E: User Story 5 (T056-T062)
3. Stories complete and integrate via Main Loop

---

## Task Summary

**Total Tasks**: 80

**Tasks by Phase**:
- Setup: 6 tasks
- Foundational: 5 tasks (BLOCKING)
- User Story 1 (Add): 12 tasks (9 tests + 3 impl + checkpoint)
- User Story 2 (View): 12 tasks (7 tests + 5 impl + checkpoint)
- User Story 3 (Mark): 11 tasks (6 tests + 5 impl + checkpoint)
- User Story 4 (Update): 9 tasks (5 tests + 4 impl + checkpoint)
- User Story 5 (Delete): 7 tasks (3 tests + 4 impl + checkpoint)
- View Detail: 5 tasks (1 test + 4 impl + checkpoint)
- Main Loop: 6 tasks (1 test + 5 impl + checkpoint)
- Polish: 7 tasks

**Test Tasks**: 31 (TDD approach)
**Implementation Tasks**: 43
**Setup/Polish Tasks**: 13

**Parallel Opportunities**: 35 tasks marked [P] can run in parallel

**MVP Scope**: Setup (6) + Foundational (5) + US1 (12) + US2 (12) + Main Loop basics (5) = 40 tasks for MVP

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- TDD: Verify tests FAIL before implementing
- Run pytest after each implementation task to verify tests PASS
- Commit after each completed user story with Task IDs: `[T012-T023] Implement User Story 1 - Add Tasks`
- Stop at any checkpoint to validate story independently
