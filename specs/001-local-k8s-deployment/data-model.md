# Data Model: Phase 4 - Kubernetes Deployment Entities

**Feature**: 001-local-k8s-deployment
**Date**: 2026-02-02
**Status**: Complete

## Overview

Phase 4 does NOT introduce new application data entities. Instead, this document models the **deployment infrastructure entities** that represent containerized applications and Kubernetes resources. The application data model (Task, Conversation, Message, User, Tag) remains unchanged from Phase 3.

---

## Infrastructure Entities

### 1. Container Image

**Description**: Immutable package containing application code, runtime, dependencies, and configuration.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| repository | string | Required | Image repository name (e.g., "todo-backend", "todo-frontend") |
| tag | string | Required, default "latest" | Version identifier (e.g., "v1.0.0", "latest", commit SHA) |
| digest | string | Optional (SHA256) | Immutable content hash (e.g., "sha256:abc123...") |
| size | integer | Bytes | Compressed image size (backend < 200MB, frontend < 500MB) |
| layers | array<Layer> | 1-20 layers | Filesystem layers (base OS, dependencies, app code) |
| created_at | datetime | ISO 8601 | Build timestamp |
| platform | string | amd64 | CPU architecture (amd64 for Minikube) |

**Validation Rules**:
- Repository name: lowercase, alphanumeric with dashes
- Tag: alphanumeric with dots/dashes (no spaces)
- Size limits: backend < 200MB compressed, frontend < 500MB compressed

**Example**:
```yaml
repository: todo-backend
tag: 2026-02-02-abc123
digest: sha256:7f8c9d...
size: 185MB
layers: [base, dependencies, app-code]
created_at: 2026-02-02T10:30:00Z
platform: linux/amd64
```

---

### 2. Kubernetes Pod

**Description**: Smallest deployable unit containing one or more containers sharing network and storage.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| name | string | RFC 1123 DNS label | Generated name (e.g., "todo-backend-7d8c9-f4g5h") |
| namespace | string | Required, default "todo-chatbot" | Logical cluster partition |
| phase | enum | Pending/Running/Succeeded/Failed/Unknown | Pod lifecycle phase |
| containers | array<Container> | 1-5 containers | Main + init containers |
| restartPolicy | enum | Always/OnFailure/Never | Restart behavior (default: Always) |
| resources | ResourceRequirements | Required | CPU/memory requests and limits |
| probes | Probes | Optional | Liveness, readiness, startup checks |
| volumes | array<Volume> | 0-10 volumes | ConfigMaps, Secrets, emptyDir |
| nodeName | string | Assigned by scheduler | Node where pod runs |
| startTime | datetime | ISO 8601 | Pod creation timestamp |

**Validation Rules**:
- Name: lowercase alphanumeric with dashes, max 63 characters
- Namespace: must exist before pod creation
- Resources: requests ≤ limits (CPU in millicores, memory in bytes)

**Example**:
```yaml
name: todo-backend-7d8c9-f4g5h
namespace: todo-chatbot
phase: Running
containers:
  - name: backend
    image: todo-backend:latest
    ports: [8000]
    env: [{DATABASE_URL: "..."}, {OPENAI_API_KEY: "..."}]
restartPolicy: Always
resources:
  requests: {cpu: "500m", memory: "512Mi"}
  limits: {cpu: "500m", memory: "512Mi"}
probes:
  livenessProbe: {httpGet: {path: "/health", port: 8000}}
  readinessProbe: {httpGet: {path: "/health", port: 8000}}
```

---

### 3. Kubernetes Deployment

**Description**: Declarative configuration for managing pod replicas with rolling update strategy.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| name | string | RFC 1123 DNS label | Deployment name (e.g., "todo-backend") |
| namespace | string | Required | Namespace (default: "todo-chatbot") |
| replicas | integer | 1-10 | Desired number of pods (backend: 2, frontend: 1) |
| selector | LabelSelector | Required | Identifies pods managed by deployment |
| template | PodTemplateSpec | Required | Pod specification (image, resources, probes) |
| strategy | DeploymentStrategy | Required | RollingUpdate or Recreate (default: RollingUpdate) |
| maxSurge | integer/percentage | Default 25% | Max pods above desired during update |
| maxUnavailable | integer/percentage | Default 25% | Max pods unavailable during update |
| revisionHistoryLimit | integer | Default 10 | Number of old ReplicaSets to retain for rollback |

**Validation Rules**:
- Selector labels must match template labels
- maxSurge + maxUnavailable > 0 (at least one pod running during update)
- Replicas: 1-5 for Minikube (resource constraints)

**Example**:
```yaml
name: todo-backend
namespace: todo-chatbot
replicas: 2
selector:
  matchLabels:
    app: todo-chatbot
    component: backend
template:
  metadata:
    labels: {app: todo-chatbot, component: backend}
  spec:
    containers: [...]
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0  # Zero downtime
```

---

### 4. Kubernetes Service

