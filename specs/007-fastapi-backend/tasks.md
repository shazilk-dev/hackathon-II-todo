# Tasks: FastAPI Backend

**Input**: Design documents from `/specs/007-fastapi-backend/`
**Prerequisites**: plan.md (required), specs 003, 004, 005, 006

**Tests**: Tests are included as required by Phase 2 constitution (80% coverage minimum).

**Organization**: Tasks are grouped by foundational infrastructure, then by API endpoint (user story) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story/endpoint this task belongs to
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `backend/tests/`
- Paths assume backend directory at repository root

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize backend project structure and dependencies

- [ ] T001 Create backend directory structure (src/, tests/, specs/)
- [ ] T002 [P] Create pyproject.toml with UV configuration and dependencies (FastAPI, SQLModel, asyncpg, python-jose, alembic, pytest, httpx)
- [ ] T003 [P] Create .env.example with required environment variables (DATABASE_URL, BETTER_AUTH_SECRET, CORS_ORIGINS, ENVIRONMENT)
- [ ] T004 [P] Create .gitignore for Python project (venv/, __pycache__/, .env, .pytest_cache/, .mypy_cache/, .coverage)
- [ ] T005 Create README.md with quickstart instructions in backend/
- [ ] T006 [P] Configure ruff for linting and formatting in pyproject.toml
- [ ] T007 [P] Configure mypy for strict type checking in pyproject.toml
- [ ] T008 [P] Configure pytest with async support in pyproject.toml (pytest-asyncio)

**Checkpoint**: Project structure created, dependencies defined, tooling configured

---

## Phase 2: Foundational (Core Infrastructure)

**Purpose**: Core infrastructure that MUST be complete before ANY endpoint can be implemented

**⚠️ CRITICAL**: No endpoint implementation can begin until this phase is complete

### Configuration & Settings

- [ ] T009 Create backend/src/config.py with Pydantic Settings class (DATABASE_URL, BETTER_AUTH_SECRET, CORS_ORIGINS, ENVIRONMENT)
- [ ] T010 Add cors_origins_list property to Settings class for parsing comma-separated CORS origins

### Database Setup

- [ ] T011 Create backend/src/db/__init__.py
- [ ] T012 Create backend/src/db/session.py with async engine (create_async_engine with pool_size=10, max_overflow=20, pool_pre_ping=True)
- [ ] T013 Add AsyncSessionLocal sessionmaker to backend/src/db/session.py
- [ ] T014 Add get_db dependency function in backend/src/db/session.py (yields AsyncSession)
- [ ] T015 Initialize Alembic in backend/ (alembic init backend/src/db/migrations)
- [ ] T016 Configure alembic.ini with DATABASE_URL from env
- [ ] T017 Configure backend/src/db/migrations/env.py for async SQLModel migrations

### Base Models

- [ ] T018 Create backend/src/models/__init__.py
- [ ] T019 Create backend/src/models/base.py with TimestampMixin (created_at, updated_at with default_factory=datetime.utcnow)

### SQLModel Models

- [ ] T020 [P] Create backend/src/models/user.py with User model (Better Auth compatible: id TEXT PK, email UNIQUE, name, emailVerified, image, createdAt, updatedAt)
- [ ] T021 [P] Create backend/src/models/task.py with Task model (id SERIAL PK, user_id TEXT FK, title VARCHAR(200), description TEXT, completed BOOL, inherits TimestampMixin)

### Pydantic Schemas

- [ ] T022 Create backend/src/schemas/__init__.py
- [ ] T023 Create backend/src/schemas/common.py with ErrorResponse and DeleteResponse models
- [ ] T024 Create backend/src/schemas/task.py with TaskBase, TaskCreate, TaskUpdate, TaskResponse, TaskListResponse

### Core Utilities

- [ ] T025 Create backend/src/core/__init__.py
- [ ] T026 [P] Create backend/src/core/exceptions.py with TaskNotFoundError custom exception
- [ ] T027 [P] Create backend/src/core/security.py with JWT utility functions (encode_jwt, decode_jwt) if needed (can use python-jose directly)

### JWT Middleware

