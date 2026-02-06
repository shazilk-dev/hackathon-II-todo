# ADR-0004: Azure AKS for Production Kubernetes Deployment

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Proposed
- **Date:** 2026-02-03
- **Feature:** 004-cloud-deployment
- **Context:** The todo chatbot application requires production-grade Kubernetes hosting to replace local Minikube deployment. The system needs 99.9% uptime, auto-scaling (2-5 nodes), automated CI/CD integration, managed load balancing, and integration with Dapr runtime. The team has limited cloud infrastructure experience and prefers managed Kubernetes over self-hosted clusters. Budget is constrained for MVP/pilot phase. The deployment must support existing Helm charts, Dockerfiles, and integrate with Neon PostgreSQL (external managed database) and Redpanda Cloud (external Kafka service).

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security?
     2) Alternatives: Multiple viable options considered with tradeoffs?
     3) Scope: Cross-cutting concern (not an isolated detail)?
     If any are false, prefer capturing as a PHR note instead of an ADR. -->

## Decision

Use **Azure Kubernetes Service (AKS)** as the managed Kubernetes platform for production deployment. This decision consists of:

- **Cloud Provider**: Microsoft Azure
- **Kubernetes Service**: Azure Kubernetes Service (AKS) - fully managed
- **Kubernetes Version**: 1.28+ (latest stable)
- **Cluster Configuration**: `hackathon-todo-prod` cluster in East US region
- **Node Pool**: 2-5 nodes with auto-scaling, Standard_D2s_v3 VMs (2 vCPU, 8GB RAM)
- **Network Plugin**: Azure CNI (Container Network Interface) for better performance
- **Load Balancer**: Azure-managed Standard SKU LoadBalancer with static IPs
- **Container Registry**: Azure Container Registry (ACR) for Docker images
- **Monitoring**: Azure Monitor for Containers (basic tier) + Kubernetes-native logs
- **CI/CD Integration**: GitHub Actions with Azure service principal authentication
- **Secrets Management**: Kubernetes Secrets with optional Azure Key Vault integration
- **Auto-scaling**: Horizontal Pod Autoscaler (HPA) + Cluster Autoscaler built-in

## Consequences

### Positive

- **Fully Managed Control Plane**: Azure manages Kubernetes master nodes, upgrades, patching, and high availability at no extra cost
- **Strong SLA**: 99.95% uptime for multi-zone clusters (exceeds 99.9% requirement); financially-backed SLA
- **Integrated Ecosystem**: Seamless integration with Azure Monitor, Azure Container Registry, Azure Key Vault, Azure AD
- **Native Auto-scaling**: Built-in Horizontal Pod Autoscaler (HPA) and Cluster Autoscaler; no additional configuration needed
- **Cost-Effective for Small Clusters**: Only pay for worker nodes (~$150/month for 2x D2s_v3); control plane is free
- **GitHub Actions Integration**: Native Azure authentication via service principals; well-documented CI/CD workflows
- **Developer Familiarity**: Azure Portal provides accessible UI for teams less comfortable with command-line tools
- **Rapid Provisioning**: Cluster ready in ~10 minutes via Azure CLI or Portal
- **Existing Helm Compatibility**: Works with existing Helm charts from local Kubernetes deployment (001-local-k8s-deployment)
- **Dapr Support**: Official Dapr support for AKS; well-tested integration and documentation

### Negative

- **Cloud Vendor Lock-in**: Migration to AWS/GCP requires infrastructure rebuild (VPC setup, load balancers, IAM configuration)
- **Azure-Specific Tooling**: Team must learn Azure CLI, Azure Portal, Azure-specific Kubernetes features (Azure CNI, Azure Monitor)
- **Limited Regional Availability**: Fewer regions than AWS; may have higher latency for users outside North America/Europe
- **Azure CNI Complexity**: Azure CNI consumes more IP addresses than basic networking; requires VNet planning
- **Cost Uncertainty**: Azure pricing can be complex; unexpected egress charges, monitoring costs, load balancer fees
- **Monitoring Limitations**: Basic Azure Monitor tier lacks advanced features (APM, distributed tracing); requires third-party tools for deep observability
- **Node Pool Management**: Manual intervention required for node OS updates and VM size changes (cannot resize existing VMs)
- **GitHub Dependency**: CI/CD strategy tightly coupled to GitHub Actions; Azure DevOps alternative exists but less documented for this stack

