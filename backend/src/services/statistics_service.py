"""
Statistics service for calculating task completion metrics and streaks.
"""

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.completion import TaskCompletion
from src.models.task import Task
from src.schemas.statistics import (
    DayStatistics,
    StreakInfo,
    TaskStatistics,
    UserStatisticsResponse,
    WeeklyStatistics,
)


class StatisticsService:
    """Service layer for statistics calculations."""

    @staticmethod
    async def get_user_statistics(
        session: AsyncSession,
        user_id: str
    ) -> UserStatisticsResponse:
        """
        Get comprehensive statistics for a user.

        Includes:
        - Overall task statistics (total, completed, pending, completion rate)
        - Streak information (current, longest)
        - Weekly completion chart
        """
        # Get overall task statistics
        task_stats = await StatisticsService._get_task_statistics(session, user_id)

        # Get streak information
        streak_info = await StatisticsService._calculate_streaks(session, user_id)

        # Get weekly statistics
        weekly_stats = await StatisticsService._get_weekly_statistics(session, user_id)

        return UserStatisticsResponse(
            statistics=task_stats,
            streak=streak_info,
            weekly=weekly_stats
        )

    @staticmethod
    async def _get_task_statistics(
        session: AsyncSession,
        user_id: str
    ) -> TaskStatistics:
        """Calculate overall task statistics."""
        # Total tasks
        total_result = await session.execute(
            select(func.count(Task.id)).where(Task.user_id == user_id)
        )
        total_tasks = total_result.scalar() or 0

        # Completed tasks
        completed_result = await session.execute(
            select(func.count(Task.id)).where(
                Task.user_id == user_id,
                Task.status == "done"
            )
        )
        completed_tasks = completed_result.scalar() or 0

        # Pending tasks
        pending_tasks = total_tasks - completed_tasks

        # Completion rate
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0

        # Total completion events (from task_completions table)
        completions_result = await session.execute(
            select(func.count(TaskCompletion.id)).where(
                TaskCompletion.user_id == user_id
            )
        )
        total_completions = completions_result.scalar() or 0

        return TaskStatistics(
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            pending_tasks=pending_tasks,
            completion_rate=round(completion_rate, 1),
            total_completions=total_completions
        )

    @staticmethod
    async def _calculate_streaks(
        session: AsyncSession,
        user_id: str
    ) -> StreakInfo:
        """
        Calculate current and longest streaks.

        A streak is consecutive days with at least one task completion.
        """
        # Get all distinct completion dates, ordered descending
        statement = select(
            func.date(TaskCompletion.completed_at).label("completion_date")
        ).where(
            TaskCompletion.user_id == user_id
        ).group_by(
            func.date(TaskCompletion.completed_at)
        ).order_by(
            func.date(TaskCompletion.completed_at).desc()
        )

        result = await session.execute(statement)
        completion_dates = [row[0] for row in result.fetchall()]

        if not completion_dates:
            return StreakInfo(
                current_streak=0,
                longest_streak=0,
                last_completion_date=None
            )

        # Calculate current streak
        current_streak = 0
        today = datetime.utcnow().date()
        expected_date = today

        for completion_date in completion_dates:
            if completion_date == expected_date:
                current_streak += 1
                expected_date = expected_date - timedelta(days=1)
            elif completion_date == expected_date + timedelta(days=1) and current_streak == 0:
                # Allow for today not having completions yet
                current_streak += 1
                expected_date = completion_date - timedelta(days=1)
            else:
                break

        # Calculate longest streak
        longest_streak = 1
        temp_streak = 1
        prev_date: Optional[datetime] = None

        for completion_date in reversed(completion_dates):
            if prev_date is None:
                prev_date = completion_date
                continue

            # Check if dates are consecutive
            if completion_date == prev_date + timedelta(days=1):
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 1

            prev_date = completion_date

        return StreakInfo(
            current_streak=current_streak,
            longest_streak=longest_streak,
            last_completion_date=completion_dates[0].isoformat() if completion_dates else None
        )

    @staticmethod
    async def _get_weekly_statistics(
        session: AsyncSession,
        user_id: str
    ) -> WeeklyStatistics:
        """
        Get completion statistics for the current week.

        Returns daily completion counts for the last 7 days.
        """
        today = datetime.utcnow().date()
        week_start = today - timedelta(days=6)  # Last 7 days including today

        # Get completions for the week
        statement = select(
            func.date(TaskCompletion.completed_at).label("completion_date"),
            func.count(TaskCompletion.id).label("count")
        ).where(
            TaskCompletion.user_id == user_id,
            func.date(TaskCompletion.completed_at) >= week_start,
            func.date(TaskCompletion.completed_at) <= today
        ).group_by(
            func.date(TaskCompletion.completed_at)
        )

        result = await session.execute(statement)
        completions_by_date = {row[0]: row[1] for row in result.fetchall()}

        # Build daily statistics
        days = []
        total_week = 0
        current_date = week_start

        while current_date <= today:
            count = completions_by_date.get(current_date, 0)
            days.append(DayStatistics(
                date=current_date.isoformat(),
                completed_count=count
            ))
            total_week += count
            current_date += timedelta(days=1)

        return WeeklyStatistics(
            week_start=week_start.isoformat(),
            days=days,
            total=total_week
        )

    @staticmethod
    async def log_completion(
        session: AsyncSession,
        user_id: str,
        task_id: int,
        duration_minutes: Optional[int] = None
    ) -> TaskCompletion:
        """
        Log a task completion event.

        This is called when a task is marked as done.
        """
        completion = TaskCompletion(
            user_id=user_id,
            task_id=task_id,
            duration_minutes=duration_minutes
        )
        session.add(completion)
        await session.commit()
        await session.refresh(completion)
        return completion
