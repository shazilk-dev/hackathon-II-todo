# Phase 4: Local Kubernetes Deployment

**Status**: ✅ Implementation Complete
**Branch**: `001-local-k8s-deployment`
**Date**: 2026-02-02

## Overview

Phase 4 containerizes the Phase 3 AI-powered Todo Chatbot and deploys it to local Kubernetes using Minikube. This phase establishes production-ready deployment patterns that will be used in Phase 5 for cloud deployment.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Minikube Cluster                  │
│                                                     │
│  ┌──────────────┐         ┌──────────────┐        │
│  │   Frontend   │         │   Backend    │        │
│  │  (Next.js)   │────────▶│  (FastAPI)   │        │
│  │  1 replica   │         │  2 replicas  │        │
│  │              │         │              │        │
│  │  Port: 3000  │         │  Port: 8000  │        │
│  └──────────────┘         └──────────────┘        │
│        │                         │                 │
│        │                         │                 │
│  ┌─────▼──────┐           ┌──────▼───────┐        │
│  │  Service   │           │   Service    │        │
│  │ (ClusterIP)│           │  (ClusterIP) │        │
│  └────────────┘           └──────────────┘        │
│                                  │                 │
│                           ┌──────▼───────┐        │
│                           │     HPA      │        │
│                           │  (2-5 pods)  │        │
│                           └──────────────┘        │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   Neon PostgreSQL     │
        │  (External Database)  │
        └───────────────────────┘
```

## What's New in Phase 4

### Containerization
- ✅ Multi-stage Docker builds (backend: Python 3.13-slim, frontend: Node.js 20-alpine)
- ✅ Optimized image sizes (backend <200MB, frontend <500MB)
- ✅ Non-root security (appuser UID 1000, nextjs UID 1001)
- ✅ Health check endpoints for Kubernetes probes
- ✅ docker-compose.yml for local testing

### Kubernetes Manifests
- ✅ Namespace isolation (`todo-chatbot`)
- ✅ ConfigMaps for non-sensitive configuration
- ✅ Secrets for database credentials and API keys
- ✅ Deployments with resource limits and health probes
- ✅ Services for internal communication (ClusterIP)
- ✅ Horizontal Pod Autoscaler (2-5 replicas, 70% CPU target)

### Helm Chart
- ✅ Chart.yaml with v2 API
- ✅ Environment-specific values files (dev, staging, prod)
- ✅ Templated manifests with helper functions
- ✅ Conditional HPA rendering
- ✅ Post-install NOTES.txt with usage instructions

### Automation Scripts
- ✅ `build-images.sh` - Build Docker images in Minikube
- ✅ `deploy-minikube.sh` - kubectl-based deployment
- ✅ `deploy-helm.sh` - Helm-based deployment (recommended)
- ✅ `cleanup.sh` - Clean up all resources

## Prerequisites

### Required Tools
- **Docker Desktop 4.38+** (with Kubernetes enabled)
- **Minikube 1.32+** (for local Kubernetes cluster)
- **kubectl 1.28+** (Kubernetes CLI)
- **Helm 3.12+** (Kubernetes package manager)

### Installation

**macOS** (using Homebrew):
```bash
brew install minikube kubectl helm
```

**Windows** (using Chocolatey):
```bash
choco install minikube kubernetes-cli kubernetes-helm
```

**Linux**:
```bash
# Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/kubectl

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

## Quick Start

### 1. Start Minikube

```bash
minikube start --cpus=2 --memory=4096 --driver=docker
```

**Verify**:
```bash
minikube status
# Should show: Running, Configured, Configured
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Required variables**:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - JWT secret (32+ characters)
- `OPENAI_API_KEY` - OpenAI API key for chatbot

### 3. Deploy with Helm (Recommended)

```bash
./scripts/deploy-helm.sh
```

This script will:
1. Verify prerequisites (Helm, Minikube)
2. Build Docker images in Minikube
3. Load environment variables
4. Install/upgrade Helm chart
5. Wait for pods to be ready
6. Display deployment status

### Alternative: Deploy with kubectl

```bash
./scripts/deploy-minikube.sh
```

Uses plain Kubernetes manifests instead of Helm.

## Accessing the Application

### Method 1: Minikube Service (Easiest)

```bash
minikube service todo-chatbot-frontend -n todo-chatbot
```

Automatically opens the frontend in your browser.

### Method 2: Port Forwarding

```bash
kubectl port-forward -n todo-chatbot service/todo-chatbot-frontend 3000:3000
```

Then visit: http://localhost:3000

### Method 3: Direct Backend API Access

```bash
kubectl port-forward -n todo-chatbot service/todo-chatbot-backend 8000:8000
```

API docs at: http://localhost:8000/docs

## Monitoring & Debugging

### View Pod Status

```bash
kubectl get pods -n todo-chatbot

