# Phase 0 Research: Docker Containerization & Kubernetes Deployment

**Feature**: Phase 4 - Local Kubernetes Deployment
**Date**: 2026-02-02
**Status**: Complete

## Research Questions & Findings

### 1. Docker Multi-Stage Build Patterns for Python 3.13 (Backend)

**Decision**: Use python:3.13-slim base with multi-stage build for development dependencies separation

**Rationale**:
- python:3.13-slim provides minimal attack surface (~150MB vs ~1GB for full image)
- Multi-stage build separates build dependencies (compilers) from runtime
- UV package manager installed for faster dependency resolution
- Non-root user (appuser) for security compliance

**Pattern**:
```dockerfile
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

**Alternatives Considered**:
- Alpine Linux (smaller) - REJECTED: wheels not available for asyncpg, slower builds
- Full python:3.13 image - REJECTED: 1GB+ size, includes unnecessary dev tools
- Distroless images - REJECTED: no shell for debugging, complex for hackathon scope

**References**:
- [Docker Python Best Practices 2026](https://hub.docker.com/_/python)
- [Multi-Stage Build Documentation](https://docs.docker.com/build/building/multi-stage/)

---

### 2. Next.js 16 Containerization Patterns (Frontend)

**Decision**: Multi-stage build with node:20-alpine for minimal image size

**Rationale**:
- Next.js 16 requires Node.js 20+ LTS
- Alpine variant reduces image from 1.5GB to ~300MB
- Standalone output mode optimizes for container deployment
- Build-time environment variables (NEXT_PUBLIC_*) baked into static assets

**Pattern**:
```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

**Alternatives Considered**:
- Full node:20 image - REJECTED: 1.5GB size, bloated with build tools
- nginx serving static export - REJECTED: loses Server Components, API routes
- Distroless Node.js - REJECTED: Next.js server requires shell for startup scripts

**References**:
- [Next.js 16 Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying)
- [Vercel Docker Example](https://github.com/vercel/next.js/tree/canary/examples/with-docker)

---

### 3. Kubernetes Health Check Configuration (Probes)

**Decision**: Separate liveness, readiness, and startup probes with different thresholds

**Rationale**:
- **Startup probe** (30s window): Allows slow container initialization (database migrations)
- **Liveness probe** (10s period): Detects deadlocks, restarts unresponsive containers
- **Readiness probe** (5s period): Removes unhealthy pods from service endpoints
- HTTP GET probes (not exec) for lower overhead

**Backend Probe Configuration**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 0  # Startup probe handles initial delay
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
  failureThreshold: 6  # 30 seconds total (5s * 6 = 30s)
```

**Frontend Probe Configuration**:
```yaml
livenessProbe:
  httpGet:
    path: /
    port: 3000
  initialDelaySeconds: 0
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /
    port: 3000
  periodSeconds: 5
  failureThreshold: 2
```

**Alternatives Considered**:
- TCP socket probes - REJECTED: less informative, can't distinguish app vs network issues
- Exec probes (curl in container) - REJECTED: requires curl in minimal containers
- Single combined probe - REJECTED: can't distinguish startup failures from runtime failures

**References**:
- [Kubernetes Probe Best Practices 2026](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Container Health Checks](https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-setting-up-health-checks-with-readiness-and-liveness-probes)

---

### 4. Kubernetes Resource Limits & Requests

**Decision**: Set requests = limits (guaranteed QoS) with backend 500m CPU / 512Mi RAM

**Rationale**:
- **Guaranteed QoS** (requests = limits): Prevents pod eviction under memory pressure
- Backend resource-intensive (OpenAI agent, database queries): 500m CPU, 512Mi RAM
- Frontend lightweight (static serving, API proxying): 250m CPU, 256Mi RAM
- Minikube constraint: < 4GB total RAM (2 backend pods + 1 frontend pod + system = ~1.5GB)

**Resource Configuration**:
```yaml
# Backend Deployment
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 500m
    memory: 512Mi

# Frontend Deployment
resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 250m
    memory: 256Mi
```

**Alternatives Considered**:
- Burstable QoS (requests < limits) - REJECTED: unpredictable performance in Minikube
- Best Effort (no limits) - REJECTED: one pod can starve others
- Higher limits (1 CPU / 1Gi RAM) - REJECTED: exceeds Minikube constraints

**References**:
- [Kubernetes Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [QoS Classes Explained](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/)

---

### 5. Helm Chart Structure & Best Practices (2026)

**Decision**: Standard Helm chart with environment-specific values files (dev, staging, prod)

**Rationale**:
- Chart.yaml v2 API (Helm 3+) with appVersion tracking
- values.yaml contains sensible defaults for development
- values-{env}.yaml override for environment-specific configuration
- _helpers.tpl for consistent labeling and selector patterns
- NOTES.txt provides post-install instructions (minikube service command)

**Chart Structure**:
```
helm/todo-chatbot/
├── Chart.yaml             # Chart metadata, version, appVersion
├── values.yaml            # Default values (development)
├── values-dev.yaml        # Development overrides
├── values-staging.yaml    # Staging overrides (future)
├── values-prod.yaml       # Production overrides (future)
├── templates/
│   ├── _helpers.tpl       # Named templates (labels, selectors)
│   ├── namespace.yaml     # Dedicated namespace
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── configmap.yaml     # Non-sensitive config
│   ├── secrets.yaml       # Sensitive credentials
│   ├── hpa.yaml           # Horizontal Pod Autoscaler
│   └── NOTES.txt          # Post-install instructions
└── .helmignore            # Exclude files from chart package
```

**values.yaml Example**:
```yaml
backend:
  image:
    repository: todo-backend
    tag: latest
    pullPolicy: IfNotPresent
  replicas: 2
  service:
    type: ClusterIP
    port: 8000
  env:
    ENVIRONMENT: development
    DEBUG: "true"
  secrets:
    DATABASE_URL: ""  # Override at install time
    BETTER_AUTH_SECRET: ""
    OPENAI_API_KEY: ""
```

**Alternatives Considered**:
- Kustomize - REJECTED: less expressive, no templating, harder for multi-environment
- Plain YAML - REJECTED: no parameterization, difficult to maintain across environments
- Helm 2 - REJECTED: deprecated, requires Tiller, security issues

**References**:
- [Helm Best Practices 2026](https://helm.sh/docs/chart_best_practices/)
- [Helm Chart Development Guide](https://helm.sh/docs/topics/charts/)

---

### 6. Kubernetes Secret Management Strategy

**Decision**: Kubernetes Secrets with base64 encoding, externalized from Git

**Rationale**:
- Kubernetes Secrets built-in (no external dependencies for Minikube)
- Base64 encoding (not encryption) - acceptable for local development
- secret-template.yaml in Git (structure only), actual secrets via helm install --set
- .env.example provides documentation for required secrets
- Future: Sealed Secrets or External Secrets Operator for production

**Secret Creation Pattern**:
```yaml
# secret-template.yaml (COMMITTED to Git)
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "todo-chatbot.fullname" . }}-secrets
type: Opaque
data:
  DATABASE_URL: {{ .Values.secrets.DATABASE_URL | b64enc | quote }}
  BETTER_AUTH_SECRET: {{ .Values.secrets.BETTER_AUTH_SECRET | b64enc | quote }}
  OPENAI_API_KEY: {{ .Values.secrets.OPENAI_API_KEY | b64enc | quote }}
```

**Installation with Secrets**:
```bash
helm install todo-chatbot ./helm/todo-chatbot \
  --set secrets.DATABASE_URL="postgresql+asyncpg://..." \
  --set secrets.BETTER_AUTH_SECRET="DYz..." \
  --set secrets.OPENAI_API_KEY="sk-proj-..."
```

**Alternatives Considered**:
- .env files in containers - REJECTED: secrets in image layers, security risk
- ConfigMaps for secrets - REJECTED: not designed for sensitive data, visible in logs
- HashiCorp Vault - REJECTED: over-engineered for Minikube, adds infrastructure complexity
- Sealed Secrets - DEFERRED: valuable for production, unnecessary for Phase 4 local testing

**References**:
- [Kubernetes Secrets Documentation](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Managing Secrets with Helm](https://helm.sh/docs/chart_best_practices/values/#make-types-clear)

---

### 7. Database Migration Strategy for Kubernetes

**Decision**: Init container running Alembic migrations before main app starts

**Rationale**:
- **Init containers** run sequentially before pod's main containers
- Only one migration runs (even with multiple replicas) due to database locks
- Main app starts only after successful migration (or init container failure)
- Prevents race conditions (multiple pods running migrations simultaneously)

**Init Container Configuration**:
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

**Alternatives Considered**:
- Migrations in Dockerfile ENTRYPOINT - REJECTED: every pod runs migrations (race conditions)
- Kubernetes Job - REJECTED: requires manual job creation before deployment
- Manual migration step - REJECTED: error-prone, violates automation principle
- Database migration locking - CONSIDERED: Alembic has built-in locks, but init container is cleaner

**References**:
- [Kubernetes Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
- [Alembic Database Migrations](https://alembic.sqlalchemy.org/en/latest/)

---

### 8. Horizontal Pod Autoscaler (HPA) Configuration

**Decision**: CPU-based HPA for backend (50-70% CPU threshold), 2-5 replicas

**Rationale**:
- Backend CPU-bound (OpenAI API calls, JSON parsing, database queries)
- HPA scales based on average CPU utilization across all pods
- Min replicas: 2 (high availability, one pod can fail without downtime)
- Max replicas: 5 (Minikube resource constraint)
- Target: 70% CPU (balance between efficiency and headroom)

**HPA Manifest**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: todo-chatbot-backend
  minReplicas: 2
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

**Alternatives Considered**:
- Memory-based HPA - REJECTED: backend memory usage stable, not good scaling metric
- Request-based scaling (custom metrics) - REJECTED: requires Prometheus, over-engineered
- Frontend HPA - REJECTED: frontend CPU/memory usage minimal, no scaling needed
- Manual scaling (kubectl scale) - REJECTED: violates automation principle

**References**:
- [Kubernetes HPA Documentation](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [HPA Best Practices 2026](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/)

---

### 9. AI-Assisted DevOps Tools Integration

**Decision**: Document kubectl-ai, kagent, Gordon usage patterns in README

**Rationale**:
- **kubectl-ai** (Google Cloud Platform): Natural language Kubernetes commands
- **kagent** (InfraCloud): Cluster diagnostics and recommendations
- **Gordon** (Docker AI): Dockerfile generation and optimization
- All tools optional (don't block deployment if unavailable)
- Documentation provides onboarding value and demonstrates AI tool fluency

**Usage Examples**:

```bash
# kubectl-ai (natural language commands)
kubectl-ai "deploy todo backend with 3 replicas"
kubectl-ai "scale the frontend to handle more traffic"
kubectl-ai "check why backend pods are crashing"

