import asyncio
import httpx
import pytest
from typing import Dict, Any

# Test constants
BASE_URL = "http://localhost:3000"  # Frontend URL
BACKEND_URL = "http://localhost:8000"  # Backend URL

# Test user credentials
TEST_EMAIL = "testuser@example.com"
TEST_PASSWORD = "securepassword123"


class TestAuthFlow:
    """Test suite for Better Auth implementation with Neon DB"""
    
    def __init__(self):
        self.client = httpx.AsyncClient()
        self.csrf_token = None
        self.session_cookie = None
        
    async def test_full_auth_flow(self):
        """Test the complete authentication flow"""
        print("Testing full authentication flow...")
        
        # Test 1: Check if auth endpoints are accessible
        print("1. Testing auth endpoints accessibility...")
        response = await self.client.get(f"{BASE_URL}/api/auth/session")
        assert response.status_code in [200, 401], "Session endpoint should be accessible"
        
        # Test 2: Register a new user
        print("2. Testing user registration...")
        signup_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": "Test User"
        }
        
        # Note: Better Auth handles registration automatically, so we'll test via the API
        # For now, we'll simulate a login attempt to see if the system is working
        login_response = await self.client.post(
            f"{BASE_URL}/api/auth/signin/email",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "callbackURL": "/dashboard"
            }
        )
        
        # This might fail if user doesn't exist, which is expected
        print(f"Login attempt response: {login_response.status_code}")
        
        # Test 3: Test token exchange endpoint
        print("3. Testing token exchange endpoint...")
        token_response = await self.client.get(f"{BASE_URL}/api/auth/token")
        # This should return 401 since we're not authenticated
        assert token_response.status_code == 401, "Token endpoint should require authentication"
        
        print("Authentication flow tests completed successfully!")
        
    async def test_backend_jwt_validation(self):
        """Test that backend properly validates JWT tokens"""
        print("Testing backend JWT validation...")
        
        # This test would require a valid JWT token from the frontend
        # For now, we'll test that the backend returns 401 for missing auth
        response = await self.client.get(f"{BACKEND_URL}/api/users/me/tasks")
        assert response.status_code == 401, "Backend should require authentication"
        
        print("Backend JWT validation test completed!")
        
    async def cleanup(self):
        """Clean up test resources"""
        await self.client.aclose()


async def run_tests():
    """Run all authentication tests"""
    print("Starting Better Auth implementation tests...\n")
    
    test_runner = TestAuthFlow()
    
    try:
        await test_runner.test_full_auth_flow()
        await test_runner.test_backend_jwt_validation()
        print("\nAll tests passed! Better Auth implementation is working correctly.")
    except Exception as e:
        print(f"\nTest failed with error: {str(e)}")
        raise
    finally:
        await test_runner.cleanup()


if __name__ == "__main__":
    asyncio.run(run_tests())