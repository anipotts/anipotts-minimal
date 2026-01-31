# Plan: Unify the anipotts.com Ecosystem

## Goal
Eliminate data duplication, connect all subdomains to shared single-source-of-truth data, make metrics/status/dev/updates show real live data, and build a unified admin system across all 10 apps.

## Budget Constraints
- Domain + Vercel Pro + Claude Code Max ($200/mo)
- All API integrations use free tiers: GitHub API (5k req/hr), WakaTime (free tier, 14-day window — we cache in Supabase), Supabase free tier, Vercel Cron (included in Pro)

## Current Problems (from audit)

| Problem | Where | Impact |
|---------|-------|--------|
| Blog + admin fully duplicated | www + thoughts (identical `actions.ts`) | Two admin panels editing same DB |
| Social links hardcoded in 3+ places | www/connect, links, metadata | Out-of-sync risk |
| Projects data only in www | `apps/www/src/data/projects.ts` | Other apps can't reference it |
| Metrics claims live APIs, all hardcoded | metrics subdomain | Misleading to visitors |
| Status claims BetterStack, all hardcoded | status subdomain | Lists non-existent services |
| Dev page static | dev subdomain | Goes stale immediately |
| Updates has 3 hardcoded entries | updates subdomain | Not maintained |
| Lab links to non-existent routes | lab subdomain | Broken navigation |
| Docs links to non-existent pages | docs subdomain | Broken navigation |
| Cookie auth is per-domain | AdminContext | Expected, but no admin on subdomains yet |

---

## Architecture Overview

### Data Flow (After)

```
                    ┌─────────────────────┐
                    │   @anipotts/lib      │
                    │                     │
                    │  data/projects.ts   │  ← Single source: all projects
                    │  data/social.ts     │  ← Single source: all links
                    │  data/site.ts       │  ← Single source: bio, metadata
                    │  data/services.ts   │  ← Single source: monitored URLs
                    │                     │
                    │  api/github.ts      │  ← GitHub API client
                    │  api/wakatime.ts    │  ← WakaTime API client
                    │  api/status.ts      │  ← HTTP ping utility
                    │  api/changelog.ts   │  ← Git log parser
                    │                     │
                    │  admin/actions.ts   │  ← Shared admin helper functions
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         ┌────▼────┐    ┌────▼────┐    ┌─────▼─────┐
         │   www   │    │thoughts │    │ All other │
         │         │    │         │    │ subdomains│
         │ Tabbed  │    │ Full    │    │           │
         │ Admin   │    │ Thoughts│    │ Own admin │
         │ Overview│    │ Admin   │    │ per-domain│
         └─────────┘    └─────────┘    └───────────┘
```

### Admin Architecture

**Problem**: Server actions can't be shared across Next.js apps (they need the app's build context). AdminContext currently imports from `@/app/thoughts/actions` (local to www).

**Solution**: Three-layer admin pattern:

1. **`@anipotts/lib/admin/`** — Shared helper functions (NOT server actions, just plain async functions using Supabase client directly). All CRUD logic lives here once.

2. **`@anipotts/ui/admin/`** — Shared admin UI components (client components). Each panel accepts data + callbacks as props. Components: `AdminShell`, `AdminLogin`, `ThoughtsPanel`, `MetricsPanel`, `StatusPanel`, etc.

3. **Each app's local `actions.ts`** — Thin server action wrappers that call `@anipotts/lib/admin/` helpers. ~5 lines each, just `"use server"` + auth check + delegate. Each app also has a local `AdminContext` that uses its own `actions.ts`.

**Auth**: Same keyboard shortcut (Cmd+Shift+A), same password, same cookie mechanism. Cookies are per-domain (expected — you authenticate once per subdomain). AdminProvider moves to `@anipotts/ui` but accepts auth action callbacks via props.

**www tabbed admin**: Imports ALL panel components from `@anipotts/ui/admin/`, renders them in tabs. Each tab shows the full admin for that subdomain (not just a summary), using www's own server actions that delegate to the shared lib.

**Subdomain admin**: Each imports just its own panel from `@anipotts/ui/admin/`, renders it directly (no tabs). Same UI, same functionality.

### Cookie Auth Note
The `admin_session` cookie is set with `sameSite: "strict"` and scoped to the current domain. This means:
- Logging in on `anipotts.com` authenticates you on `anipotts.com` only
- Logging in on `thoughts.anipotts.com` authenticates you on `thoughts.anipotts.com` only
- This is correct security behavior for cross-subdomain apps
- Same password everywhere, just need to auth once per subdomain

