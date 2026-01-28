"""
API routes for statistics and focus sessions.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_session
from src.schemas.statistics import (
    FocusSessionCreate,
    FocusSessionResponse,
    FocusSessionUpdate,
    UserStatisticsResponse,
)
from src.services.focus_service import FocusService
from src.services.statistics_service import StatisticsService

router = APIRouter(prefix="/api", tags=["statistics"])


# Statistics Endpoints

@router.get(
    "/{user_id}/statistics",
    response_model=UserStatisticsResponse,
    summary="Get user statistics"
)
async def get_statistics(
    user_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    Get comprehensive statistics for the authenticated user.

    Returns:
    - Overall task statistics (total, completed, pending, completion rate)
    - Streak information (current streak, longest streak)
    - Weekly completion chart (last 7 days)

    Requires JWT authentication.
    """
    # Verify user_id matches JWT
    if request.state.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Get statistics
    stats = await StatisticsService.get_user_statistics(session, user_id)
    return stats


# Focus Session Endpoints

@router.post(
    "/{user_id}/focus-sessions",
    response_model=FocusSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a focus session"
)
async def start_focus_session(
    user_id: str,
    session_data: FocusSessionCreate,
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    Start a new Pomodoro focus session.

    Creates a focus session record for tracking time spent on a task.
    Duration must be 5, 15, or 25 minutes.

    Requires JWT authentication.
    """
    # Verify user_id matches JWT
    if request.state.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create focus sessions for other users"
        )

    # Start session
    focus_session = await FocusService.start_session(session, user_id, session_data)
    return focus_session


@router.patch(
    "/{user_id}/focus-sessions/{session_id}",
    response_model=FocusSessionResponse,
    summary="End a focus session"
)
async def end_focus_session(
    user_id: str,
    session_id: int,
    update_data: FocusSessionUpdate,
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    End a focus session and optionally add notes.

    Marks the session as completed (or interrupted) and sets ended_at timestamp.

    Requires JWT authentication.
    """
    # Verify user_id matches JWT
    if request.state.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # End session
    focus_session = await FocusService.end_session(session, user_id, session_id, update_data)

    if not focus_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Focus session {session_id} not found"
        )

    return focus_session


@router.get(
    "/{user_id}/focus-sessions/active",
    response_model=FocusSessionResponse | None,
    summary="Get active focus session"
)
async def get_active_focus_session(
    user_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    Get the currently active focus session (if any).

    Returns None if no active session exists.

    Requires JWT authentication.
    """
    # Verify user_id matches JWT
    if request.state.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Get active session
    active_session = await FocusService.get_active_session(session, user_id)
    return active_session


@router.get(
    "/{user_id}/focus-sessions",
    response_model=list[FocusSessionResponse],
    summary="Get recent focus sessions"
)
async def get_focus_sessions(
    user_id: str,
    request: Request,
    limit: int = 10,
    task_id: int | None = None,
    session: AsyncSession = Depends(get_session)
):
    """
    Get recent focus sessions for the user.

    Optionally filter by task_id to see sessions for a specific task.

    Requires JWT authentication.
    """
    # Verify user_id matches JWT
    if request.state.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Get sessions
    if task_id:
        sessions = await FocusService.get_task_sessions(session, user_id, task_id)
    else:
        sessions = await FocusService.get_user_sessions(session, user_id, limit)

    return sessions