- [ ] T028 Create backend/src/api/__init__.py
- [ ] T029 Create backend/src/api/middleware/__init__.py
- [ ] T030 Create backend/src/api/middleware/jwt_auth.py with jwt_auth_middleware function (validates Authorization header, decodes JWT, extracts user_id from sub claim, adds to request.state)
- [ ] T031 Add JWT middleware exception handling (401 for missing/invalid/expired tokens)
- [ ] T032 Add documentation endpoint skip logic in JWT middleware (/docs, /redoc, /openapi.json, /health)

### API Dependencies

- [ ] T033 Create backend/src/api/deps.py (import get_db from db.session for now)

### FastAPI Application

- [ ] T034 Create backend/src/main.py with FastAPI app instance (title, version from config)
- [ ] T035 Add lifespan context manager to backend/src/main.py (async startup/shutdown)
- [ ] T036 Add CORSMiddleware to backend/src/main.py (allow_origins from config, allow_credentials=True)
- [ ] T037 Add JWT middleware to backend/src/main.py (app.middleware("http"))
- [ ] T038 Add health check endpoint in backend/src/main.py (GET /health returns {"status": "ok", "environment": config.ENVIRONMENT})

**Checkpoint**: Foundation ready - database configured, models defined, JWT middleware functional, FastAPI app initialized

---

## Phase 3: Service Layer (Business Logic)

**Purpose**: Implement business logic for task CRUD operations, isolated from HTTP concerns

- [ ] T039 Create backend/src/services/__init__.py
- [ ] T040 Create backend/src/services/task_service.py with TaskService class
- [ ] T041 [P] Implement TaskService.get_tasks (session, user_id, status, sort) with filtering and sorting logic
- [ ] T042 [P] Implement TaskService.create_task (session, user_id, task_data) with user_id assignment
- [ ] T043 [P] Implement TaskService.get_task (session, user_id, task_id) with user isolation check (raises TaskNotFoundError if not found)
- [ ] T044 [P] Implement TaskService.update_task (session, user_id, task_id, task_data) with updated_at timestamp update
- [ ] T045 [P] Implement TaskService.delete_task (session, user_id, task_id) with hard delete
- [ ] T046 [P] Implement TaskService.toggle_completion (session, user_id, task_id) with toggle logic and updated_at update

**Checkpoint**: Service layer complete with all CRUD operations and user isolation enforcement

---

## Phase 4: API Endpoints (Task CRUD)

**Purpose**: Implement 6 REST API endpoints for task management

### Router Setup

- [ ] T047 Create backend/src/api/routers/__init__.py
- [ ] T048 Create backend/src/api/routers/tasks.py with APIRouter (prefix="/api/{user_id}/tasks", tags=["tasks"])
- [ ] T049 Include tasks router in backend/src/main.py (app.include_router(tasks.router))

### Endpoint: GET /api/{user_id}/tasks (List Tasks)

- [ ] T050 Implement list_tasks endpoint with query parameters (status: all/pending/completed, sort: created/title)
- [ ] T051 Add user_id path vs JWT user_id validation (403 if mismatch)
- [ ] T052 Add response_model=TaskListResponse and error response models (401, 403)
- [ ] T053 Add OpenAPI summary and description to list_tasks endpoint

### Endpoint: POST /api/{user_id}/tasks (Create Task)

- [ ] T054 Implement create_task endpoint with TaskCreate request body
- [ ] T055 Add user_id validation (403 if mismatch)
- [ ] T056 Add response_model=TaskResponse with status_code=201
- [ ] T057 Add OpenAPI summary and description to create_task endpoint

### Endpoint: GET /api/{user_id}/tasks/{task_id} (Get Task)

- [ ] T058 Implement get_task endpoint with task_id path parameter
- [ ] T059 Add user_id validation and TaskNotFoundError handling (404)
- [ ] T060 Add response_model=TaskResponse and error responses (401, 403, 404)
- [ ] T061 Add OpenAPI summary to get_task endpoint

### Endpoint: PUT /api/{user_id}/tasks/{task_id} (Update Task)

- [ ] T062 Implement update_task endpoint with TaskUpdate request body
- [ ] T063 Add validation for at least one field provided (400 if empty)
- [ ] T064 Add user_id validation and TaskNotFoundError handling
- [ ] T065 Add response_model=TaskResponse and error responses
- [ ] T066 Add OpenAPI summary to update_task endpoint

