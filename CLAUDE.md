# CLAUDE.md

This file tells Claude Code how to work in this repository. **Read this first.**

> **Content operations live in `~/Content/`.** This repo is the website renderer and admin UI.
> All content commands (/atomize, /status, /draft, etc.) run from ~/Content, not here.

---

## How to Work With Ani

Ani is building @anipottsbuilds. She's a software engineer at Structured AI (YC F25) and a math major at NYU graduating May 2026.

**This repo is the website.** When Ani talks about content here, point her to `~/Content/` where the commands live. When she talks about the website, admin UI, or Supabase schema, that's this repo.

---

## Quick Dev Commands

```bash
pnpm dev                                    # Start all apps
pnpm turbo dev --filter=@anipotts/www      # Just www app
pnpm build                                  # Production build
pnpm lint                                   # ESLint
```

---

## Architecture

### Monorepo Structure

```
apps/
  www/          # Main site + /admin
packages/
  lib/          # Shared utilities, Supabase helpers, CMS fetchers
  types/        # TypeScript interfaces (SeriesType, Thought, Atom, etc.)
  ui/           # Shared React components
content/
  thoughts/     # Blog posts (auto-synced from ~/Content/pillars/)
scripts/
  supabase-cli.ts    # Supabase CLI (called by ~/Content/tools/supa)
```

### How Content Flows In

```
~/Content/pillars/*.md  →  auto-sync  →  content/thoughts/*.md  →  website renders
~/Content/tools/supa    →  calls      →  scripts/supabase-cli.ts →  Supabase tables
```

Blog posts are auto-synced from `~/Content/pillars/` via a git post-commit hook. Pillars with `status: ready` or `status: published` (and a non-empty summary) get copied to `content/thoughts/` with `published: true`.

### Content Config

Config now lives in the Supabase `content_config` table. Edit YAMLs in `~/Content/config/`, then run `~/Content/tools/sync-config.sh` to push to Supabase.

---

## Supabase

### Key Tables

- **`thoughts`** — All content (ideas, drafts, published posts)
- **`atoms`** — Platform-specific posts generated from content
- **`page_content`** — CMS page content blocks
- **`projects`** — Portfolio projects
- **`social_links`** — Social media links
- **`site_settings`** — Site configuration

### CLI Access

```bash
npx ts-node scripts/supabase-cli.ts stats
npx ts-node scripts/supabase-cli.ts list-content --status draft
npx ts-node scripts/supabase-cli.ts create-content "Title" --series agent-tip --type video
```

### Signature Series (canonical names)

| Series | Format | Frequency | Artifact Required |
|--------|--------|-----------|-------------------|
| **Agent Tip** (`agent-tip`) | Short video (30-60s) | 3x/week | Gist |
| **Build Log** (`build-log`) | Long-form article + video | 1x/week | Repo |
| **Stack Drop** (`stack-drop`) | Text-first tweet/thread | 1-2x/week | Optional |
| **Founder's Log** (`founders-log`) | Text or short video | 1x/week | Optional |
| **Viral Reel** (`viral-reel`) | Short video (<30s) | 2x/week | Gist |

### Series → Platform Atomization

| Series | Primary | Secondary |
|--------|---------|-----------|
| agent-tip | tiktok, instagram, twitter | threads, bluesky, linkedin, youtube |
| build-log | medium, devto, youtube, twitter, linkedin, substack | reddit, tiktok, instagram |
| stack-drop | twitter, threads, bluesky | linkedin |
| founders-log | twitter, linkedin | bluesky, threads, substack |
| viral-reel | tiktok, instagram | youtube, twitter |

---

## Admin UI

Located at `anipotts.com/admin`. Requires cookie auth via `ADMIN_PASSWORD` env var.

Tabs: Pipeline, Content, Atoms, Schedule, Config, Analytics, Site (CMS).

---

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
ADMIN_PASSWORD=<password>
TYPEFULLY_API_KEY=<key>
```

Optional:
```
SUPABASE_SERVICE_ROLE_KEY=<key>
```

---

## Key Technical Patterns

- Pages use `export const revalidate = 0` for fresh Supabase data
- Terminal UI managed by `WindowContext` (states: open, collapsed, minimized, fullscreen)
- `FadeIn` component for staggered animations
- PostHog proxied through Next.js rewrites to `/ingest/*`
- Admin requires cookie auth set via ADMIN_PASSWORD env var
- CMS with Supabase + static fallback (`packages/lib/src/data/`)
- Routing: 5 pages in `(main)/` route group, redirects in `proxy.ts`

---

## Anti-Corny Guardrails (NON-NEGOTIABLE)

Every piece of content must pass:
1. **No fake vulnerability** — Don't perform honesty. Just be honest.
2. **No engagement farming** — No "comment X if you agree."
3. **No guru energy** — Share what you found, don't preach.
4. **No hype without receipts** — Every claim needs a proof artifact.
5. **No recycled platitudes** — If it could go on a poster, delete it.
6. **No em dashes** — Never use `—`, `–`, or ` -- `. Use periods, commas, or restructure.
7. **No triplet lists** — Never list exactly 3 items in sequence. Use 2, 4+, or inline prose.

---

## Important Rules

- **NOTHING goes live without Ani's approval** — Always show summary before posting
- **Anti-corny guardrails are non-negotiable** — Run the checklist on every atom
- **If unsure about tone, err casual** — Authentic > perfect
- **80%+ of posts need proof artifacts** — Gists, repos, screenshots, demos
- **Content commands live in ~/Content/** — Don't recreate them here
