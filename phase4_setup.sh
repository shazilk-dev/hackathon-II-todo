#!/bin/bash
# Phase IV: Local Kubernetes Deployment - Setup Script
# This script automates the setup of all Phase 4 tools and dependencies

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running in WSL
is_wsl() {
    grep -qEi "(Microsoft|WSL)" /proc/version 2>/dev/null
}

# Check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# ====================================
# Step 1: Check Prerequisites
# ====================================
check_prerequisites() {
    print_header "Step 1: Checking Prerequisites"
    
    local missing=0
    
    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker installed: $DOCKER_VERSION"
    else
        print_error "Docker not installed"
        missing=1
    fi
    
    # Check if Docker is running
    if docker info &> /dev/null; then
        print_success "Docker daemon is running"
    else
        print_warning "Docker daemon is not running - please start Docker Desktop"
        missing=1
    fi
    
    # Check curl
    if command_exists curl; then
        print_success "curl installed"
    else
        print_error "curl not installed"
        missing=1
    fi
    
    # Check git
    if command_exists git; then
        print_success "git installed"
    else
        print_warning "git not installed (recommended)"
    fi
    
    if [ $missing -eq 1 ]; then
        print_error "Please install missing prerequisites and run again"
        exit 1
    fi
}

# ====================================
# Step 2: Install Minikube
# ====================================
install_minikube() {
    print_header "Step 2: Installing Minikube"
    
    if command_exists minikube; then
        MINIKUBE_VERSION=$(minikube version --short 2>/dev/null || echo "unknown")
        print_success "Minikube already installed: $MINIKUBE_VERSION"
        read -p "Do you want to reinstall? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    print_info "Downloading Minikube..."
    curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
    
    print_info "Installing Minikube..."
    sudo install minikube-linux-amd64 /usr/local/bin/minikube
    rm minikube-linux-amd64
    
    # Verify
    if command_exists minikube; then
        MINIKUBE_VERSION=$(minikube version --short)
        print_success "Minikube installed successfully: $MINIKUBE_VERSION"
    else
        print_error "Minikube installation failed"
        exit 1
    fi
}

# ====================================
# Step 3: Install kubectl
# ====================================
install_kubectl() {
    print_header "Step 3: Installing kubectl"
    
    if command_exists kubectl; then
        KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null | head -1 || echo "unknown")
        print_success "kubectl already installed: $KUBECTL_VERSION"
        read -p "Do you want to reinstall? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    print_info "Downloading kubectl..."
    KUBECTL_LATEST=$(curl -L -s https://dl.k8s.io/release/stable.txt)
    curl -LO "https://dl.k8s.io/release/${KUBECTL_LATEST}/bin/linux/amd64/kubectl"
    
    print_info "Installing kubectl..."
    sudo install kubectl /usr/local/bin/kubectl
    rm kubectl
    
    # Verify
    if command_exists kubectl; then
        print_success "kubectl installed successfully"
    else
        print_error "kubectl installation failed"
        exit 1
    fi
}

# ====================================
# Step 4: Install Helm
# ====================================
install_helm() {
    print_header "Step 4: Installing Helm"
    
    if command_exists helm; then
        HELM_VERSION=$(helm version --short 2>/dev/null || echo "unknown")
        print_success "Helm already installed: $HELM_VERSION"
        read -p "Do you want to reinstall? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    print_info "Installing Helm..."
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    
    # Verify
    if command_exists helm; then
        HELM_VERSION=$(helm version --short)
        print_success "Helm installed successfully: $HELM_VERSION"
    else
        print_error "Helm installation failed"
        exit 1
    fi
}

# ====================================
# Step 5: Install kubectl-ai
# ====================================
install_kubectl_ai() {
    print_header "Step 5: Installing kubectl-ai"
    
    if command_exists kubectl-ai; then
        print_success "kubectl-ai already installed"
        read -p "Do you want to reinstall? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    print_info "Installing kubectl-ai..."
    curl -sSL https://raw.githubusercontent.com/GoogleCloudPlatform/kubectl-ai/main/install.sh | bash
    
    # Verify
    if command_exists kubectl-ai; then
        print_success "kubectl-ai installed successfully"
    else
        print_warning "kubectl-ai installation may have failed - check manually"
    fi
    
    # Check for API key
    if [ -z "$GEMINI_API_KEY" ] && [ -z "$OPENAI_API_KEY" ]; then
        print_warning "No API key set for kubectl-ai"
        print_info "Set GEMINI_API_KEY or OPENAI_API_KEY environment variable"
        print_info "Get Gemini key from: https://aistudio.google.com/"
    fi
}

