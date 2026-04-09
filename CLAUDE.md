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
apps/www/           Next.js site + /admin
packages/lib/       D1 database, CMS fetchers, data
packages/types/     TypeScript interfaces
packages/ui/        Shared React components (Stagger, FadeIn, ExpandableNav)
content/thoughts/   Blog posts (auto-synced from ~/Content/pillars/)
scripts/claude/     Stats generation from ~/.claude session logs
```

Content flow: `~/Content/pillars/*.md` auto-syncs to `content/thoughts/` via git post-commit hook. Pillars with `status: ready` and a non-empty summary get copied with `published: true`.

## Cloudflare D1

Database: `anipotts-db` (SQLite at edge via CF Workers)
Tables: `thoughts`, `atoms`, `page_content`, `projects`, `social_links`, `site_settings`, `rate_limits`
FTS5 virtual tables for full-text search on thoughts and projects.

Static fallback data lives in `packages/lib/src/data/`. CMS pages use `revalidate = 0`, file-based pages use `revalidate = 3600`.

## Environment Variables

Required in `.env.local`:

```
ADMIN_PASSWORD, TYPEFULLY_API_KEY
BUTTONDOWN_API_KEY
```

## Key Patterns

- `Stagger` for section animations (auto-staggers children with fadeInUp). Gap classes go ON the Stagger className, not on a wrapper.
- `PageFrame` for page layout (gap-12 md:gap-16 pb-20). Never add max-w to PageFrame (terminal window handles width).
- `PageScaffold` primitives: BackLink, MetaLine, TagList, StatusBadge, SectionBlock, SectionLabel
- PostHog proxied through Next.js rewrites to `/ingest/*`
- Admin: cookie auth via ADMIN_PASSWORD env var
- Routing: 5 pages in `(main)/` route group, redirects in `proxy.ts`

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
