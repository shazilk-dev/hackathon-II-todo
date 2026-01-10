# Research: Phase 1 Console Todo App

**Feature**: 001-console-todo
**Date**: 2026-01-10
**Purpose**: Document technology choices, patterns, and best practices for implementation

## Technology Decisions

### 1. Entry Point: argparse vs input() Loop

**Decision**: Use `input()` loop for menu-driven interaction, NOT argparse

**Rationale**:
- Spec requires menu-driven interface with numbered options that re-display after each operation
- argparse is for command-line argument parsing (e.g., `python main.py add "task title"`), not interactive menus
- `input()` loop enables continuous interaction until user selects "Exit"
- Menu pattern: display options → get user choice → execute action → loop back

**Alternatives Considered**:
- **argparse**: Rejected - designed for one-shot commands with arguments, not interactive menus
- **Click/Typer**: Rejected - violates constitution (no external dependencies)
- **curses**: Rejected - overkill for simple menu, adds complexity

**Implementation Pattern**:
```python
while True:
    display_menu()
    choice = input("Select option: ")
    if choice == "7":  # Exit
        break
    handle_choice(choice)
```

---

### 2. Task ID Generation Strategy

**Decision**: Use auto-incrementing integer starting from 1

**Rationale**:
- Spec requires tasks numbered sequentially starting from 1
- User references tasks by number for all operations
- Simple counter in TaskManager class tracks next ID
- Renumbering after deletion not required (spec: "renumber remaining tasks" means display numbers 1-N, not change IDs)

**Alternatives Considered**:
- **UUID**: Rejected - not user-friendly for CLI interaction ("update task 3" vs "update task a1b2c3d4")
- **Auto-increment with renumbering**: Rejected - complex, breaks reference stability during session
- **Display index only (no ID)**: Selected - tasks displayed as 1-N, internally use list index

**Implementation**: Tasks stored in list, display position (index+1) used as "task number"

---

### 3. Relative Time Formatting

**Decision**: Implement custom relative time function using `datetime` and `timedelta`

**Rationale**:
- Spec requires relative format: "just now", "2 hours ago", "3 days ago"
- Standard library `datetime` provides all needed functionality
- No external libraries needed (humanize, arrow, etc. violate constitution)

**Implementation Logic**:
- < 1 minute: "just now"
- < 60 minutes: "X minutes ago"
- < 24 hours: "X hours ago"
- >= 24 hours: "X days ago"

**Code Pattern**:
```python
def format_relative_time(created_at: datetime) -> str:
    delta = datetime.now() - created_at
    if delta.seconds < 60:
        return "just now"
    elif delta.seconds < 3600:
        return f"{delta.seconds // 60} minutes ago"
    elif delta.days == 0:
        return f"{delta.seconds // 3600} hours ago"
    else:
        return f"{delta.days} days ago"
```

---

### 4. Input Validation Strategy

**Decision**: Validate on input with immediate feedback and re-prompt

**Rationale**:
- Spec requires clear error messages and re-prompting
- User-friendly: show error, ask again (don't crash or exit)
- Validation points: menu selection, task numbers, title/description length, empty title

**Validation Functions Needed**:
- `validate_menu_choice(choice: str, max_option: int) -> bool`
- `validate_task_number(num_str: str, max_tasks: int) -> int | None`
- `validate_title(title: str) -> bool` (1-200 chars, not empty after strip)
- `validate_description(desc: str) -> bool` (0-1000 chars)

**Pattern**:
```python
while True:
    title = input("Enter title: ").strip()
    if not title or len(title) > 200:
        print("Error: Title must be 1-200 characters")
        continue
    break
```

---

### 5. Testing Strategy with pytest

**Decision**: Use pytest with fixtures for TaskManager, test all CRUD operations and edge cases

**Rationale**:
- Constitution requires pytest, 80% coverage
- Fixtures provide clean TaskManager instance per test
- Test independence ensured by fixture isolation
- Cover: CRUD operations, validation, edge cases (empty list, invalid numbers, boundary values)

**Test Structure**:
```python
@pytest.fixture
def manager():
    return TaskManager()

def test_add_task_success(manager):
    task_num = manager.add_task("Test", "Description")
    assert task_num == 1

def test_add_task_empty_title_raises(manager):
    with pytest.raises(ValueError):
        manager.add_task("", "")
```

**Coverage Target**: Main module (main.py) >= 80%

---

### 6. Menu Structure Design

**Decision**: Numbered menu with 7 options displayed in loop

**Rationale**:
- Spec clarification: menu-driven with numbered options
- FR-017: Menu includes Add, View, View Detail, Update, Delete, Mark, Exit
- Display menu, get number, validate, execute, loop

**Menu Layout**:
```
=== Todo List Menu ===
1. Add Task
2. View All Tasks
3. View Task Details
4. Update Task
5. Delete Task
6. Mark Task Complete/Incomplete
7. Exit

Select option (1-7):
```

**Navigation Flow**: Main loop → Display menu → Get choice → Validate → Route to function → Display result → Loop back

---

## Best Practices Applied

### Python 3.13+ Features
- **Dataclasses**: Use `@dataclass` for Task with `frozen=False` for mutability
- **Type Hints**: Full annotations on all functions (PEP 484)
- **Match/Case**: Consider for menu routing (`match choice:`)
- **Walrus Operator**: Use in validation loops where appropriate

### Code Organization
- **Single Module**: All code in main.py (Task, TaskManager, menu functions, main loop)
- **Clear Separation**: Data model → Business logic → UI → Entry point
- **No Classes for UI**: Menu functions are plain functions, not class methods

### Error Handling
- **Validation at Input**: Check immediately, provide feedback, re-prompt
- **Clear Messages**: Explain what's wrong and how to fix ("Title must be 1-200 characters")
- **No Crashes**: Catch invalid input gracefully, never let app crash

### Documentation
- **Google Style Docstrings**: On Task dataclass, TaskManager class, all public functions
- **Type Hints**: Self-documenting function signatures
- **Inline Comments**: Only where logic non-obvious (e.g., relative time calculation)

---

## Implementation Priorities

1. **Phase 1 (MVP - User Story P1 & P2)**:
   - Task dataclass
   - TaskManager with add + list operations
   - Basic menu with options 1, 2, 7 (Add, View, Exit)
   - Input validation for add

2. **Phase 2 (Mark Complete - P3)**:
   - Mark complete/incomplete operation
   - Menu option 6

3. **Phase 3 (Update - P4)**:
   - Update operation
   - Menu option 4

4. **Phase 4 (Delete & Detail - P5 + Detail View)**:
   - Delete operation with confirmation
   - View task detail
   - Menu options 3, 5

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Relative time calculation complexity | Medium | Use simple timedelta math; unit test edge cases |
| Input validation edge cases | Medium | Comprehensive test suite covering boundaries |
| Single module size | Low | ~300-400 LOC estimated - manageable |
| Type checking strictness | Low | Start strict (mypy --strict), relax if needed |

---

## References

- **Python datetime docs**: https://docs.python.org/3/library/datetime.html
- **Dataclasses guide**: https://docs.python.org/3/library/dataclasses.html
- **pytest docs**: https://docs.pytest.org/
- **PEP 484 (Type Hints)**: https://peps.python.org/pep-0484/

---

**Status**: Research complete. Ready for Phase 1 (data model design).
