# Docker Build Fixes - Frontend

## Issues Resolved

### 1. **AUTH_SECRET Environment Variable Mismatch** ✅
**Problem**: Code expected `AUTH_SECRET` but Dockerfile provided `BETTER_AUTH_SECRET`

**Files Fixed**:
- `frontend/lib/auth.ts` - Now accepts both `AUTH_SECRET` and `BETTER_AUTH_SECRET`
- `frontend/app/api/auth/token/route.ts` - Updated to use fallback logic
- `frontend/Dockerfile` - Changed to use `AUTH_SECRET` (NextAuth standard)
- `.env.example` - Updated to use `AUTH_SECRET`

**Solution**:
```typescript
// Support both variable names for compatibility
const authSecret = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
  throw new Error("AUTH_SECRET or BETTER_AUTH_SECRET environment variable is required");
}
```

---

### 2. **Edge Runtime Incompatibility with bcryptjs/jsonwebtoken** ✅
**Problem**: Auth routes were running in Edge Runtime, but bcryptjs and jsonwebtoken require Node.js APIs

**Files Fixed**:
- `frontend/app/api/auth/[...nextauth]/route.ts`
- `frontend/app/api/auth/signup/route.ts`
- `frontend/app/api/auth/token/route.ts`

**Solution**: Added runtime configuration to all auth routes
```typescript
// Force Node.js runtime (bcryptjs requires Node.js APIs, not Edge Runtime)
export const runtime = 'nodejs';
```

---

### 3. **Missing Public Directory** ✅
**Problem**: Dockerfile tried to copy `/app/public` but directory didn't exist

**Files Fixed**:
- `frontend/Dockerfile`

**Solution**: Create empty public directory in builder stage
```dockerfile
# Build Next.js application
RUN npm run build

# Create public directory if it doesn't exist (prevents COPY errors in runner stage)
RUN mkdir -p public
```

---

## Security Warnings (Non-Critical)

The build shows 2 warnings about using ARG/ENV for secrets:
```
⚠ SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "AUTH_SECRET")
⚠ SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "AUTH_SECRET")
```

**Status**: ✅ Safe to ignore

**Explanation**:
- These are **dummy values** for build-time only (`dummy-secret-for-build-only-replace-at-runtime-with-real-secret-min-32-chars`)
- Real secrets are provided at **runtime** via Kubernetes ConfigMap/Secrets
- Next.js build process requires the variable to exist (not the actual value)
- This is a standard pattern for multi-stage Docker builds

---

## Build Command

```bash
# Build frontend image
docker build -t hackathontodoXY1234.azurecr.io/todo-frontend:latest ./frontend

# Build backend image
docker build -t hackathontodoXY1234.azurecr.io/todo-backend:latest ./backend
```

---

## Environment Variables (Runtime)

When deploying to Kubernetes, provide these real values:

### Frontend ConfigMap/Secret
```yaml
env:
  - name: AUTH_SECRET
    valueFrom:
      secretKeyRef:
        name: auth-secret
        key: secret
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: neon-db-secret
        key: url
  - name: NEXT_PUBLIC_API_URL
    value: "http://todo-backend-service:8000"
```

### Backend ConfigMap/Secret
```yaml
env:
  - name: AUTH_SECRET  # Same secret as frontend
    valueFrom:
      secretKeyRef:
        name: auth-secret
        key: secret
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: neon-db-secret
        key: url
```

---

## Testing the Build

After successful build, test the image:

```bash
# Run frontend container locally
docker run -p 3000:3000 \
  -e AUTH_SECRET="test-secret-min-32-chars-long-here" \
  -e DATABASE_URL="postgresql://..." \
  -e NEXT_PUBLIC_API_URL="http://localhost:8000" \
  hackathontodoXY1234.azurecr.io/todo-frontend:latest

# Check health
curl http://localhost:3000/api/health
```

---

## Changes Summary

| File | Change | Reason |
|------|--------|--------|
| `frontend/lib/auth.ts` | Support both AUTH_SECRET and BETTER_AUTH_SECRET | Compatibility & NextAuth standard |
| `frontend/app/api/auth/[...nextauth]/route.ts` | Add `runtime = 'nodejs'` | bcryptjs requires Node.js runtime |
| `frontend/app/api/auth/signup/route.ts` | Add `runtime = 'nodejs'` | bcryptjs requires Node.js runtime |
| `frontend/app/api/auth/token/route.ts` | Add `runtime = 'nodejs'` + fallback | jsonwebtoken requires Node.js runtime |
| `frontend/Dockerfile` | Change BETTER_AUTH_SECRET → AUTH_SECRET | NextAuth standard |
| `frontend/Dockerfile` | Create public directory in builder | Prevent COPY errors |
| `.env.example` | Change BETTER_AUTH_SECRET → AUTH_SECRET | NextAuth standard |

---

## Next Steps

1. ✅ Build succeeds without errors
2. Push images to Azure Container Registry:
   ```bash
   docker push hackathontodoXY1234.azurecr.io/todo-frontend:latest
   docker push hackathontodoXY1234.azurecr.io/todo-backend:latest
   ```
3. Deploy to Kubernetes (Minikube or AKS)
4. Configure secrets in Kubernetes
5. Apply manifests

---

**Status**: All issues resolved ✅
**Build Time**: ~3-4 minutes
**Image Size**: ~150-200MB (Alpine-based)

