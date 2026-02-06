# Phase 5 Implementation Guide: Cloud Deployment with Azure AKS
## Hackathon II - Todo Application with AI Chatbot

**Version**: 1.0
**Date**: February 3, 2026
**Target Platform**: Azure Kubernetes Service (AKS)
**Project**: Hackathon II - Evolution of Todo

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Project State](#current-project-state)
3. [Phase 5 Requirements](#phase-5-requirements)
4. [Prerequisites](#prerequisites)
5. [Spec-Driven Development Workflow](#spec-driven-development-workflow)
6. [Part A: Advanced Features Implementation](#part-a-advanced-features-implementation)
7. [Part C: Azure Cloud Deployment](#part-c-azure-cloud-deployment)
8. [Dapr Integration](#dapr-integration)
9. [Kafka/Redpanda Setup](#kafka-redpanda-setup)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Testing & Validation](#testing-validation)
12. [Submission Checklist](#submission-checklist)
13. [Troubleshooting](#troubleshooting)
14. [Official Resources](#official-resources)

---

## Executive Summary

### What You're Building

You will extend your **Phase 4 Todo Chatbot** (currently running on Minikube) to a **production-ready cloud deployment** on Azure Kubernetes Service (AKS) with:

- ✅ **Advanced Features**: Recurring tasks, due dates, priorities, tags, search, filter, sort
- ✅ **Event-Driven Architecture**: Kafka (Redpanda Cloud) for task events and reminders
- ✅ **Distributed Runtime**: Dapr for pub/sub, state management, secrets, and service invocation
- ✅ **Cloud Deployment**: Azure AKS with auto-scaling and high availability
- ✅ **CI/CD Pipeline**: GitHub Actions for automated deployments

### Why Skip Part B (Local Minikube)?

**Strategic Decision**: Given your space constraints and the fact that Part C (cloud deployment) provides greater value, you will:
- ❌ Skip Part B (Minikube + Dapr locally)
- ✅ Focus on Part A (features) + Part C (cloud deployment)
- ✅ Use your existing Phase 4 Helm charts on Azure AKS

This approach maximizes points while working within your constraints.

### Timeline Estimate

- **Part A (Features)**: 2-3 days
- **Part C (Cloud Setup)**: 1-2 days
- **Integration & Testing**: 1 day
- **Total**: ~5-6 days

### Points Breakdown

| Component | Points |
|-----------|--------|
| Part A: Advanced Features | ~150 pts |
| Part C: Cloud Deployment (AKS + Dapr + Kafka) | ~150-200 pts |
| **Total Achievable** | **~300-350 pts** |

---

## Current Project State

### ✅ Completed (Phases 1-4)

Based on comprehensive codebase analysis:

**Phase 1**: Python console todo app ✅
**Phase 2**: Next.js + FastAPI web app ✅
**Phase 3**: AI chatbot with OpenAI Agents SDK + MCP tools ✅
**Phase 4**: Minikube deployment with Helm charts ✅

### 📦 Existing Infrastructure (Ready for Cloud)

```
✅ Dockerfiles (multi-stage, optimized)
   - Backend: Python 3.13-slim (~180MB)
   - Frontend: Node 20-alpine (~450MB)

✅ Helm Chart (helm/todo-chatbot/)
   - Complete templates
   - Environment-specific values (dev, staging, prod)
   - ConfigMaps, Secrets, Deployments, Services, HPA

✅ Database
   - PostgreSQL (Neon serverless)
   - Async SQLModel ORM
   - Alembic migrations

✅ Authentication
   - Better Auth with JWT
   - HTTP-only cookies
   - User isolation

✅ AI Chatbot
   - OpenAI Agents SDK
   - MCP tools for task operations
   - Conversation state persistence
```

### 🎯 What's Missing (Phase 5 Scope)

```
❌ Advanced Features (Part A)
   - Recurring tasks
   - Due dates & reminders
   - Priorities & tags
   - Search, filter, sort

❌ Event-Driven Architecture
   - Kafka integration
   - Task events streaming
   - Reminder system

❌ Dapr Runtime
   - Pub/Sub component (Kafka)
   - State management
   - Secrets management
   - Cron bindings

❌ Cloud Deployment (Part C)
   - Azure AKS cluster
   - GitHub Actions CI/CD
   - Production monitoring
```

---

## Phase 5 Requirements

### Part A: Advanced Features

Implement all **Intermediate** and **Advanced** level features:

#### **Intermediate Level**
1. **Priorities**: High, Medium, Low priority levels
2. **Tags/Categories**: Labels like "work", "personal", "urgent"
3. **Search & Filter**: Search by keyword, filter by status/priority/date
4. **Sort**: Reorder by due date, priority, or alphabetically

#### **Advanced Level**
1. **Recurring Tasks**: Auto-reschedule (daily, weekly, monthly)
2. **Due Dates & Reminders**: Date/time pickers, browser notifications

### Part B: Local Deployment (SKIPPED)

**Rationale**: Space constraints + Part C provides same learning outcomes on cloud infrastructure.

### Part C: Cloud Deployment (FOCUS)

1. **Azure AKS Cluster**: Production-grade Kubernetes
2. **Dapr on AKS**: Full Dapr building blocks
3. **Redpanda Cloud**: Serverless Kafka for events
4. **GitHub Actions**: Automated CI/CD pipeline
5. **Monitoring**: Basic health checks and logging

---

## Prerequisites

### 1. Azure Account

**New Users**: Get **$200 USD credit for 30 days** + 12 months of free services

**Sign Up**: [https://azure.microsoft.com/en-us/free](https://azure.microsoft.com/en-us/free)

**Requirements**:
- Valid email address
- Credit card (for verification, not charged during free tier)
- Phone number

**What's Included**:
- $200 credit (expires after 30 days)
- 12 months free tier: AKS, Container Registry, Database, etc.
- Always-free services: Azure DevOps, API Management (limited)

### 2. Local Development Tools

Install the following on your machine:

```bash
# Azure CLI (required)
# Windows (PowerShell as Admin):
winget install -e --id Microsoft.AzureCLI

# Verify installation
az --version

# Login to Azure
az login
```

```bash
# Dapr CLI (required)
# Windows (PowerShell):
powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"

# Verify installation
dapr --version
```

```bash
# kubectl (already installed from Phase 4)
kubectl version --client

# Helm (already installed from Phase 4)
helm version
```

### 3. Cloud Services Setup

#### **Redpanda Cloud**

**Free Trial**: $100 USD credits for 14 days (no credit card required)

**Sign Up**: [https://redpanda.com/try-redpanda](https://redpanda.com/try-redpanda)

**Steps**:
1. Create account
2. Select "Serverless" cluster type
3. Choose AWS region (us-east-1 recommended for free tier)
4. Create cluster (instant provisioning)
5. Save bootstrap server URL and credentials

**Features**:
- Kafka-compatible API
- 300+ data connectors
- Sub-30-second cold start
- Pay-as-you-go after credits

### 4. GitHub Repository Access

Ensure your GitHub repository is:
- ✅ Public or accessible to GitHub Actions
- ✅ Has Secrets configured (we'll add Azure credentials later)
- ✅ Has main/master branch protection (optional but recommended)

---

## Spec-Driven Development Workflow

### Overview

You will use **SpecKit Plus** commands to maintain spec-driven development discipline throughout Phase 5.

### Step-by-Step SDD Process

```
1. /sp.specify   → Create feature specifications
2. /sp.clarify   → Resolve ambiguities (optional)
3. /sp.plan      → Generate architecture plan
4. /sp.adr       → Document architectural decisions
5. /sp.tasks     → Generate implementation tasks
6. /sp.implement → Execute tasks
7. /sp.analyze   → Validate consistency
8. /sp.git.commit_pr → Commit and create PR
```

### Branch Strategy

```bash
# Create Phase 5 feature branch
git checkout -b 005-advanced-features-cloud-deployment
```

This branch will contain all Phase 5 work.

---

## Part A: Advanced Features Implementation

### Step 1: Create Feature Specifications

Use `/sp.specify` to create detailed specs for each feature group.

#### Feature Group 1: Recurring Tasks

```bash
/sp.specify
```

**When prompted, provide**:

```
Feature: Recurring Tasks

Description:
Implement recurring tasks that automatically create the next occurrence when marked
complete. Users can set recurrence patterns (daily, weekly, monthly) and the system
auto-generates new tasks with adjusted due dates.

Acceptance Criteria:
1. Users can create tasks with recurrence patterns: daily, weekly, monthly
2. When a recurring task is completed, a Kafka event is published
3. A background service consumes the event and creates the next occurrence
4. Next task due date is calculated based on recurrence pattern
5. Original task remains in history, new task is created as separate entity
6. Users can stop recurrence by updating the task

Technical Approach:
- Add recurrence_pattern field to Task model (enum: NONE, DAILY, WEEKLY, MONTHLY)
- Publish "task.completed" event to Kafka when task is marked done
- Create RecurringTaskService to consume events and create next occurrence
- Use Dapr Pub/Sub for event streaming
- Store recurrence metadata in task description or separate field
```

**Expected Output**: `specs/005-advanced-features-cloud-deployment/recurring-tasks-spec.md`

#### Feature Group 2: Due Dates & Reminders

```bash
/sp.specify
```

**When prompted, provide**:

```
Feature: Due Dates & Reminders

Description:
Add due date/time fields to tasks and implement a reminder notification system.
Users receive reminders before tasks are due via browser notifications or email.

Acceptance Criteria:
1. Tasks have optional due_date field (datetime)
2. Users can set due dates via UI date/time picker
3. Reminder service checks for upcoming due dates every 5 minutes
4. Notifications sent 1 hour before due date (configurable)
5. Reminders published to Kafka "reminders" topic
6. NotificationService consumes reminders and sends notifications
7. Browser notifications use Web Push API
8. Email notifications optional (bonus)

Technical Approach:
- Add due_date field to Task model (nullable datetime)
- Create Dapr Cron binding to trigger reminder checks (*/5 * * * *)
- ReminderService queries tasks with due_date within next hour
- Publish reminder events to Kafka
- NotificationService consumes and sends push notifications
```

**Expected Output**: `specs/005-advanced-features-cloud-deployment/due-dates-reminders-spec.md`

#### Feature Group 3: Priorities & Tags

```bash
/sp.specify
```

**When prompted, provide**:

```
Feature: Task Priorities & Tags

Description:
Add priority levels (High, Medium, Low) and tags/categories to tasks for better
organization and filtering.

Acceptance Criteria:
1. Tasks have priority field (enum: HIGH, MEDIUM, LOW, default: MEDIUM)
2. Tasks can have multiple tags (many-to-many relationship)
3. Users can create custom tags
4. UI displays priority with visual indicators (colors/icons)
5. Tags shown as chips in task cards
6. MCP tools updated to support priority and tags parameters

Technical Approach:
- Add priority field to Task model (enum)
- Create Tag model with many-to-many relationship (TaskTag join table)
- Update MCP tools: add_task, update_task to accept priority and tags
- Frontend: Priority dropdown, Tag multi-select component
- Database migration for new fields and tables
```

**Expected Output**: `specs/005-advanced-features-cloud-deployment/priorities-tags-spec.md`

#### Feature Group 4: Search, Filter, Sort

```bash
/sp.specify
```

**When prompted, provide**:

```
Feature: Search, Filter, and Sort Tasks

Description:
Implement comprehensive search, filtering, and sorting capabilities for tasks.

Acceptance Criteria:
1. Search by keyword in title or description (case-insensitive, partial match)
2. Filter by: status (pending/completed), priority, tags, due date range
3. Sort by: created date, due date, priority, title (alphabetical)
4. Filters can be combined (AND logic)
5. Results update dynamically in UI
6. MCP tools support search/filter parameters for chatbot queries

Technical Approach:
- Update GET /api/{user_id}/tasks endpoint with query parameters:
  - search (string): Keyword search
  - status (enum): Filter by completion status
  - priority (enum): Filter by priority
  - tags (array): Filter by tag IDs
  - due_before (datetime): Tasks due before date
  - due_after (datetime): Tasks due after date
  - sort_by (enum): Field to sort by
  - sort_order (enum): ASC or DESC
- Use SQLAlchemy filters and order_by
- Frontend: Search bar, filter sidebar, sort dropdown
- Chatbot: Update list_tasks MCP tool to accept filter params
```

**Expected Output**: `specs/005-advanced-features-cloud-deployment/search-filter-sort-spec.md`

#### Feature Group 5: Cloud Deployment Specification

```bash
/sp.specify
```

**When prompted, provide**:

```
Feature: Azure AKS Cloud Deployment with Dapr and Kafka

Description:
Deploy the todo chatbot application to Azure Kubernetes Service (AKS) with Dapr
runtime for distributed systems capabilities and Redpanda Cloud for Kafka-based
event streaming. Implement CI/CD pipeline using GitHub Actions.

Acceptance Criteria:
1. AKS cluster deployed in Azure with 2-5 node auto-scaling
2. Dapr installed on AKS cluster (v1.16+)
3. Application deployed using existing Helm charts
4. Dapr components configured:
   - Pub/Sub: Kafka (Redpanda Cloud)
   - State Store: PostgreSQL (Neon)
   - Secrets: Kubernetes secrets
   - Bindings: Cron for reminders
5. GitHub Actions workflow automates:
   - Docker image builds
   - Push to Azure Container Registry
   - Helm deployment to AKS
   - Health checks and smoke tests
6. Application accessible via AKS LoadBalancer
7. Monitoring: Basic health checks and logs

Technical Approach:
- Use Azure CLI to create AKS cluster (2 nodes, Standard_D2s_v3)
- Install Dapr using Helm chart on AKS
- Create Dapr component YAML files for Kafka, State, Secrets
- Update Helm charts with Dapr annotations
- Configure GitHub Actions with Azure credentials
- Use Azure Container Registry (ACR) for images
- Deploy backend + frontend + Dapr sidecars
- Configure LoadBalancer for external access
```

**Expected Output**: `specs/005-advanced-features-cloud-deployment/cloud-deployment-spec.md`

---

### Step 2: Create Architecture Plan

```bash
/sp.plan
```

This generates `specs/005-advanced-features-cloud-deployment/plan.md` with:

1. **Database Schema Changes**:
   - Add fields: `priority`, `due_date`, `recurrence_pattern`
   - Create `tags` and `task_tags` tables
   - Alembic migration scripts

2. **Backend Architecture**:
   - Update SQLModel models
   - Create services: RecurringTaskService, ReminderService, NotificationService
   - Update MCP tools with new parameters
   - Add Kafka producers/consumers

3. **Frontend Changes**:
   - UI components: Priority dropdown, Tag selector, Date picker
   - Search bar and filter sidebar
   - Task card updates with priority/tags/due date display

4. **Dapr Components**:
   - kafka-pubsub.yaml (Redpanda connection)
   - state-postgresql.yaml (Neon DB)
   - reminder-cron.yaml (scheduled checks)
   - kubernetes-secrets.yaml (API keys)

5. **Deployment Architecture**:
   - AKS cluster topology
   - Helm chart updates
   - GitHub Actions workflow
   - Network and security configuration

---

### Step 3: Document Architectural Decisions

Create ADRs for significant decisions:

```bash
/sp.adr "Event-Driven Recurring Tasks with Kafka"
```

**Content**:
```
# ADR 001: Event-Driven Recurring Tasks with Kafka

## Status
Accepted

## Context
Need to implement recurring tasks that auto-create next occurrence. Two approaches:
1. Cron job checks database periodically
2. Event-driven: Publish event when task completed, service creates next task

## Decision
Use event-driven architecture with Kafka for recurring tasks.

## Rationale
- Decouples task completion from recurrence logic
- Scales better (multiple consumers)
- Provides audit trail (events stored in Kafka)
- Aligns with Part C requirement (Kafka integration)
- Enables future features (analytics, webhooks)

## Consequences
- Positive: Better scalability, loose coupling, event sourcing
- Negative: Increased complexity (Kafka setup), eventual consistency
- Mitigation: Use Dapr to abstract Kafka complexity
```

Create additional ADRs:

```bash
/sp.adr "Dapr State Management for Cloud Deployment"
/sp.adr "Redpanda Cloud as Kafka Provider"
/sp.adr "Azure AKS for Production Deployment"
```

---

### Step 4: Generate Implementation Tasks

```bash
/sp.tasks
```

**Expected Output**: `specs/005-advanced-features-cloud-deployment/tasks.md`

**Sample Tasks Structure**:

```markdown
# Phase 5 Implementation Tasks

## Part A: Advanced Features

### Database & Models
- [ ] 1.1 Create Alembic migration: Add priority, due_date, recurrence_pattern to tasks table
- [ ] 1.2 Create tags and task_tags tables (many-to-many)
- [ ] 1.3 Update Task SQLModel with new fields
- [ ] 1.4 Create Tag and TaskTag SQLModel classes
- [ ] 1.5 Run migrations on Neon database

### Backend Services
- [ ] 2.1 Create RecurringTaskService (Kafka consumer for task.completed events)
- [ ] 2.2 Create ReminderService (Dapr cron binding for due date checks)
- [ ] 2.3 Create NotificationService (Kafka consumer for reminder events)
- [ ] 2.4 Update TaskService with search/filter/sort logic
- [ ] 2.5 Add Kafka producer for task events

### API Endpoints
- [ ] 3.1 Update POST /api/{user_id}/tasks (accept priority, tags, due_date, recurrence)
- [ ] 3.2 Update PUT /api/{user_id}/tasks/{id} (update new fields)
- [ ] 3.3 Update GET /api/{user_id}/tasks (add query params: search, filter, sort)
- [ ] 3.4 Create POST /api/tags (create new tags)
- [ ] 3.5 Create GET /api/tags (list all tags)

### MCP Tools
- [ ] 4.1 Update add_task tool (add priority, tags, due_date, recurrence params)
- [ ] 4.2 Update list_tasks tool (add filter params)
- [ ] 4.3 Update complete_task tool (publish Kafka event)
- [ ] 4.4 Update chatbot prompts for new features

### Frontend Components
- [ ] 5.1 Create PrioritySelect component (High/Medium/Low dropdown)
- [ ] 5.2 Create TagSelector component (multi-select chips)
- [ ] 5.3 Create DateTimePicker component (due date selection)
- [ ] 5.4 Create RecurrenceSelector component (daily/weekly/monthly)
- [ ] 5.5 Create SearchBar component
- [ ] 5.6 Create FilterSidebar component
- [ ] 5.7 Update TaskCard to display priority, tags, due date
- [ ] 5.8 Update TaskForm to include new fields

### Testing
- [ ] 6.1 Unit tests for services (RecurringTaskService, ReminderService)
- [ ] 6.2 Integration tests for search/filter/sort
- [ ] 6.3 API endpoint tests (new params)
- [ ] 6.4 MCP tool tests with new features
- [ ] 6.5 E2E tests for chatbot with advanced features

## Part C: Cloud Deployment

### Azure Setup
- [ ] 7.1 Create Azure account (sign up for free tier)
- [ ] 7.2 Install Azure CLI and login
- [ ] 7.3 Create resource group for AKS
- [ ] 7.4 Create Azure Container Registry (ACR)
- [ ] 7.5 Create AKS cluster (2 nodes, Standard_D2s_v3)
- [ ] 7.6 Connect kubectl to AKS cluster

### Dapr Installation
- [ ] 8.1 Install Dapr on AKS using Helm
- [ ] 8.2 Verify Dapr system pods running
- [ ] 8.3 Create Dapr component: kafka-pubsub.yaml
- [ ] 8.4 Create Dapr component: state-postgresql.yaml
- [ ] 8.5 Create Dapr component: reminder-cron.yaml
- [ ] 8.6 Create Dapr component: kubernetes-secrets.yaml
- [ ] 8.7 Apply Dapr components to AKS

### Kafka/Redpanda Setup
- [ ] 9.1 Sign up for Redpanda Cloud (free tier)
- [ ] 9.2 Create serverless cluster
- [ ] 9.3 Create Kafka topics: task-events, reminders, task-updates
- [ ] 9.4 Get bootstrap server URL and credentials
- [ ] 9.5 Configure Dapr kafka-pubsub component with Redpanda

### Helm Chart Updates
- [ ] 10.1 Add Dapr annotations to backend deployment
- [ ] 10.2 Add Dapr annotations to frontend deployment
- [ ] 10.3 Create values-prod.yaml for AKS
- [ ] 10.4 Update ConfigMaps with Kafka/Dapr config
- [ ] 10.5 Create Kubernetes Secrets for Azure

### Docker Images
- [ ] 11.1 Build backend Docker image
- [ ] 11.2 Build frontend Docker image
- [ ] 11.3 Tag images for ACR
- [ ] 11.4 Push images to ACR

### Deployment
- [ ] 12.1 Deploy Helm chart to AKS
- [ ] 12.2 Verify pods running with Dapr sidecars
- [ ] 12.3 Configure LoadBalancer for external access
- [ ] 12.4 Test application via public IP

### CI/CD Pipeline
- [ ] 13.1 Create GitHub Actions workflow (.github/workflows/deploy-aks.yml)
- [ ] 13.2 Configure Azure credentials in GitHub Secrets
- [ ] 13.3 Add workflow triggers (push to main, manual dispatch)
- [ ] 13.4 Add build and push steps
- [ ] 13.5 Add Helm deploy step
- [ ] 13.6 Add health check and smoke tests
- [ ] 13.7 Test CI/CD pipeline end-to-end

### Monitoring & Logging
- [ ] 14.1 Configure AKS logging to Azure Monitor (optional)
- [ ] 14.2 Set up basic health check endpoints
- [ ] 14.3 Configure pod resource metrics
- [ ] 14.4 Test pod auto-scaling
```

---

### Step 5: Implementation

#### Option A: Manual Implementation

Implement each task from `tasks.md` manually, marking them as complete:

```markdown
- [x] 1.1 Create Alembic migration: Add priority, due_date, recurrence_pattern
```

#### Option B: Use /sp.implement

```bash
/sp.implement
```

This will:
1. Read tasks from `tasks.md`
2. Execute them in dependency order
3. Generate code changes
4. Mark tasks as completed

**Recommended**: Hybrid approach - use `/sp.implement` for boilerplate, manual coding for complex logic.

---

### Step 6: Database Migrations

#### Create Alembic Migration

```bash
# In backend directory
cd backend

# Create migration
alembic revision --autogenerate -m "Add Phase 5 advanced features"

# Review migration file in backend/migrations/versions/
# Edit if needed

# Apply migration to Neon database
alembic upgrade head
```

**Migration Should Include**:
- Add `priority` column (enum: HIGH, MEDIUM, LOW)
- Add `due_date` column (nullable datetime)
- Add `recurrence_pattern` column (enum: NONE, DAILY, WEEKLY, MONTHLY)
- Create `tags` table (id, name, user_id, created_at)
- Create `task_tags` table (task_id, tag_id)

---

### Step 7: Backend Implementation

#### Update Task Model

`backend/src/models/task.py`:

```python
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from enum import Enum
from typing import Optional, List

class Priority(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class RecurrencePattern(str, Enum):
    NONE = "NONE"
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str = Field(max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)

    # Phase 5: New fields
    priority: Priority = Field(default=Priority.MEDIUM)
    due_date: datetime | None = Field(default=None)
    recurrence_pattern: RecurrencePattern = Field(default=RecurrencePattern.NONE)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    tags: List["Tag"] = Relationship(back_populates="tasks", link_model=TaskTag)

class Tag(SQLModel, table=True):
    __tablename__ = "tags"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=50)
    user_id: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    tasks: List[Task] = Relationship(back_populates="tags", link_model=TaskTag)

class TaskTag(SQLModel, table=True):
    __tablename__ = "task_tags"

    task_id: int = Field(foreign_key="tasks.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)
```

#### Create RecurringTaskService

`backend/src/services/recurring_task_service.py`:

```python
from datetime import datetime, timedelta
from sqlmodel import Session, select
from ..models.task import Task, RecurrencePattern
from ..db.session import get_session
import httpx

class RecurringTaskService:
    """Service to handle recurring task creation after task completion."""

    @staticmethod
    async def handle_task_completed_event(event_data: dict):
        """
        Consume task.completed event from Kafka.
        If task is recurring, create next occurrence.
        """
        task_id = event_data["task_id"]
        user_id = event_data["user_id"]

        async with get_session() as session:
            # Fetch completed task
            result = await session.execute(
                select(Task).where(Task.id == task_id)
            )
            task = result.scalar_one_or_none()

            if not task or task.recurrence_pattern == RecurrencePattern.NONE:
                return  # Not a recurring task

            # Calculate next due date
            next_due_date = RecurringTaskService._calculate_next_due_date(
                task.due_date, task.recurrence_pattern
            )

            # Create new task
            new_task = Task(
                user_id=user_id,
                title=task.title,
                description=task.description,
                priority=task.priority,
                due_date=next_due_date,
                recurrence_pattern=task.recurrence_pattern,
                completed=False,
                tags=task.tags  # Copy tags
            )

            session.add(new_task)
            await session.commit()

            print(f"Created recurring task {new_task.id} for user {user_id}")

    @staticmethod
    def _calculate_next_due_date(
        current_due_date: datetime,
        pattern: RecurrencePattern
    ) -> datetime:
        """Calculate next occurrence based on recurrence pattern."""
        if not current_due_date:
            return None

        if pattern == RecurrencePattern.DAILY:
            return current_due_date + timedelta(days=1)
        elif pattern == RecurrencePattern.WEEKLY:
            return current_due_date + timedelta(weeks=1)
        elif pattern == RecurrencePattern.MONTHLY:
            # Approximate (30 days)
            return current_due_date + timedelta(days=30)
        else:
            return current_due_date
```

#### Update MCP Tools

`backend/src/mcp/todo_tools.py`:

```python
async def add_task(
    user_id: str,
    title: str,
    description: str = None,
    priority: str = "MEDIUM",
    tags: List[str] = None,
    due_date: str = None,
    recurrence: str = "NONE"
) -> dict:
    """
    Create a new task with advanced features.

    Args:
        user_id: User ID
        title: Task title
        description: Task description (optional)
        priority: HIGH, MEDIUM, or LOW (default: MEDIUM)
        tags: List of tag names (optional)
        due_date: Due date in ISO format (optional)
        recurrence: NONE, DAILY, WEEKLY, or MONTHLY (default: NONE)

    Returns:
        Created task details
    """
    async with get_session() as session:
        # Create task
        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            priority=Priority(priority),
            due_date=datetime.fromisoformat(due_date) if due_date else None,
            recurrence_pattern=RecurrencePattern(recurrence)
        )

        # Handle tags
        if tags:
            for tag_name in tags:
                # Find or create tag
                result = await session.execute(
                    select(Tag).where(
                        Tag.name == tag_name,
                        Tag.user_id == user_id
                    )
                )
                tag = result.scalar_one_or_none()

                if not tag:
                    tag = Tag(name=tag_name, user_id=user_id)
                    session.add(tag)
                    await session.flush()

                task.tags.append(tag)

        session.add(task)
        await session.commit()
        await session.refresh(task)

        return {
            "task_id": task.id,
            "status": "created",
            "title": task.title,
            "priority": task.priority.value,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "tags": [tag.name for tag in task.tags]
        }

async def list_tasks(
    user_id: str,
    status: str = "all",
    priority: str = None,
    tags: List[str] = None,
    search: str = None,
    sort_by: str = "created_at"
) -> List[dict]:
    """
    List tasks with advanced filtering and sorting.

    Args:
        user_id: User ID
        status: "all", "pending", or "completed"
        priority: Filter by priority (optional)
        tags: Filter by tag names (optional)
        search: Keyword search in title/description (optional)
        sort_by: Field to sort by (created_at, due_date, priority, title)

    Returns:
        List of task objects
    """
    async with get_session() as session:
        query = select(Task).where(Task.user_id == user_id)

        # Apply filters
        if status == "pending":
            query = query.where(Task.completed == False)
        elif status == "completed":
            query = query.where(Task.completed == True)

        if priority:
            query = query.where(Task.priority == Priority(priority))

        if search:
            query = query.where(
                (Task.title.ilike(f"%{search}%")) |
                (Task.description.ilike(f"%{search}%"))
            )

        # Apply sorting
        if sort_by == "due_date":
            query = query.order_by(Task.due_date.desc())
        elif sort_by == "priority":
            query = query.order_by(Task.priority)
        elif sort_by == "title":
            query = query.order_by(Task.title)
        else:
            query = query.order_by(Task.created_at.desc())

        result = await session.execute(query)
        tasks = result.scalars().all()

        return [
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "priority": task.priority.value,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "tags": [tag.name for tag in task.tags],
                "recurrence": task.recurrence_pattern.value
            }
            for task in tasks
        ]
```

---

### Step 8: Frontend Implementation

#### Create Priority Selector Component

`frontend/components/PrioritySelect.tsx`:

```tsx
"use client";

import React from "react";
import { ChevronDown, AlertCircle, Minus, ArrowDown } from "lucide-react";

type Priority = "HIGH" | "MEDIUM" | "LOW";

interface PrioritySelectProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
}

const priorityConfig = {
  HIGH: { label: "High", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  MEDIUM: { label: "Medium", icon: Minus, color: "text-yellow-600", bg: "bg-yellow-50" },
  LOW: { label: "Low", icon: ArrowDown, color: "text-green-600", bg: "bg-green-50" },
};

export default function PrioritySelect({ value, onChange, disabled = false }: PrioritySelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const config = priorityConfig[value];
  const Icon = config.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${config.bg} ${config.color} hover:opacity-80 disabled:opacity-50`}
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{config.label}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg">
          {(Object.entries(priorityConfig) as [Priority, typeof priorityConfig.HIGH][]).map(([key, cfg]) => {
            const PriorityIcon = cfg.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onChange(key);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 ${cfg.color}`}
              >
                <PriorityIcon className="w-4 h-4" />
                <span className="text-sm">{cfg.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

#### Create Tag Selector Component

`frontend/components/TagSelector.tsx`:

```tsx
"use client";

import React from "react";
import { X, Plus } from "lucide-react";

interface TagSelectorProps {
  selectedTags: string[];
  availableTags: string[];
  onChange: (tags: string[]) => void;
  onCreateTag?: (tagName: string) => void;
}

export default function TagSelector({
  selectedTags,
  availableTags,
  onChange,
  onCreateTag,
}: TagSelectorProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onChange([...selectedTags, tag]);
    }
    setIsOpen(false);
  };

  const handleRemoveTag = (tag: string) => {
    onChange(selectedTags.filter((t) => t !== tag));
  };

  const handleCreateTag = () => {
    if (inputValue.trim() && onCreateTag) {
      onCreateTag(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-blue-900"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Add Tag Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Tag</span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-64 bg-white border rounded-lg shadow-lg p-2">
            {/* Create New Tag */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="New tag name"
                className="flex-1 px-2 py-1 border rounded text-sm"
              />
              <button
                type="button"
                onClick={handleCreateTag}
                className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Create
              </button>
            </div>

            {/* Available Tags */}
            <div className="max-h-40 overflow-y-auto">
              {availableTags
                .filter((tag) => !selectedTags.includes(tag))
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  >
                    {tag}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Update Task Card

`frontend/components/TaskCard.tsx`:

```tsx
import { AlertCircle, Minus, ArrowDown, Calendar, Tag as TagIcon } from "lucide-react";

// Inside TaskCard component
<div className="flex items-center gap-2 text-sm text-gray-600">
  {/* Priority Badge */}
  {task.priority === "HIGH" && (
    <span className="flex items-center gap-1 text-red-600">
      <AlertCircle className="w-4 h-4" />
      High
    </span>
  )}
  {task.priority === "MEDIUM" && (
    <span className="flex items-center gap-1 text-yellow-600">
      <Minus className="w-4 h-4" />
      Medium
    </span>
  )}
  {task.priority === "LOW" && (
    <span className="flex items-center gap-1 text-green-600">
      <ArrowDown className="w-4 h-4" />
      Low
    </span>
  )}

  {/* Due Date */}
  {task.due_date && (
    <span className="flex items-center gap-1">
      <Calendar className="w-4 h-4" />
      {new Date(task.due_date).toLocaleDateString()}
    </span>
  )}

  {/* Tags */}
  {task.tags && task.tags.length > 0 && (
    <div className="flex items-center gap-1 flex-wrap">
      <TagIcon className="w-4 h-4" />
      {task.tags.map((tag: string) => (
        <span
          key={tag}
          className="px-2 py-0.5 bg-gray-100 rounded-full text-xs"
        >
          {tag}
        </span>
      ))}
    </div>
  )}
</div>
```

---

### Step 9: Testing

#### Backend Tests

`backend/tests/test_advanced_features.py`:

```python
import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta

@pytest.mark.asyncio
async def test_create_task_with_priority(client: AsyncClient, auth_headers):
    """Test creating a task with priority."""
    response = await client.post(
        "/api/testuser/tasks",
        json={
            "title": "High priority task",
            "description": "Urgent work",
            "priority": "HIGH"
        },
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["priority"] == "HIGH"

@pytest.mark.asyncio
async def test_create_task_with_due_date(client: AsyncClient, auth_headers):
    """Test creating a task with due date."""
    due_date = (datetime.utcnow() + timedelta(days=7)).isoformat()

    response = await client.post(
        "/api/testuser/tasks",
        json={
            "title": "Task with deadline",
            "due_date": due_date
        },
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["due_date"] is not None

@pytest.mark.asyncio
async def test_filter_tasks_by_priority(client: AsyncClient, auth_headers):
    """Test filtering tasks by priority."""
    # Create tasks with different priorities
    await client.post("/api/testuser/tasks", json={"title": "High", "priority": "HIGH"}, headers=auth_headers)
    await client.post("/api/testuser/tasks", json={"title": "Low", "priority": "LOW"}, headers=auth_headers)

    # Filter by HIGH priority
    response = await client.get(
        "/api/testuser/tasks?priority=HIGH",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert all(task["priority"] == "HIGH" for task in data)

@pytest.mark.asyncio
async def test_search_tasks(client: AsyncClient, auth_headers):
    """Test searching tasks by keyword."""
    await client.post("/api/testuser/tasks", json={"title": "Buy groceries"}, headers=auth_headers)
    await client.post("/api/testuser/tasks", json={"title": "Pay bills"}, headers=auth_headers)

    response = await client.get(
        "/api/testuser/tasks?search=groceries",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert "groceries" in data[0]["title"].lower()
```

#### MCP Tool Tests

`backend/tests/test_mcp_advanced.py`:

```python
import pytest
from src.mcp.todo_tools import add_task, list_tasks, complete_task

@pytest.mark.asyncio
async def test_add_task_with_tags():
    """Test adding a task with tags."""
    result = await add_task(
        user_id="testuser",
        title="Tagged task",
        tags=["work", "urgent"]
    )

    assert result["status"] == "created"
    assert "work" in result["tags"]
    assert "urgent" in result["tags"]

@pytest.mark.asyncio
async def test_list_tasks_with_filters():
    """Test listing tasks with multiple filters."""
    # Create test tasks
    await add_task(user_id="testuser", title="High priority", priority="HIGH")
    await add_task(user_id="testuser", title="Low priority", priority="LOW")

    # Filter by HIGH priority
    result = await list_tasks(user_id="testuser", priority="HIGH")

    assert len(result) == 1
    assert result[0]["priority"] == "HIGH"
```

---

## Part C: Azure Cloud Deployment

### Step 1: Azure Account Setup

#### Sign Up for Azure Free Tier

1. **Visit**: [https://azure.microsoft.com/en-us/free](https://azure.microsoft.com/en-us/free)

2. **Create Account**:
   - Click "Start free"
   - Sign in with Microsoft account (or create one)
   - Provide credit card (for verification, not charged)
   - Complete phone verification

3. **Verify Free Credits**:
   - $200 USD credit for 30 days
   - 12 months of free services
   - Always-free tier services

**Important Notes**:
- Free tier expires after 30 days
- AKS is free for cluster management (pay only for VM nodes)
- Use cost alerts to track spending
- Stop cluster when not in use to save credits

---

### Step 2: Install Azure CLI

#### Windows Installation

```powershell
# PowerShell (Run as Administrator)
winget install -e --id Microsoft.AzureCLI
```

#### Verify Installation

```bash
# Check version
az --version

# Should show: azure-cli 2.xx.x or higher
```

#### Login to Azure

```bash
# Interactive login
az login

# Follow browser prompt to authenticate

# Verify subscription
az account show

# List all subscriptions
az account list --output table

# Set default subscription (if you have multiple)
az account set --subscription "Your Subscription Name"
```

---

### Step 3: Create Azure Resources

#### Create Resource Group

```bash
# Create resource group in East US region
az group create \
  --name todo-chatbot-rg \
  --location eastus

# Verify creation
az group show --name todo-chatbot-rg
```

**Resource Group Purpose**: Logical container for all Azure resources (AKS, ACR, etc.)

#### Create Azure Container Registry (ACR)

```bash
# Create ACR (must be globally unique name)
az acr create \
  --resource-group todo-chatbot-rg \
  --name todochatbotacr \
  --sku Basic \
  --location eastus

# Enable admin user (for Docker login)
az acr update \
  --name todochatbotacr \
  --admin-enabled true

# Get ACR credentials
az acr credential show \
  --name todochatbotacr

# Save these credentials for later:
# - username: todochatbotacr
# - password: <shown in output>
```

**ACR Purpose**: Private Docker registry to store your container images

#### Create AKS Cluster

**Important**: This is the most resource-intensive step (uses free credits)

```bash
# Create AKS cluster with 2 nodes
az aks create \
  --resource-group todo-chatbot-rg \
  --name todo-chatbot-aks \
  --node-count 2 \
  --node-vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --attach-acr todochatbotacr \
  --generate-ssh-keys \
  --location eastus

# This takes 5-10 minutes
# The cluster is created with:
# - 2 nodes (VMs)
# - Standard_D2s_v3 size (2 vCPU, 8 GB RAM each)
# - ACR attached (can pull images without credentials)
# - Managed identity (Azure-managed service principal)
```

**Cost Estimate**:
- AKS control plane: Free
- 2 x Standard_D2s_v3 VMs: ~$0.096/hour each (~$140/month for 2 nodes)
- Your $200 credit covers ~1.4 months of 24/7 operation

**Cost Optimization Tips**:
```bash
# Stop cluster when not in use (saves VM costs)
az aks stop --name todo-chatbot-aks --resource-group todo-chatbot-rg

# Start cluster when needed
az aks start --name todo-chatbot-aks --resource-group todo-chatbot-rg
```

#### Connect kubectl to AKS

```bash
# Download cluster credentials
az aks get-credentials \
  --resource-group todo-chatbot-rg \
  --name todo-chatbot-aks

# Verify connection
kubectl cluster-info

# Should show:
# Kubernetes control plane is running at https://...

# Check nodes
kubectl get nodes

# Should show 2 nodes in Ready state
```

---

### Step 4: Install Dapr on AKS

#### Install Dapr CLI (if not already installed)

```bash
# Windows (PowerShell)
powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"

# Verify
dapr --version
```

#### Install Dapr on Kubernetes

**Official Method 1: Using Dapr CLI**

```bash
# Initialize Dapr on AKS cluster
dapr init -k

# This installs:
# - dapr-operator
# - dapr-sidecar-injector
# - dapr-placement
# - dapr-sentry (mTLS certificate authority)

# Verify installation
dapr status -k

# Should show all components running in dapr-system namespace
```

**Official Method 2: Using Helm (Recommended for Production)**

```bash
# Add Dapr Helm repo
helm repo add dapr https://dapr.github.io/helm-charts/
helm repo update

# Install Dapr version 1.16
helm install dapr dapr/dapr \
  --namespace dapr-system \
  --create-namespace \
  --version 1.16 \
  --wait

# Verify Dapr pods
kubectl get pods -n dapr-system

# Should show:
# dapr-operator-xxx        Running
# dapr-sidecar-injector-xxx Running
# dapr-placement-server-xxx Running
# dapr-sentry-xxx           Running
```

**Verification**:

```bash
# Check Dapr version
kubectl get deploy -n dapr-system

# All deployments should show READY 1/1
```

---

### Step 5: Redpanda Cloud Setup

#### Sign Up for Redpanda Cloud

1. **Visit**: [https://redpanda.com/try-redpanda](https://redpanda.com/try-redpanda)

2. **Create Account**:
   - Click "Try Redpanda Cloud Free"
   - Sign up with email (no credit card required)
   - Verify email address

3. **Create Serverless Cluster**:
   - Click "Create Cluster"
   - Select "Serverless" tier
   - Choose AWS region: `us-east-1` (recommended for free tier)
   - Cluster Name: `todo-chatbot-kafka`
   - Click "Create"

   **Provisioning**: Instant (< 30 seconds)

4. **Create Kafka Topics**:

   After cluster is ready:

   - Go to "Topics" tab
   - Create topic: `task-events`
     - Partitions: 3
     - Retention: 7 days
   - Create topic: `reminders`
     - Partitions: 3
     - Retention: 7 days
   - Create topic: `task-updates`
     - Partitions: 3
     - Retention: 7 days

5. **Get Connection Details**:

   - Click "Connect" button
   - Copy **Bootstrap Server URL**: `seed-xxxxx.cloud.redpanda.com:9092`
   - Create **SASL credentials**:
     - Username: `todo-chatbot`
     - Password: (auto-generated, save it)
     - Mechanism: `SCRAM-SHA-256`

6. **Save Credentials**:

   ```bash
   # Save to local .env file for reference
   KAFKA_BOOTSTRAP_SERVER=seed-xxxxx.cloud.redpanda.com:9092
   KAFKA_USERNAME=todo-chatbot
   KAFKA_PASSWORD=<your-password>
   KAFKA_MECHANISM=SCRAM-SHA-256
   ```

**Free Tier Limits**:
- $100 USD credit for 14 days
- 10 GB storage
- 10 MB/s ingress
- 20 MB/s egress
- Unlimited topics

**Official Documentation**: [https://docs.redpanda.com/redpanda-cloud/get-started/cluster-types/serverless/](https://docs.redpanda.com/redpanda-cloud/get-started/cluster-types/serverless/)

---

### Step 6: Create Dapr Components

Create a directory for Dapr components:

```bash
mkdir -p k8s/dapr-components
cd k8s/dapr-components
```

#### 1. Kafka Pub/Sub Component

`k8s/dapr-components/kafka-pubsub.yaml`:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
  namespace: todo-chatbot
spec:
  type: pubsub.kafka
  version: v1
  metadata:
    # Redpanda Cloud bootstrap server
    - name: brokers
      value: "seed-xxxxx.cloud.redpanda.com:9092"

    # Consumer group for this app
    - name: consumerGroup
      value: "todo-chatbot-group"

    # Client ID
    - name: clientID
      value: "todo-chatbot-client"

    # Authentication type
    - name: authType
      value: "password"

    # SASL mechanism
    - name: saslMechanism
      value: "SCRAM-SHA-256"

    # SASL username
    - name: saslUsername
      secretKeyRef:
        name: kafka-secrets
        key: username

    # SASL password
    - name: saslPassword
      secretKeyRef:
        name: kafka-secrets
        key: password

    # TLS enabled
    - name: disableTls
      value: "false"

    # Skip TLS certificate verification (for Redpanda Cloud)
    - name: skipVerify
      value: "true"
```

**Reference**: [Apache Kafka | Dapr Docs](https://docs.dapr.io/reference/components-reference/supported-pubsub/setup-apache-kafka/)

#### 2. PostgreSQL State Store

`k8s/dapr-components/state-postgresql.yaml`:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
  namespace: todo-chatbot
spec:
  type: state.postgresql
  version: v1
  metadata:
    # Neon PostgreSQL connection string
    - name: connectionString
      secretKeyRef:
        name: database-secrets
        key: connection-string

    # Table name for state
    - name: tableName
      value: "dapr_state"

    # Metadata table name
    - name: metadataTableName
      value: "dapr_metadata"

    # Timeout for database operations
    - name: timeout
      value: "20"

    # Cleanup interval (in seconds)
    - name: cleanupIntervalInSeconds
      value: "3600"
```

#### 3. Cron Binding (Reminder Checks)

`k8s/dapr-components/reminder-cron.yaml`:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: reminder-cron
  namespace: todo-chatbot
spec:
  type: bindings.cron
  version: v1
  metadata:
    # Cron schedule: Every 5 minutes
    - name: schedule
      value: "*/5 * * * *"

    # Optional: Direction (input only - triggers app)
    - name: direction
      value: "input"
```

**Cron Format**: `minute hour day-of-month month day-of-week`
- `*/5 * * * *` = Every 5 minutes
- `0 * * * *` = Every hour
- `0 0 * * *` = Daily at midnight

#### 4. Kubernetes Secrets Store

`k8s/dapr-components/kubernetes-secrets.yaml`:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kubernetes-secrets
  namespace: todo-chatbot
spec:
  type: secretstores.kubernetes
  version: v1
  metadata:
    # No additional configuration needed
    # Uses Kubernetes service account permissions
```

---

### Step 7: Create Kubernetes Secrets

Create secrets for sensitive data:

#### Kafka Secrets

```bash
# Create Kafka credentials secret
kubectl create secret generic kafka-secrets \
  --from-literal=username='todo-chatbot' \
  --from-literal=password='YOUR_REDPANDA_PASSWORD' \
  --namespace=todo-chatbot
```

#### Database Secrets

```bash
# Create database connection string secret
kubectl create secret generic database-secrets \
  --from-literal=connection-string='postgresql+asyncpg://user:pass@host/db' \
  --namespace=todo-chatbot

# Replace with your actual Neon PostgreSQL connection string
```

#### OpenAI API Key

```bash
# Create OpenAI API key secret
kubectl create secret generic openai-secrets \
  --from-literal=api-key='sk-...' \
  --namespace=todo-chatbot
```

#### Better Auth Secret

```bash
# Create Better Auth secret (32+ characters)
kubectl create secret generic auth-secrets \
  --from-literal=secret='YOUR_BETTER_AUTH_SECRET_32_CHARS_MIN' \
  --namespace=todo-chatbot
```

---

### Step 8: Update Helm Charts for Dapr

#### Update Backend Deployment

`helm/todo-chatbot/templates/backend-deployment.yaml`:

Add Dapr annotations to enable sidecar injection:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "todo-chatbot.fullname" . }}-backend
  namespace: {{ .Values.namespace }}
spec:
  replicas: {{ .Values.backend.replicas }}
  selector:
    matchLabels:
      app: {{ include "todo-chatbot.name" . }}-backend
  template:
    metadata:
      labels:
        app: {{ include "todo-chatbot.name" . }}-backend
      annotations:
        # Dapr annotations
        dapr.io/enabled: "true"
        dapr.io/app-id: "todo-backend"
        dapr.io/app-port: "8000"
        dapr.io/enable-api-logging: "true"
        dapr.io/log-level: "info"
    spec:
      containers:
      - name: backend
        image: {{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}
        ports:
        - containerPort: 8000
          name: http
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: connection-string
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-secrets
              key: api-key
        - name: BETTER_AUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: secret
        # Dapr localhost endpoint
        - name: DAPR_HTTP_PORT
          value: "3500"
        - name: DAPR_GRPC_PORT
          value: "50001"

        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 40
          periodSeconds: 30

        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10

        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

**Key Dapr Annotations**:
- `dapr.io/enabled: "true"` → Inject Dapr sidecar
- `dapr.io/app-id: "todo-backend"` → Unique app ID for service invocation
- `dapr.io/app-port: "8000"` → Port where your app listens
- `dapr.io/enable-api-logging: "true"` → Log Dapr API calls (useful for debugging)

#### Update Frontend Deployment

`helm/todo-chatbot/templates/frontend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "todo-chatbot.fullname" . }}-frontend
  namespace: {{ .Values.namespace }}
spec:
  replicas: {{ .Values.frontend.replicas }}
  selector:
    matchLabels:
      app: {{ include "todo-chatbot.name" . }}-frontend
  template:
    metadata:
      labels:
        app: {{ include "todo-chatbot.name" . }}-frontend
      annotations:
        # Dapr annotations
        dapr.io/enabled: "true"
        dapr.io/app-id: "todo-frontend"
        dapr.io/app-port: "3000"
        dapr.io/log-level: "info"
    spec:
      containers:
      - name: frontend
        image: {{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "http://localhost:3500/v1.0/invoke/todo-backend/method"
        - name: NODE_ENV
          value: "production"

        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30

        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 20
          periodSeconds: 10

        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "250m"
```

**Service Invocation via Dapr**:
- Frontend calls backend through Dapr sidecar: `http://localhost:3500/v1.0/invoke/todo-backend/method/api/tasks`
- Dapr handles service discovery, retries, and tracing

#### Create Production Values File

`helm/todo-chatbot/values-prod.yaml`:

```yaml
namespace: todo-chatbot

backend:
  replicas: 2
  image:
    repository: todochatbotacr.azurecr.io/todo-backend
    tag: latest

  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70

frontend:
  replicas: 1
  image:
    repository: todochatbotacr.azurecr.io/todo-frontend
    tag: latest

  autoscaling:
    enabled: true
    minReplicas: 1
    maxReplicas: 3
    targetCPUUtilizationPercentage: 70

service:
  type: LoadBalancer
  frontend:
    port: 80
    targetPort: 3000
  backend:
    port: 8000
    targetPort: 8000

ingress:
  enabled: false  # Optional: Enable if you want custom domain

dapr:
  enabled: true
  logLevel: info
```

---

### Step 9: Build and Push Docker Images to ACR

#### Login to Azure Container Registry

```bash
# Login to ACR
az acr login --name todochatbotacr

# Verify login
docker info | grep -i registry
```

#### Build and Tag Images

```bash
# Navigate to project root
cd /path/to/hackathon-todo

# Build backend image
docker build -t todochatbotacr.azurecr.io/todo-backend:latest ./backend

# Build frontend image
docker build -t todochatbotacr.azurecr.io/todo-frontend:latest ./frontend

# Verify images
docker images | grep todo
```

#### Push Images to ACR

```bash
# Push backend image
docker push todochatbotacr.azurecr.io/todo-backend:latest

# Push frontend image
docker push todochatbotacr.azurecr.io/todo-frontend:latest

# Verify images in ACR
az acr repository list --name todochatbotacr --output table

# Should show:
# todo-backend
# todo-frontend
```

**Image Sizes** (expected):
- Backend: ~180-200 MB
- Frontend: ~450-500 MB

---

### Step 10: Deploy to AKS

#### Create Namespace

```bash
# Create namespace
kubectl create namespace todo-chatbot

# Verify
kubectl get namespaces
```

#### Apply Dapr Components

```bash
# Apply all Dapr components
kubectl apply -f k8s/dapr-components/

# Verify components
kubectl get components -n todo-chatbot

# Should show:
# kafka-pubsub
# statestore
# reminder-cron
# kubernetes-secrets
```

#### Deploy with Helm

```bash
# Deploy application using Helm
helm install todo-chatbot ./helm/todo-chatbot \
  --namespace todo-chatbot \
  --values ./helm/todo-chatbot/values-prod.yaml \
  --wait \
  --timeout 10m

# This will:
# 1. Create all Kubernetes resources
# 2. Inject Dapr sidecars into pods
# 3. Configure services and load balancers
# 4. Wait for all pods to be ready
```

#### Verify Deployment

```bash
# Check all pods (should see app + dapr sidecars)
kubectl get pods -n todo-chatbot

# Should show:
# todo-chatbot-backend-xxx   2/2  Running  (app + daprd sidecar)
# todo-chatbot-frontend-xxx  2/2  Running  (app + daprd sidecar)

# Check Dapr sidecars
kubectl logs -n todo-chatbot <pod-name> -c daprd

# Check application logs
kubectl logs -n todo-chatbot <pod-name> -c backend
kubectl logs -n todo-chatbot <pod-name> -c frontend

# Check services
kubectl get svc -n todo-chatbot

# Should show:
# todo-chatbot-backend   ClusterIP    <IP>       8000/TCP
# todo-chatbot-frontend  LoadBalancer <EXTERNAL-IP> 80/TCP
```

#### Get Application URL

```bash
# Get LoadBalancer external IP
kubectl get svc todo-chatbot-frontend -n todo-chatbot

# Wait for EXTERNAL-IP to be assigned (may take 2-3 minutes)
# Then access application at: http://<EXTERNAL-IP>
```

**Note**: First time may take 5-10 minutes for Azure to provision LoadBalancer and assign public IP.

---

### Step 11: Test Dapr Integration

#### Test Pub/Sub (Kafka)

```bash
# Exec into backend pod
kubectl exec -it -n todo-chatbot <backend-pod-name> -c backend -- /bin/bash

# Inside pod, test publishing to Kafka via Dapr
curl -X POST http://localhost:3500/v1.0/publish/kafka-pubsub/task-events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "created",
    "task_id": 1,
    "user_id": "testuser"
  }'

# Should return: {}
```

#### Test State Store

```bash
# Save state
curl -X POST http://localhost:3500/v1.0/state/statestore \
  -H "Content-Type: application/json" \
  -d '[{
    "key": "test-key",
    "value": "test-value"
  }]'

# Get state
curl http://localhost:3500/v1.0/state/statestore/test-key

# Should return: "test-value"
```

#### Test Secrets

```bash
# Get secret from Kubernetes
curl http://localhost:3500/v1.0/secrets/kubernetes-secrets/openai-secrets/api-key

# Should return: {"api-key": "sk-..."}
```

---

## Dapr Integration

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      AKS CLUSTER                                 │
│                                                                  │
│  ┌──────────────────┐          ┌──────────────────┐             │
│  │ Frontend Pod     │          │ Backend Pod      │             │
│  │ ┌──────┐ ┌─────┐│          │ ┌──────┐ ┌─────┐ │             │
│  │ │Next.js│ │Dapr ││          │ │FastAPI│ │Dapr │ │             │
│  │ │  App  │◄┤Sidecar││        │ │  App  │◄┤Sidecar││           │
│  │ └──────┘ └─────┘│          │ └──────┘ └─────┘ │             │
│  └──────────────────┘          └──────────────────┘             │
│           │                             │                        │
│           └─────────────────────────────┘                        │
│                       │                                          │
│                       ▼                                          │
│           ┌───────────────────────┐                             │
│           │  DAPR COMPONENTS      │                             │
│           ├───────────────────────┤                             │
│           │ kafka-pubsub          │──────► Redpanda Cloud       │
│           │ statestore            │──────► Neon PostgreSQL      │
│           │ reminder-cron         │        (scheduled triggers) │
│           │ kubernetes-secrets    │        (API keys)           │
│           └───────────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

### Dapr Building Blocks Used

| Building Block | Component | Purpose |
|----------------|-----------|---------|
| **Pub/Sub** | kafka-pubsub | Publish task events to Kafka topics |
| **State Management** | statestore | Store conversation state in PostgreSQL |
| **Input Bindings** | reminder-cron | Trigger reminder checks every 5 minutes |
| **Secrets Management** | kubernetes-secrets | Securely access API keys |
| **Service Invocation** | Built-in | Frontend → Backend communication |

### Code Examples

#### Publishing Events to Kafka

`backend/src/services/task_service.py`:

```python
import httpx

async def complete_task(task_id: int, user_id: str):
    """Mark task as complete and publish event to Kafka."""
    # Update task in database
    async with get_session() as session:
        task = await session.get(Task, task_id)
        task.completed = True
        await session.commit()

    # Publish event to Kafka via Dapr
    event = {
        "event_type": "completed",
        "task_id": task_id,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat()
    }

    async with httpx.AsyncClient() as client:
        await client.post(
            "http://localhost:3500/v1.0/publish/kafka-pubsub/task-events",
            json=event
        )

    return task
```

#### Consuming Events from Kafka

`backend/src/main.py`:

```python
from fastapi import FastAPI

app = FastAPI()

# Dapr Pub/Sub subscription endpoint
@app.post("/dapr/subscribe")
async def subscribe():
    """Tell Dapr which topics this app subscribes to."""
    return [
        {
            "pubsubname": "kafka-pubsub",
            "topic": "task-events",
            "route": "/events/task-events"
        }
    ]

# Event handler for task-events topic
@app.post("/events/task-events")
async def handle_task_event(event: dict):
    """Handle task events from Kafka."""
    event_type = event["data"]["event_type"]
    task_id = event["data"]["task_id"]

    if event_type == "completed":
        # Handle recurring task creation
        await RecurringTaskService.handle_task_completed_event(event["data"])

    return {"status": "ok"}
```

#### Scheduled Reminders with Cron Binding

`backend/src/main.py`:

```python
@app.post("/reminder-cron")
async def check_reminders():
    """
    Called by Dapr cron binding every 5 minutes.
    Checks for tasks with upcoming due dates and sends reminders.
    """
    now = datetime.utcnow()
    one_hour_from_now = now + timedelta(hours=1)

    async with get_session() as session:
        # Find tasks due in next hour
        result = await session.execute(
            select(Task).where(
                Task.due_date.between(now, one_hour_from_now),
                Task.completed == False
            )
        )
        tasks = result.scalars().all()

        # Publish reminder events to Kafka
        for task in tasks:
            reminder_event = {
                "task_id": task.id,
                "user_id": task.user_id,
                "title": task.title,
                "due_at": task.due_date.isoformat()
            }

            async with httpx.AsyncClient() as client:
                await client.post(
                    "http://localhost:3500/v1.0/publish/kafka-pubsub/reminders",
                    json=reminder_event
                )

    return {"checked": len(tasks), "status": "ok"}
```

#### Accessing Secrets

`backend/src/config.py`:

```python
import httpx
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    openai_api_key: str = None

    async def load_secrets_from_dapr(self):
        """Load secrets from Dapr secret store."""
        async with httpx.AsyncClient() as client:
            # Get OpenAI API key from Kubernetes secrets via Dapr
            response = await client.get(
                "http://localhost:3500/v1.0/secrets/kubernetes-secrets/openai-secrets/api-key"
            )
            self.openai_api_key = response.json()["api-key"]
```

---

## Kafka/Redpanda Setup

### Event Schema Design

#### Task Events Topic: `task-events`

```json
{
  "event_type": "created | updated | completed | deleted",
  "task_id": 123,
  "user_id": "user123",
  "task_data": {
    "title": "Buy groceries",
    "priority": "HIGH",
    "due_date": "2026-02-10T10:00:00Z",
    "tags": ["personal", "urgent"]
  },
  "timestamp": "2026-02-03T15:30:00Z"
}
```

#### Reminders Topic: `reminders`

```json
{
  "task_id": 123,
  "user_id": "user123",
  "title": "Buy groceries",
  "due_at": "2026-02-10T10:00:00Z",
  "remind_at": "2026-02-10T09:00:00Z",
  "timestamp": "2026-02-03T15:30:00Z"
}
```

### Kafka Use Cases

| Use Case | Producer | Consumer | Purpose |
|----------|----------|----------|---------|
| **Recurring Tasks** | TaskService (on task.completed) | RecurringTaskService | Auto-create next occurrence |
| **Reminders** | ReminderService (cron job) | NotificationService | Send due date alerts |
| **Audit Log** | All API endpoints | AuditService | Track all task operations |
| **Real-time Sync** | TaskService (on any change) | WebSocketService | Push updates to connected clients |

### Monitoring Kafka

```bash
# Check Redpanda Cloud dashboard
# Visit: https://cloud.redpanda.com/

# View topics, partitions, consumer groups
# Monitor throughput and lag
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy-aks.yml`:

```yaml
name: Deploy to Azure AKS

on:
  push:
    branches:
      - main
      - 005-advanced-features-cloud-deployment
  workflow_dispatch:

env:
  AZURE_RESOURCE_GROUP: todo-chatbot-rg
  AKS_CLUSTER_NAME: todo-chatbot-aks
  ACR_NAME: todochatbotacr
  NAMESPACE: todo-chatbot

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      # Checkout code
      - name: Checkout code
        uses: actions/checkout@v4

      # Login to Azure
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      # Login to ACR
      - name: Login to Azure Container Registry
        uses: azure/docker-login@v1
        with:
          login-server: ${{ env.ACR_NAME }}.azurecr.io
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      # Build and push backend image
      - name: Build and push backend Docker image
        run: |
          docker build -t ${{ env.ACR_NAME }}.azurecr.io/todo-backend:${{ github.sha }} ./backend
          docker build -t ${{ env.ACR_NAME }}.azurecr.io/todo-backend:latest ./backend
          docker push ${{ env.ACR_NAME }}.azurecr.io/todo-backend:${{ github.sha }}
          docker push ${{ env.ACR_NAME }}.azurecr.io/todo-backend:latest

      # Build and push frontend image
      - name: Build and push frontend Docker image
        run: |
          docker build -t ${{ env.ACR_NAME }}.azurecr.io/todo-frontend:${{ github.sha }} ./frontend
          docker build -t ${{ env.ACR_NAME }}.azurecr.io/todo-frontend:latest ./frontend
          docker push ${{ env.ACR_NAME }}.azurecr.io/todo-frontend:${{ github.sha }}
          docker push ${{ env.ACR_NAME }}.azurecr.io/todo-frontend:latest

      # Get AKS credentials
      - name: Get AKS credentials
        run: |
          az aks get-credentials \
            --resource-group ${{ env.AZURE_RESOURCE_GROUP }} \
            --name ${{ env.AKS_CLUSTER_NAME }} \
            --overwrite-existing

      # Deploy with Helm
      - name: Deploy to AKS with Helm
        run: |
          helm upgrade --install todo-chatbot ./helm/todo-chatbot \
            --namespace ${{ env.NAMESPACE }} \
            --create-namespace \
            --values ./helm/todo-chatbot/values-prod.yaml \
            --set backend.image.tag=${{ github.sha }} \
            --set frontend.image.tag=${{ github.sha }} \
            --wait \
            --timeout 10m

      # Run health checks
      - name: Health check
        run: |
          kubectl rollout status deployment/todo-chatbot-backend -n ${{ env.NAMESPACE }}
          kubectl rollout status deployment/todo-chatbot-frontend -n ${{ env.NAMESPACE }}

      # Get application URL
      - name: Get application URL
        run: |
          echo "Application URL:"
          kubectl get svc todo-chatbot-frontend -n ${{ env.NAMESPACE }} \
            -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

### Configure GitHub Secrets

#### 1. Get Azure Service Principal Credentials

```bash
# Create service principal with contributor role
az ad sp create-for-rbac \
  --name "github-actions-todo-chatbot" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/todo-chatbot-rg \
  --sdk-auth

# Output (save this JSON):
{
  "clientId": "xxx",
  "clientSecret": "xxx",
  "subscriptionId": "xxx",
  "tenantId": "xxx",
  ...
}
```

#### 2. Add Secrets to GitHub

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret:

| Secret Name | Value |
|-------------|-------|
| `AZURE_CREDENTIALS` | (Entire JSON output from above) |
| `ACR_USERNAME` | todochatbotacr |
| `ACR_PASSWORD` | (From `az acr credential show --name todochatbotacr`) |

#### 3. Test CI/CD Pipeline

```bash
# Push to trigger workflow
git add .
git commit -m "feat: add Phase 5 advanced features and AKS deployment"
git push origin 005-advanced-features-cloud-deployment

# Watch workflow in GitHub Actions tab
# Should take 10-15 minutes for first deployment
```

**Official Reference**: [Deploying to Azure Kubernetes Service - GitHub Docs](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/azure-kubernetes-service)

---

## Testing & Validation

### Deployment Health Checks

```bash
# Check all pods running
kubectl get pods -n todo-chatbot

# Check pod logs
kubectl logs -n todo-chatbot <pod-name> -c backend
kubectl logs -n todo-chatbot <pod-name> -c frontend
kubectl logs -n todo-chatbot <pod-name> -c daprd

# Check Dapr components
kubectl get components -n todo-chatbot

# Check services
kubectl get svc -n todo-chatbot

# Check HPA (auto-scaling)
kubectl get hpa -n todo-chatbot
```

### Application Testing

#### 1. Access Application

```bash
# Get LoadBalancer IP
kubectl get svc todo-chatbot-frontend -n todo-chatbot

# Open in browser: http://<EXTERNAL-IP>
```

#### 2. Test Advanced Features

**Priority**:
1. Sign up / Sign in
2. Create task with HIGH priority
3. Verify priority badge displayed

**Tags**:
1. Create task with tags: "work", "urgent"
2. Verify tags shown as chips
3. Filter tasks by tag

**Due Dates**:
1. Create task with due date (tomorrow)
2. Wait 5 minutes
3. Check if reminder triggered (check logs)

**Search & Filter**:
1. Create multiple tasks
2. Use search bar to find by keyword
3. Use filter sidebar to filter by priority/status

**Recurring Tasks**:
1. Create task with WEEKLY recurrence
2. Mark task as complete
3. Verify new task created with next week's due date

#### 3. Test Chatbot

1. Go to `/chat` page
2. Test commands:
   - "Add a high priority task: Buy groceries"
   - "Show me all urgent tasks"
   - "Mark task 5 as complete"
   - "What's due this week?"

### Performance Testing

```bash
# Check pod resource usage
kubectl top pods -n todo-chatbot

# Check node resource usage
kubectl top nodes

# Test auto-scaling (generate load)
# Use a load testing tool like k6, Apache Bench, or wrk
```

### Kafka Testing

```bash
# Exec into backend pod
kubectl exec -it -n todo-chatbot <backend-pod-name> -c backend -- /bin/sh

# Install kafkacat (Kafka CLI tool)
apk add kafkacat

# List topics
kafkacat -b seed-xxxxx.cloud.redpanda.com:9092 \
  -X security.protocol=SASL_SSL \
  -X sasl.mechanism=SCRAM-SHA-256 \
  -X sasl.username=todo-chatbot \
  -X sasl.password=<password> \
  -L

# Consume task-events topic
kafkacat -b seed-xxxxx.cloud.redpanda.com:9092 \
  -X security.protocol=SASL_SSL \
  -X sasl.mechanism=SCRAM-SHA-256 \
  -X sasl.username=todo-chatbot \
  -X sasl.password=<password> \
  -t task-events \
  -C
```

---

## Submission Checklist

### Part A: Advanced Features

- [ ] **Database Migrations**: Alembic migrations applied to Neon
- [ ] **Backend Models**: Task, Tag, TaskTag models updated
- [ ] **API Endpoints**: Search, filter, sort, tags, priorities implemented
- [ ] **MCP Tools**: Updated with new parameters
- [ ] **Frontend UI**: Priority selector, tag selector, date picker, search bar
- [ ] **Tests**: Unit tests for services, API tests, MCP tool tests
- [ ] **Chatbot**: Prompts updated for new features

### Part C: Cloud Deployment

- [ ] **Azure Account**: Created with free credits
- [ ] **AKS Cluster**: Running with 2 nodes
- [ ] **Dapr**: Installed and verified on AKS
- [ ] **Redpanda Cloud**: Serverless cluster created, topics configured
- [ ] **Dapr Components**: kafka-pubsub, statestore, reminder-cron, secrets deployed
- [ ] **Kubernetes Secrets**: All secrets created
- [ ] **Helm Charts**: Updated with Dapr annotations
- [ ] **Docker Images**: Built and pushed to ACR
- [ ] **Application**: Deployed and accessible via LoadBalancer IP
- [ ] **CI/CD**: GitHub Actions workflow working

### Documentation

- [ ] **README.md**: Updated with Phase 5 setup instructions
- [ ] **CLAUDE.md**: Updated with Dapr and cloud deployment guidelines
- [ ] **Specs**: All feature specs in `specs/005-advanced-features-cloud-deployment/`
- [ ] **ADRs**: Architectural decisions documented in `history/adr/`
- [ ] **PHRs**: Prompt history records in `history/prompts/005-*/`

### Submission Package

- [ ] **GitHub Repository**: Public, with all code pushed
- [ ] **Deployed App URL**: http://<EXTERNAL-IP> accessible
- [ ] **Demo Video**: < 90 seconds, shows all features
- [ ] **WhatsApp Number**: Provided for presentation invitation

---

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

**Symptom**: Pods stuck in `Pending` or `CrashLoopBackOff`

**Solutions**:
```bash
# Check pod events
kubectl describe pod <pod-name> -n todo-chatbot

# Common causes:
# - Image pull errors → Verify ACR credentials
# - Resource limits → Reduce requests/limits
# - Secrets missing → Verify kubectl get secrets
```

#### 2. Dapr Sidecar Not Injecting

**Symptom**: Pods show 1/1 containers instead of 2/2

**Solutions**:
```bash
# Verify Dapr annotations in deployment YAML
kubectl get deployment todo-chatbot-backend -n todo-chatbot -o yaml | grep dapr

# Should show:
# dapr.io/enabled: "true"
# dapr.io/app-id: "todo-backend"

# Restart deployment
kubectl rollout restart deployment/todo-chatbot-backend -n todo-chatbot
```

#### 3. Kafka Connection Errors

**Symptom**: Logs show "Failed to connect to Kafka broker"

**Solutions**:
```bash
# Verify Kafka secrets
kubectl get secret kafka-secrets -n todo-chatbot -o yaml

# Check Dapr component configuration
kubectl get component kafka-pubsub -n todo-chatbot -o yaml

# Test connectivity from pod
kubectl exec -it <pod-name> -n todo-chatbot -c backend -- /bin/sh
nc -zv seed-xxxxx.cloud.redpanda.com 9092
```

#### 4. LoadBalancer IP Pending

**Symptom**: `kubectl get svc` shows `<pending>` for EXTERNAL-IP

**Solutions**:
```bash
# Wait 5-10 minutes (Azure provisioning time)

# Check service events
kubectl describe svc todo-chatbot-frontend -n todo-chatbot

# If still pending after 15 minutes:
# - Verify Azure subscription has quota for public IPs
# - Check Azure portal for LoadBalancer resource
```

#### 5. High Resource Usage / Costs

**Symptom**: Azure credits depleting quickly

**Solutions**:
```bash
# Stop AKS cluster when not in use
az aks stop --name todo-chatbot-aks --resource-group todo-chatbot-rg

# Reduce node count (1 node for testing)
az aks scale --name todo-chatbot-aks \
  --resource-group todo-chatbot-rg \
  --node-count 1

# Use smaller VM size (for development only)
# Note: Requires recreating cluster
```

---

## Official Resources

### Azure AKS
- [Quickstart: Deploy AKS using Azure CLI](https://learn.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-cli)
- [AKS Documentation](https://learn.microsoft.com/en-us/azure/aks/)
- [AKS Best Practices](https://learn.microsoft.com/en-us/azure/aks/best-practices)

### Dapr
- [Deploy Dapr on Kubernetes](https://docs.dapr.io/operations/hosting/kubernetes/kubernetes-deploy/)
- [Dapr Pub/Sub Overview](https://docs.dapr.io/developing-applications/building-blocks/pubsub/pubsub-overview/)
- [Apache Kafka Component](https://docs.dapr.io/reference/components-reference/supported-pubsub/setup-apache-kafka/)
- [Dapr Production Guidelines](https://docs.dapr.io/operations/hosting/kubernetes/kubernetes-production/)

### Redpanda Cloud
- [Redpanda Serverless](https://www.redpanda.com/redpanda-cloud/serverless)
- [Redpanda Cloud Overview](https://docs.redpanda.com/redpanda-cloud/get-started/cloud-overview/)
- [Get Started with Serverless](https://docs.redpanda.com/redpanda-cloud/get-started/cluster-types/serverless/)

### GitHub Actions
- [Deploying to Azure Kubernetes Service](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/azure-kubernetes-service)
- [Build and deploy to AKS](https://learn.microsoft.com/en-us/azure/aks/kubernetes-action)
- [GitHub Actions for Azure](https://azure.github.io/actions/)

### Helm
- [Helm Documentation](https://helm.sh/docs/)
- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)

---

## Summary

### What You Accomplished

✅ **Advanced Features**:
- Recurring tasks with Kafka-based event processing
- Due dates and automated reminders
- Priority levels and tags for organization
- Search, filter, and sort capabilities
- Enhanced chatbot with advanced commands

✅ **Cloud-Native Architecture**:
- Production-ready Azure AKS deployment
- Dapr for distributed systems (pub/sub, state, secrets, bindings)
- Redpanda Cloud for scalable Kafka event streaming
- Automated CI/CD with GitHub Actions

✅ **Production Standards**:
- Auto-scaling with HPA (2-5 replicas)
- Health checks and liveness probes
- Secure secrets management
- LoadBalancer for external access
- Container registry with ACR

### Points Earned (Estimated)

| Component | Points |
|-----------|--------|
| Part A: Advanced Features | ~150 pts |
| Part C: Cloud Deployment (AKS + Dapr + Kafka) | ~200 pts |
| **Total** | **~350 pts** |

### Next Steps

1. **Submit to Hackathon**: Use the submission form
2. **Monitor Costs**: Stop AKS cluster when not actively presenting
3. **Iterate**: Add more features (bonus points):
   - Multi-language support (Urdu chatbot)
   - Voice commands
   - Advanced monitoring (Prometheus + Grafana)
4. **Presentation**: Prepare 90-second demo video

### Final Verification Commands

```bash
# Verify everything is running
kubectl get all -n todo-chatbot

# Get application URL
kubectl get svc todo-chatbot-frontend -n todo-chatbot

# Check Dapr components
kubectl get components -n todo-chatbot

# Check recent deployments
kubectl get events -n todo-chatbot --sort-by='.lastTimestamp' | head -20

# Verify CI/CD
# Go to GitHub Actions tab and check latest workflow run
```

---

**Congratulations!** You've completed Phase 5: Advanced Cloud Deployment with Azure AKS, Dapr, and Kafka. 🎉

Your todo chatbot is now a production-ready, cloud-native, event-driven AI application!

---

*Generated with verified information from official documentation as of February 2026*
