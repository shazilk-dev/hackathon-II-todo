"""
Task: T021
Task model for todo items with user isolation.
"""

from datetime import datetime
from typing import Literal, Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from src.models.base import TimestampMixin

if TYPE_CHECKING:
    from src.models.tag import TaskTag

# Priority type for tasks
PriorityType = Literal["low", "medium", "high", "critical"]

# Status type for tasks
StatusType = Literal["backlog", "in_progress", "blocked", "done"]


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
    due_date: Optional[datetime] = Field(
        default=None,
        index=True,
        description="Task due date/deadline"
    )
    priority: str = Field(
        default="medium",
        max_length=10,
        index=True,
        description="Task priority level (low, medium, high, critical)"
    )
    status: str = Field(
        default="backlog",
        max_length=20,
        index=True,
        description="Task status (backlog, in_progress, blocked, done)"
    )

    # Relationships for eager loading (prevents N+1 queries)
    task_tags: list["TaskTag"] = Relationship(back_populates="task_rel")

    # created_at and updated_at inherited from TimestampMixin

    @property
    def is_completed(self) -> bool:
        """
        Backwards compatibility property.

        Returns True if status is 'done', False otherwise.
        This maintains compatibility with code using the completed field.
        """
        return self.status == "done"
