"""
Task: T026
Custom application exceptions.

These are domain-level exceptions that get translated to
HTTP exceptions in the API layer.
"""


class TaskNotFoundError(Exception):
    """
    Raised when a requested task does not exist or user doesn't have access.

    API layer translates this to 404 Not Found.
    """

    def __init__(self, task_id: int, user_id: str) -> None:
        self.task_id = task_id
        self.user_id = user_id
        super().__init__(f"Task {task_id} not found for user {user_id}")
