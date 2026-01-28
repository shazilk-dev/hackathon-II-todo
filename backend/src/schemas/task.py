"""
Task: T024
Pydantic schemas for Task API requests and responses.
"""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

# Priority type matching the model
PriorityType = Literal["low", "medium", "high", "critical"]

# Status type matching the model
StatusType = Literal["backlog", "in_progress", "blocked", "done"]


class TaskBase(BaseModel):
    """Base schema with common task fields."""

    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    description: Optional[str] = Field(None, description="Task details")
    due_date: Optional[datetime] = Field(None, description="Task due date")
    priority: PriorityType = Field(default="medium", description="Task priority level")
    status: StatusType = Field(default="backlog", description="Task status")


class TaskCreate(TaskBase):
    """Schema for creating a new task."""

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        """Validate title is not just whitespace."""
        if not v.strip():
            raise ValueError("Title cannot be empty or whitespace only")
        return v.strip()

    @field_validator("due_date")
    @classmethod
    def due_date_validator(cls, v: Optional[datetime]) -> Optional[datetime]:
        """
        Validate due_date (warning only, allow past dates).

        Past dates are allowed as users may want to track overdue tasks.
        """
        if v is not None and v < datetime.utcnow():
            # Warning only - don't raise error, just note it's in the past
            pass
        return v


class TaskUpdate(BaseModel):
    """
    Schema for updating an existing task.

    All fields are optional to support partial updates.
    """

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    completed: Optional[bool] = None
    due_date: Optional[datetime] = None
    priority: Optional[PriorityType] = None
    status: Optional[StatusType] = None

    @field_validator("title")
    @classmethod
    def title_not_empty_if_provided(cls, v: Optional[str]) -> Optional[str]:
        """Validate title if provided."""
        if v is not None and not v.strip():
            raise ValueError("Title cannot be empty or whitespace only")
        return v.strip() if v else None

    @field_validator("due_date")
    @classmethod
    def due_date_validator(cls, v: Optional[datetime]) -> Optional[datetime]:
        """Validate due_date (warning only, allow past dates)."""
        if v is not None and v < datetime.utcnow():
            # Warning only - past dates allowed
            pass
        return v


class TaskResponse(TaskBase):
    """Schema for task responses (single task)."""

    id: int
    user_id: str
    completed: bool
    created_at: datetime
    updated_at: datetime
    tags: List["TagResponseSimple"] = Field(default_factory=list, description="Tags associated with this task")

    model_config = {"from_attributes": True}


# Import TagResponseSimple to avoid circular imports
from src.schemas.tag import TagResponse as TagResponseSimple  # noqa: E402

# Update forward references
TaskResponse.model_rebuild()


class TaskListResponse(BaseModel):
    """Schema for list tasks response."""

    tasks: list[TaskResponse]
    count: int = Field(..., description="Total number of tasks returned")


class TaskStatusUpdate(BaseModel):
    """Schema for updating task status."""

    status: StatusType = Field(..., description="New status for the task")
