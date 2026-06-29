# site version history

Old code is not copied into this repo because that would duplicate what git
already holds. Past versions are preserved as git refs, plus a filesystem
snapshot where one exists.

## how to look at an old version

```bash
git show v1-nextjs-monorepo:apps/www/package.json
git worktree add ../anipotts-v1 v1-nextjs-monorepo
```

## versions

### v2: astro, current live line

- public site: Astro 5 in `apps/www` on `@astrojs/cloudflare`.
- admin: Astro 5 in `apps/admin` on `@astrojs/cloudflare`.
- legacy admin rollback: `apps/admin-solid` until passkey proof is complete.
- structured content and admin state are moving into Cloudflare D1
  `anipotts-db`.
- live public site: <https://anipotts.com>.

Important refs:

- PR #50 merge `773f18d`: Astro public-site line.
- cutover commit `85a07b5`: production homepage and apex binding.
- safety branch `safety/astro-production-cutover-2026-06-15`: old cutover
  preservation branch. It is divergent from current `main` and should not be
  deleted unless its useful history is intentionally discarded.

### v1: Next.js 16 turborepo

- public site was Next 16 in `apps/www` via OpenNext on Cloudflare.
- admin was a Next app in `apps/admin`.
- the monorepo carried Supabase, Drizzle, broad `packages/*`, and Workers
  surfaces.
- tag: `v1-nextjs-monorepo` at commit `2d6fecb`.
- filesystem snapshot:
  `~/Archive/projects/anipotts-com-snapshot-2026-05-26/`.

The filesystem snapshot may include `node_modules`, `.git`, and live `.env`
state. Do not copy or commit it into this repo.