**Description**: Network abstraction providing stable endpoint for accessing pods.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| name | string | RFC 1123 DNS label | Service name (e.g., "todo-backend-service") |
| namespace | string | Required | Namespace (default: "todo-chatbot") |
| type | enum | ClusterIP/NodePort/LoadBalancer | Exposure type (default: ClusterIP) |
| clusterIP | string | Assigned by K8s | Internal cluster IP (e.g., "10.96.0.1") |
| ports | array<ServicePort> | 1-10 ports | Port mappings (port, targetPort, protocol) |
| selector | map<string,string> | Required | Routes traffic to pods with matching labels |
| sessionAffinity | enum | None/ClientIP | Sticky sessions (default: None for stateless) |

**Validation Rules**:
- Selector must match at least one pod label
- Ports: 1-65535, targetPort must exist on pod containers
- ClusterIP for internal services, NodePort/LoadBalancer for external access

**Example**:
```yaml
name: todo-backend-service
namespace: todo-chatbot
type: ClusterIP
clusterIP: 10.96.0.10
ports:
  - name: http
    port: 8000
    targetPort: 8000
    protocol: TCP
selector:
  app: todo-chatbot
  component: backend
sessionAffinity: None
```

---

### 5. ConfigMap

**Description**: Key-value store for non-sensitive configuration data accessible to pods.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| name | string | RFC 1123 DNS label | ConfigMap name (e.g., "todo-chatbot-config") |
| namespace | string | Required | Namespace (default: "todo-chatbot") |
| data | map<string,string> | Key-value pairs | Configuration data (max 1MB total size) |
| immutable | boolean | Default false | Prevents updates after creation |

**Data Keys (Phase 4)**:
- ENVIRONMENT: "development" | "staging" | "production"
- DEBUG: "true" | "false"
- CORS_ORIGINS: Comma-separated URLs (e.g., "http://localhost:3000")

**Validation Rules**:
- Keys: alphanumeric with dots/dashes/underscores
- Values: UTF-8 strings
- Total size: < 1MB (Kubernetes limit)

**Example**:
```yaml
name: todo-chatbot-config
namespace: todo-chatbot
data:
  ENVIRONMENT: "development"
  DEBUG: "true"
  CORS_ORIGINS: "http://localhost:3000,http://localhost:3001"
immutable: false
```

---

### 6. Secret

**Description**: Key-value store for sensitive data (credentials, API keys) with base64 encoding.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| name | string | RFC 1123 DNS label | Secret name (e.g., "todo-chatbot-secrets") |
| namespace | string | Required | Namespace (default: "todo-chatbot") |
| type | string | Default "Opaque" | Secret type (Opaque for generic data) |
| data | map<string,base64> | Key-value pairs | Base64-encoded sensitive data |
| immutable | boolean | Default false | Prevents updates after creation |

**Data Keys (Phase 4)**:
- DATABASE_URL: Neon PostgreSQL connection string
- BETTER_AUTH_SECRET: JWT signing key (32+ characters)
- OPENAI_API_KEY: OpenAI API key (starts with "sk-proj-...")

**Validation Rules**:
- Keys: alphanumeric with dots/dashes/underscores
- Values: base64-encoded UTF-8 strings
- Total size: < 1MB (Kubernetes limit)

**Example**:
```yaml
name: todo-chatbot-secrets
namespace: todo-chatbot
type: Opaque
data:
  DATABASE_URL: "cG9zdGdyZXNxbCthc3luY3BnOi8v..."  # base64
  BETTER_AUTH_SECRET: "RFl6TE9VZzJQN1RrMDNKeEx..."
  OPENAI_API_KEY: "c2stcHJvai1..."
immutable: false
```

---

### 7. HorizontalPodAutoscaler (HPA)

**Description**: Automatically scales deployment replicas based on resource utilization.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| name | string | RFC 1123 DNS label | HPA name (e.g., "todo-backend-hpa") |
| namespace | string | Required | Namespace (default: "todo-chatbot") |
| scaleTargetRef | CrossVersionObjectReference | Required | Target deployment |
| minReplicas | integer | 1-10 | Minimum pod count (backend: 2) |
| maxReplicas | integer | > minReplicas | Maximum pod count (backend: 5) |
| metrics | array<MetricSpec> | 1-10 metrics | CPU, memory, or custom metrics |
| targetCPUUtilization | integer | 1-100 (percentage) | Target average CPU (backend: 70%) |

**Validation Rules**:
- minReplicas ≤ maxReplicas
- scaleTargetRef must reference existing Deployment
- Metrics: at least one metric defined

