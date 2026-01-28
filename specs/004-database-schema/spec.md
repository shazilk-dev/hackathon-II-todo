# Feature Specification: Database Schema

**Feature Branch**: `004-database-schema`
**Created**: 2026-01-12
**Status**: Draft
**Input**: User description: "Create database schema specification. Database: Neon Serverless PostgreSQL. Tables: 1. users (managed by Better Auth) - id: TEXT PRIMARY KEY, email: TEXT UNIQUE NOT NULL, name: TEXT, emailVerified: BOOLEAN, image: TEXT, createdAt: TIMESTAMP, updatedAt: TIMESTAMP. 2. sessions (managed by Better Auth) - id: TEXT PRIMARY KEY, userId: TEXT REFERENCES users(id), token: TEXT UNIQUE, expiresAt: TIMESTAMP, createdAt: TIMESTAMP, updatedAt: TIMESTAMP. 3. accounts (managed by Better Auth) - id: TEXT PRIMARY KEY, userId: TEXT REFERENCES users(id), providerId: TEXT, accountId: TEXT, ... (other Better Auth fields). 4. tasks (our table) - id: SERIAL PRIMARY KEY, user_id: TEXT NOT NULL (references users.id), title: VARCHAR(200) NOT NULL, description: TEXT, completed: BOOLEAN DEFAULT FALSE, created_at: TIMESTAMP DEFAULT NOW(), updated_at: TIMESTAMP DEFAULT NOW(). Indexes: tasks.user_id (for filtering by user), tasks.completed (for status filtering)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Database Schema Initialization (Priority: P1)

As a developer, I need the database schema to be automatically created and migrated so that the application can store user authentication data and tasks with proper relationships and constraints.

**Why this priority**: The database schema is the foundation of the entire application. Without it, no data can be persisted. This is a blocking prerequisite for both authentication and task management features. Must be P1 to enable all other development.

**Independent Test**: Can be fully tested by running database migrations against a fresh Neon PostgreSQL instance, verifying all tables exist with correct columns, data types, constraints, indexes, and foreign key relationships. Delivers a production-ready database structure.

**Acceptance Scenarios**:

1. **Given** a fresh Neon PostgreSQL database, **When** I run the initial migration, **Then** all four tables (users, sessions, accounts, tasks) are created with correct schemas
2. **Given** the migration has completed, **When** I inspect the users table, **Then** it has columns: id (TEXT PK), email (TEXT UNIQUE NOT NULL), name (TEXT), emailVerified (BOOLEAN), image (TEXT), createdAt (TIMESTAMP), updatedAt (TIMESTAMP)
3. **Given** the migration has completed, **When** I inspect the sessions table, **Then** it has a foreign key constraint userId → users.id with ON DELETE CASCADE
4. **Given** the migration has completed, **When** I inspect the tasks table, **Then** it has a foreign key constraint user_id → users.id with ON DELETE CASCADE
5. **Given** the migration has completed, **When** I inspect the tasks table indexes, **Then** I see indexes on user_id and completed columns
6. **Given** I attempt to insert a task with non-existent user_id, **When** the database processes the insert, **Then** it fails with foreign key constraint violation
7. **Given** I attempt to insert a user with duplicate email, **When** the database processes the insert, **Then** it fails with unique constraint violation

---

### User Story 2 - User Data Isolation via Schema (Priority: P1)

As a system architect, I need the database schema to enforce user data isolation so that tasks are always associated with a specific user and cannot be accessed across user boundaries.

**Why this priority**: Data isolation is a critical security requirement from the constitution. The schema must enforce this at the database level through foreign keys and NOT NULL constraints. This prevents data leaks and ensures multi-tenant data security.

**Independent Test**: Can be fully tested by creating multiple users, inserting tasks for each user, and verifying that tasks always have a valid user_id (NOT NULL constraint enforced). Attempting to query tasks without user_id filtering should return all tasks, but application logic will filter by authenticated user_id.

