---
name: phase4-k8s-blueprint
description: Generate complete Kubernetes deployment blueprints for Phase 4, including Dockerfiles, Kubernetes manifests, Helm charts, and deployment scripts. Use when containerizing and deploying the Phase 3 chatbot to Minikube or when generating cloud-native deployment artifacts.
allowed-tools: Read, Write, Glob, Grep, Bash
disable-model-invocation: false
---

# Phase 4: Kubernetes Deployment Blueprint Generator

## Overview

This skill generates production-ready Kubernetes deployment artifacts for the Todo Chatbot, transforming the Phase 3 application into a cloud-native, containerized system deployable on Minikube and ready for cloud deployment in Phase 5.

## What This Skill Generates

1. **Docker Artifacts**
   - Multi-stage Dockerfiles for frontend (Next.js) and backend (FastAPI)
   - Docker Compose file for local container testing
   - .dockerignore files for optimized builds
   - Health check configurations

2. **Kubernetes Manifests**
   - Deployment configurations with resource limits
   - Service definitions for inter-pod communication
   - ConfigMaps for environment-specific configuration
   - Secrets for sensitive data (templates only)
   - Horizontal Pod Autoscaler (HPA) configurations

3. **Helm Charts**
   - Complete Helm chart structure (Chart.yaml, values.yaml, templates/)
   - Templated Kubernetes resources
   - Environment-specific value files (dev, staging, prod)
   - Helm hooks for initialization tasks

4. **Documentation & Scripts**
   - Deployment README with step-by-step instructions
   - Minikube setup and deployment scripts
   - Troubleshooting guide
   - AI tool usage examples (kubectl-ai, kagent, Gordon)

## Prerequisites Check

Before generating artifacts, verify:

```bash
# Check Phase 3 application exists
ls frontend/package.json backend/pyproject.toml

# Verify application structure
ls frontend/app frontend/components backend/src

# Check for Phase 3 spec
ls specs/005-chat-endpoint/spec.md || ls specs/003-*/spec.md
```

## Generation Workflow

### Step 1: Analyze Current Application

```bash
# Read application configuration
cat frontend/package.json
cat backend/pyproject.toml
cat frontend/.env.example
cat backend/.env.example

# Understand dependencies
grep "dependencies" frontend/package.json
grep "dependencies" backend/pyproject.toml
```

### Step 2: Generate Docker Artifacts

Create the following files:

#### Frontend Dockerfile (`frontend/Dockerfile`)

```dockerfile
# Multi-stage build for Next.js 16
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
```

#### Backend Dockerfile (`backend/Dockerfile`)

