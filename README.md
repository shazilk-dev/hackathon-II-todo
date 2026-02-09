# Hackathon II - Spec-Driven Todo Application

A comprehensive multi-phase todo application demonstrating modern software development practices, progressing from a console application to a cloud-deployed AI-powered chatbot with full Kubernetes orchestration.

## Project Overview

This project implements a full-stack, AI-powered task management system following Spec-Driven Development (SDD) principles. Built as part of Hackathon II, it demonstrates enterprise-grade architecture, cloud-native deployment, and modern development practices across five progressive phases.

### Technology Stack

- **Languages**: Python 3.13+, TypeScript 5.7+
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: FastAPI 0.109+, SQLModel 0.0.14+
- **Database**: Neon PostgreSQL 15+ (serverless)
- **AI Integration**: OpenAI Agents SDK, FastMCP (Model Context Protocol)
- **Authentication**: NextAuth.js with JWT
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes, Helm 3.x
- **Cloud Platform**: Azure AKS, Dapr 1.14+
- **Event Streaming**: Redpanda Cloud (Kafka-compatible)

## Five-Phase Architecture

## Five-Phase Architecture

### Phase 1: Console Todo Application (Complete)

**Objective**: Build a menu-driven console application with in-memory task management.

**Features**:

- CRUD operations for tasks (Create, Read, Update, Delete)
- Task completion status toggling
- In-memory data persistence
- Comprehensive input validation
- Full type hints with strict mypy checking
- 80%+ test coverage with pytest

**Technical Highlights**:

- Single-module design with `Task` dataclass and `TaskManager` class
- Performance optimized for 100+ tasks
- Relative timestamp display
- UV package manager integration

**Quick Start**:

```bash
cd hackathon-todo
uv sync
uv run python main.py
```

**Testing**:

```bash
uv run pytest --cov=main --cov-report=term-missing
uv run mypy --strict main.py
```

---

### Phase 2: Full-Stack Web Application (Complete)

**Objective**: Transform console app into a modern web application with authentication and persistence.

**Architecture**:

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Next.js    │  HTTP   │   FastAPI    │  SQL    │  PostgreSQL  │
│   Frontend   │────────▶│   Backend    │────────▶│   Database   │
│  (Port 3000) │         │  (Port 8000) │         │    (Neon)    │
└──────────────┘         └──────────────┘         └──────────────┘
```

**Frontend Features**:

- Server-side authentication with NextAuth.js
- Responsive UI with Tailwind CSS (mobile, tablet, desktop)
- Protected routes with middleware
- JWT token management
- Real-time task filtering (all, pending, completed)
- Professional minimalist design (2026 standards)

**Backend Features**:

- RESTful API with async/await patterns
- JWT authentication middleware
- User isolation and data security
- SQLModel ORM with async PostgreSQL
- Alembic database migrations
- Comprehensive error handling
- Clean layered architecture (API → Service → Data)

**Quick Start**:

Backend:

```bash
cd backend
uv sync
cp .env.example .env
# Configure DATABASE_URL, AUTH_SECRET, CORS_ORIGINS
uv run alembic upgrade head
uv run uvicorn src.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Configure NEXT_PUBLIC_API_URL, AUTH_SECRET, DATABASE_URL
npm run dev
```

**API Endpoints**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{user_id}/tasks` | List tasks with filtering |
| POST | `/api/{user_id}/tasks` | Create new task |
| GET | `/api/{user_id}/tasks/{task_id}` | Get specific task |
| PUT | `/api/{user_id}/tasks/{task_id}` | Update task |
| DELETE | `/api/{user_id}/tasks/{task_id}` | Delete task |
| PATCH | `/api/{user_id}/tasks/{task_id}/complete` | Toggle completion |

---

### Phase 3: AI-Powered Chatbot (Complete)

**Objective**: Add conversational AI interface using OpenAI Agents SDK and Model Context Protocol.

**Architecture**:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  ChatKit UI     │────▶│  Chat Endpoint   │────▶│  OpenAI Agent   │
│  (React)        │     │  (FastAPI)       │     │  (GPT-4+)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  Conversation    │     │  MCP Server     │
                        │  History DB      │     │  (5 Tools)      │
                        └──────────────────┘     └─────────────────┘
