# 💰 Student/Hackathon Budget Guide - Azure AKS Deployment

**CRITICAL**: This is the budget-optimized version for students with limited cloud credits (e.g., Azure for Students $100).

## 🚨 Budget Reality Check

| Setup | Monthly Cost | Your $100 Lasts |
|-------|--------------|-----------------|
| ❌ **Original Production** | ~$175/month | 18 days ⚠️ |
| ✅ **Student Budget (24/7)** | ~$25/month | 4 months ✅ |
| 🌟 **Student + Stop/Start** | ~$10/month | 10 months 🎉 |

**Bottom Line**: Use the Student Budget setup + stop cluster when not coding = **Your $100 credit lasts the entire academic year!**

## What Changed from Production?

| Feature | Production (💸 Expensive) | Student (💰 Budget) | Savings |
|---------|--------------------------|---------------------|---------|
| **VM Size** | Standard_D2s_v3 | Standard_B2s (Burstable) | **~75%** |
| **Node Count** | 2 nodes | 1 node | **50%** |
| **AKS Tier** | Standard | Free | **100%** |
| **Replicas** | 2 per service | 1 per service | **50%** |
| **Auto-scaling** | Enabled (2-5 pods) | Disabled | **~30%** |
| **Monitoring** | Azure Monitor | kubectl logs only | **100%** |
| **Region** | eastus (far from Asia) | centralindia (close) | Better latency |

**Total Savings**: ~**85-90%** on infrastructure costs!

## Quick Start (30 Minutes)

### 1. Prerequisites

```bash
# Install Azure CLI (Windows - as Admin in PowerShell)
winget install Microsoft.AzureCLI

# Install kubectl
az aks install-cli

# Login to Azure
az login

# Verify you're using Student subscription
az account list --output table
az account set --subscription "<your-azure-for-students-id>"
```

### 2. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit with your values (use nano, vim, or code .env)
# IMPORTANT: Set these for budget mode:
# - AZURE_LOCATION=centralindia (or southeastasia)
# - AKS_VM_SIZE=Standard_B2s
# - AKS_NODE_COUNT=1
# - AKS_TIER=Free
```

### 3. Create Infrastructure (~20 minutes)

```bash
# This creates the cheapest possible setup
./scripts/setup-aks.sh

# This installs Dapr (free, just software)
./scripts/install-dapr.sh

# This creates Kubernetes secrets (free)
./scripts/setup-secrets.sh
```

**What You Just Created**:
- ✅ 1 AKS node (Standard_B2s) - ~$15-20/month
- ✅ 1 Load Balancer (Standard) - ~$5/month
- ✅ 1 Container Registry (Basic) - ~$5/month
- **Total**: ~$25/month running 24/7

### 4. Deploy Application (~15 minutes)

```bash
# Login to container registry
az acr login --name hackathontodoacr

# Build images (takes 5-10 min depending on internet)
docker build -t hackathontodoacr.azurecr.io/todo-backend:latest ./backend
docker build -t hackathontodoacr.azurecr.io/todo-frontend:latest ./frontend

# Push to registry
docker push hackathontodoacr.azurecr.io/todo-backend:latest
docker push hackathontodoacr.azurecr.io/todo-frontend:latest

# Deploy (takes 3-5 min)
./scripts/deploy.sh latest

# Get your public URL
kubectl get service -n default -l app.kubernetes.io/component=frontend

# Visit http://<EXTERNAL-IP>:3000 in your browser
```

## 💰 THE MONEY-SAVING SECRET: Stop/Start

**This is the most important part!**

```bash
# End of coding day (9 PM)
./scripts/stop-cluster.sh

# Next morning (9 AM)
./scripts/start-cluster.sh
```

**Math**:
- Running 24/7: $25/month
- Running 8 hours/day: ~$10/month
- **Savings**: $15/month = $180/year = **Almost 2 months of free usage!**

### Make It a Habit

Create a reminder on your phone:
- ⏰ **9 PM**: "Stop Azure cluster to save money!"
- ⏰ **9 AM**: "Start Azure cluster to code"

Or use Windows Task Scheduler:
```powershell
# Stop at 10 PM daily
schtasks /create /tn "Stop AKS" /tr "C:\path\to\stop-cluster.sh" /sc daily /st 22:00