# ====================================
# Step 6: Install Kagent CLI
# ====================================
install_kagent() {
    print_header "Step 6: Installing Kagent CLI"
    
    if command_exists kagent; then
        print_success "Kagent already installed"
        read -p "Do you want to reinstall? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    print_info "Installing Kagent..."
    
    # Get latest release
    KAGENT_URL="https://github.com/kagent-dev/kagent/releases/latest/download/kagent_Linux_x86_64.tar.gz"
    
    curl -LO "$KAGENT_URL" 2>/dev/null || {
        print_warning "Could not download kagent - manual installation required"
        print_info "Visit: https://github.com/kagent-dev/kagent/releases"
        return
    }
    
    tar -xzf kagent_Linux_x86_64.tar.gz 2>/dev/null || {
        print_warning "Could not extract kagent"
        return
    }
    
    sudo mv kagent /usr/local/bin/ 2>/dev/null || {
        print_warning "Could not install kagent to /usr/local/bin"
        return
    }
    
    rm -f kagent_Linux_x86_64.tar.gz
    
    # Verify
    if command_exists kagent; then
        print_success "Kagent installed successfully"
    else
        print_warning "Kagent installation may have failed"
    fi
}

# ====================================
# Step 7: Start Minikube Cluster
# ====================================
start_minikube() {
    print_header "Step 7: Starting Minikube Cluster"
    
    # Check if already running
    if minikube status &>/dev/null; then
        print_success "Minikube is already running"
        kubectl cluster-info
        read -p "Do you want to restart the cluster? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
        minikube stop
    fi
    
    print_info "Starting Minikube cluster..."
    minikube start --driver=docker --memory=4096 --cpus=2
    
    # Enable addons
    print_info "Enabling addons..."
    minikube addons enable ingress
    minikube addons enable metrics-server
    minikube addons enable dashboard
    
    # Verify
    print_info "Cluster info:"
    kubectl cluster-info
    
    print_success "Minikube cluster is ready!"
}

# ====================================
# Step 8: Configure Docker Environment
# ====================================
configure_docker_env() {
    print_header "Step 8: Configure Docker Environment"
    
    print_info "To use Minikube's Docker daemon, run:"
    echo ""
    echo "  eval \$(minikube docker-env)"
    echo ""
    print_info "Add this to your ~/.bashrc or ~/.zshrc for persistence"
    
    # Check for Gordon
    print_info ""
    print_info "Docker Gordon (Ask Gordon) setup:"
    print_info "1. Open Docker Desktop"
    print_info "2. Go to Settings → Beta features"
    print_info "3. Enable 'Docker AI'"
    print_info "4. Test with: docker ai 'What can you do?'"
}

# ====================================
# Step 9: Create Project Structure
# ====================================
create_project_structure() {
    print_header "Step 9: Create Project Structure"
    
    read -p "Create Helm chart structure? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    # Create directories
    mkdir -p helm/todo-app/templates
    
    # Create Chart.yaml
    cat > helm/todo-app/Chart.yaml << 'EOF'
apiVersion: v2
name: todo-app
description: Todo Chatbot Application - Phase IV
type: application
version: 1.0.0
appVersion: "1.0.0"
keywords:
  - todo
  - chatbot
  - fastapi
  - nextjs
maintainers:
  - name: Your Name
    email: your.email@example.com
EOF

    # Create values.yaml
    cat > helm/todo-app/values.yaml << 'EOF'
# Todo App Helm Chart Values

global:
  environment: development

backend:
  name: todo-backend
  replicaCount: 2
  image:
    repository: todo-backend
    tag: latest
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: 8000
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 256Mi

frontend:
  name: todo-frontend
  replicaCount: 2
  image:
    repository: todo-frontend
    tag: latest
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: 3000
  resources:
    limits:
      cpu: 300m
      memory: 256Mi
    requests:
      cpu: 100m
      memory: 128Mi

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: todo.local
      paths:
        - path: /
          pathType: Prefix
          service: frontend
        - path: /api
          pathType: Prefix
          service: backend

secrets:
  databaseUrl: ""
  authSecret: ""
  openaiKey: ""
EOF

    print_success "Created helm/todo-app/Chart.yaml"
    print_success "Created helm/todo-app/values.yaml"
    print_info "Run 'helm create todo-app' for full template generation"
}