```

**Key Features**:

- Natural language task management
- Stateless conversation handling with database persistence
- MCP server exposing 5 task operation tools:
  - `add_task`: Create tasks from natural language
  - `list_tasks`: Query tasks with filters
  - `complete_task`: Mark tasks complete
  - `delete_task`: Remove tasks
  - `update_task`: Modify task details
- OpenAI ChatKit integration for UI
- Conversation history tracking
- Context-aware responses

**Example Interactions**:

```
User: "Add a task to buy groceries"
AI: "I've added 'Buy groceries' to your task list."

User: "What's on my list?"
AI: "You have 3 tasks: 1. Buy groceries (pending), 2. Call mom (pending), 3. Finish report (completed)"

User: "Mark the groceries task as done"
AI: "'Buy groceries' has been marked as complete."
```

**Quick Start**:

```bash
# Backend with MCP server
cd backend
# Configure OPENAI_API_KEY in .env
uv run uvicorn src.main:app --reload --port 8000

# Frontend with ChatKit
cd frontend
npm run dev
# Navigate to /chat for AI interface
```

**Documentation**: See [guides/PHASE3_MASTER_GUIDE.md](./guides/PHASE3_MASTER_GUIDE.md)

---

### Phase 4: Kubernetes Deployment (Complete)

**Objective**: Containerize and deploy to local Kubernetes cluster using Minikube and Helm.

**Architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                   Minikube Cluster                          │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Frontend   │         │   Backend    │                │
│  │  (Next.js)   │────────▶│  (FastAPI)   │                │
│  │  1 replica   │         │  2 replicas  │                │
│  │              │         │              │                │
│  │  Port: 3000  │         │  Port: 8000  │                │
│  └──────────────┘         └──────────────┘                │
│        │                         │                         │
│  ┌─────▼──────┐           ┌──────▼───────┐                │
│  │  Service   │           │   Service    │                │
│  │ (ClusterIP)│           │  (ClusterIP) │                │
│  └────────────┘           └──────────────┘                │
│                                  │                         │
│                           ┌──────▼───────┐                │
│                           │     HPA      │                │
│                           │  (2-5 pods)  │                │
│                           └──────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:

- Multi-stage Docker builds for optimized images
- Kubernetes manifests with ConfigMaps and Secrets
- Horizontal Pod Autoscaling (2-5 replicas, 70% CPU)
- Health checks and readiness probes
- Helm chart with environment-specific values
- Automated deployment scripts
- Namespace isolation

**Quick Start**:

```bash
# Start Minikube
minikube start --cpus=2 --memory=4096

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Deploy with Helm (recommended)
./scripts/deploy-helm.sh

# Access application
minikube service todo-chatbot-frontend -n todo-chatbot
```

**Helm Deployment**:

```bash
# Install
helm install todo-chatbot ./helm/todo-chatbot -n todo-chatbot --create-namespace

# Upgrade
helm upgrade todo-chatbot ./helm/todo-chatbot -n todo-chatbot

# Rollback
helm rollback todo-chatbot -n todo-chatbot

# Uninstall
helm uninstall todo-chatbot -n todo-chatbot
```

**Documentation**: See [README-PHASE4.md](./README-PHASE4.md)

---

### Phase 5: Azure Cloud Deployment (Complete)

**Objective**: Deploy to production-grade cloud infrastructure with event streaming and service mesh.

**Architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Azure Cloud                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Azure Kubernetes Service (AKS)                            │ │
│  │                                                             │ │
│  │  ┌──────────────┐    ┌──────────────┐                     │ │
│  │  │   Frontend   │    │   Backend    │                     │ │
│  │  │  (Next.js)   │◄───┤   (FastAPI)  │                     │ │
│  │  │  + Dapr      │    │   + Dapr     │                     │ │
│  │  │  2-5 pods    │    │   2-5 pods   │                     │ │
│  │  └──────┬───────┘    └──────┬───────┘                     │ │
│  │         │                    │                             │ │
│  │  ┌──────▼────────────────────▼────────┐                   │ │
│  │  │  Dapr Runtime (v1.14+)             │                   │ │
│  │  │  - Service Mesh                    │                   │ │
│  │  │  - Pub/Sub (Kafka)                 │                   │ │
│  │  │  - State Management                │                   │ │
│  │  │  - Secrets Management              │                   │ │
│  │  └────────────────────────────────────┘                   │ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────┐                   │ │
│  │  │  Horizontal Pod Autoscaler (HPA)   │                   │ │
│  │  │  - Min: 2 pods, Max: 5 pods        │                   │ │
│  │  │  - Trigger: 70% CPU                │                   │ │
│  │  └────────────────────────────────────┘                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────┐   ┌──────────────────┐                   │
│  │  Azure Container │   │  Load Balancer   │                   │
│  │  Registry (ACR)  │   │  (Public IP)     │                   │
│  └──────────────────┘   └──────────────────┘                   │
└──────────────────────────────────────────────────────────────────┘

External Services:
┌──────────────────┐   ┌──────────────────┐
│  Neon PostgreSQL │   │ Redpanda Cloud   │
│  (Managed DB)    │   │  (Kafka)         │
└──────────────────┘   └──────────────────┘
```

**Key Features**:

- Azure Kubernetes Service (AKS) cluster
- Dapr distributed application runtime
- Event-driven architecture with Kafka (Redpanda Cloud)
- Azure Container Registry for image storage
- Public internet access via LoadBalancer
- Automated CI/CD with GitHub Actions
- Infrastructure as Code
- Cost optimization strategies
- Monitoring and logging

**Deployment Options**:

| Setup              | Cost        | Duration                 | Best For                    |
| ------------------ | ----------- | ------------------------ | --------------------------- |
| **Student Budget** | $8-10/month | 10 months on $100 credit | Hackathons, learning, demos |
| **Production**     | $175/month  | 18 days on $100 credit   | Enterprise applications     |

**Quick Start (Student Budget)**:

```bash
# 1. Configure for budget mode
cp .env.example .env
# Edit: AZURE_LOCATION=centralindia, AKS_VM_SIZE=Standard_B2s, AKS_NODE_COUNT=1

# 2. Setup Azure infrastructure (15-20 min)
./scripts/setup-aks.sh

# 3. Install Dapr (3-5 min)
./scripts/install-dapr.sh

# 4. Configure secrets
./scripts/setup-secrets.sh

# 5. Build and deploy (10-15 min)
az acr login --name hackathontodoacr
docker build -t hackathontodoacr.azurecr.io/todo-backend:latest ./backend
docker build -t hackathontodoacr.azurecr.io/todo-frontend:latest ./frontend
docker push hackathontodoacr.azurecr.io/todo-backend:latest
docker push hackathontodoacr.azurecr.io/todo-frontend:latest
./scripts/deploy.sh latest

# 6. Get frontend URL
kubectl get service -n default -l app.kubernetes.io/component=frontend
# Visit http://<EXTERNAL-IP>:3000

# 7. Save costs: Stop when not in use
./scripts/stop-cluster.sh  # End of day
./scripts/start-cluster.sh # Next morning
```

**Cost Optimization**:

- Free tier AKS cluster (no management fees)
- Burstable VMs (Standard_B2s)
- Stop/start capability (save 70-80%)
- Minimal node count (1 node for development)
- Region selection (centralindia for Asian markets)

**Documentation**:

- Student Budget: [README-STUDENT-BUDGET.md](./README-STUDENT-BUDGET.md)
- Complete Guide: [README-PHASE5.md](./README-PHASE5.md)
- Beginner Guide: [COMPLETE-BEGINNER-GUIDE.md](./COMPLETE-BEGINNER-GUIDE.md)

---

## Project Structure

```
hackathon-todo/
├── main.py                       # Phase 1: Console application
├── tests/                        # Phase 1: Console tests
├── backend/                      # Phase 2-5: FastAPI backend
│   ├── src/
│   │   ├── main.py              # Application entry point
│   │   ├── config.py            # Environment configuration
│   │   ├── api/
│   │   │   ├── routers/         # API endpoints
│   │   │   └── middleware/      # JWT authentication
│   │   ├── services/            # Business logic layer
│   │   ├── models/              # SQLModel database models
│   │   ├── schemas/             # Pydantic request/response
│   │   └── db/                  # Database session & migrations
│   ├── tests/                   # Backend test suite
│   │   ├── unit/               # Service layer tests
│   │   ├── integration/        # API + DB tests
│   │   └── contract/           # Schema validation tests
│   ├── Dockerfile              # Phase 4: Multi-stage build
│   └── pyproject.toml          # UV dependencies
├── frontend/                    # Phase 2-5: Next.js frontend
│   ├── app/
│   │   ├── auth/               # Sign-in/sign-up pages
│   │   ├── dashboard/          # Task management UI
│   │   ├── chat/               # Phase 3: AI chatbot UI
│   │   └── api/                # NextAuth API routes
│   ├── components/
│   │   ├── providers/          # Auth context provider
│   │   ├── layout/             # Header, navigation
│   │   └── tasks/              # Task components
│   ├── lib/
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── auth-client.ts      # Client-side auth
│   │   └── api.ts              # Backend API client
│   ├── Dockerfile              # Phase 4: Multi-stage build
│   └── package.json
├── k8s/                         # Phase 4: Kubernetes manifests
│   └── base/
│       ├── namespace.yaml
│       ├── configmap.yaml
│       ├── secrets.yaml
│       ├── backend-deployment.yaml
│       ├── backend-service.yaml
│       ├── backend-hpa.yaml
│       ├── frontend-deployment.yaml
│       └── frontend-service.yaml
├── helm/                        # Phase 4: Helm chart
│   └── todo-chatbot/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-dev.yaml
│       ├── values-staging.yaml
│       ├── values-prod.yaml
│       └── templates/
├── dapr/                        # Phase 5: Dapr components
│   ├── components/              # Pub/sub, state store
│   └── configuration/           # Dapr configuration
├── scripts/                     # Automation scripts
│   ├── build-images.sh         # Build Docker images
│   ├── deploy-minikube.sh      # Phase 4: Minikube deployment
│   ├── deploy-helm.sh          # Phase 4: Helm deployment
│   ├── setup-aks.sh            # Phase 5: Azure setup
│   ├── install-dapr.sh         # Phase 5: Install Dapr
│   ├── deploy.sh               # Phase 5: Cloud deployment
│   ├── stop-cluster.sh         # Phase 5: Cost saving
│   └── start-cluster.sh        # Phase 5: Resume cluster
├── docs/                        # Documentation
│   └── deployment/
├── guides/                      # Phase-specific guides
│   ├── PHASE3_MASTER_GUIDE.md
│   └── last_work.md
├── specs/                       # Specifications (SDD)
├── docker-compose.yml           # Phase 4: Local testing
├── .env.example                 # Environment template
├── README-PHASE4.md             # Phase 4 documentation
├── README-PHASE5.md             # Phase 5 documentation
├── README-STUDENT-BUDGET.md     # Phase 5 budget guide
├── COMPLETE-BEGINNER-GUIDE.md   # Phase 5 beginner guide
└── README.md                    # This file
```

---

## Development Workflow

### Prerequisites

**Tools**:

- Python 3.13+ with UV package manager
- Node.js 18+ or Bun
- Docker Desktop 4.38+
- Kubernetes CLI (kubectl)
- Helm 3.12+
- Minikube 1.32+ (for Phase 4)
- Azure CLI (for Phase 5)

**Accounts**:

- Neon PostgreSQL account (free tier)
- OpenAI API key (for Phase 3)
- Azure subscription (for Phase 5)
- Redpanda Cloud account (for Phase 5)

### Local Development

**Phase 1 (Console)**:

```bash
uv sync
uv run python main.py
uv run pytest --cov
```

**Phase 2 (Web App)**:

