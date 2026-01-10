# Task: T012-T019 | Spec: 001-console-todo/spec.md
# Test file for Phase 1 Console Todo App
# Tests written following TDD approach - write tests FIRST, verify FAIL, then implement

import pytest
from datetime import datetime
from main import Task, TaskManager


# ============================================================================
# User Story 1: Add Tasks - Tests (T012-T019)
# ============================================================================

def test_task_valid_creation_all_fields():
    """T012: Test Task dataclass valid creation with all fields."""
    task = Task(
        title="Buy groceries",
        description="Milk, eggs, bread",
        completed=True
    )
    assert task.title == "Buy groceries"
    assert task.description == "Milk, eggs, bread"
    assert task.completed is True
    assert isinstance(task.created_at, datetime)


def test_task_valid_creation_title_only():
    """T013: Test Task dataclass valid creation with title only."""
    task = Task(title="Buy groceries")
    assert task.title == "Buy groceries"
    assert task.description == ""
    assert task.completed is False
    assert isinstance(task.created_at, datetime)


def test_task_validation_empty_title_raises_error():
    """T014: Test Task validation: empty title raises ValueError."""
    with pytest.raises(ValueError, match="Title must be 1-200 characters"):
        Task(title="")

    with pytest.raises(ValueError, match="Title must be 1-200 characters"):
        Task(title="   ")  # Only whitespace


def test_task_validation_long_title_raises_error():
    """T015: Test Task validation: title >200 chars raises ValueError."""
    long_title = "a" * 201
    with pytest.raises(ValueError, match="Title must be 1-200 characters"):
        Task(title=long_title)


def test_task_validation_long_description_raises_error():
    """T016: Test Task validation: description >1000 chars raises ValueError."""
    long_description = "a" * 1001
    with pytest.raises(ValueError, match="Description must be 0-1000 characters"):
        Task(title="Valid title", description=long_description)


def test_task_whitespace_trimming():
    """T017: Test Task whitespace trimming on title and description."""
    task = Task(
        title="  Buy groceries  ",
        description="  Milk, eggs, bread  "
    )
    assert task.title == "Buy groceries"
    assert task.description == "Milk, eggs, bread"


def test_taskmanager_add_task_returns_task_number():
    """T018: Test TaskManager.add_task() returns task number."""
    manager = TaskManager()
    task_num = manager.add_task("Buy groceries", "Milk, eggs")
    assert task_num == 1

    task_num = manager.add_task("Walk dog")
    assert task_num == 2


def test_taskmanager_add_task_invalid_title_raises_error():
    """T019: Test TaskManager.add_task() with invalid title raises ValueError."""
    manager = TaskManager()

    with pytest.raises(ValueError, match="Title must be 1-200 characters"):
        manager.add_task("")

    with pytest.raises(ValueError, match="Title must be 1-200 characters"):
        manager.add_task("a" * 201)


# ============================================================================
# User Story 2: View Tasks - Tests (T024-T030)
# ============================================================================

def test_taskmanager_list_tasks_empty():
    """T024: Test TaskManager.list_tasks() returns empty list when no tasks."""
    manager = TaskManager()
    tasks = manager.list_tasks()
    assert tasks == []
    assert isinstance(tasks, list)


def test_taskmanager_list_tasks_returns_all():
    """T025: Test TaskManager.list_tasks() returns all tasks."""
    manager = TaskManager()
    manager.add_task("Task 1")
    manager.add_task("Task 2", "Description 2")
    manager.add_task("Task 3")

    tasks = manager.list_tasks()
    assert len(tasks) == 3
    assert tasks[0].title == "Task 1"
    assert tasks[1].title == "Task 2"
    assert tasks[2].title == "Task 3"


def test_taskmanager_list_tasks_returns_copy():
    """T026: Test TaskManager.list_tasks() returns copy not reference."""
    manager = TaskManager()
    manager.add_task("Task 1")

    tasks1 = manager.list_tasks()
    tasks2 = manager.list_tasks()

    # Modifying one list should not affect the other
    assert tasks1 is not tasks2
    assert tasks1 == tasks2


def test_taskmanager_task_count_empty():
    """T027: Test TaskManager.task_count() returns 0 when empty."""
    manager = TaskManager()
    assert manager.task_count() == 0


def test_taskmanager_task_count_correct():
    """T028: Test TaskManager.task_count() returns correct count."""
    manager = TaskManager()
    assert manager.task_count() == 0

    manager.add_task("Task 1")
    assert manager.task_count() == 1

    manager.add_task("Task 2")
    assert manager.task_count() == 2


def test_format_relative_time_just_now():
    """T029: Test format_relative_time() with time <1 minute returns 'just now'."""
    from main import format_relative_time
    from datetime import timedelta

    now = datetime.now()
    time_30_seconds_ago = now - timedelta(seconds=30)

    result = format_relative_time(time_30_seconds_ago)
    assert result == "just now"


def test_format_relative_time_minutes():
    """T030: Test format_relative_time() with minutes returns 'X minutes ago'."""
    from main import format_relative_time
    from datetime import timedelta

    now = datetime.now()

    # 5 minutes ago
    time_5_min_ago = now - timedelta(minutes=5)
    result = format_relative_time(time_5_min_ago)
    assert result == "5 minutes ago"

    # 1 minute ago (singular)
    time_1_min_ago = now - timedelta(minutes=1)
    result = format_relative_time(time_1_min_ago)
    assert result == "1 minute ago"


# ============================================================================
# User Story 3: Mark Complete/Incomplete - Tests (T036-T041)
# ============================================================================