# Expected output:
# NAME                                READY   STATUS    RESTARTS   AGE
# todo-chatbot-backend-xxx-yyy        1/1     Running   0          2m
# todo-chatbot-backend-xxx-zzz        1/1     Running   0          2m
# todo-chatbot-frontend-xxx-aaa       1/1     Running   0          2m
```

### View Logs

```bash
# Backend logs (live tail)
kubectl logs -n todo-chatbot -l app.kubernetes.io/component=backend -f

# Frontend logs
kubectl logs -n todo-chatbot -l app.kubernetes.io/component=frontend -f

# Specific pod
kubectl logs -n todo-chatbot <pod-name> -f
```

### Check HPA Status

```bash
kubectl get hpa -n todo-chatbot

# Expected output:
# NAME                        REFERENCE              TARGETS   MINPODS   MAXPODS   REPLICAS
# todo-chatbot-backend-hpa    Deployment/backend     35%/70%   2         5         2
```

### Resource Usage

```bash
kubectl top pods -n todo-chatbot

# Expected output:
# NAME                                CPU(cores)   MEMORY(bytes)
# todo-chatbot-backend-xxx-yyy        120m         350Mi
# todo-chatbot-frontend-xxx-aaa       45m          180Mi
```

## Testing

### Functional Testing

1. **Sign In**: Visit http://localhost:3000/signin
2. **Create Task**: "Add task to test Kubernetes deployment"
3. **List Tasks**: "Show all my tasks"
4. **Complete Task**: Click checkbox to mark complete
5. **Verify Persistence**: Refresh page, tasks should remain

### Resilience Testing

**Test Pod Self-Healing**:
```bash
# Delete a backend pod
kubectl delete pod -n todo-chatbot -l app.kubernetes.io/component=backend --field-selector=status.phase=Running

# Watch Kubernetes recreate it
kubectl get pods -n todo-chatbot -w
```

**Test Scaling**:
```bash
# Manual scale up
kubectl scale deployment todo-chatbot-backend -n todo-chatbot --replicas=3

# Verify all pods start
kubectl get pods -n todo-chatbot -l app.kubernetes.io/component=backend
```

### Performance Testing

**Image Sizes**:
```bash
eval $(minikube docker-env)
docker images | grep todo

# Expected:
# todo-backend    latest    xxx    <200MB
# todo-frontend   latest    yyy    <500MB
```

**Deployment Time**:
```bash
time ./scripts/deploy-helm.sh

# Should complete in <3 minutes
```

## Helm Operations

### View Release Info

```bash
helm list -n todo-chatbot
helm status todo-chatbot -n todo-chatbot
helm history todo-chatbot -n todo-chatbot
```

### Upgrade with New Values

```bash
helm upgrade todo-chatbot ./helm/todo-chatbot \
  -n todo-chatbot \
  --set backend.replicas=3 \
  --wait
```

### Rollback

```bash
# List revisions
helm history todo-chatbot -n todo-chatbot

# Rollback to previous version
helm rollback todo-chatbot -n todo-chatbot

# Rollback to specific revision
helm rollback todo-chatbot 2 -n todo-chatbot
```

### Template Validation

```bash
# Lint the chart
helm lint ./helm/todo-chatbot

# Generate YAML without installing
helm template todo-chatbot ./helm/todo-chatbot \
  --namespace todo-chatbot \
  --set secrets.DATABASE_URL="test" \
  --set secrets.BETTER_AUTH_SECRET="test" \
  --set secrets.OPENAI_API_KEY="test"
```

## Cleanup

### Uninstall with Helm

```bash
helm uninstall todo-chatbot -n todo-chatbot
kubectl delete namespace todo-chatbot
```

### Use Cleanup Script

```bash
./scripts/cleanup.sh
```

Interactively removes:
- Helm release
- Kubernetes namespace
- Docker images (optional)

### Stop Minikube

```bash
# Stop cluster (preserves state)
minikube stop

# Delete cluster (frees disk space)
minikube delete
```

## Troubleshooting

### Pods Stuck in ImagePullBackOff

**Cause**: Minikube can't find images (not using Minikube Docker daemon)

**Solution**:
```bash
eval $(minikube docker-env)
./scripts/build-images.sh
```

### Backend Pod CrashLoopBackOff

**Cause**: Database connection failure or missing secrets

**Solution**:
```bash
# Check logs
kubectl logs -n todo-chatbot -l app.kubernetes.io/component=backend --tail=50

# Verify secrets exist
kubectl get secret todo-chatbot-secrets -n todo-chatbot -o yaml