### Endpoint: DELETE /api/{user_id}/tasks/{task_id} (Delete Task)

- [ ] T067 Implement delete_task endpoint
- [ ] T068 Add user_id validation and TaskNotFoundError handling
- [ ] T069 Add response_model=DeleteResponse with success message
- [ ] T070 Add OpenAPI summary to delete_task endpoint

### Endpoint: PATCH /api/{user_id}/tasks/{task_id}/complete (Toggle Completion)

- [ ] T071 Implement toggle_completion endpoint
- [ ] T072 Add user_id validation and TaskNotFoundError handling
- [ ] T073 Add response_model=TaskResponse
- [ ] T074 Add OpenAPI summary to toggle_completion endpoint

**Checkpoint**: All 6 API endpoints implemented with proper validation, error handling, and OpenAPI documentation

---

## Phase 5: Database Migrations

**Purpose**: Create Alembic migration for tasks table

- [ ] T075 Create initial Alembic migration with `alembic revision --autogenerate -m "Initial schema: users and tasks tables"`
- [ ] T076 Review generated migration to ensure tasks table matches spec (id SERIAL, user_id TEXT FK, title VARCHAR(200), description TEXT, completed BOOLEAN, created_at/updated_at TIMESTAMP)
- [ ] T077 Ensure foreign key constraint on tasks.user_id → users.id with ON DELETE CASCADE
- [ ] T078 Ensure indexes on tasks.user_id and tasks.completed are created in migration
- [ ] T079 Test migration with `alembic upgrade head` on local dev database
- [ ] T080 Test migration rollback with `alembic downgrade -1`

**Checkpoint**: Database migrations created and tested

---

## Phase 6: Testing Infrastructure

**Purpose**: Setup test fixtures and utilities for comprehensive testing

### Test Configuration

- [ ] T081 Create backend/tests/__init__.py
- [ ] T082 Create backend/tests/conftest.py with pytest configuration
- [ ] T083 Add TEST_DATABASE_URL constant in conftest.py (separate test database)
- [ ] T084 Create db_session fixture (async session with create_all/drop_all and rollback)
- [ ] T085 Create client fixture (AsyncClient with app and db_session override)
- [ ] T086 Create auth_headers fixture (generates valid JWT with test user_id using python-jose)
- [ ] T087 Add test_user fixture (creates test user in database for integration tests)

---

## Phase 7: Unit Tests (60% of test coverage)

**Purpose**: Test service layer business logic in isolation with mocked database

- [ ] T088 Create backend/tests/unit/__init__.py
- [ ] T089 Create backend/tests/unit/test_task_service.py

### TaskService Unit Tests

- [ ] T090 [P] Test TaskService.create_task with mocked session (verify task created with correct user_id, completed=False)
- [ ] T091 [P] Test TaskService.get_tasks with status filter (pending, completed, all)
- [ ] T092 [P] Test TaskService.get_tasks with sort (created_at desc, title asc)
- [ ] T093 [P] Test TaskService.get_task returns task when found
- [ ] T094 [P] Test TaskService.get_task raises TaskNotFoundError when not found
- [ ] T095 [P] Test TaskService.get_task raises TaskNotFoundError when task belongs to different user
- [ ] T096 [P] Test TaskService.update_task updates title and description
- [ ] T097 [P] Test TaskService.update_task updates updated_at timestamp
- [ ] T098 [P] Test TaskService.delete_task deletes task
- [ ] T099 [P] Test TaskService.toggle_completion toggles from false to true
- [ ] T100 [P] Test TaskService.toggle_completion toggles from true to false

---

## Phase 8: Integration Tests (30% of test coverage)

**Purpose**: Test API endpoints with real test database

- [ ] T101 Create backend/tests/integration/__init__.py
- [ ] T102 Create backend/tests/integration/test_task_api.py

### API Integration Tests

