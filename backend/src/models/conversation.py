# Task: T005
"""
Conversation Model

SQLModel for conversation threads between users and AI assistant.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from src.models.message import Message


class Conversation(SQLModel, table=True):
    """
    Conversation thread between user and AI assistant.

    Attributes:
        id: Unique conversation identifier
        user_id: User who owns this conversation (foreign key to users.id)
        created_at: When conversation was created
        updated_at: When conversation was last updated (on new message)
        messages: Related messages in this conversation
    """

    __tablename__ = "conversations"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    messages: list["Message"] = Relationship(back_populates="conversation")