# Start at 8 AM daily
schtasks /create /tn "Start AKS" /tr "C:\path\to\start-cluster.sh" /sc daily /st 08:00
```

## Regional Cost Comparison

| Region | Latency from Karachi | Cost | Recommendation |
|--------|---------------------|------|----------------|
| **centralindia** | ~20-40ms | Medium | ✅ **BEST for you** |
| southeastasia | ~60-80ms | Medium | ✅ Good alternative |
| eastus | ~250-300ms | Lowest | ❌ Too slow for demo |
| westeurope | ~150-200ms | High | ❌ Expensive + slow |

**For Karachi**: Use `centralindia` (Mumbai, India) - it's close, fast, and reasonably priced.

## What Features Are You Giving Up?

| Feature | Impact | Workaround |
|---------|--------|-----------|
| Auto-scaling | Can't handle sudden traffic spikes | Not needed for demo/learning |
| Multiple replicas | Less fault-tolerant | Acceptable for dev |
| Azure Monitor | No fancy dashboards | Use `kubectl logs` instead |
| High availability | ~30 seconds downtime on pod restart | Acceptable for learning |

**Reality Check**: For a hackathon demo with 5-10 users, you don't need production features!

## Monitoring on a Budget

Instead of Azure Monitor ($$$), use free tools:

```bash
# View all pods
kubectl get pods -n default

# View logs (live)
kubectl logs -f -n default -l app.kubernetes.io/component=backend

# Check resource usage
kubectl top pods -n default

# Check if things are working
./scripts/smoke-tests.sh
```

## Troubleshooting

### "My $100 is running out fast!"

```bash
# Check your spending
az consumption usage list --output table

# Stop EVERYTHING immediately
./scripts/stop-cluster.sh

# Or delete everything (nuclear option)
./scripts/cleanup-azure.sh --delete-resource-group
```

### "Cluster won't start after stopping"

```bash
# Sometimes takes 5 minutes, be patient
az aks show --name hackathon-todo-dev --resource-group hackathon-todo-rg --query powerState

# If stuck, try:
az aks start --name hackathon-todo-dev --resource-group hackathon-todo-rg
```

### "Pods are crashing due to low resources"

This can happen on Standard_B2s if you run too many things:

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n default

# If over 80%, you might need to:
# 1. Reduce replicas to 1 (already done in budget mode)
# 2. Lower resource limits in values-prod.yaml
# 3. Or upgrade to Standard_B2ms (~$30/month, 8GB RAM)
```

## Cost Tracking Dashboard

Set up billing alerts:

```bash
# Azure Portal → Cost Management + Billing → Budgets → Create
# Set alerts at:
# - $10 (10% warning)
# - $25 (25% warning)
# - $50 (50% CRITICAL - stop cluster!)
# - $75 (75% EMERGENCY - delete everything!)
```

## Comparison Table

| Scenario | Setup | Cost/Month | When to Use |
|----------|-------|------------|-------------|
| 🎓 **Learning/Demo** | 1 node, Standard_B2s, stop/start | $8-10 | **You** (hackathon) |
| 👨‍💻 **Personal Project** | 1 node, Standard_B2s, 24/7 | $20-25 | Side projects |
| 🏢 **Small Startup** | 2 nodes, Standard_D2s_v3, HPA | $100-150 | Paying customers |
| 🏭 **Production Company** | 3+ nodes, auto-scale to 10 | $500+ | Enterprise |

## When to Graduate to Production Setup

Upgrade when:
- ✅ You have paying customers
- ✅ You need 99.9% uptime SLA
- ✅ You have >100 concurrent users
- ✅ You have a real budget ($200+/month)

For now, **stay in budget mode!**

## Emergency Cleanup

If you're running out of credits and need to delete everything:

```bash
# This deletes EVERYTHING (cannot be undone!)
./scripts/cleanup-azure.sh --delete-resource-group

# Frees up credits immediately
# Your $100 credit is restored (minus what you already spent)
```

## Summary: Your Action Plan

1. ✅ Use `centralindia` region (fast from Karachi)
2. ✅ Use `Standard_B2s` VM (burstable, cheap)
3. ✅ Use 1 node only
4. ✅ Stop cluster every night
5. ✅ Set billing alerts at $10, $25, $50
6. ✅ Monitor spending weekly
7. ✅ Delete resources after hackathon if not needed

**Result**: $100 credit lasts 6-10 months instead of 18 days!

## Questions?

- **"Is this production-ready?"** No, but perfect for learning/demo
- **"Will it work for hackathon demo?"** Yes! Handles 10-50 users easily
- **"Can I upgrade later?"** Yes! Just change values and redeploy
- **"What if I need more power?"** Upgrade to Standard_B2ms ($30/mo) first

---

**Remember**: The best cloud setup is one that doesn't bankrupt you while learning! 💰🎓

**For full details**: See [README-PHASE5.md](./README-PHASE5.md) (production version)