**Acceptance Scenarios**:

1. **Given** the tasks table schema, **When** I attempt to insert a task without user_id, **Then** the database rejects the insert with NOT NULL constraint violation
2. **Given** multiple users exist in the database, **When** I insert tasks with different user_id values, **Then** each task is correctly associated with its owner via foreign key
3. **Given** a user is deleted from the users table, **When** the database processes the deletion, **Then** all associated tasks are automatically deleted via ON DELETE CASCADE
4. **Given** a user is deleted, **When** the cascade deletion completes, **Then** all associated sessions and accounts are also deleted (Better Auth tables)
5. **Given** I query tasks with WHERE user_id = 'specific-user', **When** using the user_id index, **Then** the query executes efficiently without full table scan

---

### User Story 3 - Better Auth Schema Integration (Priority: P1)

As a developer, I need the database schema to include Better Auth's required tables (users, sessions, accounts) so that authentication functionality works correctly with proper session management and user account storage.

**Why this priority**: Better Auth requires specific table structures to function. Without these tables, authentication will fail. This is a P1 dependency for the authentication feature (003-authentication).

**Independent Test**: Can be fully tested by running Better Auth's schema setup, verifying tables match Better Auth's expected structure, and confirming Better Auth can successfully create users, sessions, and accounts. Delivers Better Auth-compatible database.

**Acceptance Scenarios**:

1. **Given** Better Auth is configured, **When** I run the database migration, **Then** users, sessions, and accounts tables are created with Better Auth-compatible schemas
2. **Given** the users table exists, **When** Better Auth creates a new user, **Then** the user record is inserted with id, email, createdAt, updatedAt populated
3. **Given** a user signs in, **When** Better Auth creates a session, **Then** a session record is inserted with userId foreign key reference and expiresAt timestamp
4. **Given** the sessions table schema, **When** I inspect the token column, **Then** it has a UNIQUE constraint to prevent duplicate session tokens
5. **Given** a session expires, **When** Better Auth queries for active sessions, **Then** it filters by expiresAt > NOW() efficiently

---

### User Story 4 - Schema Migration and Versioning (Priority: P2)

As a developer, I need database schema changes to be version-controlled and applied via migrations so that schema evolution is trackable, reversible, and can be applied consistently across environments (development, staging, production).

**Why this priority**: While initial schema creation is P1, the ability to evolve the schema over time is P2. The application can function with the initial schema, but we need migration infrastructure for future changes. This is standard practice for production applications.

**Independent Test**: Can be fully tested by creating a migration, applying it, verifying the schema change, rolling it back, and verifying the schema reverts. Delivers repeatable, version-controlled schema management.

**Acceptance Scenarios**:

1. **Given** I create a new migration file, **When** I run the migration tool (Alembic), **Then** the migration is applied and recorded in the migrations history table
2. **Given** a migration has been applied, **When** I run the migration tool again, **Then** it detects that the migration has already been applied and skips it
3. **Given** I need to add a column to the tasks table, **When** I create and apply a migration, **Then** the column is added without data loss
4. **Given** a migration introduces a breaking change, **When** I roll back the migration, **Then** the schema reverts to the previous state
5. **Given** I deploy to production, **When** I run migrations, **Then** they apply in order, creating a consistent schema across all environments

---

### Edge Cases

- **What happens when a user is deleted?** The ON DELETE CASCADE constraint ensures all associated tasks, sessions, and accounts are automatically deleted, maintaining referential integrity and preventing orphaned records.

- **What happens when two users try to register with the same email simultaneously?** The UNIQUE constraint on users.email ensures only one succeeds. The second attempt fails with a unique constraint violation, which Better Auth handles by returning "Email already registered" error.

- **What happens when a session token collision occurs?** The UNIQUE constraint on sessions.token prevents duplicate tokens. If a collision occurs (extremely unlikely with proper token generation), the insert fails and Better Auth generates a new token.

