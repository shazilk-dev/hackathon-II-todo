# Quickstart Guide: Phase 1 Console Todo App

**Feature**: 001-console-todo
**Audience**: Developers implementing this feature
**Purpose**: Step-by-step guide to build and test the application

## Prerequisites

- Python 3.13+
- UV package manager installed
- Terminal/console access

## Setup

### 1. Initialize Project with UV

```bash
# Create project directory (if not exists)
cd /path/to/hackathon-todo

# Initialize UV project
uv init

# Install pytest as dev dependency
uv add --dev pytest pytest-cov
```

### 2. Project Structure

Ensure this structure exists:

```
hackathon-todo/
├── main.py              # Application code (create this)
├── tests/
│   └── test_todo.py     # Test suite (create this)
├── pyproject.toml       # UV configuration (auto-generated)
├── README.md            # Usage docs
└── specs/
    └── 001-console-todo/
        ├── spec.md
        ├── plan.md
        ├── research.md
        └── data-model.md
```

## Implementation Steps

### Step 1: Create Task Dataclass

In `main.py`:

```python
# Task: TASK-001 (from tasks.md)
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Task:
    """Represents a todo task."""
    title: str
    description: str = ""
    completed: bool = False
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self) -> None:
        self.title = self.title.strip()
        self.description = self.description.strip()

        if not self.title or len(self.title) > 200:
            raise ValueError("Title must be 1-200 characters")
        if len(self.description) > 1000:
            raise ValueError("Description must be 0-1000 characters")
```

### Step 2: Create TaskManager Class

In `main.py`, add:

```python
# Task: TASK-002 (from tasks.md)
class TaskManager:
    """Manages todo tasks."""

    def __init__(self) -> None:
        self._tasks: list[Task] = []

    def add_task(self, title: str, description: str = "") -> int:
        task = Task(title=title, description=description)
        self._tasks.append(task)
        return len(self._tasks)

    # Add other methods: list_tasks, get_task, update_task,
    # delete_task, toggle_complete, task_count
    # (See data-model.md for full implementation)
```

### Step 3: Create Relative Time Formatter

In `main.py`, add:

```python
# Task: TASK-003 (from tasks.md)
def format_relative_time(created_at: datetime) -> str:
    """Format datetime as relative time string."""
    delta = datetime.now() - created_at

    if delta.total_seconds() < 60:
        return "just now"
    elif delta.total_seconds() < 3600:
        minutes = int(delta.total_seconds() // 60)
        return f"{minutes} {'minute' if minutes == 1 else 'minutes'} ago"
    elif delta.days == 0:
        hours = int(delta.total_seconds() // 3600)
        return f"{hours} {'hour' if hours == 1 else 'hours'} ago"
    else:
        return f"{delta.days} {'day' if delta.days == 1 else 'days'} ago"
```

### Step 4: Create Menu Display Function

```python
# Task: TASK-004 (from tasks.md)
def display_menu() -> None:
    """Display main menu options."""
    print("\n" + "=" * 30)
    print("   Todo List Menu")
    print("=" * 30)
    print("1. Add Task")
    print("2. View All Tasks")
    print("3. View Task Details")
    print("4. Update Task")
    print("5. Delete Task")
    print("6. Mark Task Complete/Incomplete")
    print("7. Exit")
    print("=" * 30)
```

### Step 5: Create Display Functions

```python
# Task: TASK-005 (from tasks.md)
def display_task_list(manager: TaskManager) -> None:
    """Display all tasks in compact format."""
    tasks = manager.list_tasks()

    if not tasks:
        print("\nNo tasks found.")
        return

    print("\n" + "=" * 60)
    for i, task in enumerate(tasks, 1):
        status = "✓" if task.completed else "✗"
        time_str = format_relative_time(task.created_at)
        print(f"{i}. [{status}] {task.title} ({time_str})")
    print("=" * 60)

def display_task_detail(task: Task, task_num: int) -> None:
    """Display single task with full details."""
    status = "Complete" if task.completed else "Incomplete"
    time_str = format_relative_time(task.created_at)

    print("\n" + "=" * 60)
    print(f"Task #{task_num}")
    print(f"Title: {task.title}")
    print(f"Description: {task.description if task.description else '(none)'}")
    print(f"Status: {status}")
    print(f"Created: {time_str}")
    print("=" * 60)
```

### Step 6: Create Menu Action Handlers

```python
# Task: TASK-006 (from tasks.md)
def handle_add_task(manager: TaskManager) -> None:
    """Handle add task menu option."""
    print("\n--- Add Task ---")
    title = input("Enter title: ").strip()
    description = input("Enter description (optional): ").strip()

    try:
        task_num = manager.add_task(title, description)
        print(f"✓ Task #{task_num} added successfully!")
    except ValueError as e:
        print(f"✗ Error: {e}")

# Add similar handlers: handle_view_tasks, handle_view_detail,
# handle_update_task, handle_delete_task, handle_mark_complete
```

