# Admin System Unification Plan

## Goal

Make admin accessible on all 9 subdomain apps via Cmd/Ctrl+Shift+A only (no visible buttons/tabs), fix cross-subdomain auth, add meaningful admin panels per app, fix missing environment variables in production, and connect everything to www as the central admin hub.

---

## Current State

**Admin exists on:** www, thoughts (2 of 9 apps)
**Admin missing from:** dev, docs, lab, links, metrics, status, updates (7 of 9 apps)
**Visible admin link:** `apps/thoughts/src/app/layout.tsx:77-79` — must be removed
**Cookie config:** No `domain` set, `sameSite: "strict"` — login doesn't persist across subdomains
**thoughts admin route:** `/admin` page exists as a full-page route separate from the Cmd+Shift+A overlay

### Environment Variables — Production Gaps

| Env Var | www | thoughts | dev | links | updates | metrics | status | lab | docs |
|---------|-----|----------|-----|-------|---------|---------|--------|-----|------|
| NEXT_PUBLIC_POSTHOG_KEY | YES | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| NEXT_PUBLIC_POSTHOG_HOST | YES | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| ADMIN_PASSWORD | YES | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| NEXT_PUBLIC_SUPABASE_URL | YES | YES | YES | YES* | YES | YES | YES | YES* | YES* |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | YES | YES | YES | YES* | YES | YES | YES | YES* | YES* |
| SUPABASE_SERVICE_ROLE_KEY | YES | YES | YES | YES* | YES | YES | YES | YES* | YES* |
| GITHUB_TOKEN | — | — | — | — | — | YES | — | — | — |
| GITHUB_USERNAME | — | — | — | — | — | YES | — | — | — |
| WAKATIME_API_KEY | — | — | — | — | — | YES | — | — | — |
| CRON_SECRET | — | — | — | — | — | YES | YES | — | — |
| RESEND_API_KEY | YES | — | — | — | — | — | — | — | — |

*YES\* = set but not actually needed by the app (harmless)*

**Critical gaps:**
- `NEXT_PUBLIC_POSTHOG_KEY` missing on ALL 8 subdomains — PostHog analytics completely broken
- `ADMIN_PASSWORD` missing on ALL 8 subdomains — admin login impossible even if we add AdminProvider
- `NEXT_PUBLIC_POSTHOG_HOST` missing on 8 subdomains (optional — PostHog has defaults, but should be set for proxy to work)

---

## Phase 1: Fix Environment Variables in Production

**Action:** Add missing env vars to all 8 Vercel subdomain projects.

Commands (run via `npx vercel env add`):

```bash
# For ALL 8 subdomain apps:
for app in thoughts dev links updates metrics status lab docs; do
  npx vercel env add NEXT_PUBLIC_POSTHOG_KEY production --cwd "apps/$app"
  npx vercel env add NEXT_PUBLIC_POSTHOG_HOST production --cwd "apps/$app"
  npx vercel env add ADMIN_PASSWORD production --cwd "apps/$app"
done
```