def test_taskmanager_get_task_valid():
    """T036: Test TaskManager.get_task() with valid number returns task."""
    manager = TaskManager()
    manager.add_task("Task 1")
    manager.add_task("Task 2")

    task = manager.get_task(1)
    assert task.title == "Task 1"

    task = manager.get_task(2)
    assert task.title == "Task 2"


def test_taskmanager_get_task_invalid():
    """T037: Test TaskManager.get_task() with invalid number raises IndexError."""
    manager = TaskManager()
    manager.add_task("Task 1")

    with pytest.raises(IndexError):
        manager.get_task(0)  # Invalid: too low

    with pytest.raises(IndexError):
        manager.get_task(5)  # Invalid: too high


def test_taskmanager_toggle_complete_false_to_true():
    """T038: Test TaskManager.toggle_complete() changes False to True."""
    manager = TaskManager()
    manager.add_task("Task 1")

    # Initially False
    task = manager.get_task(1)
    assert task.completed is False

    # Toggle to True
    new_status = manager.toggle_complete(1)
    assert new_status is True
    assert manager.get_task(1).completed is True


def test_taskmanager_toggle_complete_true_to_false():
    """T039: Test TaskManager.toggle_complete() changes True to False."""
    manager = TaskManager()
    manager.add_task("Task 1")

    # Set to True first
    manager.toggle_complete(1)
    assert manager.get_task(1).completed is True

    # Toggle back to False
    new_status = manager.toggle_complete(1)
    assert new_status is False
    assert manager.get_task(1).completed is False


def test_taskmanager_toggle_complete_returns_new_status():
    """T040: Test TaskManager.toggle_complete() returns new status."""
    manager = TaskManager()
    manager.add_task("Task 1")

    status1 = manager.toggle_complete(1)
    assert status1 is True

    status2 = manager.toggle_complete(1)
    assert status2 is False


def test_taskmanager_toggle_complete_invalid_number():
    """T041: Test TaskManager.toggle_complete() with invalid number raises IndexError."""
    manager = TaskManager()
    manager.add_task("Task 1")

    with pytest.raises(IndexError):
        manager.toggle_complete(0)

    with pytest.raises(IndexError):
        manager.toggle_complete(5)


# ============================================================================
# User Story 4: Update Tasks - Tests (T047-T051)
# ============================================================================

def test_taskmanager_update_task_title_only():
    """T047: Test TaskManager.update_task() updates title only."""
    manager = TaskManager()
    manager.add_task("Original title", "Original description")

    manager.update_task(1, title="Updated title")

    task = manager.get_task(1)
    assert task.title == "Updated title"
    assert task.description == "Original description"


def test_taskmanager_update_task_description_only():
    """T048: Test TaskManager.update_task() updates description only."""
    manager = TaskManager()
    manager.add_task("Original title", "Original description")

    manager.update_task(1, description="Updated description")

    task = manager.get_task(1)
    assert task.title == "Original title"
    assert task.description == "Updated description"


def test_taskmanager_update_task_both():
    """T049: Test TaskManager.update_task() updates both title and description."""
    manager = TaskManager()
    manager.add_task("Original title", "Original description")

    manager.update_task(1, title="New title", description="New description")

    task = manager.get_task(1)
    assert task.title == "New title"
    assert task.description == "New description"


def test_taskmanager_update_task_invalid_title():
    """T050: Test TaskManager.update_task() with invalid title raises ValueError."""
    manager = TaskManager()
    manager.add_task("Task 1")

    with pytest.raises(ValueError, match="Title must be 1-200 characters"):
        manager.update_task(1, title="")

    with pytest.raises(ValueError, match="Title must be 1-200 characters"):
        manager.update_task(1, title="a" * 201)


def test_taskmanager_update_task_invalid_number():
    """T051: Test TaskManager.update_task() with invalid number raises IndexError."""
    manager = TaskManager()
    manager.add_task("Task 1")

    with pytest.raises(IndexError):
        manager.update_task(0, title="New title")

    with pytest.raises(IndexError):
        manager.update_task(5, title="New title")


# ============================================================================
# User Story 5: Delete Tasks - Tests (T056-T058)
# ============================================================================

def test_taskmanager_delete_task_removes():
    """T056: Test TaskManager.delete_task() removes task from list."""
    manager = TaskManager()
    manager.add_task("Task 1")
    manager.add_task("Task 2")
    manager.add_task("Task 3")

    assert manager.task_count() == 3

    manager.delete_task(2)

    assert manager.task_count() == 2
    assert manager.get_task(1).title == "Task 1"
    assert manager.get_task(2).title == "Task 3"  # Renumbered


def test_taskmanager_delete_task_invalid_number():
    """T057: Test TaskManager.delete_task() with invalid number raises IndexError."""
    manager = TaskManager()
    manager.add_task("Task 1")

    with pytest.raises(IndexError):
        manager.delete_task(0)

    with pytest.raises(IndexError):
        manager.delete_task(5)


def test_taskmanager_delete_task_renumbers():
    """T058: Test TaskManager.delete_task() renumbers remaining tasks (delete middle)."""
    manager = TaskManager()
    manager.add_task("Task 1")
    manager.add_task("Task 2")
    manager.add_task("Task 3")
    manager.add_task("Task 4")

    # Delete middle task
    manager.delete_task(2)

    # Verify renumbering
    assert manager.task_count() == 3
    assert manager.get_task(1).title == "Task 1"
    assert manager.get_task(2).title == "Task 3"
    assert manager.get_task(3).title == "Task 4"
