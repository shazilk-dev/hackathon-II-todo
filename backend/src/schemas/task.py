"""
Task: T024
Pydantic schemas for Task API requests and responses.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TaskBase(BaseModel):
    """Base schema with common task fields."""

    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    description: Optional[str] = Field(None, description="Task details")


class TaskCreate(TaskBase):
    """Schema for creating a new task."""

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        """Validate title is not just whitespace."""
        if not v.strip():
            raise ValueError("Title cannot be empty or whitespace only")
        return v.strip()


class TaskUpdate(BaseModel):
    """
    Schema for updating an existing task.

    All fields are optional to support partial updates.
    """

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    completed: Optional[bool] = None

    @field_validator("title")
    @classmethod
    def title_not_empty_if_provided(cls, v: Optional[str]) -> Optional[str]:
        """Validate title if provided."""
        if v is not None and not v.strip():
            raise ValueError("Title cannot be empty or whitespace only")
        return v.strip() if v else None


class TaskResponse(TaskBase):
    """Schema for task responses (single task)."""

    id: int
    user_id: str
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    """Schema for list tasks response."""

    tasks: list[TaskResponse]
    count: int = Field(..., description="Total number of tasks returned")
