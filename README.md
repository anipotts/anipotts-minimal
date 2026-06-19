# anipotts.com

Monorepo for anipotts.com and its admin + labs surfaces.

## Stack

- Public site: Astro 5 (`apps/www`) on `@astrojs/cloudflare`, static output, served via Cloudflare Workers.
- Legacy admin (`apps/admin`, Next.js) being replaced by `apps/admin-solid` (SolidStart).
- `apps/labs` (Next.js), Cloudflare Workers under `workers/*`, shared `packages/*`.
- Git-first content: markdown collections under `apps/www/src/content`, synced to Cloudflare D1.

## Quick start

```bash
pnpm install
pnpm dev          # all apps
pnpm dev:www      # just the astro site (astro defaults to http://localhost:4321)
```

## Key commands

```bash
pnpm build
pnpm test
pnpm validate     # build + lint + typecheck + test
pnpm github:audit
```

## Content model

- Astro www collections: `apps/www/src/content/{projects,making,writing}` (schema in `apps/www/src/content.config.ts`).
- Synced to Cloudflare D1 (`anipotts-db`) for full-text search.
- Public brand logos live in `apps/www/public/images/brand` and should match `logoSrc` references in `apps/www/src/data/site.ts`.

## Route map (astro www)

- `/`, `/writing`, `/writing/[slug]`
- `/making`
- `/projects`, `/projects/[slug]`
- `/orchestrating` (formerly `/claude`), `/connect`
- legacy paths (`/shipping`, `/running`, `/claude`, `/thoughts`, `/work`, `/lab`, `/labs`, `/dev`) redirect via `apps/www/src/middleware.ts`

## Claude stats

The `/orchestrating` page reads a generated snapshot at `apps/www/src/data/claude-stats.json`.

```bash
pnpm update-claude-stats          # regenerate
pnpm update-claude-stats:commit   # regenerate + commit
```

## Environment

The astro www bakes `PUBLIC_*` vars at build (`PUBLIC_POSTHOG_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`). Only set env for features you use.

## Archives

Site version history and how to reach the pre-astro code: see [`archives/README.md`](archives/README.md).
