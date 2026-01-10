# Task Manager API Contract

**Feature**: 001-console-todo
**Component**: TaskManager Class
**Purpose**: Define public API contract for task management operations

## Overview

TaskManager provides programmatic interface for managing todo tasks. All operations validate inputs and raise exceptions on errors.

## Data Types

### Task

```python
@dataclass
class Task:
    title: str              # 1-200 chars, required, trimmed
    description: str        # 0-1000 chars, optional, trimmed, default=""
    completed: bool         # True/False, default=False
    created_at: datetime    # Auto-generated, immutable
```

## API Methods

### add_task

**Purpose**: Create new task

**Signature**:
```python
def add_task(self, title: str, description: str = "") -> int
```

**Parameters**:
- `title` (str, required): Task title
- `description` (str, optional): Task description, default=""

**Returns**:
- `int`: Task number (1-based position in list)

**Raises**:
- `ValueError`: If title empty after strip or >200 chars
- `ValueError`: If description >1000 chars

**Example**:
```python
manager = TaskManager()
task_num = manager.add_task("Buy groceries", "Milk, eggs, bread")
# Returns: 1
```

---

### list_tasks

**Purpose**: Retrieve all tasks

**Signature**:
```python
def list_tasks(self) -> list[Task]
```

**Parameters**: None

**Returns**:
- `list[Task]`: Copy of all tasks (empty list if none)

**Raises**: None

**Example**:
```python
tasks = manager.list_tasks()
# Returns: [Task(...), Task(...)]
```

---

### get_task

**Purpose**: Retrieve single task by number

**Signature**:
```python
def get_task(self, task_num: int) -> Task
```

**Parameters**:
- `task_num` (int, required): Task number (1-based)

**Returns**:
- `Task`: Task object

**Raises**:
- `IndexError`: If task_num < 1 or task_num > count

**Example**:
```python
task = manager.get_task(1)
# Returns: Task(title="Buy groceries", ...)
```

---

### update_task

**Purpose**: Update task title and/or description

**Signature**:
```python
def update_task(
    self,
    task_num: int,
    title: str | None = None,
    description: str | None = None
) -> None
```

**Parameters**:
- `task_num` (int, required): Task number (1-based)
- `title` (str | None, optional): New title (if provided)
- `description` (str | None, optional): New description (if provided)

**Returns**: None

**Raises**:
- `IndexError`: If task_num invalid
- `ValueError`: If title empty/invalid after strip
- `ValueError`: If description >1000 chars

**Example**:
```python
manager.update_task(1, title="Buy organic groceries")
# Updates task #1 title, keeps description unchanged
```

---

### delete_task

**Purpose**: Remove task by number

**Signature**:
```python
def delete_task(self, task_num: int) -> None
```

**Parameters**:
- `task_num` (int, required): Task number (1-based)

**Returns**: None

**Raises**:
- `IndexError`: If task_num invalid

**Side Effects**:
- Task removed from list
- Remaining tasks' numbers shift down (renumbered)

**Example**:
```python
manager.delete_task(2)
# Task #2 removed, task #3 becomes new task #2
```

---

### toggle_complete

**Purpose**: Toggle task completion status

**Signature**:
```python
def toggle_complete(self, task_num: int) -> bool
```

**Parameters**:
- `task_num` (int, required): Task number (1-based)

**Returns**:
- `bool`: New completion status (True=complete, False=incomplete)

**Raises**:
- `IndexError`: If task_num invalid

**Example**:
```python
new_status = manager.toggle_complete(1)
# Returns: True (if was False) or False (if was True)
```

---

### task_count

**Purpose**: Get number of tasks

**Signature**:
```python
def task_count(self) -> int
```

**Parameters**: None

**Returns**:
- `int`: Number of tasks (0 if empty)

**Raises**: None

**Example**:
```python
count = manager.task_count()
# Returns: 3
```

## Error Messages

| Error | Message | When |
|-------|---------|------|
| `ValueError` | "Title must be 1-200 characters" | Title empty or >200 chars |
| `ValueError` | "Description must be 0-1000 characters" | Description >1000 chars |
| `IndexError` | "Task {num} not found" | task_num out of range |

## Invariants

1. **Task numbers continuous**: Always 1, 2, 3, ..., N
2. **No gaps in list**: Deleting task renumbers remaining
3. **No persistence**: All data lost when TaskManager destroyed
4. **Copy on list**: `list_tasks()` returns copy, not reference
5. **Immutable created_at**: Never changes after task creation

## Usage Patterns

### Create, List, Update Flow

```python
# Create manager
manager = TaskManager()

# Add tasks
manager.add_task("Task 1")
manager.add_task("Task 2", "Details")

# List all
tasks = manager.list_tasks()
for i, task in enumerate(tasks, 1):
    print(f"{i}. {task.title}")

# Update
manager.update_task(1, title="Updated Task 1")

# Toggle complete
manager.toggle_complete(1)

# Delete
manager.delete_task(2)
```

### Error Handling

```python
try:
    manager.add_task("")  # Empty title
except ValueError as e:
    print(f"Error: {e}")  # "Title must be 1-200 characters"

try:
    manager.get_task(999)  # Invalid number
except IndexError as e:
    print(f"Error: {e}")  # "Task 999 not found"
```

## Testing Contract

### Required Test Cases

For comprehensive contract validation:

1. **add_task**:
   - Valid title only
   - Valid title + description
   - Empty title → ValueError
   - Title >200 chars → ValueError
   - Description >1000 chars → ValueError
   - Whitespace trimming

2. **list_tasks**:
   - Empty manager → []
   - Multiple tasks → correct order
   - Returns copy (not reference)

3. **get_task**:
   - Valid number → correct task
   - Invalid number → IndexError
   - Boundary (1, count) → success
   - Boundary (0, count+1) → IndexError

4. **update_task**:
   - Update title only
   - Update description only
   - Update both
   - Invalid title → ValueError
   - Invalid number → IndexError

5. **delete_task**:
   - Delete first task
   - Delete middle task → renumber
   - Delete last task
   - Invalid number → IndexError

6. **toggle_complete**:
   - False → True
   - True → False
   - Returns new status
   - Invalid number → IndexError

7. **task_count**:
   - Empty → 0
   - After adds → correct count
   - After delete → decrements

## Version

**Contract Version**: 1.0.0
**Last Updated**: 2026-01-10
**Stability**: Stable (implement as-is)

---

**Implementation**: See `data-model.md` for full code examples and quickstart.md for integration guidance.
