# archives

version history for anipotts.com. old code is not copied into this repo (that would bloat
it and duplicate what git already holds). each past version is preserved as a git tag, plus
a filesystem snapshot where one exists. this file is the index.

## how to look at an old version

```bash
git show v1-nextjs-monorepo:apps/www/package.json    # peek one file
git worktree add ../anipotts-v1 v1-nextjs-monorepo   # full browsable checkout
```

## versions

### v2 — astro (current, live)

- public site: astro 5 (`apps/www`) on `@astrojs/cloudflare`, output static.
- admin: solidstart (`apps/admin-solid`) in progress. the legacy next admin (`apps/admin`)
  still serves admin.anipotts.com until the solid admin replaces it.
- content is markdown-in-repo (`apps/www/src/content`) synced to d1. email via resend.
- landed on `main`: PR #50 (merge `773f18d`) plus the production cutover commit
  `85a07b5` ("ship astro production cutover", the live homepage + apex bind), both
  2026-06-15. that cutover commit was stranded unpushed in a local worktree; it is also
  preserved on branch `safety/astro-production-cutover-2026-06-15`.
- live: https://anipotts.com. `apps/www/wrangler.toml` now binds the apex + staging
  custom domains (worker `anipotts-www-astro`). the Deploy github workflow is currently
  disabled; re-enable it to arm CI deploys.

### v1 — next.js 16 turborepo (dec 2025 to jun 2026)

- public site was next 16 (`apps/www` via opennextjs-cloudflare), plus a next admin,
  supabase, drizzle, and the full `packages/*` + `workers/*` monorepo.
- tag: `v1-nextjs-monorepo` -> commit `2d6fecb` (the last pure-next.js commit, deps bump #48).
- filesystem snapshot, which includes node_modules, `.git`, and live `.env` secrets so it
  must never be committed or copied into the repo:
  `~/Archive/projects/anipotts-com-snapshot-2026-05-26/`.
- superseded by v2 on 2026-06-15.
