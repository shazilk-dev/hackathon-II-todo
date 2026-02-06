#!/bin/bash
# Phase 5: Load Testing Script
# Simulates traffic to test auto-scaling behavior
#
# Prerequisites:
# - Application deployed with HPA enabled
# - kubectl configured
# - hey or apache bench installed
#
# Usage:
#   ./scripts/load-test.sh [DURATION] [CONCURRENCY] [RATE]
#
# Examples:
#   ./scripts/load-test.sh 300 50 10    # 5 min, 50 concurrent, 10 RPS
#   ./scripts/load-test.sh              # Use defaults

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Configuration
DURATION="${1:-60}"          # Duration in seconds
CONCURRENCY="${2:-20}"      # Concurrent connections
RATE="${3:-10}"             # Requests per second
NAMESPACE="${K8S_NAMESPACE:-default}"

log_info "=== Load Test Configuration ==="
log_info "Duration: ${DURATION}s"
log_info "Concurrency: $CONCURRENCY"
log_info "Target Rate: ${RATE} RPS"
log_info "Namespace: $NAMESPACE"
log_info ""

# Check for load testing tool
LOAD_TOOL=""
if command -v hey &> /dev/null; then
    LOAD_TOOL="hey"
    log_info "Using 'hey' for load testing"
elif command -v ab &> /dev/null; then
    LOAD_TOOL="ab"
    log_info "Using 'apache bench' for load testing"
else
    log_error "No load testing tool found. Install one of:"
    log_error "  hey:    go install github.com/rakyll/hey@latest"
    log_error "  apache bench: apt-get install apache2-utils (Linux) or brew install httpd (Mac)"
    exit 1
fi

# Get frontend URL
FRONTEND_SERVICE=$(kubectl get service -n "$NAMESPACE" -l app.kubernetes.io/component=frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -z "$FRONTEND_SERVICE" ]; then
    log_error "Frontend service not found"
    exit 1
fi

SERVICE_TYPE=$(kubectl get service "$FRONTEND_SERVICE" -n "$NAMESPACE" -o jsonpath='{.spec.type}')
log_info "Service type: $SERVICE_TYPE"

if [ "$SERVICE_TYPE" = "LoadBalancer" ]; then
    FRONTEND_IP=$(kubectl get service "$FRONTEND_SERVICE" -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

    if [ -z "$FRONTEND_IP" ]; then
        log_error "LoadBalancer IP not assigned"
        exit 1
    fi

    TARGET_URL="http://$FRONTEND_IP:3000"
else
    log_warn "Service is not LoadBalancer type. Using port-forward..."
    kubectl port-forward -n "$NAMESPACE" "service/$FRONTEND_SERVICE" 3000:3000 &
    PORT_FORWARD_PID=$!
    sleep 3
    TARGET_URL="http://localhost:3000"

    # Cleanup on exit
    trap "kill $PORT_FORWARD_PID 2>/dev/null" EXIT
fi

log_info "Target URL: $TARGET_URL"

# Check if URL is accessible
if ! curl -sf -m 10 "$TARGET_URL" > /dev/null; then
    log_error "Target URL is not accessible"
    exit 1
fi

log_info "✅ Target URL is accessible"
log_info ""

# Get initial HPA status
log_info "Initial HPA Status:"
kubectl get hpa -n "$NAMESPACE"
log_info ""

log_info "Initial Pod Count:"
kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/component=backend
log_info ""

# Warning and confirmation
log_warn "⚠️  This will generate load on the production system!"
log_warn "Duration: ${DURATION}s (~$((DURATION / 60)) minutes)"
log_warn "Concurrency: $CONCURRENCY simultaneous connections"
log_warn "Expected requests: ~$((DURATION * RATE))"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Load test cancelled"
    exit 0
fi

# Start monitoring in background
log_info "Starting HPA monitoring in background..."
(
    while true; do
        kubectl get hpa -n "$NAMESPACE" --no-headers 2>/dev/null || true
        sleep 10
    done
) &
HPA_MONITOR_PID=$!

# Cleanup on exit
trap "kill $HPA_MONITOR_PID 2>/dev/null; kill $PORT_FORWARD_PID 2>/dev/null" EXIT

# Run load test
log_info "Starting load test..."
log_info "Test duration: ${DURATION}s"
log_info ""

START_TIME=$(date +%s)

if [ "$LOAD_TOOL" = "hey" ]; then
    # Using hey
    hey -z "${DURATION}s" -c "$CONCURRENCY" -q "$RATE" "$TARGET_URL"
else
    # Using apache bench
    TOTAL_REQUESTS=$((DURATION * RATE))
    ab -t "$DURATION" -c "$CONCURRENCY" -n "$TOTAL_REQUESTS" "$TARGET_URL"
fi

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

log_info ""
log_info "Load test completed in ${ELAPSED}s"

# Stop monitoring
kill $HPA_MONITOR_PID 2>/dev/null || true

# Check final state
log_info ""
log_info "Final HPA Status:"
kubectl get hpa -n "$NAMESPACE"

log_info ""
log_info "Final Pod Count:"
kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/component=backend

# Get HPA metrics
log_info ""
log_info "HPA Metrics:"
kubectl describe hpa -n "$NAMESPACE"

# Check if scaling occurred
INITIAL_REPLICAS=2  # Default from spec
CURRENT_REPLICAS=$(kubectl get deployment -n "$NAMESPACE" -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].spec.replicas}')

log_info ""
log_info "=== Scaling Results ==="
log_info "Initial replicas: $INITIAL_REPLICAS"
log_info "Current replicas: $CURRENT_REPLICAS"

if [ "$CURRENT_REPLICAS" -gt "$INITIAL_REPLICAS" ]; then
    log_info "✅ Auto-scaling triggered! Scaled from $INITIAL_REPLICAS to $CURRENT_REPLICAS replicas"
else
    log_warn "⚠️  No scaling detected. Current load may be below HPA threshold."
    log_warn "Try increasing concurrency or duration to trigger scaling."
fi

log_info ""
log_info "Monitor scale-down (should happen after ~5 minutes of low load):"
log_info "  kubectl get hpa -n $NAMESPACE --watch"
log_info ""
