"""
Task completion tracking model for statistics and streaks.
"""

from datetime import datetime
from typing import Literal, Optional

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlmodel import Field, SQLModel


DurationType = Literal[5, 15, 25]


class TaskCompletion(SQLModel, table=True):
    """
    Task completion record for tracking completion history and streaks.

    Each record represents one task completion event. Used to calculate:
    - Daily streaks (consecutive days with completions)
    - Task completion statistics
    - Weekly completion charts
    """

    __tablename__ = "task_completions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(
        sa_column=Column(
            String,
            ForeignKey("user.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        ),
        description="User who completed the task",
    )
    task_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("tasks.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        ),
        description="Completed task ID",
    )
    completed_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        index=True,
        description="When the task was completed"
    )
    duration_minutes: Optional[int] = Field(
        default=None,
        description="Time spent on task (optional, from focus sessions)"
    )


class FocusSession(SQLModel, table=True):
    """
    Focus session record for Pomodoro timer tracking.

    Tracks focus mode sessions where user concentrates on a single task.
    Supports different duration presets: 25min (standard), 15min (short), 5min (break).
    """

    __tablename__ = "focus_sessions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(
        sa_column=Column(
            String,
            ForeignKey("user.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        ),
        description="User who started the session",
    )
    task_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("tasks.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        ),
        description="Task being focused on",
    )
    started_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        index=True,
        description="Session start time"
    )
    ended_at: Optional[datetime] = Field(
        default=None,
        description="Session end time (null if still running)"
    )
    duration_minutes: int = Field(
        nullable=False,
        description="Planned duration (5, 15, or 25 minutes)"
    )
    completed: bool = Field(
        default=False,
        nullable=False,
        description="Whether session finished (vs interrupted)"
    )
    notes: Optional[str] = Field(
        default=None,
        description="Notes added during focus session"
    )
