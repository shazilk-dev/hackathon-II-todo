# Gemini Context File - Hackathon Todo

This file provides a comprehensive overview of the `hackathon-todo` project context for Gemini agents.

## 1. Project Overview

The **Hackathon Todo** project is a task management application evolving through two phases:
*   **Phase 1 (Legacy/Root):** A simple CLI-based Todo app (Python).
*   **Phase 2 (Current Focus):** A full-stack web application with a **FastAPI** backend and **Next.js** frontend, featuring JWT authentication and PostgreSQL storage.

## 2. Architecture

```mermaid
graph LR
    User[User Browser] -->|HTTPS| Frontend[Next.js Frontend]
    Frontend -->|API Requests + JWT| Backend[FastAPI Backend]
    Backend -->|SQL Queries| DB[(Neon PostgreSQL)]
    Frontend -->|Auth Requests| Auth[Better Auth (Internal)]
    Auth -->|Session/User Data| DB
```

*   **Authentication:** Managed by **Better Auth** on the frontend (Next.js). It issues JWTs stored in HTTP-only cookies.
*   **Authorization:** Backend verifies JWT signatures using a shared `BETTER_AUTH_SECRET`.
*   **Data Isolation:** All data access is scoped to the authenticated `user_id`. Backend enforces this via middleware and service-layer checks.

## 3. Tech Stack

### Backend (`/backend`)
*   **Language:** Python 3.13+
*   **Framework:** FastAPI (Async)
*   **ORM:** SQLModel (SQLAlchemy + Pydantic)
*   **Database:** Neon PostgreSQL (via `asyncpg`)
*   **Migrations:** Alembic
*   **Package Manager:** UV
*   **Testing:** Pytest (90% coverage achieved)

### Frontend (`/frontend`)
*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript 5.7+
*   **Styling:** Tailwind CSS 4+
*   **UI Library:** React 19
*   **Auth:** Better Auth
*   **Package Manager:** npm / bun

## 4. Key Directory Structure

```text
F:\PROJECTS\hackathone-II\hackathon-todo\
├── main.py                  # Phase 1: CLI Entry point
├── backend/                 # Phase 2: API Server
│   ├── src/
│   │   ├── api/             # Routers & Middleware
│   │   ├── services/        # Business Logic
│   │   ├── models/          # DB Models (SQLModel)
│   │   └── db/              # DB Config & Migrations
│   ├── tests/               # Pytest suite (Unit, Integration, Contract)
│   └── pyproject.toml       # Backend Config
├── frontend/                # Phase 2: Web Client
│   ├── app/                 # Next.js App Router Pages
│   ├── components/          # React Components
│   ├── lib/                 # Utilities (API Client, Auth)
│   └── package.json         # Frontend Config
└── specs/                   # Project Specifications & Plans
```

## 5. Setup & Run

### Prerequisites
*   Python 3.13+ & UV
*   Node.js 18+ & npm/bun
*   PostgreSQL Database (Neon)

### Backend Setup
1.  `cd backend`
2.  `uv sync`
3.  `cp .env.example .env` (Configure `DATABASE_URL`, `BETTER_AUTH_SECRET`)
4.  `uv run alembic upgrade head`
5.  `uv run uvicorn src.main:app --reload`

### Frontend Setup
1.  `cd frontend`
2.  `npm install`
3.  `cp .env.example .env.local` (Configure API URL, Auth Secret)
4.  `npm run dev`

## 6. Development Guidelines

### General Rules
*   **Spec-Driven:** All changes must align with files in `specs/`.
*   **Tests First:** Write tests before or alongside implementation.
*   **Strict Types:** 100% type safety required (mypy strict, TS strict).
*   **No "Any":** Avoid `any` type in TS and Python.

### Backend Specifics
*   **Layered Arch:** API -> Service -> Data. Never skip layers.
*   **Async:** All DB I/O must be async.
*   **Testing:** Maintain >80% coverage (Currently ~90%). Use `pytest tests/ --cov=src`.

### Frontend Specifics
*   **Server Components:** Default to Server Components where possible.
*   **Client Components:** Use `'use client'` only for interactivity.
*   **Styling:** Minimalist, clean slate/blue theme. Follow 2026 UI trends.

## 7. Common Commands

| Context | Action | Command |
| :--- | :--- | :--- |
| **Backend** | Run Server | `uv run uvicorn src.main:app --reload` |
| **Backend** | Run Tests | `uv run pytest` |
| **Backend** | Lint/Format | `uv run ruff check src` / `uv run ruff format src` |
| **Backend** | Type Check | `uv run mypy src` |
| **Backend** | Migrations | `uv run alembic upgrade head` |
| **Frontend** | Run Server | `npm run dev` |
| **Frontend** | Build | `npm run build` |
| **Frontend** | Lint | `npm run lint` |

## 8. Current Status (Updated 2026-01-27)

*   **Authentication:** Fully integrated and fixed. JWT extraction from Better Auth session is working correctly in `frontend/lib/api.ts`.
*   **Backend:** Finalized with 90% test coverage. 113 tests passing.
*   **Frontend:** Builds successfully. Dashboard and Task components are integrated with the backend API.
*   **Integration:** End-to-end flow verified. User isolation and data scoping are fully functional.

## 9. Recent Fixes & Improvements
*   **Frontend API Client:** Fixed session access pattern (`result.data.session.token` instead of `session.session.token`).
*   **Backend Services:** Added missing `timezone` imports for UTC timestamps.
*   **Testing Infrastructure:** Implemented in-memory SQLite for rapid integration testing in `backend/tests/conftest.py`.