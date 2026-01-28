"""
Comprehensive tests for task CRUD API endpoints.

Tests all 6 task endpoints with success and error cases:
- GET /api/{user_id}/tasks - List tasks
- POST /api/{user_id}/tasks - Create task
- GET /api/{user_id}/tasks/{task_id} - Get single task
- PUT /api/{user_id}/tasks/{task_id} - Update task
- DELETE /api/{user_id}/tasks/{task_id} - Delete task
- PATCH /api/{user_id}/tasks/{task_id}/complete - Toggle completion
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.task import Task


class TestListTasks:
    """Test GET /api/{user_id}/tasks endpoint."""

    @pytest.mark.integration
    async def test_list_tasks_empty(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
    ):
        """Should return empty list when user has no tasks."""
        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["tasks"] == []
        assert data["count"] == 0

    @pytest.mark.integration
    async def test_list_tasks_with_data(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
        multiple_test_tasks: list[Task],
    ):
        """Should return all tasks for the user."""
        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 3
        assert len(data["tasks"]) == 3

    @pytest.mark.integration
    async def test_list_tasks_filter_pending(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
        multiple_test_tasks: list[Task],
    ):
        """Should filter tasks by pending status."""
        response = await client.get(
            f"/api/{test_user_id}/tasks?status_filter=pending",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2
        for task in data["tasks"]:
            assert task["completed"] is False

    @pytest.mark.integration
    async def test_list_tasks_filter_completed(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
        multiple_test_tasks: list[Task],
    ):
        """Should filter tasks by completed status."""
        response = await client.get(
            f"/api/{test_user_id}/tasks?status_filter=completed",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1
        for task in data["tasks"]:
            assert task["completed"] is True

    @pytest.mark.integration
    async def test_list_tasks_user_isolation(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        other_user_id: str,
        other_user_headers: dict[str, str],
        test_task: Task,
    ):
        """Should not return tasks from other users."""
        # Try to access test_user's tasks with other_user's token
        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=other_user_headers,
        )

        assert response.status_code == 403
        assert "Access denied" in response.json()["detail"]

    @pytest.mark.integration
    async def test_list_tasks_no_auth(
        self,
        client: AsyncClient,
        test_user_id: str,
    ):
        """Should return 401 without authentication."""
        response = await client.get(f"/api/{test_user_id}/tasks")

        assert response.status_code == 401
        assert "authorization" in response.json()["detail"].lower()


class TestCreateTask:
    """Test POST /api/{user_id}/tasks endpoint."""

    @pytest.mark.integration
    async def test_create_task_success(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
        task_create_payload: dict,
    ):
        """Should create a new task successfully."""
        response = await client.post(
            f"/api/{test_user_id}/tasks",
            headers=auth_headers,
            json=task_create_payload,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == task_create_payload["title"]
        assert data["description"] == task_create_payload["description"]
        assert data["completed"] is False
        assert data["user_id"] == test_user_id
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    @pytest.mark.integration
    async def test_create_task_minimal(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
    ):
        """Should create task with only title (description optional)."""
        payload = {"title": "Minimal Task"}

        response = await client.post(
            f"/api/{test_user_id}/tasks",
            headers=auth_headers,
            json=payload,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Minimal Task"
        assert data["description"] is None

    @pytest.mark.integration
    async def test_create_task_empty_title(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
    ):
        """Should reject task with empty title."""
        payload = {"title": ""}

        response = await client.post(
            f"/api/{test_user_id}/tasks",
            headers=auth_headers,
            json=payload,
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.integration
    async def test_create_task_title_too_long(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
    ):
        """Should reject task with title > 200 characters."""
        payload = {"title": "x" * 201}

        response = await client.post(
            f"/api/{test_user_id}/tasks",
            headers=auth_headers,
            json=payload,
        )

        assert response.status_code == 422

    @pytest.mark.integration
    async def test_create_task_user_isolation(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        other_user_headers: dict[str, str],
        task_create_payload: dict,
    ):
        """Should prevent creating tasks for other users."""
        response = await client.post(
            f"/api/{test_user_id}/tasks",
            headers=other_user_headers,
            json=task_create_payload,
        )

        assert response.status_code == 403

    @pytest.mark.integration
    async def test_create_task_no_auth(
        self,
        client: AsyncClient,
        test_user_id: str,
        task_create_payload: dict,
    ):
        """Should return 401 without authentication."""
        response = await client.post(
            f"/api/{test_user_id}/tasks",
            json=task_create_payload,
        )

        assert response.status_code == 401


class TestGetTask:
    """Test GET /api/{user_id}/tasks/{task_id} endpoint."""

    @pytest.mark.integration
    async def test_get_task_success(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
        test_task: Task,
    ):
        """Should retrieve a specific task."""
        response = await client.get(
            f"/api/{test_user_id}/tasks/{test_task.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_task.id
        assert data["title"] == test_task.title
        assert data["description"] == test_task.description
        assert data["completed"] == test_task.completed

    @pytest.mark.integration
    async def test_get_task_not_found(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
    ):
        """Should return 404 for non-existent task."""
        response = await client.get(
            f"/api/{test_user_id}/tasks/99999",
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.integration
    async def test_get_task_user_isolation(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        other_user_headers: dict[str, str],
        test_task: Task,
    ):
        """Should prevent accessing other users' tasks."""
        response = await client.get(
            f"/api/{test_user_id}/tasks/{test_task.id}",
            headers=other_user_headers,
        )

        assert response.status_code == 403

    @pytest.mark.integration
    async def test_get_task_no_auth(
        self,
        client: AsyncClient,
        test_user_id: str,
        test_task: Task,
    ):
        """Should return 401 without authentication."""
        response = await client.get(f"/api/{test_user_id}/tasks/{test_task.id}")

        assert response.status_code == 401


