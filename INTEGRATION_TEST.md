# Frontend-Backend Integration Test Guide

This document provides step-by-step instructions for testing the complete frontend-backend integration.

## Prerequisites

1. **Backend Setup**:
   ```bash
   cd backend
   . .venv/bin/activate
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```

3. **Environment Variables**:

   **Backend** (`.env`):
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/hackathon_todo
   BETTER_AUTH_SECRET=your-32-character-secret-here-1234
   CORS_ORIGINS=http://localhost:3000
   ENVIRONMENT=development
   DEBUG=true
   ```

   **Frontend** (`.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   BETTER_AUTH_SECRET=your-32-character-secret-here-1234
   NEXTAUTH_URL=http://localhost:3000
   ```

   **CRITICAL**: The `BETTER_AUTH_SECRET` must be identical in both files!

## Test Plan

### Phase 1: Backend Verification

1. **Start Backend Server**:
   ```bash
   cd backend
   . .venv/bin/activate
   uvicorn src.main:app --reload --port 8000
   ```

2. **Verify Health Endpoint**:
   ```bash
   curl http://localhost:8000/health
   ```

   **Expected Response**:
   ```json
   {
     "status": "ok",
     "environment": "development",
     "version": "0.1.0"
   }
   ```

3. **Verify OpenAPI Docs**:
   - Open browser: http://localhost:8000/docs
   - Should see FastAPI interactive documentation
   - Check all 6 task endpoints are listed

### Phase 2: Frontend Verification

1. **Start Frontend Server** (in new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Verify Frontend Loads**:
   - Open browser: http://localhost:3000
   - Should see landing page
   - No console errors

### Phase 3: Authentication Flow

1. **Sign Up**:
   - Navigate to http://localhost:3000/auth/sign-up
   - Enter:
     - Email: `test@example.com`
     - Password: `TestPassword123!`
     - Name: `Test User`
   - Click "Sign Up"
   - Should redirect to `/dashboard`

2. **Verify JWT Token**:
   - Open browser DevTools → Application → Cookies
   - Check for `auth-token` cookie
   - Should be HTTP-only, Secure (in production), SameSite=Lax

3. **Sign Out**:
   - Click "Sign Out" button
   - Should redirect to landing page
   - `auth-token` cookie should be removed

4. **Sign In**:
   - Navigate to http://localhost:3000/auth/sign-in
   - Enter same credentials
   - Should redirect to `/dashboard`

### Phase 4: Task CRUD Operations

#### 4.1 Create Task

1. **Using Frontend**:
   - On dashboard, click "Add Task" button
   - Enter title: `"Buy groceries"`
   - Enter description: `"Milk, eggs, bread"`
   - Click "Create"
   - Task should appear in task list

2. **Verify in Backend** (using curl):
   ```bash
   # Get JWT token from browser (DevTools → Application → Cookies → auth-token)
   export JWT_TOKEN="your-token-here"
   export USER_ID="user-id-from-jwt-sub-claim"

   curl -H "Authorization: Bearer $JWT_TOKEN" \
        http://localhost:8000/api/$USER_ID/tasks
   ```

   **Expected**: Should return the created task

#### 4.2 List Tasks

1. **Frontend**:
   - Dashboard should show all tasks
   - Count should match number of tasks

2. **Filter Tasks**:
   - Click "All" → Should show all tasks
   - Click "Pending" → Should show only incomplete tasks
   - Click "Completed" → Should show only completed tasks (none yet)

3. **Sort Tasks**:
   - Toggle sort button
   - Should sort by creation date (default) or alphabetically

#### 4.3 Update Task

1. **Edit Title/Description**:
   - Click "Edit" button on a task
   - Change title to `"Buy groceries and cook dinner"`
   - Change description to `"Milk, eggs, bread, chicken"`
   - Click "Save"
   - Task should update immediately

2. **Toggle Completion**:
   - Click checkbox next to task
   - Task title should show strikethrough
   - Click checkbox again
   - Strikethrough should remove

#### 4.4 Delete Task

1. **Frontend**:
   - Click "Delete" button on a task
   - Confirm deletion (if modal appears)
   - Task should disappear from list
   - Count should decrease

### Phase 5: Error Handling

#### 5.1 Unauthorized Access (401)

1. **Clear Cookies**:
   - DevTools → Application → Cookies
   - Delete `auth-token`

2. **Try to Access Dashboard**:
   - Navigate to http://localhost:3000/dashboard
   - Should redirect to `/auth/sign-in?error=session_expired`

3. **Verify API Rejects Request**:
   ```bash
   curl http://localhost:8000/api/user-123/tasks
   ```

   **Expected Response** (401):
   ```json
   {
     "detail": "Missing authorization header"
   }
   ```

#### 5.2 Forbidden Access (403)

1. **Sign In as User 1**:
   - Email: `user1@example.com`
   - Create a task

2. **Sign Out and Sign In as User 2**:
   - Email: `user2@example.com`
   - Dashboard should be empty (user isolation)
   - User 2 cannot see User 1's tasks

3. **Verify API Isolation**:
   ```bash
   # Try to access User 1's tasks with User 2's token
   curl -H "Authorization: Bearer $USER2_JWT_TOKEN" \
        http://localhost:8000/api/$USER1_ID/tasks
   ```

   **Expected Response** (403):
   ```json
   {
     "detail": "Access denied: Cannot access resources for other users"
   }
   ```

#### 5.3 Not Found (404)

1. **Via API**:
   ```bash
   curl -H "Authorization: Bearer $JWT_TOKEN" \
        http://localhost:8000/api/$USER_ID/tasks/99999
   ```

   **Expected Response** (404):
   ```json
   {
     "detail": "Task not found or does not belong to user"
   }
   ```

#### 5.4 Validation Errors (422)

1. **Empty Title**:
   - Frontend form should prevent empty submissions
   - If bypassed (via API):
     ```bash
     curl -X POST \
          -H "Authorization: Bearer $JWT_TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"title": ""}' \
          http://localhost:8000/api/$USER_ID/tasks
     ```

   **Expected Response** (422):
   ```json
   {
     "detail": [
       {
         "loc": ["body", "title"],
         "msg": "Title cannot be empty or whitespace only",
         "type": "value_error"
       }
     ]
   }
   ```

### Phase 6: Network Tab Verification

1. **Open DevTools → Network Tab**

2. **Create a Task**:
   - Request URL: `POST http://localhost:8000/api/{user_id}/tasks`
   - Request Headers:
     - `Authorization: Bearer <jwt-token>`
     - `Content-Type: application/json`
   - Request Body:
     ```json
     {
       "title": "New Task",
       "description": "Task description"
     }
     ```
   - Response Status: `201 Created`
   - Response Body:
     ```json
     {
       "id": 1,
       "user_id": "user-123",
       "title": "New Task",
       "description": "Task description",
       "completed": false,
       "created_at": "2026-01-15T10:00:00Z",
       "updated_at": "2026-01-15T10:00:00Z"
     }
     ```

