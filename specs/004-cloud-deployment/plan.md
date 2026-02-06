# Implementation Plan: Production Cloud Deployment

**Branch**: `004-cloud-deployment` | **Date**: 2026-02-03 | **Spec**: [spec.md](spec.md)

## Summary

Deploy the hackathon todo chatbot application to Azure cloud with production-grade infrastructure including:
- Public internet accessibility via Azure Kubernetes Service (AKS)
- Automated CI/CD pipeline using GitHub Actions
- Auto-scaling from 2-5 nodes based on load
- Secure secrets management using Kubernetes secrets
- Event-driven architecture with Dapr + Kafka (Redpanda Cloud)
- Real-time monitoring and logging
- 99.9% uptime target with automatic rollback on failures

This enables the transition from local development to a publicly accessible production environment with operational reliability and automated deployments.

## Technical Context

**Cloud Provider**: Azure (AKS for Kubernetes, ACR for container registry)
**Orchestration**: Kubernetes 1.28+ via Azure Kubernetes Service
**Runtime Enhancement**: Dapr 1.14+ for distributed systems capabilities
**Event Streaming**: Redpanda Cloud (Kafka-compatible) for pub/sub messaging
**CI/CD**: GitHub Actions with Azure integration
**Container Registry**: Azure Container Registry (ACR)
**Secrets Management**: Kubernetes Secrets + Azure Key Vault (optional)
**Database**: Neon PostgreSQL (existing, external managed service)
**Monitoring**: Kubernetes-native (kubectl logs, pod status) + basic Azure Monitor
**Load Balancing**: Kubernetes LoadBalancer service (Azure-managed)
**Node Size**: Standard_D2s_v3 (2 vCPU, 8 GB RAM) for cost-effectiveness
**Auto-scaling**: Horizontal Pod Autoscaler (HPA) + Cluster Autoscaler (2-5 nodes)

**Deployment Strategy**: Rolling updates (zero downtime)
**Rollback Strategy**: Automatic via Helm revision history
**Build Process**: Multi-stage Docker builds for frontend and backend
**Existing Assets**: Helm charts from 001-local-k8s-deployment, Dockerfiles from Phase 4

## Constitution Check

*GATE: Infrastructure deployment must align with project standards*

### ✅ Technology Stack Compliance

- **Frontend**: Next.js 16+ with TypeScript - COMPLIANT (using existing)
- **Backend**: FastAPI with Python 3.13+ - COMPLIANT (using existing)
- **Database**: Neon PostgreSQL - COMPLIANT (existing external service)
- **AI Components**: OpenAI Agents SDK + FastMCP - COMPLIANT (existing)
- **New Infrastructure**: Azure AKS, Dapr, Kafka - JUSTIFIED (production requirements)

**Justification for new infrastructure**:
- **AKS**: Required for production Kubernetes hosting (Minikube is local-only)
- **Dapr**: Provides production-ready pub/sub, state management, and service mesh without application refactoring
- **Redpanda Cloud**: Managed Kafka for reliable event streaming (recurring tasks feature dependency)
- **GitHub Actions**: Industry-standard CI/CD, integrates with Azure natively

### ✅ Architecture Constraints

- **Clean Architecture**: Infrastructure layer, does not violate application architecture
- **Type Safety**: N/A (infrastructure as code, not application code)
- **Testing**: Smoke tests + health checks in deployment pipeline
- **Security**: Secrets in Kubernetes secrets, TLS termination at load balancer

### ✅ Operational Requirements

- **99.9% Uptime**: AKS SLA provides 99.95% for multi-zone clusters
- **Auto-scaling**: Kubernetes HPA + Cluster Autoscaler built-in
- **Monitoring**: Kubernetes native + Azure Monitor (basic tier)
- **Backup**: Neon PostgreSQL handles database backups (7-day retention)

### 🔄 Post-Design Re-Check

Will verify:
- Helm chart updates maintain clean separation of config vs. code
- Dapr components don't introduce tight coupling
- CI/CD pipeline includes quality gates (tests, linting)
- Secrets are never committed to repository

## Project Structure

### Infrastructure Documentation (this feature)

```text
specs/004-cloud-deployment/
├── plan.md                    # This file
├── infrastructure-design.md   # Phase 0: Cloud architecture diagram + decisions
├── deployment-workflow.md     # Phase 1: CI/CD pipeline specification
├── runbooks.md                # Phase 1: Operational procedures
├── dapr-components/           # Phase 1: Dapr component YAML files
│   ├── pubsub-kafka.yaml
│   ├── statestore-postgres.yaml
│   └── secrets-kubernetes.yaml
└── tasks.md                   # Phase 2: Implementation tasks (NOT created by /sp.plan)
```

### Repository Structure (Infrastructure as Code)

```text
# Deployment Artifacts
.github/
└── workflows/
    ├── deploy-production.yml    # Main CI/CD pipeline
    ├── build-images.yml          # Docker image builds
    └── run-tests.yml             # Pre-deployment tests

# Kubernetes Configurations
k8s/                             # Raw Kubernetes manifests (if needed)
├── namespace.yaml
└── configmaps/

helm/                            # Helm charts (EXISTING from 001-local-k8s-deployment)
├── Chart.yaml
├── values.yaml
├── values-production.yaml       # NEW: Production overrides
└── templates/
    ├── backend-deployment.yaml  # UPDATED: Add Dapr annotations
    ├── frontend-deployment.yaml # UPDATED: Add Dapr annotations
    ├── hpa.yaml                 # NEW: Horizontal Pod Autoscaler
    └── ingress.yaml             # UPDATED: Production domain

# Dapr Configuration
dapr/                            # NEW: Dapr component definitions
├── components/
│   ├── pubsub-kafka.yaml        # Kafka pub/sub via Redpanda Cloud
│   ├── statestore-postgres.yaml # State store using Neon PostgreSQL
│   └── secrets-kubernetes.yaml  # Kubernetes secrets binding
└── configuration/
    └── dapr-config.yaml         # Dapr runtime configuration

# Scripts
scripts/
├── setup-aks.sh                 # NEW: Create AKS cluster
├── install-dapr.sh              # NEW: Install Dapr on AKS
├── deploy.sh                    # NEW: Manual deployment script
└── rollback.sh                  # NEW: Manual rollback script

# Documentation
docs/
└── deployment/
    ├── azure-setup.md           # Azure account and resource group setup
    ├── secrets-configuration.md # How to configure secrets
    └── troubleshooting.md       # Common issues and fixes
```

**Structure Decision**: Hybrid approach using existing Helm charts from local K8s deployment (001-local-k8s-deployment) with production-specific overlays. New directories for Dapr components, GitHub Actions workflows, and operational scripts. Maintains separation between application code and infrastructure code.

## Implementation Phases

### Phase 0: Infrastructure Design & Research

**Objective**: Design cloud architecture and make technology decisions

**Tasks**:

1. **Azure Account Setup**
   - Create/verify Azure subscription
   - Set up resource group in appropriate region (e.g., East US, West Europe)
   - Configure billing alerts ($50/month threshold)
   - Create service principal for GitHub Actions authentication

2. **AKS Cluster Specification**
   - **Cluster name**: `hackathon-todo-prod`
   - **Region**: East US (or closest to target users)
   - **Node pool**: 2 nodes initially, auto-scale to 5
   - **VM size**: Standard_D2s_v3 (2 vCPU, 8 GB RAM)
   - **Kubernetes version**: 1.28+ (latest stable)
   - **Network plugin**: Azure CNI (better performance)
   - **Load balancer**: Standard SKU (supports static IPs)
   - **Monitoring**: Enable Azure Monitor for containers (basic)

3. **Dapr Installation Design**
   - **Version**: Dapr 1.14+ (via Helm)
   - **Namespace**: `dapr-system`
   - **Mode**: Kubernetes mode with sidecar injection
   - **mTLS**: Enabled (default, for secure service-to-service communication)
   - **Components namespace**: `default` (same as application)

4. **Redpanda Cloud Setup**
   - Create Redpanda Cloud account
   - Provision cluster (Starter tier for pilot)
   - Obtain connection details: bootstrap servers, SASL credentials
   - Create topics: `task-events`, `notifications` (if needed)
   - Document connection string format for Dapr component

5. **Secrets Strategy**
   - **Development secrets**: `.env` files (git-ignored)
   - **Production secrets**: Kubernetes Secrets
   - **Secret rotation**: Manual initially (automated in future iterations)
   - **Required secrets**:
     - `DATABASE_URL` (Neon PostgreSQL connection string)
     - `OPENAI_API_KEY` (for AI chatbot)
     - `BETTER_AUTH_SECRET` (JWT signing key)
     - `REDPANDA_SASL_USERNAME` (Kafka authentication)
     - `REDPANDA_SASL_PASSWORD` (Kafka authentication)

6. **Cost Estimation**
   - **AKS**: ~$150/month (2x D2s_v3 nodes 24/7)
   - **Load Balancer**: ~$20/month (standard tier)
   - **Egress**: ~$10/month (estimated for low traffic)
   - **Redpanda Cloud**: ~$20-50/month (starter tier)
   - **Total**: ~$200-230/month
   - **Optimization**: Auto-scale down during off-hours can reduce to ~$100/month

**Deliverable**: `infrastructure-design.md` with architecture diagram, technology decisions, and cost breakdown

### Phase 1: CI/CD Pipeline & Deployment Workflow

**Objective**: Automate build, test, and deployment process

**GitHub Actions Workflow Design**:

```yaml
# .github/workflows/deploy-production.yml

name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:  # Manual trigger

env:
  AZURE_RESOURCE_GROUP: hackathon-todo-rg
  AKS_CLUSTER: hackathon-todo-prod
  ACR_NAME: hackathontodoacr

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Run backend tests (pytest)
      - Run frontend tests (Vitest)
      - Run linters (ruff, eslint)
      - GATE: Fail if tests/linters fail

  build-images:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Login to Azure Container Registry
      - Build backend Docker image
      - Build frontend Docker image
      - Tag with commit SHA + latest
      - Push to ACR

  deploy:
    needs: build-images
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Azure login (service principal)
      - Get AKS credentials (kubectl config)
      - Update Helm values with new image tags
      - Helm upgrade --install (rolling update)
      - Wait for rollout completion
      - Run smoke tests (health checks)
      - GATE: Rollback if smoke tests fail

  notify:
    needs: deploy
    if: always()
    runs-on: ubuntu-latest
    steps:
      - Send Slack/email notification with deployment status
```

**Smoke Tests**:
- Frontend: `curl https://[app-url]` returns HTTP 200
- Backend API: `curl https://[app-url]/api/health` returns `{"status": "healthy"}`
- Database: Backend connects successfully (implicit in health check)
- AI Chatbot: POST to `/api/chat` returns valid response

**Rollback Procedure**:
```bash
# Automatic (if smoke tests fail)
helm rollback hackathon-todo --namespace default

# Manual (if issues discovered later)
helm history hackathon-todo
helm rollback hackathon-todo [REVISION]
```

**Deliverables**:
- `deployment-workflow.md`: Detailed CI/CD pipeline documentation
- `.github/workflows/deploy-production.yml`: GitHub Actions workflow
- `runbooks.md`: Manual deployment and rollback procedures

### Phase 2: Dapr Component Configuration

**Objective**: Configure Dapr for pub/sub, state store, and secrets

**Component 1: Pub/Sub (Kafka via Redpanda Cloud)**

```yaml
# dapr/components/pubsub-kafka.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: task-events-pubsub
  namespace: default
spec:
  type: pubsub.kafka
  version: v1
  metadata:
  - name: brokers
    value: "[REDPANDA_BOOTSTRAP_SERVERS]"  # e.g., "seed-123.cloud.redpanda.com:9092"
  - name: authType
    value: "sasl"
  - name: saslUsername
    secretKeyRef:
      name: redpanda-credentials
      key: username
  - name: saslPassword
    secretKeyRef:
      name: redpanda-credentials
      key: password
  - name: saslMechanism
    value: "PLAIN"
```

**Component 2: State Store (PostgreSQL via Neon)**

```yaml
# dapr/components/statestore-postgres.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: task-state
  namespace: default
spec:
  type: state.postgresql
  version: v1
  metadata:
  - name: connectionString
    secretKeyRef:
      name: database-credentials
      key: connection-string
  - name: tableName
    value: "dapr_state"
  - name: metadataTableName
    value: "dapr_metadata"
```

**Component 3: Secrets (Kubernetes Secrets)**

```yaml
# dapr/components/secrets-kubernetes.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kubernetes-secrets
  namespace: default
spec:
  type: secretstores.kubernetes
  version: v1
  metadata: []
```

**Kubernetes Secrets Creation**:

```bash
# Create secrets from environment variables (one-time setup)
kubectl create secret generic database-credentials \
  --from-literal=connection-string="$DATABASE_URL" \
  --namespace default

kubectl create secret generic openai-credentials \
  --from-literal=api-key="$OPENAI_API_KEY" \
  --namespace default

kubectl create secret generic auth-credentials \
  --from-literal=secret="$BETTER_AUTH_SECRET" \
  --namespace default

kubectl create secret generic redpanda-credentials \
  --from-literal=username="$REDPANDA_SASL_USERNAME" \
  --from-literal=password="$REDPANDA_SASL_PASSWORD" \
  --namespace default
```

**Deliverables**:
- Dapr component YAML files in `dapr/components/`
- Secret creation scripts in `scripts/setup-secrets.sh`
- Documentation in `dapr-components/README.md`