```bash
# Terminal 1: Backend
cd backend
uv sync
cp .env.example .env
uv run alembic upgrade head
uv run uvicorn src.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

**Phase 3 (AI Chatbot)**:

```bash
# Same as Phase 2, plus:
# - Configure OPENAI_API_KEY in backend/.env
# - Navigate to http://localhost:3000/chat
```

**Phase 4 (Kubernetes)**:

```bash
minikube start
./scripts/deploy-helm.sh
minikube service todo-chatbot-frontend -n todo-chatbot
```

**Phase 5 (Azure)**:

```bash
./scripts/setup-aks.sh
./scripts/install-dapr.sh
./scripts/deploy.sh latest
```

### Testing

**Backend**:

```bash
cd backend
uv run pytest                          # All tests
uv run pytest -m unit                  # Unit tests only
uv run pytest -m integration           # Integration tests
uv run pytest --cov=src --cov-report=term-missing  # With coverage
uv run mypy src                        # Type checking
uv run ruff check src tests            # Linting
```

**Frontend**:

```bash
cd frontend
npm run type-check                     # TypeScript validation
npm run lint                           # ESLint
npm run build                          # Production build test
```

### Code Quality Standards

- **Type Safety**: 100% type hints, strict mode enabled
- **Test Coverage**: Minimum 80% for backend
- **Linting**: Ruff for Python, ESLint for TypeScript
- **Formatting**: Ruff format for Python, Prettier for TypeScript
- **Architecture**: Clean layered separation (API → Service → Data)
- **Security**: JWT authentication, user isolation, input validation
- **Documentation**: Comprehensive inline comments and docstrings

---

## Environment Variables

### Backend (backend/.env)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host/database

# Authentication
AUTH_SECRET=<32+ character secret matching frontend>

# CORS
CORS_ORIGINS=http://localhost:3000

# OpenAI (Phase 3+)
OPENAI_API_KEY=sk-...

# Environment
ENVIRONMENT=development
DEBUG=true
```

### Frontend (frontend/.env.local)

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Authentication
AUTH_SECRET=<32+ character secret matching backend>
NEXT_PUBLIC_AUTH_URL=http://localhost:3000

# Database (for NextAuth)
DATABASE_URL=postgresql://user:password@host/database
```

### Phase 5 (Azure .env)

```bash
# Azure
AZURE_SUBSCRIPTION_ID=<your-subscription-id>
AZURE_LOCATION=centralindia
AZURE_RESOURCE_GROUP=hackathon-todo-rg
AKS_CLUSTER_NAME=hackathon-todo-aks
ACR_NAME=hackathontodoacr
AKS_VM_SIZE=Standard_B2s
AKS_NODE_COUNT=1

# Redpanda Cloud
KAFKA_BROKERS=<redpanda-broker-url>:9092
KAFKA_SASL_USERNAME=<username>
KAFKA_SASL_PASSWORD=<password>
```

---

## Deployment Scripts

All automation scripts are in the `scripts/` directory:

| Script               | Purpose                         | Phase |
| -------------------- | ------------------------------- | ----- |
| `build-images.sh`    | Build Docker images in Minikube | 4     |
| `deploy-minikube.sh` | Deploy with kubectl             | 4     |
| `deploy-helm.sh`     | Deploy with Helm (recommended)  | 4     |
| `cleanup.sh`         | Clean up Minikube resources     | 4     |
| `setup-aks.sh`       | Provision Azure infrastructure  | 5     |
| `install-dapr.sh`    | Install Dapr on AKS             | 5     |
| `setup-secrets.sh`   | Configure Kubernetes secrets    | 5     |
| `deploy.sh`          | Deploy to Azure AKS             | 5     |
| `stop-cluster.sh`    | Stop AKS cluster (save costs)   | 5     |
| `start-cluster.sh`   | Restart AKS cluster             | 5     |
| `cleanup-azure.sh`   | Delete all Azure resources      | 5     |
| `rollback.sh`        | Rollback deployment             | 5     |
| `load-test.sh`       | Run load tests                  | 5     |

---

## Architecture Principles

### Clean Architecture

**Backend Layering** (Mandatory):

```
API Layer (src/api/routers/)
    ↓
Service Layer (src/services/)
    ↓
