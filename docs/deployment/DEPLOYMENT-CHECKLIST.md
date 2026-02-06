# Phase 5: Cloud Deployment Checklist

Step-by-step checklist for deploying the Todo Chatbot to Azure AKS.

## Pre-Deployment Checklist

### ☐ Azure Account Setup
- [ ] Azure subscription created and active
- [ ] Azure CLI installed and updated (`az version`)
- [ ] Logged in to Azure (`az login`)
- [ ] Correct subscription selected (`az account show`)
- [ ] Resource providers registered

### ☐ Redpanda Cloud Setup
- [ ] Redpanda Cloud account created
- [ ] Cluster provisioned (Starter tier or higher)
- [ ] Topics created: `task-events`, `notifications`
- [ ] Bootstrap servers URL obtained
- [ ] SASL credentials generated (username + password)
- [ ] Connection tested

### ☐ Local Environment
- [ ] kubectl installed (`kubectl version`)
- [ ] Helm 3.x installed (`helm version`)
- [ ] Docker installed (`docker --version`)
- [ ] Git configured
- [ ] Repository cloned locally

### ☐ Secrets and Configuration
- [ ] `.env` file created from `.env.example`
- [ ] All required secrets filled in `.env`:
  - [ ] DATABASE_URL (Neon PostgreSQL)
  - [ ] OPENAI_API_KEY
  - [ ] BETTER_AUTH_SECRET
  - [ ] REDPANDA_SASL_USERNAME
  - [ ] REDPANDA_SASL_PASSWORD
  - [ ] REDPANDA_BROKERS
  - [ ] AZURE_RESOURCE_GROUP
  - [ ] AKS_CLUSTER_NAME
  - [ ] ACR_NAME
- [ ] Secrets never committed to Git (`.env` in `.gitignore`)

## Phase 1: Azure Infrastructure Setup

### ☐ Resource Group
```bash
./scripts/setup-aks.sh
```
- [ ] Resource group created: `hackathon-todo-rg`
- [ ] Location configured: `eastus` (or your preferred region)
- [ ] Tags applied: `Project=HackathonTodo`, `Environment=Production`

### ☐ Azure Container Registry (ACR)
- [ ] ACR created with unique name (e.g., `hackathontodoacr`)
- [ ] ACR login server obtained
- [ ] Admin user enabled
- [ ] ACR credentials saved for CI/CD

### ☐ AKS Cluster
- [ ] AKS cluster created: `hackathon-todo-prod`
- [ ] Node count: 2 nodes initially
- [ ] VM size: `Standard_D2s_v3`
- [ ] Kubernetes version: 1.28+
- [ ] Cluster autoscaler enabled (2-5 nodes)
- [ ] Azure CNI network plugin
- [ ] Azure Monitor enabled
- [ ] ACR attached to AKS
- [ ] kubectl credentials configured
- [ ] Cluster connection verified (`kubectl get nodes`)

**Estimated Time**: 15-20 minutes
**Cost**: ~$140-175/month

## Phase 2: Dapr Installation

### ☐ Install Dapr
```bash
./scripts/install-dapr.sh
```
- [ ] Dapr extension installed (v1.14.4+)
- [ ] Dapr pods running in `dapr-system` namespace
- [ ] High availability enabled (3 replicas for control plane)
- [ ] Installation verified (`kubectl get pods -n dapr-system`)

**Estimated Time**: 3-5 minutes

## Phase 3: Kubernetes Secrets Configuration

### ☐ Create Secrets
```bash
./scripts/setup-secrets.sh
```
- [ ] `database-credentials` secret created
- [ ] `openai-credentials` secret created
- [ ] `auth-credentials` secret created
- [ ] `redpanda-credentials` secret created
- [ ] Secrets verified (`kubectl get secrets -n default`)
- [ ] No secrets visible in logs

**Estimated Time**: 2-3 minutes

## Phase 4: Dapr Components