# ====================================
# Step 10: Verification
# ====================================
verify_installation() {
    print_header "Step 10: Installation Verification"
    
    echo "Installed Tools:"
    echo "================"
    
    # Docker
    if command_exists docker; then
        echo -e "Docker:      ${GREEN}$(docker --version | cut -d' ' -f3 | cut -d',' -f1)${NC}"
    else
        echo -e "Docker:      ${RED}Not installed${NC}"
    fi
    
    # Minikube
    if command_exists minikube; then
        echo -e "Minikube:    ${GREEN}$(minikube version --short 2>/dev/null || echo 'installed')${NC}"
    else
        echo -e "Minikube:    ${RED}Not installed${NC}"
    fi
    
    # kubectl
    if command_exists kubectl; then
        echo -e "kubectl:     ${GREEN}$(kubectl version --client --short 2>/dev/null | head -1 || echo 'installed')${NC}"
    else
        echo -e "kubectl:     ${RED}Not installed${NC}"
    fi
    
    # Helm
    if command_exists helm; then
        echo -e "Helm:        ${GREEN}$(helm version --short 2>/dev/null || echo 'installed')${NC}"
    else
        echo -e "Helm:        ${RED}Not installed${NC}"
    fi
    
    # kubectl-ai
    if command_exists kubectl-ai; then
        echo -e "kubectl-ai:  ${GREEN}Installed${NC}"
    else
        echo -e "kubectl-ai:  ${YELLOW}Not installed${NC}"
    fi
    
    # kagent
    if command_exists kagent; then
        echo -e "Kagent:      ${GREEN}Installed${NC}"
    else
        echo -e "Kagent:      ${YELLOW}Not installed${NC}"
    fi
    
    echo ""
    echo "Environment Variables:"
    echo "======================"
    
    if [ -n "$GEMINI_API_KEY" ]; then
        echo -e "GEMINI_API_KEY:  ${GREEN}Set${NC}"
    else
        echo -e "GEMINI_API_KEY:  ${YELLOW}Not set${NC}"
    fi
    
    if [ -n "$OPENAI_API_KEY" ]; then
        echo -e "OPENAI_API_KEY:  ${GREEN}Set${NC}"
    else
        echo -e "OPENAI_API_KEY:  ${YELLOW}Not set${NC}"
    fi
    
    echo ""
    if minikube status &>/dev/null; then
        echo -e "Minikube Status: ${GREEN}Running${NC}"
    else
        echo -e "Minikube Status: ${YELLOW}Not running${NC}"
    fi
}

# ====================================
# Main Menu
# ====================================
show_menu() {
    echo ""
    echo "Phase IV Setup Script"
    echo "====================="
    echo "1. Run full setup (all steps)"
    echo "2. Check prerequisites only"
    echo "3. Install Minikube"
    echo "4. Install kubectl"
    echo "5. Install Helm"
    echo "6. Install kubectl-ai"
    echo "7. Install Kagent"
    echo "8. Start Minikube cluster"
    echo "9. Configure Docker environment"
    echo "10. Create project structure"
    echo "11. Verify installation"
    echo "0. Exit"
    echo ""
}

# ====================================
# Main
# ====================================
main() {
    if [ "$1" == "--full" ] || [ "$1" == "-f" ]; then
        # Run full setup
        check_prerequisites
        install_minikube
        install_kubectl
        install_helm
        install_kubectl_ai
        install_kagent
        start_minikube
        configure_docker_env
        create_project_structure
        verify_installation
        
        print_header "Setup Complete!"
        print_info "Next steps:"
        echo "1. Run: eval \$(minikube docker-env)"
        echo "2. Build your Docker images"
        echo "3. Create Helm charts"
        echo "4. Deploy with: helm install todo-release ./helm/todo-app"
        exit 0
    fi
    
    # Interactive menu
    while true; do
        show_menu
        read -p "Select option: " choice
        
        case $choice in
            1) 
                check_prerequisites
                install_minikube
                install_kubectl
                install_helm
                install_kubectl_ai
                install_kagent
                start_minikube
                configure_docker_env
                create_project_structure
                verify_installation
                ;;
            2) check_prerequisites ;;
            3) install_minikube ;;
            4) install_kubectl ;;
            5) install_helm ;;
            6) install_kubectl_ai ;;
            7) install_kagent ;;
            8) start_minikube ;;
            9) configure_docker_env ;;
            10) create_project_structure ;;
            11) verify_installation ;;
            0) 
                print_info "Goodbye!"
                exit 0
                ;;
            *) print_error "Invalid option" ;;
        esac
    done
}

# Run main
main "$@"
