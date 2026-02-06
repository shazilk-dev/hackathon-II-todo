# Issues to Resolve - Todo App Analysis

**Analysis Date:** February 6, 2026  
**Scope:** Backend API, Database, Frontend React Query Implementation

---

## 🔴 CRITICAL BACKEND ISSUES

### Issue #1: Double Commit Pattern - Transaction Management Bug

**Severity:** Critical  
**Location:** `backend/src/db/session.py` + all service methods  
**Impact:** Breaks transaction atomicity, makes error recovery impossible

**Problem:**

```python
# In get_db() dependency (session.py):
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()  # ← Commit #1
        except Exception:
            await session.rollback()

# In service methods (e.g., TaskService.create_task):
session.add(task)
await session.commit()  # ← Commit #2
await session.refresh(task)
```

**Consequences:**

- Two commits happen for each operation
- If an error occurs after the service commit but before returning the response, data is already committed but the client gets an error
- Breaks transaction atomicity (ACID violation)
- Makes error recovery impossible
- Inconsistent data states

**Solution Options:**

1. **Option A (Recommended):** Remove `await session.commit()` from `get_db()` dependency, keep commits in service layer
2. **Option B:** Remove all commits from service layer, commit only at dependency level

**Files to Fix:**

- `backend/src/db/session.py`
- All files in `backend/src/services/*.py`

---

### Issue #2: Missing CASCADE DELETE Configuration

**Severity:** Critical  
**Location:** `backend/src/models/task.py`, `backend/src/models/tag.py`  
**Impact:** Foreign key constraint violations, orphaned records

**Problem:**

```python
# In Task model - no cascade configuration:
user_id: str = Field(foreign_key="user.id", ...)

# In TaskTag model - no cascade configuration:
task_id: int = Field(foreign_key="tasks.id", primary_key=True)
tag_id: int = Field(foreign_key="tags.id", primary_key=True)
```

**Current Workaround:**

```python
# From tag_service.py - manual deletion (inefficient):
delete_statement = select(TaskTag).where(TaskTag.task_id == task_id)
result = await session.execute(delete_statement)
for association in existing_associations:
    await session.delete(association)  # Manual cleanup!
```

**Consequences:**

- When you delete a task, TaskTag records don't automatically delete
- Can cause foreign key constraint violations
- Orphaned records in database
- Extra queries for manual cleanup

**Solution:**

```python
from sqlalchemy import Column, Integer, ForeignKey

# In TaskTag model:
task_id: int = Field(
    sa_column=Column(Integer, ForeignKey('tasks.id', ondelete='CASCADE'), primary_key=True)
)
tag_id: int = Field(
    sa_column=Column(Integer, ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

# In Task model:
user_id: str = Field(
    sa_column=Column(String, ForeignKey('user.id', ondelete='CASCADE'), index=True, nullable=False)
)
```

**Files to Fix:**

- `backend/src/models/task.py`
- `backend/src/models/tag.py`
- `backend/src/services/tag_service.py` (cleanup manual deletion code)

---

### Issue #3: Broken Atomicity - Statistics Logging After Commit

**Severity:** Critical  
**Location:** `backend/src/services/task_service.py:369-375`, `414-420`  
**Impact:** Data inconsistency, ACID violations

**Problem:**

```python
# In toggle_completion and change_status:
session.add(task)
await session.commit()  # ← Task committed first

# Log completion if task was just marked as complete
if task.completed and not old_completed:
    await StatisticsService.log_completion(session, user_id, task_id)  # ← After commit!
```

**Consequences:**

- If statistics logging fails, the task is already marked as complete
- Data inconsistency: task shows as done but statistics aren't updated
- Cannot be rolled back
- Violates ACID properties (Atomicity)
- Users see incorrect statistics

**Solution:**
Move statistics logging BEFORE commit:

```python
# Log completion BEFORE committing
if task.completed and not old_completed:
    await StatisticsService.log_completion(session, user_id, task_id)

session.add(task)
await session.commit()
```

**Alternative Solution:**
Use background task/queue (Celery, Redis Queue) for statistics:

```python
session.add(task)
await session.commit()

# Queue background job (non-blocking)
if task.completed and not old_completed:
    background_tasks.add_task(log_completion_async, user_id, task_id)
```

**Files to Fix:**

- `backend/src/services/task_service.py` (toggle_completion method)
- `backend/src/services/task_service.py` (change_status method)

