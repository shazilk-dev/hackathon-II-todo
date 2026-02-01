"""
Task: T009, T010
Application configuration using Pydantic Settings.

Loads environment variables from .env file and provides
type-safe configuration access throughout the application.
"""

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = Field(
        ...,
        description="PostgreSQL connection string (asyncpg format)",
        examples=["postgresql+asyncpg://user:pass@host/db"],
    )

    # Authentication
    better_auth_secret: str = Field(
        ...,
        min_length=32,
        description="JWT secret key (MUST match Next.js Better Auth)",
    )

    # CORS
    cors_origins: str = Field(
        default="http://localhost:3000",
        description="Comma-separated list of allowed origins",
    )

    # Application
    environment: str = Field(
        default="development",
        pattern="^(development|staging|production)$",
    )
    debug: bool = Field(default=False, description="Enable debug mode and SQL logging")

    # OpenAI ChatKit
    openai_api_key: str = Field(
        ...,
        description="OpenAI API key for ChatKit session creation",
    )

    # API Metadata
    app_name: str = Field(default="Hackathon Todo API")
    app_version: str = Field(default="0.1.0")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """
        Parse comma-separated CORS origins into a list.

        Returns:
            List of allowed origin URLs (stripped of whitespace)
        """
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """
        Validate database URL format.

        Allows:
        - postgresql+asyncpg:// (production)
        - sqlite+aiosqlite:// (tests)
        """
        valid_prefixes = ("postgresql+asyncpg://", "sqlite+aiosqlite://")
        if not v.startswith(valid_prefixes):
            raise ValueError(
                f"DATABASE_URL must use asyncpg or aiosqlite driver: {valid_prefixes}"
            )
        return v


# Global settings instance
settings = Settings()
