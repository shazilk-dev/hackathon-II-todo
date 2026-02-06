#!/usr/bin/env bash
# Task: T068 [Phase 7]
# Cleanup script for Minikube deployment
# Removes all todo-chatbot resources from Minikube

set -euo pipefail

echo "🧹 Cleaning up Todo Chatbot from Minikube..."
echo ""

# Check if Minikube is running
if ! minikube status > /dev/null 2>&1; then
    echo "⚠️  Minikube is not running"
    echo "   Nothing to clean up"
    exit 0
fi

# Check if Helm release exists
if helm list -n todo-chatbot 2>/dev/null | grep -q todo-chatbot; then
    echo "📦 Uninstalling Helm release..."
    helm uninstall todo-chatbot -n todo-chatbot
    echo "✅ Helm release uninstalled"
    echo ""
fi

# Delete namespace (removes all resources)
if kubectl get namespace todo-chatbot &> /dev/null; then
    echo "🗑️  Deleting namespace todo-chatbot..."
    kubectl delete namespace todo-chatbot
    echo "✅ Namespace deleted"
    echo ""
fi

# Optionally clean up Docker images from Minikube
read -p "🐳 Clean up Docker images from Minikube? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    eval $(minikube docker-env)
    docker rmi todo-backend:latest todo-frontend:latest 2>/dev/null || true
    echo "✅ Docker images cleaned up"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "🔄 To redeploy:"
echo "   ./scripts/deploy-helm.sh"
