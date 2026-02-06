# Implementation Plan: Phase 4 - Local Kubernetes Deployment

**Branch**: `001-local-k8s-deployment` | **Date**: 2026-02-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-local-k8s-deployment/spec.md`

**Note**: This plan documents the architecture and design decisions for containerizing the Phase 3 Todo Chatbot and deploying it to local Kubernetes using Minikube and Helm charts.

## Summary

Containerize the Phase 3 AI-powered Todo Chatbot (Next.js 16 frontend + FastAPI backend) and deploy it to local Kubernetes using Minikube. Create production-ready Docker images with multi-stage builds, implement Kubernetes manifests with health probes and resource limits, package the deployment as a Helm chart, and integrate AI-assisted DevOps tools (kubectl-ai, kagent, Gordon). Enable developers to deploy the full stack locally with a single `helm install` command, validating Kubernetes patterns before Phase 5 cloud deployment.

## Technical Context

**Language/Version**:
- Backend: Python 3.13 with strict type hints
- Frontend: TypeScript 5.7+ with Next.js 16
- Node.js: 20+ LTS

**Primary Dependencies**:
- Backend: FastAPI 0.109+, SQLModel, asyncpg, OpenAI Agents SDK 0.7+, FastMCP 2.14+
- Frontend: Next.js 16, React 19, @openai/chatkit-react 1.4.3, jsonwebtoken 9.0.3
- Container: Docker Desktop 4.38+, Minikube 1.32+, Helm 3.12+

**Storage**:
- External Neon PostgreSQL (connection pooling, async driver)
- Kubernetes ConfigMaps (non-sensitive configuration)
- Kubernetes Secrets (DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY)

**Testing**:
- Backend: pytest (unit/integration), httpx (API client tests)
- Frontend: Vitest (unit), Playwright (E2E)
- Container: docker-compose (local integration), helm lint, kubectl dry-run

**Target Platform**:
- Local Development: Minikube (Kubernetes 1.28+) on Windows WSL2/macOS/Linux
- Container Runtime: Docker Desktop with Kubernetes enabled
- Cloud Ready: Patterns validated for Phase 5 cloud deployment

**Project Type**: Multi-tier web application (Frontend + Backend + External Database)

**Performance Goals**:
- Docker build time: < 5 minutes per image
- Image sizes: Frontend < 500MB, Backend < 200MB
- Kubernetes deployment time: < 3 minutes from helm install to ready pods
- Application latency: < 500ms p95 for API requests when deployed

**Constraints**:
- Minikube resource limits: < 4GB RAM, 2 CPU cores
- Health checks: < 30 seconds startup time for both frontend and backend
- Zero downtime upgrades: Rolling updates with readiness probes
- Security: Non-root containers, secrets via Kubernetes Secrets only

**Scale/Scope**:
- Backend: 2-3 replicas (high availability testing)
- Frontend: 1-2 replicas (minimal for local testing)
- HPA: CPU-based autoscaling (50-70% threshold)
- Session management: Stateless (conversations persisted to external database)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-Planning Constitution Check (Phase 4 Kubernetes Deployment)**:

- [x] Frontend stack matches constitution (Next.js 16+, TypeScript 5.7+, Tailwind CSS, ChatKit)
  - ✅ No changes to frontend stack - containerizing existing Phase 3 implementation
- [x] Backend stack matches constitution (FastAPI, Python 3.13+, SQLModel, Neon PostgreSQL)
  - ✅ No changes to backend stack - containerizing existing Phase 3 implementation
- [x] AI stack matches constitution (OpenAI Agents SDK 0.7+, FastMCP 2.14+)
  - ✅ AI components remain unchanged - agent and MCP tools containerized as-is
- [x] Authentication uses Better Auth with JWT
  - ✅ JWT authentication preserved - same BETTER_AUTH_SECRET shared across containers
- [x] Architecture follows multi-tier structure with AI agent layer
  - ✅ Architecture unchanged - deploying existing layered structure to Kubernetes
- [x] Security principles addressed (JWT protection, user data isolation, tool access control)
  - ✅ Enhanced security - Kubernetes Secrets for credentials, non-root containers
- [x] Conversation persistence in database (stateless agent design)
  - ✅ Stateless design validated - external Neon PostgreSQL, no in-pod storage
- [x] OPENAI_API_KEY environment variable configured
  - ✅ Managed via Kubernetes Secrets - NO hardcoded values in images or manifests
- [x] No prohibited dependencies or patterns proposed
  - ✅ Only infrastructure changes - Docker, Kubernetes, Helm (no application code changes)
- [x] Scope is appropriate for hackathon (not over-engineered)
  - ✅ Minimal viable K8s deployment - basic manifests, simple Helm chart, local Minikube only

**Additional Phase 4 Security Checks**:
- [x] Container images use non-root users (FROM python:3.13-slim → add appuser)
- [x] Secrets never committed to Git (Kubernetes Secrets, .env.example template only)
- [x] Database credentials in Kubernetes Secrets (not ConfigMaps or image env vars)
- [x] CORS origins configurable per environment (ConfigMap for flexibility)
- [x] Tool access control preserved (user_id validation in MCP tools layer)

**Constitution Violations**: NONE

**Complexity Justification**: N/A - No violations to justify

## Project Structure

### Documentation (this feature)

```text
specs/001-local-k8s-deployment/
├── plan.md              # This file - deployment architecture design
├── research.md          # Phase 0 - Docker, Kubernetes, Helm research
├── data-model.md        # Phase 1 - Infrastructure entities (Pod, Deployment, Service, etc.)
├── quickstart.md        # Phase 1 - Developer setup guide
├── contracts/           # Phase 1 - Helm values schema, Kubernetes manifests
│   └── helm-values-schema.yaml
└── tasks.md             # Phase 2 - Will be created by /sp.tasks command
```

### Source Code (repository root)

**Phase 4 adds infrastructure code only - no application code changes**

```text
hackathon-todo/
├── backend/                      # Phase 3 FastAPI application (unchanged)
│   ├── src/
│   │   ├── models/               # SQLModel entities
│   │   ├── services/             # Business logic
│   │   ├── api/routers/          # FastAPI endpoints
│   │   ├── agent/                # OpenAI agent + tools
│   │   ├── mcp/                  # MCP server tools
│   │   ├── auth/                 # JWT authentication
│   │   └── db/                   # Database session management
│   ├── Dockerfile                # NEW - Multi-stage Python 3.13 build
│   ├── .dockerignore             # NEW - Exclude unnecessary files
│   ├── docker-start.sh           # NEW - Container startup script (migrations + uvicorn)
│   ├── pyproject.toml            # Existing - dependencies (unchanged)
│   └── requirements.txt          # Existing - generated from pyproject.toml
│
├── frontend/                     # Phase 3 Next.js application (unchanged)
│   ├── src/
│   │   ├── app/                  # Next.js 16 App Router
│   │   ├── components/           # React components
│   │   ├── lib/                  # API client, auth, contexts
│   │   └── types/                # TypeScript types
│   ├── Dockerfile                # NEW - Multi-stage Node.js 20 build
│   ├── .dockerignore             # NEW - Exclude node_modules, .git
│   ├── package.json              # Existing - dependencies (unchanged)
│   └── next.config.ts            # Existing - configuration (unchanged)
│
├── helm/                         # NEW - Helm chart directory
│   └── todo-chatbot/
│       ├── Chart.yaml            # Chart metadata (v2 API)
│       ├── values.yaml           # Default values (development)
│       ├── values-dev.yaml       # Development overrides
│       ├── values-staging.yaml   # Staging overrides (future Phase 5)
│       ├── values-prod.yaml      # Production overrides (future Phase 5)
│       ├── templates/
│       │   ├── _helpers.tpl      # Named templates (labels, selectors)
│       │   ├── namespace.yaml    # Dedicated namespace
│       │   ├── backend-deployment.yaml
│       │   ├── backend-service.yaml
│       │   ├── frontend-deployment.yaml
│       │   ├── frontend-service.yaml
│       │   ├── configmap.yaml    # Non-sensitive config
│       │   ├── secrets.yaml      # Template for sensitive data
│       │   ├── hpa.yaml          # Horizontal Pod Autoscaler
│       │   └── NOTES.txt         # Post-install instructions
│       └── .helmignore           # Exclude files from chart package
│
├── k8s/                          # NEW - Plain Kubernetes manifests (alternative to Helm)
│   └── base/
│       ├── namespace.yaml
│       ├── backend-deployment.yaml
│       ├── backend-service.yaml
│       ├── frontend-deployment.yaml
│       ├── frontend-service.yaml
│       ├── configmap.yaml
│       ├── secret-template.yaml  # Template only (no real secrets)
│       └── hpa.yaml
│
├── scripts/                      # NEW - Deployment automation
│   ├── deploy-minikube.sh        # Automated deployment to Minikube
│   ├── build-images.sh           # Build Docker images
│   └── cleanup.sh                # Cleanup Minikube resources
│
├── docker-compose.yml            # NEW - Local container testing
├── .env.example                  # NEW - Environment variable template
├── .dockerignore                 # Root-level (if needed)
└── README-PHASE4.md              # NEW - Phase 4 documentation
```

**Structure Decision**: Multi-tier web application with **infrastructure as code** overlay. Phase 3 application code (backend/ and frontend/) remains unchanged. Phase 4 adds:

1. **Containerization layer**: Dockerfiles, .dockerignore, docker-compose.yml
2. **Kubernetes manifests**: Helm charts (preferred) and plain YAML (alternative)
3. **Automation scripts**: Deployment, image building, cleanup
4. **Documentation**: Environment templates, README

This structure supports:
- **Local development**: docker-compose.yml for quick testing
- **Minikube deployment**: Helm chart with automation scripts
- **Cloud readiness**: Helm values-{env}.yaml for Phase 5 multi-environment deployment

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected** - Complexity tracking table not applicable.

---

## Implementation Design

### Docker Containerization Strategy

**Backend (FastAPI + Python 3.13)**:

```dockerfile
# Multi-stage build pattern
FROM python:3.13-slim AS base
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
RUN pip install uv
WORKDIR /app
COPY pyproject.toml ./
RUN uv pip install --system -e .

