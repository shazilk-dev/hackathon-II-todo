# Task: T006 | Spec: 001-console-todo/spec.md

# Phase 1 Console Todo Application

A simple menu-driven console todo application built with Python 3.13+. Allows users to add, view, update, delete, and mark tasks as complete/incomplete.

## Features

- **Add Tasks**: Create tasks with title and optional description
- **View Tasks**: Display numbered list with completion status and relative timestamps
- **View Details**: See full task information including description
- **Update Tasks**: Modify task title and/or description
- **Delete Tasks**: Remove tasks with confirmation
- **Mark Complete/Incomplete**: Toggle task completion status

## Requirements

- Python 3.13+
- UV package manager

## Installation

```bash
# Clone the repository
cd hackathon-todo

# Install dependencies with UV
uv sync
```

## Usage

```bash
# Run the application
uv run python main.py
```

## Menu Options

1. Add a new task
2. View all tasks
3. View task details
4. Update a task
5. Delete a task
6. Mark task complete/incomplete
7. Exit

## Development

### Running Tests

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=main --cov-report=term-missing
```

### Type Checking

```bash
# Run mypy type checker
uv run mypy --strict main.py
```

## Project Structure

```
hackathon-todo/
├── main.py              # Single module with all application code
├── tests/
│   └── test_todo.py    # Test suite
├── pyproject.toml      # UV project configuration
└── README.md           # This file
```

## Technical Details

- **Storage**: In-memory only (no persistence)
- **Task Fields**: title (1-200 chars), description (max 1000 chars), completed (boolean), created_at (datetime)
- **Architecture**: Single module with Task dataclass and TaskManager class
- **Testing**: pytest with 80% minimum coverage requirement
- **Type Hints**: Full type annotation with mypy strict mode validation

## Acceptance Criteria

- Add task in under 15 seconds
- View task list in under 1 second
- Mark complete in under 10 seconds
- Update task in under 20 seconds
- Delete task in under 15 seconds
- Clear error messages for all validation failures
- Stable performance with up to 100 tasks

## License

This project was created as part of Hackathon II following Spec-Driven Development (SDD) principles.
