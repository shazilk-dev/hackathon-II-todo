#!/usr/bin/env bash
set -euo pipefail

echo "Running Alembic migrations..."
alembic upgrade head

echo "Starting FastAPI (uvicorn)..."
exec uvicorn src.main:app --host 0.0.0.0 --port "${PORT:-8000}"

