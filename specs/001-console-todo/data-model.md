# Data Model: Phase 1 Console Todo App

**Feature**: 001-console-todo
**Date**: 2026-01-10
**Purpose**: Define data structures, validation rules, and state management

## Core Entities

### Task

**Description**: Represents a single todo item with title, optional description, completion status, and creation timestamp.

**Implementation**: Python `@dataclass` with type annotations

**Fields**:

| Field | Type | Required | Constraints | Default | Description |
|-------|------|----------|-------------|---------|-------------|
| `title` | `str` | Yes | 1-200 chars, non-empty after strip | N/A | Task title |
| `description` | `str` | No | 0-1000 chars | `""` | Optional task description |
| `completed` | `bool` | Yes | N/A | `False` | Completion status |
| `created_at` | `datetime` | Yes | Valid datetime | `datetime.now()` | Creation timestamp |

**Validation Rules**:
- `title`: Must not be empty after `strip()`; length 1-200 characters after stripping
- `description`: Length 0-1000 characters (empty string allowed)
- `completed`: Boolean only (True/False)
- `created_at`: Auto-generated on creation, immutable

**Code Representation**:
```python
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Task:
    """Represents a todo task with title, description, status, and creation time.

    Attributes:
        title: Task title (1-200 characters, required)
        description: Optional task description (0-1000 characters)
        completed: Completion status (default: False)
        created_at: Timestamp when task was created (auto-generated)
    """
    title: str
    description: str = ""
    completed: bool = False
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self) -> None:
        """Validate task fields after initialization."""
        self.title = self.title.strip()
        self.description = self.description.strip()

        if not self.title or len(self.title) > 200:
            raise ValueError("Title must be 1-200 characters")
        if len(self.description) > 1000:
            raise ValueError("Description must be 0-1000 characters")
```

**State Transitions**:
```
[Created] (completed=False)
    ↓
    | Mark Complete
    ↓
[Completed] (completed=True)
    ↓
    | Mark Incomplete
    ↓
[Created] (completed=False)
```

**Uniqueness**: Tasks identified by position in list (no unique ID field). Duplicate titles allowed.

---

## Business Logic Entity

### TaskManager

**Description**: Manages collection of tasks and provides CRUD operations. Stores tasks in-memory (list), no persistence.

**Responsibilities**:
- Create new tasks with validation
- List all tasks
- Retrieve single task by number
- Update task title/description
- Delete task by number
- Toggle task completion status

**State**:
- `tasks`: List of Task objects (private)

**Methods**:

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `add_task` | `title: str, description: str = ""` | `int` | Create task, return position (1-based) |
| `list_tasks` | None | `list[Task]` | Return all tasks |
| `get_task` | `task_num: int` | `Task` | Get task by number (raises if not found) |
| `update_task` | `task_num: int, title: str \| None, description: str \| None` | `None` | Update task fields |
| `delete_task` | `task_num: int` | `None` | Remove task (raises if not found) |
| `toggle_complete` | `task_num: int` | `bool` | Toggle status, return new state |
| `task_count` | None | `int` | Return number of tasks |

**Validation**:
- All methods validate `task_num` is in range `1..len(tasks)`
- `add_task` and `update_task` validate title/description via Task dataclass
- Raises `ValueError` on validation failures
- Raises `IndexError` on invalid task numbers

**Code Representation**:
```python
class TaskManager:
    """Manages collection of todo tasks with CRUD operations.

    Tasks stored in-memory (no persistence). Operations validate inputs
    and raise exceptions on invalid data.
    """

    def __init__(self) -> None:
        """Initialize empty task list."""
        self._tasks: list[Task] = []

    def add_task(self, title: str, description: str = "") -> int:
        """Add new task and return its number (1-based position).

        Args:
            title: Task title (1-200 chars)
            description: Optional description (0-1000 chars)

        Returns:
            Task number (position in list, 1-based)

        Raises:
            ValueError: If title or description invalid
        """
        task = Task(title=title, description=description)
        self._tasks.append(task)
        return len(self._tasks)

    def list_tasks(self) -> list[Task]:
        """Return all tasks."""
        return self._tasks.copy()

    def get_task(self, task_num: int) -> Task:
        """Get task by number.

        Args:
            task_num: Task number (1-based)

        Returns:
            Task object

        Raises:
            IndexError: If task_num invalid
        """
        if task_num < 1 or task_num > len(self._tasks):
            raise IndexError(f"Task {task_num} not found")
        return self._tasks[task_num - 1]

    def update_task(
        self,
        task_num: int,
        title: str | None = None,
        description: str | None = None
    ) -> None:
        """Update task title and/or description.

        Args:
            task_num: Task number (1-based)
            title: New title (if provided)
            description: New description (if provided)

        Raises:
            IndexError: If task_num invalid
            ValueError: If title or description invalid
        """
        task = self.get_task(task_num)
        if title is not None:
            task.title = title.strip()
            if not task.title or len(task.title) > 200:
                raise ValueError("Title must be 1-200 characters")
        if description is not None:
            task.description = description.strip()
            if len(task.description) > 1000:
                raise ValueError("Description must be 0-1000 characters")

    def delete_task(self, task_num: int) -> None:
        """Delete task by number.

        Args:
            task_num: Task number (1-based)

        Raises:
            IndexError: If task_num invalid
        """
        if task_num < 1 or task_num > len(self._tasks):
            raise IndexError(f"Task {task_num} not found")
        del self._tasks[task_num - 1]

    def toggle_complete(self, task_num: int) -> bool:
        """Toggle task completion status.

        Args:
            task_num: Task number (1-based)

        Returns:
            New completion status

        Raises:
            IndexError: If task_num invalid
        """
        task = self.get_task(task_num)
        task.completed = not task.completed
        return task.completed

    def task_count(self) -> int:
        """Return number of tasks."""
        return len(self._tasks)
```

