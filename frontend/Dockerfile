# Multi-stage build for Next.js (Next.js 15.1.3)
# Phase 4: Kubernetes Deployment
# Optimized for production with standalone output

FROM node:20-alpine AS deps
WORKDIR /app

# Install libc6-compat for Next.js compatibility on Alpine
RUN apk add --no-cache libc6-compat

# Install dependencies (including devDependencies needed for build)
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

# Install libc6-compat for build
RUN apk add --no-cache libc6-compat

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Provide dummy environment variables for build time
# These are ONLY used during the Next.js build process (npm run build)
# Real values will be provided at runtime via Kubernetes ConfigMap/Secrets
ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ARG AUTH_SECRET=dummy-secret-for-build-only-replace-at-runtime-with-real-secret-min-32-chars
ARG NEXT_PUBLIC_API_URL=http://localhost:8000

ENV DATABASE_URL=${DATABASE_URL}
ENV AUTH_SECRET=${AUTH_SECRET}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build Next.js application (creates .next directory with standalone output)
RUN npm run build

# Create public directory if it doesn't exist (prevents COPY errors in runner stage)
RUN mkdir -p public

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install wget for health checks (Alpine doesn't include it by default)
RUN apk add --no-cache wget

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets (now guaranteed to exist from builder stage)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy standalone server and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose Next.js port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check (Next.js root route)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start Next.js server
CMD ["node", "server.js"]
