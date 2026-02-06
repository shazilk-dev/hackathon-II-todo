# Deployment Continuation - From Images Pushed to Live Application

**Current Status**: ✅ Docker images built and pushed to ACR

**Next Steps**: Deploy to AKS and access your live app!

---

## Step 1: Verify Prerequisites (2 minutes)

Before deploying, let's verify everything is ready:

### Check Azure Infrastructure

```powershell
# Check if AKS cluster exists
az aks list --resource-group hackathon-todo-rg --output table

# Check if you can connect to the cluster
kubectl get nodes
```

**Expected Output**:
- You should see your AKS cluster listed
- You should see 1 or more nodes in "Ready" state

**❌ If cluster doesn't exist**, run:
```powershell
bash scripts/setup-aks.sh
```
(This takes 10-15 minutes)

---

### Check Dapr Installation

```powershell
# Check Dapr pods
kubectl get pods -n dapr-system
```

**Expected Output**: You should see 3-4 Dapr pods running (operator, sentry, placement, sidecar-injector)

**❌ If no Dapr pods**, run:
```powershell
bash scripts/install-dapr.sh
```
(This takes 3-5 minutes)

---

### Check Secrets Configuration

```powershell
# Check if secrets exist
kubectl get secrets -n default
```

**Expected Output**: You should see secrets like:
- `database-credentials`
- `openai-credentials`
- `auth-credentials`
- `redpanda-credentials`

**❌ If secrets are missing**, run:
```powershell
bash scripts/setup-secrets.sh
```
(Type `y` when prompted)

---

## Step 2: Deploy Application (5-10 minutes)

Now let's deploy your application!

```powershell
# Navigate to project root
cd F:\PROJECTS\hackathone-II\hackathon-todo

# Run deployment script
bash scripts/deploy.sh latest
```

**What you'll see**:
```
[INFO] === Azure AKS Deployment ===
[INFO] Release: hackathon-todo
[INFO] Image Tag: latest
[INFO] Registry: hackathontodoXY1234.azurecr.io
[WARN] You are about to deploy to Azure AKS...
[WARN] Cluster: hackathon-todo-dev
[WARN] Namespace: default
Continue? (y/N):
```

**Type**: `y` and press Enter

---

### What Happens During Deployment

The script will:

1. ✅ **Apply Dapr components** (pub/sub, state store)
2. ✅ **Verify secrets** exist
3. ✅ **Deploy with Helm** (creates pods, services, ingress)
4. ⏳ **Wait for pods** to be ready (2-3 minutes)
5. ✅ **Run smoke tests** (health checks)
6. ✅ **Get public URL**

**Progress indicators**:
```
[INFO] Applying Dapr components...
[INFO] ✅ Dapr components applied successfully

[INFO] Verifying secrets...
[INFO] ✅ All required secrets exist

[INFO] Deploying with Helm...
[INFO] Release: hackathon-todo
[INFO] Waiting for pods to be ready...
.......................
[INFO] ✅ All pods are running

[INFO] Running smoke tests...
[INFO] ✅ Backend health check: PASS
[INFO] ✅ Frontend health check: PASS

[INFO] === Deployment Summary ===
[INFO] ✅ Deployment completed successfully!
[INFO] 🌐 Frontend URL: http://20.xxx.xxx.xxx:3000
[INFO] 📊 Backend API: http://20.xxx.xxx.xxx:8000
```

**⏱️ Total Time**: 5-10 minutes

---

## Step 3: Access Your Application! 🎉

### Get the Public URL

If you missed it in the deployment output:

```powershell
# Get frontend service URL
kubectl get service -n default -l app.kubernetes.io/component=frontend
```

**Example Output**:
```
NAME                   TYPE           EXTERNAL-IP      PORT(S)
hackathon-todo-frontend LoadBalancer  20.xxx.xxx.xxx   3000:30123/TCP
```

**Your URL**: `http://20.xxx.xxx.xxx:3000` (replace with YOUR IP)

---

### Open in Browser

1. **Copy the EXTERNAL-IP** from above
2. **Open browser**: Chrome, Edge, Firefox
3. **Navigate to**: `http://<EXTERNAL-IP>:3000`

**✅ SUCCESS!** You should see:
- Your Todo App landing page
- Sign up / Sign in buttons
- Professional minimalist design

---

### Test Your App

**Try these features**:

