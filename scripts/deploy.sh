#!/bin/bash
# Phase 5: Manual Deployment Script
# Deploys the application to AKS using Helm
#
# Prerequisites:
# - AKS cluster created and configured (./scripts/setup-aks.sh)
# - Dapr installed (./scripts/install-dapr.sh)
# - Secrets configured (./scripts/setup-secrets.sh)
# - Docker images built and pushed to ACR
#
# Usage:
#   ./scripts/deploy.sh [IMAGE_TAG]
#
# Examples:
#   ./scripts/deploy.sh latest          # Deploy latest images
#   ./scripts/deploy.sh abc123f         # Deploy specific commit SHA
#   ./scripts/deploy.sh                 # Deploy latest (default)

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuration
IMAGE_TAG="${1:-latest}"
NAMESPACE="${K8S_NAMESPACE:-default}"
HELM_RELEASE="${HELM_RELEASE_NAME:-hackathon-todo}"
HELM_CHART="./helm/todo-chatbot"
VALUES_FILE="values-prod.yaml"
ACR_NAME="${ACR_NAME:-hackathontodoacr}"
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"

log_info "=== Azure AKS Deployment ==="
log_info "Release: $HELM_RELEASE"
log_info "Namespace: $NAMESPACE"
log_info "Image Tag: $IMAGE_TAG"
log_info "ACR: $ACR_LOGIN_SERVER"

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    log_error "kubectl is not installed"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    log_error "Helm is not installed"
    exit 1
fi

# Verify kubectl connection
if ! kubectl cluster-info &> /dev/null; then
    log_error "Cannot connect to Kubernetes cluster"
    log_error "Run: az aks get-credentials --resource-group <rg> --name <cluster>"
    exit 1
fi

CURRENT_CONTEXT=$(kubectl config current-context)
log_info "Connected to: $CURRENT_CONTEXT"

# Confirm deployment
log_warn "You are about to deploy to: $CURRENT_CONTEXT"
log_warn "Namespace: $NAMESPACE"
log_warn "Image tag: $IMAGE_TAG"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Deployment cancelled"
    exit 0
fi

# Step 1: Apply Dapr components
log_step "Step 1/6: Applying Dapr components..."
if [ -d "dapr/components" ]; then
    kubectl apply -f dapr/components/ --namespace "$NAMESPACE"
    log_info "✅ Dapr components applied"
else
    log_warn "dapr/components directory not found. Skipping..."
fi

if [ -d "dapr/configuration" ]; then
    kubectl apply -f dapr/configuration/ --namespace "$NAMESPACE"
    log_info "✅ Dapr configuration applied"
else
    log_warn "dapr/configuration directory not found. Skipping..."
fi

# Step 2: Verify secrets exist
log_step "Step 2/6: Verifying Kubernetes secrets..."
REQUIRED_SECRETS=("database-credentials" "openai-credentials" "auth-credentials")
MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! kubectl get secret "$secret" -n "$NAMESPACE" &> /dev/null; then
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    log_error "Missing required secrets: ${MISSING_SECRETS[*]}"
    log_error "Run: ./scripts/setup-secrets.sh"
    exit 1
fi

log_info "✅ All required secrets exist"

# Step 3: Build and push Docker images (if needed)
log_step "Step 3/6: Checking Docker images..."
if [ "$IMAGE_TAG" != "latest" ]; then
    log_info "Using existing images with tag: $IMAGE_TAG"
else
    log_warn "Deploying 'latest' tag. Consider using specific version tags in production."

    # Ask if user wants to build new images
    read -p "Build and push new images? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Building and pushing Docker images..."
        if [ -f "./scripts/build-images.sh" ]; then
            ./scripts/build-images.sh
        else
            log_warn "build-images.sh not found. Skipping image build."
        fi
    fi
fi

# Step 4: Deploy with Helm
log_step "Step 4/6: Deploying with Helm..."

# Check if Helm chart exists
if [ ! -d "$HELM_CHART" ]; then
    log_error "Helm chart not found at: $HELM_CHART"
    exit 1
fi

# Perform Helm upgrade/install
log_info "Running Helm upgrade..."
helm upgrade --install "$HELM_RELEASE" "$HELM_CHART" \
    --namespace "$NAMESPACE" \
    --values "$HELM_CHART/values.yaml" \
    --values "$HELM_CHART/$VALUES_FILE" \
    --set backend.image.repository="$ACR_LOGIN_SERVER/todo-backend" \
    --set backend.image.tag="$IMAGE_TAG" \
    --set frontend.image.repository="$ACR_LOGIN_SERVER/todo-frontend" \
    --set frontend.image.tag="$IMAGE_TAG" \
    --set global.environment=production \
    --wait \
    --timeout 10m \
    --atomic \
    --cleanup-on-fail

log_info "✅ Helm deployment completed"

# Step 5: Wait for rollout
log_step "Step 5/6: Waiting for deployment rollout..."