class TestUpdateTask:
    """Test PUT /api/{user_id}/tasks/{task_id} endpoint."""

    @pytest.mark.integration
    async def test_update_task_all_fields(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
        test_task: Task,
        task_update_payload: dict,
    ):
        """Should update all task fields."""
        response = await client.put(
            f"/api/{test_user_id}/tasks/{test_task.id}",
            headers=auth_headers,
            json=task_update_payload,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == task_update_payload["title"]
        assert data["description"] == task_update_payload["description"]
        assert data["id"] == test_task.id

    @pytest.mark.integration
    async def test_update_task_title_only(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
        test_task: Task,
    ):
        """Should update only title field."""
        payload = {"title": "New Title Only"}

        response = await client.put(
            f"/api/{test_user_id}/tasks/{test_task.id}",
            headers=auth_headers,
            json=payload,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "New Title Only"
        assert data["description"] == test_task.description  # Unchanged

    @pytest.mark.integration
    async def test_update_task_completion_status(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
        test_task: Task,
    ):
        """Should update completion status."""
        payload = {"completed": True}

        response = await client.put(
            f"/api/{test_user_id}/tasks/{test_task.id}",
            headers=auth_headers,
            json=payload,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["completed"] is True

    @pytest.mark.integration
    async def test_update_task_empty_payload(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
        test_task: Task,
    ):
        """Should reject update with no fields provided."""
        response = await client.put(
            f"/api/{test_user_id}/tasks/{test_task.id}",
            headers=auth_headers,
            json={},
        )

        assert response.status_code == 400
        assert "at least one field" in response.json()["detail"].lower()

    @pytest.mark.integration
    async def test_update_task_not_found(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
    ):
        """Should return 404 for non-existent task."""
        payload = {"title": "Updated"}

        response = await client.put(
            f"/api/{test_user_id}/tasks/99999",
            headers=auth_headers,
            json=payload,
        )

        assert response.status_code == 404

    @pytest.mark.integration
    async def test_update_task_user_isolation(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        other_user_headers: dict[str, str],
        test_task: Task,
    ):
        """Should prevent updating other users' tasks."""
        payload = {"title": "Hacked"}

        response = await client.put(
            f"/api/{test_user_id}/tasks/{test_task.id}",
            headers=other_user_headers,
            json=payload,
        )

        assert response.status_code == 403

    @pytest.mark.integration
    async def test_update_task_no_auth(
        self,
        client: AsyncClient,
        test_user_id: str,
        test_task: Task,
    ):
        """Should return 401 without authentication."""
        response = await client.put(
            f"/api/{test_user_id}/tasks/{test_task.id}",
            json={"title": "Updated"},
        )

        assert response.status_code == 401


class TestDeleteTask:
    """Test DELETE /api/{user_id}/tasks/{task_id} endpoint."""

    @pytest.mark.integration
    async def test_delete_task_success(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
        test_task: Task,
        test_db: AsyncSession,
    ):
        """Should delete task successfully."""
        response = await client.delete(
            f"/api/{test_user_id}/tasks/{test_task.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["deleted_id"] == test_task.id
        assert "deleted successfully" in data["message"].lower()

        # Verify task is actually deleted from database
        from sqlmodel import select

        result = await test_db.execute(select(Task).where(Task.id == test_task.id))
        deleted_task = result.scalar_one_or_none()
        assert deleted_task is None

    @pytest.mark.integration
    async def test_delete_task_not_found(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
    ):
        """Should return 404 for non-existent task."""
        response = await client.delete(
            f"/api/{test_user_id}/tasks/99999",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.integration
    async def test_delete_task_user_isolation(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        other_user_headers: dict[str, str],
        test_task: Task,
    ):
        """Should prevent deleting other users' tasks."""
        response = await client.delete(
            f"/api/{test_user_id}/tasks/{test_task.id}",
            headers=other_user_headers,
        )

        assert response.status_code == 403

    @pytest.mark.integration
    async def test_delete_task_no_auth(
        self,
        client: AsyncClient,
        test_user_id: str,
        test_task: Task,
    ):
        """Should return 401 without authentication."""
        response = await client.delete(f"/api/{test_user_id}/tasks/{test_task.id}")

        assert response.status_code == 401


class TestToggleCompletion:
    """Test PATCH /api/{user_id}/tasks/{task_id}/complete endpoint."""

    @pytest.mark.integration
    async def test_toggle_completion_pending_to_completed(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
        test_task: Task,
    ):
        """Should toggle pending task to completed."""
        assert test_task.completed is False

        response = await client.patch(
            f"/api/{test_user_id}/tasks/{test_task.id}/complete",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["completed"] is True
        assert data["id"] == test_task.id

    @pytest.mark.integration
    async def test_toggle_completion_completed_to_pending(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
        test_db: AsyncSession,
    ):
        """Should toggle completed task back to pending."""
        # Create completed task
        completed_task = Task(
            user_id=test_user_id,
            title="Completed Task",
            completed=True,
        )
        test_db.add(completed_task)
        await test_db.commit()
        await test_db.refresh(completed_task)

        response = await client.patch(
            f"/api/{test_user_id}/tasks/{completed_task.id}/complete",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["completed"] is False

    @pytest.mark.integration
    async def test_toggle_completion_not_found(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        auth_headers: dict[str, str],
    ):
        """Should return 404 for non-existent task."""
        response = await client.patch(
            f"/api/{test_user_id}/tasks/99999/complete",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.integration
    async def test_toggle_completion_user_isolation(
        self,
        client: AsyncClient,
        test_user: Task,
        test_user_id: str,
        other_user_headers: dict[str, str],
        test_task: Task,
    ):
        """Should prevent toggling other users' tasks."""
        response = await client.patch(
            f"/api/{test_user_id}/tasks/{test_task.id}/complete",
            headers=other_user_headers,
        )

        assert response.status_code == 403

    @pytest.mark.integration
    async def test_toggle_completion_no_auth(
        self,
        client: AsyncClient,
        test_user_id: str,
        test_task: Task,
    ):
        """Should return 401 without authentication."""
        response = await client.patch(
            f"/api/{test_user_id}/tasks/{test_task.id}/complete"
        )

        assert response.status_code == 401


class TestHealthCheck:
    """Test /health endpoint (public, no auth required)."""

    @pytest.mark.integration
    async def test_health_check(self, client: AsyncClient):
        """Should return health status without authentication."""
        response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "environment" in data
        assert "version" in data
