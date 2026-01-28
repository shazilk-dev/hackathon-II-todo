"""
Focus session service for Pomodoro timer tracking.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.completion import FocusSession
from src.schemas.statistics import (
    FocusSessionCreate,
    FocusSessionUpdate,
)


class FocusService:
    """Service layer for focus session management."""

    @staticmethod
    async def start_session(
        session: AsyncSession,
        user_id: str,
        session_data: FocusSessionCreate
    ) -> FocusSession:
        """
        Start a new focus session.

        Creates a focus session record with started_at timestamp.
        Session is marked as incomplete initially.
        """
        focus_session = FocusSession(
            user_id=user_id,
            task_id=session_data.task_id,
            duration_minutes=session_data.duration_minutes,
            completed=False
        )
        session.add(focus_session)
        await session.commit()
        await session.refresh(focus_session)
        return focus_session

    @staticmethod
    async def end_session(
        session: AsyncSession,
        user_id: str,
        session_id: int,
        update_data: FocusSessionUpdate
    ) -> Optional[FocusSession]:
        """
        End a focus session and optionally add notes.

        Sets ended_at timestamp and marks as completed (or interrupted).
        """
        # Find the session
        statement = select(FocusSession).where(
            FocusSession.id == session_id,
            FocusSession.user_id == user_id
        )
        result = await session.execute(statement)
        focus_session = result.scalar_one_or_none()

        if not focus_session:
            return None

        # Update session
        focus_session.ended_at = datetime.utcnow()
        if update_data.completed is not None:
            focus_session.completed = update_data.completed
        if update_data.notes is not None:
            focus_session.notes = update_data.notes

        session.add(focus_session)
        await session.commit()
        await session.refresh(focus_session)
        return focus_session

    @staticmethod
    async def get_active_session(
        session: AsyncSession,
        user_id: str
    ) -> Optional[FocusSession]:
        """
        Get the currently active focus session for a user.

        Returns the most recent session without an ended_at timestamp.
        """
        statement = select(FocusSession).where(
            FocusSession.user_id == user_id,
            FocusSession.ended_at.is_(None)
        ).order_by(FocusSession.started_at.desc())

        result = await session.execute(statement)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_sessions(
        session: AsyncSession,
        user_id: str,
        limit: int = 10
    ) -> list[FocusSession]:
        """
        Get recent focus sessions for a user.

        Returns sessions ordered by started_at descending.
        """
        statement = select(FocusSession).where(
            FocusSession.user_id == user_id
        ).order_by(
            FocusSession.started_at.desc()
        ).limit(limit)

        result = await session.execute(statement)
        return list(result.scalars().all())

    @staticmethod
    async def get_task_sessions(
        session: AsyncSession,
        user_id: str,
        task_id: int
    ) -> list[FocusSession]:
        """
        Get all focus sessions for a specific task.

        Returns sessions ordered by started_at descending.
        """
        statement = select(FocusSession).where(
            FocusSession.user_id == user_id,
            FocusSession.task_id == task_id
        ).order_by(
            FocusSession.started_at.desc()
        )

        result = await session.execute(statement)
        return list(result.scalars().all())