- **What happens when inserting a task with user_id referencing a non-existent user?** The foreign key constraint fails with "violates foreign key constraint" error. Application logic should catch this and return 400 Bad Request (though this scenario should never occur with proper authentication).

- **What happens when the database reaches Neon's free tier limits?** Neon enforces storage and connection limits. If exceeded, writes will fail. Application should handle database errors gracefully and return 503 Service Unavailable.

- **What happens when running migrations on a populated database?** Migrations should be designed to be non-destructive. For additive changes (new columns, indexes), data is preserved. For breaking changes, migrations should include data transformation logic.

- **What happens when the updated_at timestamp needs to be automatically updated?** PostgreSQL doesn't have built-in auto-update for timestamps. We need a trigger function to automatically set updated_at = NOW() on row updates, or handle this at the application level (SQLModel).

- **What happens when querying tasks without using the user_id index?** PostgreSQL query planner may perform a full table scan, degrading performance. The index on user_id ensures efficient filtering. Use EXPLAIN ANALYZE to verify index usage.

- **What happens when completed filter is used frequently?** The index on tasks.completed enables efficient filtering of tasks by completion status. Without it, queries like "show all incomplete tasks" would require full table scans.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Database MUST use Neon Serverless PostgreSQL as the data store
- **FR-002**: Database MUST create a users table with columns: id (TEXT PK), email (TEXT UNIQUE NOT NULL), name (TEXT), emailVerified (BOOLEAN), image (TEXT), createdAt (TIMESTAMP), updatedAt (TIMESTAMP)
- **FR-003**: Database MUST create a sessions table with columns: id (TEXT PK), userId (TEXT FK → users.id), token (TEXT UNIQUE), expiresAt (TIMESTAMP), createdAt (TIMESTAMP), updatedAt (TIMESTAMP)
- **FR-004**: Database MUST create an accounts table with columns: id (TEXT PK), userId (TEXT FK → users.id), providerId (TEXT), accountId (TEXT), and additional Better Auth fields
- **FR-005**: Database MUST create a tasks table with columns: id (SERIAL PK), user_id (TEXT NOT NULL FK → users.id), title (VARCHAR(200) NOT NULL), description (TEXT), completed (BOOLEAN DEFAULT FALSE), created_at (TIMESTAMP DEFAULT NOW()), updated_at (TIMESTAMP DEFAULT NOW())
- **FR-006**: Database MUST enforce UNIQUE constraint on users.email to prevent duplicate registrations
- **FR-007**: Database MUST enforce UNIQUE constraint on sessions.token to prevent token collisions
- **FR-008**: Database MUST enforce NOT NULL constraint on tasks.user_id to prevent orphaned tasks
- **FR-009**: Database MUST enforce NOT NULL constraint on tasks.title to ensure all tasks have titles
- **FR-010**: Database MUST enforce foreign key constraint tasks.user_id → users.id with ON DELETE CASCADE
- **FR-011**: Database MUST enforce foreign key constraint sessions.userId → users.id with ON DELETE CASCADE
- **FR-012**: Database MUST enforce foreign key constraint accounts.userId → users.id with ON DELETE CASCADE
- **FR-013**: Database MUST create an index on tasks.user_id for efficient user-specific task queries
- **FR-014**: Database MUST create an index on tasks.completed for efficient status filtering
- **FR-015**: Database MUST use Alembic for schema migrations and version control
- **FR-016**: Database MUST record all applied migrations in a migrations history table (alembic_version)
- **FR-017**: Database MUST support async operations via asyncpg driver
- **FR-018**: Database MUST set default values for tasks.completed (FALSE), tasks.created_at (NOW()), tasks.updated_at (NOW())
- **FR-019**: Database MUST use snake_case naming for our application tables (tasks) while supporting Better Auth's camelCase convention (users, sessions, accounts)
- **FR-020**: Database schema MUST be idempotent - running migrations multiple times produces the same result