### ☐ Apply Dapr Components
```bash
kubectl apply -f dapr/components/ -n default
kubectl apply -f dapr/configuration/ -n default
```
- [ ] Pub/Sub component created (Kafka/Redpanda)
- [ ] State store component created (PostgreSQL)
- [ ] Secrets store component created (Kubernetes)
- [ ] Dapr configuration applied
- [ ] Components verified (`kubectl get components -n default`)

**Estimated Time**: 2 minutes

## Phase 5: Build and Push Docker Images

### ☐ Build Images
```bash
# Login to ACR
az acr login --name hackathontodoacr

# Build and tag images
docker build -t hackathontodoacr.azurecr.io/todo-backend:latest ./backend
docker build -t hackathontodoacr.azurecr.io/todo-frontend:latest ./frontend

# Push to ACR
docker push hackathontodoacr.azurecr.io/todo-backend:latest
docker push hackathontodoacr.azurecr.io/todo-frontend:latest
```
- [ ] Backend Docker image built successfully
- [ ] Frontend Docker image built successfully
- [ ] Images pushed to ACR
- [ ] Images visible in ACR (`az acr repository list --name hackathontodoacr`)

**Estimated Time**: 10-15 minutes (depending on internet speed)

## Phase 6: Application Deployment

### ☐ Deploy with Helm
```bash
./scripts/deploy.sh latest
```
- [ ] Helm chart deployed successfully
- [ ] Backend pods running (2 replicas initially)
- [ ] Frontend pods running (2 replicas initially)
- [ ] All pods in `Running` state (`kubectl get pods -n default`)
- [ ] HPA created and active (`kubectl get hpa -n default`)
- [ ] Dapr sidecars injected into pods

**Estimated Time**: 5-10 minutes

## Phase 7: Verify Deployment

### ☐ Run Smoke Tests
```bash
./scripts/smoke-tests.sh
```
- [ ] All pods running
- [ ] Backend health check passing
- [ ] Frontend accessible
- [ ] LoadBalancer IP assigned
- [ ] Database connectivity verified
- [ ] No errors in pod logs

### ☐ Get Frontend URL
```bash
kubectl get service -n default -l app.kubernetes.io/component=frontend
```
- [ ] LoadBalancer external IP obtained
- [ ] Frontend URL accessible: `http://<EXTERNAL-IP>:3000`
- [ ] Application loads in browser
- [ ] All features working (create tasks, chat with AI)

**Estimated Time**: 5 minutes

## Phase 8: CI/CD Pipeline Setup

### ☐ GitHub Secrets Configuration
- [ ] Service principal created for GitHub Actions
- [ ] GitHub secret `AZURE_CREDENTIALS` added
- [ ] GitHub secret `ACR_USERNAME` added
- [ ] GitHub secret `ACR_PASSWORD` added
- [ ] GitHub secret `PRODUCTION_API_URL` added
- [ ] (Optional) GitHub secret `SLACK_WEBHOOK_URL` added

### ☐ Test CI/CD Pipeline
```bash
# Push a test commit to main branch
git checkout main
echo "# Test" >> README.md
git add README.md
git commit -m "test: trigger CI/CD pipeline"
git push origin main
```
- [ ] GitHub Actions workflow triggered
- [ ] Tests passed
- [ ] Docker images built and pushed
- [ ] Deployment to AKS successful
- [ ] Smoke tests passed
- [ ] Notifications sent (if configured)

**Estimated Time**: 10-15 minutes

## Phase 9: Auto-Scaling Verification

### ☐ Load Testing
```bash
# Install load testing tool
go install github.com/rakyll/hey@latest

# Run load test
./scripts/load-test.sh 300 50 10
```
- [ ] Initial pod count: 2 replicas
- [ ] Load test executed successfully
- [ ] CPU utilization increased above 70%
- [ ] HPA scaled pods to 3-5 replicas
- [ ] Response times remained under 1 second
- [ ] After load decreased, pods scaled back down to 2

**Estimated Time**: 10-15 minutes

## Phase 10: Monitoring and Observability

