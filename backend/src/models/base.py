"""
Task: T019
Base model with timestamp mixin for created_at and updated_at fields.
"""

from datetime import datetime

from sqlmodel import Field, SQLModel


class TimestampMixin(SQLModel):
    """
    Mixin to add timestamp fields to models.

    Provides:
        - created_at: Set on record creation
        - updated_at: Set on record creation and updated on modification

    Note: Using datetime.utcnow() instead of datetime.now(timezone.utc)
    because PostgreSQL TIMESTAMP WITHOUT TIME ZONE expects timezone-naive datetimes.
    """

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )
