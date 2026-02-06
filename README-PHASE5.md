# Phase 5: Azure AKS Cloud Deployment 🚀

Production-ready cloud deployment of the Todo Chatbot application on Azure Kubernetes Service with Dapr and Kafka event streaming.

## Quick Start

### Prerequisites

- Azure subscription ([Free account](https://azure.microsoft.com/free/))
- Azure CLI installed
- kubectl installed
- Helm 3.x installed
- Docker installed
- Redpanda Cloud account

### 5-Minute Deployment

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your Azure and Redpanda credentials

# 2. Setup Azure infrastructure (15-20 min)
./scripts/setup-aks.sh

# 3. Install Dapr (3-5 min)
./scripts/install-dapr.sh

# 4. Configure secrets (2 min)
./scripts/setup-secrets.sh

# 5. Build and deploy (10-15 min)
az acr login --name hackathontodoacr
docker build -t hackathontodoacr.azurecr.io/todo-backend:latest ./backend
docker build -t hackathontodoacr.azurecr.io/todo-frontend:latest ./frontend
docker push hackathontodoacr.azurecr.io/todo-backend:latest
docker push hackathontodoacr.azurecr.io/todo-frontend:latest
./scripts/deploy.sh latest

# 6. Get frontend URL
kubectl get service -n default -l app.kubernetes.io/component=frontend
# Visit http://<EXTERNAL-IP>:3000
```

**Total Time**: 30-45 minutes (mostly waiting for Azure provisioning)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Azure Cloud                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Azure Kubernetes Service (AKS)                            │ │
│  │                                                             │ │
│  │  ┌──────────────┐    ┌──────────────┐                     │ │
│  │  │   Frontend   │    │   Backend    │                     │ │
│  │  │  (Next.js)   │◄───┤   (FastAPI)  │                     │ │
│  │  │  + Dapr      │    │   + Dapr     │                     │ │
│  │  │  2-5 pods    │    │   2-5 pods   │                     │ │
│  │  └──────┬───────┘    └──────┬───────┘                     │ │
│  │         │                    │                             │ │
│  │         │                    │                             │ │
│  │  ┌──────▼────────────────────▼────────┐                   │ │
│  │  │  Dapr Runtime (v1.14+)             │                   │ │
│  │  │  - Service Mesh                    │                   │ │
│  │  │  - Pub/Sub (Kafka)                 │                   │ │
│  │  │  - State Management (PostgreSQL)   │                   │ │
│  │  │  - Secrets Management              │                   │ │
│  │  └────────────────────────────────────┘                   │ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────┐                   │ │
│  │  │  Horizontal Pod Autoscaler (HPA)   │                   │ │
│  │  │  - Min: 2 pods                     │                   │ │
│  │  │  - Max: 5 pods                     │                   │ │
│  │  │  - Trigger: 70% CPU                │                   │ │
│  │  └────────────────────────────────────┘                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────┐   ┌──────────────────┐                   │
│  │  Azure Container │   │  Load Balancer   │                   │
│  │  Registry (ACR)  │   │  (Public IP)     │                   │
│  └──────────────────┘   └──────────────────┘                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Neon PostgreSQL │   │ Redpanda Cloud   │   │  GitHub Actions  │
│  (Managed DB)    │   │  (Kafka)         │   │  (CI/CD)         │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

## Features Implemented

### ✅ User Story 1: Internet Accessibility (P1 - MVP)
- Public LoadBalancer for frontend
- 99.9% uptime with multiple replicas
- Response time < 3 seconds

### ✅ User Story 2: Automated CI/CD (P1)
- GitHub Actions pipeline
- Automated testing (pytest, vitest, linters)
- Docker image builds and push to ACR
- Automatic deployment on code push
- Smoke tests and health checks
- Automatic rollback on failure

### ✅ User Story 3: Auto-Scaling (P2)
- Horizontal Pod Autoscaler (2-5 pods)
- Scale up at 70% CPU
- Scale down after 5 minutes of low load
- Handles 100+ concurrent users

### ✅ User Story 4: Monitoring (P2)
- Kubernetes health probes (liveness & readiness)
- Azure Monitor integration
- Log collection and retention (7 days)
- Real-time pod status

### ✅ User Story 5: Secure Secrets (P1 - MVP)
- Kubernetes Secrets for all credentials
- No secrets in code or logs
- Secret rotation support
- Dapr secrets management

### ✅ User Story 6: Event Processing (P3)
- Kafka pub/sub via Redpanda Cloud
- Dapr state store for idempotency
- Reliable event delivery
- Support for recurring tasks

## Infrastructure Specifications

### Azure Resources

| Resource | Configuration | Monthly Cost |
|----------|--------------|--------------|
| AKS Cluster | 2x Standard_D2s_v3, auto-scale to 5 | ~$140 |
| Load Balancer | Standard SKU | ~$20 |
| Egress Traffic | ~100 GB | ~$10 |
| ACR | Basic tier | ~$5 |
| **Total** | | **~$175** |

### Kubernetes Resources

| Component | Type | Replicas | Resources |
|-----------|------|----------|-----------|
| Backend | Deployment | 2-5 (HPA) | 250m CPU, 256Mi RAM |
| Frontend | Deployment | 2-5 (HPA) | 250m CPU, 256Mi RAM |
| Dapr Operator | Deployment | 3 (HA) | Managed by extension |
| Dapr Sidecar | Container | Per pod | Injected automatically |

### Dapr Components

- **Pub/Sub**: Kafka (Redpanda Cloud) for event streaming
- **State Store**: PostgreSQL (Neon) for idempotent event processing
- **Secrets**: Kubernetes native secret store
- **Configuration**: Custom resiliency policies

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-aks.sh` | Create Azure infrastructure | `./scripts/setup-aks.sh` |
| `install-dapr.sh` | Install Dapr on AKS | `./scripts/install-dapr.sh` |
| `setup-secrets.sh` | Configure Kubernetes secrets | `./scripts/setup-secrets.sh` |
| `deploy.sh` | Deploy application | `./scripts/deploy.sh [tag]` |
| `rollback.sh` | Rollback deployment | `./scripts/rollback.sh [revision]` |
| `smoke-tests.sh` | Post-deployment health checks | `./scripts/smoke-tests.sh` |
| `load-test.sh` | Test auto-scaling | `./scripts/load-test.sh [duration] [concurrency]` |
| `cleanup-azure.sh` | Delete Azure resources | `./scripts/cleanup-azure.sh [--delete-resource-group]` |

## Documentation

- **[Azure Setup Guide](./docs/deployment/azure-setup.md)** - Complete Azure infrastructure setup
- **[Deployment Checklist](./docs/deployment/DEPLOYMENT-CHECKLIST.md)** - Step-by-step deployment guide
- **[Troubleshooting](./docs/deployment/troubleshooting.md)** - Common issues and solutions
- **[Secrets Configuration](./docs/deployment/secrets-configuration.md)** - Managing secrets securely

## CI/CD Pipeline

GitHub Actions workflow automatically:

1. **Test**: Run backend (pytest) and frontend (vitest) tests
2. **Lint**: Check code quality (ruff, eslint, mypy, tsc)
3. **Build**: Create Docker images for backend and frontend
4. **Scan**: Security scan with Trivy
5. **Push**: Push images to Azure Container Registry
6. **Deploy**: Update AKS deployment with new images
7. **Verify**: Run smoke tests
8. **Notify**: Send deployment status notifications

**Triggers**: Push to `main` branch or manual workflow dispatch

## Environment Variables

Required variables in `.env`:

```bash
# Azure
AZURE_RESOURCE_GROUP=hackathon-todo-rg
AKS_CLUSTER_NAME=hackathon-todo-prod
ACR_NAME=hackathontodoacr
AZURE_LOCATION=eastus

# Database
DATABASE_URL=postgresql+asyncpg://...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Authentication
BETTER_AUTH_SECRET=<32-char-secret>

# Redpanda Cloud
REDPANDA_BROKERS=seed-123.cloud.redpanda.com:9092
REDPANDA_SASL_USERNAME=<username>
REDPANDA_SASL_PASSWORD=<password>
REDPANDA_SASL_MECHANISM=SCRAM-SHA-256
```

## Health Endpoints

- **Backend Health**: `http://<backend-pod>:8000/health`
- **Backend API Docs**: `http://<backend-pod>:8000/docs`
- **Frontend**: `http://<external-ip>:3000`

## Monitoring Commands

```bash
# View pods
kubectl get pods -n default

# View services and external IP
kubectl get services -n default

# View HPA status
kubectl get hpa -n default

# View logs
kubectl logs -n default -l app.kubernetes.io/component=backend --tail=100

# View Dapr components
kubectl get components -n default

# Check Dapr sidecar logs
kubectl logs -n default <pod-name> -c daprd

# Deployment history
helm history hackathon-todo -n default
```

## Load Testing

```bash
# Install hey (load testing tool)
go install github.com/rakyll/hey@latest

# Run load test (5 min, 50 concurrent, 10 RPS)
./scripts/load-test.sh 300 50 10

# Monitor auto-scaling
kubectl get hpa -n default --watch
```

## Rollback Procedure

```bash
# View deployment history
helm history hackathon-todo -n default

# Rollback to previous revision
./scripts/rollback.sh

# Rollback to specific revision
./scripts/rollback.sh 5

# Verify rollback
kubectl get pods -n default
```

## Cost Optimization

- **Auto-scaling**: Automatically reduces pods during low traffic
- **Right-sizing**: VMs sized for actual workload (Standard_D2s_v3)
- **Reserved Instances**: Consider 1-year commitment for 40% discount
- **Monitoring**: Billing alerts at $50, $100, $200
- **Cleanup**: `./scripts/cleanup-azure.sh` when not in use

## Security Best Practices

✅ **Implemented:**
- Secrets stored in Kubernetes Secrets (not in code)
- Dapr mTLS enabled for service-to-service communication
- RBAC enabled on AKS cluster
- Container security scanning with Trivy
- Non-root containers
- Read-only root filesystem where possible

⚠️ **Future Enhancements:**
- Azure Key Vault integration
- Network policies for pod isolation
- Azure AD integration for cluster access
- WAF and DDoS protection
- Certificate management with cert-manager

## Troubleshooting

### Pods Not Starting

```bash
kubectl describe pod <pod-name> -n default
kubectl logs <pod-name> -n default
```

### LoadBalancer IP Not Assigned

```bash
# Wait up to 3 minutes for IP assignment
kubectl get service -n default --watch

# Check events
kubectl get events -n default --sort-by='.lastTimestamp'
```

### Dapr Issues

```bash
# Check Dapr system pods
kubectl get pods -n dapr-system

# Check Dapr sidecar
kubectl logs <pod-name> -c daprd -n default

# Restart pod with Dapr issues
kubectl delete pod <pod-name> -n default
```

### High Costs

1. Check Azure Cost Management
2. Reduce node count temporarily
3. Stop AKS cluster when not in use:
   ```bash
   az aks stop --name hackathon-todo-prod --resource-group hackathon-todo-rg
   ```
4. Or delete resources completely:
   ```bash
   ./scripts/cleanup-azure.sh --delete-resource-group
   ```

## Success Criteria

✅ **Deployment is successful when:**

1. Application accessible from internet
2. Auto-scaling working (scales 2→5 pods under load)
3. CI/CD pipeline deploys changes automatically
4. Health checks passing
5. No errors in logs
6. Rollback procedure working
7. Cost within budget (~$175/month)

## Next Steps

- [ ] Configure custom domain with Azure DNS
- [ ] Set up Azure Key Vault for enhanced security
- [ ] Add staging environment
- [ ] Implement blue-green deployments
- [ ] Add distributed tracing with Zipkin/Jaeger
- [ ] Set up Prometheus + Grafana for advanced monitoring
- [ ] Configure WAF and DDoS protection
- [ ] Implement multi-region deployment

## Support

- **Azure Issues**: [Azure Support](https://azure.microsoft.com/support/)
- **Dapr Issues**: [Dapr GitHub](https://github.com/dapr/dapr/issues)
- **Project Issues**: Create an issue in this repository

## License

MIT License - See LICENSE file for details

---

**Version**: 1.0.0
**Last Updated**: 2026-02-03
**Status**: Production Ready ✅
