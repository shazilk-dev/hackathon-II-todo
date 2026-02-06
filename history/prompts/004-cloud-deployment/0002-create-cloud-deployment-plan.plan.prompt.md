---
id: 0002
title: create-cloud-deployment-plan
stage: plan
date: 2026-02-03
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-cloud-deployment
branch: 004-cloud-deployment
user: khans
command: /sp.plan
labels: ["cloud", "deployment", "infrastructure", "azure", "kubernetes", "dapr"]
links:
  spec: specs/004-cloud-deployment/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-cloud-deployment/plan.md
tests:
  - Constitution Check: PASS (infrastructure justified for production requirements)
---

## Prompt

/sp.plan

(Infrastructure deployment feature - adapted planning workflow for operational/DevOps feature)

## Response snapshot

Created comprehensive implementation plan for production cloud deployment, adapting the standard planning workflow for infrastructure-focused features:

1. **Planning Approach Adaptation**: Recognized this is an infrastructure/operations feature requiring different planning artifacts than application features (no data models, no API contracts - instead: infrastructure architecture, CI/CD pipelines, operational runbooks)

2. **Technical Context Defined**:
   - Azure AKS for Kubernetes orchestration (1.28+, 2-5 nodes, Standard_D2s_v3)
   - Dapr 1.14+ for distributed systems capabilities (pub/sub, state store, secrets)
   - Redpanda Cloud for Kafka-compatible event streaming
   - GitHub Actions for CI/CD automation
   - Azure Container Registry for Docker images
   - Kubernetes-native monitoring + basic Azure Monitor

3. **Constitution Check**:
   - ✅ Technology stack compliant (using existing Next.js, FastAPI, Neon PostgreSQL)
   - ✅ New infrastructure justified (AKS, Dapr, Kafka required for production)
   - ✅ Architecture constraints maintained (infrastructure layer, clean separation)
   - ✅ Security requirements met (Kubernetes Secrets, TLS, mTLS)

4. **Implementation Phases Defined**:
   - **Phase 0**: Infrastructure design (Azure account setup, AKS cluster spec, Dapr installation design, Redpanda Cloud setup, secrets strategy, cost estimation $200-230/month)
   - **Phase 1**: CI/CD pipeline (GitHub Actions workflow with test→build→deploy→notify, smoke tests, automatic rollback)
   - **Phase 2**: Dapr component configuration (pub/sub for Kafka, state store for PostgreSQL, secrets for Kubernetes)
   - **Phase 3**: Helm chart updates (add Dapr annotations, HPA for auto-scaling, production values overlay)
   - **Phase 4**: Operational scripts (setup-aks.sh, install-dapr.sh, deploy.sh, rollback.sh)

5. **Operational Procedures**:
   - Testing strategy: Pre-deployment (unit/integration/linting/type-checking/security scan) + post-deployment smoke tests
   - Monitoring: Health checks (liveness/readiness probes), logging (7-day retention), metrics (pod status, resource usage, HPA)
   - Rollback plan: Automatic (via smoke test failures) + manual (Helm revision history)
   - Security checklist: 8 items (secrets management, service principal auth, mTLS, TLS, image scanning, network policies, RBAC)

6. **Cost Management**:
   - Initial: $200-230/month (2x D2s_v3 nodes, load balancer, monitoring, Redpanda Cloud)
   - Optimized: $100-150/month (auto-scale down, reserved instances, right-sizing)
   - Target: <$0.50/user/month

7. **Success Criteria & Risk Mitigation**:
   - Deployment: Accessible in 5 min, automated in <10 min, smoke tests pass, no exposed secrets
   - Operational: 99.9% uptime, 60s auto-scaling, 2-min rollback, 7-day logs
   - Risks: Azure outage (multi-zone), deployment failure (auto-rollback), cost overrun (billing alerts), security breach (scans + RBAC)

Deliverable: Complete plan.md ready for /sp.tasks to generate implementation tasks.

## Outcome

- ✅ Impact: Comprehensive production deployment plan enabling transition from local development to publicly accessible cloud infrastructure. Provides clear roadmap for Azure AKS deployment with operational reliability (99.9% uptime), automated CI/CD (10-min deployments), and cost efficiency ($100-230/month).
- 🧪 Tests: Constitution Check passed - infrastructure additions justified for production requirements. All security requirements defined in checklist.
- 📁 Files: Created plan.md (772 lines) with 4 implementation phases, CI/CD workflow design, Dapr component specs, Helm chart updates, operational scripts, testing strategy, monitoring setup, rollback procedures, cost optimization, and risk mitigation.
- 🔁 Next prompts: /sp.tasks (generate actionable implementation tasks from plan phases)
- 🧠 Reflection: Successfully adapted standard planning workflow for infrastructure feature. Traditional plan templates focus on data models and API contracts (application features), but deployment features require infrastructure architecture, CI/CD pipelines, and operational procedures. Created custom plan structure with practical implementation phases, concrete YAML examples, shell scripts, and operational checklists.

## Evaluation notes (flywheel)

- Failure modes observed: Initial setup-plan.sh script error due to multiple "004-" prefixed spec directories (004-cloud-deployment, 004-database-schema, 004-mcp-tools) from previous work. Script correctly detected conflict - proceeded manually with correct branch context.
- Graders run and results (PASS/FAIL): Constitution Check PASS. Infrastructure additions (AKS, Dapr, Kafka) justified for production requirements. Security checklist comprehensive. Cost estimation realistic.
- Prompt variant (if applicable): Infrastructure/Operations Planning variant - differs from application feature planning. Focused on deployment architecture, CI/CD automation, operational procedures, and infrastructure-as-code rather than data models and API contracts.
- Next experiment (smallest change to try): Consider creating dedicated "Infrastructure Planning Template" variant that explicitly guides infrastructure features toward architecture diagrams, runbooks, and deployment workflows instead of data models and API contracts. Would prevent confusion when planning DevOps/operations features.
