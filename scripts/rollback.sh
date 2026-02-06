#!/bin/bash
# Phase 5: Rollback Script
# Rolls back the Helm deployment to a previous revision
#
# Prerequisites:
# - Helm deployment exists
# - kubectl configured for AKS cluster
#
# Usage:
#   ./scripts/rollback.sh [REVISION]
#
# Examples:
#   ./scripts/rollback.sh           # Rollback to previous revision
#   ./scripts/rollback.sh 5         # Rollback to specific revision
#   ./scripts/rollback.sh 0         # Rollback to previous (same as no arg)

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Configuration
REVISION="${1:-0}"  # 0 means previous revision
NAMESPACE="${K8S_NAMESPACE:-default}"
HELM_RELEASE="${HELM_RELEASE_NAME:-hackathon-todo}"

log_info "=== Helm Rollback ==="
log_info "Release: $HELM_RELEASE"
log_info "Namespace: $NAMESPACE"
log_info "Target Revision: ${REVISION} (0 = previous)"

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    log_error "kubectl is not installed"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    log_error "Helm is not installed"
    exit 1
fi

# Verify cluster connection
if ! kubectl cluster-info &> /dev/null; then
    log_error "Cannot connect to Kubernetes cluster"
    exit 1
fi

CURRENT_CONTEXT=$(kubectl config current-context)
log_info "Connected to: $CURRENT_CONTEXT"

# Step 1: View deployment history
log_step "Step 1/4: Viewing deployment history..."
log_info ""

if ! helm list -n "$NAMESPACE" | grep -q "$HELM_RELEASE"; then
    log_error "Helm release '$HELM_RELEASE' not found in namespace '$NAMESPACE'"
    log_info "Available releases:"
    helm list -n "$NAMESPACE"
    exit 1
fi

helm history "$HELM_RELEASE" -n "$NAMESPACE" --max 10

log_info ""
CURRENT_REVISION=$(helm list -n "$NAMESPACE" -o json | jq -r ".[] | select(.name==\"$HELM_RELEASE\") | .revision")
log_info "Current revision: $CURRENT_REVISION"

# Determine target revision
if [ "$REVISION" = "0" ]; then
    if [ "$CURRENT_REVISION" -le 1 ]; then
        log_error "Cannot rollback: current revision is $CURRENT_REVISION (no previous revision)"
        exit 1
    fi
    TARGET_REVISION=$((CURRENT_REVISION - 1))
    log_info "Target revision: $TARGET_REVISION (previous)"
else
    TARGET_REVISION=$REVISION
    log_info "Target revision: $TARGET_REVISION (specified)"
fi

# Validate target revision exists
if ! helm history "$HELM_RELEASE" -n "$NAMESPACE" | grep -q "^\s*$TARGET_REVISION\s"; then
    log_error "Revision $TARGET_REVISION not found in deployment history"
    exit 1
fi

# Step 2: Confirm rollback
log_warn ""
log_warn "⚠️  You are about to rollback the deployment:"
log_warn "   Context: $CURRENT_CONTEXT"
log_warn "   Release: $HELM_RELEASE"
log_warn "   Namespace: $NAMESPACE"
log_warn "   Current: revision $CURRENT_REVISION"
log_warn "   Target:  revision $TARGET_REVISION"
log_warn ""

read -p "Continue with rollback? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Rollback cancelled"
    exit 0
fi

# Step 3: Perform rollback
log_step "Step 2/4: Rolling back deployment..."

helm rollback "$HELM_RELEASE" "$TARGET_REVISION" \
    --namespace "$NAMESPACE" \
    --wait \
    --timeout 5m \
    --cleanup-on-fail

log_info "✅ Rollback initiated"

# Step 4: Wait for rollout
log_step "Step 3/4: Waiting for rollout to complete..."

# Get deployment names
BACKEND_DEPLOYMENT=$(kubectl get deployment -n "$NAMESPACE" -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
FRONTEND_DEPLOYMENT=$(kubectl get deployment -n "$NAMESPACE" -l app.kubernetes.io/component=frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -n "$BACKEND_DEPLOYMENT" ]; then
    log_info "Waiting for backend rollout..."
    kubectl rollout status deployment/"$BACKEND_DEPLOYMENT" -n "$NAMESPACE" --timeout=5m
    log_info "✅ Backend rollback complete"
fi

if [ -n "$FRONTEND_DEPLOYMENT" ]; then
    log_info "Waiting for frontend rollout..."
    kubectl rollout status deployment/"$FRONTEND_DEPLOYMENT" -n "$NAMESPACE" --timeout=5m
    log_info "✅ Frontend rollback complete"
fi

# Step 5: Verify rollback
log_step "Step 4/4: Verifying rollback..."

# Check pod status
log_info "Pod status:"
kubectl get pods -n "$NAMESPACE"

# Check current revision
NEW_REVISION=$(helm list -n "$NAMESPACE" -o json | jq -r ".[] | select(.name==\"$HELM_RELEASE\") | .revision")
log_info ""
log_info "Revision after rollback: $NEW_REVISION"

# Run health checks
if [ -n "$BACKEND_DEPLOYMENT" ]; then
    BACKEND_POD=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -n "$BACKEND_POD" ]; then
        log_info "Testing backend health..."
        HEALTH=$(kubectl exec -n "$NAMESPACE" "$BACKEND_POD" -- curl -s http://localhost:8000/health 2>/dev/null || echo "{}")
        if echo "$HEALTH" | grep -q "healthy"; then
            log_info "✅ Backend health check passed"
        else
            log_warn "⚠️  Backend health check returned unexpected response"
        fi
    fi
fi

# Output summary
log_info ""
log_info "=== Rollback Summary ==="
log_info "✅ Rollback completed successfully!"
log_info ""
log_info "Release: $HELM_RELEASE"
log_info "Namespace: $NAMESPACE"
log_info "Rolled back: revision $CURRENT_REVISION → revision $TARGET_REVISION"
log_info "Current revision: $NEW_REVISION"
log_info ""
log_info "Deployment history:"
helm history "$HELM_RELEASE" -n "$NAMESPACE" --max 5
log_info ""
log_info "Useful commands:"
log_info "  View pods:     kubectl get pods -n $NAMESPACE"
log_info "  View logs:     kubectl logs -n $NAMESPACE -l app.kubernetes.io/component=backend"
log_info "  Full history:  helm history $HELM_RELEASE -n $NAMESPACE"
log_info ""
