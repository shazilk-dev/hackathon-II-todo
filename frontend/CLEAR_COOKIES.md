# How to Clear Stale Authentication Cookies

If you're stuck in a redirect loop or see "Please sign in to view tasks" when you should be signed in, you likely have stale/invalid cookies.

## Quick Fix: Clear Browser Cookies

### Chrome/Edge
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Cookies" in left sidebar
4. Select "http://localhost:3000"
5. Right-click → "Clear"
6. Refresh the page

### Firefox
1. Open DevTools (F12)
2. Go to "Storage" tab
3. Click "Cookies" in left sidebar
4. Select "http://localhost:3000"
5. Right-click → "Delete All"
6. Refresh the page

### Alternative: Incognito/Private Window
- Open http://localhost:3000 in an incognito/private window
- No cookies = fresh start

## What Cookies to Delete

Better Auth uses these cookie names:
- `better-auth.session_token` (primary)
- `session_token` (alternative)
- `auth-token` (fallback)

Delete ALL of them to ensure clean state.

## After Clearing Cookies

1. Go to http://localhost:3000
2. Click "Sign In" or "Create Account"
3. You should now see the sign-in/sign-up form correctly
4. After signing in, you'll be redirected to /dashboard

## Prevention

The middleware has been fixed to:
- Only protect /dashboard routes
- Not redirect users away from /auth pages
- Let the dashboard page handle invalid sessions client-side

This means stale cookies won't cause redirect loops anymore.
