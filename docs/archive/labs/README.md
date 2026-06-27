# @anipotts/labs

Archived 2026-06-27 when the monorepo was reduced toward one public Astro app
and one Astro admin app. This document is historical reference only. The
`apps/labs` app and deploy target no longer exist in this repo.

Next.js 16 + Tailwind v4 app that serves [labs.anipotts.com](https://labs.anipotts.com). Replaces the hand-rolled static HTML site previously deployed to Cloudflare Pages, moving onto a Cloudflare Worker via OpenNext (`@opennextjs/cloudflare`) so it lives next to `apps/www` and `apps/admin` on the same deploy substrate.

## Routes

| URL                   | Source                                            | Build                          |
| --------------------- | ------------------------------------------------- | ------------------------------ |
| `/`                   | `src/app/page.tsx`                                | static                         |
| `/weekly/[slug]`      | `content/_labs-bot/weekly/*.md` (cloned at build) | SSG via `generateStaticParams` |
| `/experiments/[slug]` | `content/experiments/*.md` (in this repo)         | SSG via `generateStaticParams` |

`dynamicParams = false` everywhere. Anything not generated at build time returns 404.

## Why two repos

The bot/human contract from [github.com/anipotts/labs](https://github.com/anipotts/labs)'s README is preserved by sourcing weekly digests from that repo, not collapsing them into the monorepo:

- **`anipotts/labs`** only changes when an autonomous run produced something a person would want to read. Every commit is gated by `~/Infra/bin/pro-commit`.
- **This repo** holds human-authored experiments and the rendering layer.

If the two were merged, the commit log on the bot repo would stop being the changelog of the framework. That's the whole point of the split.

## Build pipeline

`pnpm prebuild` runs `scripts/fetch-bot-content.mjs`, which:

1. Removes `content/_labs-bot/` if present (kept hermetic).
2. Runs `git clone --depth=1 https://github.com/anipotts/labs.git content/_labs-bot`.
3. Verifies `weekly/` exists in the clone.
4. Fails the build on any error rather than shipping an empty index.

The cache dir is gitignored. To skip the fetch during local iteration when a cached clone already exists:

```bash
SKIP_LABS_FETCH=1 pnpm dev
```

## Deploy (Cloudflare Workers via OpenNext)

CI deploys this app from `.github/workflows/deploy.yml`, mirroring the `apps/www` and `apps/admin` jobs:

```bash
pnpm turbo build --filter=@anipotts/labs
pnpm --filter=@anipotts/labs exec opennextjs-cloudflare build
pnpm --filter=@anipotts/labs exec wrangler deploy
```

Local production smoke test (uses `wrangler dev` against the OpenNext bundle):

```bash
pnpm --filter=@anipotts/labs exec opennextjs-cloudflare build
pnpm --filter=@anipotts/labs exec wrangler dev
```

## Cutover runbook (Cloudflare Pages to Cloudflare Workers)

The current `labs.anipotts.com` is served by a Cloudflare Pages project. Because both the old and the new stack live in the same Cloudflare zone, the cutover is a Worker custom-domain bind, not a DNS edit. DNS doesn't change.

Steps in order:

1. **Deploy the Worker.** Land this PR. CI publishes `anipotts-labs` Worker. The `wrangler.toml` here lists `labs.anipotts.com` as a custom-domain route; on first deploy Wrangler will refuse if the hostname is already attached to a Pages project. Expect that and continue to step 2.
2. **Detach Pages from `labs.anipotts.com`.** In the Cloudflare dashboard, open the existing Pages project for `labs` and remove the `labs.anipotts.com` custom domain.
3. **Re-run the Worker deploy.** Either re-trigger CI or run `pnpm --filter=@anipotts/labs exec wrangler deploy` locally. Wrangler will now successfully attach `labs.anipotts.com` to the new Worker; the existing CNAME at the zone resolves to the Worker substrate automatically.
4. **Smoke test.** `curl -I https://labs.anipotts.com/` should report `cf-ray:` headers and no `pages-` cookie. Walk through `/`, `/weekly/2026-W19`, `/experiments/hello-world` in a browser. Open DevTools and confirm dark mode flips with system preference.
5. **Decommission the Pages project.** Once the Worker is verified live, delete the `labs` Pages project from the dashboard. Keep `github.com/anipotts/labs` alive: it's the content repo and is referenced by the bot pipeline.
6. **Rollback.** If anything regresses, re-attach the Pages project to `labs.anipotts.com` (it'll reclaim the hostname) and unbind the Worker. The Pages build output is still cached in CF, so the rollback is immediate.

## Local development

```bash
# from monorepo root
pnpm install
pnpm turbo dev --filter=@anipotts/labs    # http://localhost:3002
pnpm turbo build --filter=@anipotts/labs  # production build
pnpm turbo lint typecheck --filter=@anipotts/labs
```

## Adding a new experiment

Drop a markdown file in `content/experiments/` with frontmatter:

```markdown
---
title: short title
date: 2026-05-13
summary: one-line summary (optional)
tags: [tag1, tag2]
---

Body in markdown. GFM tables and code blocks all work.
```

Commit it. The next CI deploy publishes the new entry.

## Adding a new weekly digest

You don't. The bot does, in `github.com/anipotts/labs`. The next deploy of this app picks it up via the `prebuild` clone.

For freshness without a manual trigger, set up a `repository_dispatch` from the bot repo's commit-time hook to re-run this app's deploy job:

```bash
gh api repos/anipotts/anipotts.com/dispatches \
  -f event_type=labs-content-updated
```

## Stack notes

- Next.js 16.2 (App Router, Turbopack build).
- `@opennextjs/cloudflare` adapter, served from a Worker with the `ASSETS` static binding.
- Tailwind v4 via the monorepo's `@anipotts/config` shared base.
- React 19, server-rendered for content routes.
- `react-markdown` with `remark-gfm` for both content sources.
- Light-mode default; dark mode follows `prefers-color-scheme` via CSS custom properties.
- Workers Logs enabled for `wrangler tail` and dashboard log streams.
