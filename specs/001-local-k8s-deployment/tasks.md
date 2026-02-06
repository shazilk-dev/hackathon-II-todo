# Tasks: Phase 4 - Local Kubernetes Deployment

**Input**: Design documents from `/specs/001-local-k8s-deployment/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), quickstart.md (complete)

**Tests**: Tests are OPTIONAL - not explicitly requested in this feature specification. Focus is on infrastructure deployment.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each deployment capability.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/`, `frontend/`, `helm/`, `k8s/`, `scripts/`
- Root level: `docker-compose.yml`, `.env.example`, `README-PHASE4.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic Docker/Kubernetes structure

- [X] T001 Create .env.example template at repository root with DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY, CORS_ORIGINS placeholders
- [X] T002 [P] Create backend/.dockerignore to exclude __pycache__, .pytest_cache, .git, .env, venv, *.pyc
- [X] T003 [P] Create frontend/.dockerignore to exclude node_modules, .next, .git, .env*, npm-debug.log
- [X] T004 Create scripts/ directory for deployment automation
- [X] T005 Create helm/todo-chatbot/ directory structure with templates/ subdirectory

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Docker images that MUST be complete before Kubernetes deployment can proceed

**⚠️ CRITICAL**: No Kubernetes deployment work can begin until Docker images are built and tested

- [X] T006 Create backend/Dockerfile with multi-stage build (python:3.13-slim base, UV package manager, non-root appuser)
- [X] T007 Add backend health check endpoint at /health returning {"status": "ok"} in backend/src/main.py
- [X] T008 Create frontend/Dockerfile with multi-stage build (node:20-alpine, standalone output, non-root nextjs user)
- [X] T009 Create docker-compose.yml at repository root for local testing with backend and frontend services
- [X] T010 Create backend/docker-start.sh script to run database migrations then start uvicorn server

**Checkpoint**: Docker images build successfully and application runs via docker-compose - Kubernetes deployment can now begin

---

## Phase 3: User Story 1 - Containerize Applications (Priority: P1) 🎯 MVP

**Goal**: Build production-ready Docker images for frontend and backend that run identically to non-containerized version

**Independent Test**: Build images, run with docker-compose, verify chatbot functionality matches Phase 3 behavior

### Implementation for User Story 1

- [X] T011 [P] [US1] Add HEALTHCHECK instruction to backend/Dockerfile for /health endpoint (30s interval)
- [X] T012 [P] [US1] Configure Next.js standalone output in frontend/next.config.ts for optimized containerization
- [X] T013 [US1] Update docker-compose.yml with environment variables from .env file and service networking
- [ ] T014 [US1] Test backend Docker image build and verify size is under 200MB
- [ ] T015 [US1] Test frontend Docker image build and verify size is under 500MB
- [ ] T016 [US1] Run docker-compose up and verify backend health endpoint responds successfully
- [ ] T017 [US1] Run docker-compose up and verify frontend serves correctly and communicates with backend
- [ ] T018 [US1] Test complete chatbot workflow in containers (sign in, create task, list tasks, complete task, delete task)
- [ ] T019 [US1] Verify database persistence by stopping/restarting containers and checking data integrity

**Checkpoint**: Containerized application fully functional - ready for Kubernetes manifests

---

## Phase 4: User Story 2 - Deploy to Local Kubernetes with Minikube (Priority: P2)

**Goal**: Deploy containerized chatbot to Minikube cluster with proper resource limits, health probes, and autoscaling

**Independent Test**: Start Minikube, apply manifests, verify all pods running and application accessible via port-forward

### Implementation for User Story 2

- [X] T020 [P] [US2] Create k8s/base/namespace.yaml defining todo-chatbot namespace
- [X] T021 [P] [US2] Create k8s/base/configmap.yaml for non-sensitive configuration (ENVIRONMENT, DEBUG, CORS_ORIGINS, NEXT_PUBLIC_API_URL, NODE_ENV)
- [X] T022 [P] [US2] Create k8s/base/secret-template.yaml (structure only) for DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY
- [X] T023 [US2] Create k8s/base/backend-deployment.yaml with 2 replicas, resource limits (500m CPU/512Mi RAM), liveness/readiness/startup probes
- [X] T024 [US2] Add init container to backend-deployment.yaml for Alembic database migrations
- [X] T025 [US2] Create k8s/base/backend-service.yaml with ClusterIP type on port 8000
- [X] T026 [P] [US2] Create k8s/base/frontend-deployment.yaml with 1 replica, resource limits (250m CPU/256Mi RAM), liveness/readiness probes
- [X] T027 [P] [US2] Create k8s/base/frontend-service.yaml with ClusterIP type on port 3000
- [X] T028 [US2] Create k8s/base/hpa.yaml for backend horizontal pod autoscaling (2-5 replicas, 70% CPU target)
- [X] T029 [US2] Create scripts/build-images.sh to configure Minikube docker-env and build both images
- [X] T030 [US2] Create scripts/deploy-minikube.sh to verify prerequisites, build images, create secrets from .env, and apply all manifests
- [ ] T031 [US2] Test deployment script with Minikube and verify all pods reach Running status within 3 minutes
- [ ] T032 [US2] Verify backend pods pass health checks and serve API requests successfully
- [ ] T033 [US2] Verify frontend pods can communicate with backend service via ClusterIP
- [ ] T034 [US2] Test application via kubectl port-forward and verify full chatbot functionality
- [ ] T035 [US2] Test pod resilience by deleting a backend pod and verifying Kubernetes recreates it automatically
- [ ] T036 [US2] Test horizontal scaling by manually scaling backend to 3 replicas and verifying all pods start successfully

**Checkpoint**: Application fully deployed to Minikube with resilience and scaling validated

---

## Phase 5: User Story 3 - Package with Helm Charts (Priority: P3)

**Goal**: Create Helm chart for simplified deployment with environment-specific configuration management

**Independent Test**: Deploy using helm install, verify all resources created, test upgrade with changed values, perform rollback

### Implementation for User Story 3

- [X] T037 [P] [US3] Create helm/todo-chatbot/Chart.yaml with apiVersion v2, name, version 1.0.0, appVersion 0.1.0, description
- [X] T038 [P] [US3] Create helm/todo-chatbot/.helmignore to exclude unnecessary files from chart package
- [X] T039 [P] [US3] Create helm/todo-chatbot/values.yaml with default configuration for backend and frontend (image repos, replicas, resources, env vars)
- [X] T040 [P] [US3] Create helm/todo-chatbot/values-dev.yaml with development environment overrides
- [X] T041 [P] [US3] Create helm/todo-chatbot/values-staging.yaml with staging environment configuration (for future Phase 5)
- [X] T042 [P] [US3] Create helm/todo-chatbot/values-prod.yaml with production environment configuration (for future Phase 5)
- [X] T043 [US3] Create helm/todo-chatbot/templates/_helpers.tpl with label and selector helper templates
- [X] T044 [US3] Create helm/todo-chatbot/templates/namespace.yaml from plain manifest using Helm templating
- [X] T045 [P] [US3] Create helm/todo-chatbot/templates/configmap.yaml using values.yaml configuration with Helm templating
- [X] T046 [P] [US3] Create helm/todo-chatbot/templates/secrets.yaml using values.yaml secrets with base64 encoding
- [X] T047 [US3] Create helm/todo-chatbot/templates/backend-deployment.yaml using values.yaml backend config with helper templates
- [X] T048 [P] [US3] Create helm/todo-chatbot/templates/backend-service.yaml using values.yaml service config
- [X] T049 [P] [US3] Create helm/todo-chatbot/templates/frontend-deployment.yaml using values.yaml frontend config with helper templates
- [X] T050 [P] [US3] Create helm/todo-chatbot/templates/frontend-service.yaml using values.yaml service config
- [X] T051 [US3] Create helm/todo-chatbot/templates/hpa.yaml with conditional rendering based on values.yaml hpa.enabled flag
- [X] T052 [US3] Create helm/todo-chatbot/templates/NOTES.txt with post-install instructions for accessing the application
- [X] T053 [US3] Update scripts/deploy-minikube.sh to use helm upgrade --install instead of kubectl apply
- [ ] T054 [US3] Test helm lint on chart and fix any validation errors
- [ ] T055 [US3] Test helm template to verify YAML generation without cluster installation
- [ ] T056 [US3] Test helm install with default values and verify all resources created successfully
- [ ] T057 [US3] Test helm upgrade with modified replica counts and verify zero-downtime rolling update
- [ ] T058 [US3] Test helm rollback and verify application reverts to previous version successfully
- [ ] T059 [US3] Test environment-specific deployment using values-dev.yaml overrides

**Checkpoint**: Helm chart fully functional with configuration management and upgrade/rollback capabilities

---

## Phase 6: User Story 4 - Use AI-Assisted DevOps Tools (Priority: P4)

**Goal**: Document AI tool usage for generating manifests, troubleshooting, and optimizing Docker images

**Independent Test**: Use AI tools to generate artifacts, compare to manual creations, validate outputs

### Implementation for User Story 4

- [X] T060 [P] [US4] Create README-PHASE4.md with overview of Phase 4 deployment architecture
- [ ] T061 [P] [US4] Add kubectl-ai installation and usage examples to README-PHASE4.md (show pod status, scale deployments, troubleshoot failures)
- [ ] T062 [P] [US4] Add kagent installation and usage examples to README-PHASE4.md (analyze resource usage, recommend optimizations, troubleshoot scheduling)
- [ ] T063 [P] [US4] Add Gordon (Docker AI) usage examples to README-PHASE4.md (analyze Dockerfiles, suggest optimizations, security improvements)
- [ ] T064 [US4] Test kubectl-ai to generate a Kubernetes deployment manifest and validate against existing backend-deployment.yaml
- [ ] T065 [US4] Test kagent to analyze todo-chatbot namespace resource allocation and document recommendations
- [ ] T066 [US4] Test Gordon to analyze backend/Dockerfile and document suggested improvements
- [ ] T067 [US4] Document at least one successful AI-generated artifact that works without modification

**Checkpoint**: AI DevOps tools documented with validated examples - optional enhancement complete

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and final validation

- [X] T068 [P] Create scripts/cleanup.sh to uninstall Helm release and delete Minikube namespace
- [X] T069 [P] Add deployment architecture diagram to README-PHASE4.md showing frontend, backend, database, and Kubernetes resources
- [X] T070 Update repository root README.md with Phase 4 deployment instructions and link to README-PHASE4.md
- [X] T071 Add troubleshooting section to README-PHASE4.md covering common issues (ImagePullBackOff, CrashLoopBackOff, CORS errors, disk space)
- [X] T072 Verify all Docker images pass security best practices (non-root users, no hardcoded secrets, minimal attack surface)
- [ ] T073 Verify all Kubernetes manifests pass kubectl apply --dry-run validation
- [ ] T074 Run full quickstart.md walkthrough and validate all steps work correctly
- [ ] T075 Measure and document Docker image sizes (verify backend < 200MB, frontend < 500MB)
- [ ] T076 Measure and document deployment time (verify < 3 minutes from helm install to ready pods)
- [ ] T077 Verify all success criteria from spec.md are met (functionality, performance, scaling, documentation)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - **User Story 1 (US1)**: Docker containerization - must complete before US2
  - **User Story 2 (US2)**: Kubernetes deployment - depends on US1 (requires Docker images)
  - **User Story 3 (US3)**: Helm charts - depends on US2 (requires working K8s manifests)
  - **User Story 4 (US4)**: AI tools - can start after US1 (independent documentation task)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Containerize**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2) - Minikube Deploy**: Depends on US1 completion (needs Docker images)
- **User Story 3 (P3) - Helm Charts**: Depends on US2 completion (needs working Kubernetes manifests)
- **User Story 4 (P4) - AI Tools**: Can start after US1 (independent of US2/US3)

### Within Each User Story

**User Story 1 (Containerization)**:
- Dockerfiles before docker-compose
- Docker images before testing
- Individual service tests before integration testing

**User Story 2 (Kubernetes)**:
- Namespace and ConfigMaps before Deployments
- Deployments before Services
- Basic manifests before HPA
- Build scripts before deployment scripts
- Deployment before testing

**User Story 3 (Helm)**:
- Chart.yaml and values files before templates
- Helper templates before resource templates
- All templates before testing
- Lint and template validation before install

**User Story 4 (AI Tools)**:
- README documentation before tool testing
- Tool testing before documenting validated artifacts

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003 can run in parallel (different .dockerignore files)

**Phase 2 (Foundational)**:
- Docker images (T006-T008) can be created in parallel after T001-T005

**User Story 1**:
- T011, T012 can run in parallel (different Dockerfile optimizations)
- T014, T015 can run in parallel (independent image builds)

**User Story 2**:
- T020, T021, T022 can run in parallel (independent manifest files)
- T026, T027 can run in parallel (frontend resources independent of backend)

**User Story 3**:
- T037-T042 can run in parallel (independent chart metadata files)
- T045, T046, T048, T050 can run in parallel (independent template files)

**User Story 4**:
- T061, T062, T063 can run in parallel (independent documentation sections)

**Phase 7 (Polish)**:
- T068, T069 can run in parallel (independent documentation)

---

## Parallel Example: User Story 2 (Kubernetes Deployment)

```bash
# Launch all base manifests together:
Task T020: "Create namespace.yaml"
Task T021: "Create configmap.yaml"
Task T022: "Create secret-template.yaml"

