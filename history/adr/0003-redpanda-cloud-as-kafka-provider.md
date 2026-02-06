# ADR-0003: Redpanda Cloud as Kafka Provider

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Proposed
- **Date:** 2026-02-03
- **Feature:** 004-cloud-deployment
- **Context:** The cloud deployment requires a managed Kafka service for event-driven recurring tasks (see ADR-0001). The system needs Kafka-compatible event streaming with durable message persistence, topic partitioning, and consumer group support. The deployment is on Azure AKS, but we want to avoid cloud vendor lock-in for the message broker. The team has limited Kafka operational experience and prefers a fully managed service. Budget constraints require cost-effective solution for MVP/pilot phase (~1000 events/hour, 2-3 topics initially).

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security?
     2) Alternatives: Multiple viable options considered with tradeoffs?
     3) Scope: Cross-cutting concern (not an isolated detail)?
     If any are false, prefer capturing as a PHR note instead of an ADR. -->

## Decision

Use **Redpanda Cloud** as the managed Kafka provider for event streaming infrastructure. This decision consists of:

- **Service Provider**: Redpanda Cloud (fully managed, Kafka-compatible)
- **Tier**: Starter tier ($20-50/month for pilot workload)
- **Protocol**: Kafka API (wire-compatible with Apache Kafka)
- **Access**: SASL/PLAIN authentication over TLS
- **Integration**: Via Dapr Pub/Sub component (type: pubsub.kafka)
- **Initial Topics**: `task-events` (recurring tasks), `notifications` (future use)
- **Configuration**: Connection details stored in Kubernetes Secrets
- **Operational Model**: Fully managed (Redpanda handles brokers, replication, monitoring, backups)

## Consequences

### Positive

- **Cost-Effective for MVP**: Starter tier at $20-50/month is significantly cheaper than Confluent Cloud ($100+/month) or MSK ($250+/month for similar setup)
- **Kafka Compatibility**: 100% Kafka API compatible; can migrate to Apache Kafka, Confluent, or MSK without code changes
- **Cloud-Agnostic**: Not tied to Azure; can deploy to AWS/GCP without changing message broker (vs Azure Event Hubs lock-in)
- **Operational Simplicity**: Fully managed service; no broker provisioning, replication configuration, or cluster maintenance
- **Performance**: Built on C++ (vs Java-based Kafka); claims 10x faster and 3x more efficient resource usage
- **Developer Experience**: Simple web console, clear documentation, straightforward pricing model
- **Fast Provisioning**: Cluster ready in ~5 minutes (vs hours for self-managed or MSK setup)
- **Built-in Monitoring**: Metrics dashboard included; no need to set up Prometheus/Grafana for Kafka monitoring
- **Small Team Friendly**: Minimal operational expertise required; good fit for teams without dedicated Kafka specialists

### Negative

- **Vendor Dependency**: Relies on Redpanda as service provider; migration requires finding alternative managed Kafka (mitigated by Kafka API compatibility)
- **Limited Enterprise Features**: Lacks some Confluent Cloud enterprise features (Schema Registry integration, ksqlDB, Confluent Control Center)
- **Smaller Ecosystem**: Less community support and third-party integrations compared to Confluent or AWS MSK
- **Regional Availability**: Fewer cloud regions than Confluent Cloud or Azure Event Hubs; may affect latency for global deployments
- **Maturity Concerns**: Newer company compared to Confluent; some enterprises may prefer established vendors
- **Support Tier**: Starter tier has limited support SLA; production issues may have slower response times
- **Scaling Unknowns**: Less public information on scaling patterns at high throughput compared to battle-tested Confluent/MSK
- **Lock-in Risk**: If Redpanda pricing changes significantly or service quality degrades, migration effort required (though Kafka compatibility eases this)

## Alternatives Considered

### Alternative 1: Confluent Cloud (Managed Kafka)

**Approach**: Use Confluent Cloud as managed Kafka provider. Industry leader with most mature managed Kafka offering.

**Tradeoffs**:
- ✅ Most mature managed Kafka service; battle-tested at scale
- ✅ Rich ecosystem: Schema Registry, ksqlDB, Connectors, Control Center
- ✅ Excellent documentation, tutorials, and community support
- ✅ Enterprise-grade SLAs and support options
- ✅ Available in all major cloud regions (Azure, AWS, GCP)
- ❌ Significantly more expensive: $100-300/month for comparable starter workload (5-15x cost of Redpanda)
- ❌ Complex pricing model (per GB ingress/egress, retention, partitions)
- ❌ Overkill for MVP with low event throughput (~1000 events/hour)
- ❌ Steeper learning curve; more configuration options and complexity

**Why rejected**: Cost is primary concern for pilot phase. Confluent's enterprise features (Schema Registry, ksqlDB) are not needed for current requirements. Redpanda provides sufficient Kafka compatibility at 5-15x lower cost. Can migrate to Confluent later if enterprise features become necessary.

### Alternative 2: Amazon MSK (Managed Streaming for Apache Kafka)

**Approach**: Use AWS Managed Streaming for Kafka. AWS-native managed Kafka service.

