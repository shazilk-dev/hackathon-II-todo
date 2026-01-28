"""
API endpoints for tag CRUD operations.

All endpoints require JWT authentication and enforce user isolation.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db
from src.schemas.tag import TagCreate, TagListResponse, TagResponse, TaskTagsUpdate
from src.services.tag_service import TagService
from src.services.task_service import TaskService
from src.core.exceptions import TaskNotFoundError

router = APIRouter(prefix="/api", tags=["tags"])


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


@router.get(
    "/{user_id}/tags",
    response_model=TagListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all tags for user",
    description="Get all tags for the authenticated user",
    responses={
        200: {"description": "List of tags"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "User ID in path doesn't match JWT"},
    },
)
async def list_tags(
    user_id: str,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> TagListResponse:
    """
    List all tags for the authenticated user.
    """
    verify_user_access(request, user_id)

    tags = await TagService.get_user_tags(session, user_id)

    return TagListResponse(
        tags=[TagResponse.model_validate(t) for t in tags],
        count=len(tags)
    )


@router.post(
    "/{user_id}/tags",
    response_model=TagResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new tag",
    description="Create a new tag or return existing tag with same name",
    responses={
        201: {"description": "Tag created successfully"},
        400: {"description": "Invalid tag data"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "User ID in path doesn't match JWT"},
    },
)
async def create_tag(
    user_id: str,
    tag_data: TagCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> TagResponse:
    """
    Create a new tag or return existing tag with same name.

    Tags are deduplicated per user - if a tag with the same name exists,
    it will be returned (and color updated if different).
    """
    verify_user_access(request, user_id)

    tag = await TagService.get_or_create_tag(session, user_id, tag_data)

    return TagResponse.model_validate(tag)


@router.put(
    "/{user_id}/tasks/{task_id}/tags",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Update task tags",
    description="Set the tags for a task (replaces existing tags)",
    responses={
        200: {"description": "Task tags updated successfully"},
        400: {"description": "Invalid tag IDs"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "User ID in path doesn't match JWT"},
        404: {"description": "Task not found or doesn't belong to user"},
    },
)
async def update_task_tags(
    user_id: str,
    task_id: int,
    tags_update: TaskTagsUpdate,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> dict:
    """
    Set the tags for a task.

    This replaces all existing tag associations with the provided tag IDs.
    """
    verify_user_access(request, user_id)

    # Verify task exists and belongs to user
    try:
        await TaskService.get_task(session, user_id, task_id)
    except TaskNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    # Update task tags
    await TagService.add_tags_to_task(session, task_id, tags_update.tag_ids)

    return {"message": f"Task {task_id} tags updated successfully"}
