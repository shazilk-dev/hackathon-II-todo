# Feature Specification: User Authentication

**Feature Branch**: `003-authentication`
**Created**: 2026-01-12
**Status**: Draft
**Input**: User description: "Create specification for Authentication feature. User Authentication with Better Auth + JWT. User Stories: 1. As a visitor, I can sign up with email and password 2. As a user, I can sign in to access my tasks 3. As a user, I can sign out 4. As a user, my session persists across browser refreshes. Technical Requirements: Better Auth on Next.js frontend for sign up/in/out, JWT tokens issued on successful authentication, Shared secret between frontend and backend (BETTER_AUTH_SECRET), FastAPI middleware verifies JWT on every API request, Token expiry: 7 days. JWT Payload: sub: user_id, email: user email, exp: expiration timestamp. Security: Passwords hashed (Better Auth handles this), JWT signature verification, HTTPS in production, HTTP-only cookies for session."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Sign Up (Priority: P1)

As a visitor to the application, I can create a new account by providing my email address and password so that I can start using the todo application with my own private task list.

**Why this priority**: Account creation is the foundation of the application. Without user accounts, there's no way to implement user-specific task lists or data isolation. This is the entry point for all new users and must work before any other features can be used.

**Independent Test**: Can be fully tested by visiting the sign-up page, entering valid email/password credentials, submitting the form, and verifying that a new user record is created in the database with a hashed password. Delivers a registered user who can then sign in.

**Acceptance Scenarios**:

1. **Given** I am a visitor on the sign-up page, **When** I enter a valid email (user@example.com) and a strong password (min 8 characters), **Then** my account is created, password is hashed, and I am redirected to the sign-in page with a success message
2. **Given** I am on the sign-up page, **When** I enter an email that already exists in the system, **Then** I see an error message "Email already registered" and am not signed in
3. **Given** I am on the sign-up page, **When** I enter an invalid email format (e.g., "notanemail"), **Then** I see a validation error "Invalid email format" before form submission
4. **Given** I am on the sign-up page, **When** I enter a password shorter than 8 characters, **Then** I see a validation error "Password must be at least 8 characters" before form submission
5. **Given** I submit a valid sign-up form, **When** the backend processes the request, **Then** the password is hashed using Better Auth's secure hashing algorithm and stored in the database (never plain text)

---

### User Story 2 - User Sign In (Priority: P1)

As a registered user, I can sign in with my email and password to access my personal task list and account, with the system maintaining my authenticated session.

**Why this priority**: Sign-in is equally critical to sign-up. Without authentication, users cannot access their tasks or prove their identity. This enables all protected features and enforces data isolation.

**Independent Test**: Can be fully tested by creating a test user, visiting the sign-in page, entering valid credentials, and verifying that a JWT token is issued and stored in an HTTP-only cookie. User is redirected to the tasks dashboard. Delivers authenticated access to the application.

**Acceptance Scenarios**:

1. **Given** I am a registered user on the sign-in page, **When** I enter my correct email and password, **Then** I receive a JWT token (stored in HTTP-only cookie), am redirected to my tasks dashboard, and see my user-specific tasks
2. **Given** I am on the sign-in page, **When** I enter a valid email but incorrect password, **Then** I see a generic error message "Invalid credentials" (no indication of which field is wrong for security)
3. **Given** I am on the sign-in page, **When** I enter an email that doesn't exist in the system, **Then** I see the same generic error message "Invalid credentials" (prevents email enumeration attacks)
4. **Given** I successfully sign in, **When** the backend validates my credentials, **Then** a JWT token is issued with payload containing user_id (sub), email, and 7-day expiration (exp)
5. **Given** I successfully sign in, **When** the JWT token is created, **Then** it is signed with the BETTER_AUTH_SECRET and stored in an HTTP-only cookie (prevents XSS token theft)
6. **Given** I am signed in, **When** I make an API request to a protected endpoint, **Then** the FastAPI middleware validates my JWT signature and expiration before allowing the request

---

### User Story 3 - Session Persistence (Priority: P2)

As a signed-in user, my session persists across browser refreshes and new tabs so that I don't have to repeatedly sign in during normal usage.

**Why this priority**: Session persistence improves user experience significantly. Without it, users would be logged out on every page refresh, making the application unusable. This builds on P1 authentication but is slightly lower priority than the core sign-in/sign-up flows.

**Independent Test**: Can be fully tested by signing in, refreshing the browser, opening a new tab to the application, and verifying that the user remains authenticated without re-entering credentials. Delivers seamless user experience.

**Acceptance Scenarios**:

