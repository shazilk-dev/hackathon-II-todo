# ADR-0002: Dapr State Management for Cloud Deployment

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Proposed
- **Date:** 2026-02-03
- **Feature:** 004-cloud-deployment
- **Context:** The cloud deployment requires distributed state management for multiple use cases: event idempotency (preventing duplicate recurring task creation), distributed locking (coordinating concurrent operations), and potential future needs like session management and caching. Running multiple instances of backend services (2-5 pods with auto-scaling) means state cannot be stored in-memory. The solution must integrate with existing PostgreSQL database, work in Kubernetes, and avoid introducing too many new infrastructure components to manage.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security?
     2) Alternatives: Multiple viable options considered with tradeoffs?
     3) Scope: Cross-cutting concern (not an isolated detail)?
     If any are false, prefer capturing as a PHR note instead of an ADR. -->

## Decision

Use **Dapr State Store** with **PostgreSQL backend** for all distributed state management needs in the cloud deployment. This decision consists of:

- **State Store Provider**: Dapr State Management API (state.postgresql component)
- **Backend Database**: Existing Neon PostgreSQL database (no new database to manage)
- **State Tables**: `dapr_state` (key-value pairs) and `dapr_metadata` (versioning, ETags)
- **Access Pattern**: Application code uses Dapr HTTP/gRPC API, abstracted from underlying storage
- **Configuration**: Declarative YAML component (`dapr/components/statestore-postgres.yaml`)
- **Primary Use Cases**: Event idempotency tracking, distributed locking, coordination across pods
- **Integration**: Works alongside existing application database tables in same PostgreSQL instance

## Consequences

### Positive

- **Infrastructure Simplicity**: Reuses existing PostgreSQL database; no new database to provision, monitor, or pay for (vs Redis/Memcached)
- **Consistency Guarantees**: PostgreSQL ACID transactions ensure strong consistency; no eventual consistency concerns
- **Unified Storage**: Application data and distributed state in same database; simplifies backups, disaster recovery, and data locality
- **Cloud-Agnostic**: Dapr abstraction allows switching state backends (Redis, Cosmos DB, DynamoDB) without application code changes
- **Built-in Features**: Dapr provides ETags for optimistic concurrency, TTL support, bulk operations, and transactions via API
- **Operational Familiarity**: Team already operates PostgreSQL (Neon); no new operational expertise required
- **Cost Efficiency**: No additional database cost; state tables use existing PostgreSQL capacity (~$50/month Neon plan)
- **Development Simplicity**: Local development can use same PostgreSQL setup; no separate Redis for local vs production

### Negative