1. **Sign Up**
   - Click "Sign Up"
   - Enter email: `test@example.com`
   - Enter password: `Test123!`
   - Click "Create Account"

2. **Create Tasks**
   - Click "Add Task"
   - Title: "My first cloud task!"
   - Description: "Deployed on Azure AKS"
   - Click "Save"

3. **Chat with AI** (if Phase 5 chatbot is enabled)
   - Click "Chat"
   - Ask: "What tasks do I have?"
   - AI should respond with your tasks

4. **Toggle Completion**
   - Click checkbox next to task
   - Task should show as completed

**✅ If everything works**: Congratulations! Your app is LIVE on Azure! 🎉

---

## Step 4: Monitor Your Deployment (2 minutes)

### Check Pod Status

```powershell
# View all pods
kubectl get pods -n default

# Expected output:
# NAME                                    READY   STATUS    RESTARTS   AGE
# hackathon-todo-backend-xxx-yyy          2/2     Running   0          5m
# hackathon-todo-backend-xxx-zzz          2/2     Running   0          5m
# hackathon-todo-frontend-xxx-aaa         2/2     Running   0          5m
# hackathon-todo-frontend-xxx-bbb         2/2     Running   0          5m
```

**What "2/2" means**:
- Container 1: Your app (backend or frontend)
- Container 2: Dapr sidecar

---

### Check Logs (If Needed)

```powershell
# Backend logs
kubectl logs -n default -l app.kubernetes.io/component=backend --tail=50

# Frontend logs
kubectl logs -n default -l app.kubernetes.io/component=frontend --tail=50

# Dapr sidecar logs (for debugging)
kubectl logs -n default <pod-name> -c daprd --tail=50
```

---

### Check Auto-Scaling Status

```powershell
# View Horizontal Pod Autoscaler
kubectl get hpa -n default

# Expected output:
# NAME                      REFERENCE                  TARGETS   MINPODS   MAXPODS   REPLICAS
# hackathon-todo-backend    Deployment/...-backend     15%/70%   2         5         2
# hackathon-todo-frontend   Deployment/...-frontend    10%/70%   2         5         2
```

**What this means**:
- **TARGETS**: Current CPU usage vs threshold (70%)
- **MINPODS**: Always keeps 2 pods running
- **MAXPODS**: Can scale up to 5 pods under high load
- **REPLICAS**: Currently running pods

---

## Step 5: 💰 SAVE MONEY - Stop Cluster When Not Using (CRITICAL!)

**⚠️ IMPORTANT**: When you're done for the day, STOP the cluster to save 70-80% of costs!

### Stop Cluster (End of Day)

```powershell
bash scripts/stop-cluster.sh
```

**What you'll see**:
```
[WARN] This will STOP the AKS cluster: hackathon-todo-dev
[WARN] Your application will be OFFLINE until you start it again
[WARN] No data will be lost (stored in Neon PostgreSQL)
Stop cluster now? (y/N):
```

**Type**: `y` and press Enter

**Wait**: 2-3 minutes

**✅ Success**: "Cluster stopped successfully!"

**What this does**:
- Stops all nodes (VMs are deallocated)
- App is **OFFLINE** but data is **SAFE**
- Saves ~$4-5 per day!
- Your $100 credit lasts **10 months** instead of **18 days**!

---

### Start Cluster (Next Day)

When you want to work again:

```powershell
bash scripts/start-cluster.sh
```

**Wait**: 3-5 minutes

**✅ Success**: "Cluster started successfully!"

**Get URL again** (IP might change):
```powershell
kubectl get service -n default -l app.kubernetes.io/component=frontend
```

**Your app is BACK ONLINE!**

---

## Step 6: Daily Routine (Budget Management)

### End of Work Day (e.g., 9 PM)
```powershell
bash scripts/stop-cluster.sh
```

### Start of Work Day (e.g., 9 AM)
```powershell
bash scripts/start-cluster.sh
```

### Check Spending Anytime
1. Go to: https://portal.azure.com
2. Search: "Cost Management"
3. Click: "Cost analysis"
4. View: Daily spending breakdown

**Set Budget Alerts** (Recommended):
1. Cost Management → Budgets → Create
2. Amount: $25/month
3. Alert at: 50%, 80%, 100%
4. Email: Your email

---

## Troubleshooting Common Issues

### Issue: "Pods are in CrashLoopBackOff"