```dockerfile
# Multi-stage build for FastAPI with Python 3.13
FROM python:3.13-slim AS base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install UV package manager
RUN pip install uv

WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./
COPY README.md ./

# Install dependencies
RUN uv pip install --system -e .

# Development stage (optional, for local testing)
FROM base AS development
COPY . .
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production stage
FROM base AS production

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

#### Docker Compose (`docker-compose.yml`)

```yaml
version: '3.9'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: runner
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
      - NEXT_PUBLIC_OPENAI_DOMAIN_KEY=${NEXT_PUBLIC_OPENAI_DOMAIN_KEY}
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - todo-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - CORS_ORIGINS=["http://localhost:3000"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s
    networks:
      - todo-network

networks:
  todo-network:
    driver: bridge
```

#### .dockerignore files

**frontend/.dockerignore**:
```
node_modules
.next
.git
.env.local
.env*.local
.DS_Store
*.log
coverage
.vercel
```

**backend/.dockerignore**:
```
__pycache__
*.py[cod]
*$py.class
.env
.env.*
.venv
venv/
.git
.pytest_cache
.coverage
htmlcov/
*.log
```

### Step 3: Generate Kubernetes Manifests

Create directory structure:
```bash
mkdir -p k8s/base k8s/overlays/{dev,staging,prod}
```

#### Namespace (`k8s/base/namespace.yaml`)

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: todo-chatbot
  labels:
    app: todo-chatbot
    environment: development
```

#### Backend Deployment (`k8s/base/backend-deployment.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-backend
  namespace: todo-chatbot
  labels:
    app: todo-backend
    component: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: todo-backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: todo-backend
        component: api
    spec:
      containers:
      - name: backend
        image: todo-backend:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8000
          name: http
          protocol: TCP
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: todo-secrets
              key: database-url
        - name: BETTER_AUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: todo-secrets
              key: auth-secret
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: todo-secrets
              key: openai-api-key
        - name: CORS_ORIGINS
          valueFrom:
            configMapKeyRef:
              name: todo-config
              key: cors-origins
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
      restartPolicy: Always
```

#### Frontend Deployment (`k8s/base/frontend-deployment.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-frontend
  namespace: todo-chatbot
  labels:
    app: todo-frontend
    component: ui
spec:
  replicas: 2
  selector:
    matchLabels:
      app: todo-frontend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: todo-frontend
        component: ui
    spec:
      containers:
      - name: frontend
        image: todo-frontend:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        env:
        - name: NEXT_PUBLIC_API_URL
          valueFrom:
            configMapKeyRef:
              name: todo-config
              key: api-url
        - name: NEXT_PUBLIC_OPENAI_DOMAIN_KEY
          valueFrom:
            secretKeyRef:
              name: todo-secrets
              key: openai-domain-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
      restartPolicy: Always
```

#### Services (`k8s/base/services.yaml`)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: todo-backend
  namespace: todo-chatbot
  labels:
    app: todo-backend
spec:
  type: ClusterIP
  selector:
    app: todo-backend
  ports:
  - port: 8000
    targetPort: 8000
    protocol: TCP
    name: http
---
apiVersion: v1
kind: Service
metadata:
  name: todo-frontend
  namespace: todo-chatbot
  labels:
    app: todo-frontend
spec:
  type: LoadBalancer  # For Minikube, use minikube service todo-frontend
  selector:
    app: todo-frontend
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
```

#### ConfigMap (`k8s/base/configmap.yaml`)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: todo-config
  namespace: todo-chatbot
data:
  api-url: "http://todo-backend:8000"
  cors-origins: '["http://localhost:3000","http://todo-frontend"]'
```

#### Secret Template (`k8s/base/secret-template.yaml`)

```yaml
# DO NOT COMMIT THIS FILE WITH REAL VALUES
# Create actual secret with: kubectl create secret generic todo-secrets --from-env-file=.env

apiVersion: v1
kind: Secret
metadata:
  name: todo-secrets
  namespace: todo-chatbot
type: Opaque
stringData:
  database-url: "REPLACE_WITH_ACTUAL_DATABASE_URL"
  auth-secret: "REPLACE_WITH_ACTUAL_AUTH_SECRET"
  openai-api-key: "REPLACE_WITH_ACTUAL_OPENAI_KEY"
  openai-domain-key: "REPLACE_WITH_ACTUAL_DOMAIN_KEY"
```

#### HPA (`k8s/base/hpa.yaml`)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: todo-backend-hpa
  namespace: todo-chatbot
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: todo-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
      selectPolicy: Max
```

### Step 4: Generate Helm Chart

Create Helm chart structure:

```bash
mkdir -p helm/todo-chatbot/{templates,charts}
```

#### Chart.yaml (`helm/todo-chatbot/Chart.yaml`)

```yaml
apiVersion: v2
name: todo-chatbot
description: A Helm chart for deploying the Todo Chatbot application on Kubernetes
type: application
version: 1.0.0
appVersion: "4.0.0"
keywords:
  - todo
  - chatbot
  - nextjs
  - fastapi
  - kubernetes
maintainers:
  - name: Your Name
    email: your.email@example.com
sources:
  - https://github.com/your-org/todo-chatbot
```

#### values.yaml (`helm/todo-chatbot/values.yaml`)

```yaml
# Default values for todo-chatbot
# This is a YAML-formatted file.
# Declare variables to be passed into your templates.

global:
  namespace: todo-chatbot

frontend:
  replicaCount: 2

  image:
    repository: todo-frontend
    pullPolicy: IfNotPresent
    tag: "latest"

  service:
    type: LoadBalancer
    port: 80
    targetPort: 3000

  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"

  autoscaling:
    enabled: false
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70

backend:
  replicaCount: 2

  image:
    repository: todo-backend
    pullPolicy: IfNotPresent
    tag: "latest"

  service:
    type: ClusterIP
    port: 8000
    targetPort: 8000

  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"

  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70

config:
  apiUrl: "http://todo-backend:8000"
  corsOrigins: '["http://localhost:3000","http://todo-frontend"]'

secrets:
  # These should be provided via --set or separate values file
  # NEVER commit actual secrets to version control
  databaseUrl: ""
  authSecret: ""
  openaiApiKey: ""
  openaiDomainKey: ""

ingress:
  enabled: false
  className: "nginx"
  annotations: {}
  hosts:
    - host: todo.local
      paths:
        - path: /
          pathType: Prefix
  tls: []
```

#### Deployment Template (`helm/todo-chatbot/templates/backend-deployment.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "todo-chatbot.fullname" . }}-backend
  namespace: {{ .Values.global.namespace }}
  labels:
    {{- include "todo-chatbot.labels" . | nindent 4 }}
    component: backend
spec:
  {{- if not .Values.backend.autoscaling.enabled }}
  replicas: {{ .Values.backend.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "todo-chatbot.selectorLabels" . | nindent 6 }}
      component: backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        {{- include "todo-chatbot.selectorLabels" . | nindent 8 }}
        component: backend
    spec:
      containers:
      - name: backend
        image: "{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}"
        imagePullPolicy: {{ .Values.backend.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.backend.service.targetPort }}
          protocol: TCP
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: {{ include "todo-chatbot.fullname" . }}-secrets
              key: database-url
        - name: BETTER_AUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: {{ include "todo-chatbot.fullname" . }}-secrets
              key: auth-secret
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: {{ include "todo-chatbot.fullname" . }}-secrets
              key: openai-api-key
        - name: CORS_ORIGINS
          valueFrom:
            configMapKeyRef:
              name: {{ include "todo-chatbot.fullname" . }}-config
              key: cors-origins
        resources:
          {{- toYaml .Values.backend.resources | nindent 10 }}
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
```

#### Helpers Template (`helm/todo-chatbot/templates/_helpers.tpl`)

```yaml
{{/*
Expand the name of the chart.
*/}}
{{- define "todo-chatbot.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "todo-chatbot.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "todo-chatbot.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "todo-chatbot.labels" -}}
helm.sh/chart: {{ include "todo-chatbot.chart" . }}
{{ include "todo-chatbot.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "todo-chatbot.selectorLabels" -}}
app.kubernetes.io/name: {{ include "todo-chatbot.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

### Step 5: Generate Deployment Scripts

#### Minikube Deployment Script (`scripts/deploy-minikube.sh`)

```bash
#!/bin/bash
set -e

echo "🚀 Phase 4: Deploying Todo Chatbot to Minikube"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v minikube &> /dev/null; then
    echo -e "${RED}❌ Minikube not found. Please install: https://minikube.sigs.k8s.io/docs/start/${NC}"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install: https://kubernetes.io/docs/tasks/tools/${NC}"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    echo -e "${RED}❌ Helm not found. Please install: https://helm.sh/docs/intro/install/${NC}"
    exit 1
fi

# Start Minikube if not running
echo -e "${YELLOW}Starting Minikube...${NC}"
if minikube status | grep -q "host: Running"; then
    echo -e "${GREEN}✅ Minikube already running${NC}"
else
    minikube start --cpus=4 --memory=4096 --disk-size=20g
    echo -e "${GREEN}✅ Minikube started${NC}"
fi

# Configure Docker to use Minikube's Docker daemon
echo -e "${YELLOW}Configuring Docker environment...${NC}"
eval $(minikube docker-env)

# Build Docker images
echo -e "${YELLOW}Building Docker images...${NC}"
echo "Building backend..."
docker build -t todo-backend:latest -f backend/Dockerfile backend/

echo "Building frontend..."
docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/

echo -e "${GREEN}✅ Docker images built${NC}"

# Create namespace
echo -e "${YELLOW}Creating namespace...${NC}"
kubectl create namespace todo-chatbot --dry-run=client -o yaml | kubectl apply -f -

# Create secrets (from .env file or prompt)
echo -e "${YELLOW}Creating secrets...${NC}"
if [ -f ".env" ]; then
    kubectl create secret generic todo-secrets \
        --from-env-file=.env \
        --namespace=todo-chatbot \
        --dry-run=client -o yaml | kubectl apply -f -
    echo -e "${GREEN}✅ Secrets created from .env file${NC}"
else
    echo -e "${RED}⚠️  No .env file found. You'll need to create secrets manually:${NC}"
    echo "kubectl create secret generic todo-secrets \\"
    echo "  --from-literal=database-url=YOUR_DATABASE_URL \\"
    echo "  --from-literal=auth-secret=YOUR_AUTH_SECRET \\"
    echo "  --from-literal=openai-api-key=YOUR_OPENAI_KEY \\"
    echo "  --from-literal=openai-domain-key=YOUR_DOMAIN_KEY \\"
    echo "  --namespace=todo-chatbot"
fi

# Deploy using Helm
echo -e "${YELLOW}Deploying with Helm...${NC}"
helm upgrade --install todo-chatbot ./helm/todo-chatbot \
    --namespace todo-chatbot \
    --create-namespace \
    --wait \
    --timeout 5m

echo -e "${GREEN}✅ Deployment complete!${NC}"

# Wait for pods to be ready
echo -e "${YELLOW}Waiting for pods to be ready...${NC}"
kubectl wait --for=condition=ready pod \
    --selector=app.kubernetes.io/instance=todo-chatbot \
    --namespace=todo-chatbot \
    --timeout=300s

# Display status
echo -e "${GREEN}📊 Deployment Status:${NC}"
kubectl get pods -n todo-chatbot
kubectl get services -n todo-chatbot

# Get access URL
echo -e "${GREEN}🌐 Access your application:${NC}"
minikube service todo-chatbot-frontend -n todo-chatbot --url

echo ""
echo -e "${GREEN}✨ Deployment successful!${NC}"
echo "To access the application:"
echo "  minikube service todo-chatbot-frontend -n todo-chatbot"
echo ""
echo "To view logs:"
echo "  kubectl logs -f deployment/todo-chatbot-backend -n todo-chatbot"
echo "  kubectl logs -f deployment/todo-chatbot-frontend -n todo-chatbot"
```

### Step 6: Generate Documentation

#### README.md (`k8s/README.md`)

```markdown
# Phase 4: Kubernetes Deployment

This directory contains all Kubernetes manifests and Helm charts for deploying the Todo Chatbot to Minikube and cloud platforms.

## Quick Start (Minikube)

### Prerequisites

1. **Minikube** (v1.32+): [Install Guide](https://minikube.sigs.k8s.io/docs/start/)
2. **kubectl** (v1.28+): [Install Guide](https://kubernetes.io/docs/tasks/tools/)
3. **Helm** (v3.12+): [Install Guide](https://helm.sh/docs/intro/install/)
4. **Docker Desktop** (v4.38+): [Install Guide](https://docs.docker.com/desktop/)

### Deployment Steps

1. **Start Minikube**:
   ```bash
   minikube start --cpus=4 --memory=4096 --disk-size=20g
   ```

2. **Configure Docker environment**:
   ```bash
   eval $(minikube docker-env)
   ```

3. **Build Docker images**:
   ```bash
   docker build -t todo-backend:latest -f backend/Dockerfile backend/
   docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/
   ```

4. **Create secrets** (replace with actual values):
   ```bash
   kubectl create secret generic todo-secrets \
     --from-literal=database-url="YOUR_NEON_DATABASE_URL" \
     --from-literal=auth-secret="YOUR_BETTER_AUTH_SECRET" \
     --from-literal=openai-api-key="YOUR_OPENAI_API_KEY" \
     --from-literal=openai-domain-key="YOUR_OPENAI_DOMAIN_KEY" \
     --namespace=todo-chatbot
   ```

5. **Deploy with Helm**:
   ```bash
   helm install todo-chatbot ./helm/todo-chatbot \
     --namespace todo-chatbot \
     --create-namespace
   ```

6. **Access the application**:
   ```bash
   minikube service todo-chatbot-frontend -n todo-chatbot
   ```

## AI-Assisted Operations

### Using kubectl-ai

```bash
# Deploy with AI assistance
kubectl-ai "deploy the todo frontend with 2 replicas"

# Scale services
kubectl-ai "scale the backend to 5 replicas"

# Troubleshoot
kubectl-ai "check why pods are failing in todo-chatbot namespace"
```

### Using kagent

```bash
# Analyze cluster health
kagent "analyze the cluster health for todo-chatbot"

# Optimize resources
kagent "optimize resource allocation for todo-chatbot namespace"
```

### Using Docker AI (Gordon)

```bash
# Analyze images
docker ai "analyze the todo-backend image for optimization opportunities"

# Generate Dockerfile
docker ai "create an optimized Dockerfile for this Python FastAPI project"
```

## Verification

```bash
# Check pod status
kubectl get pods -n todo-chatbot

# Check services
kubectl get services -n todo-chatbot

# View logs
kubectl logs -f deployment/todo-chatbot-backend -n todo-chatbot
kubectl logs -f deployment/todo-chatbot-frontend -n todo-chatbot

# Test backend health
kubectl port-forward service/todo-backend 8000:8000 -n todo-chatbot
curl http://localhost:8000/health

# Test frontend
kubectl port-forward service/todo-frontend 3000:80 -n todo-chatbot
# Open http://localhost:3000 in browser
```

## Troubleshooting

### Pods not starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n todo-chatbot

# Check logs
kubectl logs <pod-name> -n todo-chatbot

# Check if images are available
minikube ssh docker images | grep todo
```

### Out of resources

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n todo-chatbot

# Increase Minikube resources
minikube stop
minikube start --cpus=4 --memory=8192
```

### Image pull errors

```bash
# Ensure using Minikube's Docker daemon
eval $(minikube docker-env)

# Rebuild images
docker build -t todo-backend:latest -f backend/Dockerfile backend/
docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/
```

## Helm Commands

```bash
# Install
helm install todo-chatbot ./helm/todo-chatbot -n todo-chatbot

# Upgrade
helm upgrade todo-chatbot ./helm/todo-chatbot -n todo-chatbot

# Rollback
helm rollback todo-chatbot -n todo-chatbot

# Uninstall
helm uninstall todo-chatbot -n todo-chatbot

# List releases
helm list -n todo-chatbot

# Lint chart
helm lint ./helm/todo-chatbot

# Template (dry-run)
helm template todo-chatbot ./helm/todo-chatbot
```

## Cleanup

```bash
# Delete deployment
helm uninstall todo-chatbot -n todo-chatbot

# Delete namespace
kubectl delete namespace todo-chatbot

# Stop Minikube
minikube stop

# Delete Minikube cluster
minikube delete
```
```

## Usage Examples

### Generate Complete Blueprint

```bash
# Run the skill
/phase4-k8s-blueprint

# Or invoke manually
"Generate complete Phase 4 Kubernetes deployment blueprint including Dockerfiles, manifests, Helm charts, and documentation"
```

### Customize Generation

The skill will:
1. Read existing Phase 3 application structure
2. Analyze dependencies and configuration
3. Generate all artifacts in appropriate locations
4. Create deployment scripts and documentation
5. Provide next steps and verification commands

## File Structure Created

```
project-root/
├── frontend/
│   ├── Dockerfile
│   └── .dockerignore
├── backend/
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml
├── k8s/
│   ├── README.md
│   └── base/
│       ├── namespace.yaml
│       ├── backend-deployment.yaml
│       ├── frontend-deployment.yaml
│       ├── services.yaml
│       ├── configmap.yaml
│       ├── secret-template.yaml
│       └── hpa.yaml
├── helm/
│   └── todo-chatbot/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-dev.yaml
│       ├── values-staging.yaml
│       ├── values-prod.yaml
│       └── templates/
│           ├── _helpers.tpl
│           ├── namespace.yaml
│           ├── backend-deployment.yaml
│           ├── frontend-deployment.yaml
│           ├── backend-service.yaml
│           ├── frontend-service.yaml
│           ├── configmap.yaml
│           ├── secrets.yaml
│           ├── hpa.yaml
│           └── NOTES.txt
└── scripts/
    ├── deploy-minikube.sh
    ├── build-images.sh
    └── cleanup.sh
```

## Best Practices Implemented

1. **Security**
   - Non-root users in containers
   - Secret management for sensitive data
   - Resource limits to prevent DoS

2. **Reliability**
   - Health checks (liveness and readiness probes)
   - Rolling updates with zero downtime
   - Horizontal pod autoscaling

3. **Performance**
   - Multi-stage Docker builds
   - Layer caching optimization
   - Proper resource requests and limits

4. **Maintainability**
   - Helm charts for configuration management
   - Environment-specific value files
   - Comprehensive documentation

## References

- [Official Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Helm Best Practices (2026)](https://helm.sh/docs/chart_best_practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## Support

For issues or questions:
1. Check the troubleshooting guide in `k8s/README.md`
2. Review Phase 4 specification: `specs/001-local-k8s-deployment/spec.md`
3. Use AI tools (kubectl-ai, kagent) for intelligent troubleshooting
