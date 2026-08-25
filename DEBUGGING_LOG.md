# Debugging Log — ProductForge

This document records key bugs encountered during development of ProductForge and the debugging steps taken to resolve them.
Required deliverable per project rubric.

---

## Bug #1 — TypeScript: `ProjectFile` not found in `lib/openai.ts`

**Error**:
```
lib/openai.ts(241,18): error TS2304: Cannot find name 'ProjectFile'.
lib/openai.ts(242,86): error TS2304: Cannot find name 'ProjectFile'.
```

**Root Cause**: `ProjectFile` type was added to `types/index.ts` during the Groq integration but the import in `lib/openai.ts` was not updated.

**Fix**: Added `ProjectFile` to the import statement in `lib/openai.ts`:
```typescript
import { ProductAnalysis, ProductBlueprint, ScrapedContent, ProjectFile } from '@/types';
```

**Verification**: `npx tsc --noEmit` → exit code 0.

---

## Bug #2 — Syntax Error in `lib/groq.ts` (Duplicate Closing Braces)

**Error**:
```
./lib/groq.ts
Error: x Expression expected
65 | }
66 | console.error('Groq Analysis Error:', err);
67 | }
68 | }
```

**Root Cause**: When adding console.log telemetry to `analyzeWebsiteWithGroq`, the replacement accidentally duplicated the `catch {}` closing braces, creating two closing blocks for the same function, causing a syntax error at compile time.

**Fix**: Removed the duplicate catch block lines 66-68:
```diff
-      console.error('Groq Analysis Error:', err);
-    }
-  }
```

**Verification**: Next.js hot reload compiled successfully, `npx tsc --noEmit` → exit code 0.

---

## Bug #3 — 401 Unauthorized on Login (Email Not Confirmed)

**Error**: Browser console showed `401 (Unauthorized)` when calling `/api/auth/login` with valid credentials.

**Root Cause**: Supabase's default Auth settings have **"Enable email confirmations"** turned ON. New user signups require clicking an email confirmation link before `signInWithPassword` succeeds. The previous code incorrectly had a local session fallback that silently bypassed this, creating insecure fake JWTs.

**Fix Options**:
1. **Recommended (Development)**: Disable "Enable email confirmations" in Supabase Dashboard → Authentication → Settings.
2. **Production**: Keep confirmations on. The signup route now returns `requiresEmailConfirmation: true` and prompts the user to check their email. The login route returns a clear `401` with `"Email not confirmed"` message.

**Security Note**: Removed the fake `btoa(JSON.stringify(...))` unsigned JWT fallback entirely. This was a critical security bug — it accepted any email/password combination.

---

## Bug #4 — Dashboard Accessible Without Authentication

**Issue**: Navigating to `http://localhost:3000/dashboard` directly loaded the page without any session check.

**Root Cause**: No `middleware.ts` existed in the project. The dashboard `page.tsx` had no auth guard — it just fetched projects and rendered.

**Fix**: Two-layer protection implemented:
1. **Edge Middleware** (`middleware.ts` at project root): Intercepts requests to `/dashboard/*` and `/projects/*`, reads `session_token` cookie, redirects to `/login` if missing.
2. **Client Guard** (`app/dashboard/page.tsx`): `useEffect` calls `getCurrentUser()` on mount and calls `router.push('/login')` if no session exists.

---

## Bug #5 — All Users' Projects Returned to Every Caller

**Issue**: `GET /api/projects` returned all projects in the database to any authenticated user — no per-user filtering.

**Root Cause**: `getAllProjects()` in `lib/store.ts` supports a `userId` parameter for filtering, but `/api/projects/route.ts` called it with no argument (`getAllProjects()` with no `userId`).

**Fix**:
- Updated `/api/projects/route.ts` to extract `userId` from the `Authorization: Bearer <token>` header by base64-decoding the JWT payload and reading the `sub` (subject) claim.
- Passed `userId` to `getAllProjects(userId)`.
- Also updated `/api/analyze/route.ts` to attach `userId` when saving new projects so the ownership is recorded from creation.

---

## Bug #6 — `session_token` Cookie Not Set (Middleware Couldn't Read Session)

**Issue**: After implementing `middleware.ts` to read a `session_token` cookie, users were being redirected to `/login` even after successful authentication because the cookie was never being set.

**Root Cause**: `lib/auth.ts` only stored the session in `localStorage`. Middleware runs on the server/edge and cannot access `localStorage` — it can only read cookies.

**Fix**: Added `setSessionCookie()` and `clearSessionCookie()` helpers to `lib/auth.ts`:
```typescript
function setSessionCookie(token: string) {
  document.cookie = `session_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
}
```
Called on login/signup success. Cookie is cleared on logout.

---

## Bug #7 — Projects API Returns 401 After Auth Fix

**Issue**: After fixing auth and adding the Authorization header requirement to `/api/projects`, the dashboard was fetching projects without sending the header, causing 401 responses.

**Root Cause**: The dashboard `page.tsx` was using `fetch('/api/projects')` with no headers.

**Fix**: Updated the fetch call in `app/dashboard/page.tsx`:
```typescript
const token = getAuthToken();
const res = await fetch('/api/projects', {
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});
```
Also exported `getAuthToken()` from `lib/auth.ts` to make the token accessible from page components.
