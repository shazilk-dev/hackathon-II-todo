#!/bin/bash
# Phase 5: Smoke Tests Script
# Runs post-deployment health checks and smoke tests
#
# Prerequisites:
# - Application deployed to Kubernetes
# - kubectl configured
#
# Usage:
#   ./scripts/smoke-tests.sh

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

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

# Configuration
NAMESPACE="${K8S_NAMESPACE:-default}"
TIMEOUT=30

TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name=$1
    local test_command=$2

    log_test "$test_name"

    if eval "$test_command"; then
        log_info "✅ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        log_error "❌ FAIL: $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

log_info "=== Smoke Tests ==="
log_info "Namespace: $NAMESPACE"
log_info "Timeout: ${TIMEOUT}s"
log_info ""

# Test 1: Cluster connectivity
run_test "Cluster Connectivity" "kubectl cluster-info &> /dev/null"

# Test 2: Pods are running
run_test "All Pods Running" "[ \$(kubectl get pods -n $NAMESPACE --field-selector=status.phase=Running --no-headers | wc -l) -eq \$(kubectl get pods -n $NAMESPACE --no-headers | wc -l) ]"

# Test 3: Backend pod exists and is ready
BACKEND_POD=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
run_test "Backend Pod Exists" "[ -n \"$BACKEND_POD\" ]"

if [ -n "$BACKEND_POD" ]; then
    # Test 4: Backend pod is ready
    run_test "Backend Pod Ready" "kubectl get pod $BACKEND_POD -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type==\"Ready\")].status}' | grep -q True"

    # Test 5: Backend health endpoint
    run_test "Backend Health Endpoint" "kubectl exec -n $NAMESPACE $BACKEND_POD -- curl -sf http://localhost:8000/health | grep -q healthy"

    # Test 6: Backend API docs accessible
    run_test "Backend API Docs" "kubectl exec -n $NAMESPACE $BACKEND_POD -- curl -sf http://localhost:8000/docs &> /dev/null"
fi

# Test 7: Frontend pod exists and is ready
FRONTEND_POD=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/component=frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
run_test "Frontend Pod Exists" "[ -n \"$FRONTEND_POD\" ]"

if [ -n "$FRONTEND_POD" ]; then
    # Test 8: Frontend pod is ready
    run_test "Frontend Pod Ready" "kubectl get pod $FRONTEND_POD -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type==\"Ready\")].status}' | grep -q True"
fi

# Test 9: Frontend service has external IP (if LoadBalancer)
FRONTEND_SERVICE=$(kubectl get service -n "$NAMESPACE" -l app.kubernetes.io/component=frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$FRONTEND_SERVICE" ]; then
    SERVICE_TYPE=$(kubectl get service "$FRONTEND_SERVICE" -n "$NAMESPACE" -o jsonpath='{.spec.type}')
    if [ "$SERVICE_TYPE" = "LoadBalancer" ]; then
        run_test "Frontend LoadBalancer IP Assigned" "kubectl get service $FRONTEND_SERVICE -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' | grep -q '[0-9]'"

        FRONTEND_IP=$(kubectl get service "$FRONTEND_SERVICE" -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        if [ -n "$FRONTEND_IP" ]; then
            # Test 10: Frontend accessible via LoadBalancer
            FRONTEND_URL="http://$FRONTEND_IP:3000"
            run_test "Frontend HTTP Response" "curl -sf -m $TIMEOUT $FRONTEND_URL &> /dev/null"
        fi
    fi
fi

# Test 11: HPA exists and is configured
if kubectl get hpa -n "$NAMESPACE" &> /dev/null; then
    HPA_COUNT=$(kubectl get hpa -n "$NAMESPACE" --no-headers | wc -l)
    run_test "HPA Configured" "[ $HPA_COUNT -gt 0 ]"
fi

# Test 12: Dapr sidecars injected (if Dapr enabled)
if kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[*].spec.containers[*].name}' | grep -q daprd; then
    run_test "Dapr Sidecars Injected" "true"

    # Test 13: Dapr components exist
    if kubectl get components -n "$NAMESPACE" &> /dev/null; then
        COMPONENT_COUNT=$(kubectl get components -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l)
        run_test "Dapr Components Configured" "[ $COMPONENT_COUNT -gt 0 ]"
    fi
fi

# Test 14: Secrets exist
REQUIRED_SECRETS=("database-credentials" "openai-credentials" "auth-credentials")
ALL_SECRETS_EXIST=true
for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! kubectl get secret "$secret" -n "$NAMESPACE" &> /dev/null; then
        ALL_SECRETS_EXIST=false
        break
    fi
done
run_test "Required Secrets Exist" "$ALL_SECRETS_EXIST"

# Test 15: No pods in CrashLoopBackOff
run_test "No Pods Crash Looping" "! kubectl get pods -n $NAMESPACE --field-selector=status.phase=Running -o jsonpath='{.items[*].status.containerStatuses[*].state}' | grep -q CrashLoopBackOff"

# Summary
log_info ""
log_info "=== Test Results ==="
log_info "Tests Passed: $TESTS_PASSED"
log_info "Tests Failed: $TESTS_FAILED"
log_info "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
log_info ""

if [ $TESTS_FAILED -eq 0 ]; then
    log_info "✅ All smoke tests passed!"
    exit 0
else
    log_error "❌ $TESTS_FAILED test(s) failed"
    log_error "Check pod logs for more details:"
    log_error "  kubectl logs -n $NAMESPACE <pod-name>"
    exit 1
fi
