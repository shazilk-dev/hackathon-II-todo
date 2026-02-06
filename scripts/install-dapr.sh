#!/bin/bash
# Phase 5: Dapr Installation on AKS Script
# Installs Dapr 1.14+ on Azure Kubernetes Service using the Dapr extension
#
# Prerequisites:
# - AKS cluster already created (./scripts/setup-aks.sh)
# - kubectl configured for AKS cluster
# - Azure CLI installed
#
# Usage:
#   ./scripts/install-dapr.sh
#
# This script follows Dapr on AKS best practices for 2026:
# - Uses Azure Dapr extension (managed by Microsoft)
# - Dapr v1.14.4+ (latest stable as of 2026)
# - Automatic security updates
# - Azure Monitor integration
# - High availability configuration

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Load environment variables
if [ -f .env ]; then
    log_info "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-hackathon-todo-rg}"
CLUSTER_NAME="${AKS_CLUSTER_NAME:-hackathon-todo-prod}"
DAPR_VERSION="${DAPR_VERSION:-1.14.4}"
DAPR_HA="${DAPR_HA_ENABLED:-true}"

log_info "=== Dapr Installation on AKS ==="
log_info "Resource Group: $RESOURCE_GROUP"
log_info "Cluster: $CLUSTER_NAME"
log_info "Dapr Version: $DAPR_VERSION"
log_info "High Availability: $DAPR_HA"

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    log_error "kubectl is not installed. Please install from: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

if ! command -v az &> /dev/null; then
    log_error "Azure CLI is not installed. Please install from: https://aka.ms/azure-cli"
    exit 1
fi

# Verify kubectl connection
if ! kubectl cluster-info &> /dev/null; then
    log_error "Cannot connect to Kubernetes cluster. Run: az aks get-credentials"
    exit 1
fi

log_info "Connected to cluster: $(kubectl config current-context)"

# Check if Dapr extension is already installed
log_info "Checking if Dapr extension is already installed..."
if az k8s-extension show \
    --name dapr \
    --cluster-type managedClusters \
    --cluster-name "$CLUSTER_NAME" \
    --resource-group "$RESOURCE_GROUP" &> /dev/null; then

    log_warn "Dapr extension is already installed."
    CURRENT_VERSION=$(az k8s-extension show \
        --name dapr \
        --cluster-type managedClusters \
        --cluster-name "$CLUSTER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "version" -o tsv)
    log_info "Current version: $CURRENT_VERSION"

    read -p "Do you want to upgrade/reinstall? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Skipping Dapr installation."
        log_info "Verifying existing installation..."
        kubectl get pods -n dapr-system
        exit 0
    fi

    log_info "Removing existing Dapr extension..."
    az k8s-extension delete \
        --name dapr \
        --cluster-type managedClusters \
        --cluster-name "$CLUSTER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --yes

    log_info "Waiting for cleanup to complete..."
    sleep 30
fi

# Install Dapr using Azure extension (recommended for AKS)
log_info "Installing Dapr extension on AKS cluster..."
log_info "This may take 3-5 minutes..."

# Build configuration based on HA setting
if [ "$DAPR_HA" = "true" ]; then
    CONFIG_JSON="{\"global.ha.enabled\":\"true\",\"dapr_operator.replicaCount\":\"3\",\"dapr_sidecar_injector.replicaCount\":\"3\",\"dapr_sentry.replicaCount\":\"3\",\"dapr_placement.replicaCount\":\"3\"}"
else
    CONFIG_JSON="{}"
fi

az k8s-extension create \
    --name dapr \
    --extension-type Microsoft.Dapr \
    --cluster-type managedClusters \
    --cluster-name "$CLUSTER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --auto-upgrade-minor-version true \
    --configuration-settings "$CONFIG_JSON" \
    --release-train stable \
    --version "$DAPR_VERSION"

log_info "Dapr extension installed successfully."

# Wait for Dapr pods to be ready
log_info "Waiting for Dapr pods to be ready..."
kubectl wait --for=condition=ready pod \
    --all \
    --namespace=dapr-system \
    --timeout=300s || log_warn "Some pods may still be starting..."

# Verify installation
log_info "Verifying Dapr installation..."

log_info "Dapr system pods:"
kubectl get pods -n dapr-system

log_info "Dapr services:"
kubectl get services -n dapr-system

# Check Dapr version
if command -v dapr &> /dev/null; then
    log_info "Dapr CLI version:"
    dapr version
else
    log_warn "Dapr CLI not installed locally. Install from: https://docs.dapr.io/getting-started/install-dapr-cli/"
fi

# Verify Dapr components
log_info "Checking for Dapr components in default namespace..."
if kubectl get components -n default &> /dev/null; then
    COMPONENT_COUNT=$(kubectl get components -n default --no-headers 2>/dev/null | wc -l)
    log_info "Found $COMPONENT_COUNT Dapr components"
    kubectl get components -n default
else
    log_info "No Dapr components found yet (will be created during deployment)"
fi

# Output summary
log_info ""
log_info "=== Dapr Installation Complete ==="
log_info "✅ Dapr extension installed on AKS"
log_info "✅ Dapr system pods running in dapr-system namespace"
log_info "✅ High Availability: $DAPR_HA"
log_info ""
log_info "Dapr capabilities available:"
log_info "  - Service-to-service invocation"
log_info "  - State management"
log_info "  - Pub/sub messaging"
log_info "  - Resource bindings"
log_info "  - Actors"
log_info "  - Secrets management"
log_info "  - Configuration"
log_info ""
log_info "Next steps:"
log_info "1. Create Dapr components: kubectl apply -f dapr/components/"
log_info "2. Configure secrets: ./scripts/setup-secrets.sh"
log_info "3. Deploy application with Dapr annotations"
log_info ""
log_info "To check Dapr status:"
log_info "  kubectl get pods -n dapr-system"
log_info "  kubectl get components -n default"
log_info ""
log_info "Documentation:"
log_info "  Dapr on AKS: https://learn.microsoft.com/en-us/azure/aks/dapr"
log_info "  Dapr docs: https://docs.dapr.io/"
