# Quickstart: Phase 4 - Local Kubernetes Deployment

**Feature**: 001-local-k8s-deployment
**Audience**: Developers setting up Phase 4 for the first time
**Time Required**: 30-45 minutes (including tool installation)

---

## Prerequisites Checklist

Before starting Phase 4 deployment, ensure you have:

- [ ] **Phase 3 Complete**: AI chatbot fully functional (frontend + backend + agent + MCP tools)
- [ ] **Docker Desktop 4.38+** installed and running
  - Windows: Enable WSL2 integration
  - macOS: Allocate 4GB+ RAM, 2+ CPUs in preferences
  - Linux: Docker Engine 24.0+ with Docker Compose
- [ ] **Minikube 1.32+** installed
- [ ] **kubectl 1.28+** installed (should match Minikube Kubernetes version)
- [ ] **Helm 3.12+** installed
- [ ] **Neon PostgreSQL** database accessible (from Phase 3)
- [ ] **OpenAI API Key** configured (from Phase 3)

### Tool Installation Quick Links

**Docker Desktop**:
- Windows: https://docs.docker.com/desktop/install/windows-install/
- macOS: https://docs.docker.com/desktop/install/mac-install/
- Linux: https://docs.docker.com/desktop/install/linux-install/

**Minikube**:
```bash
# macOS
brew install minikube

# Windows (PowerShell as Admin)
choco install minikube

# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

**kubectl**:
```bash
# macOS
brew install kubectl

# Windows
choco install kubernetes-cli

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

**Helm**:
```bash
# macOS
brew install helm

# Windows
choco install kubernetes-helm

# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Verify Installations

```bash
docker --version          # Should be 4.38.0+
minikube version          # Should be v1.32.0+
kubectl version --client  # Should be v1.28.0+
helm version              # Should be v3.12.0+
```

---

## Step 1: Start Minikube

```bash
# Start Minikube with sufficient resources
minikube start --cpus=2 --memory=4096 --driver=docker

# Verify cluster is running
minikube status

# Expected output:
# minikube
# type: Control Plane
# host: Running
# kubelet: Running
# apiserver: Running
# kubeconfig: Configured
```

**Troubleshooting**:
- **Error: Not enough memory**: Close other applications or increase Docker Desktop memory limit
- **Error: Driver not found**: Ensure Docker Desktop is running before starting Minikube
- **Windows WSL2 issues**: Run `wsl --update` and restart Docker Desktop

---

## Step 2: Configure Environment Variables

Create `.env` file with Phase 3 credentials:

```bash
# Navigate to project root
cd /path/to/hackathon-todo

# Copy environment template
cp backend/.env.example .env

# Edit .env with your credentials
nano .env
```

**Required variables**:
```bash
DATABASE_URL=postgresql+asyncpg://neondb_owner:<password>@<host>/neondb?ssl=require
BETTER_AUTH_SECRET=<your-32-char-secret>
OPENAI_API_KEY=sk-proj-<your-key>
CORS_ORIGINS=http://localhost:3000
```

**Important**: DO NOT commit `.env` file to Git (already in .gitignore)

---

## Step 3: Build Docker Images (Using Minikube Docker Daemon)

```bash
# Configure your shell to use Minikube's Docker daemon
eval $(minikube docker-env)

# Verify you're using Minikube Docker
docker ps  # Should show Kubernetes system containers

# Build backend image
cd backend
docker build -t todo-backend:latest -f Dockerfile .

# Build frontend image
cd ../frontend
docker build -t todo-frontend:latest -f Dockerfile .

# Verify images exist in Minikube
docker images | grep todo
# Should show:
# todo-backend    latest    <image-id>    <size>
# todo-frontend   latest    <image-id>    <size>
```

**Expected build times**:
- Backend: 3-5 minutes (depends on dependency caching)
- Frontend: 4-6 minutes (Next.js build)

**Troubleshooting**:
- **Error: command not found (eval)**: Use PowerShell on Windows: `& minikube -p minikube docker-env --shell powershell | Invoke-Expression`
- **Build fails with dependency errors**: Ensure pyproject.toml and package.json are up-to-date from Phase 3
- **Out of disk space**: Run `docker system prune -a` to clean up old images

---

## Step 4: Deploy with Helm

```bash
# Navigate to project root
cd /path/to/hackathon-todo

# Load environment variables
source .env  # Linux/macOS
# OR
Get-Content .env | ForEach-Object { $var = $_.Split('='); [System.Environment]::SetEnvironmentVariable($var[0], $var[1]) }  # Windows PowerShell

# Install Helm chart with secrets
helm install todo-chatbot ./helm/todo-chatbot \
  --namespace todo-chatbot \
  --create-namespace \
  --set secrets.DATABASE_URL="$DATABASE_URL" \
  --set secrets.BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  --set secrets.OPENAI_API_KEY="$OPENAI_API_KEY" \
  --wait \
  --timeout 5m

