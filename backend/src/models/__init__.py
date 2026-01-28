"""
Models package.

Import all models here to ensure they're registered with SQLModel metadata.
"""

from src.models.task import Task
from src.models.user import User

__all__ = ["Task", "User"]
