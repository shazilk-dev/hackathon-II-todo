"""
Tests for JWT authentication middleware.

Tests JWT token validation, error cases, and public endpoint access.
"""

import pytest
from httpx import AsyncClient

from src.models.user import User


class TestJWTAuthentication:
    """Test JWT middleware authentication."""

    @pytest.mark.integration
    async def test_valid_token_allows_access(
        self,
        client: AsyncClient,
        test_user: User,
        test_user_id: str,
        auth_headers: dict[str, str],
    ):
        """Should allow access with valid JWT token."""
        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=auth_headers,
        )

        assert response.status_code == 200

    @pytest.mark.integration
    async def test_missing_token_returns_401(
        self,
        client: AsyncClient,
        test_user_id: str,
    ):
        """Should return 401 when Authorization header is missing."""
        response = await client.get(f"/api/{test_user_id}/tasks")

        assert response.status_code == 401
        data = response.json()
        assert "authorization" in data["detail"].lower()

    @pytest.mark.integration
    async def test_invalid_token_format_returns_401(
        self,
        client: AsyncClient,
        test_user_id: str,
    ):
        """Should return 401 when Authorization header format is invalid."""
        # Missing 'Bearer ' prefix
        headers = {"Authorization": "InvalidToken"}

        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=headers,
        )

        assert response.status_code == 401
        data = response.json()
        assert "bearer" in data["detail"].lower()

    @pytest.mark.integration
    async def test_malformed_token_returns_401(
        self,
        client: AsyncClient,
        test_user_id: str,
        invalid_token: str,
    ):
        """Should return 401 when JWT token is malformed."""
        headers = {"Authorization": f"Bearer {invalid_token}"}

        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=headers,
        )

        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data["detail"].lower() or "expired" in data["detail"].lower()

    @pytest.mark.integration
    async def test_expired_token_returns_401(
        self,
        client: AsyncClient,
        test_user_id: str,
        expired_token: str,
    ):
        """Should return 401 when JWT token is expired."""
        headers = {"Authorization": f"Bearer {expired_token}"}

        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=headers,
        )

        assert response.status_code == 401
        data = response.json()
        assert "expired" in data["detail"].lower() or "invalid" in data["detail"].lower()

    @pytest.mark.integration
    async def test_token_with_missing_sub_claim_returns_401(
        self,
        client: AsyncClient,
        test_user_id: str,
    ):
        """Should return 401 when JWT token missing 'sub' claim."""
        from jose import jwt

        from src.config import settings

        # Create token without 'sub' claim
        payload = {
            "email": "test@example.com",
            "exp": 9999999999,
        }
        token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=headers,
        )

        assert response.status_code == 401
        data = response.json()
        assert "sub" in data["detail"].lower()


class TestPublicEndpoints:
    """Test that public endpoints don't require authentication."""

    @pytest.mark.integration
    async def test_health_endpoint_no_auth_required(self, client: AsyncClient):
        """Should allow access to /health without authentication."""
        response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    @pytest.mark.integration
    async def test_docs_endpoint_no_auth_required(self, client: AsyncClient):
        """Should allow access to /docs without authentication."""
        response = await client.get("/docs")

        # Should not return 401 (may return 200 or redirect)
        assert response.status_code != 401

    @pytest.mark.integration
    async def test_openapi_endpoint_no_auth_required(self, client: AsyncClient):
        """Should allow access to /openapi.json without authentication."""
        response = await client.get("/openapi.json")

        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data


class TestUserIsolation:
    """Test user data isolation enforcement."""

    @pytest.mark.integration
    async def test_cannot_access_other_user_tasks(
        self,
        client: AsyncClient,
        test_user: User,
        test_user_id: str,
        test_task,
        other_user_id: str,
        other_user_headers: dict[str, str],
    ):
        """Should prevent accessing tasks of a different user."""
        # User tries to access another user's task endpoint
        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=other_user_headers,
        )

        assert response.status_code == 403
        data = response.json()
        assert "access denied" in data["detail"].lower() or "cannot access" in data["detail"].lower()

    @pytest.mark.integration
    async def test_cannot_create_task_for_other_user(
        self,
        client: AsyncClient,
        test_user: User,
        test_user_id: str,
        other_user_headers: dict[str, str],
    ):
        """Should prevent creating tasks for a different user."""
        payload = {"title": "Unauthorized Task"}

        response = await client.post(
            f"/api/{test_user_id}/tasks",
            headers=other_user_headers,
            json=payload,
        )

        assert response.status_code == 403

    @pytest.mark.integration
    async def test_cannot_update_other_user_task(
        self,
        client: AsyncClient,
        test_user: User,
        test_user_id: str,
        test_task,
        other_user_headers: dict[str, str],
    ):
        """Should prevent updating tasks of a different user."""
        payload = {"title": "Hacked Title"}

        response = await client.put(
            f"/api/{test_user_id}/tasks/{test_task.id}",
            headers=other_user_headers,
            json=payload,
        )

        assert response.status_code == 403

    @pytest.mark.integration
    async def test_cannot_delete_other_user_task(
        self,
        client: AsyncClient,
        test_user: User,
        test_user_id: str,
        test_task,
        other_user_headers: dict[str, str],
    ):
        """Should prevent deleting tasks of a different user."""
        response = await client.delete(
            f"/api/{test_user_id}/tasks/{test_task.id}",
            headers=other_user_headers,
        )

        assert response.status_code == 403

    @pytest.mark.integration
    async def test_user_only_sees_own_tasks(
        self,
        client: AsyncClient,
        test_db,
        test_user: User,
        test_user_id: str,
        other_user_id: str,
        auth_headers: dict[str, str],
    ):
        """Should only return tasks belonging to the authenticated user."""
        from src.models.task import Task

        # Create tasks for both users
        user1_task = Task(user_id=test_user_id, title="User 1 Task", completed=False)
        user2_task = Task(user_id=other_user_id, title="User 2 Task", completed=False)

        test_db.add(user1_task)
        test_db.add(user2_task)
        await test_db.commit()

        # User 1 lists their tasks
        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        # Should only see their own tasks
        task_titles = [task["title"] for task in data["tasks"]]
        assert "User 1 Task" in task_titles
        assert "User 2 Task" not in task_titles


