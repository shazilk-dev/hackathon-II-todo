"""
Task: T033
API dependencies for dependency injection.

Re-exports common dependencies used across routers.
"""

from src.db.session import get_db

__all__ = ["get_db"]
