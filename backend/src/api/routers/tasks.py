"""
Task: T047, T048, T050-T074
API endpoints for task CRUD operations.

All endpoints require JWT authentication and enforce user isolation.
"""

from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db
from src.core.exceptions import TaskNotFoundError
from src.schemas.common import DeleteResponse
from src.schemas.task import TaskCreate, TaskListResponse, TaskResponse, TaskStatusUpdate, TaskUpdate
from src.schemas.tag import TagResponse as TagResponseSchema
from src.services.tag_service import TagService
from src.services.task_service import TaskService

# Task: T048 - Create router with prefix and tags
router = APIRouter(prefix="/api", tags=["tasks"])


def verify_user_access(request: Request, user_id: str) -> None:
    """
    Verify that the path user_id matches the JWT user_id.

    Args:
        request: FastAPI request with user_id in state (from JWT middleware)
        user_id: User ID from path parameter

    Raises:
        HTTPException: 403 if user_id mismatch
    """
    if request.state.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot access resources for other users",
        )


# Task: T050-T053 - GET /api/{user_id}/tasks (List Tasks)
@router.get(
    "/{user_id}/tasks",
    response_model=TaskListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all tasks for user",
    description="Get all tasks for the authenticated user with optional filtering and sorting",
    responses={
        200: {"description": "List of tasks"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "User ID in path doesn't match JWT"},
    },
)
async def list_tasks(
    user_id: str,
    request: Request,
    status_filter: Literal["all", "pending", "completed"] = "all",
    sort: Literal["created", "title", "priority", "due_date"] = "created",
    priority_filter: Literal["low", "medium", "high", "critical", None] = None,
    due_date_filter: Literal["overdue", "today", "this_week", "all", None] = None,
    tag_filter: Optional[List[int]] = Query(None, description="Filter by tag IDs"),
    session: AsyncSession = Depends(get_db),
) -> TaskListResponse:
    """
    List all tasks for the authenticated user.

    Query parameters:
    - **status_filter**: Filter by completion status (all, pending, completed)
    - **sort**: Sort order (created, title, priority, due_date)
    - **priority_filter**: Filter by priority level (low, medium, high, critical)
    - **due_date_filter**: Filter by due date (overdue, today, this_week, all)
    - **tag_filter**: Filter by tag IDs (tasks with ANY of these tags)
    """
    # Task: T051 - Verify user access
    verify_user_access(request, user_id)

    # Delegate to service layer
    tasks = await TaskService.get_tasks(
        session,
        user_id,
        status_filter,
        sort,
        priority_filter,
        due_date_filter,
        tag_filter
    )

    # Load tags for each task
    task_responses = []
    for task in tasks:
        tags = await TagService.get_task_tags(session, task.id)
        task_dict = TaskResponse.model_validate(task).model_dump()
        task_dict["tags"] = [TagResponseSchema.model_validate(tag) for tag in tags]
        task_responses.append(TaskResponse(**task_dict))

    return TaskListResponse(tasks=task_responses, count=len(task_responses))


