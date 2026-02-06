#!/bin/bash
# Start AKS Cluster
# Run this to resume the cluster after stopping it
#
# Usage:
#   ./scripts/start-cluster.sh

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-hackathon-todo-rg}"
CLUSTER_NAME="${AKS_CLUSTER_NAME:-hackathon-todo-dev}"

log_info "=== Start AKS Cluster ==="
log_info "Resource Group: $RESOURCE_GROUP"
log_info "Cluster: $CLUSTER_NAME"
log_info ""

# Check Azure CLI
if ! command -v az &> /dev/null; then
    log_error "Azure CLI not installed"
    exit 1
fi

# Check login
if ! az account show &> /dev/null; then
    log_error "Not logged in to Azure. Run: az login"
    exit 1
fi

# Check if cluster exists
if ! az aks show --name "$CLUSTER_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log_error "Cluster '$CLUSTER_NAME' not found in resource group '$RESOURCE_GROUP'"
    exit 1
fi

# Check current state
CURRENT_STATE=$(az aks show --name "$CLUSTER_NAME" --resource-group "$RESOURCE_GROUP" --query powerState.code -o tsv)

if [ "$CURRENT_STATE" = "Running" ]; then
    log_info "Cluster is already running"
    log_info "Pods status:"
    kubectl get pods -n default 2>/dev/null || log_warn "Run: az aks get-credentials first"
    exit 0
fi

log_info "Starting cluster (this may take 3-5 minutes)..."

az aks start \
    --name "$CLUSTER_NAME" \
    --resource-group "$RESOURCE_GROUP"

log_info ""
log_info "Refreshing kubectl credentials..."
az aks get-credentials \
    --resource-group "$RESOURCE_GROUP" \
    --name "$CLUSTER_NAME" \
    --overwrite-existing

log_info ""
log_info "Waiting for pods to be ready (up to 2 minutes)..."
sleep 30  # Give pods time to start

# Check pod status
if kubectl get pods -n default &> /dev/null; then
    log_info "Pod status:"
    kubectl get pods -n default
else
    log_warn "Could not get pod status. Cluster may still be initializing."
fi

log_info ""
log_info "✅ Cluster started successfully!"
log_info ""
log_info "Next steps:"
log_info "  Check pods:     kubectl get pods -n default"
log_info "  Check services: kubectl get services -n default"
log_info "  View logs:      kubectl logs -n default -l app.kubernetes.io/component=backend"
log_info ""
log_info "💰 Remember: Stop cluster when done to save money!"
log_info "  ./scripts/stop-cluster.sh"