### Phase 3: Helm Chart Updates

**Objective**: Update existing Helm charts with production configurations and Dapr annotations

**Backend Deployment Updates**:

```yaml
# helm/templates/backend-deployment.yaml (ADD Dapr annotations)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.backend.name }}
spec:
  replicas: {{ .Values.backend.replicas }}
  template:
    metadata:
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "todo-backend"
        dapr.io/app-port: "8000"
        dapr.io/log-level: "info"
    spec:
      containers:
      - name: backend
        image: {{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: connection-string
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-credentials
              key: api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

**Horizontal Pod Autoscaler**:

```yaml
# helm/templates/hpa.yaml (NEW)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Values.backend.name }}-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Values.backend.name }}
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

**Production Values**:

```yaml
# helm/values-production.yaml (NEW)
backend:
  name: todo-backend
  replicas: 2
  image:
    repository: hackathontodoacr.azurecr.io/todo-backend
    tag: latest  # Overridden by CI/CD with commit SHA

frontend:
  name: todo-frontend
  replicas: 2
  image:
    repository: hackathontodoacr.azurecr.io/todo-frontend
    tag: latest

ingress:
  enabled: true
  className: nginx
  host: todo.yourdomain.com  # Update with actual domain
  tls:
    enabled: true
    secretName: tls-cert

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5
  targetCPU: 70
```

**Deliverables**:
- Updated Helm templates with Dapr annotations
- `values-production.yaml` for production-specific configuration
- HPA and ingress configurations

### Phase 4: Operational Scripts

**Objective**: Provide scripts for infrastructure setup and maintenance

**Script 1: AKS Cluster Setup**

```bash
# scripts/setup-aks.sh
#!/bin/bash
set -e

RESOURCE_GROUP="hackathon-todo-rg"
CLUSTER_NAME="hackathon-todo-prod"
LOCATION="eastus"
NODE_COUNT=2
VM_SIZE="Standard_D2s_v3"

echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "Creating AKS cluster..."
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME \
  --node-count $NODE_COUNT \
  --node-vm-size $VM_SIZE \
  --enable-cluster-autoscaler \
  --min-count 2 \
  --max-count 5 \
  --network-plugin azure \
  --generate-ssh-keys

echo "Getting AKS credentials..."
az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME

echo "AKS cluster setup complete!"
```

**Script 2: Dapr Installation**

```bash
# scripts/install-dapr.sh
#!/bin/bash
set -e

echo "Adding Dapr Helm repo..."
helm repo add dapr https://dapr.github.io/helm-charts/
helm repo update

echo "Installing Dapr..."
helm upgrade --install dapr dapr/dapr \
  --version=1.14 \
  --namespace dapr-system \
  --create-namespace \
  --wait

echo "Verifying Dapr installation..."
kubectl get pods -n dapr-system

echo "Dapr installation complete!"
```

**Script 3: Deploy Application**

```bash
# scripts/deploy.sh
#!/bin/bash
set -e

IMAGE_TAG=${1:-latest}

echo "Deploying application with image tag: $IMAGE_TAG"

helm upgrade --install hackathon-todo ./helm \
  --values ./helm/values-production.yaml \
  --set backend.image.tag=$IMAGE_TAG \
  --set frontend.image.tag=$IMAGE_TAG \
  --namespace default \
  --wait

echo "Deployment complete!"
echo "Checking pod status..."
kubectl get pods -n default

echo "Running smoke tests..."
./scripts/smoke-tests.sh
```

**Deliverables**:
- Setup scripts in `scripts/`
- Smoke test script
- Rollback script

## Testing Strategy

### Pre-Deployment Tests (CI Pipeline)

1. **Unit Tests**: pytest (backend), Vitest (frontend)
2. **Integration Tests**: API endpoints with test database
3. **Linting**: ruff (backend), eslint (frontend)
4. **Type Checking**: mypy (backend), tsc (frontend)
5. **Security Scan**: Trivy for Docker image vulnerabilities

### Post-Deployment Smoke Tests

1. **Frontend Availability**: HTTP GET to root URL returns 200
2. **API Health**: GET `/api/health` returns `{"status": "healthy"}`
3. **Database Connectivity**: Health check includes DB ping
4. **AI Chatbot**: POST to `/api/chat` with test message returns response
5. **Authentication**: Login flow completes successfully

### Load Testing (Optional, Pre-Launch)

- Use k6 or Apache JMeter
- Simulate 100 concurrent users
- Verify auto-scaling triggers at 70% CPU
- Verify response times stay under 1 second

