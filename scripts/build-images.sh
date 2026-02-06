#!/usr/bin/env bash
# Task: T029 [US2]
# Build Docker images using Minikube's Docker daemon
# This avoids needing a container registry for local deployment

set -euo pipefail

echo "🔧 Configuring Docker to use Minikube daemon..."

# Configure shell to use Minikube's Docker daemon
eval $(minikube docker-env)

echo "✅ Docker environment configured for Minikube"
echo ""

# Verify Minikube Docker daemon is accessible
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Cannot connect to Minikube Docker daemon"
    echo "   Make sure Minikube is running: minikube status"
    exit 1
fi

echo "📦 Building backend Docker image..."
cd "$(git rev-parse --show-toplevel)/backend"
docker build -t todo-backend:latest -f Dockerfile .

if [ $? -eq 0 ]; then
    echo "✅ Backend image built successfully"
else
    echo "❌ Backend image build failed"
    exit 1
fi

echo ""
echo "📦 Building frontend Docker image..."
cd "$(git rev-parse --show-toplevel)/frontend"
docker build -t todo-frontend:latest -f Dockerfile .

if [ $? -eq 0 ]; then
    echo "✅ Frontend image built successfully"
else
    echo "❌ Frontend image build failed"
    exit 1
fi

echo ""
echo "🎉 All images built successfully in Minikube!"
echo ""
echo "📋 Image list:"
docker images | grep "^todo-" | head -2

echo ""
echo "ℹ️  These images are now available in Minikube's Docker daemon"
echo "   You can deploy them with kubectl or helm"
