# Phase 4 Kubernetes Blueprint Skill

## Overview

This skill generates production-ready Kubernetes deployment artifacts for the Todo Chatbot (Phase 4 of the hackathon). It creates Dockerfiles, Kubernetes manifests, Helm charts, deployment scripts, and comprehensive documentation following 2026 best practices.

## What It Creates

### 1. Docker Artifacts
- Multi-stage Dockerfiles with security best practices
- .dockerignore files for optimized builds
- docker-compose.yml for local testing
- Health check configurations

### 2. Kubernetes Manifests
- Deployments with health checks and resource limits
- Services for networking
- ConfigMaps for configuration
- Secrets templates (never commits actual secrets)
- HPA (Horizontal Pod Autoscaler) for autoscaling

### 3. Helm Charts
- Complete chart structure (Chart.yaml, values.yaml, templates/)
- Templated Kubernetes resources
- Environment-specific values files (dev, staging, prod)
- Helper functions (_helpers.tpl)

### 4. Scripts & Documentation
- Automated deployment scripts for Minikube
- Comprehensive README with troubleshooting
- AI tool usage examples (kubectl-ai, kagent, Gordon)
- Cleanup and maintenance scripts

## Usage

### Quick Start

```bash
# Run the skill directly
/phase4-k8s-blueprint
```

### Manual Invocation

```
Generate complete Phase 4 Kubernetes deployment blueprint for the Todo Chatbot
```

### What Happens

The skill will:
1. ✅ Analyze your Phase 3 application structure
2. ✅ Read existing configuration and dependencies
3. ✅ Generate all deployment artifacts
4. ✅ Create scripts and documentation
5. ✅ Provide verification and next steps

## Prerequisites

Before using this skill, ensure you have:

- ✅ Completed Phase 3 chatbot application
- ✅ Docker Desktop installed (v4.38+ for Gordon AI)
- ✅ Minikube installed (v1.32+)
- ✅ kubectl installed (v1.28+)
- ✅ Helm installed (v3.12+)

## Generated File Structure

```
project-root/
├── frontend/
│   ├── Dockerfile                    # Multi-stage Next.js build
│   └── .dockerignore                 # Exclude unnecessary files
├── backend/
│   ├── Dockerfile                    # Multi-stage FastAPI build
│   └── .dockerignore                 # Exclude unnecessary files
├── docker-compose.yml                # Local container testing
├── .env.example                      # Environment variable template
├── k8s/
│   ├── README.md                     # Deployment documentation
│   └── base/
│       ├── namespace.yaml            # Kubernetes namespace
│       ├── backend-deployment.yaml   # Backend deployment config
│       ├── frontend-deployment.yaml  # Frontend deployment config
│       ├── services.yaml             # Service definitions
│       ├── configmap.yaml            # Configuration data
│       ├── secret-template.yaml      # Secret template (no real values)
│       └── hpa.yaml                  # Autoscaling config
├── helm/
│   └── todo-chatbot/
│       ├── Chart.yaml                # Chart metadata
│       ├── values.yaml               # Default configuration
│       ├── values-dev.yaml           # Development overrides
│       ├── values-staging.yaml       # Staging overrides
│       ├── values-prod.yaml          # Production overrides
│       └── templates/
│           ├── _helpers.tpl          # Template functions
│           ├── namespace.yaml
│           ├── backend-deployment.yaml
│           ├── frontend-deployment.yaml
│           ├── backend-service.yaml
│           ├── frontend-service.yaml
│           ├── configmap.yaml
│           ├── secrets.yaml
│           ├── hpa.yaml
│           └── NOTES.txt             # Post-install notes
└── scripts/
    ├── deploy-minikube.sh            # Automated deployment
    ├── build-images.sh               # Build Docker images
    └── cleanup.sh                    # Cleanup resources
```

## Best Practices Implemented

### Security
✅ Non-root users in containers
✅ Secret management (no hardcoded values)
✅ Resource limits to prevent DoS
✅ Read-only root filesystem where possible