# Launch frontend resources together (after T023-T025 complete):
Task T026: "Create frontend-deployment.yaml"
Task T027: "Create frontend-service.yaml"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Docker images) - CRITICAL
3. Complete Phase 3: User Story 1 (Containerization)
4. **STOP and VALIDATE**: Test with docker-compose
5. Complete Phase 4: User Story 2 (Minikube deployment)
6. **STOP and VALIDATE**: Test in Minikube cluster
7. Deploy/demo basic Kubernetes deployment

### Incremental Delivery

1. Complete Setup + Foundational → Docker images ready
2. Add User Story 1 → Test with docker-compose → Local container deployment working!
3. Add User Story 2 → Test in Minikube → Kubernetes deployment working!
4. Add User Story 3 → Test Helm workflow → Professional-grade deployment!
5. Add User Story 4 → Document AI tools → Enhanced developer experience!

### Sequential Strategy (Recommended for Phase 4)

Due to dependencies, Phase 4 tasks are best executed sequentially:

1. Setup (Phase 1) - all team members
2. Foundational (Phase 2) - Docker experts
3. User Story 1 - containerization team
4. User Story 2 - Kubernetes team (after US1)
5. User Story 3 - Helm team (after US2)
6. User Story 4 - documentation team (parallel with US3)
7. Polish (Phase 7) - all team members

