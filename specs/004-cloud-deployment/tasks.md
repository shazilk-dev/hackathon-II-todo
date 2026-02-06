---
description: "Implementation tasks for Production Cloud Deployment"
---

# Tasks: Production Cloud Deployment

**Input**: Design documents from `/specs/004-cloud-deployment/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Tests are NOT explicitly requested in the specification, so test tasks are not included. Focus is on infrastructure setup, deployment automation, and operational monitoring.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each deployment capability.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Repository root**: Project root directory
- **Infrastructure**: `.github/workflows/`, `helm/`, `dapr/`, `scripts/`, `k8s/`
- **Documentation**: `docs/deployment/`, `specs/004-cloud-deployment/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Azure account setup and resource group preparation

- [ ] T001 Create Azure subscription and configure billing alerts ($50/month threshold)
- [ ] T002 Create Azure resource group `hackathon-todo-rg` in East US region
- [ ] T003 [P] Create Azure service principal for GitHub Actions authentication
- [ ] T004 [P] Create Azure Container Registry (ACR) `hackathontodoacr` for Docker images
- [ ] T005 [P] Create Redpanda Cloud account and provision starter tier cluster
- [ ] T006 Create Redpanda Cloud topics: `task-events` and `notifications`
- [ ] T007 Document Redpanda Cloud connection details (bootstrap servers, SASL credentials)

**Checkpoint**: Azure infrastructure and external services (ACR, Redpanda) ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Kubernetes infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Create AKS cluster using scripts/setup-aks.sh (2 nodes, Standard_D2s_v3, auto-scale 2-5)
- [ ] T009 Configure kubectl context for AKS cluster
- [ ] T010 Install Dapr 1.14+ on AKS using scripts/install-dapr.sh (dapr-system namespace)
- [ ] T011 Verify Dapr installation (check dapr-system pods are running)
- [ ] T012 [P] Create base Helm chart structure in helm/ (if not exists from 001-local-k8s-deployment)
- [ ] T013 [P] Create helm/values-production.yaml with production-specific configurations
- [ ] T014 [P] Create docs/deployment/azure-setup.md with Azure account setup instructions
- [ ] T015 [P] Create docs/deployment/troubleshooting.md with common deployment issues

**Checkpoint**: Foundation ready - AKS cluster running, Dapr installed, Helm charts ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Access Application from Internet (Priority: P1) 🎯 MVP

**Goal**: Deploy application to AKS with public internet accessibility via LoadBalancer

**Independent Test**: Navigate to public URL from any browser and verify application loads successfully within 3 seconds. All features (create tasks, chat) work correctly.

### Implementation for User Story 1

- [ ] T016 [P] [US1] Update helm/templates/backend-deployment.yaml with Dapr annotations (dapr.io/enabled, app-id, app-port)
- [ ] T017 [P] [US1] Update helm/templates/frontend-deployment.yaml with Dapr annotations
- [ ] T018 [P] [US1] Create helm/templates/backend-service.yaml with ClusterIP service for backend
- [ ] T019 [P] [US1] Create helm/templates/frontend-service.yaml with LoadBalancer service for frontend (public access)
- [ ] T020 [US1] Configure backend deployment resource requests/limits (256Mi RAM, 250m CPU) and limits (512Mi, 500m)
- [ ] T021 [US1] Configure frontend deployment resource requests/limits
- [ ] T022 [P] [US1] Update helm/values-production.yaml with ACR image repositories (hackathontodoacr.azurecr.io)
- [ ] T023 [P] [US1] Create helm/templates/ingress.yaml for production domain (optional - can use LoadBalancer initially)
- [ ] T024 [US1] Test Helm chart locally: helm template ./helm --values ./helm/values-production.yaml
- [ ] T025 [US1] Deploy application to AKS using helm upgrade --install hackathon-todo ./helm
- [ ] T026 [US1] Verify pods are running: kubectl get pods -n default
- [ ] T027 [US1] Get LoadBalancer external IP: kubectl get service frontend -n default
- [ ] T028 [US1] Test public accessibility: navigate to http://[EXTERNAL-IP] and verify app loads
- [ ] T029 [US1] Verify all features work (create tasks, chat with AI, view tasks)
- [ ] T030 [P] [US1] Document public URL in docs/deployment/access.md

**Checkpoint**: At this point, User Story 1 should be fully functional - application is publicly accessible from internet

---

## Phase 4: User Story 5 - Secure Application Secrets (Priority: P1)

**Goal**: Store sensitive credentials securely in Kubernetes Secrets instead of hardcoded values

**Independent Test**: Verify secrets are not visible in code repositories, logs, or error messages. Application connects to database and external services using secrets from Kubernetes Secrets.

**Note**: This is P1 priority and should be implemented before CI/CD to ensure secrets are never committed to repository