---

### Issue #4: Data Model Conflict - `completed` vs `status` Field Synchronization

**Severity:** Critical  
**Location:** `backend/src/services/task_service.py:251-270`, `backend/src/models/task.py`  
**Impact:** Confusing behavior, data inconsistency, order-dependent bugs

**Problem:**

```python
# If both fields are updated in one request:
if task_data.completed is not None:
    task.completed = task_data.completed
    task.status = "done" if task_data.completed else "backlog"  # Always forces backlog!

if task_data.status is not None:
    task.status = task_data.status
    task.completed = (task_data.status == "done")
```

**Example Bug:**

```python
# Scenario 1: User wants to mark task as "in progress"
update_task(task_id, {completed: false, status: "in_progress"})
# Result: completed=False (✓), status="in_progress" (✓) - works by accident due to order

# Scenario 2: Later, user updates only completed field
update_task(task_id, {completed: false})
# Result: completed=False, status="backlog" - loses "in_progress" status! ❌
```

**Consequences:**

- Order-dependent behavior (fragile code)
- Loss of task status information
- Confusing API contract (which field is source of truth?)
- Backwards compatibility property `is_completed` adds more confusion
- Unclear to frontend developers which field to use

**Solution Options:**

1. **Option A (Recommended):** Deprecate `completed` field, use only `status`
   - Make `completed` a computed property (read-only)
   - Update schema to reject `completed` in update requests
2. **Option B:** Make `status` derived from `completed` (simpler model)
   - Remove `status` field, compute from `completed`
3. **Option C:** Reject requests that update both fields simultaneously
   - Add validation to prevent conflicting updates

**Files to Fix:**

- `backend/src/models/task.py`
- `backend/src/services/task_service.py` (update_task method)
- `backend/src/schemas/task.py` (TaskUpdate schema)
- Frontend: `frontend/lib/api.ts` (API client)

---

## 🟠 DATA CONSISTENCY ISSUES

### Issue #5: `updated_at` Timestamp Not Automatically Updated

**Severity:** High  
**Location:** `backend/src/models/base.py`  
**Impact:** Incorrect timestamps, manual maintenance burden

**Problem:**

```python
class TimestampMixin(SQLModel):
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    # No automatic update trigger!
```

Service methods manually set `task.updated_at = datetime.utcnow()`, but this is error-prone.

**Consequences:**

- Developers might forget to update timestamp
- Inconsistent timestamp updates across codebase
- Extra boilerplate code in every update method
- `updated_at` doesn't truly reflect last modification time

**Solution:**

```python
from sqlalchemy import Column, DateTime

class TimestampMixin(SQLModel):
    created_at: datetime = Field(
        sa_column=Column(DateTime, default=datetime.utcnow, nullable=False)
    )
    updated_at: datetime = Field(
        sa_column=Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    )
```

**Files to Fix:**

- `backend/src/models/base.py`
- Remove manual timestamp updates from all service methods

---

### Issue #6: Missing Transaction Isolation Configuration

**Severity:** High  
**Location:** `backend/src/db/session.py`  
**Impact:** Lost updates in concurrent scenarios

**Problem:**

- No explicit transaction isolation level set
- PostgreSQL default is READ COMMITTED
- Concurrent updates to the same task can cause lost updates

**Race Condition Scenario:**

```
Time    User A                          User B
T1      Read task priority="low"
T2                                      Read task priority="low"
T3      Update priority="high"
T4      Commit (priority="high")
T5                                      Update status="done"
T6                                      Commit → Overwrites A's priority to "low"! ❌
```

**Consequences:**

- Lost updates (last write wins)
- Data inconsistency
- Users' changes can be silently overwritten
- Hard to debug (race conditions are intermittent)

**Solution Options:**

1. **Option A:** Configure REPEATABLE READ isolation level

```python
engine = create_async_engine(
    settings.database_url,
    isolation_level="REPEATABLE READ"
)
```

2. **Option B:** Implement optimistic locking with version field

```python
class Task(TimestampMixin, table=True):
    version: int = Field(default=1, nullable=False)

# In update:
result = await session.execute(
    update(Task)
    .where(Task.id == task_id, Task.version == old_version)
    .values(version=old_version + 1)
)
if result.rowcount == 0:
    raise ConcurrentUpdateError()
```

**Files to Fix:**

- `backend/src/db/session.py`
- Optionally: `backend/src/models/task.py` (for optimistic locking)