---

## Implementation Phases

### Phase 1: Shared Data Layer
**Move static data to `@anipotts/lib` so all apps import from one place.**

#### Files to Create
- `packages/lib/src/data/projects.ts` — Move from `apps/www/src/data/projects.ts`, export `projects` array + `Project` type
- `packages/lib/src/data/social.ts` — Extract social links from www/connect + links subdomain. Single `SOCIAL_LINKS` array
- `packages/lib/src/data/site.ts` — Bio text, metadata strings, handles. Used by all app metadata
- `packages/lib/src/data/services.ts` — Monitored service URLs (anipotts subdomains + quantercise + chained.chat + nyupuritytest + paragoninvestments)
- `packages/lib/src/data/index.ts` — Re-export all data

#### Files to Modify
- `packages/lib/src/index.ts` — Add data exports
- `packages/lib/package.json` — Add `./data` export path
- `apps/www/src/data/projects.ts` — Replace with re-export from `@anipotts/lib/data`
- `apps/www/src/app/connect/page.tsx` — Import social links from shared data
- `apps/links/src/app/page.tsx` — Import social links + projects from shared data
- `apps/status/src/app/page.tsx` — Import services from shared data (prep for Phase 3)

#### Types Consolidation
- `packages/types/src/index.ts` — Already has `Project`, `ServiceStatus`, `LinkInBio`, `Experiment` types. Ensure `packages/lib/data/` uses these types. Remove `Project` type from `apps/www/src/data/projects.ts`.

---

### Phase 2: Shared Admin System
**Deduplicate admin logic and make it work across all 10 apps.**

#### 2A: Shared Admin Helpers (`@anipotts/lib/admin/`)

Create:
- `packages/lib/src/admin/auth.ts` — `verifyPassword(password, envPassword)`, password checking (pure function, no cookies)
- `packages/lib/src/admin/thoughts.ts` — `fetchAllThoughts(supabase)`, `upsertThought(supabase, thought)`, `deleteThought(supabase, id)`, `fetchThoughtStats(supabase)` — All CRUD without auth checks (auth handled by server action wrapper)
- `packages/lib/src/admin/index.ts` — Re-exports

These are **plain async functions** (not server actions). They receive a Supabase client as a parameter so they work anywhere.

#### 2B: Shared Admin UI (`@anipotts/ui/admin/`)

