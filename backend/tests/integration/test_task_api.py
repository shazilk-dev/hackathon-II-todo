"""
Task: T101-T131
Integration tests for Task API endpoints.

Tests API + database integration with real HTTP requests.
"""

import pytest
from httpx import AsyncClient

from src.models.task import Task
from src.models.user import User


@pytest.mark.integration
class TestHealthCheck:
    """Tests for health check endpoint"""

    async def test_health_check_no_auth_required(self, client: AsyncClient) -> None:
        """Health check should work without authentication"""
        response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


@pytest.mark.integration
class TestListTasks:
    """Tests for GET /api/{user_id}/tasks"""

    async def test_list_tasks_requires_auth(
        self,
        client: AsyncClient,
        test_user: User,
    ) -> None:
        """Task: T101 - Reject request without JWT"""
        response = await client.get(f"/api/{test_user.id}/tasks")

        assert response.status_code == 401

    async def test_list_tasks_rejects_mismatched_user_id(
        self,
        client: AsyncClient,
        test_user: User,
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T102 - Reject when path user_id doesn't match JWT"""
        response = await client.get("/api/different-user/tasks", headers=auth_headers)

        assert response.status_code == 403

    async def test_list_tasks_success(
        self,
        client: AsyncClient,
        test_user: User,
        multiple_test_tasks: list[Task],
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T103 - List all tasks successfully"""
        response = await client.get(f"/api/{test_user.id}/tasks", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 3
        assert len(data["tasks"]) == 3

    async def test_list_tasks_filter_pending(
        self,
        client: AsyncClient,
        test_user: User,
        multiple_test_tasks: list[Task],
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T104 - Filter by pending status"""
        response = await client.get(
            f"/api/{test_user.id}/tasks",
            params={"status_filter": "pending"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2
        assert all(not t["completed"] for t in data["tasks"])

    async def test_list_tasks_filter_completed(
        self,
        client: AsyncClient,
        test_user: User,
        multiple_test_tasks: list[Task],
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T105 - Filter by completed status"""
        response = await client.get(
            f"/api/{test_user.id}/tasks",
            params={"status_filter": "completed"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1
        assert data["tasks"][0]["completed"] is True

    async def test_list_tasks_sort_by_title(
        self,
        client: AsyncClient,
        test_user: User,
        multiple_test_tasks: list[Task],
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T106 - Sort by title alphabetically"""
        response = await client.get(
            f"/api/{test_user.id}/tasks",
            params={"sort": "title"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        titles = [t["title"] for t in data["tasks"]]
        assert titles == sorted(titles)


@pytest.mark.integration
class TestCreateTask:
    """Tests for POST /api/{user_id}/tasks"""

    async def test_create_task_requires_auth(
        self,
        client: AsyncClient,
        test_user: User,
    ) -> None:
        """Task: T107 - Reject creation without JWT"""
        response = await client.post(
            f"/api/{test_user.id}/tasks",
            json={"title": "New Task"},
        )

        assert response.status_code == 401

    async def test_create_task_rejects_mismatched_user_id(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T108 - Reject when user_id mismatch"""
        response = await client.post(
            "/api/different-user/tasks",
            json={"title": "New Task"},
            headers=auth_headers,
        )

        assert response.status_code == 403

    async def test_create_task_success(
        self,
        client: AsyncClient,
        test_user: User,
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T109 - Create task successfully"""
        response = await client.post(
            f"/api/{test_user.id}/tasks",
            json={"title": "New Task", "description": "Test"},
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "New Task"
        assert data["description"] == "Test"
        assert data["completed"] is False
        assert "id" in data

    async def test_create_task_validates_empty_title(
        self,
        client: AsyncClient,
        test_user: User,
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T110 - Reject empty title"""
        response = await client.post(
            f"/api/{test_user.id}/tasks",
            json={"title": "   "},
            headers=auth_headers,
        )

        assert response.status_code == 422


@pytest.mark.integration
class TestGetTask:
    """Tests for GET /api/{user_id}/tasks/{task_id}"""

    async def test_get_task_success(
        self,
        client: AsyncClient,
        test_user: User,
        test_task: Task,
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T111 - Get specific task"""
        response = await client.get(
            f"/api/{test_user.id}/tasks/{test_task.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_task.id
        assert data["title"] == test_task.title

    async def test_get_task_not_found(
        self,
        client: AsyncClient,
        test_user: User,
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T112 - Return 404 for non-existent task"""
        response = await client.get(
            f"/api/{test_user.id}/tasks/99999",
            headers=auth_headers,
        )

        assert response.status_code == 404


@pytest.mark.integration
class TestUpdateTask:
    """Tests for PUT /api/{user_id}/tasks/{task_id}"""

    async def test_update_task_title(
        self,
        client: AsyncClient,
        test_user: User,
        test_task: Task,
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T113 - Update task title"""
        response = await client.put(
            f"/api/{test_user.id}/tasks/{test_task.id}",
            json={"title": "Updated"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated"

    async def test_update_task_requires_at_least_one_field(
        self,
        client: AsyncClient,
        test_user: User,
        test_task: Task,
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T114 - Reject empty update"""
        response = await client.put(
            f"/api/{test_user.id}/tasks/{test_task.id}",
            json={},
            headers=auth_headers,
        )

        assert response.status_code == 400


@pytest.mark.integration
class TestDeleteTask:
    """Tests for DELETE /api/{user_id}/tasks/{task_id}"""

    async def test_delete_task_success(
        self,
        client: AsyncClient,
        test_user: User,
        test_task: Task,
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T115 - Delete task successfully"""
        response = await client.delete(
            f"/api/{test_user.id}/tasks/{test_task.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["deleted_id"] == test_task.id

        # Verify task is deleted
        get_response = await client.get(
            f"/api/{test_user.id}/tasks/{test_task.id}",
            headers=auth_headers,
        )
        assert get_response.status_code == 404


@pytest.mark.integration
class TestToggleCompletion:
    """Tests for PATCH /api/{user_id}/tasks/{task_id}/complete"""

    async def test_toggle_completion_pending_to_completed(
        self,
        client: AsyncClient,
        test_user: User,
        test_task: Task,
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T116 - Toggle from pending to completed"""
        assert test_task.completed is False

        response = await client.patch(
            f"/api/{test_user.id}/tasks/{test_task.id}/complete",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["completed"] is True

    async def test_toggle_completion_idempotent(
        self,
        client: AsyncClient,
        test_user: User,
        test_task: Task,
        auth_headers: dict[str, str],
    ) -> None:
        """Task: T117 - Toggle twice returns to original state"""
        # First toggle
        await client.patch(
            f"/api/{test_user.id}/tasks/{test_task.id}/complete",
            headers=auth_headers,
        )

        # Second toggle
        response = await client.patch(
            f"/api/{test_user.id}/tasks/{test_task.id}/complete",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["completed"] is False  # Back to original