---

## Notes

- [P] tasks = different files, no dependencies, can execute in parallel
- [Story] label maps task to specific user story for traceability
- User Story 1 must complete before User Story 2 (K8s needs Docker images)
- User Story 2 must complete before User Story 3 (Helm needs K8s manifests)
- User Story 4 can run parallel to User Stories 2-3 (independent documentation)
- Commit after each task or logical group
- Stop at each checkpoint to validate story independently
- All secrets must be externalized (never hardcoded in images or manifests)

---

## Task Summary

**Total Tasks**: 77
- **Phase 1 (Setup)**: 5 tasks
- **Phase 2 (Foundational)**: 5 tasks (BLOCKS all user stories)
- **Phase 3 (US1 - Containerize)**: 9 tasks
- **Phase 4 (US2 - Minikube Deploy)**: 17 tasks
- **Phase 5 (US3 - Helm Charts)**: 23 tasks
- **Phase 6 (US4 - AI Tools)**: 8 tasks
- **Phase 7 (Polish)**: 10 tasks

**Parallel Opportunities**: 21 tasks marked [P] can run in parallel within their phase

**Independent User Stories**:
- US1 (Containerization) - Can deliver standalone value via docker-compose
- US2 (Minikube) - Can deliver standalone value (requires US1)
- US3 (Helm) - Can deliver standalone value (requires US2)
- US4 (AI Tools) - Can deliver standalone value (requires US1)

**Suggested MVP Scope**: Phase 1 + Phase 2 + US1 + US2 (Deploy to Minikube with plain manifests)
