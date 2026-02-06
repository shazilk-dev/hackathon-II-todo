# ⚡ Quick Update Cheatsheet

**Use this when you want to update your deployed app**

---

## 🚀 Method 1: Fast Manual Update (10 minutes)

```powershell
# 1. Navigate to project
cd F:\PROJECTS\hackathone-II\hackathon-todo

# 2. Build images (5-8 min)
docker build -t hackathontodoacr.azurecr.io/todo-backend:latest ./backend
docker build -t hackathontodoacr.azurecr.io/todo-frontend:latest ./frontend

# 3. Login to ACR
az acr login --name hackathontodoacr

# 4. Push images (2-3 min)
docker push hackathontodoacr.azurecr.io/todo-backend:latest
docker push hackathontodoacr.azurecr.io/todo-frontend:latest

# 5. Restart deployments
kubectl rollout restart deployment todo-backend -n default
kubectl rollout restart deployment todo-frontend -n default

# 6. Check status
kubectl get pods -n default
```

---

## 🤖 Method 2: Automatic (GitHub Actions)

```bash
# Just push to GitHub - that's it!
git add .
git commit -m "Your update message"
git push origin main

# GitHub automatically:
# ✅ Builds images
# ✅ Pushes to ACR
# ✅ Deploys to AKS
# ✅ Takes 5-10 min
```

---

## 📱 Your App URLs

**Current IP**: http://135.235.178.119:3000

**To get without port**:
- Change service port to 80 in k8s-azure-deploy.yaml
- Then: http://135.235.178.119

**To get custom domain** (mytodoapp.com):
- Option 1: Freenom (free .tk, .ml domains)
- Option 2: Cloudflare Pages (yourname.pages.dev)
- Option 3: GitHub Education Pack (free .me domain for students)

---

## 💰 Daily Routine (SAVE MONEY!)

**End of day**:
```powershell
bash scripts/stop-cluster.sh
```
Saves: $4-5 per day!

**Start of day**:
```powershell
bash scripts/start-cluster.sh
```

**Get URL after restart** (IP might change):
```powershell
kubectl get service todo-frontend-service -n default
```

---

## 🔍 Common Commands

```powershell
# Check if app is running
kubectl get pods -n default

# Get app URL
kubectl get service todo-frontend-service -n default

# View frontend logs
kubectl logs -n default -l component=frontend --tail=50

# View backend logs
kubectl logs -n default -l component=backend --tail=50

# Restart just frontend
kubectl rollout restart deployment todo-frontend -n default

# Restart just backend
kubectl rollout restart deployment todo-backend -n default
```

---

## ❌ Rollback if Update Breaks

```powershell
# See deployment history
kubectl rollout history deployment todo-frontend -n default

# Undo last deployment
kubectl rollout undo deployment todo-frontend -n default

# Go back to specific version
kubectl rollout undo deployment todo-frontend --to-revision=2 -n default
```

---

## 🎯 Your App is Already Accessible Everywhere!

**Test it**:
1. Open phone browser (use mobile data, NOT WiFi)
2. Visit: http://135.235.178.119:3000
3. Works! 🎉

**Share this URL**:
- With judges
- On social media
- In hackathon submission
- Anyone, anywhere can access it!

**Port 3000 does NOT mean "only local"**
- Port is just which service to connect to
- Your app is on the INTERNET, not just your PC!

---

## 📊 Check Costs

```powershell
# View current spending
az consumption usage list --output table

# Set up budget alert
# Go to: https://portal.azure.com
# Search: "Cost Management"
# Create budget: $25/month
# Alert at: 50%, 80%, 100%
```

---

## 🆘 Troubleshooting

**App not loading?**
```powershell
kubectl get pods -n default
# All should show "Running"
```

**500 error?**
```powershell
kubectl logs -n default -l component=backend --tail=100
# Check for error messages
```

**IP changed?**
```powershell
kubectl get service todo-frontend-service -n default
# Get new EXTERNAL-IP
```

---

## 📚 Full Guide

Read: `DEPLOYMENT-UPDATE-GUIDE.md` for complete details!