### Step 7: Create Main Loop

```python
# Task: TASK-007 (from tasks.md)
def main() -> None:
    """Main application entry point."""
    manager = TaskManager()

    print("\n🎯 Welcome to Todo List!")

    while True:
        display_menu()
        choice = input("\nSelect option (1-7): ").strip()

        if choice == "1":
            handle_add_task(manager)
        elif choice == "2":
            display_task_list(manager)
        elif choice == "3":
            handle_view_detail(manager)
        elif choice == "4":
            handle_update_task(manager)
        elif choice == "5":
            handle_delete_task(manager)
        elif choice == "6":
            handle_mark_complete(manager)
        elif choice == "7":
            print("\n👋 Goodbye!")
            break
        else:
            print("✗ Invalid selection. Please enter 1-7.")

if __name__ == "__main__":
    main()
```

### Step 8: Create Test Suite

In `tests/test_todo.py`:

```python
# Task: TASK-008 (from tasks.md)
import pytest
from datetime import datetime
from main import Task, TaskManager

@pytest.fixture
def manager():
    """Provide clean TaskManager instance."""
    return TaskManager()

def test_task_creation_valid():
    task = Task(title="Test Task")
    assert task.title == "Test Task"
    assert task.description == ""
    assert task.completed == False
    assert isinstance(task.created_at, datetime)

def test_task_title_too_long():
    with pytest.raises(ValueError, match="Title must be 1-200 characters"):
        Task(title="x" * 201)

def test_add_task_returns_number(manager):
    num = manager.add_task("First task")
    assert num == 1

    num = manager.add_task("Second task")
    assert num == 2

# Add more tests for all TaskManager methods
# (See data-model.md for complete test list)
```

## Running the Application

### Start the App

```bash
# Run with UV
uv run python main.py

# Or activate venv and run directly
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
python main.py
```

### Expected Output

```
🎯 Welcome to Todo List!

==============================
   Todo List Menu
==============================
1. Add Task
2. View All Tasks
3. View Task Details
4. Update Task
5. Delete Task
6. Mark Task Complete/Incomplete
7. Exit
==============================

Select option (1-7):
```

## Running Tests

### Run All Tests

```bash
# With UV
uv run pytest

# Or with activated venv
pytest
```

### Run with Coverage

```bash
# Coverage report
uv run pytest --cov=main --cov-report=term-missing

# Target: >= 80% coverage
```

### Expected Test Output

```
collected 25 items

tests/test_todo.py::test_task_creation_valid PASSED
tests/test_todo.py::test_task_title_too_long PASSED
tests/test_todo.py::test_add_task_returns_number PASSED
...

---------- coverage: platform linux, python 3.13.0 ----------
Name      Stmts   Miss  Cover   Missing
---------------------------------------
main.py     156     12    92%   45-48, 67-69
---------------------------------------
TOTAL       156     12    92%
```

## Type Checking

### Run mypy

```bash
# Install mypy
uv add --dev mypy

# Type check
uv run mypy main.py --strict
```

### Expected Output

```
Success: no issues found in 1 source file
```

## Manual Testing Checklist

After implementation, manually test:

- [ ] Add task with title only
- [ ] Add task with title and description
- [ ] View empty task list (shows "No tasks")
- [ ] View task list with 3 tasks
- [ ] View task details by number
- [ ] Update task title
- [ ] Update task description
- [ ] Mark task complete (shows ✓)
- [ ] Mark task incomplete (shows ✗)
- [ ] Delete task with confirmation
- [ ] Delete task with cancel
- [ ] Try invalid menu option (shows error)
- [ ] Try invalid task number (shows error)
- [ ] Try empty title (shows error)
- [ ] Try title >200 chars (shows error)
- [ ] Exit application

## Troubleshooting

### Import Errors

```bash
# Ensure you're in project root
pwd  # Should show .../hackathon-todo

# Run with UV to use correct environment
uv run python main.py
```

### Type Checking Failures

```python
# Ensure all type hints are present
def my_function(param: str) -> int:  # ← Both param and return types
    ...
```

### Test Failures

```bash
# Run single test for debugging
uv run pytest tests/test_todo.py::test_name -v

# Show print statements
uv run pytest -s
```

## Next Steps

1. Complete implementation following tasks.md (created by `/sp.tasks`)
2. Run full test suite with coverage
3. Type check with mypy
4. Manual testing with checklist above
5. Commit with Task IDs: `git commit -m "[TASK-001] Implement Task dataclass"`

## Success Criteria

- [ ] All tests pass
- [ ] Coverage >= 80%
- [ ] mypy --strict passes
- [ ] All manual test scenarios work
- [ ] Menu loops until Exit selected
- [ ] Relative time displays correctly
- [ ] Task numbering 1-N after deletions
- [ ] All error messages clear and helpful

---

**Status**: Ready for implementation. Follow tasks.md for step-by-step execution.