1. **Given** I am signed in with a valid JWT token, **When** I refresh the browser page, **Then** my session persists and I remain signed in without re-authentication
2. **Given** I am signed in, **When** I open the application in a new browser tab, **Then** my session is recognized and I see my authenticated state
3. **Given** I am signed in, **When** I close the browser and reopen it within 7 days, **Then** my session persists and I remain signed in (persistent cookie)
4. **Given** my JWT token has expired (after 7 days), **When** I refresh the page or make an API request, **Then** I am redirected to the sign-in page with a message "Session expired, please sign in again"
5. **Given** I am signed in, **When** the frontend makes authenticated API requests, **Then** the JWT from the HTTP-only cookie is automatically included in request headers

---

### User Story 4 - User Sign Out (Priority: P3)

As a signed-in user, I can sign out of my account to end my session and protect my privacy, especially on shared devices.

**Why this priority**: Sign-out is important for security and privacy but is lower priority than authentication flows. Users can still use the app without sign-out initially, and the 7-day token expiration provides some security. However, it's essential for shared device scenarios.

**Independent Test**: Can be fully tested by signing in, clicking the sign-out button, and verifying that the JWT cookie is cleared and the user is redirected to the sign-in page. Subsequent API requests should fail authentication. Delivers secure session termination.

**Acceptance Scenarios**:

1. **Given** I am signed in, **When** I click the "Sign Out" button, **Then** my JWT cookie is cleared from the browser and I am redirected to the sign-in page
2. **Given** I just signed out, **When** I try to access a protected page (e.g., /tasks), **Then** I am redirected to the sign-in page because I am no longer authenticated
3. **Given** I just signed out, **When** an API request is made to the backend, **Then** the request fails with 401 Unauthorized because no valid JWT is present
4. **Given** I am on a protected page, **When** I sign out, **Then** the frontend clears any cached user data and I cannot access protected routes without signing in again

---

### Edge Cases

- **What happens when a JWT token is manually tampered with?** The FastAPI middleware validates the JWT signature using BETTER_AUTH_SECRET. If the signature is invalid, the request is rejected with 401 Unauthorized and the user is redirected to sign-in.

- **What happens when a user tries to access a protected API endpoint without a JWT?** The FastAPI middleware checks for the presence of a valid JWT. If missing, it returns 401 Unauthorized and the frontend redirects to the sign-in page.

- **What happens when a user's JWT expires while they're actively using the app?** The backend returns 401 Unauthorized on the next API request. The frontend detects this, displays a "Session expired" message, and redirects to the sign-in page.

- **What happens when a user signs in on multiple devices?** Each device receives its own JWT token. Both sessions remain valid until expiration or sign-out. No session conflict occurs (stateless JWT design).

- **What happens when BETTER_AUTH_SECRET is changed?** All existing JWT tokens become invalid (signature verification fails). All users are forced to sign in again. This should only happen during key rotation events.

- **What happens when a user submits sign-up form with SQL injection attempt?** Pydantic validation and SQLModel parameterized queries prevent SQL injection. Malicious input is either sanitized or rejected with validation error.

- **What happens on network failure during sign-in?** The frontend displays an error message "Network error, please try again" and the user can retry. No partial authentication state is created.

- **What happens when the database is unavailable during sign-up?** The backend returns 503 Service Unavailable. The frontend displays "Service temporarily unavailable" and the user can retry later.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow visitors to create new accounts by providing a unique email address and password (minimum 8 characters)
- **FR-002**: System MUST validate email format using standard email regex before account creation
- **FR-003**: System MUST prevent duplicate email registration and return "Email already registered" error when attempted
- **FR-004**: System MUST hash all passwords using Better Auth's secure hashing algorithm (bcrypt or argon2) before storage
- **FR-005**: System MUST never store or log passwords in plain text
- **FR-006**: System MUST allow registered users to sign in with their email and password credentials
- **FR-007**: System MUST issue JWT tokens upon successful authentication containing user_id (sub), email, and expiration timestamp (exp)
- **FR-008**: System MUST sign JWT tokens with BETTER_AUTH_SECRET shared between frontend and backend
- **FR-009**: System MUST store JWT tokens in HTTP-only cookies to prevent XSS attacks
- **FR-010**: System MUST set JWT token expiration to 7 days from issuance
- **FR-011**: System MUST validate JWT signature and expiration on every API request to protected endpoints
- **FR-012**: System MUST return 401 Unauthorized for requests with invalid, expired, or missing JWT tokens
- **FR-013**: System MUST allow signed-in users to sign out, clearing their JWT cookie and ending their session
- **FR-014**: System MUST maintain user sessions across browser refreshes and new tabs until token expiration or sign-out
- **FR-015**: System MUST return generic error messages for authentication failures (e.g., "Invalid credentials") to prevent email enumeration
- **FR-016**: System MUST redirect unauthenticated users to the sign-in page when accessing protected routes
- **FR-017**: System MUST use HTTPS in production to protect credentials and tokens in transit
- **FR-018**: System MUST validate all user inputs (email, password) on both client and server side
- **FR-019**: System MUST log authentication events (sign-up, sign-in, sign-out, failed attempts) for security auditing
- **FR-020**: System MUST use FastAPI middleware to enforce JWT validation on all protected API endpoints

