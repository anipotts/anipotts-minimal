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
apps/www/              Public site (anipotts.com) -> CF Worker
apps/admin/            Admin dashboard (admin.anipotts.com) -> CF Worker, CF Access protected
workers/ingest/        YAML sync + hourly rollups -> CF Worker (API key auth)
workers/weekly-email/  Sunday 9am newsletter -> CF Worker (cron trigger)
packages/lib/          Shared D1 client (Drizzle ORM), env helper, query modules:
                         money/ (Mercury), code/ (GitHub, CF, npm), ops/, mini/ (REST + SSE),
                         analytics/, cms/, admin/, validation/, status/
packages/types/        TypeScript interfaces
packages/ui/           Shared React components (Stagger, FadeIn, ExpandableNav)
content/thoughts/      Blog posts (auto-synced from ~/Content/pillars/)
scripts/claude/        Stats generation from ~/.claude session logs
scripts/sync-yaml-to-d1.sh  Manual YAML sync from ~/Business/data/ to D1
```

Admin sidebar: 5 spokes (Dashboard, Money, Content, Code, Ops). Live data via Mini API SSE at api.mini.anipotts.com.

Content flow: `~/Content/pillars/*.md` auto-syncs to `content/thoughts/` via git post-commit hook. Pillars with `status: ready` and a non-empty summary get copied with `published: true`.

## Cloudflare D1

Database: `anipotts-db` (SQLite at edge via CF Workers)
Tables: `thoughts`, `atoms`, `page_content`, `projects`, `social_links`, `site_settings`, `rate_limits`, `business_data`, `daily_rollups`, `email_queue`, `analytics_events`
FTS5 virtual tables for full-text search on thoughts and projects.

Static fallback data lives in `packages/lib/src/data/`. CMS pages use `revalidate = 0`, file-based pages use `revalidate = 3600`.

## Environment Variables

Required in `.env.local` (for local dev):

```
ADMIN_PASSWORD, TYPEFULLY_API_KEY, BUTTONDOWN_API_KEY
```

Wrangler secrets on admin Worker (accessed via `getEnv()` from `@anipotts/lib/env`):
`ADMIN_PASSWORD`, `MERCURY_API_TOKEN`, `MERCURY_ACCOUNT_ID_CHECKING`, `MERCURY_ACCOUNT_ID_SAVINGS`, `GITHUB_TOKEN`, `CF_API_TOKEN`, `MINI_API_KEY`, `BUTTONDOWN_API_KEY`, `TYPEFULLY_API_KEY`

`NEXT_PUBLIC_MINI_API_KEY` is baked at build time (set in CI/CD, not Wrangler secrets).
`CF_ACCOUNT_ID` is set as `[vars]` in admin wrangler.toml (not a secret).

## Key Patterns

- `Stagger` for section animations (auto-staggers children with fadeInUp). Gap classes go ON the Stagger className, not on a wrapper.
- `PageFrame` for page layout (gap-12 md:gap-16 pb-20). Never add max-w to PageFrame (terminal window handles width).
- `PageScaffold` primitives: BackLink, MetaLine, TagList, StatusBadge, SectionBlock, SectionLabel
- PostHog proxied through Next.js rewrites to `/ingest/*`
- Admin: cookie auth via ADMIN_PASSWORD env var, CF Access on admin.anipotts.com
- `getEnv(key)` from `@anipotts/lib/env` for all Wrangler secrets (NOT `process.env`)
- Email sending uses CF Email Routing `[[send_email]]` bindings (no Resend). Helper: `sendViaBinding` from `@anipotts/lib/email`. Destinations (`contact@anipotts.com`, `hello@anipotts.com`) must be verified in CF dashboard. From-address is `noreply@anipotts.com` on the verified domain.
- Routing: 5 pages in `(main)/` route group, redirects in `proxy.ts`
- Health endpoints: `/api/health` on www and admin, `/health` on ingest and mini-api

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