## Monitoring & Alerting

### Health Checks

```yaml
# Pod liveness and readiness probes
livenessProbe:
  httpGet:
    path: /api/health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### Logging

- **Collection**: Kubernetes stdout/stderr → Azure Monitor
- **Retention**: 7 days (basic tier)
- **Access**: `kubectl logs <pod-name>` or Azure Portal
- **Search**: Azure Log Analytics queries

### Metrics (Basic)

- **Pod status**: `kubectl get pods`
- **Resource usage**: `kubectl top pods`
- **HPA status**: `kubectl get hpa`
- **Deployment history**: `helm history hackathon-todo`

### Alerts (Manual Setup in Azure Portal)

- Pod crash loop detected
- CPU utilization > 80% for 10 minutes
- Memory utilization > 85% for 10 minutes
- Deployment rollout failed
- Health check failures > 3 in 5 minutes

## Rollback Plan

### Automatic Rollback

CI/CD pipeline includes smoke tests after deployment. If tests fail:
```bash
helm rollback hackathon-todo --namespace default
```

### Manual Rollback

If issues discovered after deployment:
```bash
# View deployment history
helm history hackathon-todo

# Rollback to previous version
helm rollback hackathon-todo 0

# Or rollback to specific revision
helm rollback hackathon-todo 5
```

### Rollback Testing

Before deploying to production:
1. Deploy to staging (if available)
2. Deliberately introduce a bug
3. Verify automatic rollback works
4. Verify manual rollback procedure

## Security Checklist

- [ ] Secrets stored in Kubernetes Secrets (not in code)
- [ ] GitHub Actions uses Azure service principal (not admin credentials)
- [ ] Dapr mTLS enabled for service-to-service communication
- [ ] TLS/HTTPS enabled for external traffic (via ingress)
- [ ] Container images scanned for vulnerabilities (Trivy)
- [ ] Network policies configured (restrict pod-to-pod traffic)
- [ ] RBAC enabled on AKS cluster
- [ ] Azure AD integration for cluster access (optional, future)

## Cost Optimization

### Initial Configuration (Estimated $200-230/month)

- 2 nodes × Standard_D2s_v3 running 24/7
- Standard load balancer
- Basic monitoring
- Redpanda Cloud starter tier

### Optimization Strategies

1. **Auto-scale down during off-hours**
   - Reduce to 1 node outside business hours
   - Estimated savings: ~$75/month

2. **Reserved instances** (if committing to 1+ year)
   - 40% discount on VM costs
   - Estimated savings: ~$60/month

3. **Monitoring optimization**
   - Use Kubernetes-native tools instead of Azure Monitor
   - Estimated savings: ~$10-20/month

4. **Right-sizing after observing usage**
   - May downgrade VM size if resource usage is low
   - Potential savings: ~$50/month

**Target**: ~$100-150/month after optimization

## Success Criteria

### Deployment Success

- [ ] Application accessible via public URL within 5 minutes of deployment
- [ ] Automated deployment completes in under 10 minutes
- [ ] All smoke tests pass after deployment
- [ ] Secrets not visible in logs or code repository

### Operational Success

- [ ] 99.9% uptime measured over 30 days
- [ ] Auto-scaling triggers at 70% CPU and completes within 60 seconds
- [ ] Failed deployments automatically rollback within 2 minutes
- [ ] Logs searchable for past 7 days

### Cost Success

- [ ] Infrastructure cost under $230/month initially
- [ ] Cost per active user under $0.50/month (target: 100-200 users)

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Azure outage | Low | High | Multi-zone AKS deployment, status page monitoring |
| Deployment failure | Medium | Medium | Automated rollback, staging environment (future) |
| Cost overrun | Medium | Low | Billing alerts at $50/$100/$150, auto-shutdown during dev |
| Security breach | Low | High | Regular security scans, secret rotation, RBAC |
| Database connection failure | Low | High | Connection pooling, retry logic, health checks |

## Next Steps

After completing this plan:

1. **Phase 0**: Run infrastructure design and cost estimation
2. **Phase 1**: Implement CI/CD pipeline locally (test without Azure)
3. **Phase 2**: Configure Dapr components
4. **Phase 3**: Update Helm charts
5. **Phase 4**: Create operational scripts
6. **Deploy**: Execute full deployment to Azure
7. **Validate**: Run smoke tests and verify 99.9% uptime over 1 week
8. **Optimize**: Monitor costs and performance, adjust as needed

Use `/sp.tasks` to generate actionable implementation tasks from this plan.