Create:
- `packages/ui/src/admin/AdminShell.tsx` — The modal overlay (extracted from www's `AdminOverlay.tsx`). Props: `isOpen`, `onClose`, `isAuthenticated`, children
- `packages/ui/src/admin/AdminLogin.tsx` — Login form (extracted from `AdminLoginModal.tsx`). Props: `onLogin(password): Promise<{success, error?}>`
- `packages/ui/src/admin/AdminProvider.tsx` — Generic admin context. Props: `checkAuth`, `login`, `logout` (callbacks to app-specific server actions)
- `packages/ui/src/admin/ThoughtsPanel.tsx` — Blog CRUD panel (extracted from `ContentManager` + `AnalyticsMonitor`). Props: `fetchThoughts`, `upsertThought`, `deleteThought`, `fetchStats`
- `packages/ui/src/admin/AdminTabs.tsx` — Tab container for www's multi-panel admin view
- `packages/ui/src/admin/index.ts` — Re-exports

#### 2C: Wire Up Each App

For **www** (`apps/www/`):
- `src/app/admin/actions.ts` — Server actions wrapping `@anipotts/lib/admin/*`. Handles cookie auth + delegates to shared helpers.
- `src/context/AdminContext.tsx` — Refactor to use shared `AdminProvider` from `@anipotts/ui/admin`
- `src/components/admin/AdminOverlay.tsx` — Refactor to use shared `AdminShell` + `AdminLogin` + `AdminTabs`
- Remove: `src/app/thoughts/admin/` directory (admin moves to shared components)
- Remove: duplicated `ContentManager.tsx`, `AnalyticsMonitor.tsx`, `AdminCommandCenter.tsx`

For **thoughts** (`apps/thoughts/`):
- `src/app/actions.ts` — Thin wrapper: auth check → delegate to `@anipotts/lib/admin/thoughts`
- `src/context/AdminContext.tsx` — New file, uses shared `AdminProvider`
- `src/components/admin/AdminOverlay.tsx` — Uses shared `AdminShell` + `AdminLogin` + `ThoughtsPanel`
- `src/app/layout.tsx` — Add `AdminProvider` + `AdminOverlay`

For **all other subdomains** (metrics, status, links, dev, updates, lab, docs, cli):
- Each gets: `src/app/actions.ts` (auth only, no CRUD yet for most), `AdminContext`, `AdminOverlay`
- Each layout.tsx adds `AdminProvider` + `AdminOverlay`
- Phase 3-5 will add real admin panels per-subdomain

#### Blog Deduplication (www ↔ thoughts)

- `apps/www/src/app/thoughts/page.tsx` — Changes to show **preview cards only** (title, summary, date, tags). Each card links to `https://thoughts.anipotts.com/[slug]` instead of local `/thoughts/[slug]`
- `apps/www/src/app/thoughts/[slug]/page.tsx` — **Remove** (or redirect to `thoughts.anipotts.com/[slug]`)
- `apps/thoughts/` — Becomes the canonical home for full blog posts + blog-specific admin
- www admin "Thoughts" tab — Shows same `ThoughtsPanel` but with full CRUD (writes go to same Supabase table, user accesses full content on thoughts subdomain)

---

### Phase 3: Real Metrics Integration
**Replace hardcoded stats with live GitHub API + WakaTime data.**

#### API Clients

Create:
- `packages/lib/src/api/github.ts`:
  - `fetchGitHubStats(token)` → total repos, total commits (via search API), contribution calendar, top languages (aggregated across repos)
  - `fetchRepoLanguages(token)` → language breakdown percentages
  - Uses `GITHUB_TOKEN` env var (already in turbo.json env list)

- `packages/lib/src/api/wakatime.ts`:
  - `fetchWakaTimeStats(apiKey)` → coding hours, language breakdown, daily averages
  - WakaTime free tier: past 14 days. We'll cache in Supabase to build history.
  - Uses `WAKATIME_API_KEY` env var (already in turbo.json env list)

#### Supabase Schema

New table: `metrics_cache`
- `id` (uuid), `metric_key` (text, unique), `data` (jsonb), `fetched_at` (timestamptz)
- Stores cached GitHub/WakaTime responses to avoid rate limits and preserve history

#### Vercel Cron Job

Create: `apps/metrics/src/app/api/cron/refresh/route.ts`
- Runs daily (Vercel cron: `0 6 * * *`)
- Fetches GitHub stats + WakaTime stats
- Upserts into `metrics_cache` table
- `vercel.json` updated with cron schedule

#### Metrics Page Rewrite

Modify: `apps/metrics/src/app/page.tsx`
- Fetch from `metrics_cache` Supabase table (ISR, revalidate every hour)
- Display real data: commits, streak, repos, coding hours, language breakdown
- Show "last updated" timestamp from actual data
- Remove false "from GitHub API & WakaTime" label → replace with real attribution + last-fetched time

#### Metrics Admin Panel

Create: `packages/ui/src/admin/MetricsPanel.tsx`
- Show current cached metrics
- "Force refresh" button (triggers cron endpoint manually)
- Display API rate limit status

---

### Phase 4: Real Status Monitoring
**Replace hardcoded uptime with real HTTP health checks.**

#### Status Checker

Create: `packages/lib/src/api/status.ts`
- `checkService(url)` → `{ status: number, latency: number, ok: boolean }`
- Simple `fetch()` with timeout, measures response time

#### Supabase Schema

New table: `status_checks`
- `id` (uuid), `service_name` (text), `url` (text), `status_code` (int), `latency_ms` (int), `ok` (boolean), `checked_at` (timestamptz)
- Index on `(service_name, checked_at)` for efficient uptime calculation

New table: `monitored_services`
- `id` (uuid), `name` (text), `url` (text), `enabled` (boolean), `category` (text: "anipotts" | "project"), `order` (int)
- Seeded from `@anipotts/lib/data/services.ts` but editable via admin

#### Vercel Cron Job

Create: `apps/status/src/app/api/cron/check/route.ts`
- Runs every 5 minutes (`*/5 * * * *`)
- Fetches all enabled services from `monitored_services` table
- Pings each, stores result in `status_checks`
- `vercel.json` updated with cron schedule

#### Status Page Rewrite

Modify: `apps/status/src/app/page.tsx`
- Fetch latest status + uptime percentage (last 30 days) from Supabase
- Real latency numbers, real uptime percentages
- Last checked timestamp from actual data
- Remove "Powered by BetterStack" → replace with "Self-hosted monitoring"
- Remove non-existent services (fourtwenty.nyc, saeshify.com)
- Add all 9 anipotts subdomains + 4 external projects

#### Status Admin Panel

Create: `packages/ui/src/admin/StatusPanel.tsx`
- View all monitored services + current status
- Add/remove/enable/disable services
- View uptime history graph (last 30 days)
- "Check now" button for manual ping

---

### Phase 5: Dynamic Dev + Auto-Generated Updates

#### Dev Page (GitHub-Powered)

Create: `packages/lib/src/api/dev-stack.ts`
- `fetchDevStack(token)` → Aggregates repo languages, recent activity, tools used
- Can detect languages from top repos via GitHub API
- Hardware/tools remain as shared constants (can't auto-detect those)

Create: `apps/dev/src/app/api/cron/refresh/route.ts`
- Runs daily, caches dev stack data in Supabase `metrics_cache` table (reuse same table, different `metric_key`)

Modify: `apps/dev/src/app/page.tsx`
- Languages section: Pull from GitHub API (real percentages across all repos)
- Tools section: Keep as shared constant in `@anipotts/lib/data/dev-stack.ts` (tools, hardware, terminal config)
- Recent activity: Show recent commits/contributions from GitHub

#### Dev Admin Panel

Create: `packages/ui/src/admin/DevPanel.tsx`
- View current stack data
- Toggle which sections to display
- "Force refresh" from GitHub

#### Updates Changelog (Git-Powered)

Create: `packages/lib/src/api/changelog.ts`
- Parse git log at build time: `git log --oneline --format='%H|%s|%an|%aI' --since='6 months ago'`
- Group by date, extract conventional commit prefixes (feat, fix, chore, etc.)
- Generate structured changelog entries

Create: `apps/updates/src/app/api/cron/generate/route.ts`
- Runs daily, fetches recent commits via GitHub API (monorepo + optionally other repos)
- Stores parsed changelog in Supabase `changelog_entries` table

New Supabase table: `changelog_entries`
- `id` (uuid), `commit_hash` (text, unique), `message` (text), `type` (text: feat/fix/chore), `date` (timestamptz), `author` (text), `repo` (text)

Modify: `apps/updates/src/app/page.tsx`
- Fetch from `changelog_entries` table
- Group by month/version
- Show real commit history with type badges
- Filter by type (feature, fix, improvement)

#### Updates Admin Panel

Create: `packages/ui/src/admin/UpdatesPanel.tsx`
- View changelog entries
- Pin/highlight important entries
- Manual entry creation for major releases

---

### Phase 6: Links, Lab, Docs, CLI Cleanup

#### Links (Linktree Replacement)

Modify: `apps/links/src/app/page.tsx`
- Import `SOCIAL_LINKS` from `@anipotts/lib/data`
- Import `projects` from `@anipotts/lib/data` (show all live projects, not just 2)
- Clean, mobile-first layout optimized for social bio link
- PostHog tracking on every click

Create: `packages/ui/src/admin/LinksPanel.tsx`
- View all links with click analytics (from PostHog)
- Toggle link visibility
- Reorder links

#### Lab (Clean Up Broken Routes)

Modify: `apps/lab/src/app/page.tsx`
- Remove links to non-existent routes (`/waves`, `/terminal`, `/multiplayer`)
- Mark experiments with status badges: "concept" (no link), "live" (external link), "archived"
- Import experiment data from shared constant or keep local (low-traffic page)

Create: `packages/ui/src/admin/LabPanel.tsx`
- View experiments list
- Toggle status (active/archived/concept)

#### Docs (Clean Up Broken Links)

Modify: `apps/docs/src/app/page.tsx`
- Remove links to non-existent subpages (`/quantercise`, `/chained`, `/design`)
- Show doc entries with "coming soon" badges where content doesn't exist yet
- Add actual README/API doc links where available (GitHub repo READMEs)

Create: `packages/ui/src/admin/DocsPanel.tsx`
- Manage documentation entries
- Toggle published/draft status

#### CLI (Keep Aspirational)

Modify: `apps/cli/src/app/page.tsx`
- Keep coming-soon state, clean up any stale content
- Add link to GitHub repo when ready

Create: `packages/ui/src/admin/CliPanel.tsx`
- Minimal: show install command, version, status

---

### Phase 7: www Integration

#### Tabbed Admin on www

The www admin overlay transforms from thoughts-only to ecosystem-wide:

Modify: `apps/www/src/components/admin/AdminOverlay.tsx`
- Uses shared `AdminShell` + `AdminLogin`
- When authenticated: Shows `AdminTabs` with tabs for each subdomain
- Tab list: Thoughts, Metrics, Status, Dev, Updates, Links, Lab, Docs, CLI
- Each tab renders the corresponding shared panel from `@anipotts/ui/admin/`
- All server actions defined locally in `apps/www/src/app/admin/actions.ts`

#### www Thoughts Preview

Modify: `apps/www/src/app/thoughts/page.tsx`
- Show preview cards (title, summary, date, tags, view count)
- "Read more →" links to `https://thoughts.anipotts.com/[slug]`
- Remove full post body rendering

Remove: `apps/www/src/app/thoughts/[slug]/page.tsx`
- Full post viewing moves exclusively to thoughts.anipotts.com
- Add a redirect from this route to `thoughts.anipotts.com/[slug]` for any bookmarked URLs

Modify: `apps/www/src/app/page.tsx` (homepage)
- "Latest Thoughts" section links to thoughts.anipotts.com/[slug] instead of local routes

Modify: `apps/www/src/app/connect/page.tsx`
- Import social links from `@anipotts/lib/data/social`

Modify: `apps/www/src/app/work/page.tsx`
- Import projects from `@anipotts/lib/data/projects`

---

## New Environment Variables Required

All already listed in `turbo.json` `globalEnv`:
- `GITHUB_TOKEN` — GitHub personal access token (read-only scope: `public_repo`)
- `WAKATIME_API_KEY` — WakaTime API key
- `ADMIN_PASSWORD` — Already exists, used by all apps

No new paid services. No new env vars to add to turbo.json (they're already declared).

---

## Supabase Schema Summary

### New Tables

```sql
-- Cached API responses (metrics, dev stack)
CREATE TABLE metrics_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  fetched_at timestamptz DEFAULT now()
);

-- Status check history
CREATE TABLE status_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name text NOT NULL,
  url text NOT NULL,
  status_code int,
  latency_ms int,
  ok boolean NOT NULL,
  checked_at timestamptz DEFAULT now()
);
CREATE INDEX idx_status_checks_service_time ON status_checks (service_name, checked_at DESC);

-- Monitored services configuration
CREATE TABLE monitored_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  url text NOT NULL,
  enabled boolean DEFAULT true,
  category text DEFAULT 'anipotts',
  display_order int DEFAULT 0
);

-- Auto-generated changelog
CREATE TABLE changelog_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  commit_hash text UNIQUE,
  message text NOT NULL,
  type text DEFAULT 'chore',
  date timestamptz NOT NULL,
  author text,
  repo text DEFAULT 'anipotts.com',
  pinned boolean DEFAULT false
);
CREATE INDEX idx_changelog_date ON changelog_entries (date DESC);
```

### Existing Tables (no changes)
- `thoughts` — Blog posts (already correct)
- `favorite_numbers` — Easter egg (no change)

---

## Vercel Cron Schedule

| App | Route | Schedule | Purpose |
|-----|-------|----------|---------|
| metrics | `/api/cron/refresh` | `0 6 * * *` (daily 6am) | GitHub + WakaTime stats |
| status | `/api/cron/check` | `*/5 * * * *` (every 5 min) | HTTP health checks |
| updates | `/api/cron/generate` | `0 7 * * *` (daily 7am) | Parse git commits |
| dev | `/api/cron/refresh` | `0 6 * * *` (daily 6am) | GitHub language stats |

---

## File Change Summary

### New Files (~30)

**`packages/lib/src/data/`** (4 files):
- `projects.ts`, `social.ts`, `site.ts`, `services.ts`

**`packages/lib/src/api/`** (5 files):
- `github.ts`, `wakatime.ts`, `status.ts`, `changelog.ts`, `dev-stack.ts`

**`packages/lib/src/admin/`** (3 files):
- `auth.ts`, `thoughts.ts`, `index.ts`

**`packages/ui/src/admin/`** (12 files):
- `AdminShell.tsx`, `AdminLogin.tsx`, `AdminProvider.tsx`, `AdminTabs.tsx`
- `ThoughtsPanel.tsx`, `MetricsPanel.tsx`, `StatusPanel.tsx`, `LinksPanel.tsx`
- `DevPanel.tsx`, `UpdatesPanel.tsx`, `LabPanel.tsx`, `DocsPanel.tsx`, `CliPanel.tsx`
- `index.ts`

**Per-app admin wiring** (9 apps × 2-3 files each):
- `actions.ts` (server actions), `AdminContext.tsx` or layout changes, `AdminOverlay.tsx` wrapper

**Cron routes** (4 files):
- `apps/metrics/src/app/api/cron/refresh/route.ts`
- `apps/status/src/app/api/cron/check/route.ts`
- `apps/updates/src/app/api/cron/generate/route.ts`
- `apps/dev/src/app/api/cron/refresh/route.ts`

### Modified Files (~20)

- `packages/lib/src/index.ts` + `package.json` (new exports)
- `packages/ui/src/index.ts` + `package.json` (new admin exports)
- `apps/www/src/app/thoughts/page.tsx` (preview-only)
- `apps/www/src/app/thoughts/[slug]/page.tsx` (redirect to subdomain)
- `apps/www/src/app/page.tsx` (links to thoughts subdomain)
- `apps/www/src/app/connect/page.tsx` (shared social links)
- `apps/www/src/app/work/page.tsx` (shared projects)
- `apps/www/src/components/admin/AdminOverlay.tsx` (tabbed admin)
- `apps/www/src/context/AdminContext.tsx` (use shared provider)
- `apps/metrics/src/app/page.tsx` (real data)
- `apps/status/src/app/page.tsx` (real data)
- `apps/dev/src/app/page.tsx` (real data)
- `apps/updates/src/app/page.tsx` (real data)
- `apps/links/src/app/page.tsx` (shared data)
- `apps/lab/src/app/page.tsx` (clean up broken links)
- `apps/docs/src/app/page.tsx` (clean up broken links)
- 9× `apps/*/src/app/layout.tsx` (add AdminProvider + AdminOverlay)
- 4× `apps/*/vercel.json` (add cron config)

### Deleted Files
- `apps/www/src/app/thoughts/admin/AdminCommandCenter.tsx`
- `apps/www/src/app/thoughts/admin/ContentManager.tsx`
- `apps/www/src/app/thoughts/admin/AnalyticsMonitor.tsx`
- `apps/www/src/app/thoughts/[slug]/page.tsx` (replaced with redirect)

---

## Implementation Order

Execute phases sequentially (each builds on the previous):

1. **Phase 1** — Shared data layer (projects, social, site, services)
2. **Phase 2** — Shared admin system (lib helpers, UI components, wire up all apps)
3. **Phase 3** — Real metrics (GitHub + WakaTime APIs, cron, page rewrite)
4. **Phase 4** — Real status (HTTP checker, cron, page rewrite)
5. **Phase 5** — Dynamic dev + auto-generated updates
6. **Phase 6** — Links, lab, docs, CLI cleanup
7. **Phase 7** — www integration (tabbed admin, thoughts preview, shared imports)

Within each phase: shared lib/ui first → then per-app wiring → then page rewrites.

---

## Verification

After each phase, verify:

1. **Phase 1**: `pnpm turbo build` succeeds. All apps that import shared data compile. Projects show same data everywhere.
2. **Phase 2**: Cmd+Shift+A opens admin on every subdomain. Login works. Thoughts CRUD works from both www and thoughts.anipotts.com admin.
3. **Phase 3**: `curl https://metrics.anipotts.com` shows real GitHub stats. Cron endpoint works: `curl -X POST https://metrics.anipotts.com/api/cron/refresh`.
4. **Phase 4**: `curl https://status.anipotts.com` shows real uptime. Cron pings: check `status_checks` table has entries.
5. **Phase 5**: dev.anipotts.com shows real language percentages. updates.anipotts.com shows recent commits.
6. **Phase 6**: links.anipotts.com shows all social links + projects. No broken links on lab/docs.
7. **Phase 7**: anipotts.com/thoughts shows previews linking to thoughts.anipotts.com. www admin has tabs for all 9 subdomains. www uses shared social links + projects.

### Full End-to-End Check
- Visit each of the 10 domains and verify content loads
- Cmd+Shift+A on each domain → login → verify admin panel renders
- Change a blog post title via thoughts.anipotts.com admin → verify it updates on anipotts.com homepage "Latest Thoughts"
- Check Supabase tables: `metrics_cache`, `status_checks`, `monitored_services`, `changelog_entries` all populated
- Verify no hardcoded data remains on metrics, status, dev, or updates pages