Values should match those already set on the www project. The user will need to provide these interactively (they're encrypted on Vercel).

**Files:** No code changes. Vercel dashboard / CLI only.

---

## Phase 2: Remove Visible Admin Access

**File:** `apps/thoughts/src/app/layout.tsx:77-79`

Remove the visible admin nav link:
```tsx
// DELETE these 3 lines:
<a href="/admin" className="text-xs uppercase tracking-widest text-muted hover:text-accent-400 transition-colors">
  admin
</a>
```

The `/admin` route itself can remain (it's password-protected) — just no visible link to it. Admin is accessed exclusively via Cmd/Ctrl+Shift+A.

---

## Phase 3: Cross-Subdomain Cookie Auth

**File:** `packages/lib/src/admin/auth.ts`

Update `ADMIN_COOKIE_OPTIONS` to support cross-subdomain login:

```typescript
export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  domain: process.env.NODE_ENV === "production" ? ".anipotts.com" : undefined,
  path: "/",
};
```

**Why these changes:**
- `domain: ".anipotts.com"` — makes the cookie available to all `*.anipotts.com` subdomains in production
- `sameSite: "lax"` — required for cross-subdomain cookies (strict blocks them)
- `secure: true` only in production — allows local dev on `http://localhost`
- `domain: undefined` in dev — `localhost` doesn't support domain cookies

**Impact:** Login once on any subdomain → authenticated on all subdomains.

---

## Phase 4: Add Admin to All 7 Remaining Apps

For each of the 7 apps (dev, docs, lab, links, metrics, status, updates), create:

### 4A. Server Actions — `src/app/actions.ts`

Each app needs thin `"use server"` wrappers. Three tiers based on what the app needs:

**Tier 1 — Auth only (links, lab, docs):**
```typescript
"use server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS, verifyAdminPassword } from "@anipotts/lib/admin";

export async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === "true";
}
export async function login(password: string) {
  const result = verifyAdminPassword(password);
  if (result.success) {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, "true", ADMIN_COOKIE_OPTIONS);
  }
  return result;
}
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
```

**Tier 2 — Auth + Supabase read (dev, updates):**
Same as Tier 1 + add cache metadata fetch for admin panel.

**Tier 3 — Auth + Supabase read/write (metrics, status):**
Same as Tier 2 + add cache refresh/cron trigger actions.

### 4B. Admin Context — `src/context/AdminContext.tsx`

Identical pattern for all 7 apps (copy from `apps/thoughts/src/context/AdminContext.tsx`):

```tsx
"use client";
import { type ReactNode } from "react";
import { AdminProvider as SharedAdminProvider, useAdmin } from "@anipotts/ui/admin";
import { checkAuth, login, logout } from "@/app/actions";
export { useAdmin };
const adminActions = { checkAuth, login, logout };
export function AdminProvider({ children }: { children: ReactNode }) {
  return <SharedAdminProvider actions={adminActions}>{children}</SharedAdminProvider>;
}
```

### 4C. Admin Overlay — `src/components/AdminOverlay.tsx`

```tsx
"use client";
import { AdminShell } from "@anipotts/ui/admin";
import AdminPanel from "@/app/admin/AdminPanel";
export default function AdminOverlay() {
  return <AdminShell><AdminPanel /></AdminShell>;
}
```

### 4D. Layout Integration

Add `AdminProvider` + `AdminOverlay` to each app's `layout.tsx`:
- Import `AdminProvider` from `@/context/AdminContext`
- Import `AdminOverlay` from `@/components/AdminOverlay`
- Wrap children in `<AdminProvider>` inside the existing providers
- Add `<AdminOverlay />` before the closing `</AdminProvider>`

### 4E. Per-App Admin Panels

Create `src/app/admin/AdminPanel.tsx` for each app:

| App | Admin Panel Content |
|-----|-------------------|
| **metrics** | Cache freshness (last cron run, next scheduled), manual cron trigger button, cached data preview (GitHub stats, WakaTime hours), cron history |
| **status** | Cache freshness, manual status check trigger, service uptime table, last check timestamps |
| **dev** | Cache freshness (when GitHub language data was last updated), link to metrics admin |
| **updates** | Cache freshness (when commit data was last updated), link to metrics admin |
| **links** | Static info panel — app description, link count, environment status |
| **lab** | Static info panel — app description, experiment list, environment status |
| **docs** | Static info panel — app description, page count, environment status |

### New Shared Components (packages/ui)

Create `packages/ui/src/admin/panels/`:
- **`AdminPanelShell.tsx`** — Shared layout wrapper (header with green ADMIN badge, time, region, logout button) extracted from existing AdminCommandCenter
- **`CacheFreshnessCard.tsx`** — Reusable card showing key, last updated timestamp, freshness indicator (green/yellow/red based on staleness)
- **`StaticAdminInfo.tsx`** — Simple info card for apps with no dynamic data

---

## Phase 5: Expand www as Central Admin Hub

**File:** `apps/www/src/app/thoughts/admin/AdminCommandCenter.tsx`

Add a third tab "Infrastructure" alongside existing "Monitor" and "Editor" tabs:

**Infrastructure tab shows:**
- Status of all 9 subdomains (fetch from status cron data in Supabase)
- Quick links to each subdomain admin (opens in new tab)
- Environment health indicator per subdomain
- Last deployment timestamps (if available via Vercel API)

This makes www the single place to get an overview of the entire ecosystem.

---

## Files to Create

| File | App | Purpose |
|------|-----|---------|
| `src/app/actions.ts` | dev, docs, lab, links, metrics, status, updates | Server action wrappers |
| `src/context/AdminContext.tsx` | dev, docs, lab, links, metrics, status, updates | Admin provider wrapper |
| `src/components/AdminOverlay.tsx` | dev, docs, lab, links, metrics, status, updates | Shell overlay component |
| `src/app/admin/AdminPanel.tsx` | dev, docs, lab, links, metrics, status, updates | Per-app admin content |
| `packages/ui/src/admin/panels/AdminPanelShell.tsx` | shared | Shared admin layout |
| `packages/ui/src/admin/panels/CacheFreshnessCard.tsx` | shared | Reusable cache info card |
| `packages/ui/src/admin/panels/StaticAdminInfo.tsx` | shared | Static info card |

## Files to Modify

| File | Change |
|------|--------|
| `apps/thoughts/src/app/layout.tsx` | Remove visible admin link (lines 77-79) |
| `packages/lib/src/admin/auth.ts` | Update cookie options for cross-subdomain auth |
| `apps/*/src/app/layout.tsx` (7 apps) | Add AdminProvider + AdminOverlay |
| `apps/www/src/app/thoughts/admin/AdminCommandCenter.tsx` | Add Infrastructure tab |
| `packages/ui/src/admin/index.ts` | Export new panel components |
| `packages/ui/package.json` | Add panels export entry if needed |
| `packages/ui/tsup.config.ts` | Add panels entry point if needed |

---

## Verification

1. **Env vars:** `npx vercel env ls --cwd "apps/$app"` for each app confirms all required vars present
2. **Build:** `pnpm turbo build --force` — all 12 targets pass
3. **Typecheck:** `pnpm turbo typecheck` — zero errors
4. **Manual test per app:**
   - No visible admin button/link/tab anywhere in the UI
   - Press Cmd/Ctrl+Shift+A → admin login modal appears
   - Enter password → admin panel loads with app-specific content
   - Navigate to another subdomain → already authenticated (cross-subdomain cookie)
   - Logout on any subdomain → logged out everywhere
5. **www central hub:** Infrastructure tab shows status of all subdomains

## Execution Order

1. Phase 1 (env vars) — fix production gaps first
2. Phase 2 (remove visible link) — quick single-line removal
3. Phase 3 (cross-subdomain cookies) — one file change in shared package, rebuild
4. Phase 4 (add admin to 7 apps) — bulk creation, build after each batch
5. Phase 5 (www central hub) — final enhancement
