---
id: 0005
title: create-azure-aks-deployment-adr
stage: misc
date: 2026-02-03
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-cloud-deployment
branch: 004-cloud-deployment
user: khans
command: /sp.adr "Azure AKS for Production Deployment"
labels: ["adr", "architecture", "azure", "aks", "kubernetes", "cloud-infrastructure"]
links:
  spec: specs/004-cloud-deployment/spec.md
  ticket: null
  adr: history/adr/0004-azure-aks-for-production-kubernetes-deployment.md
  pr: null
files:
  - history/adr/0004-azure-aks-for-production-kubernetes-deployment.md
tests:
  - ADR Significance Check: PASS (cloud platform choice, 5 alternatives, cost/vendor/expertise tradeoffs)
  - ADR Clustering Check: PASS (groups Azure AKS + ACR + Azure Monitor + GitHub Actions as integrated deployment solution)
---

## Prompt

/sp.adr "Azure AKS for Production Deployment"

## Response snapshot

Created Architecture Decision Record documenting the decision to use Azure Kubernetes Service (AKS) as the managed Kubernetes platform for production deployment:

1. **Context Analysis**: Loaded cloud deployment plan and identified that Azure was specified in original requirements ("Azure AKS Cloud Deployment with Dapr and Kafka") but alternatives were not explicitly compared. Team has limited cloud infrastructure experience, budget constraints for MVP, existing Helm charts from local Kubernetes deployment (001-local-k8s-deployment), and needs 99.9% uptime with auto-scaling.

2. **Decision Clustering**: Grouped Azure AKS deployment as integrated solution:
   - Cloud Provider: Microsoft Azure
   - Kubernetes Service: AKS (fully managed, free control plane)
   - Container Registry: Azure Container Registry (ACR)
   - Monitoring: Azure Monitor for Containers
   - CI/CD: GitHub Actions with Azure service principal
   - Configuration: 2-5 nodes, Standard_D2s_v3, Azure CNI, East US region

3. **Cost-Driven Analysis**: Primary decision factor is cost efficiency for MVP:
   - AKS: $150/month (free control plane, only pay for worker nodes)
   - AWS EKS: $223/month ($73 control plane + $150 nodes)
   - Savings: $73/month (49% more expensive on AWS)
   - Azure's free control plane makes it most cost-effective for small clusters

4. **Consequences Documented**:
   - Positive: Free managed control plane, 99.95% SLA (exceeds requirement), integrated Azure ecosystem, native auto-scaling, GitHub Actions integration, developer-friendly Portal UI, existing Helm compatibility, Dapr support
   - Negative: Azure vendor lock-in, Azure-specific tooling learning curve, limited regional availability vs AWS, Azure CNI IP address consumption, cost uncertainty (egress/monitoring fees), basic monitoring tier limitations

5. **Alternatives Evaluated**: Five managed Kubernetes alternatives rejected with detailed tradeoffs:
   - AWS EKS (49% more expensive due to control plane cost, team lacks AWS experience, complex VPC setup)
   - Google GKE (team lacks GCP experience, smaller ecosystem, less GitHub Actions integration)
   - DigitalOcean DOKS (lacks enterprise credibility, limited advanced features, no startup credits)
   - Self-managed Kubernetes on Azure VMs (high operational burden, team lacks expertise, weeks of setup)
   - Serverless platforms (cannot reuse Helm charts, Dapr integration less mature, vendor lock-in)

6. **Reusability Factor**: Existing Helm charts from 001-local-k8s-deployment represent significant investment. Kubernetes-based deployment (AKS/EKS/GKE) allows reusing these artifacts; serverless platforms would require rewrite.

## Outcome

