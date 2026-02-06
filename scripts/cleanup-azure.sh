#!/bin/bash
# Phase 5: Azure Cleanup Script
# Deletes all Azure resources to avoid ongoing charges
#
# ⚠️  WARNING: This is DESTRUCTIVE and IRREVERSIBLE
# ⚠️  This will delete:
#     - AKS cluster
#     - Container registry
#     - Load balancers
#     - Persistent volumes
#     - Entire resource group (if confirmed)
#
# Usage:
#   ./scripts/cleanup-azure.sh [--delete-resource-group]
#
# Examples:
#   ./scripts/cleanup-azure.sh                      # Delete AKS and ACR only
#   ./scripts/cleanup-azure.sh --delete-resource-group  # Delete entire RG

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

# Configuration
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-hackathon-todo-rg}"
CLUSTER_NAME="${AKS_CLUSTER_NAME:-hackathon-todo-prod}"
ACR_NAME="${ACR_NAME:-hackathontodoacr}"
DELETE_RG=false

# Parse arguments
if [ "${1:-}" = "--delete-resource-group" ]; then
    DELETE_RG=true
fi

log_warn "╔════════════════════════════════════════════════════════════╗"
log_warn "║  ⚠️  DESTRUCTIVE OPERATION - DATA WILL BE LOST  ⚠️          ║"
log_warn "╚════════════════════════════════════════════════════════════╝"
log_warn ""
log_warn "This script will DELETE the following Azure resources:"
log_warn ""
log_warn "  - AKS Cluster: $CLUSTER_NAME"
log_warn "  - Container Registry: $ACR_NAME"

if [ "$DELETE_RG" = true ]; then
    log_warn "  - Resource Group: $RESOURCE_GROUP (including ALL resources)"
fi

log_warn ""
log_warn "This action is IRREVERSIBLE. All data will be permanently lost."
log_warn ""

# Triple confirmation
read -p "Type the resource group name to confirm: " CONFIRM_RG
if [ "$CONFIRM_RG" != "$RESOURCE_GROUP" ]; then
    log_info "Resource group name doesn't match. Cleanup cancelled."
    exit 0
fi

read -p "Are you ABSOLUTELY sure you want to delete these resources? (yes/NO): " CONFIRM1
if [ "$CONFIRM1" != "yes" ]; then
    log_info "Cleanup cancelled"
    exit 0
fi

read -p "Last chance! Type 'DELETE' to proceed: " CONFIRM2
if [ "$CONFIRM2" != "DELETE" ]; then
    log_info "Cleanup cancelled"
    exit 0
fi

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

SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
log_info "Using subscription: $SUBSCRIPTION_NAME"
log_info ""

# Export current configuration before deletion
log_info "Exporting current configuration for backup..."
BACKUP_DIR="./backups/cleanup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if kubectl cluster-info &> /dev/null; then
    log_info "Backing up Kubernetes resources..."
    kubectl get all -n default -o yaml > "$BACKUP_DIR/k8s-resources.yaml" 2>/dev/null || true
    kubectl get secrets -n default -o yaml > "$BACKUP_DIR/k8s-secrets.yaml" 2>/dev/null || true
    kubectl get configmaps -n default -o yaml > "$BACKUP_DIR/k8s-configmaps.yaml" 2>/dev/null || true
fi

# Export Helm releases
if command -v helm &> /dev/null; then
    log_info "Backing up Helm releases..."
    helm list -n default -o yaml > "$BACKUP_DIR/helm-releases.yaml" 2>/dev/null || true
fi

log_info "Backup saved to: $BACKUP_DIR"
log_info ""

# Start deletion
log_info "Starting cleanup process..."
log_info ""

if [ "$DELETE_RG" = true ]; then
    # Delete entire resource group
    log_info "Deleting resource group: $RESOURCE_GROUP"
    log_info "This will delete ALL resources in the group (may take 10-15 minutes)..."

    az group delete \
        --name "$RESOURCE_GROUP" \
        --yes \
        --no-wait

    log_info "✅ Resource group deletion initiated"
    log_info "Deletion is running in background. Monitor with:"
    log_info "  az group show --name $RESOURCE_GROUP"
else
    # Delete individual resources
    log_info "Step 1/2: Deleting AKS cluster: $CLUSTER_NAME"

    if az aks show --name "$CLUSTER_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        az aks delete \
            --name "$CLUSTER_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --yes \
            --no-wait

        log_info "✅ AKS cluster deletion initiated"
    else
        log_warn "AKS cluster not found, skipping"
    fi

    log_info ""
    log_info "Step 2/2: Deleting ACR: $ACR_NAME"

    if az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        az acr delete \
            --name "$ACR_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --yes

        log_info "✅ ACR deleted"
    else
        log_warn "ACR not found, skipping"
    fi

    log_info ""
    log_info "Resource group '$RESOURCE_GROUP' still exists with remaining resources."
    log_info "To delete the entire resource group, run:"
    log_info "  ./scripts/cleanup-azure.sh --delete-resource-group"
fi

# Cleanup local kubectl context
if command -v kubectl &> /dev/null; then
    CONTEXT_NAME="$CLUSTER_NAME"
    if kubectl config get-contexts "$CONTEXT_NAME" &> /dev/null; then
        log_info "Removing kubectl context: $CONTEXT_NAME"
        kubectl config delete-context "$CONTEXT_NAME" 2>/dev/null || true
        kubectl config unset "clusters.$CLUSTER_NAME" 2>/dev/null || true
        kubectl config unset "users.clusterUser_${RESOURCE_GROUP}_${CLUSTER_NAME}" 2>/dev/null || true
        log_info "✅ Local kubectl context cleaned up"
    fi
fi

log_info ""
log_info "=== Cleanup Summary ==="
log_info ""
log_info "✅ Cleanup initiated successfully"
log_info ""

if [ "$DELETE_RG" = true ]; then
    log_info "Resource group deletion in progress: $RESOURCE_GROUP"
    log_info "This may take 10-15 minutes to complete."
    log_info ""
    log_info "Check deletion status:"
    log_info "  az group show --name $RESOURCE_GROUP"
    log_info ""
    log_info "The command will fail when deletion is complete."
else
    log_info "AKS cluster deletion in progress: $CLUSTER_NAME"
    log_info "ACR deleted: $ACR_NAME"
    log_info ""
    log_info "To delete the resource group and all remaining resources:"
    log_info "  ./scripts/cleanup-azure.sh --delete-resource-group"
fi

log_info ""
log_info "Configuration backup saved to: $BACKUP_DIR"
log_info ""
log_info "Cost Impact:"
log_info "  - Stopped incurring charges for deleted resources"
log_info "  - If resource group is not deleted, some resources may still incur charges"
log_info ""