**Tradeoffs**:
- ✅ Native AWS integration (IAM, CloudWatch, VPC)
- ✅ Runs actual Apache Kafka (not compatible version)
- ✅ Good for teams already on AWS infrastructure
- ✅ Enterprise support through AWS
- ❌ Cloud lock-in to AWS; deploying on Azure AKS complicates architecture
- ❌ Expensive: $250+/month minimum (kafka.m5.large brokers, 3-node cluster)
- ❌ Requires VPC peering between Azure and AWS (complex networking, latency, cost)
- ❌ Slower provisioning (30-60 minutes for cluster setup)
- ❌ More operational overhead than Redpanda Cloud (broker sizing, scaling decisions)

**Why rejected**: Deploying on Azure AKS while using AWS MSK creates cross-cloud complexity (VPC peering, latency, data egress costs). Cost is prohibitive for MVP. If migrating fully to AWS in future, MSK becomes viable option. Redpanda Cloud is cloud-agnostic and works seamlessly with Azure deployment.

### Alternative 3: Azure Event Hubs (Kafka-Compatible Mode)

**Approach**: Use Azure Event Hubs with Kafka protocol support. Azure-native event streaming service.

**Tradeoffs**:
- ✅ Native Azure integration (deployed in same region as AKS)
- ✅ Kafka protocol compatible; minimal code changes
- ✅ Integrated billing and management within Azure portal
- ✅ Good regional availability and Azure support
- ✅ Tight integration with Azure Monitor and other Azure services
- ❌ Strong vendor lock-in to Azure ecosystem
- ❌ Not fully Kafka-compatible (lacks some Kafka features, different semantics)
- ❌ Cost: $100-200/month for comparable throughput on Standard tier
- ❌ Difficult to migrate to other clouds without rewrite
- ❌ Azure Event Hubs has different operational model than pure Kafka

**Why rejected**: Azure Event Hubs creates strong vendor lock-in to Azure. Team wants flexibility to move to AWS/GCP in future without major architecture changes. Event Hubs' Kafka compatibility has gaps; not 100% wire-compatible. Redpanda provides true Kafka API compatibility at lower cost with cloud portability.

### Alternative 4: Self-Managed Kafka on AKS

**Approach**: Deploy Apache Kafka on Azure AKS using Helm charts (Bitnami/Strimzi). Full operational control.

**Tradeoffs**:
- ✅ Full control over configuration, versions, and customization
- ✅ No per-message or throughput pricing; fixed compute cost
- ✅ No vendor dependency for message broker
- ✅ Can optimize for specific workload characteristics
- ❌ High operational burden: broker management, replication, monitoring, upgrades, security patching
- ❌ Requires Kafka expertise on team (currently lacking)
- ❌ Complex setup: ZooKeeper/KRaft, broker tuning, topic configuration, monitoring stack
- ❌ No SLA guarantee; team responsible for uptime and disaster recovery
- ❌ Estimated cost similar to managed (~$150/month for 3-node cluster on D2s_v3)
- ❌ Time-intensive: weeks to set up, tune, and operationalize vs hours for managed service

**Why rejected**: Team lacks Kafka operational expertise. Self-managed Kafka requires significant time investment in setup, tuning, and ongoing maintenance. Managed service (Redpanda Cloud) provides better reliability and faster time-to-market at comparable cost. Operational complexity not justified for MVP with low event volume. Can revisit if cost optimization becomes critical at high scale.

## References

- Feature Spec: [specs/004-cloud-deployment/spec.md](../../specs/004-cloud-deployment/spec.md)
  - FR-033: "System MUST reliably deliver events from publishers to subscribers"
  - FR-038: "System MUST handle event processing backlog without losing events"
- Related Specs: [specs/001-recurring-tasks/spec.md](../../specs/001-recurring-tasks/spec.md)
  - FR-004: "System MUST publish an event when a recurring task is marked as complete"
  - SC-005: "Event processing handles 1000 events per hour without backlog or lost events"
- Implementation Plan: [specs/004-cloud-deployment/plan.md](../../specs/004-cloud-deployment/plan.md)
  - Phase 0: Redpanda Cloud Setup (create account, provision cluster, obtain SASL credentials)
  - Phase 2: Dapr Pub/Sub component configuration (pubsub-kafka.yaml with Redpanda bootstrap servers)
  - Cost estimation: $20-50/month for starter tier
- Related ADRs:
  - [ADR-0001: Event-Driven Recurring Tasks with Kafka](./0001-event-driven-recurring-tasks-with-kafka.md) - Establishes need for Kafka-compatible message broker
  - [ADR-0002: Dapr State Management for Cloud Deployment](./0002-dapr-state-management-for-cloud-deployment.md) - Complementary infrastructure decision
- Evaluator Evidence:
  - [history/prompts/004-cloud-deployment/0002-create-cloud-deployment-plan.plan.prompt.md](../prompts/004-cloud-deployment/0002-create-cloud-deployment-plan.plan.prompt.md)
- External References:
  - Redpanda Cloud Pricing: https://redpanda.com/pricing
  - Confluent Cloud Pricing: https://www.confluent.io/confluent-cloud/pricing/
  - Kafka Compatibility: Redpanda implements Kafka API wire protocol
