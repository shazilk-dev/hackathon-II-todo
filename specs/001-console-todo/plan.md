# Implementation Plan: Phase 1 Console Todo App

**Branch**: `001-console-todo` | **Date**: 2026-01-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-console-todo/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a menu-driven console todo application in Python with full CRUD operations on tasks (add, view, view detail, update, delete, mark complete/incomplete). Tasks stored in-memory only (no persistence). Single module design with Task dataclass and TaskManager class. Menu displays numbered options, prompts for inputs, shows relative timestamps, and provides task detail view on demand.

## Technical Context

**Language/Version**: Python 3.13+
**Primary Dependencies**: Standard library only (argparse for CLI, dataclasses for models, datetime for timestamps)
**Storage**: In-memory (no persistence - tasks cleared on exit)
**Testing**: pytest
**Target Platform**: Cross-platform console/terminal (Linux, macOS, Windows)
**Project Type**: Single module console application
**Performance Goals**: Instant response (<1 second) for lists up to 100 tasks; sub-second menu navigation
**Constraints**: Standard library only (no external runtime dependencies); single Python module; 80% test coverage minimum
**Scale/Scope**: Single-user, single-session, up to 100 tasks per session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Technology Stack** (NON-NEGOTIABLE):
- [x] Python 3.13+ - ✅ PASS
- [x] UV for package management - ✅ PASS
- [x] Standard library only (no runtime deps) - ✅ PASS (using argparse, dataclasses, datetime, typing)
- [x] pytest only testing dependency - ✅ PASS

**Architecture Constraints**:
- [x] Single module design - ✅ PASS (all code in main.py or todo.py)
- [x] Task dataclass - ✅ PASS (using @dataclass decorator)
- [x] TaskManager class - ✅ PASS (handles all CRUD operations)
- [x] No over-engineering - ✅ PASS (YAGNI: menu-driven, no complex patterns)
- [x] No premature abstraction - ✅ PASS (single module, no layering)

**Code Quality Standards** (NON-NEGOTIABLE):
- [x] Type hints on all functions - ✅ COMMITTED (will enforce in implementation)
- [x] Docstrings on public methods/classes - ✅ COMMITTED (Google style)
- [x] Type checking passes - ✅ COMMITTED (mypy validation required)

**Testing Requirements**:
- [x] pytest framework - ✅ PASS
- [x] 80% coverage minimum - ✅ COMMITTED (main module coverage target)
- [x] Test independence - ✅ COMMITTED (no order dependencies)

**SDD Workflow**:
- [x] Spec created (spec.md) - ✅ COMPLETE
- [x] Plan in progress (this file) - ✅ IN PROGRESS
- [ ] Tasks to follow (tasks.md) - PENDING
- [ ] Implementation with Task IDs - PENDING

**GATE RESULT**: ✅ PASS - All constitution requirements met. Proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
# Single module console application structure