# Task: T054-T057 - POST /api/{user_id}/tasks (Create Task)
@router.post(
    "/{user_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    description="Create a new task for the authenticated user",
    responses={
        201: {"description": "Task created successfully"},
        400: {"description": "Invalid task data"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "User ID in path doesn't match JWT"},
    },
)
async def create_task(
    user_id: str,
    task_data: TaskCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> TaskResponse:
    """
    Create a new task for the authenticated user.

    Requires:
    - **title**: Task title (1-200 characters, not empty)
    - **description**: Optional task details
    """
    # Task: T055 - Verify user access
    verify_user_access(request, user_id)

    # Delegate to service layer
    task = await TaskService.create_task(session, user_id, task_data)

    # Tags will be empty for newly created tasks
    task_dict = TaskResponse.model_validate(task).model_dump()
    task_dict["tags"] = []
    return TaskResponse(**task_dict)


# Task: T058-T061 - GET /api/{user_id}/tasks/{task_id} (Get Task)
@router.get(
    "/{user_id}/tasks/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a specific task",
    description="Retrieve a single task by ID for the authenticated user",
    responses={
        200: {"description": "Task found"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "User ID in path doesn't match JWT"},
        404: {"description": "Task not found or doesn't belong to user"},
    },
)
async def get_task(
    user_id: str,
    task_id: int,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> TaskResponse:
    """
    Get a specific task by ID.

    Returns 404 if the task doesn't exist or doesn't belong to the user.
    """
    # Task: T059 - Verify user access
    verify_user_access(request, user_id)

    try:
        task = await TaskService.get_task(session, user_id, task_id)
        tags = await TagService.get_task_tags(session, task.id)
        task_dict = TaskResponse.model_validate(task).model_dump()
        task_dict["tags"] = [TagResponseSchema.model_validate(tag) for tag in tags]
        return TaskResponse(**task_dict)
    except TaskNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


# Task: T062-T066 - PUT /api/{user_id}/tasks/{task_id} (Update Task)
@router.put(
    "/{user_id}/tasks/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a task",
    description="Update an existing task for the authenticated user",
    responses={
        200: {"description": "Task updated successfully"},
        400: {"description": "No update fields provided"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "User ID in path doesn't match JWT"},
        404: {"description": "Task not found or doesn't belong to user"},
    },
)
async def update_task(
    user_id: str,
    task_id: int,
    task_data: TaskUpdate,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> TaskResponse:
    """
    Update an existing task.

    All fields are optional - only provided fields will be updated:
    - **title**: New task title
    - **description**: New task description
    - **completed**: New completion status
    """
    # Task: T064 - Verify user access
    verify_user_access(request, user_id)

    # Task: T063 - Validate at least one field provided
    if (task_data.title is None and
        task_data.description is None and
        task_data.completed is None and
        task_data.due_date is None and
        task_data.priority is None and
        task_data.status is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided for update",
        )

    try:
        task = await TaskService.update_task(session, user_id, task_id, task_data)
        tags = await TagService.get_task_tags(session, task.id)
        task_dict = TaskResponse.model_validate(task).model_dump()
        task_dict["tags"] = [TagResponseSchema.model_validate(tag) for tag in tags]
        return TaskResponse(**task_dict)
    except TaskNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


# Task: T067-T070 - DELETE /api/{user_id}/tasks/{task_id} (Delete Task)
@router.delete(
    "/{user_id}/tasks/{task_id}",
    response_model=DeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a task",
    description="Permanently delete a task for the authenticated user",
    responses={
        200: {"description": "Task deleted successfully"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "User ID in path doesn't match JWT"},
        404: {"description": "Task not found or doesn't belong to user"},
    },
)
async def delete_task(
    user_id: str,
    task_id: int,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> DeleteResponse:
    """
    Permanently delete a task.

    This action cannot be undone.
    """
    # Task: T068 - Verify user access
    verify_user_access(request, user_id)

    try:
        deleted_id = await TaskService.delete_task(session, user_id, task_id)
        return DeleteResponse(
            message=f"Task {deleted_id} deleted successfully",
            deleted_id=deleted_id,
        )
    except TaskNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


# Task: T071-T074 - PATCH /api/{user_id}/tasks/{task_id}/complete (Toggle Completion)
@router.patch(
    "/{user_id}/tasks/{task_id}/complete",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Toggle task completion",
    description="Toggle the completion status of a task (completed ↔ pending)",
    responses={
        200: {"description": "Task completion toggled successfully"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "User ID in path doesn't match JWT"},
        404: {"description": "Task not found or doesn't belong to user"},
    },
)
async def toggle_completion(
    user_id: str,
    task_id: int,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> TaskResponse:
    """
    Toggle task completion status.

    If the task is completed, it becomes pending.
    If the task is pending, it becomes completed.
    """
    # Task: T072 - Verify user access
    verify_user_access(request, user_id)

    try:
        task = await TaskService.toggle_completion(session, user_id, task_id)
        tags = await TagService.get_task_tags(session, task.id)
        task_dict = TaskResponse.model_validate(task).model_dump()
        task_dict["tags"] = [TagResponseSchema.model_validate(tag) for tag in tags]
        return TaskResponse(**task_dict)
    except TaskNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


# PATCH /api/{user_id}/tasks/{task_id}/status (Change Status)
@router.patch(
    "/{user_id}/tasks/{task_id}/status",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Change task status",
    description="Update the status of a task (backlog, in_progress, blocked, done)",
    responses={
        200: {"description": "Task status updated successfully"},
        400: {"description": "Invalid status value"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "User ID in path doesn't match JWT"},
        404: {"description": "Task not found or doesn't belong to user"},
    },
)
async def change_task_status(
    user_id: str,
    task_id: int,
    status_update: TaskStatusUpdate,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> TaskResponse:
    """
    Change the status of a task.

    Valid status values: backlog, in_progress, blocked, done
    """
    # Verify user access
    verify_user_access(request, user_id)

    try:
        task = await TaskService.change_status(session, user_id, task_id, status_update.status)
        tags = await TagService.get_task_tags(session, task.id)
        task_dict = TaskResponse.model_validate(task).model_dump()
        task_dict["tags"] = [TagResponseSchema.model_validate(tag) for tag in tags]
        return TaskResponse(**task_dict)
    except TaskNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.get(
    "/{user_id}/tasks/grouped",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get tasks grouped by status",
    description="Get tasks grouped by status for kanban view",
    responses={
        200: {"description": "Tasks grouped by status"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "User ID in path doesn't match JWT"},
    },
)
async def get_grouped_tasks(
    user_id: str,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get tasks grouped by status (backlog, in_progress, blocked, done).
    """
    verify_user_access(request, user_id)

    grouped = await TaskService.get_tasks_grouped_by_status(session, user_id)

    # Convert to response format with tags
    result = {}
    for status_key, tasks in grouped.items():
        task_responses = []
        for task in tasks:
            tags = await TagService.get_task_tags(session, task.id)
            task_dict = TaskResponse.model_validate(task).model_dump()
            task_dict["tags"] = [TagResponseSchema.model_validate(tag) for tag in tags]
            task_responses.append(task_dict)
        result[status_key] = task_responses

    return result