---

## Data Flow

### Add Task Flow
```
User Input (title, description)
    ↓
Validate title (1-200 chars, non-empty)
Validate description (0-1000 chars)
    ↓
Create Task object
    ↓
Append to TaskManager._tasks
    ↓
Return position (len(tasks))
```

### View Tasks Flow
```
TaskManager.list_tasks()
    ↓
Return copy of _tasks list
    ↓
For each task: format display
  - Number: position (index + 1)
  - Title
  - Status: ✓ or ✗
  - Created: relative time
    ↓
Display to user
```

### Update Task Flow
```
User Input (task_num, new_title?, new_description?)
    ↓
Validate task_num (1 <= num <= count)
    ↓
Get task from list[task_num - 1]
    ↓
Update title (if provided) → validate
Update description (if provided) → validate
    ↓
Task updated in-place
```

### Delete Task Flow
```
User Input (task_num)
    ↓
Confirm deletion (y/n)
    ↓
Validate task_num
    ↓
Delete from list (del _tasks[task_num - 1])
    ↓
Remaining tasks auto-renumbered (list index shift)
```

### Toggle Complete Flow
```
User Input (task_num)
    ↓
Validate task_num
    ↓
Get task from list
    ↓
Toggle task.completed (not completed)
    ↓
Return new status
```

---

## Invariants

1. **Task Numbers**: Always 1-based, continuous (1, 2, 3, ..., N)
2. **List Consistency**: `len(tasks)` always equals highest valid task number
3. **Title Required**: No task can exist with empty title
4. **Immutable Creation Time**: `created_at` set once, never changed
5. **No Persistence**: All data lost when app exits (intentional)

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Empty task list | `list_tasks()` returns `[]`, display shows "No tasks" message |
| Invalid task number | Raise `IndexError` with message "Task {num} not found" |
| Empty title after strip | Raise `ValueError` "Title must be 1-200 characters" |
| Title exactly 200 chars | Valid, accepted |
| Title 201 chars | Raise `ValueError` "Title must be 1-200 characters" |
| Empty description | Valid, stored as `""` |
| Description exactly 1000 chars | Valid, accepted |
| Duplicate titles | Allowed, tasks distinguished by number |
| Delete middle task | Remaining tasks renumbered (list indices shift down) |
| Update with same values | Allowed, no error |

---

## Testing Strategy

### Unit Tests

**Task Dataclass**:
- Valid creation with all fields
- Valid creation with minimal fields (title only)
- Validation: empty title raises
- Validation: title >200 chars raises
- Validation: description >1000 chars raises
- Whitespace trimming on title and description
- Auto-generated `created_at`

**TaskManager**:
- Add task returns correct number
- Add task with invalid title raises
- List tasks on empty manager returns []
- List tasks returns copy (not original)
- Get task with valid number succeeds
- Get task with invalid number raises
- Update task title
- Update task description
- Update task both fields
- Update with invalid title raises
- Delete task removes from list
- Delete invalid task number raises
- Delete middle task renumbers remaining
- Toggle complete changes status
- Toggle returns new status

### Integration Tests

**Multi-operation sequences**:
- Add multiple tasks, verify numbering
- Add, update, verify changes persisted
- Add multiple, delete middle, verify renumbering
- Add, mark complete, mark incomplete, verify toggles

**Coverage Target**: >= 80% line coverage on main module

---

**Status**: Data model design complete. Ready for contracts and quickstart.