# Expected output:
# NAME: todo-chatbot
# LAST DEPLOYED: <timestamp>
# NAMESPACE: todo-chatbot
# STATUS: deployed
# REVISION: 1
# ...
```

**Verification**:
```bash
# Check all pods are running
kubectl get pods -n todo-chatbot

# Expected output:
# NAME                                READY   STATUS    RESTARTS   AGE
# todo-backend-<hash>-<hash>          1/1     Running   0          2m
# todo-backend-<hash>-<hash>          1/1     Running   0          2m
# todo-frontend-<hash>-<hash>         1/1     Running   0          2m

# Check services
kubectl get services -n todo-chatbot

# Check HPA (Horizontal Pod Autoscaler)
kubectl get hpa -n todo-chatbot
```

**Troubleshooting**:
- **Pods stuck in Pending**: Check `kubectl describe pod <pod-name> -n todo-chatbot` for resource allocation issues
- **Pods CrashLoopBackOff**: Check logs: `kubectl logs <pod-name> -n todo-chatbot`
- **Database connection errors**: Verify DATABASE_URL is correct and Neon database is accessible

---

## Step 5: Access the Application

### Option A: Minikube Service (Recommended for Beginners)

```bash
# Automatically open frontend in browser
minikube service todo-chatbot-frontend -n todo-chatbot

# Expected output:
# |--------------------|---------------------------|-------------|---------------------------|
# |     NAMESPACE      |           NAME            | TARGET PORT |            URL            |
# |--------------------|---------------------------|-------------|---------------------------|
# | todo-chatbot       | todo-chatbot-frontend     |        3000 | http://192.168.49.2:30123 |
# |--------------------|---------------------------|-------------|---------------------------|
# 🎉  Opening service todo-chatbot/todo-chatbot-frontend in default browser...
```

### Option B: Port Forwarding (For Advanced Users)

```bash
# Forward frontend port to localhost
kubectl port-forward -n todo-chatbot service/todo-chatbot-frontend 3000:3000

# In another terminal, forward backend port (for direct API testing)
kubectl port-forward -n todo-chatbot service/todo-chatbot-backend 8000:8000

# Access:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/docs
```

---

## Step 6: Verify Functionality

### Test Checklist

- [ ] **Frontend loads** at http://localhost:3000 or Minikube service URL
- [ ] **Sign in works** (Better Auth JWT authentication)
- [ ] **Create a task** via chat interface ("Add task to buy groceries")
- [ ] **List tasks** via chat ("Show my tasks")
- [ ] **Complete a task** via chat ("Mark task 1 as done")
- [ ] **Update a task** via chat ("Change task 2 description to 'Urgent'")
- [ ] **Delete a task** via chat ("Delete task 3")
- [ ] **Check backend health** at http://localhost:8000/health (should return `{"status": "ok"}`)

### Test Agent Functionality

```bash
# Sign in to frontend
# Open chat interface
# Send test messages:

"Add a task to finish Phase 4 deployment"
# Expected: ✅ Task added!

"Show all my tasks"
# Expected: List of tasks with titles and descriptions

"Mark the Phase 4 task as complete"
# Expected: ✅ Task marked as complete!
```

---

## Step 7: Monitor Deployment

### View Pod Logs

```bash
# Backend logs (live tail)
kubectl logs -f -n todo-chatbot deployment/todo-backend

# Frontend logs
kubectl logs -f -n todo-chatbot deployment/todo-frontend

# All pods in namespace
kubectl logs -n todo-chatbot --all-containers=true -l app=todo-chatbot
```

### Check Resource Usage

```bash
# Pod resource consumption
kubectl top pods -n todo-chatbot

# Expected output:
# NAME                                CPU(cores)   MEMORY(bytes)
# todo-backend-<hash>-<hash>          120m         350Mi
# todo-backend-<hash>-<hash>          115m         345Mi
# todo-frontend-<hash>-<hash>         45m          180Mi
```

### View HPA Status

```bash
# Horizontal Pod Autoscaler metrics
kubectl get hpa -n todo-chatbot --watch

# Expected output:
# NAME                REFERENCE              TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
# todo-backend-hpa    Deployment/todo-backend   35%/70%   2         5         2          5m
```

---

## Step 8: Test Scaling & Resilience

### Manual Scaling

```bash
# Scale backend to 3 replicas
kubectl scale deployment todo-backend -n todo-chatbot --replicas=3

# Verify scaling
kubectl get pods -n todo-chatbot -l component=backend
```

### Simulate Pod Failure

```bash
# Delete a backend pod (Kubernetes will recreate it)
kubectl delete pod -n todo-chatbot -l component=backend --field-selector=status.phase=Running --timeout=0s --wait=false

# Watch pods being recreated
kubectl get pods -n todo-chatbot -w
```

### Verify Zero Downtime

```bash
# In one terminal, continuously test backend
while true; do curl -s http://localhost:8000/health; echo; sleep 1; done

