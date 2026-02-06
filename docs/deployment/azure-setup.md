# Azure Setup Guide

Complete guide for setting up Azure infrastructure for the Todo Chatbot production deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Azure Account Setup](#azure-account-setup)
3. [Azure CLI Installation](#azure-cli-installation)
4. [Resource Group Creation](#resource-group-creation)
5. [AKS Cluster Setup](#aks-cluster-setup)
6. [Azure Container Registry](#azure-container-registry)
7. [Service Principal for CI/CD](#service-principal-for-cicd)
8. [Cost Management](#cost-management)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Azure subscription with appropriate permissions
- Basic understanding of Kubernetes and Docker
- Command-line terminal (Bash, PowerShell, or Windows Subsystem for Linux)

## Azure Account Setup

### 1. Create Azure Account

If you don't have an Azure account:

1. Visit [https://azure.microsoft.com/free/](https://azure.microsoft.com/free/)
2. Click "Start free" or "Pay as you go"
3. Complete the signup process
4. Verify your account

**Free Tier Benefits:**
- $200 credit for 30 days (as of 2026)
- 12 months of popular services free
- Always-free services

### 2. Select Subscription

After signing in:

```bash
# List available subscriptions
az account list --output table

# Set active subscription
az account set --subscription "<subscription-id-or-name>"

# Verify current subscription
az account show
```

### 3. Register Resource Providers

Register required providers for AKS:

```bash
# Register Container Service provider
az provider register --namespace Microsoft.ContainerService

# Register Network provider
az provider register --namespace Microsoft.Network

# Register Container Registry provider
az provider register --namespace Microsoft.ContainerRegistry

# Register Compute provider
az provider register --namespace Microsoft.Compute

# Check registration status
az provider show --namespace Microsoft.ContainerService --query "registrationState"
```

## Azure CLI Installation

### Windows

```powershell
# Using Winget
winget install Microsoft.AzureCLI

# OR using MSI installer
# Download from: https://aka.ms/installazurecliwindows
```

### macOS

```bash
# Using Homebrew
brew update && brew install azure-cli
```

### Linux

```bash
# Ubuntu/Debian
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# RHEL/CentOS/Fedora
sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
sudo dnf install azure-cli
```

### Verify Installation

```bash
az version
az login
```

## Resource Group Creation

Resource groups are logical containers for Azure resources.

### Create Resource Group

```bash
# Set variables
RESOURCE_GROUP="hackathon-todo-rg"
LOCATION="eastus"  # or westus2, westeurope, etc.

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags Project=HackathonTodo Environment=Production

# Verify creation
az group show --name $RESOURCE_GROUP
```

### Choose Azure Region

Consider these factors when choosing a region:

1. **Latency**: Choose region closest to your users
2. **Cost**: Pricing varies by region
3. **Features**: Some features may not be available in all regions
4. **Compliance**: Data residency requirements

**Recommended Regions for 2026:**
- **US East**: `eastus` - Low cost, high availability
- **US West 2**: `westus2` - Latest features
- **Europe West**: `westeurope` - GDPR compliance
- **Southeast Asia**: `southeastasia` - Asia-Pacific users

View all regions:

```bash
az account list-locations --output table
```

## AKS Cluster Setup

### Using the Setup Script (Recommended)

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your preferred settings
# vim .env or code .env

# Run setup script
./scripts/setup-aks.sh
```

### Manual Setup

If you prefer manual control:

```bash
# Set variables
RESOURCE_GROUP="hackathon-todo-rg"
CLUSTER_NAME="hackathon-todo-prod"
LOCATION="eastus"
NODE_COUNT=2
NODE_SIZE="Standard_D2s_v3"
K8S_VERSION="1.28"

# Create AKS cluster
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME \
  --location $LOCATION \
  --node-count $NODE_COUNT \
  --node-vm-size $NODE_SIZE \
  --kubernetes-version $K8S_VERSION \
  --enable-cluster-autoscaler \
  --min-count 2 \
  --max-count 5 \
  --network-plugin azure \
  --load-balancer-sku standard \
  --enable-managed-identity \
  --enable-azure-rbac \
  --enable-addons monitoring \
  --generate-ssh-keys \
  --tags Project=HackathonTodo

# Get credentials
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### Cluster Configuration Options

**VM Sizes** (choose based on workload):
- `Standard_B2s`: Budget (2 vCPU, 4 GB RAM) - ~$30/month
- `Standard_D2s_v3`: Balanced (2 vCPU, 8 GB RAM) - ~$70/month ⭐ **Recommended**
- `Standard_D4s_v3`: Performance (4 vCPU, 16 GB RAM) - ~$140/month

**Kubernetes Versions**:
```bash
# List available versions
az aks get-versions --location $LOCATION --output table

# Use latest stable
K8S_VERSION=$(az aks get-versions --location $LOCATION --query "values[?isPreview==null].version | [-1]" -o tsv)
```

## Azure Container Registry

### Create ACR

```bash
ACR_NAME="hackathontodoacr"  # Must be globally unique, alphanumeric only

# Create ACR
az acr create \
  --name $ACR_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Basic \
  --admin-enabled true

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)
echo $ACR_LOGIN_SERVER
```

### Attach ACR to AKS

```bash
# Attach ACR to AKS cluster
az aks update \
  --name $CLUSTER_NAME \
  --resource-group $RESOURCE_GROUP \
  --attach-acr $ACR_NAME
```

### Login to ACR

```bash
# Azure CLI login
az acr login --name $ACR_NAME

# Docker login (alternative)
docker login $ACR_LOGIN_SERVER
```

### Get ACR Credentials (for CI/CD)

```bash
# Get username
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)

# Get password
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

echo "ACR Username: $ACR_USERNAME"
echo "ACR Password: $ACR_PASSWORD"

# Store these in GitHub Secrets:
# - ACR_USERNAME
# - ACR_PASSWORD
```

## Service Principal for CI/CD

Service principals enable GitHub Actions to deploy to Azure.

### Create Service Principal

```bash
# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create service principal with Contributor role
SP_NAME="hackathon-todo-github-actions"

az ad sp create-for-rbac \
  --name $SP_NAME \
  --role Contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
  --sdk-auth

# Output will look like:
# {
#   "clientId": "...",
#   "clientSecret": "...",
#   "subscriptionId": "...",
#   "tenantId": "...",
#   ...
# }
```

### Store Credentials in GitHub

1. Copy the entire JSON output
2. Go to your GitHub repository
3. Navigate to Settings → Secrets and variables → Actions
4. Click "New repository secret"
5. Name: `AZURE_CREDENTIALS`
6. Value: Paste the JSON output
7. Click "Add secret"

### Additional GitHub Secrets

Add these secrets to GitHub as well:

```bash
# ACR credentials
ACR_USERNAME: <from az acr credential show>
ACR_PASSWORD: <from az acr credential show>

# Production API URL (after deployment)
PRODUCTION_API_URL: http://<frontend-ip>:3000

# Optional: Slack webhook for notifications
SLACK_WEBHOOK_URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Cost Management

### Set Up Billing Alerts

```bash
# Create budget alert
az consumption budget create \
  --budget-name "hackathon-todo-monthly" \
  --amount 100 \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --end-date $(date -d "+1 year" +%Y-%m-01) \
  --resource-group $RESOURCE_GROUP
```

### Monitor Costs

1. Visit [Azure Cost Management](https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/overview)
2. Select your subscription
3. View cost analysis
4. Set up cost alerts

### Cost Estimation

**Monthly Costs (East US region):**

| Resource | Configuration | Estimated Cost |
|----------|--------------|---------------|
| AKS Cluster | 2x Standard_D2s_v3 (24/7) | ~$140 |
| Load Balancer | Standard SKU | ~$20 |
| Egress Traffic | ~100 GB | ~$10 |
| ACR | Basic tier | ~$5 |
| **Total** | | **~$175/month** |

**Cost Optimization:**
- Use auto-scaling to reduce idle capacity
- Stop development clusters when not in use
- Use Azure Reserved Instances (40% discount for 1-year commitment)
- Monitor and right-size VMs based on actual usage

## Troubleshooting

### Cannot Create AKS Cluster

**Error**: `Subscription is not registered to use namespace 'Microsoft.ContainerService'`

**Solution**:
```bash
az provider register --namespace Microsoft.ContainerService
az provider register --namespace Microsoft.Network
```

### ACR Name Already Taken

**Error**: `The registry name 'hackathontodoacr' is not available`

**Solution**: ACR names must be globally unique. Try:
```bash
ACR_NAME="hackathontodo$(date +%s)"  # Append timestamp
```

### kubectl Cannot Connect

**Error**: `Unable to connect to the server`

**Solution**:
```bash
# Get fresh credentials
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME \
  --overwrite-existing

# Verify connection
kubectl get nodes
```

### Quota Limits Exceeded

**Error**: `Operation results in exceeding quota limits of Core`

**Solution**:
1. Request quota increase in Azure Portal
2. Or use smaller VM sizes
3. Or choose a different region with available capacity

```bash
# Check current quotas
az vm list-usage --location $LOCATION --output table
```

### Access Denied Errors

**Error**: `AuthorizationFailed: The client '...' does not have authorization to perform action`

**Solution**:
- Ensure you have `Contributor` or `Owner` role on the subscription
- Contact your Azure administrator to grant permissions

## Next Steps

After completing Azure setup:

1. ✅ **Install Dapr**: `./scripts/install-dapr.sh`
2. ✅ **Configure Secrets**: `./scripts/setup-secrets.sh`
3. ✅ **Deploy Application**: `./scripts/deploy.sh`
4. ✅ **Set Up CI/CD**: Configure GitHub Actions

## Reference Links

- [Azure AKS Documentation](https://learn.microsoft.com/en-us/azure/aks/)
- [Azure CLI Reference](https://learn.microsoft.com/en-us/cli/azure/)
- [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)
- [Azure Free Account](https://azure.microsoft.com/en-us/free/)
- [Kubernetes on Azure](https://azure.microsoft.com/en-us/products/kubernetes-service)

## Support

For issues with:
- **Azure**: [Azure Support](https://azure.microsoft.com/en-us/support/)
- **AKS**: [AKS GitHub Issues](https://github.com/Azure/AKS/issues)
- **This Guide**: Create an issue in the repository
