# 🎓 Complete Beginner's Guide to Azure AKS Deployment
## For Students with ZERO Cloud Experience

**WHO IS THIS FOR**: Students who have never used Azure, Kubernetes, or cloud platforms before.

**WHAT YOU'LL LEARN**: Deploy your Todo app to the cloud step-by-step with screenshots and explanations.

**TIME NEEDED**: 1-2 hours for first deployment

**COST**: ~$10/month with stop/start (your $100 credit lasts 10 months!)

---

## 📋 Before You Start - Checklist

Make sure you have:
- [ ] Windows computer (HP ProBook - perfect!)
- [ ] Stable internet connection
- [ ] Azure for Students account (or willing to create one)
- [ ] GitHub account
- [ ] This repository cloned on your computer
- [ ] Docker Desktop installed and running

**Don't have these?** Follow Prerequisites section below!

---

## Part 1: Prerequisites Setup (30-45 minutes)

### Step 1.1: Get Azure for Students Account

**What is this?** Free $100 credit from Microsoft for students.

**How to get it:**

1. **Go to**: https://azure.microsoft.com/en-us/free/students/
2. **Click**: "Activate now" (green button)
3. **Sign in** with your:
   - University email (e.g., yourname@university.edu.pk)
   - OR personal email + verify student status with ID
4. **Fill in details**:
   - Name: Your full name
   - Country: Pakistan (or your country)
   - Phone: Your mobile number
5. **Verify phone**: They'll send SMS code
6. **Agreement**: Check the box, click "Sign up"

**✅ Success**: You'll see "Welcome to Azure" dashboard

