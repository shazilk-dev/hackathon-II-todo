"""
Pydantic schemas for Tag API requests and responses.
"""

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field, field_validator


class TagBase(BaseModel):
    """Base schema with common tag fields."""

    name: str = Field(..., min_length=1, max_length=50, description="Tag name")
    color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$", description="Tag color in hex format (#RRGGBB)")


class TagCreate(TagBase):
    """Schema for creating a new tag."""

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        """Validate name is not just whitespace."""
        if not v.strip():
            raise ValueError("Tag name cannot be empty or whitespace only")
        return v.strip()


class TagResponse(TagBase):
    """Schema for tag responses (single tag)."""

    id: int
    user_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TagListResponse(BaseModel):
    """Schema for list tags response."""

    tags: List[TagResponse]
    count: int = Field(..., description="Total number of tags returned")


class TaskTagsUpdate(BaseModel):
    """Schema for updating task tags."""

    tag_ids: List[int] = Field(..., description="List of tag IDs to assign to the task")
