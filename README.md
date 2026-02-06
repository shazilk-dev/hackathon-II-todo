# Hackathon II - Todo Application

A multi-phase todo application progressing from console to web to AI-powered chatbot with Kubernetes deployment.

## Phases

- **Phase 1**: Console Todo Application (Python 3.13+) ✅
- **Phase 2**: Web Todo Application (Next.js + FastAPI) ✅
- **Phase 3**: AI Chatbot Integration (OpenAI Agents SDK + MCP) ✅
- **Phase 4**: Kubernetes Deployment (Minikube + Helm) ✅
- **Phase 5**: Cloud Deployment (Azure AKS + Dapr + Kafka) ✅ **Current Phase**

---

# Phase 4: Kubernetes Deployment ✅

Containerized deployment of the Phase 3 AI-powered Todo Chatbot to local Kubernetes using Minikube and Helm.

## Quick Start

```bash
# Start Minikube
minikube start --cpus=2 --memory=4096

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Deploy with Helm
./scripts/deploy-helm.sh

# Access application
minikube service todo-chatbot-frontend -n todo-chatbot
```

**Full documentation**: See [README-PHASE4.md](./README-PHASE4.md)

---

# Phase 5: Azure AKS Cloud Deployment ✅

## 🎓 STUDENTS: Read This First!

**Are you NEW to cloud platforms?**
👉 **START HERE**: [Complete Beginner's Guide](./COMPLETE-BEGINNER-GUIDE.md) 📚
- Zero cloud experience needed
- Every single step explained
- Windows/PowerShell instructions
- Common problems solved
- **This is your ONE guide from start to finish!**

**Have some cloud experience?**
👉 **Quick Start**: [Student Budget Guide](./README-STUDENT-BUDGET.md) 💰

**Two deployment options**:

| Setup | Cost | Duration | Best For |
|-------|------|----------|----------|
| **Student Budget** 💰 | $8-10/month | Your $100 lasts 10 months! | Hackathons, learning, demos |
| **Production** 💸 | $175/month | Your $100 lasts 18 days | Real companies with budget |

## Quick Start (Student Budget Mode)

```bash
# 1. Configure for budget mode
cp .env.example .env
# Edit: Set AZURE_LOCATION=centralindia, AKS_VM_SIZE=Standard_B2s, AKS_NODE_COUNT=1

# 2. Setup Azure infrastructure (~20 min, Azure does the work)
./scripts/setup-aks.sh

# 3. Install Dapr (~3 min)
./scripts/install-dapr.sh

# 4. Configure secrets (~2 min)
./scripts/setup-secrets.sh

# 5. Build and deploy (~15 min)
az acr login --name hackathontodoacr
docker build -t hackathontodoacr.azurecr.io/todo-backend:latest ./backend
docker build -t hackathontodoacr.azurecr.io/todo-frontend:latest ./frontend
docker push hackathontodoacr.azurecr.io/todo-backend:latest
docker push hackathontodoacr.azurecr.io/todo-frontend:latest
./scripts/deploy.sh latest

# 6. Get your URL
kubectl get service -n default -l app.kubernetes.io/component=frontend
# Visit http://<EXTERNAL-IP>:3000

# 7. 💰 SAVE MONEY: Stop when done!
./scripts/stop-cluster.sh  # End of day
./scripts/start-cluster.sh # Next morning
```

## Features

- ✅ **Public Internet Access**: LoadBalancer with external IP
- ✅ **Budget Optimized**: 1 node, burstable VMs, stop/start capability
- ✅ **Automated Deployment**: Scripts handle everything
- ✅ **Secure Secrets**: Kubernetes Secrets + Dapr
- ✅ **Event Processing**: Kafka (Redpanda Cloud) + Dapr pub/sub
- ✅ **Stop/Start**: Save 70-80% by stopping when not in use

## Infrastructure (Budget Mode)

- **Azure AKS**: 1 node (Standard_B2s) with Free tier
- **Azure Container Registry**: Basic tier
- **Dapr 1.14+**: Distributed runtime (free)
- **Redpanda Cloud**: Kafka-compatible event streaming
- **Neon PostgreSQL**: Managed database
- **Region**: centralindia (fast from Asia/Pakistan)

**Estimated Cost**:
- Running 24/7: ~$25/month
- With stop/start (8hrs/day): ~$10/month 🎉

## Documentation

- 🎓 **[Student Budget Guide](./README-STUDENT-BUDGET.md)** - START HERE for hackathons!
- 📘 [Production Guide](./README-PHASE5.md) - For companies with real budgets
- 🛠️ [Azure Setup](./docs/deployment/azure-setup.md) - Detailed Azure instructions
- ✅ [Deployment Checklist](./docs/deployment/DEPLOYMENT-CHECKLIST.md) - Step by step

---

# Phase 1 Console Todo Application

A simple menu-driven console todo application built with Python 3.13+. Allows users to add, view, update, delete, and mark tasks as complete/incomplete.

## Features

- **Add Tasks**: Create tasks with title and optional description
- **View Tasks**: Display numbered list with completion status and relative timestamps
- **View Details**: See full task information including description
- **Update Tasks**: Modify task title and/or description
- **Delete Tasks**: Remove tasks with confirmation
- **Mark Complete/Incomplete**: Toggle task completion status

## Requirements

- Python 3.13+
- UV package manager

## Installation

```bash
# Clone the repository
cd hackathon-todo

# Install dependencies with UV
uv sync
```

## Usage

```bash
# Run the application
uv run python main.py
```

## Menu Options

1. Add a new task
2. View all tasks
3. View task details
4. Update a task
5. Delete a task
6. Mark task complete/incomplete
7. Exit

## Development

### Running Tests

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=main --cov-report=term-missing
```

### Type Checking

```bash
# Run mypy type checker
uv run mypy --strict main.py
```

## Project Structure

```
hackathon-todo/
├── main.py              # Single module with all application code
├── tests/
│   └── test_todo.py    # Test suite
├── pyproject.toml      # UV project configuration
└── README.md           # This file
```

## Technical Details

- **Storage**: In-memory only (no persistence)
- **Task Fields**: title (1-200 chars), description (max 1000 chars), completed (boolean), created_at (datetime)
- **Architecture**: Single module with Task dataclass and TaskManager class
- **Testing**: pytest with 80% minimum coverage requirement
- **Type Hints**: Full type annotation with mypy strict mode validation

## Acceptance Criteria

- Add task in under 15 seconds
- View task list in under 1 second
- Mark complete in under 10 seconds
- Update task in under 20 seconds
- Delete task in under 15 seconds
- Clear error messages for all validation failures
- Stable performance with up to 100 tasks

## License

This project was created as part of Hackathon II following Spec-Driven Development (SDD) principles.