### Implementation for User Story 5

- [ ] T031 [P] [US5] Create dapr/components/secrets-kubernetes.yaml for Kubernetes secret store
- [ ] T032 [P] [US5] Create scripts/setup-secrets.sh to create Kubernetes secrets from environment variables
- [ ] T033 [US5] Create Kubernetes secret `database-credentials` with DATABASE_URL
- [ ] T034 [P] [US5] Create Kubernetes secret `openai-credentials` with OPENAI_API_KEY
- [ ] T035 [P] [US5] Create Kubernetes secret `auth-credentials` with BETTER_AUTH_SECRET
- [ ] T036 [US5] Update helm/templates/backend-deployment.yaml to reference secrets via secretKeyRef (not hardcoded)
- [ ] T037 [US5] Verify backend connects to database using secret: kubectl logs <backend-pod>
- [ ] T038 [US5] Verify no secrets appear in logs: kubectl logs <backend-pod> | grep -i "password\|secret\|key"
- [ ] T039 [US5] Test secret rotation: update secret value and verify app uses new value within 5 minutes
- [ ] T040 [P] [US5] Create docs/deployment/secrets-configuration.md with secret management instructions
- [ ] T041 [US5] Add .env.example files to repository with placeholder values (actual secrets git-ignored)

**Checkpoint**: All application secrets are stored in Kubernetes Secrets, not in code or configuration files

---

## Phase 5: User Story 2 - Automatic Deployment from Code Changes (Priority: P1)

**Goal**: Automated CI/CD pipeline that builds, tests, and deploys code changes to production within 10 minutes

**Independent Test**: Push a small code change (e.g., text update) to main branch, wait for automation to complete, verify change appears in live application within 10 minutes.

### Implementation for User Story 2

- [ ] T042 [P] [US2] Create .github/workflows/deploy-production.yml with test, build, deploy, notify jobs
- [ ] T043 [P] [US2] Configure GitHub Actions environment variables (AZURE_RESOURCE_GROUP, AKS_CLUSTER, ACR_NAME)
- [ ] T044 [US2] Implement test job in deploy-production.yml (pytest backend, Vitest frontend, ruff, eslint)
- [ ] T045 [US2] Implement build-images job to build and push Docker images to ACR with commit SHA tags
- [ ] T046 [US2] Configure Azure service principal credentials as GitHub secrets (AZURE_CREDENTIALS)
- [ ] T047 [US2] Implement deploy job to update Helm values with new image tags and run helm upgrade
- [ ] T048 [P] [US2] Create scripts/smoke-tests.sh for post-deployment health checks
- [ ] T049 [US2] Add smoke tests to deploy job (frontend HTTP 200, backend /api/health healthy)
- [ ] T050 [US2] Implement automatic rollback in deploy job if smoke tests fail (helm rollback)
- [ ] T051 [P] [US2] Implement notify job for deployment status notifications (Slack/email)
- [ ] T052 [P] [US2] Create scripts/deploy.sh for manual deployment with image tag parameter
- [ ] T053 [P] [US2] Create scripts/rollback.sh for manual rollback to previous Helm revision
- [ ] T054 [US2] Test CI/CD pipeline: push test commit to main branch and verify automated deployment
- [ ] T055 [US2] Verify deployment completes within 10 minutes from code push to live
- [ ] T056 [US2] Test rollback: introduce failing smoke test and verify automatic rollback occurs
- [ ] T057 [P] [US2] Create deployment-workflow.md with CI/CD pipeline documentation
- [ ] T058 [P] [US2] Create runbooks.md with manual deployment and rollback procedures

**Checkpoint**: Automated CI/CD pipeline is fully functional - code changes automatically deploy to production with quality gates and rollback

---

## Phase 6: User Story 3 - Handle Increased User Traffic (Priority: P2)

**Goal**: Automatic scaling of computing resources based on traffic load (2-5 instances)

**Independent Test**: Simulate increased traffic using load testing tool, verify system scales up within 60 seconds, maintains response times, then scales down when traffic decreases.

### Implementation for User Story 3

- [ ] T059 [P] [US3] Create helm/templates/hpa.yaml for backend Horizontal Pod Autoscaler (2-5 replicas, 70% CPU target)
- [ ] T060 [P] [US3] Create helm/templates/frontend-hpa.yaml for frontend Horizontal Pod Autoscaler
- [ ] T061 [US3] Update helm/values-production.yaml with autoscaling configuration (enabled: true, minReplicas: 2, maxReplicas: 5)
- [ ] T062 [US3] Deploy HPA configuration: helm upgrade hackathon-todo ./helm --values ./helm/values-production.yaml
- [ ] T063 [US3] Verify HPA is active: kubectl get hpa -n default
- [ ] T064 [P] [US3] Create scripts/load-test.sh using Apache Bench or k6 to simulate traffic
- [ ] T065 [US3] Run load test to increase CPU usage above 70% and verify pods scale up to 5 replicas within 60 seconds
- [ ] T066 [US3] Monitor scaling: kubectl get hpa -n default --watch
- [ ] T067 [US3] Verify response times remain under 1 second during scaling
- [ ] T068 [US3] Stop load test and verify pods scale down to 2 replicas after 5 minutes of low load
- [ ] T069 [US3] Verify no user requests are dropped during scaling operations (check logs for errors)