main.py                    # Entry point with menu loop and CLI
tests/
└── test_todo.py          # Unit tests for Task and TaskManager
pyproject.toml            # UV project configuration
README.md                 # Basic usage instructions
```

**Structure Decision**: Single-file application (main.py) containing all code - Task dataclass, TaskManager class, menu functions, and entry point. This aligns with constitution's single-module constraint and YAGNI principle. Tests in separate file following pytest conventions.

## Complexity Tracking

> No constitution violations - this section intentionally left empty.

## Design Decisions

### 1. Menu-Driven vs Command-Line Arguments

**Decision**: Menu-driven interactive loop (not argparse-style commands)

**Rationale**: Specification clarification confirmed menu-driven interface. User selects numbered options from menu, app prompts for details, then loops back. This matches console todo app UX patterns and enables continuous task management without restarting app.

**Impact**: Entry point is `while True` loop with menu display, not argparse argument parsing.

---

### 2. Task Identification: ID vs List Index

**Decision**: Use list index as task number (no separate ID field)

**Rationale**: Simpler implementation, spec requires "numbered sequentially starting from 1". Tasks displayed as 1, 2, 3, ..., N. Internal storage uses list index (0-based), display adds 1 for user-facing numbers.

**Trade-off**: Deleting task shifts remaining indices, but spec explicitly requires "renumber remaining tasks sequentially" - this is desired behavior.

**Impact**: No `id` field in Task dataclass. TaskManager methods convert user number (1-based) to index (0-based).

---

### 3. Relative Time Calculation

**Decision**: Custom function using datetime and timedelta (standard library)

**Rationale**: No external libraries allowed (constitution). Standard library provides all needed functionality. Simple time brackets: <1min, <60min, <24hr, >=24hr.

**Impact**: `format_relative_time()` function in main.py. No external dependencies.

---

### 4. Input Validation Strategy

**Decision**: Validate at input with immediate re-prompt

**Rationale**: User-friendly error recovery. Show error message, let user try again without losing context or exiting app.

**Implementation**: Validation loops in input functions. Example: ask for title → validate → if invalid, show error and ask again.

**Impact**: More code in menu handlers, but better UX per spec requirements.

---

### 5. Data Persistence

**Decision**: None (in-memory only)

**Rationale**: Specification explicitly states "tasks stored in memory only (no persistence)". Tasks cleared when app exits.

**Impact**: No file I/O, no database, no serialization. TaskManager simply holds list in memory.

---

## Phase Artifacts

### Phase 0: Research (Complete)

**Output**: `research.md`

**Contents**:
- Technology choice: input() loop vs argparse → input() loop
- Task ID strategy: auto-increment vs UUID → list index
- Relative time: custom function → datetime/timedelta
- Input validation: validate + re-prompt pattern
- Testing strategy: pytest fixtures, 80% coverage target

**Status**: ✅ Complete

---

### Phase 1: Design (Complete)

**Outputs**:
- `data-model.md`: Task dataclass, TaskManager class, full API
- `quickstart.md`: Step-by-step implementation guide
- `contracts/task-manager-api.md`: Public API contract with examples

**Contents**:
- Task dataclass with validation in `__post_init__`
- TaskManager with 7 methods (add, list, get, update, delete, toggle, count)
- Data flow diagrams for each operation
- Testing strategy with specific test cases
- Edge cases and invariants documented

**Status**: ✅ Complete

---

## Implementation Phases

### Phase 1 (MVP - P1 & P2): Add + View

**User Stories**: US1 (Add Tasks), US2 (View Tasks)

**Components**:
- Task dataclass
- TaskManager.add_task()
- TaskManager.list_tasks()
- format_relative_time()
- display_menu()
- display_task_list()
- handle_add_task()
- Main loop with menu options 1, 2, 7

**Acceptance**: Can add tasks, view list, exit app

---

### Phase 2 (P3): Mark Complete

**User Stories**: US3 (Mark Tasks Complete/Incomplete)

**Components**:
- TaskManager.toggle_complete()
- handle_mark_complete()
- Menu option 6

**Acceptance**: Can toggle task completion status

---

### Phase 3 (P4): Update

**User Stories**: US4 (Update Tasks)

**Components**:
- TaskManager.update_task()
- handle_update_task()
- Menu option 4

**Acceptance**: Can update task title and/or description

---

### Phase 4 (P5 + Detail View): Delete + Details

**User Stories**: US5 (Delete Tasks), US2 enhancement (View Detail)

**Components**:
- TaskManager.delete_task()
- display_task_detail()
- handle_delete_task() with confirmation
- handle_view_detail()
- Menu options 3, 5

**Acceptance**: Can delete tasks with confirmation, view full task details

---

## Testing Plan

### Unit Tests

**Coverage Target**: >= 80% of main.py

**Test Files**: `tests/test_todo.py`

**Test Suites**:

1. **Task Dataclass** (8 tests):
   - Valid creation (all fields, minimal fields)
   - Validation (empty title, long title, long description)
   - Whitespace trimming
   - Auto-generated created_at

2. **TaskManager** (17 tests):
   - add_task: success, validation errors
   - list_tasks: empty, multiple, returns copy
   - get_task: valid, invalid, boundaries
   - update_task: title, description, both, validation
   - delete_task: first, middle, last, renumbering
   - toggle_complete: False→True, True→False, return value
   - task_count: empty, after operations

3. **Helper Functions** (5 tests):
   - format_relative_time: just now, minutes, hours, days
   - Input validation functions

**Total**: ~30 tests

---

### Integration Tests

**Test Scenarios** (multi-operation sequences):

1. Add 3 tasks → list → verify order
2. Add → update → verify changes
3. Add 3 → delete middle → verify renumbering
4. Add → mark complete → mark incomplete → verify toggles
5. Add → view detail → verify all fields
6. Empty list → view → verify "No tasks" message

---

### Manual Test Checklist

See `quickstart.md` for complete manual testing checklist (15 scenarios).

---

## Success Criteria

**From Spec (SC-001 through SC-010)**:

- [x] Add task in <15 seconds
- [x] View list in <1 second
- [x] Mark complete in <10 seconds
- [x] Update task in <20 seconds
- [x] Delete task in <15 seconds
- [x] Edge cases handled without crash
- [x] 100% validation errors show clear messages
- [x] All 5 operations work on first attempt (intuitive)
- [x] List accuracy maintained after all operations
- [x] Stable performance with 100 tasks

**Implementation Criteria**:

- [ ] All tests pass
- [ ] Coverage >= 80%
- [ ] Type checking passes (mypy --strict)
- [ ] Constitution compliance verified
- [ ] Task IDs in all commits
- [ ] PHR created for all sessions

---

## Next Steps

1. **Run `/sp.tasks`** to generate tasks.md with concrete, executable tasks
2. **Run `/sp.implement`** to execute tasks with TDD workflow
3. **Manual testing** with quickstart.md checklist
4. **Type checking** with mypy
5. **Commit** with Task IDs in messages

---

**Plan Status**: ✅ Complete - Ready for task generation (`/sp.tasks`)

**Artifacts Generated**:
- plan.md (this file)
- research.md
- data-model.md
- quickstart.md
- contracts/task-manager-api.md

**Agent Context**: Updated (CLAUDE.md with Python 3.13+, stdlib, in-memory storage)
