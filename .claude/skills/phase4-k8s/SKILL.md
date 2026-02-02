# Phase 4: Local Kubernetes Deployment Skill

## Overview
This skill guides the transition of the Todo Chatbot (Phase III) into a Cloud-Native architecture deployed locally on Minikube. It covers containerization, Helm chart creation, and Kubernetes orchestration using AI-assisted tools.

## Objectives
1. [cite_start]**Containerize**: Create optimized Docker images for Frontend (Next.js) and Backend (FastAPI)[cite: 521].
2. [cite_start]**Orchestrate**: Define infrastructure using Helm Charts[cite: 523].
3. [cite_start]**Deploy**: Launch the full stack on a local Minikube cluster[cite: 519].
4. [cite_start]**AI-Ops**: Utilize `kubectl-ai` and `kagent` for management[cite: 524].

## Prerequisites
- **Docker Desktop** (with Kubernetes enabled or separate Minikube)
- **Minikube** active (`minikube start`)
- **Helm** installed
- [cite_start]**kubectl-ai** and **kagent** (optional but recommended tools) [cite: 527]

---

## Workflow Steps

### Step 1: Containerization (Docker)
**Goal:** Convert Phase III application into Docker images.

* **Frontend (Next.js):**
    * Create a multi-stage `Dockerfile` in `/frontend`.
    * Target: `node:18-alpine` (or similar lightweight image).
    * **Action:** Build image `todo-frontend:latest`.
* **Backend (FastAPI):**
    * Create a `Dockerfile` in `/backend`.
    * Target: `python:3.13-slim` (using `uv` or `pip`).
    * **Action:** Build image `todo-backend:latest`.

**Claude Prompt Pattern:**
> "Analyze /frontend and create a production-ready Dockerfile. Then run the build command."

### Step 2: Infrastructure as Code (Helm)
[cite_start]**Goal:** Package the application for Kubernetes[cite: 523].

* Create a Helm chart structure:
    ```text
    /helm
      /templates
        - frontend-deployment.yaml
        - backend-deployment.yaml
        - db-deployment.yaml (Neon or local Postgres fallback)
        - service.yaml
        - ingress.yaml
      values.yaml
      Chart.yaml
    ```
* **Constraint:** Ensure environment variables (like `DATABASE_URL` and `OPENAI_API_KEY`) are handled via Secrets, not hardcoded.

**Claude Prompt Pattern:**
> "Generate a Helm chart for a FastAPI backend and Next.js frontend. Include a Secret for sensitive env vars."

### Step 3: Local Deployment (Minikube)
[cite_start]**Goal:** Run the stack locally[cite: 524].

1.  **Load Images:** Ensure Minikube can see local Docker images.
    * Command: `minikube image load todo-frontend:latest`
2.  **Deploy:**
    * Command: `helm install todo-app ./helm`
3.  **Verify:**
    * Command: `kubectl get pods`

---

## AI-Ops Tool Usage
[cite_start]Use these specific tools as defined in the Hackathon Requirements[cite: 529, 533].

### Docker AI (Gordon)
*If available in Docker Desktop Beta:*
- **Analyze:** `docker ai "analyze the todo-backend image"`
- **Generate:** `docker ai "create a Dockerfile for this Python project"`

### kubectl-ai
*For declarative K8s operations:*
- [cite_start]**Deploy:** `kubectl-ai "deploy the todo frontend with 2 replicas"` [cite: 535]
- [cite_start]**Debug:** `kubectl-ai "check why the pods are failing"` [cite: 537]
- [cite_start]**Scale:** `kubectl-ai "scale the backend to handle more load"` [cite: 536]

### kagent
*For cluster health and optimization:*
- [cite_start]**Health:** `kagent "analyze the cluster health"` [cite: 539]
- [cite_start]**Optimize:** `kagent "optimize resource allocation"` [cite: 540]

---

## Verification Checklist
- [ ] Frontend container builds successfully.
- [ ] Backend container builds successfully.
- [ ] Helm chart passes linting (`helm lint ./helm`).
- [ ] Pods are 'Running' in Minikube (`kubectl get pods`).
- [ ] Application is accessible via localhost or Minikube IP.