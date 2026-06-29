# anipotts.com

Monorepo for anipotts.com and its admin surface.

## Stack

- Public site: Astro 5 (`apps/www`) on `@astrojs/cloudflare`, served via Cloudflare Workers.
- Admin: Astro 5 (`apps/admin`) on `@astrojs/cloudflare`, served via Cloudflare Workers.
- Legacy admin rollback: `apps/admin-solid` until passkey proof is complete.
- Cloudflare Workers under `workers/*`, shared `packages/*`.
- Git-first public content: canonical markdown collections under `apps/www/src/content`, synced to Cloudflare D1.

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
```

## Content model

- Astro www collections: `apps/www/src/content/{projects,making,writing}` (schema in `apps/www/src/content.config.ts`).
- Do not add a root `content/` mirror in this repo. Content commands and drafts belong in `~/Content`; this repo owns the published renderer/admin shape.
- Synced to Cloudflare D1 (`anipotts-db`) for full-text search.
- Public brand logos live in `apps/www/public/images/brand` and should match `logoSrc` references in `apps/www/src/data/site.ts`.

## Route map (astro www)

- `/`, `/writing`, `/writing/[slug]`
- `/making`
- `/projects`, `/projects/[slug]`
- `/orchestrating` (formerly `/claude`)
- legacy paths (`/shipping`, `/running`, `/connect`, `/links`, `/claude`, `/thoughts`, `/work`, `/lab`, `/labs`, `/dev`, `/updates`, `/metrics`, `/status`, `/docs`) redirect via `apps/www/src/middleware.ts`

## Claude stats

The `/orchestrating` page reads a generated snapshot at `apps/www/src/data/claude-stats.json`.
This is a local snapshot generator only. It does not call Claude or Anthropic APIs, and this repo no longer carries launchd or auto-commit wrappers for it.

```bash
pnpm update-claude-stats # regenerate local snapshot
```

## Environment

The astro www bakes `PUBLIC_*` vars at build (`PUBLIC_POSTHOG_KEY`). Only set env for features you use.

## Archives

Site version history and old platform notes live under [`docs/archive`](docs/archive).
Pre-Astro recovery refs are indexed in [`docs/archive/version-history.md`](docs/archive/version-history.md).