# In another terminal, trigger rolling update
kubectl set image deployment/todo-backend -n todo-chatbot backend=todo-backend:latest

# Expected: No "connection refused" errors during update
```

---

## Step 9: AI DevOps Tools (Optional Bonus)

### Install AI Tools

**kubectl-ai** (Google Cloud Platform):
```bash
# Installation
pip install kubectl-ai

# Configuration
kubectl-ai configure --api-key <your-openai-api-key>

# Usage examples
kubectl-ai "show me all pods in todo-chatbot namespace"
kubectl-ai "scale the backend to 4 replicas"
kubectl-ai "describe the failing pod"
```

**kagent** (InfraCloud):
```bash
# Installation
pip install kagent

# Usage
kagent "analyze resource usage for todo-chatbot"
kagent "recommend optimizations for backend deployment"
kagent "troubleshoot pod scheduling issues"
```

**Gordon** (Docker AI - Requires Docker Desktop 4.38+):
```bash
# Access via Docker Desktop UI
# Or use CLI:
docker ai "analyze the todo-backend Dockerfile"
docker ai "suggest improvements for reducing image size"
```

---

## Step 10: Cleanup (When Done Testing)

### Uninstall Helm Release

```bash
# Uninstall application
helm uninstall todo-chatbot -n todo-chatbot

# Delete namespace (removes all resources)
kubectl delete namespace todo-chatbot
```

### Stop Minikube

```bash
# Stop Minikube cluster
minikube stop

# OR delete cluster entirely (frees disk space)
minikube delete
```

### Reset Docker Environment

```bash
# Return to local Docker daemon
eval $(minikube docker-env --unset)

# Verify you're back to local Docker
docker ps  # Should NOT show Kubernetes containers
```

---

## Common Issues & Solutions

### Issue: Pods stuck in ImagePullBackOff

**Cause**: Minikube can't find images (not using Minikube Docker daemon)

**Solution**:
```bash
eval $(minikube docker-env)
docker build -t todo-backend:latest -f backend/Dockerfile backend/
docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/
```

### Issue: Backend pod CrashLoopBackOff

**Cause**: Database connection failure or missing environment variables

**Solution**:
```bash
# Check pod logs
kubectl logs -n todo-chatbot -l component=backend --tail=50

# Verify secrets
kubectl get secret todo-chatbot-secrets -n todo-chatbot -o yaml

# Re-deploy with correct secrets
helm upgrade todo-chatbot ./helm/todo-chatbot \
  --namespace todo-chatbot \
  --set secrets.DATABASE_URL="<correct-url>" \
  --wait
```

### Issue: Frontend can't connect to backend

**Cause**: Service misconfiguration or CORS issues

**Solution**:
```bash
# Check service endpoints
kubectl get endpoints -n todo-chatbot

# Verify CORS_ORIGINS in ConfigMap
kubectl get configmap todo-chatbot-config -n todo-chatbot -o yaml

# Update CORS origins
helm upgrade todo-chatbot ./helm/todo-chatbot \
  --namespace todo-chatbot \
  --set backend.env.CORS_ORIGINS="http://todo-frontend-service:3000" \
  --wait
```

### Issue: Out of disk space

**Solution**:
```bash
# Clean up Docker (in Minikube daemon)
eval $(minikube docker-env)
docker system prune -a --volumes

# Clean up local Docker
eval $(minikube docker-env --unset)
docker system prune -a
```

---

## Next Steps

After successful local deployment:

1. **Explore Helm Chart**: Review `helm/todo-chatbot/` templates and values
2. **Experiment with Scaling**: Test HPA behavior under load
3. **Try AI Tools**: Use kubectl-ai, kagent, Gordon for infrastructure tasks
4. **Prepare for Phase 5**: Review cloud deployment requirements (DigitalOcean, Google Cloud, Azure)
5. **Document Learnings**: Create notes on Kubernetes concepts learned

---

## Success Criteria Validation

- [ ] Docker images built successfully (backend < 200MB, frontend < 500MB)
- [ ] Deployment completes in under 3 minutes
- [ ] All pods pass health checks within 30 seconds
- [ ] Application fully functional (tasks CRUD via chat)
- [ ] Scaling works (manual and HPA)
- [ ] Zero downtime during rolling updates
- [ ] At least one AI tool successfully used (kubectl-ai, kagent, or Gordon)

---

## Support Resources

- **Minikube Troubleshooting**: https://minikube.sigs.k8s.io/docs/handbook/troubleshooting/
- **Helm Debugging**: https://helm.sh/docs/chart_template_guide/debugging/
- **Kubernetes Debugging**: https://kubernetes.io/docs/tasks/debug/
- **Project Issues**: Create issue in GitHub repository

**Version**: 1.0.0 | **Last Updated**: 2026-02-02 | **Feature**: 001-local-k8s-deployment