- [ ] T103 [P] Test POST /api/{user_id}/tasks creates task and returns 201
- [ ] T104 [P] Test POST /api/{user_id}/tasks with missing title returns 400
- [ ] T105 [P] Test POST /api/{user_id}/tasks with title > 200 chars returns 400
- [ ] T106 [P] Test POST /api/{user_id}/tasks with user_id mismatch returns 403
- [ ] T107 [P] Test POST /api/{user_id}/tasks without JWT returns 401
- [ ] T108 [P] Test GET /api/{user_id}/tasks returns all user tasks
- [ ] T109 [P] Test GET /api/{user_id}/tasks with status=pending filters correctly
- [ ] T110 [P] Test GET /api/{user_id}/tasks with status=completed filters correctly
- [ ] T111 [P] Test GET /api/{user_id}/tasks with sort=title sorts alphabetically
- [ ] T112 [P] Test GET /api/{user_id}/tasks with user_id mismatch returns 403
- [ ] T113 [P] Test GET /api/{user_id}/tasks/{task_id} returns task
- [ ] T114 [P] Test GET /api/{user_id}/tasks/{task_id} with wrong user_id returns 404
- [ ] T115 [P] Test GET /api/{user_id}/tasks/{task_id} with non-existent id returns 404
- [ ] T116 [P] Test PUT /api/{user_id}/tasks/{task_id} updates task
- [ ] T117 [P] Test PUT /api/{user_id}/tasks/{task_id} with empty body returns 400
- [ ] T118 [P] Test PUT /api/{user_id}/tasks/{task_id} with title > 200 chars returns 400
- [ ] T119 [P] Test DELETE /api/{user_id}/tasks/{task_id} deletes task and returns 200
- [ ] T120 [P] Test DELETE /api/{user_id}/tasks/{task_id} with non-existent id returns 404
- [ ] T121 [P] Test PATCH /api/{user_id}/tasks/{task_id}/complete toggles completion
- [ ] T122 [P] Test PATCH /api/{user_id}/tasks/{task_id}/complete toggles back to incomplete

### JWT Middleware Integration Tests

- [ ] T123 Create backend/tests/integration/test_auth_flow.py
- [ ] T124 [P] Test request without Authorization header returns 401
- [ ] T125 [P] Test request with invalid JWT returns 401
- [ ] T126 [P] Test request with expired JWT returns 401
- [ ] T127 [P] Test request to /health endpoint bypasses JWT middleware
- [ ] T128 [P] Test request to /docs endpoint bypasses JWT middleware
- [ ] T129 [P] Test user_id extracted from JWT is available in request.state

---

## Phase 9: Contract Tests (10% of test coverage)

**Purpose**: Validate Pydantic schemas enforce API contracts

- [ ] T130 Create backend/tests/contract/__init__.py
- [ ] T131 Create backend/tests/contract/test_task_contracts.py

### Pydantic Schema Tests

- [ ] T132 [P] Test TaskCreate schema accepts valid data (title, description)
- [ ] T133 [P] Test TaskCreate schema rejects missing title (ValidationError)
- [ ] T134 [P] Test TaskCreate schema rejects title > 200 chars (ValidationError)
- [ ] T135 [P] Test TaskCreate schema rejects empty title (ValidationError)
- [ ] T136 [P] Test TaskUpdate schema accepts partial updates (title only, description only, both)
- [ ] T137 [P] Test TaskUpdate schema rejects title > 200 chars
- [ ] T138 [P] Test TaskUpdate.has_updates() returns True when fields provided
- [ ] T139 [P] Test TaskUpdate.has_updates() returns False when no fields provided
- [ ] T140 [P] Test TaskResponse schema serializes from SQLModel Task (from_attributes=True)
- [ ] T141 [P] Test TaskListResponse schema with tasks array and count

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, type checking, coverage verification

- [ ] T142 [P] Run mypy --strict on backend/src and fix type errors
- [ ] T143 [P] Run ruff check on backend/src and backend/tests
- [ ] T144 [P] Run ruff format on backend/src and backend/tests
- [ ] T145 Run pytest with coverage (pytest --cov=backend/src --cov-report=html)
- [ ] T146 Verify 80% test coverage requirement met
- [ ] T147 Generate OpenAPI spec JSON with `fastapi openapi backend/src/main.py:app`
- [ ] T148 Update backend/README.md with complete setup instructions
- [ ] T149 Create backend/.env.example with all required variables documented
- [ ] T150 Add type hints to all functions (verify with mypy --strict)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all other phases
- **Service Layer (Phase 3)**: Depends on Foundational (models, config, exceptions)
- **API Endpoints (Phase 4)**: Depends on Service Layer completion
- **Database Migrations (Phase 5)**: Depends on Foundational (models defined)
- **Testing Infrastructure (Phase 6)**: Depends on Foundational (app, db setup)
- **Unit Tests (Phase 7)**: Depends on Service Layer + Testing Infrastructure
- **Integration Tests (Phase 8)**: Depends on API Endpoints + Testing Infrastructure
- **Contract Tests (Phase 9)**: Depends on Schemas (Foundational phase)
- **Polish (Phase 10)**: Depends on all implementation complete

