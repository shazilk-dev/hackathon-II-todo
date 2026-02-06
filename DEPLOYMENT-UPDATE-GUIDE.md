# 🚀 Complete Guide: Updating Your Cloud Deployment & Sharing Your App

**For Complete Beginners** - Everything you need to know about managing your deployed application

---

## 📚 Table of Contents

1. [Understanding Your Current Deployment](#understanding-your-current-deployment)
2. [How to Update Your Deployed App](#how-to-update-your-deployed-app)
3. [Getting a Custom Domain Name (Free!)](#getting-a-custom-domain-name-free)
4. [Making Your App Accessible Everywhere](#making-your-app-accessible-everywhere)
5. [Sharing Your App with Others](#sharing-your-app-with-others)
6. [Automatic Deployment (CI/CD)](#automatic-deployment-cicd)

---

## 1. Understanding Your Current Deployment

### What You Have Now

**Your Current URL**: `http://135.235.178.119:3000`

Let me break this down:

```
http://135.235.178.119:3000
│      │                 │
│      │                 └─ Port number (where app listens)
│      └─────────────────── IP Address (Azure assigned this)
└────────────────────────── Protocol (http = not encrypted)
```

### Why an IP Address and Not a Domain?

**IP Address** (what you have):
- ✅ Works immediately after deployment
- ✅ Free (included with Azure)
- ✅ Accessible from anywhere in the world
- ❌ Hard to remember (`135.235.178.119:3000`)
- ❌ Changes if you restart cluster
- ❌ Not professional for sharing

**Domain Name** (what you can get):
- ✅ Easy to remember (`mytodoapp.com`)
- ✅ Professional looking
- ✅ Never changes
- ✅ Can get for FREE
- ❌ Requires setup (10-15 minutes)

### Is Your App Only Running on Port 3000?

**No!** Your app is accessible from ANYWHERE in the world, not just your PC.

**Try this test**:
1. Open your phone browser (use mobile data, NOT WiFi)
2. Visit: `http://135.235.178.119:3000`
3. It works! 🎉

**Why port 3000?**
- This is the default port for Next.js applications
- Azure LoadBalancer forwards traffic from the internet to port 3000
- You can change this to port 80 (standard HTTP) if you want

---

## 2. How to Update Your Deployed App

### Method 1: Manual Update (Quick & Simple)

**When to use**: Small changes, testing, learning

**Steps**:

#### Step 1: Make Your Code Changes

Edit your code locally:
```bash
# Example: Edit frontend
code frontend/app/page.tsx

# Example: Edit backend
code backend/src/main.py
```

#### Step 2: Build New Docker Images

```powershell
# Navigate to project
cd F:\PROJECTS\hackathone-II\hackathon-todo

# Build backend
docker build -t hackathontodoacr.azurecr.io/todo-backend:latest ./backend

# Build frontend
docker build -t hackathontodoacr.azurecr.io/todo-frontend:latest ./frontend
```

**Time**: 5-8 minutes (depends on internet speed)

#### Step 3: Push to Azure Container Registry

```powershell
# Login to ACR (if not already logged in)
az acr login --name hackathontodoacr

# Push backend
docker push hackathontodoacr.azurecr.io/todo-backend:latest

# Push frontend
docker push hackathontodoacr.azurecr.io/todo-frontend:latest
```

**Time**: 2-3 minutes

#### Step 4: Restart Deployments in Kubernetes

```powershell
# Restart backend (pulls new image)
kubectl rollout restart deployment todo-backend -n default

# Restart frontend (pulls new image)
kubectl rollout restart deployment todo-frontend -n default
```

**Time**: 30-60 seconds

#### Step 5: Verify Update

```powershell
# Check pod status
kubectl get pods -n default

# Wait for new pods to be Running
# Old pods will show "Terminating"
# New pods will show "Running"
```

**Total Time**: ~10 minutes

---

### Method 2: Automatic Updates (CI/CD Pipeline)

**When to use**: Professional workflow, frequent updates

This automatically rebuilds and deploys when you push code to GitHub!

#### Prerequisites

1. Your code is on GitHub
2. Azure credentials configured
3. GitHub Actions enabled

#### Step 1: Create GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Where to Get Value |
|------------|-------------------|
| `AZURE_CREDENTIALS` | Run: `az ad sp create-for-rbac --name "github-actions-sp" --role contributor --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/hackathon-todo-rg --sdk-auth` |
| `ACR_USERNAME` | Your ACR name: `hackathontodoacr` |
| `ACR_PASSWORD` | Run: `az acr credential show --name hackathontodoacr --query "passwords[0].value" -o tsv` |
| `AKS_CLUSTER_NAME` | `hackathon-todo-dev` |
| `AKS_RESOURCE_GROUP` | `hackathon-todo-rg` |

#### Step 2: Create GitHub Actions Workflow

Create file: `.github/workflows/deploy.yml`

```yaml
name: Build and Deploy to AKS

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

env:
  ACR_NAME: hackathontodoacr
  AKS_CLUSTER: hackathon-todo-dev
  AKS_RESOURCE_GROUP: hackathon-todo-rg

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Login to ACR
      run: |
        az acr login --name ${{ env.ACR_NAME }}

    - name: Build and push backend
      run: |
        docker build -t ${{ env.ACR_NAME }}.azurecr.io/todo-backend:${{ github.sha }} ./backend
        docker build -t ${{ env.ACR_NAME }}.azurecr.io/todo-backend:latest ./backend
        docker push ${{ env.ACR_NAME }}.azurecr.io/todo-backend:${{ github.sha }}
        docker push ${{ env.ACR_NAME }}.azurecr.io/todo-backend:latest

    - name: Build and push frontend
      run: |
        docker build -t ${{ env.ACR_NAME }}.azurecr.io/todo-frontend:${{ github.sha }} ./frontend
        docker build -t ${{ env.ACR_NAME }}.azurecr.io/todo-frontend:latest ./frontend
        docker push ${{ env.ACR_NAME }}.azurecr.io/todo-frontend:${{ github.sha }}
        docker push ${{ env.ACR_NAME }}.azurecr.io/todo-frontend:latest

    - name: Set AKS context
      uses: azure/aks-set-context@v3
      with:
        resource-group: ${{ env.AKS_RESOURCE_GROUP }}
        cluster-name: ${{ env.AKS_CLUSTER }}

    - name: Deploy to AKS
      run: |
        kubectl rollout restart deployment todo-backend -n default
        kubectl rollout restart deployment todo-frontend -n default
        kubectl rollout status deployment todo-backend -n default
        kubectl rollout status deployment todo-frontend -n default

    - name: Get service URL
      run: |
        kubectl get service todo-frontend-service -n default
```

#### Step 3: Push Code to GitHub

```bash
# Make your changes
git add .
git commit -m "Update: your changes description"
git push origin main
```

**GitHub Actions will automatically**:
1. ✅ Build Docker images
2. ✅ Push to Azure Container Registry
3. ✅ Deploy to AKS
4. ✅ Notify you of success/failure

**Time**: ~5-10 minutes (hands-free!)

---

## 3. Getting a Custom Domain Name (Free!)

### Why You Need a Domain

**Current**: `http://135.235.178.119:3000` 😞
**With Domain**: `https://mytodoapp.com` 😍

### Option 1: Free Subdomain (Easiest)

#### Using Cloudflare (Recommended)

**What you get**: `yourusername.pages.dev` or similar

**Steps**:

1. **Sign up for Cloudflare** (FREE)
   - Go to: https://www.cloudflare.com/
   - Click "Sign Up"
   - Email: Your email
   - Password: Strong password

2. **Use Cloudflare Tunnel** (Maps your IP to a domain)

   ```bash
   # Install cloudflared
   # Windows:
   winget install Cloudflare.cloudflared

   # Login to Cloudflare
   cloudflared login

   # Create tunnel
   cloudflared tunnel create hackathon-todo

   # Configure tunnel
   cloudflared tunnel route dns hackathon-todo mytodoapp.yourdomain.dev

   # Run tunnel (maps to your Azure IP)
   cloudflared tunnel run --url http://135.235.178.119:3000 hackathon-todo
   ```

3. **Result**: Your app is now at `mytodoapp.yourdomain.dev`

**Pros**:
- ✅ 100% Free
- ✅ HTTPS included (secure!)
- ✅ Setup in 10 minutes
- ✅ No credit card needed

**Cons**:
- ⚠️ Subdomain (not custom)
- ⚠️ Cloudflare branding

---

### Option 2: Free Custom Domain

#### Using Freenom (Free .tk, .ml, .ga domains)

**What you get**: `mytodoapp.tk` (your own domain!)

**Steps**:

1. **Go to Freenom**
   - Visit: https://www.freenom.com/
   - Search for your desired domain: `mytodoapp`
   - Select `.tk`, `.ml`, or `.ga` (FREE for 12 months)
   - Click "Get it now"

2. **Register** (No credit card required)
   - Use for: 12 months (FREE)
   - Click "Continue"
   - Enter your email
   - Complete registration

3. **Configure DNS**

   In Freenom Dashboard:
   ```
   Type: A Record
   Name: @
   Target: 135.235.178.119
   TTL: 14400

   Type: A Record
   Name: www
   Target: 135.235.178.119
   TTL: 14400
   ```

4. **Wait 10-30 minutes** for DNS to propagate

5. **Test**: Visit `http://mytodoapp.tk:3000`

**Pros**:
- ✅ Your own custom domain
- ✅ Free for 1 year
- ✅ No credit card needed
- ✅ Easy to set up

**Cons**:
- ⚠️ Need to renew every year
- ⚠️ No HTTPS (need Cloudflare)
- ⚠️ Some TLDs may be blocked in certain countries

---

### Option 3: Free Domain from GitHub Education

**If you're a student**:

1. **Apply for GitHub Student Developer Pack**
   - Go to: https://education.github.com/pack
   - Verify student status (need university email or ID)

2. **Get Free Domain from Namecheap**
   - Included: 1 year `.me` domain (worth $18.99)
   - Choose your domain: `yourname.me`

3. **Configure DNS** (same as Option 2)

**Pros**:
- ✅ Professional TLD (`.me`)
- ✅ Free for 1 year
- ✅ Includes other dev tools (GitHub Pro, Azure, AWS credits)

**Cons**:
- ⚠️ Student verification required
- ⚠️ Must renew after 1 year ($18.99/year)

---

### Option 4: Remove Port 3000 from URL

**Current**: `http://mytodoapp.tk:3000`
**Goal**: `http://mytodoapp.tk`

#### Change LoadBalancer to Port 80

Edit `k8s-azure-deploy.yaml`:

```yaml
# Find the frontend service
apiVersion: v1
kind: Service
metadata:
  name: todo-frontend-service
spec:
  type: LoadBalancer
  ports:
    - port: 80          # CHANGE: External port (no :3000 needed!)
      targetPort: 3000  # Keep: Internal container port
      protocol: TCP
      name: http
```

Apply changes:
```powershell
kubectl apply -f k8s-azure-deploy.yaml
kubectl get service todo-frontend-service -n default
```

**Result**: Access at `http://135.235.178.119` or `http://mytodoapp.tk`

---

## 4. Making Your App Accessible Everywhere

### Current Status: ✅ Already Accessible!

Your app is **already accessible from anywhere in the world**! Here's why:

1. **Azure LoadBalancer**:
   - Public IP: `135.235.178.119`
   - Accessible from: Anywhere with internet
   - No VPN or special setup needed

2. **Test from Different Devices**:
   ```
   ✅ Your laptop: http://135.235.178.119:3000
   ✅ Your phone: http://135.235.178.119:3000
   ✅ Friend's computer: http://135.235.178.119:3000
   ✅ Anywhere in world: http://135.235.178.119:3000
   ```

3. **Share this URL**:
   - Email it
   - Text it
   - Post on social media
   - Add to hackathon submission
   - **Anyone can access it immediately!**

### What "Running on Port 3000" Means

**Misconception**: "Port 3000 means only local"

**Reality**: Port number has nothing to do with accessibility!

```
Local development:
http://localhost:3000    ← Only on your PC

Cloud deployment:
http://135.235.178.119:3000   ← Accessible EVERYWHERE!
```

The port (`:3000`) just tells the browser which service to connect to on that IP address.

---

## 5. Sharing Your App with Others

### For Hackathon Judges

**Create a Professional Presentation**:

```markdown
# My Todo App

**Live Demo**: http://135.235.178.119:3000
**GitHub**: https://github.com/yourusername/hackathon-todo

## Test Account
- Email: demo@example.com
- Password: Demo123!

## Features
- ✅ Task management (CRUD)
- ✅ User authentication
- ✅ Cloud deployment (Azure AKS)
- ✅ Auto-scaling (2-5 pods)
- ✅ Production-ready architecture

## Tech Stack
- Frontend: Next.js 16 (TypeScript)
- Backend: FastAPI (Python)
- Database: Neon PostgreSQL
- Infrastructure: Kubernetes (Azure AKS)
- CI/CD: GitHub Actions
```

### For Portfolio/Resume

**Create a Short URL** (easier to share):

1. **Use Bitly** (Free)
   - Go to: https://bitly.com/
   - Paste: `http://135.235.178.119:3000`
   - Get: `https://bit.ly/my-todo-app`

2. **Use TinyURL** (Free)
   - Go to: https://tinyurl.com/
   - Create: `https://tinyurl.com/johns-todo-app`

### QR Code for Mobile Demo

**Generate QR Code**:
1. Go to: https://www.qr-code-generator.com/
2. Enter URL: `http://135.235.178.119:3000`
3. Download QR code image
4. Print on business cards or presentation slides

**People can scan with phone camera → instant access!**

---

## 6. Automatic Deployment (CI/CD)

### What is CI/CD?

**CI** (Continuous Integration):
- Automatically test code when you push to GitHub

**CD** (Continuous Deployment):
- Automatically deploy to Azure when tests pass

### Benefits

**Without CI/CD** (Manual):
```
1. Make code changes
2. Build Docker images (5 min)
3. Push to ACR (2 min)
4. Update Kubernetes (1 min)
5. Verify deployment (2 min)
───────────────────────────
Total: 10 minutes, hands-on
```

**With CI/CD** (Automatic):
```
1. Make code changes
2. git push
───────────────────────────
Total: 10 seconds, hands-free!
(GitHub does everything else)
```

### Setting Up GitHub Actions (Step-by-Step)

#### Step 1: Get Azure Credentials

```powershell
# Get your subscription ID
az account show --query id -o tsv

# Create service principal for GitHub
az ad sp create-for-rbac \
  --name "github-actions-hackathon-todo" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/hackathon-todo-rg \
  --sdk-auth
```

**Copy the entire JSON output** (you'll need this):

```json
{
  "clientId": "xxx",
  "clientSecret": "xxx",
  "subscriptionId": "xxx",
  "tenantId": "xxx",
  ...
}
```

#### Step 2: Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click: **Settings** → **Secrets and variables** → **Actions**
3. Click: **New repository secret**
4. Add these secrets:

| Name | Value |
|------|-------|
| `AZURE_CREDENTIALS` | Paste the JSON from Step 1 |
| `ACR_NAME` | `hackathontodoacr` |
| `ACR_USERNAME` | `hackathontodoacr` |
| `ACR_PASSWORD` | Run: `az acr credential show --name hackathontodoacr --query "passwords[0].value" -o tsv` |

#### Step 3: Create Workflow File

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure AKS

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Azure Login
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Build Backend
      run: |
        docker build -t ${{ secrets.ACR_NAME }}.azurecr.io/todo-backend:${{ github.sha }} ./backend
        docker build -t ${{ secrets.ACR_NAME }}.azurecr.io/todo-backend:latest ./backend

    - name: Build Frontend
      run: |
        docker build -t ${{ secrets.ACR_NAME }}.azurecr.io/todo-frontend:${{ github.sha }} ./frontend
        docker build -t ${{ secrets.ACR_NAME }}.azurecr.io/todo-frontend:latest ./frontend

    - name: Push to ACR
      run: |
        az acr login --name ${{ secrets.ACR_NAME }}
        docker push ${{ secrets.ACR_NAME }}.azurecr.io/todo-backend:${{ github.sha }}
        docker push ${{ secrets.ACR_NAME }}.azurecr.io/todo-backend:latest
        docker push ${{ secrets.ACR_NAME }}.azurecr.io/todo-frontend:${{ github.sha }}
        docker push ${{ secrets.ACR_NAME }}.azurecr.io/todo-frontend:latest

    - name: Set K8s Context
      uses: azure/aks-set-context@v3
      with:
        resource-group: hackathon-todo-rg
        cluster-name: hackathon-todo-dev

    - name: Deploy to AKS
      run: |
        kubectl rollout restart deployment todo-backend -n default
        kubectl rollout restart deployment todo-frontend -n default
        kubectl rollout status deployment/todo-backend -n default --timeout=5m
        kubectl rollout status deployment/todo-frontend -n default --timeout=5m

    - name: Get URL
      run: |
        echo "Application URL:"
        kubectl get service todo-frontend-service -n default -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

#### Step 4: Test Automatic Deployment

```bash
# Make a small change
echo "# Updated" >> README.md

# Commit and push
git add .
git commit -m "Test automatic deployment"
git push origin main
```

**Watch GitHub Actions**:
1. Go to your repo → **Actions** tab
2. See your workflow running
3. Wait 5-10 minutes
4. ✅ Deployment complete!

---

## 7. Best Practices & Tips

### Cost Management

**CRITICAL**: Always stop cluster when not using!

```powershell
# End of day
bash scripts/stop-cluster.sh

# Next morning
bash scripts/start-cluster.sh
```

**Savings**: $120-180/year (70-80% cost reduction!)

### Version Control

**Use Git Tags for Releases**:

```bash
# Tag a stable version
git tag -a v1.0.0 -m "Hackathon submission version"
git push origin v1.0.0

# Deploy specific version
docker build -t hackathontodoacr.azurecr.io/todo-frontend:v1.0.0 ./frontend
docker push hackathontodoacr.azurecr.io/todo-frontend:v1.0.0
```

### Monitoring

**Check deployment status anytime**:

```powershell
# Pod status
kubectl get pods -n default

# Service URL
kubectl get service todo-frontend-service -n default

# Recent logs
kubectl logs -n default -l app=todo-chatbot --tail=50
```

### Rollback if Something Breaks

```powershell
# List deployment history
kubectl rollout history deployment todo-frontend -n default

# Rollback to previous version
kubectl rollout undo deployment todo-frontend -n default

# Rollback to specific revision
kubectl rollout undo deployment todo-frontend --to-revision=2 -n default
```

---

## 8. Common Questions Answered

### Q: Why does my IP change when I restart the cluster?

**A**: Azure assigns a new public IP each time. Solutions:
1. Use a custom domain (maps to any IP)
2. Reserve a static IP (costs $3-5/month)
3. Use Cloudflare Tunnel (always same domain)

### Q: Can I remove the `:3000` from the URL?

**A**: Yes! Change LoadBalancer port from 3000 to 80:

```yaml
service:
  type: LoadBalancer
  ports:
    - port: 80        # External port
      targetPort: 3000  # Container port
```

Then access at: `http://135.235.178.119`

### Q: How do I add HTTPS (secure connection)?

**A**: Use Cloudflare (free HTTPS) or Let's Encrypt:

**Option 1: Cloudflare (Easiest)**
1. Add your domain to Cloudflare
2. Enable "Always Use HTTPS"
3. Done! 🎉

**Option 2: Let's Encrypt (Advanced)**
```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
# (Configuration file needed)

# Create Certificate
# (Configuration file needed)
```

### Q: How much does this cost per month?

**Current setup**:
- Running 24/7: ~$15-20/month
- With daily stop/start: ~$8-10/month
- Your $100 credit lasts: 10 months

**To reduce costs further**:
- Use spot instances (50% cheaper)
- Reduce node size (B1s instead of B2s)
- Delete unused resources

---

## 9. Quick Reference Commands

### Daily Operations

```powershell
# Check app status
kubectl get pods -n default

# Get app URL
kubectl get service todo-frontend-service -n default

# View logs
kubectl logs -n default -l component=frontend --tail=50

# Restart app
kubectl rollout restart deployment todo-frontend -n default
```

### Update Deployment

```powershell
# Quick update (manual)
docker build -t hackathontodoacr.azurecr.io/todo-frontend:latest ./frontend
docker push hackathontodoacr.azurecr.io/todo-frontend:latest
kubectl rollout restart deployment todo-frontend -n default

# Or just push to GitHub (if CI/CD enabled)
git push origin main
```

### Cost Management

```powershell
# Stop cluster (save money!)
bash scripts/stop-cluster.sh

# Start cluster
bash scripts/start-cluster.sh

# Check spending
az consumption usage list --output table
```

---

## 10. Next Steps

### For Your Hackathon

- [ ] Get a custom domain (Freenom or Cloudflare)
- [ ] Set up CI/CD (GitHub Actions)
- [ ] Create demo account for judges
- [ ] Take screenshots for presentation
- [ ] Write deployment documentation
- [ ] Test from different devices
- [ ] Share URL with team/judges

### For Learning

- [ ] Read Kubernetes docs: https://kubernetes.io/docs/
- [ ] Learn Docker best practices
- [ ] Explore GitHub Actions
- [ ] Try other cloud providers (AWS, GCP)

### For Production

- [ ] Add HTTPS (SSL/TLS)
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure backups
- [ ] Add logging aggregation
- [ ] Implement security scanning
- [ ] Create disaster recovery plan

---

## 📞 Need Help?

**Documentation**:
- [Kubernetes Official Docs](https://kubernetes.io/docs/)
- [Azure AKS Docs](https://docs.microsoft.com/azure/aks/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GitHub Actions Docs](https://docs.github.com/actions)

**Common Issues**:
- Check `kubectl get pods` for pod status
- Check `kubectl logs` for error messages
- Verify secrets: `kubectl get secrets -n default`
- Check Azure costs: Cost Management in Azure Portal

---

## ✨ Summary

**What You Learned**:
✅ How to update deployed applications
✅ Understanding IP addresses vs domains
✅ Getting free domain names
✅ Your app is already accessible worldwide
✅ Setting up automatic deployments
✅ Sharing your app professionally

**Your App Status**:
- 🌐 **Accessible from**: Anywhere in the world
- 🔗 **Current URL**: http://135.235.178.119:3000
- 💰 **Cost**: ~$10/month with stop/start
- 🚀 **Deployment**: Azure Kubernetes Service
- ⚡ **Update time**: 10 seconds (with CI/CD)

**Remember**: Your app is already LIVE and accessible from anywhere - you can share that IP address with anyone right now! Adding a domain name just makes it prettier and easier to remember. 😊

---

**Happy Deploying!** 🎉

