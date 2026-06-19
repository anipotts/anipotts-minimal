# CLAUDE.md

> **Content operations live in `~/Content/`.** This repo is the website renderer and admin UI.
> Content commands (/atomize, /status, /draft) run from ~/Content, not here.

## Commands

```bash
pnpm dev                                    # Start all apps
pnpm turbo dev --filter=@anipotts/www      # Just www app
pnpm build                                  # Production build
pnpm lint                                   # ESLint
pnpm typecheck                              # TypeScript check
pnpm validate                               # Build + lint + typecheck + test
pnpm update-claude-stats                    # Regenerate /claude stats from session logs
```

## Architecture

```
apps/www/              Public site (anipotts.com) -> Astro 5 static (@astrojs/cloudflare), Cloudflare Workers
apps/admin/            Legacy admin (admin.anipotts.com) -> Next.js on CF Worker, CF Access. Being replaced by apps/admin-solid.
apps/admin-solid/      New admin -> SolidStart (in progress, phase 2)
apps/labs/             labs.anipotts.com -> Next.js on CF Worker
workers/ingest/        YAML sync + hourly rollups -> CF Worker (API key auth)
workers/state/         Personal-cloud state + CodeStats DO -> CF Worker (api.anipotts.com)
workers/weekly-email/  Sunday 9am newsletter -> CF Worker (cron trigger)
packages/lib/          Shared D1 client (Drizzle ORM), env helper, query modules:
                         money/ (Mercury), code/ (GitHub, CF, npm), ops/, mini/ (REST + SSE),
                         analytics/, cms/, admin/, validation/, status/
packages/styles/       Design tokens + global css (used by the astro www)
packages/config/       Shared config. packages/types/ TS interfaces. packages/services-platform/ platform svc clients.
scripts/claude/        Stats generation from ~/.claude session logs
scripts/sync-yaml-to-d1.sh  Manual YAML sync from ~/Business/data/ to D1
```

Admin sidebar: 5 spokes (Dashboard, Money, Content, Code, Ops). Live data via Mini API SSE at api.mini.anipotts.com.

Content: the astro www renders canonical markdown collections under `apps/www/src/content` (projects, making, writing), schema in `apps/www/src/content.config.ts`. Do not recreate the old root `content/` mirror in this renderer repo. Content operations still live in `~/Content`; this repo owns the published site shape and admin UI.

## Cloudflare D1

Database: `anipotts-db` (SQLite at edge via CF Workers)
Tables: `thoughts`, `atoms`, `page_content`, `projects`, `social_links`, `site_settings`, `rate_limits`, `business_data`, `daily_rollups`, `email_queue`, `analytics_events`
FTS5 virtual tables for full-text search on thoughts and projects.

Static fallback data lives in `packages/lib/src/data/`. (The old `revalidate` guidance was Next.js-only; the astro www is statically built so it no longer applies.)

## Environment Variables

Required in `.env.local` (for local dev):

```
ADMIN_PASSWORD, TYPEFULLY_API_KEY, BUTTONDOWN_API_KEY
```

Wrangler secrets on admin Worker (accessed via `getEnv()` from `@anipotts/lib/env`):
`ADMIN_PASSWORD`, `MERCURY_API_TOKEN`, `MERCURY_ACCOUNT_ID_CHECKING`, `MERCURY_ACCOUNT_ID_SAVINGS`, `GITHUB_TOKEN`, `CF_API_TOKEN`, `MINI_API_KEY`, `BUTTONDOWN_API_KEY`, `TYPEFULLY_API_KEY`, `RESEND_API_KEY`

`NEXT_PUBLIC_MINI_API_KEY` is baked at build time (set in CI/CD, not Wrangler secrets).
`CF_ACCOUNT_ID` is set as `[vars]` in admin wrangler.toml (not a secret).

## Key Patterns

- www is Astro: routes are files under `apps/www/src/pages` (`/`, `/writing`, `/making`, `/projects`, `/orchestrating`). Content is markdown collections under `apps/www/src/content` (schema in `src/content.config.ts`).
- Legacy route redirects are handled in `apps/www/src/middleware.ts`: `/shipping`, `/running`, and `/work` -> `/making`; `/connect`, `/links`, `/claude`, `/lab`, `/labs`, `/dev`, and `/updates` -> `/orchestrating`; `/metrics` -> `/orchestrating#status`; `/status` -> `/orchestrating#systems`; `/thoughts` -> `/writing`; `/docs` -> `/`.
- PostHog is proxied via the astro endpoint `apps/www/src/pages/ingest/[...path].ts` (not Next.js rewrites).
- Admin (legacy next): cookie auth via ADMIN_PASSWORD env var, CF Access on admin.anipotts.com.
- `getEnv(key)` from `@anipotts/lib/env` for all Wrangler secrets (NOT `process.env`).
- Health endpoints: `/api/health` on www and admin, `/health` on ingest and mini-api.

## Agent PR Flow

- Work on `codex/*`, `claude/*`, or `worktree-*` branches.
- Open same-repo PRs. The agent auto-merge workflow waits for required checks and dispatches Deploy with touched targets after the merge commit lands.
- Required PR gates are `Build, lint, typecheck, test` and `security`.
- CI uses Turbo affected validation, so agents should keep changes scoped and let the package graph decide what to test.
- Security review is expensive only for infra, admin, worker, package, dependency, and API/middleware changes. Static public-site copy/layout changes get the required `security` check without a Claude review run.
- Main pushes auto-deploy through the path-filtered Deploy workflow. Agent merges also dispatch Deploy directly because `GITHUB_TOKEN` merges do not reliably create follow-on push workflow runs. Deploy jobs build and ship only targets touched by the merge instead of rebuilding the whole monorepo first.

## Anti-Corny Guardrails (NON-NEGOTIABLE)

1. **No fake vulnerability.** Don't perform honesty. Just be honest.
2. **No engagement farming.** No "comment X if you agree."
3. **No guru energy.** Share what you found, don't preach.
4. **No hype without receipts.** Every claim needs a proof artifact.
5. **No recycled platitudes.** If it could go on a poster, delete it.
6. **No em dashes.** Never use `—`, `–`, or `--`. Use periods, commas, or restructure.
7. **No triplet lists.** Never list exactly 3 items in sequence. Use 2, 4+, or inline prose.

## Rules

- **NOTHING goes live without Ani's approval.** Always show summary before posting.
- **Anti-corny guardrails are non-negotiable.** Run the checklist on every atom.
- **If unsure about tone, err casual.** Authentic > perfect.
- **80%+ of posts need proof artifacts.** Gists, repos, screenshots, demos.
- **Content commands live in ~/Content/.** Don't recreate them here.
- **Never use `git add .` or `git add -A`.** Always add specific files.
- **Never commit personal files.** No \*\_REPORT.md, DESIGN_SPEC.md, .claude/ state, debug scripts.