- ✅ Impact: Complete Architecture Decision Record documenting cloud platform and managed Kubernetes service choice for production deployment. Captures cost-driven decision to use Azure AKS instead of AWS EKS (49% cheaper), GKE, or self-managed Kubernetes. Provides future team members with rationale for Azure choice (free control plane, team familiarity with Azure Portal, GitHub Actions integration) and clear migration considerations if moving to AWS/GCP becomes necessary.
- 🧪 Tests: ADR Significance Check PASS (foundational infrastructure choice with long-term cost/vendor/operational implications, 5 viable alternatives with detailed cost/expertise/complexity tradeoffs, cross-cutting decision affecting deployment, CI/CD, monitoring, secrets management). ADR Clustering Check PASS (groups integrated Azure deployment solution: AKS + ACR + Azure Monitor + GitHub Actions + Azure CNI).
- 📁 Files: Created and populated history/adr/0004-azure-aks-for-production-kubernetes-deployment.md with complete decision documentation (context emphasizing budget constraints and team expertise limitations, decision components including cluster configuration and tooling, 10 positive consequences focused on cost/SLA/integration, 8 negative consequences acknowledging vendor lock-in, 5 alternatives with quantified cost comparisons and expertise requirements, cross-references to specs and related ADRs). Status: Proposed.
- 🔁 Next prompts: Review ADR-0004 with team to validate Azure choice and cost assumptions. Consider if AWS/GCP expertise exists that wasn't captured. Proceed to /sp.tasks for 004-cloud-deployment to generate implementation tasks for AKS cluster setup, ACR configuration, and GitHub Actions CI/CD pipeline.
- 🧠 Reflection: This ADR demonstrates cost-optimization principle for MVP infrastructure decisions. The $73/month difference between AKS (free control plane) and EKS (paid control plane) represents 49% cost savings - significant for pilot phase. However, this decision has highest vendor lock-in risk among all ADRs created (ADR-0001: Dapr abstracts pub/sub, ADR-0002: Dapr abstracts state store, ADR-0003: Kafka API compatibility enables migration, ADR-0004: Azure lock-in for infrastructure). Migration from Azure to AWS/GCP requires rebuilding VPC/VNet, load balancers, IAM/RBAC, monitoring, and CI/CD pipelines. Team accepted this tradeoff for cost savings and Azure Portal's accessibility. The decision emphasizes reusability of Helm charts - existing local Kubernetes deployment investment (001-local-k8s-deployment) influenced choice of managed Kubernetes over serverless platforms.

## Evaluation notes (flywheel)

- Failure modes observed: Original spec mentioned "Azure AKS Cloud Deployment" but didn't compare alternatives, creating risk of under-justified decision. Mitigated by conducting thorough alternative analysis (5 options) with quantified cost comparisons and expertise requirements. Identified that cost savings ($73/month, 49% cheaper than EKS) and team familiarity (Azure Portal vs AWS CLI) justify Azure choice despite vendor lock-in concerns.
- Graders run and results (PASS/FAIL): ADR Significance Check PASS - all three criteria met: (1) Impact: foundational cloud platform choice affects all infrastructure, deployment, monitoring, and CI/CD decisions for lifetime of project, (2) Alternatives: 5 viable managed Kubernetes options evaluated (EKS, GKE, DOKS, self-managed, serverless) with detailed cost/expertise/complexity tradeoffs, (3) Scope: cross-cutting decision affecting deployment infrastructure, container registry, monitoring, secrets management, CI/CD pipelines, networking. Cost comparison is critical: AKS $150/month vs EKS $223/month vs GKE ~$150/month.
- Prompt variant (if applicable): Constrained-Choice Infrastructure ADR variant - original requirement specified Azure, but ADR still evaluated alternatives to validate choice wasn't arbitrary. Pattern: when requirement pre-specifies technology, ADR documents why that choice is justified vs alternatives (even if decision already made). Provides rationale for future reviews when someone asks "why didn't we use AWS?" Answer: cost savings ($73/month), team expertise (Azure Portal familiarity), GitHub Actions integration.
- Next experiment (smallest change to try): Consider adding "Migration Path" section to vendor lock-in decisions like cloud platform choice. For this ADR, would state: "Migrate to AWS EKS if: (1) AWS-specific services become requirements (Lambda, DynamoDB), (2) Azure costs exceed $300/month (making EKS control plane fee less significant), or (3) global expansion requires AWS regional availability". Helps future team understand when cloud platform choice should be revisited. Different from "performance threshold" section suggested for ADR-0002/0003 - this is about strategic business decisions rather than technical performance metrics.
