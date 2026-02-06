# ADR-0001: Event-Driven Recurring Tasks with Kafka

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Proposed
- **Date:** 2026-02-03
- **Feature:** 001-recurring-tasks, 004-cloud-deployment
- **Context:** The todo application requires recurring tasks functionality where tasks automatically recreate themselves on completion according to daily, weekly, or monthly patterns. This requires a reliable mechanism to detect task completion events, process them asynchronously, and create new task instances without blocking user interactions or risking data loss during failures.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security?
     2) Alternatives: Multiple viable options considered with tradeoffs?
     3) Scope: Cross-cutting concern (not an isolated detail)?
     If any are false, prefer capturing as a PHR note instead of an ADR. -->

## Decision

Adopt an event-driven architecture for recurring tasks using **Kafka** (via Redpanda Cloud) as the message broker and **Dapr Pub/Sub** as the abstraction layer. This architecture consists of:

- **Event Publisher**: FastAPI backend publishes `task.completed` events to Kafka when a recurring task is marked as complete
- **Event Broker**: Redpanda Cloud (Kafka-compatible) provides durable event streaming with exactly-once delivery semantics
- **Event Subscriber**: Background worker service subscribes to `task.completed` events via Dapr and creates next task instances
- **Abstraction Layer**: Dapr Pub/Sub component provides cloud-agnostic pub/sub semantics, connection pooling, and retry handling
- **State Management**: Dapr State Store (backed by PostgreSQL) ensures idempotent event processing to prevent duplicate task creation

## Consequences

### Positive

- **Reliability**: Kafka's durability guarantees (configurable replication, retention) ensure events are not lost even if worker services crash or restart
- **Scalability**: Event-driven architecture allows horizontal scaling of worker services independently from the API backend
- **Decoupling**: Publisher (FastAPI) and subscriber (worker) operate independently; API remains responsive even if background processing is temporarily unavailable
- **Exactly-once processing**: Dapr State Store + event deduplication prevents duplicate task creation when retries occur
- **Observability**: Event stream provides audit trail of all task completions and recurring task generation for debugging
- **Cloud-agnostic**: Dapr Pub/Sub abstraction allows switching message brokers (Kafka, RabbitMQ, Azure Service Bus) without code changes
- **Operational maturity**: Redpanda Cloud provides managed Kafka with monitoring, backups, and automatic failover

### Negative

- **Operational complexity**: Requires managing Kafka cluster (mitigated by using Redpanda Cloud managed service), Dapr runtime, and worker deployment
- **Cost**: Redpanda Cloud starts at ~$50-100/month for managed Kafka; adds to infrastructure budget beyond database and compute
- **Learning curve**: Team must understand event-driven patterns, Kafka concepts (topics, partitions, consumer groups), and Dapr components
- **Eventual consistency**: Task creation is asynchronous (typically <5 seconds); users don't see next task instance immediately after completion
- **Debugging difficulty**: Distributed event flows are harder to trace than synchronous database operations; requires log aggregation and correlation
- **Local development**: Developers need to run Kafka locally (or mock Dapr pub/sub) for testing recurring task flows
- **Network dependency**: System relies on network connectivity between services; network partitions could delay event processing

## Alternatives Considered

### Alternative 1: Database Polling with Cron Jobs

**Approach**: Run a scheduled job (cron) every 5 minutes that queries the database for recently completed recurring tasks and creates next instances.

**Why rejected**:
- Polling introduces latency (up to 5 minutes delay before next task appears)
- Inefficient at scale; scans database even when no events occur
- Risk of duplicate task creation if multiple cron instances run concurrently
- Difficult to scale horizontally; requires distributed lock coordination
- No audit trail of task completion events

### Alternative 2: In-Memory Queue (Redis Streams, Celery)

**Approach**: Use Redis Streams or Celery (with Redis broker) for task queue and asynchronous processing.

**Why rejected**:
- Redis Streams lacks strong durability guarantees (data loss on restart unless persistence configured)
- Celery adds another framework/abstraction layer; less cloud-native than Dapr
- Harder to integrate with Kubernetes-native monitoring and observability
- Less suitable for cross-service event streaming (tightly couples to Python ecosystem)
- Missing event retention for debugging and replay scenarios

### Alternative 3: Synchronous Processing in API Handler

**Approach**: When a recurring task is completed, immediately create the next instance in the same API request handler.

**Why rejected**:
- Blocks API response while creating next task; degrades user experience
- No fault tolerance; if next task creation fails, user must retry completion
- Tightly couples task completion with task creation logic
- Cannot scale processing independently from API
- Difficult to add additional event subscribers (e.g., analytics, notifications) later

### Alternative 4: Cloud-Specific Queues (Azure Service Bus, AWS SQS)

**Approach**: Use native cloud provider queuing service for event-driven processing.

**Why rejected**:
- Cloud vendor lock-in; migrating to different cloud requires code changes
- Less portable for local development and testing
- Dapr already abstracts multiple queue providers; using Dapr with Kafka provides same benefits without lock-in
- Team already planning Dapr adoption for other distributed system capabilities (state management, secrets)

## References

- Feature Spec: [specs/001-recurring-tasks/spec.md](../../specs/001-recurring-tasks/spec.md)
  - FR-004: "System MUST publish an event when a recurring task is marked as complete"
  - FR-012: "System MUST process recurring task events idempotently to prevent duplicate task creation"
  - SC-005: "Event processing handles 1000 events per hour without backlog or lost events"
- Implementation Plan: [specs/004-cloud-deployment/plan.md](../../specs/004-cloud-deployment/plan.md)
  - Phase 2: Dapr component configuration (pubsub-kafka.yaml, statestore-postgres.yaml)
  - Redpanda Cloud setup for managed Kafka ($50-100/month)
  - Dapr Pub/Sub abstraction layer design
- Related ADRs: None (first ADR)
- Evaluator Evidence:
  - [history/prompts/001-recurring-tasks/0001-create-recurring-tasks-spec.spec.prompt.md](../prompts/001-recurring-tasks/0001-create-recurring-tasks-spec.spec.prompt.md)
  - [history/prompts/004-cloud-deployment/0002-create-cloud-deployment-plan.plan.prompt.md](../prompts/004-cloud-deployment/0002-create-cloud-deployment-plan.plan.prompt.md)
