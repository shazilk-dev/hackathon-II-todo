#!/bin/bash
# Phase 5: Azure AKS Cluster Setup Script
# Creates Azure resource group and AKS cluster with production best practices
#
# Prerequisites:
# - Azure CLI installed (az --version)
# - Azure account with appropriate permissions
# - Environment variables set (source .env or export manually)
#
# Usage:
#   ./scripts/setup-aks.sh
#
# This script follows Azure AKS best practices for 2026:
# - Azure Linux 3 for enhanced security
# - Azure CNI for better network performance
# - Cluster autoscaler for dynamic scaling
# - Azure Monitor integration for observability
# - RBAC enabled for access control
# - System node pool separated from user workloads

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment variables from .env if exists
if [ -f .env ]; then
    log_info "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    log_warn ".env file not found. Using environment variables or defaults."
fi

# Configuration with defaults (STUDENT/HACKATHON BUDGET-FRIENDLY)
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-hackathon-todo-rg}"
CLUSTER_NAME="${AKS_CLUSTER_NAME:-hackathon-todo-dev}"
LOCATION="${AZURE_LOCATION:-centralindia}"  # centralindia or southeastasia for Asia, eastus for cheapest
NODE_COUNT="${AKS_NODE_COUNT:-1}"  # Single node for budget (was 2)
MIN_NODE_COUNT="${AKS_MIN_NODES:-1}"  # Reduced from 2
MAX_NODE_COUNT="${AKS_MAX_NODES:-2}"  # Reduced from 5
VM_SIZE="${AKS_VM_SIZE:-Standard_B2s}"  # Burstable VMs ~$15-20/month (was Standard_D2s_v3 ~$70/month)
KUBERNETES_VERSION="${AKS_K8S_VERSION:-1.34}"
AKS_TIER="${AKS_TIER:-Free}"  # Free tier for dev/test (was Standard)
ACR_NAME="${ACR_NAME:-hackathontodoacr}"

log_warn "⚠️  STUDENT/HACKATHON MODE: Budget-optimized configuration"
log_warn "   VM Size: $VM_SIZE (Burstable, ~\$15-20/month vs Standard_D2s_v3 ~\$70/month)"
log_warn "   Node Count: $NODE_COUNT (was 2 in production)"
log_warn "   AKS Tier: $AKS_TIER (was Standard)"
log_warn "   Estimated cost: ~\$20-25/month (vs ~\$175/month production)"
log_warn ""
log_warn "💡 COST SAVING TIP: Stop cluster when not in use!"
log_warn "   Stop:  az aks stop --name $CLUSTER_NAME --resource-group $RESOURCE_GROUP"
log_warn "   Start: az aks start --name $CLUSTER_NAME --resource-group $RESOURCE_GROUP"
log_warn ""

log_info "=== Azure AKS Cluster Setup ==="
log_info "Resource Group: $RESOURCE_GROUP"
log_info "Cluster Name: $CLUSTER_NAME"
log_info "Location: $LOCATION"
log_info "Node Count: $NODE_COUNT (autoscale: $MIN_NODE_COUNT-$MAX_NODE_COUNT)"
log_info "VM Size: $VM_SIZE"
log_info "Kubernetes Version: $KUBERNETES_VERSION"
log_info "ACR Name: $ACR_NAME"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    log_error "Azure CLI is not installed. Please install from: https://aka.ms/azure-cli"
    exit 1
fi

log_info "Azure CLI version: $(az version --query '\"azure-cli\"' -o tsv)"

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    log_error "Not logged in to Azure. Run: az login"
    exit 1
fi

SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
log_info "Using Azure subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"

# Step 1: Create Resource Group
log_info "Step 1/5: Creating resource group '$RESOURCE_GROUP' in '$LOCATION'..."
if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    log_warn "Resource group '$RESOURCE_GROUP' already exists. Skipping creation."
else
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --tags "Project=HackathonTodo" "Environment=Production" "ManagedBy=CLI"
    log_info "Resource group created successfully."
fi

