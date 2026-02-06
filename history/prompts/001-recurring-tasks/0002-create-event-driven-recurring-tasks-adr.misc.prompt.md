---
id: 0002
title: create-event-driven-recurring-tasks-adr
stage: misc
date: 2026-02-03
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-recurring-tasks
branch: 004-cloud-deployment
user: khans
command: /sp.adr "Event-Driven Recurring Tasks with Kafka"
labels: ["adr", "architecture", "kafka", "dapr", "events", "recurring-tasks"]
links:
  spec: specs/001-recurring-tasks/spec.md
  ticket: null
  adr: history/adr/0001-event-driven-recurring-tasks-with-kafka.md
  pr: null
files:
  - history/adr/0001-event-driven-recurring-tasks-with-kafka.md
tests:
  - ADR Significance Check: PASS (impact, alternatives, cross-cutting scope all true)
---

## Prompt

/sp.adr "Event-Driven Recurring Tasks with Kafka"

## Response snapshot

Created Architecture Decision Record (ADR) documenting the decision to use event-driven architecture with Kafka (via Redpanda Cloud) and Dapr Pub/Sub for recurring tasks functionality:

1. **ADR Creation**: Successfully ran create-adr.sh to generate ADR 0001 at history/adr/0001-event-driven-recurring-tasks-with-kafka.md

2. **Context Established**: The todo application requires recurring tasks that automatically recreate themselves on completion. This requires reliable, asynchronous event processing without blocking user interactions or risking data loss during failures.

3. **Decision Documented**: Adopt event-driven architecture with 5 components:
   - Event Publisher: FastAPI backend publishes task.completed events to Kafka
   - Event Broker: Redpanda Cloud (Kafka-compatible) for durable event streaming
   - Event Subscriber: Background worker service subscribes via Dapr and creates next task instances
   - Abstraction Layer: Dapr Pub/Sub provides cloud-agnostic pub/sub semantics
   - State Management: Dapr State Store (PostgreSQL-backed) ensures idempotent processing

4. **Consequences Analyzed**:
   - Positive: Reliability (durability guarantees), scalability (horizontal worker scaling), decoupling (independent services), exactly-once processing, observability (audit trail), cloud-agnostic (Dapr abstraction), operational maturity (managed Redpanda)
   - Negative: Operational complexity (managed service mitigates), cost (~$50-100/month), learning curve (event-driven patterns), eventual consistency (<5s task creation), debugging difficulty (distributed tracing needed), local development overhead, network dependency

5. **Alternatives Evaluated**: Four alternatives rejected with clear rationale:
   - Database polling with cron jobs (latency, inefficiency, race conditions)
   - In-memory queue (Redis Streams, Celery) (durability concerns, less cloud-native)
   - Synchronous processing in API (blocks users, no fault tolerance)
   - Cloud-specific queues (vendor lock-in, Dapr already provides abstraction)

6. **References Linked**: Connected ADR to recurring tasks spec (FR-004, FR-012), cloud deployment plan (Dapr configuration, Redpanda setup), and evaluation evidence (PHRs)

## Outcome

- ✅ Impact: Complete Architecture Decision Record documenting event-driven recurring tasks architecture. Captures architectural decision with clear rationale (why Kafka+Dapr over alternatives), tradeoff analysis (reliability vs complexity), and cross-references to specifications and implementation plans. Provides future team members with context for understanding system design choices.
- 🧪 Tests: ADR significance check passed all three criteria: (1) Long-term architectural impact (distributed event processing affects entire system), (2) Multiple viable alternatives considered with tradeoffs (4 alternatives rejected), (3) Cross-cutting scope (spans recurring tasks feature and cloud infrastructure).
- 📁 Files: Created and populated history/adr/0001-event-driven-recurring-tasks-with-kafka.md with complete decision documentation (context, decision, consequences, alternatives, references). Status: Proposed (awaiting implementation).
- 🔁 Next prompts: /sp.plan for 001-recurring-tasks (design event publisher/subscriber implementation), /sp.tasks (generate actionable implementation tasks for recurring tasks feature)
- 🧠 Reflection: Successfully documented first architectural decision for the project. ADR connects two features (001-recurring-tasks spec requirements + 004-cloud-deployment infrastructure plan) showing how architectural decisions often span feature boundaries. The decision to use Kafka+Dapr is significant because it establishes event-driven patterns that will influence future feature development (notifications, analytics, integrations).

## Evaluation notes (flywheel)

- Failure modes observed: Initial create-adr.sh invocation used incorrect syntax (missing --title flag). Fixed on second attempt by using proper flag syntax: `--title "Event-Driven Recurring Tasks with Kafka"`. Script correctly required the --title flag, preventing silent failures.
- Graders run and results (PASS/FAIL): ADR Significance Check PASS. All three criteria met: (1) Impact - establishes event-driven patterns for entire system, affects long-term architecture, (2) Alternatives - documented 4 viable alternatives with clear rejection rationale, (3) Scope - cross-cutting decision spanning recurring tasks feature and cloud infrastructure, influences future event-driven features.
- Prompt variant (if applicable): Cross-feature ADR - decision spans multiple features (001-recurring-tasks + 004-cloud-deployment). This demonstrates that significant architectural decisions often transcend feature boundaries and require linking specifications and plans from multiple features.
- Next experiment (smallest change to try): Consider adding ADR template guidance for cross-feature decisions. When a decision references specs/plans from multiple features, the ADR should explicitly list all affected features in front matter and explain the cross-cutting nature in the Context section. This helps future readers understand architectural decisions that establish patterns used across the system.