**Checkpoint**: Auto-scaling is fully functional - system automatically adjusts capacity based on traffic patterns

---

## Phase 7: User Story 4 - Monitor Application Health (Priority: P2)

**Goal**: Real-time visibility into application health, error rates, and performance metrics

**Independent Test**: Check health dashboards, deliberately cause an error, verify alerts/metrics update to reflect the issue within 30 seconds.

### Implementation for User Story 4

- [ ] T070 [P] [US4] Enable Azure Monitor for AKS cluster (if not already enabled during cluster creation)
- [ ] T071 [P] [US4] Create helm/templates/backend-health-probe.yaml with liveness and readiness probes
- [ ] T072 [P] [US4] Create helm/templates/frontend-health-probe.yaml with liveness and readiness probes
- [ ] T073 [US4] Update backend deployment with health check endpoints (livenessProbe: /health, readinessProbe: /ready)
- [ ] T074 [US4] Update frontend deployment with health check endpoints
- [ ] T075 [US4] Configure log retention in Azure Monitor (7-day retention for application logs)
- [ ] T076 [US4] Verify health probes are working: kubectl describe pod <backend-pod> (check Events section)
- [ ] T077 [US4] Test health check visibility: kubectl get pods -n default (should show Ready status)
- [ ] T078 [US4] Access logs via kubectl: kubectl logs <pod-name> --tail=100
- [ ] T079 [US4] Access logs via Azure Portal: navigate to AKS cluster > Logs > query application logs
- [ ] T080 [P] [US4] Create scripts/check-health.sh for manual health status check across all pods
- [ ] T081 [US4] Test error detection: deliberately cause an error and verify logs show error within 30 seconds
- [ ] T082 [P] [US4] Document monitoring access in docs/deployment/monitoring.md

**Checkpoint**: Monitoring and health checks are fully functional - operations team can view application health in real-time

---

## Phase 8: User Story 6 - Asynchronous Event Processing (Priority: P3)

**Goal**: Reliable event processing for recurring tasks using Dapr + Kafka (Redpanda Cloud)

**Independent Test**: Trigger an event (complete a recurring task), verify event is processed correctly and next task instance is created within 5 seconds. Test event delivery during component failures.

### Implementation for User Story 6

- [ ] T083 [P] [US6] Create dapr/components/pubsub-kafka.yaml for Redpanda Cloud pub/sub component
- [ ] T084 [P] [US6] Create dapr/components/statestore-postgres.yaml for PostgreSQL state store (idempotency)
- [ ] T085 [US6] Create Kubernetes secret `redpanda-credentials` with SASL username and password
- [ ] T086 [US6] Update pubsub-kafka.yaml with Redpanda Cloud bootstrap servers and secretKeyRef for credentials
- [ ] T087 [US6] Update statestore-postgres.yaml with database connection string from Kubernetes secret
- [ ] T088 [US6] Apply Dapr components to AKS: kubectl apply -f dapr/components/
- [ ] T089 [US6] Verify Dapr components are registered: kubectl get components -n default
- [ ] T090 [US6] Update backend code to publish events to Dapr pub/sub when recurring task is completed
- [ ] T091 [US6] Update backend code to subscribe to task-events topic and create next task instance
- [ ] T092 [US6] Deploy updated backend with Dapr pub/sub integration
- [ ] T093 [US6] Test event publishing: complete a recurring task and verify event is published to Kafka
- [ ] T094 [US6] Test event processing: verify next task instance is created within 5 seconds
- [ ] T095 [US6] Test idempotency: publish same event twice and verify only one task instance is created
- [ ] T096 [US6] Test resilience: stop backend pod during event processing and verify event is redelivered
- [ ] T097 [P] [US6] Create dapr-components/README.md with Dapr component documentation

**Checkpoint**: Event-driven architecture is fully functional - events are reliably processed with exactly-once semantics

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation, and validation

