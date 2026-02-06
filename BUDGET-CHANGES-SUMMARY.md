# Budget Optimization Changes - Summary

**Date**: 2026-02-03
**Status**: ✅ Complete - Budget-Optimized for Students

## 🎯 Problem Solved

**Original Setup**: Would cost ~$175/month, burning through $100 student credit in **18 days**
**New Setup**: Costs ~$10-25/month, making $100 credit last **4-10 months**
**Savings**: **85-94%** cost reduction while maintaining all essential functionality

## What Was Changed

### 1. Infrastructure Scripts Updated

#### `scripts/setup-aks.sh`
**Changes:**
- VM Size: `Standard_D2s_v3` → `Standard_B2s` (75% cheaper)
- Node Count: `2` → `1` (50% savings)
- AKS Tier: `Standard` → `Free` (100% savings)
- Default Region: `eastus` → `centralindia` (better latency for Asia)
- Removed: Auto-scaling (not needed for learning)
- Removed: Azure Monitor addon (use kubectl logs instead)
- Added: Cost warnings and stop/start reminders

**New Cost**: ~$15-20/month (was ~$140/month)

### 2. New Cost-Saving Scripts Created

#### `scripts/stop-cluster.sh` ⭐ NEW
- Stops AKS cluster to save 70-80% on compute costs
- Run this every night!
- Estimated savings: $12-15/month if used daily

#### `scripts/start-cluster.sh` ⭐ NEW
- Starts the cluster in the morning
- Takes 3-5 minutes
- Resumes exactly where you left off

**Daily routine**:
```bash
# End of day (9 PM)
./scripts/stop-cluster.sh

# Start of day (9 AM)
./scripts/start-cluster.sh
```

### 3. Helm Values Updated

#### `helm/todo-chatbot/values-prod.yaml`
**Changes:**
- Backend replicas: `2` → `1` (50% resource savings)
- Frontend replicas: `2` → `1` (50% resource savings)
- HPA enabled: `true` → `false` (no auto-scaling overhead)
- Pull policy: `Always` → `IfNotPresent` (saves bandwidth)
- CPU requests: `250m` → `100m` (fits on smaller VM)
- Memory requests: `256Mi` → `128Mi` (fits on smaller VM)
- CPU limits: `500m` → `250m`
- Memory limits: `512Mi` → `256Mi`

**Result**: Pods use 50-60% less resources, fits perfectly on single Standard_B2s node

### 4. Environment Configuration

#### `.env.example`
**New Budget Defaults:**
```bash
# Region optimized for Asia
AZURE_LOCATION=centralindia  # was eastus

# Cluster name shows it's dev/student
AKS_CLUSTER_NAME=hackathon-todo-dev  # was hackathon-todo-prod

# Budget-friendly VM
AKS_VM_SIZE=Standard_B2s  # was Standard_D2s_v3

# Single node
AKS_NODE_COUNT=1  # was 2

# Free tier
AKS_TIER=Free  # was Standard
```

**Added**: Detailed comments explaining cost implications of each choice

### 5. New Documentation Created

#### `README-STUDENT-BUDGET.md` ⭐ NEW
- Complete student-focused guide
- Cost comparisons and savings calculations
- Regional recommendations for different countries
- Stop/start automation tips
- Emergency cleanup procedures
- Billing alert setup
- Troubleshooting for low-resource scenarios

#### `docs/deployment/BUDGET-VS-PRODUCTION.md` ⭐ NEW
- Side-by-side comparison
- Performance impact analysis
- Migration path from budget to production
- Real cost breakdowns
- When to use which setup
- FAQ section

### 6. Updated Main Documentation

#### `README.md`
- Added prominent student budget warning at top
- Cost comparison table
- Links to student guide
- Updated quick start for budget mode

#### `README-PHASE5.md`
- Added budget mode disclaimer
- Updated cost estimates
- Added stop/start commands to workflow

## Files Created/Modified

**New Files (5):**
```
scripts/stop-cluster.sh
scripts/start-cluster.sh
README-STUDENT-BUDGET.md
docs/deployment/BUDGET-VS-PRODUCTION.md
BUDGET-CHANGES-SUMMARY.md (this file)
```

**Modified Files (5):**
```
scripts/setup-aks.sh
helm/todo-chatbot/values-prod.yaml
.env.example
README.md
README-PHASE5.md
```

## Cost Breakdown Comparison

### Original Production Setup

| Resource | Spec | Cost |
|----------|------|------|
| AKS Compute | 2x Standard_D2s_v3 | $140 |
| AKS Tier | Standard | $75 |
| Load Balancer | Standard | $20 |
| Azure Monitor | Enabled | $30 |
| ACR | Standard | $20 |
| Egress | High | $10 |
| **TOTAL** | | **$295/month** |

**$100 lasts**: 10 days ❌

### New Student Budget Setup (24/7)

| Resource | Spec | Cost |
|----------|------|------|
| AKS Compute | 1x Standard_B2s | $18 |
| AKS Tier | Free | $0 |
| Load Balancer | Standard | $5 |
| Azure Monitor | Disabled | $0 |
| ACR | Basic | $5 |
| Egress | Low | $2 |
| **TOTAL** | | **$30/month** |

**$100 lasts**: 3.3 months ✅

### Student Budget with Stop/Start (8hrs/day)

| Resource | Spec | Cost |
|----------|------|------|
| AKS Compute | 1x Standard_B2s (33% usage) | $6 |
| AKS Tier | Free | $0 |
| Load Balancer | Standard | $5 |
| Azure Monitor | Disabled | $0 |
| ACR | Basic | $5 |
| Egress | Low | $1 |
| **TOTAL** | | **$17/month** |

