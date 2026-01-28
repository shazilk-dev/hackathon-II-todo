"""
Task: T021
Task model for todo items with user isolation.
"""

from typing import Optional

from sqlmodel import Field, SQLModel

from src.models.base import TimestampMixin


class Task(TimestampMixin, table=True):
    """
    Task model for user todo items.

    Inherits created_at and updated_at from TimestampMixin.
    Enforces user data isolation via user_id foreign key.
    """

    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(
        foreign_key="user.id",  # References Better Auth's 'user' table
        index=True,
        nullable=False,
        description="Owner of the task (references user.id from Better Auth)",
    )
    title: str = Field(max_length=200, nullable=False, description="Task title")
    description: Optional[str] = Field(default=None, description="Task details")
    completed: bool = Field(default=False, index=True, description="Completion status")

    # created_at and updated_at inherited from TimestampMixin