- **Performance Ceiling**: PostgreSQL slower than in-memory stores like Redis for high-throughput state operations (hundreds vs thousands of ops/sec)
- **Database Load**: State operations add load to application database; could affect application query performance at high scale
- **Latency**: Network round-trip to database for every state operation (~5-20ms) vs sub-millisecond for in-memory cache
- **Limited Caching**: No automatic in-memory caching layer; every state read hits database (Dapr doesn't cache by default)
- **Schema Overhead**: Adds `dapr_state` and `dapr_metadata` tables to application database; increases schema complexity
- **Not Optimized for Cache**: PostgreSQL is OLTP database, not purpose-built for cache workloads (no LRU eviction, no memory-first design)
- **Connection Pool Pressure**: State operations consume database connections from same pool as application queries; requires careful sizing
- **Debugging Complexity**: State stored in Dapr-specific schema (JSON blobs in `dapr_state` table); less readable than application tables

## Alternatives Considered

### Alternative 1: Redis/Memcached as Dedicated State Store

**Approach**: Deploy Redis (via Azure Cache for Redis or self-managed) as separate state store. Use Dapr state.redis component.

**Tradeoffs**:
- ✅ Higher performance (10-100x faster for state operations)
- ✅ Purpose-built for caching and distributed state
- ✅ Sub-millisecond latency for read/write operations
- ❌ Additional infrastructure to provision, monitor, and pay for ($50-200/month for Azure Cache)
- ❌ Another database to backup, secure, and maintain
- ❌ Data split across two databases (application data in PostgreSQL, state in Redis)
- ❌ Eventual consistency concerns if Redis fails and state is lost
- ❌ Local development requires running Redis alongside PostgreSQL

**Why rejected**: Current state management needs (event idempotency, distributed locking) are low-throughput (<100 ops/sec). PostgreSQL performance is sufficient for Phase 1. Redis adds complexity and cost without clear benefit for current scale. Can revisit if state operations exceed PostgreSQL capacity.

### Alternative 2: Application-Level State Management

**Approach**: Implement distributed state logic in application code using PostgreSQL tables with custom schema (e.g., `event_idempotency_keys` table).

**Tradeoffs**:
- ✅ Full control over schema and indexing
- ✅ No abstraction layer; direct SQL queries
- ✅ No Dapr dependency for state management
- ❌ Custom implementation for idempotency, locking, TTL, optimistic concurrency
- ❌ Not portable across state backends; tightly coupled to PostgreSQL
- ❌ Requires writing and testing distributed state logic (error-prone)
- ❌ No built-in features like bulk operations, transactions, ETags

**Why rejected**: Dapr State Store provides battle-tested distributed state patterns (ETags, TTL, bulk ops) out of the box. Custom implementation is error-prone and time-consuming. Dapr abstraction allows future migration to Redis/Cosmos DB if needed without application code changes.

### Alternative 3: Cloud-Specific State Services (Azure Cache, Azure Table Storage)

**Approach**: Use Azure-native services for state management (Azure Cache for Redis, Azure Table Storage, Azure Cosmos DB).

**Tradeoffs**:
- ✅ Fully managed by Azure; no operational overhead
- ✅ Built-in scaling, monitoring, backups
- ✅ High performance (especially Cosmos DB)
- ❌ Vendor lock-in; cannot move to other clouds without rewrite
- ❌ Additional Azure services to learn and integrate
- ❌ Dapr supports these via cloud-specific components, but loses portability
- ❌ Local development requires Azure emulators or mocks

**Why rejected**: Dapr already provides abstraction over cloud-specific services. Starting with PostgreSQL-backed state keeps deployment cloud-agnostic. Can switch to Azure Cache via Dapr configuration change if needed. Avoids vendor lock-in for MVP.

### Alternative 4: No Distributed State (Stateless Design)

**Approach**: Design application to be fully stateless; rely only on database transactions for coordination.

**Tradeoffs**:
- ✅ Simplest architecture; no state store needed
- ✅ No additional infrastructure or complexity
- ❌ Cannot implement event idempotency without state (required by spec FR-012)
- ❌ Distributed locking requires database locks (less efficient, higher contention)
- ❌ No caching layer for performance optimization
- ❌ Difficult to add future features requiring distributed coordination

**Why rejected**: Event idempotency is mandatory requirement (FR-012 in recurring tasks spec). Without distributed state, cannot guarantee exactly-once event processing. Stateless design insufficient for current requirements.

## References

- Feature Spec: [specs/004-cloud-deployment/spec.md](../../specs/004-cloud-deployment/spec.md)
  - FR-019: "System MUST store all sensitive credentials in a secure secrets manager"
  - FR-042: "System MUST support database connection pooling to handle concurrent requests efficiently"
- Related Specs: [specs/001-recurring-tasks/spec.md](../../specs/001-recurring-tasks/spec.md)
  - FR-012: "System MUST prevent creation of duplicate recurring task instances through idempotent event processing"
  - SC-007: "Zero duplicate recurring tasks created even under high concurrency or event replay scenarios"
- Implementation Plan: [specs/004-cloud-deployment/plan.md](../../specs/004-cloud-deployment/plan.md)
  - Phase 2: Dapr Component Configuration (dapr/components/statestore-postgres.yaml)
  - State store backed by Neon PostgreSQL with tables: dapr_state, dapr_metadata
- Related ADRs:
  - [ADR-0001: Event-Driven Recurring Tasks with Kafka](./0001-event-driven-recurring-tasks-with-kafka.md) - Describes how state store enables event idempotency
- Evaluator Evidence:
  - [history/prompts/004-cloud-deployment/0002-create-cloud-deployment-plan.plan.prompt.md](../prompts/004-cloud-deployment/0002-create-cloud-deployment-plan.plan.prompt.md)
