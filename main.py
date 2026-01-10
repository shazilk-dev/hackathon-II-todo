# Task: T007, T008 | Spec: 001-console-todo/spec.md
# Phase 1 Console Todo Application
# Single module implementation with Task dataclass and TaskManager class

from dataclasses import dataclass, field
from datetime import datetime, timedelta


@dataclass
class Task:
    """Represents a todo task with title, description, completion status, and creation timestamp.

    Attributes:
        title: Task title (1-200 characters, required)
        description: Task description (max 1000 characters, optional)
        completed: Completion status (default: False)
        created_at: Creation timestamp (auto-generated)
    """
    title: str
    description: str = ""
    completed: bool = False
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self) -> None:
        """Validate task fields after initialization.

        Raises:
            ValueError: If title is empty/too long or description is too long
        """
        # Trim whitespace from title and description
        self.title = self.title.strip()
        self.description = self.description.strip()

        # Validate title: must be 1-200 characters
        if not self.title or len(self.title) > 200:
            raise ValueError("Title must be 1-200 characters")

        # Validate description: max 1000 characters
        if len(self.description) > 1000:
            raise ValueError("Description must be 0-1000 characters")


class TaskManager:
    """Manages a collection of tasks with CRUD operations.

    Provides methods to add, list, get, update, delete, and toggle completion
    status of tasks stored in memory.
    """

    def __init__(self) -> None:
        """Initialize TaskManager with empty task list."""
        self._tasks: list[Task] = []

    def add_task(self, title: str, description: str = "") -> int:
        """Add a new task to the list.

        Args:
            title: Task title (1-200 characters, required)
            description: Task description (max 1000 characters, optional)

        Returns:
            Task number (1-based position in list)

        Raises:
            ValueError: If title or description validation fails
        """
        task = Task(title=title, description=description)
        self._tasks.append(task)
        return len(self._tasks)

    def list_tasks(self) -> list[Task]:
        """Return all tasks as a copy of the task list.

        Returns:
            Copy of the task list (empty list if no tasks)
        """
        return self._tasks.copy()

    def task_count(self) -> int:
        """Return the number of tasks in the list.

        Returns:
            Number of tasks (0 if empty)
        """
        return len(self._tasks)

    def get_task(self, task_num: int) -> Task:
        """Get a specific task by number.

        Args:
            task_num: Task number (1-based)

        Returns:
            Task object

        Raises:
            IndexError: If task_num is out of range
        """
        if task_num < 1 or task_num > len(self._tasks):
            raise IndexError(f"Task {task_num} not found")
        return self._tasks[task_num - 1]

    def toggle_complete(self, task_num: int) -> bool:
        """Toggle task completion status.

        Args:
            task_num: Task number (1-based)

        Returns:
            New completion status (True=complete, False=incomplete)

        Raises:
            IndexError: If task_num is out of range
        """
        task = self.get_task(task_num)
        task.completed = not task.completed
        return task.completed

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
            IndexError: If task_num is out of range
            ValueError: If title or description validation fails
        """
        task = self.get_task(task_num)

        if title is not None:
            # Validate new title
            title_stripped = title.strip()
            if not title_stripped or len(title_stripped) > 200:
                raise ValueError("Title must be 1-200 characters")
            task.title = title_stripped

        if description is not None:
            # Validate new description
            description_stripped = description.strip()
            if len(description_stripped) > 1000:
                raise ValueError("Description must be 0-1000 characters")
            task.description = description_stripped

    def delete_task(self, task_num: int) -> None:
        """Delete a task by number.

        Args:
            task_num: Task number (1-based)

        Raises:
            IndexError: If task_num is out of range
        """
        if task_num < 1 or task_num > len(self._tasks):
            raise IndexError(f"Task {task_num} not found")
        del self._tasks[task_num - 1]


def format_relative_time(created_at: datetime) -> str:
    """Format datetime as relative time string.

    Args:
        created_at: The datetime to format

    Returns:
        Relative time string:
        - "just now" for times < 1 minute ago
        - "X minutes ago" for times < 60 minutes ago
        - "X hours ago" for times < 24 hours ago
        - "X days ago" for times >= 24 hours ago
    """
    now = datetime.now()
    delta = now - created_at

    # Less than 1 minute
    if delta < timedelta(minutes=1):
        return "just now"

    # Less than 60 minutes
    if delta < timedelta(hours=1):
        minutes = int(delta.total_seconds() / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"

    # Less than 24 hours
    if delta < timedelta(days=1):
        hours = int(delta.total_seconds() / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"

    # 24 hours or more
    days = delta.days
    return f"{days} day{'s' if days != 1 else ''} ago"


def display_menu() -> None:
    """Display the main menu with all available options."""
    print("\n=== Todo App Menu ===")
    print("1. Add a new task")
    print("2. View all tasks")
    print("3. View task details")
    print("4. Update a task")
    print("5. Delete a task")
    print("6. Mark task complete/incomplete")
    print("7. Exit")
    print("=" * 21)


def display_task_list(manager: TaskManager) -> None:
    """Display all tasks in numbered list format.

    Args:
        manager: TaskManager instance to get tasks from
    """
    tasks = manager.list_tasks()

    if not tasks:
        print("\nNo tasks found. Add a task to get started!")
        return

    print("\n--- All Tasks ---")
    for i, task in enumerate(tasks, 1):
        status = "✓" if task.completed else "✗"
        time_str = format_relative_time(task.created_at)
        print(f"{i}. [{status}] {task.title} - {time_str}")
    print(f"\nTotal: {len(tasks)} task{'s' if len(tasks) != 1 else ''}")


def display_task_detail(manager: TaskManager) -> None:
    """Display full details for a specific task.

    Args:
        manager: TaskManager instance to get task from
    """
    if manager.task_count() == 0:
        print("\nNo tasks available. Add a task first!")
        return

    print("\n--- View Task Details ---")
    task_num_str = input("Enter task number: ").strip()

    try:
        task_num = int(task_num_str)
        task = manager.get_task(task_num)

        print(f"\nTask #{task_num}")
        print("=" * 40)
        print(f"Title: {task.title}")
        print(f"Description: {task.description if task.description else '(none)'}")
        print(f"Status: {'✓ Completed' if task.completed else '✗ Not completed'}")
        print(f"Created: {format_relative_time(task.created_at)}")
        print("=" * 40)
    except ValueError:
        print("Error: Please enter a valid number.")
    except IndexError as e:
        print(f"Error: {e}")


def handle_add_task(manager: TaskManager) -> None:
    """Handle the add task menu option.

    Args:
        manager: TaskManager instance to add task to
    """
    print("\n--- Add New Task ---")

    # Get title
    while True:
        title = input("Enter task title: ").strip()
        if title:
            break
        print("Error: Title cannot be empty. Please try again.")

    # Get description (optional)
    description = input("Enter task description (optional, press Enter to skip): ").strip()

    # Add task
    try:
        task_num = manager.add_task(title, description)
        print(f"✓ Task #{task_num} added successfully!")
    except ValueError as e:
        print(f"Error: {e}")


def handle_update_task(manager: TaskManager) -> None:
    """Handle the update task menu option.

    Args:
        manager: TaskManager instance to update task in
    """
    if manager.task_count() == 0:
        print("\nNo tasks available. Add a task first!")
        return

    print("\n--- Update Task ---")
    task_num_str = input("Enter task number to update: ").strip()

    try:
        task_num = int(task_num_str)
        task = manager.get_task(task_num)

        print(f"\nCurrent title: {task.title}")
        new_title = input("Enter new title (or press Enter to keep current): ").strip()

        print(f"Current description: {task.description if task.description else '(none)'}")
        new_description = input("Enter new description (or press Enter to keep current): ").strip()

        # Only update if something was provided
        if new_title or new_description:
            manager.update_task(
                task_num,
                title=new_title if new_title else None,
                description=new_description if new_description else None
            )
            print("✓ Task updated successfully!")
        else:
            print("No changes made.")
    except ValueError as e:
        print(f"Error: {e}")
    except IndexError as e:
        print(f"Error: {e}")


def handle_delete_task(manager: TaskManager) -> None:
    """Handle the delete task menu option.

    Args:
        manager: TaskManager instance to delete task from
    """
    if manager.task_count() == 0:
        print("\nNo tasks available.")
        return

    print("\n--- Delete Task ---")
    task_num_str = input("Enter task number to delete: ").strip()

    try:
        task_num = int(task_num_str)
        task = manager.get_task(task_num)

        # Confirm deletion
        print(f"\nAre you sure you want to delete: '{task.title}'?")
        confirm = input("Type 'yes' to confirm: ").strip().lower()

        if confirm == "yes":
            manager.delete_task(task_num)
            print("✓ Task deleted successfully!")
        else:
            print("Deletion cancelled.")
    except ValueError:
        print("Error: Please enter a valid number.")
    except IndexError as e:
        print(f"Error: {e}")


def handle_mark_complete(manager: TaskManager) -> None:
    """Handle the mark complete/incomplete menu option.

    Args:
        manager: TaskManager instance to toggle task in
    """
    if manager.task_count() == 0:
        print("\nNo tasks available. Add a task first!")
        return

    print("\n--- Mark Task Complete/Incomplete ---")
    task_num_str = input("Enter task number: ").strip()

    try:
        task_num = int(task_num_str)
        new_status = manager.toggle_complete(task_num)

        status_text = "completed" if new_status else "incomplete"
        print(f"✓ Task #{task_num} marked as {status_text}!")
    except ValueError:
        print("Error: Please enter a valid number.")
    except IndexError as e:
        print(f"Error: {e}")

def main() -> None:
    """Main application loop."""
    manager = TaskManager()

    print("\n" + "=" * 40)
    print("Welcome to Phase 1 Console Todo App!")
    print("=" * 40)

    while True:
        display_menu()
        choice = input("\nSelect an option (1-7): ").strip()

        if choice == "1":
            handle_add_task(manager)
        elif choice == "2":
            display_task_list(manager)
        elif choice == "3":
            display_task_detail(manager)
        elif choice == "4":
            handle_update_task(manager)
        elif choice == "5":
            handle_delete_task(manager)
        elif choice == "6":
            handle_mark_complete(manager)
        elif choice == "7":
            print("\nGoodbye! Thanks for using Todo App.")
            break
        else:
            print("\nError: Invalid option. Please select a number from 1 to 7.")


if __name__ == "__main__":
    main()