### Key Entities

- **User**: Represents a registered user account with unique email, hashed password, creation timestamp, and user_id (primary key). The user entity is the foundation for data isolation - all tasks and lists will have a user_id foreign key. Attributes: id (UUID or int), email (unique, indexed), password_hash (bcrypt/argon2), created_at (datetime), updated_at (datetime).

- **JWT Token**: Represents an authentication token issued to users upon successful sign-in. Not stored in database (stateless design). Structure: { sub: user_id, email: string, exp: timestamp, iat: timestamp }. Signed with BETTER_AUTH_SECRET using HS256 algorithm.

- **Session**: Logical entity representing an authenticated user session. Implemented via HTTP-only cookie containing JWT. No server-side session storage (stateless). Session is valid until token expiration (7 days) or explicit sign-out (cookie deletion).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete account creation (sign-up) in under 30 seconds with valid credentials
- **SC-002**: Users can sign in to their account in under 15 seconds with valid credentials
- **SC-003**: 95% of sign-up attempts with valid data succeed on first try (5% failure budget for network/server issues)
- **SC-004**: 100% of passwords are hashed before storage (verified via database audit - no plain text passwords)
- **SC-005**: JWT tokens are validated on 100% of protected API requests (no bypass scenarios)
- **SC-006**: Session persists across browser refreshes 100% of the time until token expiration
- **SC-007**: Sign-out successfully clears JWT cookie and prevents subsequent authenticated requests 100% of the time
- **SC-008**: System prevents duplicate email registration 100% of the time (database unique constraint + validation)
- **SC-009**: Invalid authentication attempts return generic error messages 100% of the time (no email enumeration)
- **SC-010**: Authentication system handles 100 concurrent sign-in requests without degradation or error
- **SC-011**: JWT signature verification prevents 100% of tampered token attempts (security requirement)
- **SC-012**: Zero security vulnerabilities related to authentication in production (no SQL injection, XSS, password leakage)

### User Experience Metrics

- **UX-001**: Sign-up form provides real-time validation feedback (email format, password length) before submission
- **UX-002**: Clear error messages guide users when authentication fails (e.g., "Invalid credentials", "Email already registered")
- **UX-003**: Users remain signed in during normal usage (no unexpected session terminations within 7-day window)
- **UX-004**: Sign-out action provides immediate feedback (redirect to sign-in page with confirmation message)

### Security Metrics

- **SEC-001**: 100% of authentication endpoints use HTTPS in production
- **SEC-002**: 100% of JWT tokens are stored in HTTP-only cookies (prevents XSS)
- **SEC-003**: All authentication events are logged with timestamps and outcomes (audit trail)
- **SEC-004**: BETTER_AUTH_SECRET is stored in environment variables only (never in code or version control)
- **SEC-005**: Failed authentication attempts are rate-limited to prevent brute force attacks (future enhancement noted)

## Technical Constraints

### Frontend (Next.js + Better Auth)
- Better Auth library handles sign-up, sign-in, sign-out flows
- JWT token automatically stored in HTTP-only cookie by Better Auth
- Frontend validates email format and password length before API submission (client-side UX, not security)
- Protected routes check for valid JWT before rendering (redirect to /auth/signin if missing)

### Backend (FastAPI + JWT Middleware)
- FastAPI middleware extracts JWT from HTTP-only cookie on every request to protected endpoints
- Middleware validates JWT signature using BETTER_AUTH_SECRET (shared with frontend)
- Middleware checks token expiration (exp claim) and rejects expired tokens with 401
- User passwords hashed with Better Auth's default algorithm (bcrypt or argon2)
- User model includes: id, email (unique index), password_hash, created_at, updated_at

### Database (Neon PostgreSQL)
- Users table with unique constraint on email column
- Async database operations (asyncpg driver)
- User passwords stored as password_hash (never plain text)