---

## 🟡 PERFORMANCE ISSUES

### Issue #7: Inefficient Re-fetching After Updates

**Severity:** Medium  
**Location:** Multiple places in `backend/src/services/task_service.py`  
**Impact:** Extra database queries, slower response times

**Problem:**

```python
# In update_task:
task.title = task_data.title
# ... other updates ...
session.add(task)
await session.commit()
return await TaskService.get_task(session, user_id, task_id, load_tags=True)  # Extra query!
```

**Consequences:**

- Extra SELECT query after every update
- The task object is already in memory with all the data
- Slower API response times
- Unnecessary database load

**Solution:**

```python
await session.commit()
await session.refresh(task, ["task_tags"])  # Only refresh relationships
return task
```

**Files to Fix:**

- `backend/src/services/task_service.py` (update_task method)
- `backend/src/services/task_service.py` (toggle_completion method)
- `backend/src/services/task_service.py` (change_status method)

---

### Issue #8: Relationship Back-Population Incomplete

**Severity:** Medium  
**Location:** `backend/src/models/task.py`, `backend/src/models/tag.py`  
**Impact:** Bidirectional navigation doesn't work properly

**Problem:**

```python
# In Task:
task_tags: list["TaskTag"] = Relationship(back_populates="task_rel")

# In TaskTag:
task_rel: "Task" = Relationship(back_populates="task_tags")
tag_rel: Tag = Relationship()  # ← No back_populates!
```

**Consequences:**

- The `tag_rel` relationship has no back-populate
- Bidirectional navigation might not work properly
- Tags don't know which TaskTags reference them
- Can cause SQLAlchemy warnings

**Solution:**

```python
# In Tag model, add:
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.models.tag import TaskTag

class Tag(SQLModel, table=True):
    # ... existing fields ...
    task_tags: list["TaskTag"] = Relationship(back_populates="tag_rel")

# In TaskTag model:
tag_rel: Tag = Relationship(back_populates="task_tags")
```

**Files to Fix:**

- `backend/src/models/tag.py`

---

### Issue #9: Missing Composite Indexes for Common Queries

**Severity:** Low  
**Location:** `backend/src/models/task.py`  
**Impact:** Slower query performance as data grows

**Current State:**
Single-column indexes exist:

- `user_id` (✓)
- `completed` (✓)
- `due_date` (✓)
- `priority` (✓)
- `status` (✓)

**Problem:**
Most queries filter by `user_id` AND another field. Single indexes may not be optimal.

**Common Query Patterns:**

```sql
SELECT * FROM tasks WHERE user_id = ? AND status = ?;
SELECT * FROM tasks WHERE user_id = ? AND completed = ?;
SELECT * FROM tasks WHERE user_id = ? AND due_date < ?;
```

**Solution:**
Add composite indexes:

```python
from sqlalchemy import Index

class Task(TimestampMixin, table=True):
    # ... existing fields ...

    __table_args__ = (
        Index('ix_tasks_user_status', 'user_id', 'status'),
        Index('ix_tasks_user_completed', 'user_id', 'completed'),
        Index('ix_tasks_user_duedate', 'user_id', 'due_date'),
    )
```

**Files to Fix:**

- `backend/src/models/task.py`

---

## 🔵 SECURITY ISSUES

### Issue #10: In-Memory Rate Limiting Won't Work in Production

**Severity:** High  
**Location:** `backend/src/api/middleware/jwt_auth.py:22-44`  
**Impact:** Rate limiting can be bypassed in distributed deployments

**Problem:**

```python
# Rate limiting storage (in production, use Redis or similar)
rate_limit_storage = defaultdict(list)  # ← In-memory only!
```

**Consequences:**

- In multi-process deployment (Gunicorn workers, Kubernetes pods), each process has its own memory
- A user can bypass rate limits by spreading requests across different pods/workers
- No shared state between application instances
- The comment says to use Redis but it's not implemented

**Production Deployment Scenario:**

```
User sends 100 requests to Pod A → Rate limited
User sends 100 requests to Pod B → NOT rate limited! ❌
User sends 100 requests to Pod C → NOT rate limited! ❌
```

**Solution:**
Use Redis-based rate limiting:

```python
from redis import asyncio as aioredis
import time

redis = aioredis.from_url("redis://localhost")

async def check_rate_limit(client_ip: str, max_requests: int = 100, window_seconds: int = 3600) -> bool:
    key = f"rate_limit:{client_ip}"
    now = time.time()

    # Add current request with score as timestamp
    await redis.zadd(key, {str(now): now})

    # Remove old requests outside window
    await redis.zremrangebyscore(key, 0, now - window_seconds)

    # Count requests in window
    count = await redis.zcard(key)

    # Set expiry on key
    await redis.expire(key, window_seconds)

    return count < max_requests
```

**Alternative:** Use `slowapi` library (built on Redis):

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/{user_id}/tasks")
@limiter.limit("100/hour")
async def list_tasks(...):
    ...
```

**Files to Fix:**

- `backend/src/api/middleware/jwt_auth.py`
- Add Redis dependency to `pyproject.toml`
- Or add `slowapi` dependency

---

## 🟣 CODE QUALITY ISSUES

### Issue #11: Validation Warnings Not Returned to User

**Severity:** Low  
**Location:** `backend/src/schemas/task.py:36-45`  
**Impact:** Poor user experience, silent failures

**Problem:**

```python
@field_validator("due_date")
@classmethod
def due_date_validator(cls, v: Optional[datetime]) -> Optional[datetime]:
    if v is not None and v < datetime.utcnow():
        # Warning only - don't raise error, just note it's in the past
        pass  # ← No actual warning sent!
    return v
```

**Consequences:**

- User sets a due date in the past
- Validation pretends to warn but doesn't
- User doesn't know they made a mistake
- No feedback to frontend

**Solution:**
Either raise an error or use response metadata:

```python
# Option A: Raise validation error
@field_validator("due_date")
@classmethod
def due_date_validator(cls, v: Optional[datetime]) -> Optional[datetime]:
    if v is not None and v < datetime.utcnow():
        raise ValueError("Due date cannot be in the past")
    return v

# Option B: Add warnings to response
class TaskResponse(TaskBase):
    # ... existing fields ...
    warnings: List[str] = Field(default_factory=list)
```

**Files to Fix:**

- `backend/src/schemas/task.py`

---

### Issue #12: Frontend Token Cache Complexity

**Severity:** Low  
**Location:** `frontend/lib/api.ts:17-97`  
**Impact:** Maintenance burden, potential edge cases

**Problem:**
Complex token caching logic with mutex management:

```typescript
if (tokenFetchPromise) {
  try {
    const tokenData = await tokenFetchPromise;
    return { Authorization: `Bearer ${tokenData.token}` };
  } catch (error) {
    tokenFetchPromise = null; // Reset on error
  }
}
// Falls through to fetch again...
tokenFetchPromise = (async () => {
  /* fetch */
})();
```

**Assessment:**
The logic is actually correct but overly complex. Could be simplified with a dedicated token manager class.

**Solution:**

```typescript
class TokenManager {
  private token: string | null = null;
  private expiresAt: number = 0;
  private fetchPromise: Promise<string> | null = null;

  async getToken(): Promise<string> {
    // Check cache
    if (this.token && this.expiresAt > Date.now() / 1000 + 300) {
      return this.token;
    }

    // Deduplicate concurrent requests
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Fetch new token
    this.fetchPromise = this.fetchTokenFromServer();
    try {
      this.token = await this.fetchPromise;
      return this.token;
    } finally {
      this.fetchPromise = null;
    }
  }
}
```

**Files to Fix:**

- `frontend/lib/api.ts` (optional refactoring)

---

## 🚨 FRONTEND REACT QUERY ISSUES

### Issue #13: React Query Implemented But NOT USED! (CRITICAL)

**Severity:** CRITICAL  
**Location:** All frontend components  
**Impact:** App doesn't benefit from React Query at all

**What's Correctly Implemented:**

- ✅ React Query installed (`@tanstack/react-query` v5.90.20)
- ✅ QueryProvider configured with excellent defaults
- ✅ Provider wrapping app in root layout
- ✅ Custom hooks created: `useTasks`, `useTags`, `useStatistics`, `useFocusSession`, `useChat`
- ✅ Hooks well-designed with optimistic updates, automatic invalidation

**What's NOT Implemented:**
❌ **NONE of the components actually USE the React Query hooks!**

**Current Code (TaskList.tsx):**

```tsx
// ❌ Manual state management
const [tasks, setTasks] = useState<Task[]>([]);
const [isLoading, setIsLoading] = useState(true);