# Re-deploy with correct secrets
helm upgrade todo-chatbot ./helm/todo-chatbot \
  -n todo-chatbot \
  --set secrets.DATABASE_URL="<correct-url>" \
  --wait
```

### Frontend Can't Connect to Backend

**Cause**: Service misconfiguration or CORS issues

**Solution**:
```bash
# Check service endpoints
kubectl get endpoints -n todo-chatbot

# Verify ConfigMap
kubectl get configmap todo-chatbot-config -n todo-chatbot -o yaml

# Check CORS_ORIGINS setting
```

### Out of Disk Space

**Solution**:
```bash
# Clean up Docker (in Minikube)
eval $(minikube docker-env)
docker system prune -a --volumes

# Clean up local Docker
eval $(minikube docker-env --unset)
docker system prune -a
```

### Minikube Won't Start

**Solution**:
```bash
# Delete and recreate cluster
minikube delete
minikube start --cpus=2 --memory=4096 --driver=docker

# If still failing, check Docker Desktop is running
```

## File Structure

```
hackathon-todo/
├── backend/
│   ├── Dockerfile                 # Multi-stage Python 3.13 build
│   ├── .dockerignore             # Exclude unnecessary files
│   └── docker-start.sh           # Migrations + uvicorn startup
├── frontend/
│   ├── Dockerfile                # Multi-stage Node.js 20 build
│   └── .dockerignore             # Exclude node_modules, .next
├── helm/
│   └── todo-chatbot/
│       ├── Chart.yaml            # Helm chart metadata
│       ├── values.yaml           # Default configuration
│       ├── values-dev.yaml       # Development overrides
│       ├── values-staging.yaml   # Staging overrides
│       ├── values-prod.yaml      # Production overrides
│       └── templates/
│           ├── _helpers.tpl      # Template helpers
│           ├── namespace.yaml
│           ├── configmap.yaml
│           ├── secrets.yaml
│           ├── backend-deployment.yaml
│           ├── backend-service.yaml
│           ├── frontend-deployment.yaml
│           ├── frontend-service.yaml
│           ├── hpa.yaml          # Horizontal Pod Autoscaler
│           └── NOTES.txt         # Post-install instructions
├── k8s/
│   └── base/
│       ├── namespace.yaml        # Plain kubectl manifests
│       ├── configmap.yaml        # (alternative to Helm)
│       ├── secret-template.yaml
│       ├── backend-deployment.yaml
│       ├── backend-service.yaml
│       ├── frontend-deployment.yaml
│       ├── frontend-service.yaml
│       └── hpa.yaml
├── scripts/
│   ├── build-images.sh           # Build Docker images
│   ├── deploy-minikube.sh        # kubectl deployment
│   ├── deploy-helm.sh            # Helm deployment (recommended)
│   └── cleanup.sh                # Resource cleanup
├── docker-compose.yml            # Local container testing
├── .env.example                  # Environment template
└── README-PHASE4.md             # This file
```

## Success Criteria (from spec.md)

- [X] **SC-001**: Docker images build in <5 minutes each
- [X] **SC-002**: Images optimized <500MB frontend, <200MB backend
- [X] **SC-003**: Minikube deployment completes in <3 minutes
- [X] **SC-006**: Kubernetes auto-recovers from pod failures
- [X] **SC-007**: Helm upgrades with zero downtime
- [X] **SC-008**: Single helm install command deployment
- [X] **SC-009**: Manifests pass kubectl/helm validation
- [X] **SC-010**: Scales 1-3 replicas in <60 seconds
- [X] **SC-013**: Runs on <4GB RAM, 2 CPU cores
- [X] **SC-014**: Secrets stored in Kubernetes Secrets (no hardcoding)

## Next Steps (Phase 5)

Phase 5 will deploy to cloud:
- **Cloud Platform**: DigitalOcean, Google Cloud, or Azure
- **Kafka Integration**: Event streaming
- **Dapr Runtime**: Distributed application runtime
- **CI/CD Pipeline**: Automated deployments
- **Advanced Monitoring**: Prometheus + Grafana

## Resources

- **Specification**: `specs/001-local-k8s-deployment/spec.md`
- **Implementation Plan**: `specs/001-local-k8s-deployment/plan.md`
- **Tasks**: `specs/001-local-k8s-deployment/tasks.md`
- **Quickstart Guide**: `specs/001-local-k8s-deployment/quickstart.md`

## Support

For issues or questions:
1. Check logs: `kubectl logs -n todo-chatbot <pod-name>`
2. Verify resources: `kubectl get all -n todo-chatbot`
3. Review troubleshooting section above
4. Check Minikube docs: https://minikube.sigs.k8s.io/docs/

---

**Version**: 1.0.0 | **Last Updated**: 2026-02-02 | **Branch**: 001-local-k8s-deployment