**Check logs**:
```powershell
kubectl logs -n default <pod-name> --tail=100
```

**Common causes**:
1. **Wrong DATABASE_URL**: Check `.env` file has correct Neon URL
2. **Wrong OPENAI_API_KEY**: Verify API key is valid
3. **Missing secrets**: Run `bash scripts/setup-secrets.sh` again

**Fix**:
```powershell
# Delete the secret and recreate
kubectl delete secret database-credentials -n default
bash scripts/setup-secrets.sh
```

---

### Issue: "LoadBalancer EXTERNAL-IP shows <pending>"

**Wait**: LoadBalancer IP takes 2-3 minutes to assign

**Check status**:
```powershell
kubectl get service -n default --watch
```

**If still pending after 5 minutes**:
```powershell
# Check events
kubectl get events -n default --sort-by='.lastTimestamp' | tail -20
```

**If shows quota error**: Your Azure subscription might have restrictions
- Contact Azure support OR
- Try different region in `.env` (e.g., `centralindia` → `eastus`)

---

### Issue: "Application loads but features don't work"

**Check backend health**:
```powershell
kubectl get service -n default -l app.kubernetes.io/component=backend

# Get backend IP
# Visit: http://<BACKEND-IP>:8000/health
```

**Check Dapr components**:
```powershell
kubectl get components -n default
```

**Expected**: You should see `kafka-pubsub` and `statestore` components

**If missing**:
```powershell
# Reapply Dapr components
kubectl apply -f dapr/components/
```

---

### Issue: "Out of Azure credits / spending too much"

**IMMEDIATE ACTION**:
```powershell
# Stop cluster NOW
bash scripts/stop-cluster.sh
```

**Check spending**:
```powershell
az consumption usage list --output table
```

**If STILL spending too much**:
```powershell
# DELETE EVERYTHING (last resort)
bash scripts/cleanup-azure.sh --delete-resource-group
```

**⚠️ WARNING**: This deletes ALL Azure resources. Only do when truly done!

---

## Success Checklist

After following this guide, you should have:

- [x] ✅ Images pushed to Azure Container Registry
- [ ] ✅ AKS cluster running and accessible
- [ ] ✅ Dapr installed and running
- [ ] ✅ Secrets configured
- [ ] ✅ Application deployed (2+ pods running)
- [ ] ✅ Public URL accessible in browser
- [ ] ✅ Tasks CRUD working
- [ ] ✅ AI chat working (if enabled)
- [ ] ✅ Know how to stop/start cluster
- [ ] ✅ Budget alerts configured

---

## What You Achieved 🎉

🚀 **Deployed a production-grade application to Azure cloud!**

✅ Features:
- Public internet access (LoadBalancer)
- Auto-scaling (2-5 pods based on load)
- Event-driven architecture (Kafka via Redpanda)
- Secure secrets management
- Health monitoring
- Professional deployment automation

💰 **Cost**: ~$10/month with daily stop/start routine

🎓 **Skills Gained**:
- Azure Kubernetes Service (AKS)
- Docker containerization
- Kubernetes deployments
- Dapr microservices
- Cloud cost management
- DevOps automation

---

## Next Steps (Optional)

### For Hackathon Demo:
- Share URL with judges: `http://<YOUR-IP>:3000`
- Demo all features (tasks, AI chat, auto-scaling)
- Stop cluster after demo to save credits

### To Add CI/CD:
- Set up GitHub Actions (already configured in `.github/workflows/`)
- Add secrets to GitHub repository
- Push code → automatic deployment!

### To Add Custom Domain:
- Buy domain from Namecheap/GoDaddy
- Configure Azure DNS
- Update Kubernetes Ingress

### To Monitor Better:
- Install Prometheus + Grafana
- Set up Azure Monitor alerts
- Configure log aggregation

---

## Need Help?

**Re-read sections** that were unclear

**Check documentation**:
- This guide (you're reading it!)
- [COMPLETE-BEGINNER-GUIDE.md](./COMPLETE-BEGINNER-GUIDE.md)
- [README-PHASE5.md](./README-PHASE5.md)

**Common issues**: See "Troubleshooting" section above

**Still stuck?** Check pod logs:
```powershell
kubectl logs -n default <pod-name> --tail=100
```

---

**Congratulations on your cloud deployment!** 🎉☁️

You've accomplished something many developers struggle with. Be proud! 💪