class TestTokenValidation:
    """Test JWT token validation edge cases."""

    @pytest.mark.integration
    async def test_token_with_wrong_secret_returns_401(
        self,
        client: AsyncClient,
        test_user_id: str,
    ):
        """Should reject token signed with incorrect secret."""
        from jose import jwt

        # Create token with wrong secret
        payload = {
            "sub": test_user_id,
            "email": "test@example.com",
            "exp": 9999999999,
        }
        token = jwt.encode(payload, "wrong-secret-key", algorithm="HS256")
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=headers,
        )

        assert response.status_code == 401

    @pytest.mark.integration
    async def test_token_with_wrong_algorithm_returns_401(
        self,
        client: AsyncClient,
        test_user_id: str,
    ):
        """Should reject token signed with incorrect algorithm."""
        from jose import jwt

        from src.config import settings

        # Create token with HS512 instead of HS256
        payload = {
            "sub": test_user_id,
            "email": "test@example.com",
            "exp": 9999999999,
        }
        token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS512")
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=headers,
        )

        assert response.status_code == 401

    @pytest.mark.integration
    async def test_empty_bearer_token_returns_401(
        self,
        client: AsyncClient,
        test_user_id: str,
    ):
        """Should reject empty bearer token."""
        headers = {"Authorization": "Bearer "}

        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=headers,
        )

        assert response.status_code == 401

    @pytest.mark.integration
    async def test_bearer_token_with_extra_spaces_returns_401(
        self,
        client: AsyncClient,
        test_user_id: str,
    ):
        """Should handle bearer token with extra spaces."""
        headers = {"Authorization": "Bearer   invalid.token.here"}

        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=headers,
        )

        assert response.status_code == 401


class TestAuthorizationHeader:
    """Test Authorization header parsing and validation."""

    @pytest.mark.integration
    async def test_case_sensitive_bearer_prefix(
        self,
        client: AsyncClient,
        test_user_id: str,
        jwt_token: str,
    ):
        """Should handle 'bearer' (lowercase) in Authorization header."""
        # Note: Spec requires "Bearer" capitalized, but some implementations accept lowercase
        headers = {"Authorization": f"bearer {jwt_token}"}

        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=headers,
        )

        # Should reject lowercase 'bearer' (case-sensitive)
        assert response.status_code == 401

    @pytest.mark.integration
    async def test_multiple_spaces_in_auth_header(
        self,
        client: AsyncClient,
        test_user_id: str,
        jwt_token: str,
    ):
        """Should handle multiple spaces between Bearer and token."""
        headers = {"Authorization": f"Bearer    {jwt_token}"}

        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=headers,
        )

        # Middleware splits on first space, so extra spaces become part of token
        # This should fail token validation
        assert response.status_code == 401

    @pytest.mark.integration
    async def test_auth_header_without_space(
        self,
        client: AsyncClient,
        test_user_id: str,
        jwt_token: str,
    ):
        """Should reject Authorization header without space after Bearer."""
        headers = {"Authorization": f"Bearer{jwt_token}"}

        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=headers,
        )

        assert response.status_code == 401

    @pytest.mark.integration
    async def test_basic_auth_scheme_rejected(
        self,
        client: AsyncClient,
        test_user_id: str,
    ):
        """Should reject Basic auth scheme (only Bearer supported)."""
        headers = {"Authorization": "Basic dGVzdDp0ZXN0"}

        response = await client.get(
            f"/api/{test_user_id}/tasks",
            headers=headers,
        )

        assert response.status_code == 401
        data = response.json()
        assert "bearer" in data["detail"].lower()