3. **List Tasks**:
   - Request URL: `GET http://localhost:8000/api/{user_id}/tasks?status_filter=all&sort=created`
   - Response Status: `200 OK`
   - Response Body:
     ```json
     {
       "tasks": [...],
       "count": 5
     }
     ```

### Phase 7: Performance Testing

1. **Create 50 Tasks**:
   - Use API script to bulk create:
     ```bash
     for i in {1..50}; do
       curl -X POST \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"title\": \"Task $i\"}" \
            http://localhost:8000/api/$USER_ID/tasks
     done
     ```

2. **Verify Frontend Performance**:
   - Dashboard should load < 2 seconds
   - Scrolling should be smooth
   - Filtering/sorting should be instant

3. **Check Backend Performance**:
   - API response time < 200ms for list endpoint
   - Database queries should use indexes

## Success Criteria

### ✅ Authentication
- [ ] User can sign up
- [ ] User can sign in
- [ ] User can sign out
- [ ] JWT token stored in HTTP-only cookie
- [ ] Expired sessions redirect to sign-in

### ✅ Task CRUD
- [ ] User can create tasks
- [ ] User can list tasks
- [ ] User can get single task
- [ ] User can update tasks
- [ ] User can delete tasks
- [ ] User can toggle task completion

### ✅ Filtering & Sorting
- [ ] Filter by status (all, pending, completed)
- [ ] Sort by created date (newest first)
- [ ] Sort by title (alphabetical)

### ✅ User Isolation
- [ ] Users only see their own tasks
- [ ] Users cannot access other users' tasks (403)
- [ ] Path user_id must match JWT user_id

