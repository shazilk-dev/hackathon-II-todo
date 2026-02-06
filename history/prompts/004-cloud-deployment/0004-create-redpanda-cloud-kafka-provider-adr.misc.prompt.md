---
id: 0004
title: create-redpanda-cloud-kafka-provider-adr
stage: misc
date: 2026-02-03
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-cloud-deployment
branch: 004-cloud-deployment
user: khans
command: /sp.adr "Redpanda Cloud as Kafka Provider"
labels: ["adr", "architecture", "kafka", "redpanda", "event-streaming", "managed-service"]
links:
  spec: specs/004-cloud-deployment/spec.md
  ticket: null
  adr: history/adr/0003-redpanda-cloud-as-kafka-provider.md
  pr: null
files:
  - history/adr/0003-redpanda-cloud-as-kafka-provider.md
tests:
  - ADR Significance Check: PASS (infrastructure choice, 4 alternatives, cost/vendor tradeoffs)
  - ADR Scope Check: PASS (distinct from ADR-0001 which covers event architecture pattern, this covers Kafka provider choice)
---

## Prompt

/sp.adr "Redpanda Cloud as Kafka Provider"

## Response snapshot

Created Architecture Decision Record documenting the decision to use Redpanda Cloud as the managed Kafka provider for event streaming infrastructure:

1. **Scope Analysis**: Identified that ADR-0001 (Event-Driven Recurring Tasks with Kafka) covers the architectural pattern (pub/sub vs alternatives) but does not compare Kafka providers. This ADR addresses the distinct decision of which managed Kafka service to use (Redpanda vs Confluent vs MSK vs Event Hubs).

2. **Context Established**: Cloud deployment on Azure AKS requires managed Kafka for event-driven recurring tasks. Team has limited Kafka operational experience, budget constraints for MVP phase, and needs cloud-agnostic solution to avoid vendor lock-in.

3. **Decision Documented**: Use Redpanda Cloud (fully managed, Kafka-compatible) with starter tier ($20-50/month), SASL/PLAIN authentication, integrated via Dapr Pub/Sub component (pubsub.kafka).

4. **Consequences Analyzed**:
   - Positive: Cost-effective ($20-50/month vs $100-300 for Confluent), Kafka API compatible (migration flexibility), cloud-agnostic (not Azure locked), operational simplicity (fully managed), fast provisioning (5 minutes), small team friendly
   - Negative: Vendor dependency (mitigated by Kafka compatibility), limited enterprise features vs Confluent, smaller ecosystem, fewer regions, maturity concerns, starter tier support SLA

5. **Alternatives Evaluated**: Four managed Kafka alternatives rejected with detailed tradeoffs:
   - Confluent Cloud (5-15x more expensive, overkill for MVP, enterprise features not needed)
   - Amazon MSK (cross-cloud complexity with Azure deployment, $250+/month minimum, VPC peering overhead)
   - Azure Event Hubs (Azure vendor lock-in, not fully Kafka-compatible, $100-200/month)
   - Self-managed Kafka on AKS (high operational burden, requires Kafka expertise team lacks, weeks of setup time)

6. **Cost-Driven Decision**: Primary factor is cost efficiency for MVP. Redpanda at $20-50/month provides sufficient Kafka compatibility for current workload (~1000 events/hour, 2-3 topics) at 5-15x lower cost than alternatives. Can migrate to Confluent later if enterprise features (Schema Registry, ksqlDB) become necessary.

## Outcome

- ✅ Impact: Complete Architecture Decision Record documenting managed Kafka provider choice for event streaming infrastructure. Captures cost-driven decision to use Redpanda Cloud instead of more expensive alternatives (Confluent, MSK, Event Hubs) or operationally complex self-managed Kafka. Provides future team members with rationale for choosing newer provider (Redpanda) over established vendors, with clear migration path via Kafka API compatibility.
- 🧪 Tests: ADR Significance Check PASS (infrastructure choice with long-term cost/vendor implications, 4 viable alternatives with detailed tradeoffs, cross-cutting decision affecting event streaming for all features). ADR Scope Check PASS (distinct from ADR-0001 which covers event-driven architecture pattern; this ADR focuses on provider/vendor selection within that pattern).
- 📁 Files: Created and populated history/adr/0003-redpanda-cloud-as-kafka-provider.md with complete decision documentation (context emphasizing budget constraints and cloud-agnostic goals, decision components including tier/pricing, 9 positive consequences focused on cost/simplicity, 8 negative consequences acknowledging vendor dependency, 4 alternatives with detailed cost/complexity comparisons, cross-references to ADR-0001 and cloud deployment plan). Status: Proposed.
- 🔁 Next prompts: Review ADR-0003 with team to validate managed Kafka provider choice and cost assumptions. Proceed to /sp.tasks for 004-cloud-deployment to generate implementation tasks for Redpanda Cloud setup and Dapr pub/sub configuration.
- 🧠 Reflection: This ADR demonstrates proper decision layering - ADR-0001 (architectural pattern: event-driven with Kafka) vs ADR-0003 (vendor selection: which Kafka provider). The cost analysis is critical: Redpanda at $20-50/month vs Confluent at $100-300/month represents 5-15x savings for MVP. The decision emphasizes "start cheap, migrate later if needed" principle enabled by Kafka API compatibility. Redpanda's Kafka wire protocol compatibility provides insurance against vendor lock-in - if pricing changes or service quality degrades, migration to Confluent/MSK is straightforward via Dapr component configuration change (no application code changes needed).

## Evaluation notes (flywheel)

- Failure modes observed: Initial consideration of whether this ADR duplicates ADR-0001. Properly distinguished by recognizing ADR-0001 covers architectural pattern (event-driven with Kafka vs cron/Redis/synchronous) while ADR-0003 covers vendor selection (Redpanda vs Confluent vs MSK vs Event Hubs) within that pattern. Avoided over-granular ADR by focusing on integrated decision cluster (Redpanda Cloud service + starter tier + SASL auth + Dapr integration).
- Graders run and results (PASS/FAIL): ADR Significance Check PASS - all three criteria met: (1) Impact: managed service choice affects operational model, cost structure, and migration flexibility, (2) Alternatives: 4 viable managed Kafka options evaluated with detailed cost/complexity/vendor tradeoffs, (3) Scope: cross-cutting infrastructure decision affecting all event-driven features. Cost comparison is critical data point for future reviews.
- Prompt variant (if applicable): Cost-Optimized Infrastructure ADR variant - decision driven primarily by MVP budget constraints ($20-50/month vs $100-300 alternatives). Emphasized "start cheap, migrate if needed" strategy enabled by Kafka API compatibility. Acknowledged tradeoffs (vendor dependency, limited enterprise features, maturity concerns) while making pragmatic choice for pilot phase. Pattern: optimize for current constraints while preserving migration optionality.
- Next experiment (smallest change to try): Consider adding explicit "Cost Threshold for Migration" section to cost-driven infrastructure ADRs. For this decision, would state: "Migrate to Confluent Cloud if: (1) monthly event volume exceeds 100K events/hour, (2) Schema Registry becomes requirement, or (3) Redpanda pricing increases beyond $150/month". Helps future team know when to revisit vendor choice without guessing. Standard section for "optimized for MVP, revisit at scale" decisions.