Data Layer (src/models/)
```

- **No layer skipping**: API must call Service, Service must call Data
- **Dependency direction**: Outer layers depend on inner layers
- **Pure business logic**: Service layer free from HTTP concerns

### Security

- **Authentication**: JWT tokens with signature verification
- **Authorization**: User isolation at database query level
- **Input Validation**: Pydantic schemas for all requests
- **Secrets Management**: Environment variables, Kubernetes Secrets
- **SQL Injection Prevention**: Parameterized queries via SQLModel
- **XSS Prevention**: HTTP-only cookies, CSP headers

### Performance

- **Async Everything**: All I/O operations use async/await
- **Connection Pooling**: PostgreSQL connection pool management
- **Horizontal Scaling**: HPA for automatic pod scaling
- **Caching**: In-memory caching where appropriate
- **CDN Ready**: Static assets optimized for CDN delivery

### Observability

- **Health Checks**: `/health` endpoint for liveness/readiness probes
- **Structured Logging**: JSON logs with correlation IDs
- **Metrics**: Prometheus-compatible metrics
- **Tracing**: Distributed tracing with Dapr (Phase 5)

---

## Documentation

### Phase-Specific Guides

- **Phase 3**: [guides/PHASE3_MASTER_GUIDE.md](./guides/PHASE3_MASTER_GUIDE.md) - AI chatbot implementation
- **Phase 4**: [README-PHASE4.md](./README-PHASE4.md) - Kubernetes deployment
- **Phase 5**: [README-PHASE5.md](./README-PHASE5.md) - Azure cloud deployment

### Student Resources

- **Beginner Guide**: [COMPLETE-BEGINNER-GUIDE.md](./COMPLETE-BEGINNER-GUIDE.md) - Zero cloud experience needed
- **Budget Guide**: [README-STUDENT-BUDGET.md](./README-STUDENT-BUDGET.md) - Maximize your $100 Azure credit
- **Startup Guide**: [STARTUP_GUIDE.md](./STARTUP_GUIDE.md) - Quick start for all phases

### Component Documentation

- **Backend**: [backend/README.md](./backend/README.md) - FastAPI backend details
- **Frontend**: [frontend/README.md](./frontend/README.md) - Next.js frontend details
- **Backend Development**: [backend/CLAUDE.md](./backend/CLAUDE.md) - Backend guidelines
- **Frontend Development**: [frontend/CLAUDE.md](./frontend/CLAUDE.md) - Frontend guidelines

### Deployment Documentation

- **Azure Setup**: [docs/deployment/azure-setup.md](./docs/deployment/azure-setup.md)
- **Deployment Checklist**: [docs/deployment/DEPLOYMENT-CHECKLIST.md](./docs/deployment/DEPLOYMENT-CHECKLIST.md)

---

## Troubleshooting

### Common Issues

**Database Connection Errors**:

- Verify `DATABASE_URL` format: `postgresql+asyncpg://` for backend
- Ensure PostgreSQL is running and accessible
- Check IP whitelist in Neon dashboard

**Authentication Failures**:

- Confirm `AUTH_SECRET` matches between frontend and backend
- Verify JWT token format in browser DevTools
- Check CORS configuration

**Docker Build Failures**:

- Ensure Docker daemon is running
- Check Dockerfile syntax
- Verify base image availability

**Kubernetes Pod Crashes**:

- Check pod logs: `kubectl logs <pod-name>`
- Verify environment variables and secrets
- Ensure resource limits are adequate

**Azure Deployment Issues**:

- Confirm Azure CLI authentication: `az account show`
- Verify subscription has sufficient quota
- Check service principal permissions

### Getting Help

- Review phase-specific documentation
- Check [AGENTS.md](./AGENTS.md) for architectural details
- Examine test files for usage examples
- Search GitHub issues (if applicable)

---

## Performance Benchmarks

### Phase 1 (Console)

- Add task: < 15 seconds
- View tasks: < 1 second
- Mark complete: < 10 seconds
- Supports 100+ tasks

### Phase 2 (Web App)

- API response time: < 100ms (p95)
- Page load time: < 2 seconds
- Database query time: < 50ms

### Phase 3 (AI Chatbot)

- Chat response time: < 3 seconds
- MCP tool execution: < 500ms
- Conversation recall: < 1 second

### Phase 4 (Kubernetes)

- Pod startup time: < 30 seconds
- Auto-scaling trigger time: < 1 minute
- Rolling update time: < 2 minutes

### Phase 5 (Azure AKS)

- Cold start time: < 45 seconds
- 99.9% uptime SLA
- Horizontal scaling: 2-5 pods
- Load balancer response: < 3 seconds

---

## License

This project was created as part of Hackathon II following Spec-Driven Development (SDD) principles. See individual component licenses for details.

---

## Acknowledgments

Built with:

- OpenAI GPT-4+ for AI capabilities
- Neon PostgreSQL for serverless database
- Redpanda Cloud for event streaming
- Azure for cloud infrastructure
- Open source tools and frameworks

---

## Project Status

**All Phases Complete**:

- Phase 1: Console Application
- Phase 2: Full-Stack Web App
- Phase 3: AI-Powered Chatbot
- Phase 4: Kubernetes Deployment
- Phase 5: Azure Cloud Deployment

**Production Ready**: Yes  
**Last Updated**: February 2026
