#!/bin/bash
# Stop AKS Cluster to Save Money
# Run this at the end of the day to stop paying for compute
#
# When stopped:
# - Compute nodes are deallocated (no charges)
# - Storage, networking still incur minimal charges
# - Estimated savings: 70-80% of compute costs
#
# Usage:
#   ./scripts/stop-cluster.sh

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

log_info "=== Stop AKS Cluster (Save Money) ==="
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

if [ "$CURRENT_STATE" = "Stopped" ]; then
    log_warn "Cluster is already stopped"
    log_info "To start: ./scripts/start-cluster.sh"
    exit 0
fi

log_warn "This will stop the cluster and deallocate compute resources"
log_warn "Your application will be unavailable until you start it again"
log_info ""
log_info "💰 Cost Impact:"
log_info "   While stopped: Save ~70-80% on compute costs"
log_info "   Small charges still apply for: Storage, Load Balancer, Public IP"
log_info ""

read -p "Stop cluster now? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Cancelled"
    exit 0
fi

log_info "Stopping cluster (this may take 2-3 minutes)..."

az aks stop \
    --name "$CLUSTER_NAME" \
    --resource-group "$RESOURCE_GROUP"

log_info ""
log_info "✅ Cluster stopped successfully!"
log_info ""
log_info "What this means:"
log_info "  ✅ Compute nodes deallocated (no VM charges)"
log_info "  ✅ Persistent volumes preserved"
log_info "  ✅ Configurations and deployments preserved"
log_info "  ⚠️  Application is OFFLINE"
log_info ""
log_info "To start cluster again:"
log_info "  ./scripts/start-cluster.sh"
log_info ""
log_info "💡 Tip: Make this part of your daily routine!"
log_info "   End of day:   ./scripts/stop-cluster.sh"
log_info "   Start of day: ./scripts/start-cluster.sh"
