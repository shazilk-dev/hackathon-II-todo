# 🚀 Complete Cloud Deployment Guide - Everything You Need

**For Complete Beginners** - From deployment to custom domain to updates

---

## 📚 Table of Contents

1. [Understanding Your Deployment](#1-understanding-your-deployment)
2. [How to Update Your Code](#2-how-to-update-your-code)
3. [How to Update Environment Variables](#3-how-to-update-environment-variables)
4. [Remove Port Number from URL](#4-remove-port-number-from-url)
5. [Get a Custom Domain (Free)](#5-get-a-custom-domain-free)
6. [Complete Domain Setup Guide](#6-complete-domain-setup-guide)
7. [Automatic Deployment Setup](#7-automatic-deployment-setup)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Understanding Your Deployment

### Where is Everything Running?

**Your Current Setup**:

```
┌─────────────────────────────────────────────────────────────┐
│                     AZURE CLOUD                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Azure Kubernetes Service (AKS)                      │  │
│  │   Cluster: hackathon-todo-dev                        │  │
│  │                                                        │  │
│  │   ┌──────────────┐      ┌──────────────┐            │  │
│  │   │  Frontend    │      │   Backend    │            │  │
│  │   │  (Next.js)   │◄────►│  (FastAPI)   │            │  │
│  │   │  2 pods      │      │   2 pods     │            │  │
│  │   └──────┬───────┘      └──────┬───────┘            │  │
│  │          │                     │                      │  │
│  │          │                     │                      │  │
│  │   ┌──────▼─────────────────────▼──────────────────┐ │  │
│  │   │    Azure LoadBalancer                         │ │  │
│  │   │    Public IP: 135.235.178.119                │ │  │
│  │   │    Port: 3000 → Frontend                     │ │  │
│  │   └───────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Azure Container Registry (ACR)                      │  │
│  │   Name: hackathontodoacr.azurecr.io                  │  │
│  │   - todo-backend:latest (your backend image)         │  │
│  │   - todo-frontend:latest (your frontend image)       │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                                │
│                                                               │
│  ┌──────────────────┐                                        │
│  │ Neon PostgreSQL  │  (Database - Managed Service)          │
│  │ Your data here   │                                        │
│  └──────────────────┘                                        │
└──────────────────────────────────────────────────────────────┘
```

### What's Running Where?

| Component | Location | Number | Accessible From |
|-----------|----------|--------|-----------------|
| **Frontend** | Azure AKS | 2 pods | Public IP (LoadBalancer) |
| **Backend** | Azure AKS | 2 pods | Internal only (Frontend calls it) |
| **Database** | Neon Cloud | 1 instance | Both Frontend & Backend connect |
| **Docker Images** | Azure ACR | 2 images | Kubernetes pulls from here |

### Your Current URLs

**Public Access** (anyone can visit):
```
http://135.235.178.119:3000  → Your Frontend App
```

**Internal Only** (only works inside Kubernetes):
```
http://todo-backend-service:8000  → Backend API
```

**Database** (only works with connection string):
```
postgresql://...@ep-dark-sky-a13pc5ob-pooler.ap-southeast-1.aws.neon.tech/neondb
```

### Is Your App Really Accessible Everywhere?

**YES! 100% Accessible from anywhere in the world!**

**Test it now**:
1. Open your phone (use mobile data, NOT WiFi)
2. Visit: `http://135.235.178.119:3000`
3. It works! 🎉

**The `:3000` doesn't mean "local"**:
- ❌ **Wrong**: Port 3000 = only on my computer
- ✅ **Correct**: Port 3000 = which service to connect to on that IP

**Think of it like an apartment building**:
- `135.235.178.119` = The building address
- `:3000` = Apartment number 3000
- Anyone can visit this building and knock on apartment 3000!

---

## 2. How to Update Your Code

### When You Make Code Changes (Frontend or Backend)

**Scenario**: You edited some code and want to deploy the update to Azure.

### Method 1: Manual Update (Step-by-Step)

**Time**: ~10 minutes

#### Step 1: Build New Docker Images

Open PowerShell in your project folder:

```powershell
# Navigate to project
cd F:\PROJECTS\hackathone-II\hackathon-todo

# Build backend (if you changed backend code)
docker build -t hackathontodoacr.azurecr.io/todo-backend:latest ./backend

# Build frontend (if you changed frontend code)
docker build -t hackathontodoacr.azurecr.io/todo-frontend:latest ./frontend
```

**What this does**: Creates new container images with your latest code

**Time**: 5-8 minutes (depends on internet and changes)

#### Step 2: Login to Azure Container Registry

```powershell
az acr login --name hackathontodoacr
```

**Expected output**:
```
Login Succeeded
```

#### Step 3: Push Images to Azure

```powershell
# Push backend
docker push hackathontodoacr.azurecr.io/todo-backend:latest

# Push frontend
docker push hackathontodoacr.azurecr.io/todo-frontend:latest
```

**What this does**: Uploads your new images to Azure

**Time**: 2-3 minutes

#### Step 4: Restart Deployments

```powershell
# Restart backend (pulls new image from ACR)
kubectl rollout restart deployment todo-backend -n default

# Restart frontend (pulls new image from ACR)
kubectl rollout restart deployment todo-frontend -n default
```

**What this does**:
- Kubernetes pulls the new images from ACR
- Creates new pods with updated code
- Gradually replaces old pods with new ones (zero downtime!)

#### Step 5: Verify Update

```powershell
# Check pod status
kubectl get pods -n default

# Expected output:
# NAME                             READY   STATUS    RESTARTS   AGE
# todo-backend-xxxxxxxxx-xxxxx     1/1     Running   0          30s (new pod)
# todo-frontend-xxxxxxxxx-xxxxx    1/1     Running   0          30s (new pod)
```

**Test your app**: Visit `http://135.235.178.119:3000` and verify your changes!

---

### Method 2: Automatic Updates (GitHub Actions)

**Time**: 10 seconds (hands-free!)

#### Prerequisites Setup (One-time)

See Section 7 for complete GitHub Actions setup.

#### Daily Usage

```bash
# 1. Make your code changes
# (edit files in VS Code)

# 2. Commit and push
git add .
git commit -m "Updated feature XYZ"
git push origin main

# 3. Done! GitHub automatically:
# ✅ Builds Docker images
# ✅ Pushes to ACR
# ✅ Deploys to AKS
# ✅ Notifies you when done (5-10 min)
```

**Watch progress**:
1. Go to your GitHub repository
2. Click "Actions" tab
3. See your workflow running live!

---

## 3. How to Update Environment Variables

### Understanding Environment Variables

**What are they?**
- Configuration settings for your app
- Stored as Kubernetes Secrets
- Examples: Database URL, API keys, auth secrets

**Current secrets in your deployment**:
1. `database-credentials` - Database connection
2. `frontend-database-credentials` - Frontend DB (special format)
3. `auth-credentials` - JWT/Auth secrets
4. `openai-credentials` - OpenAI API key
5. `redpanda-credentials` - Kafka credentials

### Scenario 1: Update Existing Environment Variable

**Example**: You got a new OpenAI API key

#### Step 1: Update the Secret

```powershell
# Delete the old secret
kubectl delete secret openai-credentials -n default

# Create new secret with updated value
kubectl create secret generic openai-credentials \
  --from-literal=api-key='sk-proj-YOUR_NEW_API_KEY_HERE' \
  -n default
```

#### Step 2: Restart Deployments

```powershell
# Restart backend to pick up new secret
kubectl rollout restart deployment todo-backend -n default

# Restart frontend if it uses this secret
kubectl rollout restart deployment todo-frontend -n default
```

#### Step 3: Verify

```powershell
# Check pods are running
kubectl get pods -n default

# Check logs to ensure no errors
kubectl logs -n default -l component=backend --tail=50
```

---

### Scenario 2: Add New Environment Variable

**Example**: You want to add a new `FEATURE_FLAG` variable

#### Step 1: Create the Secret (if needed)

```powershell
# Create a new secret
kubectl create secret generic feature-flags \
  --from-literal=enable-chat='true' \
  --from-literal=enable-notifications='false' \
  -n default
```

#### Step 2: Update Deployment YAML

Edit `k8s-azure-deploy.yaml` and add the new environment variable:

```yaml
# In the backend container section, add:
env:
  - name: FEATURE_FLAG_CHAT
    valueFrom:
      secretKeyRef:
        name: feature-flags
        key: enable-chat
```

#### Step 3: Apply Changes

```powershell
kubectl apply -f k8s-azure-deploy.yaml
```

**Kubernetes will automatically**:
- Create new pods with the new environment variable
- Replace old pods gradually

---

### Scenario 3: Update Database URL

**Example**: You migrated to a new Neon database

#### Step 1: Update Backend Database Secret

```powershell
# Delete old secret
kubectl delete secret database-credentials -n default

# Create new secret with new database URL
kubectl create secret generic database-credentials \
  --from-literal=database-url='postgresql+asyncpg://NEW_USER:NEW_PASSWORD@NEW_HOST.neon.tech/neondb?ssl=require' \
  --from-literal=connection-string='postgresql+asyncpg://NEW_USER:NEW_PASSWORD@NEW_HOST.neon.tech/neondb?ssl=require' \
  -n default \
  --dry-run=client -o yaml | kubectl apply -f -
```

#### Step 2: Update Frontend Database Secret

**IMPORTANT**: Frontend needs standard PostgreSQL format (without +asyncpg)

```powershell
# Delete old frontend secret
kubectl delete secret frontend-database-credentials -n default

# Create new secret (note: no +asyncpg)
kubectl create secret generic frontend-database-credentials \
  --from-literal=database-url='postgresql://NEW_USER:NEW_PASSWORD@NEW_HOST.neon.tech/neondb?ssl=require' \
  -n default
```

#### Step 3: Restart Everything

```powershell
kubectl rollout restart deployment todo-backend -n default
kubectl rollout restart deployment todo-frontend -n default

# Wait for pods to be ready
kubectl rollout status deployment/todo-backend -n default
kubectl rollout status deployment/todo-frontend -n default
```

---

### Scenario 4: Update Multiple Secrets at Once

**Example**: You want to update auth secret, database, and API key

#### Create a secrets file: `secrets-update.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: database-credentials
  namespace: default
type: Opaque
stringData:
  database-url: "postgresql+asyncpg://user:pass@host.neon.tech/db?ssl=require"
  connection-string: "postgresql+asyncpg://user:pass@host.neon.tech/db?ssl=require"
---
apiVersion: v1
kind: Secret
metadata:
  name: auth-credentials
  namespace: default
type: Opaque
stringData:
  secret: "your-new-32-character-secret-here"
  better-auth-secret: "your-new-32-character-secret-here"
---
apiVersion: v1
kind: Secret
metadata:
  name: openai-credentials
  namespace: default
type: Opaque
stringData:
  api-key: "sk-proj-your-new-openai-key"
```

#### Apply all at once

```powershell
kubectl apply -f secrets-update.yaml

# Restart deployments
kubectl rollout restart deployment todo-backend -n default
kubectl rollout restart deployment todo-frontend -n default
```

---

### Quick Reference: Common Secret Updates

```powershell
# List all secrets
kubectl get secrets -n default

# View secret (base64 encoded)
kubectl get secret database-credentials -n default -o yaml

# Decode secret to see actual value
kubectl get secret database-credentials -n default -o jsonpath='{.data.database-url}' | base64 -d

# Delete secret
kubectl delete secret SECRET_NAME -n default

# Create secret from literal
kubectl create secret generic SECRET_NAME \
  --from-literal=key='value' \
  -n default

# Create secret from file
kubectl create secret generic SECRET_NAME \
  --from-file=config.json \
  -n default

# Update secret (delete and recreate)
kubectl delete secret SECRET_NAME -n default
kubectl create secret generic SECRET_NAME --from-literal=key='newvalue' -n default
kubectl rollout restart deployment todo-backend -n default
```

---

## 4. Remove Port Number from URL

### Goal: Change from `http://135.235.178.119:3000` to `http://135.235.178.119`

### Why?

**Current**: `http://135.235.178.119:3000` 😐
- Looks technical
- Hard to remember
- Not professional

**After**: `http://135.235.178.119` 😊
- Cleaner URL
- Standard HTTP (no port needed)
- Professional

### How to Do It

#### Step 1: Edit the Deployment File

Open `k8s-azure-deploy.yaml` and find the frontend service section:

**Before**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: todo-frontend-service
  namespace: default
spec:
  type: LoadBalancer
  ports:
    - port: 3000        # ← External port (what users see in URL)
      targetPort: 3000  # ← Container port (where Next.js runs)
      protocol: TCP
      name: http
```

**After**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: todo-frontend-service
  namespace: default
spec:
  type: LoadBalancer
  ports:
    - port: 80          # ← Change to 80 (standard HTTP)
      targetPort: 3000  # ← Keep as 3000 (Next.js still runs on 3000)
      protocol: TCP
      name: http
```

**What changed?**
- `port: 80` = External port (what people access from internet)
- `targetPort: 3000` = Internal port (where your app actually runs)

**Think of it like a hotel reception**:
- Port 80 = Front desk (public entrance)
- Port 3000 = Your room number (internal)
- Reception redirects visitors to your room!

#### Step 2: Apply the Change

```powershell
kubectl apply -f k8s-azure-deploy.yaml
```

**Output**:
```
service/todo-frontend-service configured
```

#### Step 3: Verify the Change

```powershell
# Check service (may take 1-2 minutes)
kubectl get service todo-frontend-service -n default
```

**You'll see**:
```
NAME                    TYPE           EXTERNAL-IP       PORT(S)        AGE
todo-frontend-service   LoadBalancer   135.235.178.119   80:xxxxx/TCP   2h
```

**Notice**: `80:xxxxx` (port 80 is now external!)

#### Step 4: Test

Open browser and visit:
- ✅ `http://135.235.178.119` (no :3000!)
- ❌ `http://135.235.178.119:3000` (old URL still works too)

---

## 5. Get a Custom Domain (Free)

### Why Get a Domain?

**Current**: `http://135.235.178.119` 😐
**With Domain**: `http://mytodoapp.com` 😍

**Benefits**:
- ✅ Easy to remember
- ✅ Professional looking
- ✅ Never changes (even if IP changes)
- ✅ Better for sharing
- ✅ Better for portfolio/resume

### Option 1: Freenom (Free .tk, .ml, .ga domains)

**Best for**: Hackathons, testing, learning

**Cost**: FREE for 12 months

#### Step 1: Register Domain

1. Go to: https://www.freenom.com/
2. Search for your desired name: `mytodoapp`
3. Select available extension (`.tk`, `.ml`, `.ga`, `.cf`, `.gq`)
4. Click "Get it now"
5. Click "Checkout"
6. Select "12 Months @ FREE"
7. Enter your email
8. Create account (no credit card needed!)
9. Complete registration

**You now have**: `mytodoapp.tk` (or similar)

#### Step 2: Configure DNS

1. Go to: Freenom Dashboard → My Domains
2. Click "Manage Domain"
3. Go to "Manage Freenom DNS"
4. Add these records:

```
Type: A
Name: (leave empty or @)
Target: 135.235.178.119
TTL: 14400

Type: A
Name: www
Target: 135.235.178.119
TTL: 14400
```

5. Click "Save Changes"

#### Step 3: Wait for DNS Propagation

**Time**: 10-30 minutes (sometimes up to 24 hours)

**Check if ready**:
```powershell
# Check DNS propagation
nslookup mytodoapp.tk

# Expected output:
# Name:    mytodoapp.tk
# Address: 135.235.178.119
```

#### Step 4: Test Your Domain

Visit: `http://mytodoapp.tk`

**It works!** 🎉

**Important Notes**:
- ✅ Completely FREE for 1 year
- ⚠️ Must renew every year (still free)
- ⚠️ Some countries may block certain TLDs
- ⚠️ No HTTPS yet (see next section for free SSL)

---

### Option 2: Cloudflare Pages (yourname.pages.dev)

**Best for**: Quick demos, presentations

**Cost**: FREE forever

**What you get**: `yourname.pages.dev` subdomain

#### Step 1: Sign Up

1. Go to: https://www.cloudflare.com/
2. Click "Sign Up"
3. Enter email and password
4. Verify email

#### Step 2: Install Cloudflared

**Windows**:
```powershell
winget install Cloudflare.cloudflared
```

**Verify**:
```powershell
cloudflared --version
```

#### Step 3: Login and Create Tunnel

```powershell
# Login to Cloudflare
cloudflared login
# This opens browser - click "Authorize"

# Create a tunnel
cloudflared tunnel create hackathon-todo
# Copy the Tunnel ID shown

# Create config file
notepad C:\Users\YOUR_USERNAME\.cloudflared\config.yml
```

**Add this content**:
```yaml
tunnel: TUNNEL_ID_HERE
credentials-file: C:\Users\YOUR_USERNAME\.cloudflared\TUNNEL_ID.json

ingress:
  - hostname: mytodoapp.pages.dev
    service: http://135.235.178.119
  - service: http_status:404
```

#### Step 4: Route DNS

```powershell
cloudflared tunnel route dns hackathon-todo mytodoapp.pages.dev
```

#### Step 5: Run Tunnel

```powershell
cloudflared tunnel run hackathon-todo
```

**Your app is now at**: `https://mytodoapp.pages.dev` (with HTTPS! 🔒)

**Pros**:
- ✅ FREE forever
- ✅ HTTPS included
- ✅ Fast setup (10 minutes)
- ✅ Cloudflare's global CDN

**Cons**:
- ⚠️ Must run cloudflared tunnel (can run on Azure VM)
- ⚠️ Subdomain (not custom TLD)

---

### Option 3: GitHub Student Developer Pack (Free .me domain)

**Best for**: Students, long-term projects

**Cost**: FREE for 1 year (from Namecheap)

**Requirements**: Valid student email or ID

#### Step 1: Apply for GitHub Student Pack

1. Go to: https://education.github.com/pack
2. Click "Get your pack"
3. Verify student status:
   - University email (e.g., yourname@university.edu)
   - OR upload student ID
4. Wait for approval (usually instant, sometimes 1-2 days)

#### Step 2: Claim Namecheap Offer

1. In your Student Pack benefits
2. Find "Namecheap" (1 year free .me domain + SSL)
3. Click "Get access to Namecheap"
4. Register domain: `yourname.me`

#### Step 3: Configure DNS

1. In Namecheap Dashboard
2. Go to "Domain List" → Manage
3. Advanced DNS → Add Records:

```
Type: A Record
Host: @
Value: 135.235.178.119
TTL: Automatic

Type: A Record
Host: www
Value: 135.235.178.119
TTL: Automatic
```

4. Save changes

#### Step 4: Wait and Test

**Wait**: 30 minutes to 24 hours for DNS propagation

**Test**: `http://yourname.me`

**Pros**:
- ✅ Professional TLD (`.me`)
- ✅ Free for 1 year
- ✅ Includes free SSL certificate
- ✅ Reputable registrar (Namecheap)

**Cons**:
- ⚠️ Student verification required
- ⚠️ Must renew after 1 year (~$18.99/year)

---

## 6. Complete Domain Setup Guide

### Step-by-Step: From IP to Custom Domain with HTTPS

**Goal**: Go from `http://135.235.178.119:3000` to `https://mytodoapp.com`

### Step 1: Remove Port (5 minutes)

Follow Section 4 to change port 3000 → 80

**Result**: `http://135.235.178.119`

### Step 2: Get Free Domain (15 minutes)

Follow Section 5 to get domain from Freenom

**Result**: `http://mytodoapp.tk`

### Step 3: Add HTTPS (Free SSL) (15 minutes)

**Using Cloudflare (Recommended)**

#### A. Add Site to Cloudflare

1. Go to: https://dash.cloudflare.com
2. Click "Add a Site"
3. Enter: `mytodoapp.tk`
4. Select "Free Plan"
5. Click "Add Site"

#### B. Update Nameservers at Freenom

Cloudflare will show you 2 nameservers like:
```
dominic.ns.cloudflare.com
luna.ns.cloudflare.com
```

1. Go to Freenom Dashboard
2. My Domains → Manage Domain
3. Management Tools → Nameservers
4. Select "Use custom nameservers"
5. Enter the 2 Cloudflare nameservers
6. Click "Change Nameservers"

**Wait**: 10-30 minutes for nameserver change

#### C. Configure DNS in Cloudflare

1. Go to Cloudflare Dashboard → DNS
2. Add A Record:
   ```
   Type: A
   Name: @
   IPv4 address: 135.235.178.119
   Proxy status: Proxied (orange cloud)
   ```
3. Add A Record for www:
   ```
   Type: A
   Name: www
   IPv4 address: 135.235.178.119
   Proxy status: Proxied (orange cloud)
   ```

#### D. Enable HTTPS

1. Go to SSL/TLS → Overview
2. Select "Flexible" SSL mode
3. Go to SSL/TLS → Edge Certificates
4. Enable "Always Use HTTPS"
5. Enable "Automatic HTTPS Rewrites"

**Wait**: 5-10 minutes

**Test**: Visit `https://mytodoapp.tk` 🔒

---

### Alternative: Using Let's Encrypt (Advanced)

**For those who want direct HTTPS on Azure**

#### Prerequisites

- Domain pointed to your Azure IP
- kubectl access to your cluster

#### Install cert-manager

```powershell
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for it to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=90s
```

#### Create ClusterIssuer

Create file: `letsencrypt-issuer.yaml`

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

Apply:
```powershell
kubectl apply -f letsencrypt-issuer.yaml
```

#### Install Nginx Ingress Controller

```powershell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.0/deploy/static/provider/cloud/deploy.yaml
```

#### Create Ingress with TLS

Create file: `ingress-tls.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: todo-app-ingress
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - mytodoapp.tk
    - www.mytodoapp.tk
    secretName: todo-app-tls
  rules:
  - host: mytodoapp.tk
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: todo-frontend-service
            port:
              number: 80
  - host: www.mytodoapp.tk
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: todo-frontend-service
            port:
              number: 80
```

Apply:
```powershell
kubectl apply -f ingress-tls.yaml
```

**Wait**: 2-5 minutes for certificate

**Verify**:
```powershell
kubectl get certificate -n default
```

**Visit**: `https://mytodoapp.tk` 🔒

---

## 7. Automatic Deployment Setup

### GitHub Actions - Complete Setup

**One-time setup, then push code = automatic deployment!**

### Step 1: Get Azure Credentials

```powershell
# Get your subscription ID
$SUBSCRIPTION_ID = az account show --query id -o tsv

# Create service principal for GitHub Actions
az ad sp create-for-rbac `
  --name "github-actions-hackathon-todo" `
  --role contributor `
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/hackathon-todo-rg" `
  --sdk-auth
```

**Copy the entire JSON output** - you'll need it!

### Step 2: Get ACR Credentials

```powershell
# Get ACR password
az acr credential show --name hackathontodoacr --query "passwords[0].value" -o tsv
```

**Copy this password**

### Step 3: Add Secrets to GitHub

1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add these secrets:

| Secret Name | Value |
|------------|-------|
| `AZURE_CREDENTIALS` | The JSON from Step 1 (entire thing) |
| `ACR_NAME` | `hackathontodoacr` |
| `ACR_USERNAME` | `hackathontodoacr` |
| `ACR_PASSWORD` | The password from Step 2 |
| `AKS_CLUSTER_NAME` | `hackathon-todo-dev` |
| `AKS_RESOURCE_GROUP` | `hackathon-todo-rg` |

### Step 4: Create Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy to Azure AKS

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

env:
  ACR_NAME: ${{ secrets.ACR_NAME }}
  AKS_CLUSTER: ${{ secrets.AKS_CLUSTER_NAME }}
  AKS_RESOURCE_GROUP: ${{ secrets.AKS_RESOURCE_GROUP }}

jobs:
  build-and-deploy:
    name: Build and Deploy Application
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Azure Login
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: ACR Login
      run: |
        az acr login --name ${{ env.ACR_NAME }}

    - name: Build Backend Image
      run: |
        docker build -t ${{ env.ACR_NAME }}.azurecr.io/todo-backend:${{ github.sha }} ./backend
        docker build -t ${{ env.ACR_NAME }}.azurecr.io/todo-backend:latest ./backend

    - name: Build Frontend Image
      run: |
        docker build -t ${{ env.ACR_NAME }}.azurecr.io/todo-frontend:${{ github.sha }} ./frontend
        docker build -t ${{ env.ACR_NAME }}.azurecr.io/todo-frontend:latest ./frontend

    - name: Push Images to ACR
      run: |
        docker push ${{ env.ACR_NAME }}.azurecr.io/todo-backend:${{ github.sha }}
        docker push ${{ env.ACR_NAME }}.azurecr.io/todo-backend:latest
        docker push ${{ env.ACR_NAME }}.azurecr.io/todo-frontend:${{ github.sha }}
        docker push ${{ env.ACR_NAME }}.azurecr.io/todo-frontend:latest

    - name: Set AKS Context
      uses: azure/aks-set-context@v3
      with:
        resource-group: ${{ env.AKS_RESOURCE_GROUP }}
        cluster-name: ${{ env.AKS_CLUSTER }}

    - name: Deploy to AKS
      run: |
        kubectl rollout restart deployment todo-backend -n default
        kubectl rollout restart deployment todo-frontend -n default

    - name: Wait for Deployment
      run: |
        kubectl rollout status deployment/todo-backend -n default --timeout=5m
        kubectl rollout status deployment/todo-frontend -n default --timeout=5m

    - name: Get Application URL
      run: |
        echo "🎉 Deployment successful!"
        echo "Frontend URL:"
        kubectl get service todo-frontend-service -n default -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
        echo ""
```

### Step 5: Commit and Push

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment workflow"
git push origin main
```

### Step 6: Watch It Work!

1. Go to your repo → **Actions** tab
2. See your workflow running
3. Watch each step complete
4. ✅ Deployment done in ~5-10 minutes!

### Step 7: Daily Usage

```bash
# Make code changes
# (edit files)

# Commit and push
git add .
git commit -m "Added new feature"
git push

# Done! GitHub deploys automatically 🎉
```

---

## 8. Troubleshooting

### Issue: 500 Internal Server Error

**Symptoms**: App shows 500 error when trying to log in or access dashboard

**Causes**:
1. Database connection issues
2. Wrong environment variables
3. Frontend/Backend version mismatch

**Solution**:

```powershell
# Check backend logs
kubectl logs -n default -l component=backend --tail=100

# Check frontend logs
kubectl logs -n default -l component=frontend --tail=100

# Common fixes:
# 1. Verify DATABASE_URL secret
kubectl get secret database-credentials -n default -o jsonpath='{.data.database-url}' | base64 -d

# 2. Restart deployments
kubectl rollout restart deployment todo-backend -n default
kubectl rollout restart deployment todo-frontend -n default

# 3. Check if pods are running
kubectl get pods -n default
```

---

### Issue: Port Change Not Working

**Symptoms**: Still shows `:3000` in URL after changing to port 80

**Solution**:

```powershell
# Verify service configuration
kubectl get service todo-frontend-service -n default -o yaml

# Check if port is 80
# Should show: port: 80, targetPort: 3000

# If not, edit deployment and reapply
kubectl apply -f k8s-azure-deploy.yaml

# Get new service info
kubectl get service todo-frontend-service -n default
```

---

### Issue: Domain Not Resolving

**Symptoms**: `mytodoapp.tk` doesn't work, shows "DNS not found"

**Solution**:

```powershell
# Check DNS propagation
nslookup mytodoapp.tk

# If no result, wait longer (up to 24 hours)

# Check DNS records at registrar
# Ensure A record points to correct IP

# Get your current IP
kubectl get service todo-frontend-service -n default

# Verify IP matches DNS A record
```

---

### Issue: IP Address Changed

**Symptoms**: App not accessible after restarting cluster

**Solution**:

```powershell
# Get new IP address
kubectl get service todo-frontend-service -n default

# Update DNS records at your domain registrar
# Change A record to new IP

# If using Cloudflare, update there too
```

---

### Issue: Environment Variables Not Updating

**Symptoms**: Changed secret but app still uses old value

**Solution**:

```powershell
# Delete old pods to force recreation
kubectl delete pods -n default -l app=todo-chatbot

# Or restart deployments
kubectl rollout restart deployment todo-backend -n default
kubectl rollout restart deployment todo-frontend -n default

# Verify new pods picked up changes
kubectl logs -n default -l component=backend --tail=20
```

---

### Issue: Build Fails on GitHub Actions

**Symptoms**: GitHub Actions workflow fails at build step

**Common causes**:
1. Docker build errors in code
2. Missing secrets
3. ACR authentication issues

**Solution**:

```powershell
# Test build locally first
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend

# If local build works, check GitHub secrets
# Verify all secrets are set correctly

# Check workflow logs in GitHub Actions
# Look for specific error message
```

---

## 9. Daily Operations Checklist

### Every Day Before You Start

```powershell
# Start the cluster (if stopped to save money)
bash scripts/start-cluster.sh

# Wait 3-5 minutes

# Check everything is running
kubectl get pods -n default

# Get your app URL (might have changed)
kubectl get service todo-frontend-service -n default
```

### Every Day Before You Stop Working

```powershell
# Stop cluster to save money (70-80% savings!)
bash scripts/stop-cluster.sh

# Confirm it stopped
az aks show --name hackathon-todo-dev --resource-group hackathon-todo-rg --query "powerState"
```

### When You Make Code Changes

```powershell
# Option 1: Push to GitHub (if CI/CD enabled)
git add .
git commit -m "Your changes"
git push

# Option 2: Manual update (if no CI/CD)
docker build -t hackathontodoacr.azurecr.io/todo-frontend:latest ./frontend
docker push hackathontodoacr.azurecr.io/todo-frontend:latest
kubectl rollout restart deployment todo-frontend -n default
```

---

## 10. Cost Management

### Current Costs

**Your setup**:
- Node: 1x Standard_B2s (2 vCPU, 4GB RAM)
- Running 24/7: ~$15-20/month
- With daily stop/start: ~$8-10/month

### Maximize Your $100 Credit

**Daily Stop/Start Routine** (saves $120-180/year!):

```powershell
# End of day (9 PM)
bash scripts/stop-cluster.sh

# Start of day (9 AM)
bash scripts/start-cluster.sh
```

**With this routine**:
- Cost: ~$10/month
- Your $100 lasts: ~10 months
- vs 24/7 running: Only 5-6 months

### Set Budget Alerts

1. Go to: https://portal.azure.com
2. Search: "Cost Management + Billing"
3. Click: "Budgets"
4. Create budget:
   - Name: "Monthly AKS Budget"
   - Amount: $25
   - Alerts: 50%, 80%, 100%
   - Email: Your email

**You'll get email alerts before overspending!**

---

## 11. Quick Reference Commands

### Check Status

```powershell
# All pods
kubectl get pods -n default

# All services
kubectl get services -n default

# Specific deployment
kubectl get deployment todo-frontend -n default

# Application URL
kubectl get service todo-frontend-service -n default
```

### View Logs

```powershell
# Frontend logs
kubectl logs -n default -l component=frontend --tail=50

# Backend logs
kubectl logs -n default -l component=backend --tail=50

# Specific pod
kubectl logs -n default POD_NAME --tail=100

# Follow logs in real-time
kubectl logs -n default -l component=backend -f
```

### Update Application

```powershell
# Build and push
docker build -t hackathontodoacr.azurecr.io/todo-frontend:latest ./frontend
az acr login --name hackathontodoacr
docker push hackathontodoacr.azurecr.io/todo-frontend:latest

# Deploy
kubectl rollout restart deployment todo-frontend -n default

# Check status
kubectl rollout status deployment/todo-frontend -n default
```

### Manage Secrets

```powershell
# List secrets
kubectl get secrets -n default

# View secret
kubectl get secret SECRET_NAME -n default -o yaml

# Decode secret value
kubectl get secret SECRET_NAME -n default -o jsonpath='{.data.KEY}' | base64 -d

# Delete secret
kubectl delete secret SECRET_NAME -n default

# Create secret
kubectl create secret generic SECRET_NAME --from-literal=key=value -n default
```

### Cluster Management

```powershell
# Stop cluster (save money!)
bash scripts/stop-cluster.sh

# Start cluster
bash scripts/start-cluster.sh

# Check cluster status
az aks show --name hackathon-todo-dev --resource-group hackathon-todo-rg --query "powerState"
```

---

## 12. Summary

### What You Learned

✅ Both frontend AND backend run on Azure AKS
✅ Your app is accessible from ANYWHERE (not just your PC)
✅ Port 3000 doesn't mean "local" - it's just a service port
✅ How to update code (manual and automatic)
✅ How to update environment variables/secrets
✅ How to remove port from URL (change to port 80)
✅ How to get free custom domains (3 options)
✅ How to add HTTPS for free
✅ How to set up CI/CD with GitHub Actions
✅ How to save money (stop/start cluster)

### Your Current Setup

| What | Where | How to Access |
|------|-------|---------------|
| **Frontend** | Azure AKS | http://135.235.178.119:3000 |
| **Backend** | Azure AKS | Internal (frontend calls it) |
| **Database** | Neon Cloud | Connection string |
| **Images** | Azure ACR | kubectl pulls automatically |

### Next Steps

1. **Remove port**: Change service port to 80
2. **Get domain**: Register free .tk domain
3. **Add HTTPS**: Use Cloudflare for free SSL
4. **Set up CI/CD**: GitHub Actions for auto-deploy
5. **Save money**: Daily stop/start routine

---

**You're now ready to manage your cloud deployment like a pro!** 🚀

**Questions?** Check the Troubleshooting section or re-read relevant sections.

**Happy Deploying!** 🎉☁️