## Alternatives Considered

### Alternative 1: AWS Elastic Kubernetes Service (EKS)

**Approach**: Use Amazon EKS for managed Kubernetes on AWS. Most mature and widely-adopted managed Kubernetes service.

**Tradeoffs**:
- ✅ Most mature managed Kubernetes offering; battle-tested at massive scale
- ✅ Largest ecosystem of integrations, tools, and community knowledge
- ✅ Best regional availability (33+ regions globally vs Azure's 60+ but fewer Kubernetes regions)
- ✅ Rich AWS service ecosystem (RDS, ElastiCache, SQS, Lambda integration possibilities)
- ✅ Excellent documentation and third-party tutorials
- ❌ **Control plane cost**: $0.10/hour (~$73/month) for EKS cluster in addition to worker nodes (vs free on AKS)
- ❌ More expensive overall: $73 (control plane) + $150 (nodes) = $223/month vs $150/month for AKS
- ❌ Complex VPC setup required; steeper learning curve for networking
- ❌ Team has zero AWS experience; would require learning AWS IAM, VPC, CloudWatch, ECR
- ❌ GitHub Actions integration less native than Azure (requires AWS credentials management)

**Why rejected**: **Cost** is primary concern for MVP. EKS control plane charge ($73/month) adds 50% to infrastructure budget without providing critical features for pilot phase. Team lacks AWS expertise; Azure Portal's UI friendliness better matches team skill level. Can revisit if AWS ecosystem features become necessary.

### Alternative 2: Google Kubernetes Engine (GKE)

**Approach**: Use Google GKE for managed Kubernetes on Google Cloud Platform. Known for Kubernetes expertise (Google created Kubernetes).

**Tradeoffs**:
- ✅ Best Kubernetes pedigree; Google invented Kubernetes
- ✅ Most Kubernetes-native features; fastest to adopt upstream Kubernetes releases
- ✅ Excellent auto-scaling and auto-repair capabilities
- ✅ Free control plane for zonal clusters; competitive pricing
- ✅ Strong developer experience and tooling (Cloud Console, Cloud Shell)
- ❌ Smallest cloud market share; less enterprise adoption than Azure/AWS
- ❌ Team has zero GCP experience; new cloud platform to learn
- ❌ Fewer third-party integrations compared to AWS/Azure
- ❌ Regional availability lower than Azure/AWS for some locations
- ❌ GitHub Actions integration less documented than Azure; requires GCP service account management

**Why rejected**: While GKE is technically excellent, team lacks GCP experience. Azure Portal's familiarity (some team members have used Azure) reduces onboarding friction. GCP's smaller ecosystem means less community support for troubleshooting. Can revisit if Google-specific features (GKE Autopilot, Cloud Run integration) become valuable.

### Alternative 3: DigitalOcean Kubernetes (DOKS)

**Approach**: Use DigitalOcean's managed Kubernetes service. Simpler, developer-friendly managed Kubernetes.

**Tradeoffs**:
- ✅ Simplest managed Kubernetes; excellent developer experience
- ✅ Very competitive pricing (~$120-140/month for comparable setup)
- ✅ Transparent, predictable pricing (no hidden egress/monitoring fees)
- ✅ Great documentation and tutorials for smaller teams
- ✅ Fast provisioning (5-10 minutes)
- ❌ Limited enterprise features; no advanced networking options
- ❌ Fewer integrations with third-party services compared to Azure/AWS/GCP
- ❌ Smaller scale limits; not suitable if app grows to enterprise scale
- ❌ No free tier or startup credits (Azure/AWS/GCP offer credits for new accounts)
- ❌ Less robust SLA (99.95% vs 99.99% for Azure/AWS premium tiers)
- ❌ Limited regions (fewer datacenters than Azure/AWS/GCP)

**Why rejected**: DigitalOcean is attractive for simplicity and cost but lacks enterprise credibility for future scaling. Azure/AWS/GCP offer better long-term growth path and access to advanced services (machine learning, analytics, enterprise support). Team prefers betting on major cloud provider for production deployment.

### Alternative 4: Self-Managed Kubernetes on Azure VMs

**Approach**: Deploy Kubernetes manually on Azure Virtual Machines using kubeadm or Rancher. Full operational control.

**Tradeoffs**:
- ✅ Full control over Kubernetes configuration, versions, and networking
- ✅ No managed service fees; only pay for VMs (~$150-200/month)
- ✅ Can customize every aspect of cluster (CNI, storage, ingress)
- ✅ Not locked into AKS-specific features or limitations
- ❌ **High operational burden**: Team must manage master nodes, etcd, upgrades, security patches, high availability
- ❌ Requires deep Kubernetes expertise (currently lacking on team)
- ❌ Complex setup: manual etcd cluster, load balancing for masters, certificate management
- ❌ No SLA guarantee; team responsible for uptime and disaster recovery
- ❌ Time-intensive: weeks to set up, harden, and operationalize vs hours for AKS
- ❌ Must implement auto-scaling manually (Cluster Autoscaler configuration, VM scale set integration)

**Why rejected**: Team lacks Kubernetes operational expertise. Self-managed Kubernetes requires significant time investment in setup, security hardening, and ongoing maintenance. Managed AKS provides 99.95% SLA and automatic upgrades/patches at no additional cost. Operational complexity not justified for MVP; can revisit if cost optimization becomes critical at high scale or if AKS limitations become blockers.

### Alternative 5: Serverless/Container Platforms (Azure Container Apps, AWS Fargate)

**Approach**: Use serverless container platforms instead of Kubernetes. Simpler abstraction over container orchestration.

**Tradeoffs**:
- ✅ Simpler than Kubernetes; no cluster management, nodes, or scaling configuration
- ✅ Pay-per-use pricing; can be cheaper for low-traffic applications
- ✅ Faster onboarding; less Kubernetes knowledge required
- ✅ Automatic scaling, patching, and platform updates
- ❌ **Cannot reuse existing Helm charts** from local Kubernetes deployment (001-local-k8s-deployment)
- ❌ Less control over networking, storage, and runtime configuration
- ❌ Vendor lock-in to Azure/AWS-specific platform (harder migration than Kubernetes)
- ❌ Limited Dapr integration compared to AKS (Dapr designed for Kubernetes)
- ❌ Difficult to replicate local development environment (Minikube works, Fargate doesn't)

**Why rejected**: Existing Helm charts and local Kubernetes deployment (001-local-k8s-deployment) represent significant investment. Kubernetes-based deployment allows reusing these artifacts. Dapr runtime is optimized for Kubernetes; serverless platforms have less mature Dapr support. Team wants Kubernetes skills to be transferable across cloud providers; serverless platforms are cloud-specific.

## References

- Feature Spec: [specs/004-cloud-deployment/spec.md](../../specs/004-cloud-deployment/spec.md)
  - FR-002: "System MUST achieve 99.9% uptime measured monthly"
  - FR-014: "System MUST scale from minimum 2 instances to maximum 5 instances based on CPU and memory utilization"
  - FR-025: "System MUST prevent unauthorized access to deployment pipelines and infrastructure resources"
  - SC-002: "System achieves 99.9% uptime measured over 30 days"
- Implementation Plan: [specs/004-cloud-deployment/plan.md](../../specs/004-cloud-deployment/plan.md)
  - Phase 0: Azure Account Setup, AKS Cluster Specification (2-5 nodes, Standard_D2s_v3, Azure CNI, East US)
  - Phase 1: GitHub Actions CI/CD pipeline with Azure service principal authentication
  - Cost estimation: ~$150/month for AKS worker nodes (control plane free)
  - scripts/setup-aks.sh: AKS cluster provisioning script
- Related ADRs:
  - [ADR-0001: Event-Driven Recurring Tasks with Kafka](./0001-event-driven-recurring-tasks-with-kafka.md) - Dapr Pub/Sub requires Kubernetes
  - [ADR-0002: Dapr State Management for Cloud Deployment](./0002-dapr-state-management-for-cloud-deployment.md) - Dapr State Store runs on Kubernetes
  - [ADR-0003: Redpanda Cloud as Kafka Provider](./0003-redpanda-cloud-as-kafka-provider.md) - External Kafka integrates with AKS
- Evaluator Evidence:
  - [history/prompts/004-cloud-deployment/0002-create-cloud-deployment-plan.plan.prompt.md](../prompts/004-cloud-deployment/0002-create-cloud-deployment-plan.plan.prompt.md)
- External References:
  - Azure AKS Pricing: https://azure.microsoft.com/en-us/pricing/details/kubernetes-service/
  - AKS SLA: 99.95% for multi-zone clusters
  - Existing local deployment: specs/001-local-k8s-deployment/ (Helm charts, Minikube)