- [ ] T098 [P] Create infrastructure architecture diagram in docs/deployment/architecture.png
- [ ] T099 [P] Create docs/deployment/cost-optimization.md with cost reduction strategies
- [ ] T100 [P] Update README.md with deployment instructions and public URL
- [ ] T101 [P] Create DEPLOYMENT.md at repository root with quick start guide
- [ ] T102 Verify all Kubernetes resources have appropriate resource requests/limits
- [ ] T103 Verify all secrets are stored in Kubernetes Secrets (audit code for hardcoded values)
- [ ] T104 Run security scan on Docker images using Trivy
- [ ] T105 Configure Azure billing alerts for budget overruns ($200/month threshold)
- [ ] T106 [P] Create scripts/cleanup.sh to delete all Azure resources (for tear-down)
- [ ] T107 Perform end-to-end validation: push code change, verify automated deployment, test all features
- [ ] T108 Document troubleshooting steps in docs/deployment/troubleshooting.md
- [ ] T109 Create runbook for incident response in docs/deployment/incident-response.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US5 → US2 → US3 → US4 → US6)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Internet Access**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (P1) - Secure Secrets**: Can start after Foundational (Phase 2) - Should complete BEFORE US2 (CI/CD) to ensure secrets never committed
- **User Story 2 (P1) - Automated Deployment**: Depends on US1 (needs working deployment) and US5 (needs secrets configured) - Should complete before US3/US4
- **User Story 3 (P2) - Auto-scaling**: Can start after US1 (needs deployment working) - Independent of US2/US4/US5/US6
- **User Story 4 (P2) - Monitoring**: Can start after US1 (needs pods to monitor) - Independent of US2/US3/US5/US6
- **User Story 6 (P3) - Event Processing**: Can start after US1 and US5 (needs deployment + secrets) - Independent of US2/US3/US4

### Within Each User Story

- Infrastructure before application code
- Secrets before deployments that use them
- Deployment before health checks
- Health checks before load testing
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001-T007) can run in parallel if team has Azure permissions
- Within Foundational phase: T012-T015 can run in parallel (documentation while cluster provisions)
- Once Foundational phase completes:
  - US1, US5 can start in parallel
  - After US1+US5: US2, US3, US4 can start in parallel
  - US6 can start after US1+US5
- Within each user story: Tasks marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (respecting dependencies)

---

## Parallel Example: User Story 1

```bash
# Launch all Dapr annotation updates together:
Task T016: "Update backend-deployment.yaml with Dapr annotations"
Task T017: "Update frontend-deployment.yaml with Dapr annotations"

# Launch all service definitions together:
Task T018: "Create backend-service.yaml with ClusterIP"
Task T019: "Create frontend-service.yaml with LoadBalancer"

# Launch documentation in parallel with deployment testing:
Task T022: "Update values-production.yaml with ACR repositories"
Task T023: "Create ingress.yaml for production domain"
```

---

## Parallel Example: User Story 5

```bash
# Launch all Dapr component and secret creation together:
Task T031: "Create secrets-kubernetes.yaml for Kubernetes secret store"
Task T032: "Create setup-secrets.sh script"
Task T040: "Create secrets-configuration.md documentation"

# Launch all Kubernetes secrets creation together:
Task T033: "Create database-credentials secret"
Task T034: "Create openai-credentials secret"
Task T035: "Create auth-credentials secret"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 5 Only)

1. Complete Phase 1: Setup (Azure account, resource group, ACR, Redpanda)
2. Complete Phase 2: Foundational (AKS cluster, Dapr installation, Helm charts)
3. Complete Phase 3: User Story 1 (Deploy application with public access)
4. Complete Phase 4: User Story 5 (Configure Kubernetes Secrets)
5. **STOP and VALIDATE**: Test application is publicly accessible with secure secrets
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 + User Story 5 → Test independently → Deploy/Demo (MVP: Public app with secure secrets!)
3. Add User Story 2 → Test independently → Deploy/Demo (Automated CI/CD)
4. Add User Story 3 → Test independently → Deploy/Demo (Auto-scaling)
5. Add User Story 4 → Test independently → Deploy/Demo (Monitoring)
6. Add User Story 6 → Test independently → Deploy/Demo (Event processing)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Internet Access)
   - Developer B: User Story 5 (Secure Secrets)
   - Both stories should be independently testable
3. After US1+US5 complete:
   - Developer A: User Story 2 (CI/CD)
   - Developer B: User Story 3 (Auto-scaling)
   - Developer C: User Story 4 (Monitoring)
4. Finally: User Story 6 (Event Processing) - can be done by any developer

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are NOT included as they were not requested in specification
- Focus is on infrastructure deployment, not application feature development
- Commit after each task or logical group of tasks
- Stop at any checkpoint to validate story independently
- User Story 1 (Internet Access) is the MVP - everything else builds on it
- User Story 5 (Secure Secrets) should complete BEFORE User Story 2 (CI/CD) to prevent secrets from being committed
- User Story 6 (Event Processing) is lowest priority - can be deferred if time/budget constrained
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Cost monitoring: Set up billing alerts early to avoid unexpected Azure charges
