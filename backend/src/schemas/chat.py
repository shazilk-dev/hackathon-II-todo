# Task: T008, T009, T010
"""
Chat API Request/Response Models

Pydantic models for chat endpoint validation and serialization.
"""

from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    """
    Request model for chat endpoint.

    Attributes:
        conversation_id: Optional existing conversation ID (null for new conversation)
        message: User's message text (1-1000 characters, non-whitespace)
    """

    conversation_id: int | None = Field(default=None, ge=1)
    message: str = Field(min_length=1, max_length=1000)

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        """Validate message is not empty or whitespace-only."""
        if not v.strip():
            raise ValueError("Message cannot be empty or whitespace")
        return v.strip()


class ToolCall(BaseModel):
    """
    Tool execution details for transparency.

    Attributes:
        tool: Name of the MCP tool that was called
        args: Arguments passed to the tool
        result: Result returned from the tool execution
    """

    tool: str
    args: dict
    result: dict


class ChatResponse(BaseModel):
    """
    Response model for chat endpoint.

    Attributes:
        conversation_id: The conversation ID (new or existing)
        response: AI assistant's natural language response
        tool_calls: List of tools invoked during message processing
    """

    conversation_id: int = Field(ge=1)
    response: str = Field(min_length=1)
    tool_calls: list[ToolCall] = Field(default_factory=list)

    model_config = {"from_attributes": True}
