"""
Task: T020
User model compatible with Better Auth schema.

NOTE: This table is managed by Better Auth (Next.js frontend).
The backend only reads from it for user_id validation.
"""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    """
    User model matching Better Auth schema.

    Schema uses camelCase naming to match Better Auth conventions.
    DO NOT modify this table structure - it's managed by Better Auth.
    """

    __tablename__ = "user"  # Better Auth uses singular 'user' table

    # Better Auth uses TEXT primary keys (UUID format)
    id: str = Field(primary_key=True)

    # User credentials (managed by Better Auth)
    email: str = Field(unique=True, index=True)
    name: str = Field(default="")  # Better Auth requires this (NOT NULL)
    emailVerified: bool = Field(default=False, sa_column_kwargs={"name": "emailVerified"})
    image: Optional[str] = Field(default=None)

    # Timestamps (camelCase to match Better Auth)
    createdAt: datetime = Field(sa_column_kwargs={"name": "createdAt"})
    updatedAt: datetime = Field(sa_column_kwargs={"name": "updatedAt"})
