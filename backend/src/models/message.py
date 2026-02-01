# Task: T006
"""
Message Model

SQLModel for individual messages within conversations.
"""

import os
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Column, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from src.models.conversation import Conversation

# Use JSON for SQLite (tests), JSONB for PostgreSQL (production)
def _get_json_column_type():
    """Return JSON column type based on database."""
    db_url = os.getenv("DATABASE_URL", "")
    if "sqlite" in db_url.lower():
        return Column(JSON)
    return Column(JSONB)


class Message(SQLModel, table=True):
    """
    Individual message in a conversation.

    Attributes:
        id: Unique message identifier
        conversation_id: Conversation this message belongs to (foreign key)
        user_id: User who owns this message (denormalized for efficient queries)
        role: Message role - either "user" or "assistant"
        content: The actual message text content
        tool_calls: Optional JSON array containing tool execution details (JSONB)
        created_at: When message was created
        conversation: Related conversation object
    """

    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    user_id: str = Field(index=True)
    role: str = Field(max_length=20)  # "user" or "assistant"
    content: str
    tool_calls: Optional[list[dict]] = Field(default=None, sa_column=_get_json_column_type())
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    # Relationships
    conversation: "Conversation" = Relationship(back_populates="messages")