# Get deployment names
BACKEND_DEPLOYMENT=$(kubectl get deployment -n "$NAMESPACE" -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
FRONTEND_DEPLOYMENT=$(kubectl get deployment -n "$NAMESPACE" -l app.kubernetes.io/component=frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -n "$BACKEND_DEPLOYMENT" ]; then
    log_info "Waiting for backend rollout..."
    kubectl rollout status deployment/"$BACKEND_DEPLOYMENT" -n "$NAMESPACE" --timeout=5m
    log_info "✅ Backend deployment ready"
else
    log_warn "Backend deployment not found"
fi

if [ -n "$FRONTEND_DEPLOYMENT" ]; then
    log_info "Waiting for frontend rollout..."
    kubectl rollout status deployment/"$FRONTEND_DEPLOYMENT" -n "$NAMESPACE" --timeout=5m
    log_info "✅ Frontend deployment ready"
else
    log_warn "Frontend deployment not found"
fi

# Step 6: Run smoke tests
log_step "Step 6/6: Running smoke tests..."

# Test 1: Check pod status
log_info "Checking pod status..."
PODS=$(kubectl get pods -n "$NAMESPACE" -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}')
echo "$PODS"

RUNNING_PODS=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase=Running --no-headers | wc -l)
TOTAL_PODS=$(kubectl get pods -n "$NAMESPACE" --no-headers | wc -l)

if [ "$RUNNING_PODS" -eq "$TOTAL_PODS" ]; then
    log_info "✅ All pods are running ($RUNNING_PODS/$TOTAL_PODS)"
else
    log_warn "⚠️  Some pods are not running ($RUNNING_PODS/$TOTAL_PODS)"
fi

# Test 2: Check backend health
if [ -n "$BACKEND_DEPLOYMENT" ]; then
    BACKEND_POD=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -n "$BACKEND_POD" ]; then
        log_info "Testing backend health endpoint..."
        HEALTH_RESPONSE=$(kubectl exec -n "$NAMESPACE" "$BACKEND_POD" -- curl -s http://localhost:8000/health || echo "{}")
        if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
            log_info "✅ Backend health check passed"
        else
            log_warn "⚠️  Backend health check returned unexpected response"
            echo "$HEALTH_RESPONSE"
        fi
    fi
fi

# Test 3: Get frontend URL
FRONTEND_SERVICE=$(kubectl get service -n "$NAMESPACE" -l app.kubernetes.io/component=frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$FRONTEND_SERVICE" ]; then
    SERVICE_TYPE=$(kubectl get service "$FRONTEND_SERVICE" -n "$NAMESPACE" -o jsonpath='{.spec.type}')

    if [ "$SERVICE_TYPE" = "LoadBalancer" ]; then
        log_info "Waiting for LoadBalancer IP..."
        FRONTEND_IP=$(kubectl get service "$FRONTEND_SERVICE" -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

        COUNTER=0
        MAX_WAIT=60
        while [ -z "$FRONTEND_IP" ] && [ $COUNTER -lt $MAX_WAIT ]; do
            sleep 5
            FRONTEND_IP=$(kubectl get service "$FRONTEND_SERVICE" -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
            COUNTER=$((COUNTER + 5))
        done

        if [ -n "$FRONTEND_IP" ]; then
            FRONTEND_URL="http://$FRONTEND_IP:3000"
            log_info "✅ Frontend URL: $FRONTEND_URL"

            # Test frontend accessibility
            log_info "Testing frontend accessibility..."
            if curl -s -f -m 10 "$FRONTEND_URL" > /dev/null; then
                log_info "✅ Frontend is accessible"
            else
                log_warn "⚠️  Frontend may not be accessible yet"
            fi
        else
            log_warn "⚠️  LoadBalancer IP not assigned yet (waited ${MAX_WAIT}s)"
            log_warn "Check status with: kubectl get service $FRONTEND_SERVICE -n $NAMESPACE"
        fi
    else
        log_info "Service type is $SERVICE_TYPE (not LoadBalancer)"
    fi
fi

# Output deployment summary
log_info ""
log_info "=== Deployment Summary ==="
log_info "✅ Deployment completed successfully!"
log_info ""
log_info "Deployed version: $IMAGE_TAG"
log_info "Release: $HELM_RELEASE"
log_info "Namespace: $NAMESPACE"
log_info ""

if [ -n "${FRONTEND_URL:-}" ]; then
    log_info "🌐 Application URL: $FRONTEND_URL"
fi

log_info ""
log_info "Useful commands:"
log_info "  View pods:        kubectl get pods -n $NAMESPACE"
log_info "  View services:    kubectl get services -n $NAMESPACE"
log_info "  View logs:        kubectl logs -n $NAMESPACE -l app.kubernetes.io/component=backend"
log_info "  View HPA:         kubectl get hpa -n $NAMESPACE"
log_info "  Helm history:     helm history $HELM_RELEASE -n $NAMESPACE"
log_info "  Rollback:         ./scripts/rollback.sh"
log_info ""
log_info "Monitor deployment:"
log_info "  kubectl get pods -n $NAMESPACE --watch"
log_info ""