# kagent (cluster analysis)
kagent "analyze resource allocation for todo-chatbot namespace"
kagent "recommend optimizations for backend deployment"
kagent "troubleshoot pod scheduling issues"

# Gordon (Dockerfile assistance)
docker ai "analyze the todo-backend Dockerfile for improvements"
docker ai "create a multi-stage Dockerfile for this FastAPI app"
docker ai "optimize image size while maintaining security"
```

**Alternatives Considered**:
- Manual Kubernetes commands only - REJECTED: misses hackathon bonus points opportunity
- AI tool automation in scripts - REJECTED: tools not deterministic, can't automate
- Custom GPT wrapper - REJECTED: over-engineered, these tools already exist

**References**:
- [kubectl-ai GitHub](https://github.com/GoogleCloudPlatform/kubectl-ai)
- [InfraCloud Kagent Blog](https://www.infracloud.io/blogs/ai-agents-for-kubernetes/)
- [Docker Gordon Documentation](https://docs.docker.com/ai/gordon/)

---

### 10. Minikube Deployment Workflow & Automation

**Decision**: Automated deployment script using `minikube docker-env` and Helm

**Rationale**:
- Minikube has built-in Docker daemon - no image registry needed
- `eval $(minikube docker-env)` builds images directly in Minikube
- Helm upgrade --install provides idempotent deployments
- Single script reduces friction for developers
- Manual secret passing prevents accidental commits

**Deployment Script (deploy-minikube.sh)**:
```bash
#!/bin/bash
set -euo pipefail

echo "🚀 Deploying Todo Chatbot to Minikube..."

# Configure Docker to use Minikube daemon
eval $(minikube docker-env)

# Build images
echo "📦 Building Docker images..."
docker build -t todo-backend:latest -f backend/Dockerfile backend/
docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/

# Check for secrets
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL not set. Export it first."
  exit 1
fi

# Deploy with Helm
echo "🎯 Deploying with Helm..."
helm upgrade --install todo-chatbot ./helm/todo-chatbot \
  --namespace todo-chatbot \
  --create-namespace \
  --set secrets.DATABASE_URL="$DATABASE_URL" \
  --set secrets.BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  --set secrets.OPENAI_API_KEY="$OPENAI_API_KEY" \
  --wait

echo "✅ Deployment complete!"
echo "Access frontend: minikube service todo-chatbot-frontend -n todo-chatbot"
```

**Alternatives Considered**:
- Manual docker build + kubectl apply - REJECTED: error-prone, multiple commands
- Skaffold - REJECTED: adds complexity, learning curve for hackathon
- Tilt - REJECTED: over-engineered for single deployment scenario
- CI/CD pipeline - DEFERRED: Phase 5 (cloud deployment) scope

**References**:
- [Minikube Docker Environment](https://minikube.sigs.k8s.io/docs/handbook/pushing/)
- [Helm Upgrade Documentation](https://helm.sh/docs/helm/helm_upgrade/)

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Backend Image** | python:3.13-slim multi-stage | Minimal size (<200MB), security (non-root), fast builds |
| **Frontend Image** | node:20-alpine multi-stage | Alpine reduces size (~300MB), Node.js 20 for Next.js 16 |
| **Health Probes** | Separate liveness/readiness/startup | Startup probe handles slow init, liveness detects deadlocks |
| **Resources** | Guaranteed QoS (requests=limits) | Predictable performance in resource-constrained Minikube |
| **Helm Chart** | Standard v2 chart with env-specific values | Best practice for multi-environment, easy configuration |
| **Secrets** | Kubernetes Secrets (base64) | Built-in, simple for Minikube, template committed to Git |
| **Migrations** | Init container running Alembic | Prevents race conditions, clean separation from main app |
| **HPA** | CPU-based (70% target), 2-5 replicas | Backend CPU-bound, min 2 for HA, max 5 for Minikube limits |
| **AI Tools** | Document kubectl-ai, kagent, Gordon | Educational value, bonus points, optional for deployment |
| **Deployment** | Automated script with minikube docker-env | Developer-friendly, idempotent, leverages Minikube daemon |

---

## Next Steps (Phase 1)

1. Create data-model.md (no new entities, document container/pod models)
2. Generate API contracts in contracts/ (Kubernetes API schemas, Helm values schemas)
3. Create quickstart.md (developer onboarding guide)
4. Update .specify agent context with Phase 4 technologies