### ☐ Configure Monitoring
- [ ] Azure Monitor collecting metrics
- [ ] Logs accessible via `kubectl logs`
- [ ] Logs accessible via Azure Portal
- [ ] Health probes configured and working
- [ ] HPA metrics visible (`kubectl describe hpa`)

### ☐ Set Up Alerts (Optional)
- [ ] Billing alert configured ($50, $100, $200 thresholds)
- [ ] Pod crash alert configured
- [ ] High CPU alert configured (>80% for 10 minutes)
- [ ] High memory alert configured (>85% for 10 minutes)

**Estimated Time**: 15-20 minutes

## Post-Deployment Checklist

### ☐ Documentation
- [ ] Frontend URL documented
- [ ] Deployment date recorded
- [ ] Current image tags noted
- [ ] Known issues documented
- [ ] Runbook updated

### ☐ Security Review
- [ ] Secrets not visible in code
- [ ] Secrets not visible in logs
- [ ] TLS/mTLS enabled (Dapr)
- [ ] RBAC configured on AKS
- [ ] Network policies reviewed
- [ ] Security scan passed (Trivy)

### ☐ Backup and Disaster Recovery
- [ ] Database backups configured (Neon auto-backup)
- [ ] Helm history available (`helm history hackathon-todo`)
- [ ] Rollback procedure tested (`./scripts/rollback.sh`)
- [ ] Configuration backed up locally

### ☐ Cost Optimization
- [ ] Billing alerts configured
- [ ] Auto-scaling working correctly
- [ ] Resource requests/limits optimized
- [ ] Unused resources identified and removed
- [ ] Cost monitoring dashboard set up

**Estimated Time**: 30 minutes

## Total Deployment Time

- **Minimum (with automation)**: 60-90 minutes
- **Recommended (with verification)**: 2-3 hours
- **First-time deployment**: 3-4 hours

## Success Criteria

✅ **Deployment is successful if:**

1. Application is accessible from internet via LoadBalancer IP
2. All features work correctly (create tasks, chat, view tasks)
3. Auto-scaling responds to load (scales up and down)
4. Health checks are passing
5. No errors in application logs
6. CI/CD pipeline deploys changes automatically
7. Rollback procedure works
8. Total infrastructure cost is within budget ($175/month)

## Rollback Procedure

If deployment fails:

```bash
# Rollback to previous Helm revision
./scripts/rollback.sh

# OR rollback to specific revision
./scripts/rollback.sh 5

# Check pod status
kubectl get pods -n default

# Check logs for errors
kubectl logs -n default -l app.kubernetes.io/component=backend --tail=100
```

## Cleanup Procedure

To delete all resources and stop incurring charges:

```bash
# Delete AKS cluster and ACR only
./scripts/cleanup-azure.sh

# OR delete entire resource group (DESTRUCTIVE!)
./scripts/cleanup-azure.sh --delete-resource-group
```

## Troubleshooting Quick Reference

| Issue | Command | Documentation |
|-------|---------|---------------|
| Pods not starting | `kubectl describe pod <pod-name> -n default` | troubleshooting.md |
| Service not accessible | `kubectl get svc -n default` | troubleshooting.md |
| Dapr issues | `kubectl logs <pod-name> -c daprd -n default` | troubleshooting.md |
| Secrets not found | `kubectl get secrets -n default` | secrets-configuration.md |
| HPA not scaling | `kubectl describe hpa -n default` | troubleshooting.md |
| High costs | Check Azure Cost Management | azure-setup.md |

## Support and Resources

- **Azure Documentation**: https://learn.microsoft.com/en-us/azure/aks/
- **Dapr Documentation**: https://docs.dapr.io/
- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **Helm Documentation**: https://helm.sh/docs/
- **Redpanda Documentation**: https://docs.redpanda.com/

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-03 | Initial Phase 5 deployment checklist |

---

**Status**: Ready for Production Deployment
**Last Updated**: 2026-02-03
**Maintained By**: Hackathon Team