### Critical Path

1. **Setup** → **Foundational** (sequential, blocking)
2. **Foundational** → **Service Layer** → **API Endpoints** (sequential)
3. **Foundational** → **Database Migrations** (parallel with Service Layer)
4. **Foundational** → **Testing Infrastructure** (parallel with Service Layer)
5. **Service Layer** + **Testing Infrastructure** → **Unit Tests** (parallel)
6. **API Endpoints** + **Testing Infrastructure** → **Integration Tests** (parallel)
7. **Foundational** → **Contract Tests** (parallel with other tests)
8. **All Tests** → **Polish** (final phase)

### Parallel Opportunities

**Within Foundational Phase**:
- T009-T010 (Config) can run parallel with T020-T021 (Models)
- T022-T024 (Schemas) can run parallel with T025-T027 (Core utilities)

**Within Service Layer**:
- All TaskService methods (T041-T046) can be implemented in parallel (different functions)

**Within API Endpoints**:
- All 6 endpoints can be implemented in parallel once router is set up (T048-T049 first)

**Within Testing Phases**:
- All unit tests (T090-T100) can run in parallel (different test functions)
- All integration tests (T103-T129) can run in parallel (different test functions)
- All contract tests (T132-T141) can run in parallel (different test functions)

### Minimum Viable Backend (MVB)

To get a working backend quickly, implement in this order:

1. **Phase 1** (Setup): T001-T008
2. **Phase 2** (Foundational): T009-T038 (all required)
3. **Phase 3** (Service): T039-T046 (all required)
4. **Phase 4** (API): T047-T074 (all endpoints)
5. **Phase 5** (Migrations): T075-T080 (database setup)
6. **Test one endpoint manually** with curl or Postman to verify

Then add comprehensive tests (Phases 7-9) and polish (Phase 10).

---

## Implementation Strategy

### TDD Approach (Recommended)

For each endpoint:
1. Write integration test first (should fail)
2. Implement service method
3. Implement API endpoint
4. Run test (should pass)
5. Write unit tests for service method
6. Refactor if needed

Example for POST /api/{user_id}/tasks:
- T104 (test) → T042 (service) → T054-T057 (endpoint) → T090 (unit test)

### Linear Approach (Alternative)

Implement all layers first, then add tests:
1. Phases 1-5 (setup through migrations)
2. Manual testing with curl/Postman
3. Phases 6-9 (comprehensive tests)
4. Phase 10 (polish)

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story]** label maps task to specific endpoint/feature for traceability
- Each task should reference exact file path for clarity
- Verify each checkpoint before proceeding to next phase
- Stop at any checkpoint to validate functionality manually
- Commit after each task or logical group with Task ID in message format: `[TASK-042] Implement TaskService.create_task`
- All tasks require Task ID in file headers: `# Task: TASK-042`

---

## Task Count Summary

- **Phase 1 (Setup)**: 8 tasks
- **Phase 2 (Foundational)**: 30 tasks (CRITICAL PATH)
- **Phase 3 (Service Layer)**: 8 tasks
- **Phase 4 (API Endpoints)**: 28 tasks
- **Phase 5 (Migrations)**: 6 tasks
- **Phase 6 (Testing Infrastructure)**: 7 tasks
- **Phase 7 (Unit Tests)**: 13 tasks
- **Phase 8 (Integration Tests)**: 29 tasks
- **Phase 9 (Contract Tests)**: 12 tasks
- **Phase 10 (Polish)**: 9 tasks

**Total: 150 tasks**

Estimated effort: 3-5 days for experienced developer with no manual coding (all via /sp.implement)