### Key Entities

- **users (Better Auth)**: Stores user accounts created via Better Auth. Primary key is id (TEXT, generated by Better Auth). Email is unique and indexed. Includes optional profile fields (name, image) and email verification status. All user-owned data (tasks, sessions, accounts) references this table via foreign keys.

- **sessions (Better Auth)**: Stores active user sessions. Each session has a unique token and expiration timestamp. Foreign key userId links to users.id. ON DELETE CASCADE ensures sessions are cleaned up when users are deleted. Used by Better Auth for session management.

- **accounts (Better Auth)**: Stores authentication provider accounts (e.g., email/password, OAuth providers if added later). Foreign key userId links to users.id. Supports multiple auth providers per user. ON DELETE CASCADE ensures cleanup.

- **tasks (Application)**: Stores user todo tasks. Primary key is id (SERIAL, auto-incrementing). Foreign key user_id (TEXT) links to users.id with NOT NULL constraint (enforces ownership). Title is required (max 200 chars), description is optional. Completed boolean tracks task status. Timestamps track creation and updates. Indexed on user_id and completed for efficient querying.

### Schema Relationships

```
users (1) ──< sessions (N)   [userId → users.id, CASCADE DELETE]
users (1) ──< accounts (N)   [userId → users.id, CASCADE DELETE]
users (1) ──< tasks (N)      [user_id → users.id, CASCADE DELETE]
```

