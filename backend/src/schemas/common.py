"""
Task: T023
Common Pydantic schemas for API responses.
"""

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error response format."""

    detail: str = Field(..., description="Error message")


class DeleteResponse(BaseModel):
    """Response for successful delete operations."""

    message: str = Field(..., description="Success message")
    deleted_id: int = Field(..., description="ID of deleted resource")
