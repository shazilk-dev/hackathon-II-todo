"""
Tag models for categorizing tasks.
"""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel

from src.models.base import TimestampMixin


class Tag(SQLModel, table=True):
    """
    Tag model for user-defined categories.

    Each user has their own set of tags (enforced by unique constraint).
    Tags can be assigned to multiple tasks (many-to-many via TaskTag).
    """

    __tablename__ = "tags"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(
        foreign_key="user.id",
        index=True,
        nullable=False,
        description="Owner of the tag (references user.id from Better Auth)",
    )
    name: str = Field(
        max_length=50,
        index=True,
        nullable=False,
        description="Tag name (unique per user)"
    )
    color: str = Field(
        max_length=7,
        nullable=False,
        description="Tag color in hex format (#RRGGBB)"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Tag creation timestamp"
    )


class TaskTag(SQLModel, table=True):
    """
    Junction table for many-to-many relationship between tasks and tags.
    """

    __tablename__ = "task_tags"

    task_id: int = Field(
        foreign_key="tasks.id",
        primary_key=True,
        index=True,
        description="Task ID"
    )
    tag_id: int = Field(
        foreign_key="tags.id",
        primary_key=True,
        index=True,
        description="Tag ID"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Association creation timestamp"
    )
