#!/usr/bin/env bash
# Phase 4: Application Update Script
# Usage: ./scripts/update-app.sh <version> [backend|frontend|all]

set -euo pipefail

VERSION=${1:-latest}
COMPONENT=${2:-all}

echo "🔄 Updating Todo Chatbot to version: $VERSION"
echo "   Component: $COMPONENT"
echo ""

# Configure Minikube Docker
echo "🔧 Configuring Minikube Docker environment..."
eval $(minikube docker-env)

# Function to build backend
build_backend() {
    echo "🏗️  Building backend image..."
    cd backend
    docker build -t todo-backend:${VERSION} -t todo-backend:latest .
    echo "✅ Backend image built: todo-backend:${VERSION}"
    cd ..
}

# Function to build frontend
build_frontend() {
    echo "🏗️  Building frontend image..."
    cd frontend
    docker build -t todo-frontend:${VERSION} -t todo-frontend:latest .
    echo "✅ Frontend image built: todo-frontend:${VERSION}"
    cd ..
}

# Build images based on component
case $COMPONENT in
    backend)
        build_backend
        ;;
    frontend)
        build_frontend
        ;;
    all)
        build_backend
        build_frontend
        ;;
    *)
        echo "❌ Invalid component: $COMPONENT"
        echo "   Usage: ./scripts/update-app.sh <version> [backend|frontend|all]"
        exit 1
        ;;
esac

echo ""
echo "🚀 Deploying update via Helm..."

# Deploy with Helm
helm upgrade todo-chatbot ./helm/todo-chatbot \
    --namespace todo-chatbot \
    --set backend.image.tag=${VERSION} \
    --set frontend.image.tag=${VERSION} \
    --wait \
    --timeout 5m

echo ""
echo "✅ Update deployed successfully!"
echo ""

# Show status
echo "📊 Deployment Status:"
kubectl get pods -n todo-chatbot
echo ""

# Show revision history
echo "📜 Helm Revision History:"
helm history todo-chatbot -n todo-chatbot
echo ""

echo "🎉 Update complete to version: $VERSION"
echo ""
echo "🔍 Verify in browser:"
echo "   minikube service todo-chatbot-frontend -n todo-chatbot"
echo ""
echo "⚠️  If issues occur, rollback with:"
echo "   helm rollback todo-chatbot -n todo-chatbot"