FROM base AS production
RUN useradd -m -u 1000 appuser
COPY --chown=appuser:appuser . .
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s CMD curl -f http://localhost:8000/health || exit 1
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Optimizations**:
- python:3.13-slim base (~150MB vs 1GB for full Python image)
- UV package manager for faster dependency resolution
- Non-root user (appuser, UID 1000) for security
- Health check endpoint (`/health`) for Kubernetes probes
- Separate build and runtime stages (no compilers in final image)

**Frontend (Next.js 16 + Node.js 20)**:

```dockerfile
# Multi-stage build with Alpine
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

**Optimizations**:
- node:20-alpine base (~180MB vs 1.5GB for full Node.js image)
- Standalone output mode (only runtime dependencies)
- Non-root user (nextjs, UID 1001)
- Static assets optimization (separate copy for better caching)
- Build-time environment variables baked into static assets

---

### Kubernetes Resource Design

**Backend Deployment**:
- **Replicas**: 2 (high availability)
- **Resources**: 500m CPU / 512Mi RAM (requests = limits for Guaranteed QoS)
- **Probes**: Liveness (10s period) + Readiness (5s period) + Startup (30s timeout)
- **Init Container**: Alembic migrations before main app starts
- **Environment**: ConfigMap (DEBUG, ENVIRONMENT, CORS_ORIGINS) + Secrets (DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY)

**Frontend Deployment**:
- **Replicas**: 1 (minimal for local testing)
- **Resources**: 250m CPU / 256Mi RAM
- **Probes**: Liveness (10s period) + Readiness (5s period)
- **Environment**: ConfigMap (NEXT_PUBLIC_API_URL, NODE_ENV)

**Services**:
- **Backend**: ClusterIP (internal only), Port 8000
- **Frontend**: ClusterIP with Minikube service exposure, Port 3000

**HPA (Backend Only)**:
- **Min**: 2 replicas, **Max**: 5 replicas
- **Target**: 70% CPU utilization
- **Cooldown**: 5 minutes (default)

---

### Helm Chart Design

**Chart Structure**:
```yaml
# Chart.yaml
apiVersion: v2
name: todo-chatbot
version: 1.0.0
appVersion: "0.1.0"
description: Phase 3 Todo Chatbot with AI Agent - Kubernetes Deployment
type: application
```

**values.yaml Pattern**:
```yaml
backend:
  image:
    repository: todo-backend
    tag: latest
    pullPolicy: IfNotPresent
  replicas: 2
  resources:
    requests: {cpu: "500m", memory: "512Mi"}
    limits: {cpu: "500m", memory: "512Mi"}
  env:
    ENVIRONMENT: development
    DEBUG: "true"
    CORS_ORIGINS: "http://localhost:3000"
  hpa:
    enabled: true
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70