### Environment Configuration
- BETTER_AUTH_SECRET: Shared secret for JWT signing/verification (minimum 32 characters, cryptographically random)
- DATABASE_URL: Neon PostgreSQL connection string
- NEXTAUTH_URL: Frontend URL for Better Auth configuration
- Environment variables stored in .env (not committed to git)

## Non-Functional Requirements

- **Performance**: Sign-up and sign-in operations complete within 2 seconds under normal load
- **Scalability**: Stateless JWT design supports horizontal scaling (no server-side session storage)
- **Security**: Passwords hashed, JWTs signed, HTTPS enforced, HTTP-only cookies used
- **Reliability**: Authentication success rate >= 99% (excluding user error cases like wrong password)
- **Maintainability**: Better Auth abstracts complexity, reducing custom authentication code

## Out of Scope (Explicitly Not Included)

- **Password reset/forgot password**: Not included in this phase (future enhancement)
- **Email verification**: Accounts are immediately active upon sign-up (no email confirmation)
- **OAuth/Social sign-in**: Only email/password authentication in this phase
- **Multi-factor authentication (MFA)**: Not included in this phase
- **Password strength requirements beyond length**: Only minimum 8 characters enforced
- **Account deletion**: Users cannot delete their accounts in this phase
- **Profile editing**: Users cannot change email or password after sign-up
- **Rate limiting on authentication endpoints**: Noted for future security enhancement
- **Refresh token flow**: Using 7-day access token expiration (no separate refresh token)
- **Remember me checkbox**: Sessions always persist for 7 days (no session-only option)

## Assumptions

- BETTER_AUTH_SECRET is securely generated and shared between frontend and backend via environment variables
- Frontend and backend are deployed on same domain or CORS is properly configured
- HTTPS is available in production environment
- Neon PostgreSQL database is accessible from both local development and production environments
- Better Auth library is compatible with Next.js 16+ and supports JWT strategy
- Users have modern browsers with cookie support enabled
- Email addresses are sufficient as unique identifiers (no username field)

## Dependencies

- **Better Auth**: Frontend authentication library (sign-up, sign-in, sign-out, JWT management)
- **FastAPI**: Backend framework with middleware support for JWT validation
- **SQLModel**: ORM for User model and database operations
- **Neon PostgreSQL**: Database for storing user records
- **python-jose or PyJWT**: Python library for JWT encoding/decoding and signature verification
- **passlib or bcrypt**: Password hashing library (if not handled by Better Auth backend integration)
- **asyncpg**: Async PostgreSQL driver for Neon database

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| BETTER_AUTH_SECRET leaked or exposed | Critical - all JWT tokens compromised | Low | Store in .env only, never commit to git, document rotation procedure |
| JWT token stolen via XSS attack | High - session hijacking | Low | Use HTTP-only cookies (prevents JS access), enforce HTTPS |
| SQL injection during sign-up/sign-in | Critical - database compromise | Low | Use SQLModel parameterized queries, Pydantic validation |
| Password brute force attacks | Medium - account compromise | Medium | Log failed attempts (future: add rate limiting) |
| Email enumeration via error messages | Low - privacy leak | Medium | Return generic "Invalid credentials" for both email and password errors |
| Token expiration during active session | Low - user inconvenience | Medium | Set 7-day expiration (reasonable balance), display clear "Session expired" message |
| Database downtime during authentication | High - no sign-up/sign-in | Low | Graceful error handling, retry logic, clear error messages to users |
| Better Auth compatibility issues with Next.js 16+ | Medium - implementation delay | Low | Verify compatibility before implementation, have fallback plan (custom JWT implementation) |

## Acceptance Checklist

Before considering this feature complete, verify:

- [ ] Sign-up creates user with hashed password (no plain text in database)
- [ ] Sign-in issues JWT with correct payload (user_id, email, exp)
- [ ] JWT stored in HTTP-only cookie (verify in browser DevTools)
- [ ] Sign-out clears JWT cookie and prevents API access
- [ ] Session persists across browser refreshes
- [ ] FastAPI middleware validates JWT on protected endpoints
- [ ] Invalid/expired/missing JWT returns 401 Unauthorized
- [ ] Generic error messages prevent email enumeration
- [ ] All authentication events logged
- [ ] BETTER_AUTH_SECRET in .env only (not in code)
- [ ] Password validation (min 8 characters) enforced
- [ ] Email format validation enforced
- [ ] Duplicate email registration prevented
- [ ] HTTPS enforced in production
- [ ] 80% test coverage on authentication code
- [ ] E2E tests cover full sign-up/sign-in/sign-out flows
