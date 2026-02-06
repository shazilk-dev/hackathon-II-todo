#!/usr/bin/env bash
# Task: T053 [US3]
# Helm-based deployment script for Minikube
# Uses helm upgrade --install for idempotent deployments

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "🚀 Deploying Todo Chatbot to Minikube with Helm..."
echo ""

# Step 1: Verify Helm is installed
echo "1️⃣  Checking Helm installation..."
if ! command -v helm &> /dev/null; then
    echo "❌ Helm is not installed"
    echo "   Install from: https://helm.sh/docs/intro/install/"
    exit 1
fi
HELM_VERSION=$(helm version --short)
echo "✅ Helm is installed: $HELM_VERSION"
echo ""

# Step 2: Verify Minikube is running
echo "2️⃣  Checking Minikube status..."
if ! minikube status > /dev/null 2>&1; then
    echo "❌ Minikube is not running"
    echo "   Start it with: minikube start --cpus=2 --memory=4096"
    exit 1
fi
echo "✅ Minikube is running"
echo ""

# Step 3: Build Docker images in Minikube
echo "3️⃣  Building Docker images..."
bash "$REPO_ROOT/scripts/build-images.sh"
echo ""

# Step 4: Load environment variables
echo "4️⃣  Loading environment variables..."
if [ ! -f "$REPO_ROOT/.env" ]; then
    echo "❌ .env file not found"
    echo "   Copy .env.example to .env and fill in your values"
    exit 1
fi

# Source environment variables
set -a  # Export all variables
source "$REPO_ROOT/.env"
set +a

# Verify required secrets
REQUIRED_VARS=("DATABASE_URL" "BETTER_AUTH_SECRET" "OPENAI_API_KEY")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        echo "❌ Required environment variable $var is not set in .env"
        exit 1
    fi
done
echo "✅ Environment variables loaded"
echo ""

# Step 5: Install/Upgrade with Helm
echo "5️⃣  Deploying with Helm..."
helm upgrade --install todo-chatbot "$REPO_ROOT/helm/todo-chatbot" \
    --namespace todo-chatbot \
    --create-namespace \
    --set secrets.DATABASE_URL="$DATABASE_URL" \
    --set secrets.BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
    --set secrets.OPENAI_API_KEY="$OPENAI_API_KEY" \
    --wait \
    --timeout 5m

echo ""
echo "✅ Helm deployment complete!"
echo ""

# Step 6: Show deployment status
echo "📊 Deployment Status:"
echo ""
kubectl get pods -n todo-chatbot
echo ""
kubectl get services -n todo-chatbot
echo ""
kubectl get hpa -n todo-chatbot
echo ""

echo "🌐 Access the application:"
echo "   minikube service todo-chatbot-frontend -n todo-chatbot"
echo "   OR"
echo "   kubectl port-forward -n todo-chatbot service/todo-chatbot-frontend 3000:3000"
echo ""
echo "🔍 Useful commands:"
echo "   View logs: kubectl logs -n todo-chatbot -l app.kubernetes.io/component=backend -f"
echo "   Helm status: helm status todo-chatbot -n todo-chatbot"
echo "   Helm history: helm history todo-chatbot -n todo-chatbot"
echo "   Uninstall: helm uninstall todo-chatbot -n todo-chatbot"