frontend:
  image:
    repository: todo-frontend
    tag: latest
  replicas: 1
  resources:
    requests: {cpu: "250m", memory: "256Mi"}
    limits: {cpu: "250m", memory: "256Mi"}
  env:
    NEXT_PUBLIC_API_URL: "http://todo-backend-service:8000"
    NODE_ENV: "production"

secrets:
  DATABASE_URL: ""  # Provided at helm install time
  BETTER_AUTH_SECRET: ""
  OPENAI_API_KEY: ""

namespace: todo-chatbot
```

**_helpers.tpl (Consistent Labeling)**:
```yaml
{{- define "todo-chatbot.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "todo-chatbot.selectorLabels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

---

### Deployment Automation Script

**deploy-minikube.sh**:
```bash
#!/bin/bash
set -euo pipefail

echo "🚀 Deploying Todo Chatbot to Minikube..."

# Verify prerequisites
if ! command -v minikube &> /dev/null; then
  echo "❌ Minikube not installed"
  exit 1
fi

if ! minikube status &> /dev/null; then
  echo "❌ Minikube not running. Start with: minikube start"
  exit 1
fi

# Configure Docker to use Minikube daemon
eval $(minikube docker-env)

# Build images
echo "📦 Building Docker images..."
docker build -t todo-backend:latest -f backend/Dockerfile backend/
docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ .env file not found. Create from .env.example"
  exit 1
fi

# Validate secrets
for secret in DATABASE_URL BETTER_AUTH_SECRET OPENAI_API_KEY; do
  if [ -z "${!secret:-}" ]; then
    echo "❌ $secret not set in .env"
    exit 1
  fi
done

# Deploy with Helm
echo "🎯 Deploying with Helm..."
helm upgrade --install todo-chatbot ./helm/todo-chatbot \
  --namespace todo-chatbot \
  --create-namespace \
  --set secrets.DATABASE_URL="$DATABASE_URL" \
  --set secrets.BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  --set secrets.OPENAI_API_KEY="$OPENAI_API_KEY" \
  --wait \
  --timeout 5m

echo "✅ Deployment complete!"
echo "📊 Checking pod status..."
kubectl get pods -n todo-chatbot

echo "🌐 Access frontend:"
echo "   minikube service todo-chatbot-frontend -n todo-chatbot"
```

---

### Secret Management Strategy

**Development (Minikube)**:
- Secrets passed via `--set` flags at helm install time
- Base64 encoding (Kubernetes default, NOT encryption)
- .env.example template in Git (structure only, no values)
- Actual .env file in .gitignore (never committed)

**Production (Phase 5 - Future)**:
- External Secrets Operator or Sealed Secrets
- Integration with cloud provider secret managers (AWS Secrets Manager, Google Secret Manager)
- Automated secret rotation

**Current Approach**:
```bash
# Create Kubernetes Secret from environment variables
helm install todo-chatbot ./helm/todo-chatbot \
  --set secrets.DATABASE_URL="$DATABASE_URL" \
  --set secrets.BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  --set secrets.OPENAI_API_KEY="$OPENAI_API_KEY"
```

---

### Health Check & Probe Configuration

**Backend Probes**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 0
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 0
  periodSeconds: 5
  timeoutSeconds: 2
  failureThreshold: 2

startupProbe:
  httpGet:
    path: /health
    port: 8000
  periodSeconds: 5
  failureThreshold: 6  # 30 seconds total
```

**Probe Strategy**:
- **Startup Probe**: Handles slow container initialization (database migrations can take 10-20 seconds)
- **Liveness Probe**: Detects deadlocks, restarts unresponsive containers
- **Readiness Probe**: Removes unhealthy pods from service endpoints during rolling updates

---

### Database Migration Strategy

**Init Container Pattern**:
```yaml
initContainers:
  - name: migrations
    image: todo-backend:latest
    command: ["alembic", "upgrade", "head"]
    env:
      - name: DATABASE_URL
        valueFrom:
          secretKeyRef:
            name: todo-chatbot-secrets
            key: DATABASE_URL
```

**Benefits**:
- Migrations run **before** main app starts (prevents pod from serving traffic before schema is ready)
- Only one migration runs (even with 2+ replicas) due to database-level locks
- Pod startup blocked until migration completes (prevents race conditions)
- Failures prevent deployment (pod stays in Init:Error state)

---

### AI DevOps Tools Integration

**kubectl-ai Example Usage**:
```bash
kubectl-ai "show all pods in todo-chatbot namespace that are not running"
kubectl-ai "scale the backend deployment to 3 replicas"
kubectl-ai "check why the backend pod is failing"
```

**kagent Example Usage**:
```bash
kagent "analyze resource allocation for todo-chatbot namespace"
kagent "recommend CPU and memory limits for backend deployment"
kagent "troubleshoot pod scheduling failures"
```

**Gordon Example Usage**:
```bash
docker ai "analyze the todo-backend Dockerfile for security issues"
docker ai "suggest ways to reduce frontend image size"
docker ai "create a .dockerignore file for this Next.js project"
```

**Documentation**: quickstart.md includes installation instructions and usage examples

---

## Phase 0 Summary

**Research Complete**: All unknowns resolved in research.md

1. ✅ Docker multi-stage build patterns researched (Python 3.13, Node.js 20)
2. ✅ Kubernetes health probe configuration determined (liveness, readiness, startup)
3. ✅ Resource limits calculated (backend 500m/512Mi, frontend 250m/256Mi)
4. ✅ Helm chart structure validated (v2 API, environment-specific values)
5. ✅ Secret management strategy defined (Kubernetes Secrets, base64 encoding)
6. ✅ Database migration approach selected (init containers with Alembic)
7. ✅ HPA configuration researched (CPU-based, 70% target, 2-5 replicas)
8. ✅ AI DevOps tools documented (kubectl-ai, kagent, Gordon)
9. ✅ Minikube deployment workflow automated (deploy-minikube.sh)
10. ✅ All alternatives considered and rationales documented

---

## Phase 1 Summary

**Design Complete**: Data model, contracts, and quickstart guide created

1. ✅ data-model.md: Infrastructure entities documented (Container Image, Pod, Deployment, Service, ConfigMap, Secret, HPA, Helm Chart)
2. ✅ contracts/helm-values-schema.yaml: Helm values validation schema with JSON Schema Draft 7
3. ✅ quickstart.md: Developer onboarding guide with prerequisites, installation, deployment, verification, and troubleshooting

**Deliverables**:
- 8 infrastructure entities modeled (no new application data entities)
- 1 Helm values schema contract (validates configuration)
- 1 comprehensive quickstart guide (30-45 minute setup time)

---

## Next Steps

**Phase 2** (Not executed by /sp.plan - requires /sp.tasks command):
1. Generate tasks.md with dependency-ordered implementation tasks
2. Tasks will cover: Dockerfile creation, Helm chart implementation, automation scripts, documentation
3. Each task will include: description, file paths, acceptance criteria, test cases

**Implementation** (After /sp.tasks completes):
1. Execute /sp.implement to generate all Phase 4 artifacts
2. Test locally with docker-compose
3. Deploy to Minikube with automated script
4. Verify success criteria (image sizes, deployment time, functionality)
5. Document learnings and prepare for Phase 5

---

## Architectural Decision Summary

| Decision Point | Choice Made | Key Rationale |
|----------------|-------------|---------------|
| Backend Base Image | python:3.13-slim | Minimal size (~150MB), security (fewer vulnerabilities), fast builds |
| Frontend Base Image | node:20-alpine | Alpine reduces size (~300MB), Node.js 20 required for Next.js 16 |
| Containerization Approach | Multi-stage builds | Separates build dependencies from runtime (smaller images, faster builds) |
| Kubernetes QoS Class | Guaranteed (requests=limits) | Predictable performance in resource-constrained Minikube |
| Helm vs Plain YAML | Helm charts (preferred) | Multi-environment support, parameterization, community standard |
| Secret Management | Kubernetes Secrets (base64) | Built-in, simple for Minikube, sufficient for Phase 4 local testing |
| Database Migrations | Init containers | Prevents race conditions, clean separation from main app |
| Health Probes | Separate liveness/readiness/startup | Startup handles slow init, liveness detects deadlocks, readiness for traffic routing |
| Autoscaling | CPU-based HPA (70% target) | Backend CPU-bound, simple metric, sufficient for Minikube testing |
| Deployment Automation | Bash script with helm upgrade | Developer-friendly, idempotent, leverages Minikube Docker daemon |

---

**Plan Status**: ✅ COMPLETE
**Phase 0 (Research)**: ✅ COMPLETE (research.md)
**Phase 1 (Design)**: ✅ COMPLETE (data-model.md, contracts/, quickstart.md)
**Phase 2 (Tasks)**: ⏸️ PENDING (/sp.tasks command required)

**Ready for**: /sp.tasks command to generate actionable implementation tasks