**Example**:
```yaml
name: todo-backend-hpa
namespace: todo-chatbot
scaleTargetRef:
  apiVersion: apps/v1
  kind: Deployment
  name: todo-backend
minReplicas: 2
maxReplicas: 5
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

### 8. Helm Chart

**Description**: Package containing Kubernetes resource templates and configuration values.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| name | string | Alphanumeric with dashes | Chart name (e.g., "todo-chatbot") |
| version | string | SemVer (e.g., "1.0.0") | Chart version |
| appVersion | string | Any format | Application version (e.g., "0.1.0") |
| description | string | 1-200 characters | Chart description |
| apiVersion | string | "v2" | Helm chart API version (Helm 3) |
| type | enum | "application" | Chart type |
| dependencies | array<Dependency> | Optional | Dependent charts |
| templates | array<Template> | 1-50 files | Kubernetes resource templates |
| values | map<string,any> | YAML structure | Default configuration values |

**Template Files (Phase 4)**:
- _helpers.tpl: Named templates for labels, selectors
- namespace.yaml: Dedicated namespace
- backend-deployment.yaml, frontend-deployment.yaml
- backend-service.yaml, frontend-service.yaml
- configmap.yaml, secrets.yaml
- hpa.yaml: Horizontal Pod Autoscaler
- NOTES.txt: Post-install instructions

**Validation Rules**:
- Version must be SemVer format
- Templates must be valid YAML with Go template syntax
- Values schema validated against Chart schema.json (if present)

**Example**:
```yaml
apiVersion: v2
name: todo-chatbot
version: 1.0.0
appVersion: "0.1.0"
description: Helm chart for Phase 3 Todo Chatbot with AI agent
type: application
dependencies: []
templates:
  - _helpers.tpl
  - namespace.yaml
  - backend-deployment.yaml
  - backend-service.yaml
  - frontend-deployment.yaml
  - frontend-service.yaml
  - configmap.yaml
  - secrets.yaml
  - hpa.yaml
```

---

## Relationships

```
Helm Chart
  ├── values.yaml (configuration)
  └── templates/
      ├── Namespace
      ├── ConfigMap (non-sensitive config)
      ├── Secret (credentials, API keys)
      ├── Deployment (backend)
      │   ├── PodTemplateSpec
      │   │   ├── initContainers (migrations)
      │   │   └── containers
      │   │       └── Container Image (todo-backend:latest)
      │   └── ReplicaSet (created by Deployment)
      │       └── Pods (2 replicas)
      │           ├── Liveness Probe → /health
      │           ├── Readiness Probe → /health
      │           └── Startup Probe → /health
      ├── Deployment (frontend)
      │   └── ReplicaSet
      │       └── Pods (1 replica)
      │           └── Container Image (todo-frontend:latest)
      ├── Service (backend) → routes to backend pods
      ├── Service (frontend) → routes to frontend pods
      └── HPA → scales backend Deployment based on CPU
```

---

## Persistence Strategy

**External Neon PostgreSQL**:
- Application data (tasks, conversations, messages, users) stored in Neon PostgreSQL
- No persistent volumes in Kubernetes (stateless pods)
- Database connection pooling handles multiple pod replicas
- Conversations survive pod restarts (database-backed state)

**Ephemeral Pod Storage**:
- Logs: stdout/stderr (captured by kubectl logs)
- Temp files: emptyDir volumes (deleted when pod terminates)
- No local state (enables horizontal scaling)

---

## State Management

**Stateless Design** (Phase 3 Architecture):
- Backend: FastAPI with async database sessions (no in-memory state)
- Frontend: Next.js server rendering (no server-side session state)
- Agent: Conversation history loaded from database per request
- Authentication: JWT tokens in cookies (stateless validation)

**Kubernetes Implications**:
- Pods can scale horizontally (no pod affinity required)
- Load balancing: Round-robin across pods
- Rolling updates: Zero downtime (readiness probes prevent traffic to unready pods)
- Pod failures: Automatic restart with no data loss

---

## Security Model

**Container Security**:
- Non-root user (appuser, UID 1000) in all containers
- Read-only root filesystem (where possible)
- No privileged containers
- Resource limits prevent DoS attacks

**Network Security**:
- Services: ClusterIP only (no external exposure in Minikube)
- Frontend access: `minikube service` command (tunnels to localhost)
- Backend access: Internal only (frontend → backend via Service DNS)
- CORS: Configured via ConfigMap (frontend origins only)

**Secret Management**:
- Kubernetes Secrets: Base64 encoded (not encrypted at rest in Minikube)
- Environment variables: Injected from Secrets at pod startup
- No hardcoded credentials: All secrets externalized
- Future: Sealed Secrets or External Secrets Operator for production

---

## Validation Rules Summary

| Entity | Key Validation |
|--------|----------------|
| Container Image | Size < 200MB (backend), < 500MB (frontend); tag format; platform amd64 |
| Pod | Resources: requests ≤ limits; name RFC 1123; namespace exists |
| Deployment | Selector = template labels; replicas 1-5; maxSurge+maxUnavailable > 0 |
| Service | Selector matches pods; ports 1-65535; targetPort exists on container |
| ConfigMap | Keys alphanumeric; values UTF-8; total size < 1MB |
| Secret | Keys alphanumeric; values base64; total size < 1MB |
| HPA | minReplicas ≤ maxReplicas; scaleTargetRef valid; at least one metric |
| Helm Chart | Version SemVer; templates valid YAML; values match schema |

---

## Next Steps

1. Create API contracts in contracts/ (Helm values schema, Kubernetes manifests)
2. Generate quickstart.md (developer setup guide)
3. Update .specify agent context with Kubernetes/Docker technologies