# Step 2: Create Azure Container Registry (ACR)
log_info "Step 2/5: Creating Azure Container Registry '$ACR_NAME'..."
if az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log_warn "ACR '$ACR_NAME' already exists. Skipping creation."
else
    az acr create \
        --name "$ACR_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku Basic \
        --admin-enabled true \
        --tags "Project=HackathonTodo"
    log_info "ACR created successfully."
fi

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query loginServer -o tsv)
log_info "ACR Login Server: $ACR_LOGIN_SERVER"

# Step 3: Create AKS Cluster
log_info "Step 3/5: Creating AKS cluster '$CLUSTER_NAME'..."
log_info "This may take 10-15 minutes..."

if az aks show --name "$CLUSTER_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log_warn "AKS cluster '$CLUSTER_NAME' already exists. Skipping creation."
else
    # Get latest Kubernetes version if not specified
    if [ "$KUBERNETES_VERSION" = "latest" ]; then
        KUBERNETES_VERSION=$(az aks get-versions \
            --location "$LOCATION" \
            --query "values[?isPreview==null].patchVersions.keys(@)[-1]" \
            --output tsv | sort -V | tail -1)
        log_info "Using latest Kubernetes version: $KUBERNETES_VERSION"
    fi

    # Student/Hackathon optimized: Free tier, single node, no auto-scaling initially
    az aks create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$CLUSTER_NAME" \
        --location "$LOCATION" \
        --kubernetes-version "$KUBERNETES_VERSION" \
        --node-count "$NODE_COUNT" \
        --node-vm-size "$VM_SIZE" \
        --tier "$AKS_TIER" \
        --network-plugin azure \
        --load-balancer-sku standard \
        --enable-managed-identity \
        --attach-acr "$ACR_NAME" \
        --generate-ssh-keys \
        --tags "Project=HackathonTodo" "Environment=Dev" "ManagedBy=CLI" "CostCenter=Student"

    # Note: Removed for budget:
    # - --enable-cluster-autoscaler (can add later if needed)
    # - --enable-azure-rbac (not critical for learning)
    # - --enable-addons monitoring (use kubectl logs instead to save cost)

    log_info "AKS cluster created successfully."
fi

# Step 4: Get AKS Credentials
log_info "Step 4/5: Configuring kubectl credentials..."
az aks get-credentials \
    --resource-group "$RESOURCE_GROUP" \
    --name "$CLUSTER_NAME" \
    --overwrite-existing

log_info "kubectl configured successfully."

# Step 5: Verify Cluster
log_info "Step 5/5: Verifying cluster setup..."

# Check kubectl connection
if ! kubectl cluster-info &> /dev/null; then
    log_error "Failed to connect to AKS cluster with kubectl"
    exit 1
fi

log_info "Cluster info:"
kubectl cluster-info

log_info "Node status:"
kubectl get nodes

log_info "Checking cluster version:"
kubectl version --short

# Output summary
log_info ""
log_info "=== Setup Complete ==="
log_info "✅ Resource Group: $RESOURCE_GROUP"
log_info "✅ ACR: $ACR_LOGIN_SERVER"
log_info "✅ AKS Cluster: $CLUSTER_NAME"
log_info "✅ Nodes: $(kubectl get nodes --no-headers | wc -l) running"
log_info ""
log_info "Next steps:"
log_info "1. Install Dapr: ./scripts/install-dapr.sh"
log_info "2. Configure secrets: ./scripts/setup-secrets.sh"
log_info "3. Deploy application: ./scripts/deploy.sh"
log_info ""
log_info "💰 CRITICAL: Save money when not using the cluster!"
log_info "Stop cluster (end of day): ./scripts/stop-cluster.sh"
log_info "Start cluster (next day):  ./scripts/start-cluster.sh"
log_info ""
log_info "To access the cluster:"
log_info "  kubectl get pods --all-namespaces"
log_info "  kubectl get services --all-namespaces"
log_info ""
log_info "To view cluster in Azure Portal:"
log_info "  https://portal.azure.com/#resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerService/managedClusters/$CLUSTER_NAME/overview"
log_info ""
log_info "💡 Cost Estimate:"
log_info "   Running 24/7: ~\$20-25/month"
log_info "   With daily stop/start (8 hours/day): ~\$8-10/month"
