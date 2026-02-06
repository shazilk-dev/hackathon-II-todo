# Multi-stage build for FastAPI with Python 3.13
# Phase 4: Kubernetes Deployment
# Optimized for production with security best practices

FROM python:3.13-slim AS base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies including build tools and curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install UV package manager for faster dependency resolution
RUN pip install --no-cache-dir uv

WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./

# Install Python dependencies (non-editable for production)
RUN uv pip install --system --no-cache .

# Production stage
FROM python:3.13-slim AS production

# Install only runtime dependencies (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security (UID 1000)
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Copy installed packages from base stage
COPY --from=base /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=base /usr/local/bin /usr/local/bin

# Copy application code with proper ownership
COPY --chown=appuser:appuser . .

# Set ownership of app directory
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose FastAPI port
EXPOSE 8000

# Health check endpoint (Kubernetes liveness/readiness probes)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run application with uvicorn
# Using 1 worker for development, scale with replicas in Kubernetes
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
