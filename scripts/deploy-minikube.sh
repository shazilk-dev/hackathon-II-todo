#!/usr/bin/env bash
# Task: T030 [US2]
# Automated deployment script for Minikube
# Verifies prerequisites, builds images, creates secrets, and deploys all manifests

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "🚀 Deploying Todo Chatbot to Minikube..."
echo ""

# Step 1: Verify Minikube is running
echo "1️⃣  Checking Minikube status..."
if ! minikube status > /dev/null 2>&1; then
    echo "❌ Minikube is not running"
    echo "   Start it with: minikube start --cpus=2 --memory=4096"
    exit 1
fi
echo "✅ Minikube is running"
echo ""

# Step 2: Verify kubectl is configured
echo "2️⃣  Verifying kubectl configuration..."
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo "❌ kubectl is not configured properly"
    exit 1
fi
echo "✅ kubectl is configured"
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

# Step 5: Create namespace
echo "5️⃣  Creating namespace..."
kubectl apply -f "$REPO_ROOT/k8s/base/namespace.yaml"
echo ""

# Step 6: Create secrets
echo "6️⃣  Creating Kubernetes secrets..."
kubectl create secret generic todo-chatbot-secrets \
    --namespace=todo-chatbot \
    --from-literal=DATABASE_URL="$DATABASE_URL" \
    --from-literal=BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
    --from-literal=OPENAI_API_KEY="$OPENAI_API_KEY" \
    --dry-run=client -o yaml | kubectl apply -f -
echo "✅ Secrets created"
echo ""

# Step 7: Apply ConfigMap
echo "7️⃣  Applying ConfigMap..."
kubectl apply -f "$REPO_ROOT/k8s/base/configmap.yaml"
echo ""

# Step 8: Deploy backend
echo "8️⃣  Deploying backend..."
kubectl apply -f "$REPO_ROOT/k8s/base/backend-deployment.yaml"
kubectl apply -f "$REPO_ROOT/k8s/base/backend-service.yaml"
echo ""

# Step 9: Deploy frontend
echo "9️⃣  Deploying frontend..."
kubectl apply -f "$REPO_ROOT/k8s/base/frontend-deployment.yaml"
kubectl apply -f "$REPO_ROOT/k8s/base/frontend-service.yaml"
echo ""

# Step 10: Apply HPA
echo "🔟 Applying Horizontal Pod Autoscaler..."
kubectl apply -f "$REPO_ROOT/k8s/base/hpa.yaml"
echo ""

# Step 11: Wait for deployment
echo "⏳ Waiting for pods to be ready (timeout: 3 minutes)..."
kubectl wait --for=condition=ready pod \
    -l app.kubernetes.io/name=todo-chatbot \
    -n todo-chatbot \
    --timeout=180s || {
    echo "⚠️  Warning: Some pods are not ready yet"
    echo "   Check status with: kubectl get pods -n todo-chatbot"
}
echo ""

# Step 12: Show deployment status
echo "📊 Deployment Status:"
echo ""
kubectl get pods -n todo-chatbot
echo ""
kubectl get services -n todo-chatbot
echo ""
kubectl get hpa -n todo-chatbot
echo ""

echo "✅ Deployment complete!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: minikube service todo-frontend-service -n todo-chatbot"
echo "   OR"
echo "   kubectl port-forward -n todo-chatbot service/todo-frontend-service 3000:3000"
echo ""
echo "🔍 Useful commands:"
echo "   View logs: kubectl logs -n todo-chatbot -l app.kubernetes.io/component=backend -f"
echo "   Shell into pod: kubectl exec -it -n todo-chatbot <pod-name> -- /bin/sh"
echo "   Delete deployment: kubectl delete namespace todo-chatbot"