**Cascade Deletion**: When a user is deleted, all associated sessions, accounts, and tasks are automatically deleted to maintain referential integrity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Database schema initialization completes in under 30 seconds on a fresh Neon instance
- **SC-002**: All four tables (users, sessions, accounts, tasks) are created successfully with 100% migration success rate
- **SC-003**: Foreign key constraints are enforced 100% of the time (no orphaned tasks, sessions, or accounts)
- **SC-004**: UNIQUE constraints prevent duplicate emails and session tokens 100% of the time
- **SC-005**: NOT NULL constraints prevent invalid data (tasks without user_id or title) 100% of the time
- **SC-006**: Indexes on tasks.user_id and tasks.completed improve query performance by at least 10x compared to full table scans (verified with EXPLAIN ANALYZE)
- **SC-007**: ON DELETE CASCADE successfully removes all user-owned data when a user is deleted (verified via test)
- **SC-008**: Migrations are idempotent - running the same migration multiple times produces identical schema
- **SC-009**: Schema supports 100 concurrent connections via asyncpg (Neon's connection pooling)
- **SC-010**: Database handles 1000 task inserts with user_id foreign key validation without errors
- **SC-011**: Better Auth successfully creates users, sessions, and accounts using the schema 100% of the time
- **SC-012**: Schema versioning via Alembic allows rollback of migrations with zero data loss (for non-destructive changes)

### Data Integrity Metrics

- **DI-001**: Zero orphaned tasks (tasks with invalid user_id) - enforced by foreign key constraint
- **DI-002**: Zero duplicate emails in users table - enforced by UNIQUE constraint
- **DI-003**: Zero duplicate session tokens - enforced by UNIQUE constraint
- **DI-004**: Zero tasks without user_id - enforced by NOT NULL constraint
- **DI-005**: Zero tasks without title - enforced by NOT NULL constraint
- **DI-006**: 100% of user deletions trigger cascade deletion of associated data

### Performance Metrics

- **PERF-001**: Queries filtering tasks by user_id execute in under 10ms for up to 10,000 tasks per user (index usage verified)
- **PERF-002**: Queries filtering tasks by completed status execute in under 10ms (index usage verified)
- **PERF-003**: User lookup by email executes in under 5ms (unique index on email)
- **PERF-004**: Session token validation executes in under 5ms (unique index on token)

## Technical Constraints

### Database Platform
- **Provider**: Neon Serverless PostgreSQL
- **Version**: PostgreSQL 15+ (Neon's current version)
- **Driver**: asyncpg for async operations
- **Connection Pooling**: Managed by Neon (automatic scaling)
- **Free Tier Limits**: 512 MB storage, 100 hours compute/month (development), unlimited connections

### Migration Tool
- **Tool**: Alembic (SQLAlchemy's migration framework)
- **Integration**: Works with SQLModel (which uses SQLAlchemy internally)
- **Auto-generation**: Alembic can auto-generate migrations from SQLModel model changes
- **Version Control**: Migration files committed to git for reproducibility

### Naming Conventions
- **Better Auth Tables**: camelCase (users, sessions, accounts) - matches Better Auth's schema expectations
- **Application Tables**: snake_case (tasks) - matches Python/FastAPI conventions
- **Columns**: Better Auth tables use camelCase (userId, createdAt), application tables use snake_case (user_id, created_at)
- **Consistency**: Mixed naming is acceptable when integrating third-party libraries (Better Auth) with application code

### Data Types
- **ID fields**: TEXT for Better Auth tables (UUIDs as strings), SERIAL for application tables (auto-incrementing integers)
- **Timestamps**: TIMESTAMP (without timezone) for consistency with Better Auth
- **Booleans**: BOOLEAN for completed, emailVerified
- **Strings**: TEXT for unlimited length (description, name, image), VARCHAR(200) for constrained length (title)

### Constraints
- **Primary Keys**: All tables have explicit PRIMARY KEY constraints
- **Foreign Keys**: All references use FOREIGN KEY constraints with ON DELETE CASCADE
- **Unique Constraints**: email (users), token (sessions)
- **Not Null Constraints**: email (users), user_id (tasks), title (tasks)
- **Defaults**: completed DEFAULT FALSE, created_at DEFAULT NOW(), updated_at DEFAULT NOW()

### Indexes
- **Automatic**: Primary keys and unique constraints automatically create indexes
- **Explicit**: tasks.user_id (B-tree index for filtering), tasks.completed (B-tree index for status queries)
- **Future**: Add indexes as query patterns emerge (e.g., created_at for sorting)

## Non-Functional Requirements

- **Scalability**: Schema supports horizontal scaling via stateless application design (no server-side session storage beyond database)
- **Performance**: Indexes ensure queries remain fast as data grows (tested up to 10,000 tasks per user)
- **Reliability**: Foreign key constraints and NOT NULL constraints prevent data corruption
- **Maintainability**: Alembic migrations provide version control and rollback capability
- **Security**: Schema enforces data isolation via user_id foreign keys (application layer must filter by authenticated user)
- **Compatibility**: Schema works with Better Auth (Next.js) and SQLModel (FastAPI)

## Out of Scope (Explicitly Not Included)

- **Full-text search indexes**: Not included in initial schema (future enhancement)
- **Task categories/tags**: Not in MVP schema (future enhancement)
- **Task sharing/collaboration**: No support for multi-user task access (strict single-owner model)
- **Soft deletes**: Hard deletes only (ON DELETE CASCADE) - no deleted_at column
- **Audit logs**: No audit trail table for tracking changes (future enhancement)
- **Task ordering/positioning**: No explicit order column (default sort by created_at)
- **Task priorities**: No priority field in MVP
- **Task due dates**: No due_date column in MVP
- **Recurring tasks**: No recurrence fields in MVP
- **Task attachments**: No file storage schema
- **User roles/permissions**: Single role (authenticated user) - no RBAC
- **Database backups/restore**: Managed by Neon (not application concern)
- **Read replicas**: Not configured (Neon feature, not schema concern)
- **Partitioning**: No table partitioning for tasks (not needed at MVP scale)

## Assumptions

- Better Auth's schema requirements match the documented users, sessions, accounts structure
- Neon PostgreSQL supports all standard PostgreSQL features (foreign keys, indexes, cascades)
- Alembic is compatible with SQLModel and can auto-generate migrations
- asyncpg driver works seamlessly with Neon's connection pooling
- TEXT fields for IDs are acceptable (Better Auth uses UUIDs as strings)
- Mixed naming conventions (camelCase for Better Auth, snake_case for app) is acceptable
- 200 character limit for task titles is sufficient for user needs
- Boolean completed field is sufficient (no intermediate states like "in progress")
- ON DELETE CASCADE is acceptable for user deletion (no need to retain orphaned data)
- Timestamps without timezone is acceptable (all times treated as UTC)

## Dependencies

- **Neon PostgreSQL**: Serverless PostgreSQL database provider
- **Alembic**: Database migration tool (installed via pip)
- **SQLModel**: ORM for defining models and generating migrations
- **asyncpg**: Async PostgreSQL driver for Python
- **Better Auth**: Defines users, sessions, accounts schema requirements
- **PostgreSQL 15+**: Database version with required features

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Better Auth schema mismatch | Critical - auth breaks | Low | Verify Better Auth docs, test schema with Better Auth before production |
| Migration failure in production | High - database corruption | Low | Test migrations in staging, backup before migration, have rollback plan |
| Foreign key cascade deletes too much data | Medium - data loss | Low | Document cascade behavior, add confirmation for user deletion in UI |
| Index not used by query planner | Medium - slow queries | Low | Use EXPLAIN ANALYZE to verify index usage, adjust queries if needed |
| Neon free tier limits exceeded | Medium - service interruption | Medium | Monitor usage, upgrade to paid tier before limits reached |
| TEXT ID performance vs INTEGER | Low - marginal slowdown | Low | Better Auth requires TEXT IDs, acceptable tradeoff for compatibility |
| Mixed naming conventions cause confusion | Low - developer friction | Medium | Document naming conventions clearly, use linters to enforce consistency |
| updated_at not auto-updating | Low - stale timestamps | Medium | Handle updated_at in SQLModel or add PostgreSQL trigger function |
| Alembic migration conflicts | Medium - deployment issues | Low | Use version control, coordinate migrations across team, test locally first |

## Database Schema DDL (Reference)

```sql
-- Better Auth Tables (managed by Better Auth)

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    "emailVerified" BOOLEAN,
    image TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_userId ON sessions("userId");

CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "providerId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
    -- Additional Better Auth fields as needed
);

CREATE INDEX idx_accounts_userId ON accounts("userId");

-- Application Tables

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);

-- Migration History (managed by Alembic)
CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL PRIMARY KEY
);
```

## Migration Strategy

### Initial Migration (001_initial_schema)
1. Create users table (Better Auth)
2. Create sessions table (Better Auth)
3. Create accounts table (Better Auth)
4. Create tasks table (application)
5. Create all indexes
6. Create all foreign key constraints

### Future Migrations
- Additive changes (new columns, indexes) via Alembic auto-generation
- Breaking changes require manual migration with data transformation
- Always test in development before production
- Document rollback procedures for each migration

## Acceptance Checklist

Before considering this feature complete, verify:

- [ ] All four tables created successfully in Neon PostgreSQL
- [ ] Foreign key constraints enforced (tasks.user_id → users.id)
- [ ] Cascade deletion works (deleting user removes tasks, sessions, accounts)
- [ ] UNIQUE constraints prevent duplicate emails and tokens
- [ ] NOT NULL constraints prevent invalid data
- [ ] Indexes on tasks.user_id and tasks.completed exist and are used by queries
- [ ] Alembic migration runs successfully and records version
- [ ] Better Auth can create users, sessions, accounts
- [ ] SQLModel can create, read, update, delete tasks
- [ ] asyncpg connection works with Neon
- [ ] Schema is version-controlled (migration files in git)
- [ ] EXPLAIN ANALYZE confirms index usage for user_id and completed queries
- [ ] Mixed naming conventions (camelCase/snake_case) documented
- [ ] Environment variable DATABASE_URL configured for Neon
- [ ] Migration rollback tested successfully