**❌ If it fails**:
- Error "Not eligible": Use different email or try Azure Free Trial (credit card required but won't be charged)
- Error "Email already used": You already have account, just login

**What you got**: $100 credit valid for 12 months

---

### Step 1.2: Install Azure CLI (5 minutes)

**What is this?** Command-line tool to control Azure from your terminal.

**On Windows (Your HP ProBook):**

1. **Open PowerShell as Administrator**:
   - Press `Win + X`
   - Click "Windows PowerShell (Admin)" or "Terminal (Admin)"
   - If UAC prompt appears, click "Yes"

2. **Install Azure CLI**:
   ```powershell
   winget install Microsoft.AzureCLI
   ```

3. **Wait** for installation (1-2 minutes)

4. **Close and reopen** PowerShell (important!)

5. **Verify installation**:
   ```powershell
   az version
   ```

**✅ Success**: You'll see version info like:
```
{
  "azure-cli": "2.57.0",
  ...
}
```

**❌ If command not found**:
- Restart your computer
- Try manual installer: https://aka.ms/installazurecliwindows

---

### Step 1.3: Install Docker Desktop (10 minutes)

**What is this?** Tool to build container images for your app.

**Already have it?** Skip to Step 1.4

**Don't have it:**

1. **Download**: https://www.docker.com/products/docker-desktop/
2. **Click**: "Download for Windows"
3. **Run installer**: `Docker Desktop Installer.exe`
4. **Follow wizard**: Click Next → Next → Install
5. **Restart computer** when prompted
6. **Open Docker Desktop**: Start menu → Docker Desktop
7. **Accept terms**: Check box → Click "Accept"

**✅ Success**: Docker Desktop shows green "Engine running"

**❌ If WSL error**:
```powershell
wsl --install
# Then restart computer
```

---

### Step 1.4: Install Git (if not installed) (5 minutes)

**What is this?** Version control tool (you probably have it).

**Check if you have it**:
```powershell
git --version
```

**✅ If you see version**: Skip to Step 1.5

**❌ If not found**:
1. Download: https://git-scm.com/download/win
2. Run installer with default settings
3. Restart PowerShell

---

### Step 1.5: Clone This Repository (2 minutes)

**What is this?** Download the code to your computer.

```powershell
# Navigate to where you want the project
cd C:\Users\YourName\Documents

# Clone repository (replace with your repo URL if different)
git clone <your-repo-url>

# Go into the folder
cd hackathon-todo

# Verify you're in the right place
ls
# You should see: backend, frontend, scripts, helm, etc.
```

---

## Part 2: Azure Account Setup (10 minutes)

### Step 2.1: Login to Azure

**Open PowerShell in your project folder**:
```powershell
cd C:\Users\YourName\Documents\hackathon-todo

az login
```

**What happens**:
1. Browser window opens
2. Login with your Azure for Students email
3. Browser shows "You have logged in"
4. Close browser, return to PowerShell

**✅ Success**: PowerShell shows your subscription info

---

### Step 2.2: Select Your Student Subscription

**List your subscriptions**:
```powershell
az account list --output table
```

**You'll see something like**:
```
Name                     SubscriptionId                        TenantId
-----------------------  ------------------------------------  ---------
Azure for Students       12345678-1234-1234-1234-123456789abc  xxxxx
```

**Copy the SubscriptionId** (the long UUID)

**Set it as active**:
```powershell
az account set --subscription "12345678-1234-1234-1234-123456789abc"
```
(Replace with YOUR subscription ID)

**Verify**:
```powershell
az account show
```

**✅ Success**: Shows "Azure for Students" as name

---

### Step 2.3: Check Your Credit Balance

**Optional but recommended**:

1. Go to: https://portal.azure.com
2. Login if needed
3. Search bar → Type "Cost Management"
4. Click "Cost Management + Billing"
5. Click "Credits" on left menu
6. **You should see**: $100.00 starting balance

**Write down**: How much credit you have left

---

## Part 3: Redpanda Cloud Setup (15 minutes)

**What is this?** Free Kafka service for event processing.

### Step 3.1: Create Redpanda Account

1. **Go to**: https://redpanda.com/try-redpanda
2. **Click**: "Start Free"
3. **Sign up with**:
   - Email: Your personal email
   - Password: Strong password
   - Click "Create account"
4. **Verify email**: Check inbox, click verification link

---

### Step 3.2: Create Cluster

1. **Dashboard** → Click "Create cluster"
2. **Choose plan**: "Serverless" (Free forever!)
3. **Cluster name**: `hackathon-todo-events`
4. **Cloud provider**: AWS
5. **Region**: `ap-south-1` (Mumbai - closest to Karachi!)
6. **Click**: "Create"
7. **Wait**: 2-3 minutes while it provisions

**✅ Success**: Cluster shows "Running" status

---

### Step 3.3: Get Connection Details

**You need 3 things**:

1. **In Redpanda dashboard**:
   - Click your cluster name
   - Click "How to Connect" tab

2. **Bootstrap servers**:
   - Copy the value that looks like: `seed-abc123.cloud.redpanda.com:9092`
   - **SAVE THIS** - you'll need it soon

3. **Create user**:
   - Click "Security" tab
   - Click "Create user +"
   - Username: `hackathon-user`
   - Password: (auto-generated) - **COPY THIS PASSWORD**
   - Mechanism: `SCRAM-SHA-256`
   - Click "Create"

4. **Create topics**:
   - Click "Topics" tab
   - Click "Create topic +"
   - Name: `task-events`
   - Click "Create"
   - Repeat for: `notifications`

**✅ Success**: You have:
- ✅ Bootstrap servers URL
- ✅ Username: `hackathon-user`
- ✅ Password: (the one you copied)
- ✅ Two topics created

**Write these down** somewhere safe!

---

## Part 4: Configure Environment (10 minutes)

### Step 4.1: Copy Template

**In PowerShell** (in your project folder):
```powershell
# Copy the example file
Copy-Item .env.example .env

# Open it in VS Code (or notepad)
code .env
# OR
notepad .env
```

---

### Step 4.2: Fill in ALL Values

**Open `.env` file and edit these values**:

```bash
# ============================================================================
# Phase 4 & 5 - FILL IN ALL VALUES BELOW
# ============================================================================

# Database Configuration
# Get from Neon PostgreSQL (you should already have this from Phase 3)
DATABASE_URL=postgresql+asyncpg://neondb_owner:YOUR_PASSWORD@YOUR_HOST.neon.tech/neondb?ssl=require

# Authentication Secret
# Generate new one with this command in PowerShell:
# (openssl is in Git Bash, or use: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 })))
BETTER_AUTH_SECRET=your-32-character-secret-key-here

# OpenAI API Key
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your-key-here

# OpenAI ChatKit Domain Key (optional - can leave empty)
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=

# CORS Configuration (leave as is)
CORS_ORIGINS=http://localhost:3000,http://todo-frontend-service:3000

# Application Environment (leave as is)
ENVIRONMENT=development
DEBUG=true

# Frontend Configuration (leave as is)
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=production

# ============================================================================
# Phase 5 - Azure AKS Cloud Deployment (STUDENT BUDGET MODE)
# ============================================================================

# Azure Configuration
AZURE_RESOURCE_GROUP=hackathon-todo-rg

# IMPORTANT: Choose region close to you!
# For Karachi/Pakistan: centralindia (Mumbai)
# For other Asia: southeastasia (Singapore)
# For cheapest: eastus (USA, but slow from Asia)
AZURE_LOCATION=centralindia

# Cluster name (leave as is)
AKS_CLUSTER_NAME=hackathon-todo-dev

# Budget settings (LEAVE THESE AS IS!)
AKS_TIER=Free
AKS_VM_SIZE=Standard_B2s
AKS_NODE_COUNT=1

# Azure Container Registry name
# IMPORTANT: Must be globally unique! Change if needed!
# Try: hackathontodo + your initials + random numbers
ACR_NAME=hackathontodoXY1234

# Redpanda Cloud Configuration
# Paste values from Step 3.3 above

# Bootstrap servers (from Redpanda dashboard)
REDPANDA_BROKERS=seed-abc123.cloud.redpanda.com:9092

# SASL credentials (from Redpanda dashboard)
REDPANDA_SASL_USERNAME=hackathon-user
REDPANDA_SASL_PASSWORD=the-password-you-copied

# SASL mechanism (leave as is)
REDPANDA_SASL_MECHANISM=SCRAM-SHA-256

# Topics (leave as is)
REDPANDA_TASK_EVENTS_TOPIC=task-events
REDPANDA_NOTIFICATIONS_TOPIC=notifications
```

---

### Step 4.3: Verify Your .env File

**Check these are filled in** (not "your-xxx-here"):
- [ ] DATABASE_URL (from Neon)
- [ ] OPENAI_API_KEY (from OpenAI)
- [ ] BETTER_AUTH_SECRET (generate new one)
- [ ] ACR_NAME (make it unique!)
- [ ] REDPANDA_BROKERS (from Redpanda)
- [ ] REDPANDA_SASL_USERNAME (from Redpanda)
- [ ] REDPANDA_SASL_PASSWORD (from Redpanda)

**Save the file**: `Ctrl + S`

---

## Part 5: Deploy to Azure (45-60 minutes)

**NOW THE ACTUAL DEPLOYMENT STARTS!**

### Step 5.1: Create Azure Infrastructure (15-20 minutes)

**Run this command**:
```powershell
# Make sure you're in the project folder!
cd C:\Users\YourName\Documents\hackathon-todo

# Make scripts executable (Windows might skip this)
# Run the setup script
bash scripts/setup-aks.sh
```

**OR if bash not found**:
```powershell
# Use Git Bash
& "C:\Program Files\Git\bin\bash.exe" scripts/setup-aks.sh
```

**What happens** (be patient!):
1. ✅ Checks if Azure CLI is installed
2. ✅ Checks if you're logged in
3. ✅ Creates resource group `hackathon-todo-rg`
4. ✅ Creates container registry `hackathontodoXY1234`
5. ⏳ Creates AKS cluster (THIS TAKES 10-15 MINUTES!)
6. ✅ Configures kubectl credentials

**What you'll see**:
```
[INFO] === Azure AKS Cluster Setup ===
[INFO] Resource Group: hackathon-todo-rg
[INFO] Cluster Name: hackathon-todo-dev
...
[INFO] Creating AKS cluster...
[INFO] This may take 10-15 minutes...
(wait patiently...)
[INFO] ✅ AKS cluster created successfully
```

**✅ Success**: Last line says "Setup Complete" with next steps

**❌ If error "Resource group already exists"**:
- This is OK! Script will skip and continue

**❌ If error "ACR name already taken"**:
- Edit `.env` file
- Change `ACR_NAME=hackathontodo` + different numbers
- Run script again

---

### Step 5.2: Install Dapr (3-5 minutes)

**Run this command**:
```powershell
bash scripts/install-dapr.sh
```

**What happens**:
1. ✅ Checks kubectl connection
2. ✅ Installs Dapr extension on AKS
3. ⏳ Waits for Dapr pods to start (2-3 minutes)
4. ✅ Verifies Dapr is running

**✅ Success**: See "Dapr Installation Complete"

---

### Step 5.3: Configure Secrets (2 minutes)

**Run this command**:
```powershell
bash scripts/setup-secrets.sh
```

**What you'll see**:
```
[INFO] === Kubernetes Secrets Setup ===
[INFO] Loading secrets from .env file...
[WARN] You are about to create secrets...
Continue? (y/N):
```

**Type**: `y` and press Enter

**What happens**:
1. ✅ Reads your `.env` file
2. ✅ Creates Kubernetes secret: `database-credentials`
3. ✅ Creates Kubernetes secret: `openai-credentials`
4. ✅ Creates Kubernetes secret: `auth-credentials`
5. ✅ Creates Kubernetes secret: `redpanda-credentials`

**✅ Success**: See "✅ Secrets Setup Complete"

**❌ If error ".env file not found"**:
- Make sure you created `.env` in Step 4
- Make sure you're in the project root folder

---

### Step 5.4: Build Docker Images (10-15 minutes)

**This depends on your internet speed!**

**Login to container registry**:
```powershell
az acr login --name hackathontodoacr
```
(Replace with YOUR ACR name from `.env`)

**✅ Success**: See "Login Succeeded"

**Build backend image**:
```powershell
# Navigate to project root if not there
cd C:\Users\YourName\Documents\hackathon-todo

# Build backend (takes 5-8 minutes)
docker build -t hackathontodoacr.azurecr.io/todo-backend:latest ./backend
```

**What you'll see**:
```
[+] Building 234.5s (15/15) FINISHED
 => [internal] load build definition
 => => transferring dockerfile: 123B
...
 => => naming to hackathontodoacr.azurecr.io/todo-backend:latest
```

**Build frontend image**:
```powershell
# Build frontend (takes 5-8 minutes)
docker build -t hackathontodoacr.azurecr.io/todo-frontend:latest ./frontend
```

**Push images to Azure**:
```powershell
# Push backend (takes 2-3 minutes)
docker push hackathontodoacr.azurecr.io/todo-backend:latest

# Push frontend (takes 2-3 minutes)
docker push hackathontodoacr.azurecr.io/todo-frontend:latest
```

**✅ Success**: Both commands show "Pushed" at the end

**❌ If error "denied: access forbidden"**:
```powershell
# Login again
az acr login --name hackathontodoacr
```

---

### Step 5.5: Deploy Application (5-10 minutes)

**Run deployment script**:
```powershell
bash scripts/deploy.sh latest
```

**What you'll see**:
```
[INFO] === Azure AKS Deployment ===
[INFO] Release: hackathon-todo
[WARN] You are about to deploy...
Continue? (y/N):
```

**Type**: `y` and press Enter

**What happens**:
1. ✅ Applies Dapr components
2. ✅ Verifies secrets exist
3. ✅ Deploys with Helm (2-3 minutes)
4. ⏳ Waits for pods to start (2-3 minutes)
5. ✅ Runs smoke tests
6. ✅ Gets public URL

**What you'll see at the end**:
```
[INFO] === Deployment Summary ===
[INFO] ✅ Deployment completed successfully!
[INFO] 🌐 Application URL: http://20.xxx.xxx.xxx:3000
```

**✅ Success**: You have a public URL!

---

### Step 5.6: Access Your App!

**Copy the IP address** from the output

**Open browser**:
```
http://20.xxx.xxx.xxx:3000
```
(Replace with YOUR IP)

**✅ SUCCESS!** You should see your Todo app!

**Try it**:
- Create a task
- Chat with AI
- Everything should work!

---

## Part 6: SAVE MONEY - Stop Cluster (2 minutes)

**CRITICAL**: When you're done for the day, STOP the cluster!

```powershell
bash scripts/stop-cluster.sh
```

**What you'll see**:
```
[WARN] This will stop the cluster...
Stop cluster now? (y/N):
```

**Type**: `y` and press Enter

**Wait**: 2-3 minutes

**✅ Success**: "Cluster stopped successfully!"

**What this does**:
- Saves 70-80% of costs!
- Your app is OFFLINE but data is safe
- Credit lasts 10 months instead of 18 days!

---

## Part 7: Start Cluster Next Day (3-5 minutes)

**When you want to work again**:

```powershell
bash scripts/start-cluster.sh
```

**Wait**: 3-5 minutes

**✅ Success**: "Cluster started successfully!"

**Get your URL again**:
```powershell
kubectl get service -n default -l app.kubernetes.io/component=frontend
```

**Your app is BACK ONLINE!**

---

## 🎉 YOU'RE DONE!

### What You Achieved

✅ Deployed to Azure cloud
✅ App is publicly accessible
✅ Using budget-friendly setup (~$10/month with stop/start)
✅ All features working (tasks, AI chat, Kafka events)

### Your Daily Routine

**End of day (9 PM)**:
```powershell
bash scripts/stop-cluster.sh
```

**Start of day (9 AM)**:
```powershell
bash scripts/start-cluster.sh
```

**Check if app is running**:
```powershell
kubectl get pods -n default
```

---

## Common Problems & Solutions

### Problem: "az: command not found"

**Solution**:
```powershell
# Restart PowerShell
# OR install Azure CLI again
winget install Microsoft.AzureCLI
```

---

### Problem: "kubectl: command not found"

**Solution**:
```powershell
az aks install-cli
# Restart PowerShell
```

---

### Problem: "Cannot connect to Docker daemon"

**Solution**:
- Open Docker Desktop
- Wait for it to show "Engine running"
- Try command again

---

### Problem: "ACR name already taken"

**Solution**:
- Edit `.env` file
- Change `ACR_NAME=` to something unique
- Example: `hackathontodo` + your initials + random numbers
- Run `setup-aks.sh` again

---

### Problem: "Pods are CrashLoopBackOff"

**Solution**:
```powershell
# Check logs
kubectl logs -n default -l app.kubernetes.io/component=backend

# Common causes:
# 1. Wrong DATABASE_URL in .env
# 2. Wrong OPENAI_API_KEY in .env
# 3. Missing secrets

# Fix: Recreate secrets
bash scripts/setup-secrets.sh
```

---

### Problem: "LoadBalancer IP not assigned"

**Solution**:
```powershell
# Wait 3-5 minutes, then check again
kubectl get service -n default

# If still pending after 10 minutes:
kubectl describe service -n default
# Look for error messages
```

---

### Problem: "Out of credits / spending too much"

**Solution**:
```powershell
# IMMEDIATELY stop cluster
bash scripts/stop-cluster.sh

# Check spending
az consumption usage list --output table

# If still spending, DELETE EVERYTHING
bash scripts/cleanup-azure.sh --delete-resource-group
```

---

## Monitoring Your Spending

**Check anytime**:

1. Go to: https://portal.azure.com
2. Search: "Cost Management"
3. Click: "Cost analysis"
4. See: How much you've spent

**Set up alerts**:

1. Cost Management → Budgets → Create
2. Name: "Monthly Budget"
3. Amount: $25
4. Alert at: 50%, 80%, 100%
5. Email: Your email

**Get notified** when spending reaches limits!

---

## What's Next?

### For Hackathon Demo:
1. ✅ Your app is live
2. ✅ Share the URL with judges
3. ✅ Demo all features
4. ✅ Stop cluster after demo (save money!)

### To Add CI/CD:
Follow: [GitHub Actions Setup Guide] (ask me if you need this!)

### To Delete Everything:
```powershell
bash scripts/cleanup-azure.sh --delete-resource-group
```
**⚠️ WARNING**: This deletes EVERYTHING. Only do this when truly done!

---

## Need More Help?

**Re-read sections** that were unclear

**Check documentation**:
- This guide (you're reading it!)
- [README-STUDENT-BUDGET.md](./README-STUDENT-BUDGET.md)
- [BUDGET-VS-PRODUCTION.md](./docs/deployment/BUDGET-VS-PRODUCTION.md)

**Common issues**: See "Common Problems & Solutions" above

**Still stuck?** Create GitHub issue with:
- What command you ran
- What error you got
- Screenshot of error

---

## Summary Checklist

After following this guide, you should have:

- [ ] Azure for Students account ($100 credit)
- [ ] Azure CLI installed
- [ ] Docker Desktop installed
- [ ] Redpanda Cloud account with cluster
- [ ] `.env` file filled out correctly
- [ ] AKS cluster created (1 node, Standard_B2s)
- [ ] Dapr installed
- [ ] Secrets configured
- [ ] Docker images built and pushed
- [ ] App deployed and running
- [ ] Public URL working
- [ ] Know how to stop/start cluster

**IF ALL CHECKED**: 🎉 **YOU DID IT!** 🎉

**Your cost**: ~$10/month with daily stop/start
**Your credit lasts**: ~10 months
**Your app**: Live on the internet!

---

**Congratulations on deploying to the cloud!** 🚀☁️

This was a complex process and you did it! Be proud! 💪