const fetchTasks = useCallback(async () => {
  const response = await api.getTasks(userId, filter);
  setTasks(response.tasks);
}, [userId, filter]);

useEffect(() => {
  fetchTasks();
}, [fetchTasks]);
```

**Should Be:**

```tsx
// ✅ React Query hooks
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "@/lib/hooks";

const { data: tasks = [], isLoading } = useTasks(userId, filter);
const createTask = useCreateTask(userId);
const updateTask = useUpdateTask(userId);
const deleteTask = useDeleteTask(userId);

// No useEffect needed! React Query handles fetching, caching, refetching
```

**Problems This Causes:**

1. **No Caching**
   - Every navigation away and back re-fetches everything
   - Whole point of React Query (instant cached responses) is lost

2. **Race Conditions**
   - Manual state updates can overwrite each other
   - React Query handles this automatically

3. **No Optimistic Updates**
   - Users wait for server response to see UI changes
   - React Query provides instant feedback

4. **Manual State Synchronization**
   - Passing `onUpdate`, `onDelete`, `onTaskCreated` callbacks everywhere
   - React Query auto-syncs all components using the same cache key

5. **Duplicate Requests Not Prevented**
   - If 3 components request tasks simultaneously, 3 requests sent
   - React Query deduplicates automatically

6. **No Background Refetching**
   - Stale data can sit in UI indefinitely
   - React Query automatically refetches in background

**Components That Need Updating:**

- `frontend/components/tasks/TaskList.tsx` - Main list view
- `frontend/components/tasks/TaskItem.tsx` - Individual task operations
- `frontend/components/tasks/KanbanView.tsx` - Kanban board view
- `frontend/components/tasks/ListView.tsx` - Alternate list view
- `frontend/components/tasks/CalendarView.tsx` - Calendar view
- `frontend/components/tasks/GroupedTaskList.tsx` - Grouped view
- `frontend/app/dashboard/page.tsx` - Dashboard page

**Expected Performance Improvement:**

| Metric             | Current (Manual)       | After (React Query)   |
| ------------------ | ---------------------- | --------------------- |
| Initial load       | ~500ms                 | ~500ms (same)         |
| Navigate back      | ~500ms (re-fetch)      | **~0ms (cached)**     |
| Toggle checkbox    | ~200ms wait            | **Instant + sync**    |
| Duplicate requests | Yes (wastes bandwidth) | **No (deduplicated)** |
| Optimistic updates | No                     | **Yes**               |
| Background refresh | Manual only            | **Automatic**         |

---

## 📋 SUMMARY

| Category  | Critical | High  | Medium | Low   | Total  |
| --------- | -------- | ----- | ------ | ----- | ------ |
| Backend   | 4        | 2     | 3      | 2     | 11     |
| Frontend  | 1        | 0     | 0      | 0     | 1      |
| **Total** | **5**    | **2** | **3**  | **2** | **12** |

### Priority Order for Fixes:

**Phase 1: Critical Backend Issues (Must Fix)**

1. Issue #1: Double commit pattern
2. Issue #2: Missing CASCADE deletes
3. Issue #3: Statistics logging after commit
4. Issue #4: completed vs status field conflict

**Phase 2: Critical Frontend Issue (Must Fix)** 5. Issue #13: Integrate React Query hooks into components

**Phase 3: Data Consistency (Should Fix)** 6. Issue #5: Automatic updated_at timestamps 7. Issue #6: Transaction isolation configuration

**Phase 4: Performance & Security (Should Fix)** 8. Issue #7: Inefficient re-fetching 9. Issue #10: Redis-based rate limiting

**Phase 5: Polish (Nice to Have)** 10. Issue #8: Complete relationship back-population 11. Issue #9: Composite indexes 12. Issue #11: Validation warning feedback 13. Issue #12: Token cache refactoring (optional)

---

## 🔧 IMPLEMENTATION NOTES

### Before Starting Fixes:

1. ✅ Create comprehensive test coverage for current behavior
2. ✅ Backup database (for production)
3. ✅ Create git branch for fixes
4. ✅ Document current API contracts

### Testing Strategy:

- Unit tests for each fixed component
- Integration tests for transaction changes
- Performance benchmarks before/after
- Manual QA for React Query integration

### Rollout Strategy:

- Fix backend issues first (Phases 1-4)
- Test thoroughly in development
- Deploy backend fixes
- Then implement React Query (Phase 2)
- Monitor logs and performance metrics

---

**Document End**