### ✅ Error Handling
- [ ] 401 for missing/invalid token
- [ ] 403 for user mismatch
- [ ] 404 for nonexistent tasks
- [ ] 422 for validation errors
- [ ] Errors display in frontend UI

### ✅ CORS
- [ ] Frontend (localhost:3000) can call backend (localhost:8000)
- [ ] Cookies work cross-origin (SameSite=Lax)
- [ ] Preflight requests succeed

## Troubleshooting

### Issue: CORS Error

**Symptom**: Network tab shows `CORS policy` error

**Fix**:
```python
# backend/src/config.py
cors_origins: str = "http://localhost:3000"
```

### Issue: JWT Mismatch

**Symptom**: Frontend gets 401 even after sign-in

**Fix**:
- Ensure `BETTER_AUTH_SECRET` is **identical** in both .env files
- Restart both servers after changing secrets
- Clear browser cookies

### Issue: Database Connection Error

**Symptom**: Backend returns 500 on task operations

**Fix**:
- Check `DATABASE_URL` in backend `.env`
- Ensure PostgreSQL is running
- Run migrations: `alembic upgrade head`

### Issue: Tasks Not Appearing

**Symptom**: Frontend shows empty list but backend has tasks

**Fix**:
- Check browser console for errors
- Verify API URL in frontend `.env.local`
- Check Network tab for failed requests
- Ensure user_id in API path matches JWT sub claim

## Manual Testing Checklist

```
Phase 1: Backend
[ ] Health endpoint returns 200
[ ] OpenAPI docs accessible
[ ] All 6 endpoints listed

Phase 2: Frontend
[ ] Landing page loads
[ ] No console errors
[ ] Sign-up page accessible

Phase 3: Authentication
[ ] User can sign up
[ ] JWT cookie set after sign-in
[ ] Sign-out clears cookie
[ ] Sign-in redirects to dashboard

Phase 4: Task CRUD
[ ] Create task via frontend
[ ] Task appears in list
[ ] Edit task title/description
[ ] Toggle task completion
[ ] Delete task

Phase 5: Error Handling
[ ] 401 when not authenticated
[ ] 403 when accessing other user's tasks
[ ] 404 when task doesn't exist
[ ] 422 when validation fails

Phase 6: Network Verification
[ ] POST request sends JWT
[ ] GET request includes credentials
[ ] Responses have correct structure
[ ] Status codes match expectations

Phase 7: Performance
[ ] Dashboard loads < 2s with 50 tasks
[ ] API responses < 200ms
[ ] No lag when filtering/sorting
```

## Test Data

### Sample Users
```json
[
  {
    "email": "alice@example.com",
    "password": "AlicePassword123!",
    "name": "Alice Smith"
  },
  {
    "email": "bob@example.com",
    "password": "BobPassword123!",
    "name": "Bob Johnson"
  }
]
```

### Sample Tasks
```json
[
  {
    "title": "Buy groceries",
    "description": "Milk, eggs, bread"
  },
  {
    "title": "Finish project",
    "description": "Complete integration tests"
  },
  {
    "title": "Call dentist",
    "description": null
  }
]
```

## Automated Integration Test Script

```bash
#!/bin/bash
# integration-test.sh

set -e

echo "Starting Backend..."
cd backend
. .venv/bin/activate
uvicorn src.main:app --port 8000 &
BACKEND_PID=$!

echo "Starting Frontend..."
cd ../frontend
npm run dev -- --port 3000 &
FRONTEND_PID=$!

sleep 5

echo "Testing Health Endpoint..."
curl -f http://localhost:8000/health || exit 1

echo "Testing Frontend..."
curl -f http://localhost:3000 || exit 1

echo "Integration Test Complete!"

# Cleanup
kill $BACKEND_PID $FRONTEND_PID
```

## Next Steps

After successful integration testing:

1. **Deploy to Staging**:
   - Set up Neon PostgreSQL database
   - Deploy backend to hosting service (e.g., Railway, Fly.io)
   - Deploy frontend to Vercel
   - Update environment variables

2. **E2E Tests**:
   - Use Playwright for automated browser testing
   - Test complete user flows
   - Run on CI/CD pipeline

3. **Load Testing**:
   - Use k6 or Apache Bench
   - Test with 100+ concurrent users
   - Verify database connection pooling

4. **Security Audit**:
   - Run OWASP ZAP
   - Check for SQL injection
   - Verify CORS configuration
   - Test JWT expiration handling
