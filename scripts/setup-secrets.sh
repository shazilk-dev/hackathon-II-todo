#!/bin/bash
# Phase 5: Kubernetes Secrets Setup Script
# Creates Kubernetes secrets for the application
#
# Prerequisites:
# - kubectl configured for AKS cluster
# - .env file with all required secrets
#
# Usage:
#   ./scripts/setup-secrets.sh
#
# Security Best Practices:
# - Secrets are base64 encoded by Kubernetes
# - Never commit .env file to git
# - Use Azure Key Vault for enhanced security (optional)
# - Rotate secrets regularly

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

# Check for .env file
if [ ! -f .env ]; then
    log_error ".env file not found. Please create it from .env.example:"
    log_error "  cp .env.example .env"
    log_error "  # Edit .env with your actual secrets"
    exit 1
fi

log_info "=== Kubernetes Secrets Setup ==="
log_info "Loading secrets from .env file..."

# Source .env file
set -a
source .env
set +a

# Namespace (default or from environment)
NAMESPACE="${K8S_NAMESPACE:-default}"

log_info "Target namespace: $NAMESPACE"

# Verify kubectl connection
if ! kubectl cluster-info &> /dev/null; then
    log_error "Cannot connect to Kubernetes cluster. Run: az aks get-credentials"
    exit 1
fi

CURRENT_CONTEXT=$(kubectl config current-context)
log_info "Connected to: $CURRENT_CONTEXT"

read -p "Continue creating secrets in namespace '$NAMESPACE' on cluster '$CURRENT_CONTEXT'? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Aborted by user."
    exit 0
fi

# Function to create or update secret
create_or_update_secret() {
    local SECRET_NAME=$1
    local SECRET_DATA=$2

    if kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &> /dev/null; then
        log_warn "Secret '$SECRET_NAME' already exists. Updating..."
        kubectl delete secret "$SECRET_NAME" -n "$NAMESPACE"
    fi

    echo "$SECRET_DATA" | kubectl apply -f - -n "$NAMESPACE"
    log_info "✅ Secret '$SECRET_NAME' created/updated"
}

# Secret 1: Database Credentials
log_info "Creating database-credentials secret..."

if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL not set in .env file"
    exit 1
fi

cat <<EOF | kubectl apply -f - -n "$NAMESPACE"
apiVersion: v1
kind: Secret
metadata:
  name: database-credentials
  labels:
    app: hackathon-todo
    managed-by: script
type: Opaque
stringData:
  connection-string: "$DATABASE_URL"
  database-url: "$DATABASE_URL"
EOF

log_info "✅ Secret 'database-credentials' created"

# Secret 2: OpenAI Credentials
log_info "Creating openai-credentials secret..."

if [ -z "${OPENAI_API_KEY:-}" ]; then
    log_error "OPENAI_API_KEY not set in .env file"
    exit 1
fi

cat <<EOF | kubectl apply -f - -n "$NAMESPACE"
apiVersion: v1
kind: Secret
metadata:
  name: openai-credentials
  labels:
    app: hackathon-todo
    managed-by: script
type: Opaque
stringData:
  api-key: "$OPENAI_API_KEY"
  openai-api-key: "$OPENAI_API_KEY"
EOF

log_info "✅ Secret 'openai-credentials' created"

# Secret 3: Authentication Credentials
log_info "Creating auth-credentials secret..."

if [ -z "${BETTER_AUTH_SECRET:-}" ]; then
    log_error "BETTER_AUTH_SECRET not set in .env file"
    exit 1
fi

cat <<EOF | kubectl apply -f - -n "$NAMESPACE"
apiVersion: v1
kind: Secret
metadata:
  name: auth-credentials
  labels:
    app: hackathon-todo
    managed-by: script
type: Opaque
stringData:
  secret: "$BETTER_AUTH_SECRET"
  better-auth-secret: "$BETTER_AUTH_SECRET"
EOF

log_info "✅ Secret 'auth-credentials' created"

# Secret 4: Redpanda Credentials (if configured)
if [ -n "${REDPANDA_SASL_USERNAME:-}" ] && [ -n "${REDPANDA_SASL_PASSWORD:-}" ]; then
    log_info "Creating redpanda-credentials secret..."

    cat <<EOF | kubectl apply -f - -n "$NAMESPACE"
apiVersion: v1
kind: Secret
metadata:
  name: redpanda-credentials
  labels:
    app: hackathon-todo
    managed-by: script
type: Opaque
stringData:
  username: "$REDPANDA_SASL_USERNAME"
  password: "$REDPANDA_SASL_PASSWORD"
  sasl-username: "$REDPANDA_SASL_USERNAME"
  sasl-password: "$REDPANDA_SASL_PASSWORD"
  brokers: "${REDPANDA_BROKERS:-}"
  mechanism: "${REDPANDA_SASL_MECHANISM:-SCRAM-SHA-256}"
EOF

    log_info "✅ Secret 'redpanda-credentials' created"
else
    log_warn "Redpanda credentials not found in .env. Skipping redpanda-credentials secret."
    log_warn "To enable event processing, add REDPANDA_SASL_USERNAME and REDPANDA_SASL_PASSWORD to .env"
fi

# Secret 5: ChatKit Domain Key (if configured)
if [ -n "${NEXT_PUBLIC_OPENAI_DOMAIN_KEY:-}" ]; then
    log_info "Creating chatkit-credentials secret..."

    cat <<EOF | kubectl apply -f - -n "$NAMESPACE"
apiVersion: v1
kind: Secret
metadata:
  name: chatkit-credentials
  labels:
    app: hackathon-todo
    managed-by: script
type: Opaque
stringData:
  domain-key: "$NEXT_PUBLIC_OPENAI_DOMAIN_KEY"
EOF

    log_info "✅ Secret 'chatkit-credentials' created"
else
    log_warn "ChatKit domain key not found in .env. Skipping chatkit-credentials secret."
fi

# Verify secrets were created
log_info ""
log_info "Verifying secrets in namespace '$NAMESPACE'..."
kubectl get secrets -n "$NAMESPACE" -l app=hackathon-todo

log_info ""
log_info "=== Secrets Setup Complete ==="
log_info "✅ database-credentials"
log_info "✅ openai-credentials"
log_info "✅ auth-credentials"

if [ -n "${REDPANDA_SASL_USERNAME:-}" ]; then
    log_info "✅ redpanda-credentials"
fi

if [ -n "${NEXT_PUBLIC_OPENAI_DOMAIN_KEY:-}" ]; then
    log_info "✅ chatkit-credentials"
fi

log_info ""
log_info "Security Reminders:"
log_info "⚠️  Never commit .env file to git"
log_info "⚠️  Rotate secrets regularly (every 90 days recommended)"
log_info "⚠️  Use Azure Key Vault for enhanced security (future enhancement)"
log_info "⚠️  Verify no secrets appear in logs: kubectl logs <pod-name> | grep -i 'password\\|secret\\|key'"
log_info ""
log_info "To view secret names (NOT values):"
log_info "  kubectl get secrets -n $NAMESPACE"
log_info ""
log_info "To describe a secret (shows keys but NOT values):"
log_info "  kubectl describe secret database-credentials -n $NAMESPACE"
log_info ""
log_info "To decode a secret value (USE CAREFULLY):"
log_info "  kubectl get secret database-credentials -n $NAMESPACE -o jsonpath='{.data.connection-string}' | base64 -d"
log_info ""
log_info "Next steps:"
log_info "1. Apply Dapr components: kubectl apply -f dapr/components/"
log_info "2. Deploy application: ./scripts/deploy.sh"