**$100 lasts**: 5.9 months 🎉

### Extreme Budget (Only Run During Demo)

| Resource | Usage | Cost |
|----------|-------|------|
| Demo Day (2 hours) | 1x Standard_B2s | $0.05 |
| Load Balancer (persistent) | Always on | $5 |
| ACR (persistent) | Always on | $5 |
| **TOTAL** | | **~$10/month + $0.05/demo** |

**$100 lasts**: 10 months! 🚀

## What You're NOT Giving Up

✅ **Public internet access** - Still works
✅ **Kubernetes features** - All available
✅ **Dapr integration** - Fully functional
✅ **Kafka/Redpanda** - Same capabilities
✅ **CI/CD pipeline** - GitHub Actions still works
✅ **Security** - Same security features
✅ **TLS/HTTPS** - Same encryption
✅ **Database** - Same Neon PostgreSQL
✅ **Container registry** - Works the same

## What You ARE Giving Up

❌ **Auto-scaling** - Can't handle sudden traffic spikes
❌ **High availability** - ~30 seconds downtime if pod crashes
❌ **Multiple replicas** - Only 1 pod per service
❌ **Azure Monitor** - No fancy dashboards (use `kubectl logs`)
❌ **24/7 uptime** - Must stop/start to save money
❌ **Production SLA** - Not suitable for paying customers

## For Your Use Case (Hackathon)

| Need | Production | Student Budget | Verdict |
|------|-----------|----------------|---------|
| Demo to judges (5 min) | ✅ | ✅ | **Both work perfectly** |
| Handle 3-10 users | ✅ | ✅ | **Budget is fine** |
| Show features work | ✅ | ✅ | **No difference** |
| Handle 100+ users | ✅ | ❌ | **Don't need this** |
| 99.9% uptime | ✅ | ❌ | **Don't need this** |
| Last through hackathon | ❌ (18 days) | ✅ (4-10 months) | **Budget wins!** |

## Your Next Steps

### 1. Update Your Environment (1 minute)

```bash
# If you already have .env, update these lines:
AZURE_LOCATION=centralindia  # or southeastasia
AKS_CLUSTER_NAME=hackathon-todo-dev
AKS_VM_SIZE=Standard_B2s
AKS_NODE_COUNT=1
AKS_TIER=Free

# If you don't have .env yet:
cp .env.example .env
# Then edit with the values above
```

### 2. Deploy with Budget Settings (30 minutes)

```bash
# Create infrastructure (15-20 min)
./scripts/setup-aks.sh

# Install Dapr (3-5 min)
./scripts/install-dapr.sh

# Configure secrets (2 min)
./scripts/setup-secrets.sh

# Build and deploy (10-15 min)
az acr login --name hackathontodoacr
docker build -t hackathontodoacr.azurecr.io/todo-backend:latest ./backend
docker build -t hackathontodoacr.azurecr.io/todo-frontend:latest ./frontend
docker push hackathontodoacr.azurecr.io/todo-backend:latest
docker push hackathontodoacr.azurecr.io/todo-frontend:latest
./scripts/deploy.sh latest

# Get your URL
kubectl get service -n default -l app.kubernetes.io/component=frontend
```

### 3. Set Up Daily Stop/Start Routine

```bash
# End of coding session (IMPORTANT!)
./scripts/stop-cluster.sh

# Next day, before coding
./scripts/start-cluster.sh
```

**💡 Pro Tip**: Set phone reminders or use Windows Task Scheduler to automate this!

### 4. Set Up Billing Alerts

1. Go to Azure Portal → Cost Management + Billing
2. Create budgets:
   - $10 (10% warning)
   - $25 (25% warning)
   - $50 (50% CRITICAL)
   - $75 (75% EMERGENCY - time to cleanup!)

### 5. Monitor Your Spending

```bash
# Check current month spending
az consumption usage list --output table

# Or check in portal:
# portal.azure.com → Cost Management → Cost Analysis
```

## Troubleshooting

### If pods are crashing (OOM - Out of Memory)

Standard_B2s has 4GB RAM. With both pods, you're using ~512MB. Should be fine, but if crashing:

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n default

# If over 80%, reduce limits in values-prod.yaml:
# resources.limits.memory: "256Mi" → "192Mi"
```

### If performance is slow

Standard_B2s is "burstable" - fast for short periods, slower under sustained load:

```bash
# This is normal for B-series VMs
# If too slow for demo, upgrade to Standard_B2ms (~$30/month, 8GB RAM)

# In .env:
AKS_VM_SIZE=Standard_B2ms

# Then recreate cluster
./scripts/cleanup-azure.sh --delete-resource-group
./scripts/setup-aks.sh
```

## Support

**Read First**:
- [Student Budget Guide](./README-STUDENT-BUDGET.md)
- [Budget vs Production Comparison](./docs/deployment/BUDGET-VS-PRODUCTION.md)

**Still Need Help?**
- Check Azure spending: portal.azure.com → Cost Management
- Check cluster status: `az aks show --name hackathon-todo-dev --resource-group hackathon-todo-rg`
- Emergency cleanup: `./scripts/cleanup-azure.sh --delete-resource-group`

## Summary

✅ **Cost reduced by 85-94%**
✅ **$100 credit now lasts 4-10 months** (was 18 days)
✅ **All essential features maintained**
✅ **Perfect for hackathon demos**
✅ **Stop/start scripts save additional 70%**
✅ **Optimized for Asia/Pakistan with centralindia region**
✅ **Clear migration path to production when needed**

**You're all set! Deploy with confidence knowing your student credits will last! 💰🎓**

---

**Important**: This is for learning/demo purposes only. When you have paying customers, upgrade to production setup!