### Reliability
✅ Health checks (liveness and readiness probes)
✅ Rolling updates with zero downtime
✅ Horizontal pod autoscaling
✅ Proper restart policies

### Performance
✅ Multi-stage Docker builds
✅ Layer caching optimization
✅ Proper resource requests and limits
✅ Image size optimization (<500MB frontend, <200MB backend)

### Maintainability
✅ Helm charts for configuration management
✅ Environment-specific value files
✅ Comprehensive documentation
✅ Automated deployment scripts

## AI Tools Integration

The skill includes examples and documentation for:

### kubectl-ai
```bash
kubectl-ai "deploy the todo frontend with 2 replicas"
kubectl-ai "scale the backend to handle more load"
kubectl-ai "check why the pods are failing"
```

### kagent
```bash
kagent "analyze the cluster health"
kagent "optimize resource allocation"
```

### Gordon (Docker AI)
```bash
docker ai "analyze the todo-backend image"
docker ai "create an optimized Dockerfile for this FastAPI project"
```

## Verification Steps

After the skill generates all artifacts:

1. **Review Generated Files**
   ```bash
   ls -R k8s/ helm/ scripts/
   ```

2. **Lint Helm Chart**
   ```bash
   helm lint ./helm/todo-chatbot
   ```

3. **Validate Kubernetes Manifests**
   ```bash
   kubectl apply --dry-run=client -f k8s/base/
   ```

4. **Test Docker Builds**
   ```bash
   docker build -t todo-backend:latest -f backend/Dockerfile backend/
   docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/
   ```

5. **Test with Docker Compose**
   ```bash
   docker-compose up -d
   curl http://localhost:8000/health
   curl http://localhost:3000
   ```

## Next Steps After Generation

1. ✅ **Review & Customize**: Check generated Dockerfiles and manifests
2. ✅ **Create Secrets**: Copy `.env.example` to `.env` with actual values
3. ✅ **Build Images**: Test Docker builds locally
4. ✅ **Test Locally**: Use docker-compose for integration testing
5. ✅ **Deploy to Minikube**: Run deployment script
6. ✅ **Verify Deployment**: Check pods, services, and access application
7. ✅ **Prepare for Phase 5**: Review for cloud deployment readiness

## Troubleshooting

### Skill doesn't generate files
- Ensure you're in the project root directory
- Verify Phase 3 application exists (frontend/ and backend/ directories)
- Check file permissions

### Generated Dockerfiles don't work
- Review application dependencies in package.json / pyproject.toml
- Customize build commands if your app structure differs
- Check for missing environment variables

### Helm charts fail validation
- Run `helm lint ./helm/todo-chatbot`
- Check for YAML syntax errors
- Verify all required values are defined

## Success Criteria

After using this skill, you should have:

- ✅ Production-ready Dockerfiles that build successfully
- ✅ Complete Kubernetes manifests that pass validation
- ✅ Working Helm chart that deploys to Minikube
- ✅ Documentation for deployment and troubleshooting
- ✅ Scripts for automated deployment
- ✅ All artifacts ready for Phase 5 cloud deployment

## References

Based on verified 2026 documentation:

- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- [Phase 4 Specification](../../specs/001-local-k8s-deployment/spec.md)
- [Minikube Official Docs](https://minikube.sigs.k8s.io/docs/)
- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [kubectl-ai by Google](https://github.com/GoogleCloudPlatform/kubectl-ai)
- [Docker Gordon AI](https://www.docker.com/blog/meet-gordon-an-ai-agent-for-docker/)

## Contributing

This skill is part of the Hackathon II project. Improvements welcome!

To enhance this skill:
1. Add new templates to `templates/` directory
2. Update SKILL.md with new patterns
3. Test with different application structures
4. Submit improvements via PR

## License

MIT - Generated for hackathon educational purposes

---

**Created**: 2026-02-02
**Version**: 1.0.0
**Hackathon Phase**: 4
**Bonus Points**: +200 (Reusable Intelligence via Claude Code Skills)
