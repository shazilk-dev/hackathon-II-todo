"""
Schemas for statistics and focus sessions API.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


DurationType = Literal[5, 15, 25]


# Focus Session Schemas

class FocusSessionCreate(BaseModel):
    """Schema for creating a focus session."""

    task_id: int = Field(..., description="Task to focus on")
    duration_minutes: DurationType = Field(..., description="Session duration (5, 15, or 25 minutes)")


class FocusSessionUpdate(BaseModel):
    """Schema for updating a focus session (mark as complete, add notes)."""

    completed: Optional[bool] = Field(None, description="Whether session was completed")
    notes: Optional[str] = Field(None, description="Notes added during session")


class FocusSessionResponse(BaseModel):
    """Schema for focus session response."""

    id: int
    user_id: str
    task_id: int
    started_at: datetime
    ended_at: Optional[datetime]
    duration_minutes: int
    completed: bool
    notes: Optional[str]

    model_config = {"from_attributes": True}


# Statistics Schemas

class DayStatistics(BaseModel):
    """Statistics for a single day."""

    date: str = Field(..., description="Date in YYYY-MM-DD format")
    completed_count: int = Field(..., description="Tasks completed on this day")


class WeeklyStatistics(BaseModel):
    """Weekly task completion statistics."""

    week_start: str = Field(..., description="Week start date in YYYY-MM-DD format")
    days: list[DayStatistics] = Field(..., description="Daily completion counts for the week")
    total: int = Field(..., description="Total tasks completed in the week")


class StreakInfo(BaseModel):
    """Current streak information."""

    current_streak: int = Field(..., description="Current consecutive days with completions")
    longest_streak: int = Field(..., description="Longest streak ever achieved")
    last_completion_date: Optional[str] = Field(None, description="Date of last task completion (YYYY-MM-DD)")


class TaskStatistics(BaseModel):
    """Overall task statistics."""

    total_tasks: int = Field(..., description="Total number of tasks")
    completed_tasks: int = Field(..., description="Number of completed tasks")
    pending_tasks: int = Field(..., description="Number of pending tasks")
    completion_rate: float = Field(..., description="Percentage of completed tasks (0-100)")
    total_completions: int = Field(..., description="Total completion events (including repeated completions)")


class UserStatisticsResponse(BaseModel):
    """Complete user statistics response."""

    statistics: TaskStatistics = Field(..., description="Overall task statistics")
    streak: StreakInfo = Field(..., description="Streak information")
    weekly: WeeklyStatistics = Field(..., description="Current week's statistics")


# Task Completion Schemas

class TaskCompletionCreate(BaseModel):
    """Schema for logging a task completion."""

    task_id: int = Field(..., description="Completed task ID")
    duration_minutes: Optional[int] = Field(None, description="Time spent on task (optional)")


class TaskCompletionResponse(BaseModel):
    """Schema for task completion response."""

    id: int
    user_id: str
    task_id: int
    completed_at: datetime
    duration_minutes: Optional[int]

    model_config = {"from_attributes": True}
