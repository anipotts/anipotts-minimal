# Cloudflare Infrastructure Plan

Living document for the anipotts.com monorepo's deploy substrate. The short version: production already runs entirely on Cloudflare. This doc captures what's there, what's vestigial, what to adopt next, and how to handle every open PR and issue under that lens.

Last updated: 2026-05-13.

## TL;DR

- **No Vercel deployments exist.** `vercel ls` returned zero deployments under the `anipotts` scope. Every public hostname in this repo (`anipotts.com`, `admin.anipotts.com`, `labs.anipotts.com`) resolves to Cloudflare IPs and is served by Cloudflare. The "migrate off Vercel" framing was real for the labs PR draft (which targeted Vercel) and for the residual `apps/www/vercel.json` config file. Both are addressed by PR #40 and PR #41.
- **The remaining work is consolidation and adoption**, not migration. The substrate is right; the surface area to leverage CF-native features (Web Analytics, Logpush, Smart Placement, Email Workers, preview deploys via Workers Versions, etc.) is wide open.
- **Observability is sparse.** No Sentry, no log streaming setup, no synthetic monitoring. Lots of free-tier CF features unused.
- **Three PRs are the current consolidation push:** #40 (labs to CF Workers), #41 (delete vestigial vercel.json), and this doc.

## Current state of the deploy graph

Every target ships from `.github/workflows/deploy.yml` via `cloudflare/wrangler-action@v3`, path-filtered so only changed apps redeploy.

| Target                 | Worker name             | Hostname                                               | Build                                         | Bindings                                |
| ---------------------- | ----------------------- | ------------------------------------------------------ | --------------------------------------------- | --------------------------------------- |
| `apps/www`             | `anipotts-www`          | `anipotts.com/*`                                       | Next 16 + OpenNext (`@opennextjs/cloudflare`) | `ASSETS`, D1 `DB` (`anipotts-db`)       |
| `apps/admin`           | `anipotts-admin`        | `admin.anipotts.com/*`                                 | Next 16 + OpenNext                            | `ASSETS`, D1 `DB`, fronted by CF Access |
| `apps/labs` (PR #40)   | `anipotts-labs`         | `labs.anipotts.com` (custom-domain bind, post-cutover) | Next 16 + OpenNext                            | `ASSETS`, observability enabled         |
| `workers/ingest`       | `anipotts-ingest`       | `*.workers.dev` (no custom domain)                     | Plain Worker                                  | D1 `DB`, cron `* * * * *`               |
| `workers/weekly-email` | `anipotts-weekly-email` | `*.workers.dev` (no custom domain)                     | Plain Worker                                  | D1 `DB`, cron `0 13 * * SUN`            |

DNS for `anipotts.com` is in Cloudflare zone `d56476e2905a2a19ad86aaa4b7c719c2` under account `0f856093bdcd34a7da1bde5ee4385163`. DB of record is D1 `anipotts-db` (`a8aadf73-bbf4-447c-97db-cb3e50b4e26f`).

## What's vestigial (delete)

| Item                                    | Status                                                              | Action                                                                 |
| --------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/www/vercel.json`                  | Not used by CI                                                      | PR #41 deletes it.                                                     |
| `apps/labs/vercel.json` (was in #40 v1) | Removed in PR #40 v2                                                | Done.                                                                  |
| Vercel CLI project link                 | Junk (`linear-tinkering-starlight` stub created during `vercel ls`) | Delete via Vercel dashboard or `vercel project rm`.                    |
| `RESEND_API_KEY` references             | In use today                                                        | PR #30 swaps to CF Email Workers `send_email` binding; revive that PR. |
| Resend npm dep + secret                 | In use today                                                        | Removed by PR #30.                                                     |

## What to adopt (priority ordered)

### P0: stop bleeding cycles

1. **Bump `deploy.yml` Node 20 → 22.** Already shipped in PR #40 because `wrangler-action@v3` requires Node 22 and was failing the most recent main deploy. If PR #40 is delayed, cherry-pick this fix into a one-line PR.
2. **Revive PR #30 (Resend → CF Email Workers `send_email` binding).** Direction is exactly aligned with consolidating onto Cloudflare. Bonus: kills one vendor + one secret + one bill.
3. **Workers Logs.** `[observability] enabled = true` in every `wrangler.toml`. Free, 7-day retention, makes `wrangler tail` and dashboard log streams just work. PR #40's `apps/labs/wrangler.toml` already has this; replicate to the existing Workers in a follow-up.

### P1: observability the platform gives away free

4. **Cloudflare Web Analytics** on `anipotts.com`, `admin.anipotts.com`, `labs.anipotts.com`. No client SDK, no cookies, free, RUM-style. Replaces a meaningful chunk of what Vercel Analytics would have been. Note that PostHog is also wired into `apps/www` for product analytics — keep both; they answer different questions.
5. **Logpush to R2** for any Worker that matters in postmortems (`anipotts-www`, `anipotts-admin`, `anipotts-ingest`). Cheaper than Sentry for raw streams, durable beyond Workers Logs' 7 days. Configure once per Worker via the dashboard or a Terraform module.
6. **Sentry on Workers.** The `@sentry/cloudflare` SDK is the canonical source for stack traces, source maps, and error grouping. Workers Logs is the firehose; Sentry is the dashboard. Scope: at minimum `apps/www` and `apps/admin`; ingest/weekly-email are noisy enough that it's worth thinking about volume first.

### P2: edge features that change architecture

7. **Smart Placement.** `[placement] mode = "smart"` in `wrangler.toml` for any Worker that talks to a single-region origin. `apps/admin` calls Mercury, GitHub, Buttondown, Typefully — likely all single-region. Toggle on, measure latency, keep or revert.
8. **Wrangler Versions for preview environments.** Every push to a non-main branch can `wrangler versions upload` to get a unique URL bound to that commit. Replaces Vercel preview URLs with first-party primitives. Costs nothing on the free plan; needs CI wiring (a `preview.yml` workflow that runs on `pull_request` and posts the version URL back as a PR comment).
9. **Workers Builds.** First-party CI/CD for Workers. Not strictly necessary while we're on GitHub Actions and it works, but worth keeping in the back pocket if Actions costs become a concern. Don't switch yet; revisit if PR-volume changes meaningfully.
10. **Cloudflare Images.** Replaces `next/image`'s remote-host optimization. OpenNext + CF Images plays nicely. Worth turning on if image-heavy routes appear; not urgent today.

### P3: nice-to-have, low-priority

11. **Zaraz.** Server-side third-party scripts (PostHog, GA, etc.) at the edge. Removes client JS bundles. Only matters if perf budget tightens.
12. **Turnstile.** Already in use on `apps/www` contact form (per the security headers in `next.config.ts`). Confirm it's wired and the secret is set on the live Worker.
13. **D1 read replicas + sessions.** Once read traffic to `anipotts-db` justifies it (it doesn't yet). Park.
14. **Hyperdrive.** Only if we ever add an external Postgres. We don't have one. Park.

## Monitoring posture (proposed)

| Layer                | Tool                              | What it answers                         |
| -------------------- | --------------------------------- | --------------------------------------- |
| Synthetic            | UptimeRobot or CF Health Checks   | "Is the homepage 200?"                  |
| RUM                  | CF Web Analytics                  | "What's user-perceived load time?"      |
| Product              | PostHog (already wired on www)    | "Did the conversion funnel change?"     |
| App errors           | Sentry on Workers                 | "What stack trace just fired?"          |
| Raw logs             | Workers Logs (7d) + Logpush to R2 | "What did the Worker actually do?"      |
| Email deliverability | CF Email Routing dashboard        | "Did the contact form mail get sent?"   |
| DB health            | D1 metrics in CF dashboard        | "How many rows? How many slow queries?" |
| CI                   | GitHub Actions                    | "Did the deploy go green?"              |

Gap-fillers worth building: a `/health` aggregator endpoint on `apps/admin` that pings each binding (D1, KV, R2 if we add it) and returns a single JSON payload UptimeRobot can poll.

## Preview environments (proposed)

Goal: every PR gets a URL like `https://pr-40.anipotts-labs.workers.dev` (or per-app subdomain) so review can happen in a browser.

Mechanism: a new `.github/workflows/preview.yml` that runs on `pull_request`, builds the changed apps with OpenNext, calls `wrangler versions upload --message "PR #${{ github.event.number }}"`, captures the version URL, comments it on the PR.

Cost: free on the Workers free plan up to a generous limit.

Caveat: Workers Versions are for "uploaded but not deployed" Worker code. They get a `*.workers.dev` URL but don't share the production custom domain. That's the right semantic for previews.

## PR triage (open as of 2026-05-13)

| #   | Title                                                              | State            | Action                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 40  | feat(labs): port labs to Next 16 on Cloudflare Workers             | open, mine       | Land after CI green; then run cutover steps in `apps/labs/README.md`.                                                                                                                                                                                                          |
| 41  | chore: remove vestigial apps/www/vercel.json                       | open, mine       | Land after CI green. Mechanical, low risk.                                                                                                                                                                                                                                     |
| 39  | deps(deps): bump tailwind-merge 3.4.0 → 3.6.0                      | open, dependabot | Patch-ish minor, low risk. Merge after CI green.                                                                                                                                                                                                                               |
| 38  | deps(deps): bump resend 6.8.0 → 6.12.3                             | open, dependabot | **Hold.** Resend is being removed by PR #30. If #30 lands first, this PR auto-closes. If #30 stalls, merge #38 to keep the dep healthy in the meantime.                                                                                                                        |
| 37  | deps(deps): bump otplib 12.0.1 → 13.4.0                            | open, dependabot | **Major bump.** Used by admin TOTP. Merge solo, verify admin login flow, never bundle with another dep PR.                                                                                                                                                                     |
| 36  | deps(dev): bump typescript 5.9.3 → 6.0.3                           | open, dependabot | **Major bump.** TypeScript major bumps routinely break builds. Merge solo, verify all `pnpm turbo build lint typecheck test` pass, be ready to revert.                                                                                                                         |
| 33  | ci: bump dependabot/fetch-metadata 2 → 3                           | open, dependabot | Low-risk action bump. Merge after CI green.                                                                                                                                                                                                                                    |
| 32  | ci: bump actions/checkout 4 → 6                                    | open, dependabot | Low-risk action bump. Merge after CI green.                                                                                                                                                                                                                                    |
| 31  | ci: bump dorny/paths-filter 3 → 4                                  | open, dependabot | Low-risk action bump. Merge after CI green.                                                                                                                                                                                                                                    |
| 30  | Migrate from Resend to Cloudflare Email Workers send_email binding | **draft**, mine  | **Revive.** Direction is correct. Last touched 2026-05-01; needs rebase against current main, manual prereq checks (verify `contact@anipotts.com` and `hello@anipotts.com` as Email Routing destinations, confirm SPF/DKIM healthy). Convert to ready-for-review once rebased. |

Suggested merge order (assuming each is green): 41 → 40 (after cutover) → 39, 33, 32, 31 (low-risk batch) → 37 (solo, verify TOTP) → 36 (solo, verify everything) → 30 (after manual prereqs) → 38 auto-closes.

## Issue triage (open as of 2026-05-13, 20 total)

All issues are code-quality findings from a March audit. None are blocked by Vercel/CF migration. The CF consolidation makes one (#27) potentially obsolete if PR #30 lands.

**P0 critical (2):**

| #   | Title                                                            | Action                                                                                                                         |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 3   | Add rate limiting to admin login (function exists, never called) | Fix immediately. Function is already written; just call it. CF KV or Workers Rate Limiting binding is the right backing store. |
| 4   | Guard ThroughputChart against empty data (crash on render)       | Fix immediately. Trivial null-check.                                                                                           |

**P1 high (5):**

| #   | Title                                                               | Action                                                    |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------- |
| 5   | Add env var validation with zod (fail fast on missing config)       | Worth doing; pairs well with CF secret rotation playbook. |
| 6   | Replace `window.location.reload()` with `router.refresh()` in admin | Trivial. Bundle into next admin PR.                       |
| 7   | Make CI tests hard-fail (remove `\|\| true` from test/audit steps)  | Do now. The whole point of CI is hard-fail.               |
| 9   | Extract SERIES_COLORS to shared constant (defined 3 times)          | Tech debt. Bundle into next refactor.                     |
| 10  | Admin pipeline fetches ALL atoms just to count them                 | Real perf bug. SQL `SELECT COUNT(*)` fix.                 |

**P2 medium (8):**

| #   | Title                                                            | Action                                                                                                          |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 11  | Add a11y labels to all form inputs and search                    | Bundle into next www UI PR.                                                                                     |
| 12  | Fix TipCard nested interactive elements (a11y violation)         | Bundle into next www UI PR.                                                                                     |
| 13  | Remove dead code: unused exports across codebase                 | Bundle when convenient. Use `ts-prune` or `knip`.                                                               |
| 14  | Add error boundary for admin routes                              | Trivial in App Router. Bundle into next admin PR.                                                               |
| 15  | Fix `logger.info` using `console.warn` instead of `console.info` | Trivial bug fix.                                                                                                |
| 16  | Memoize ThemeContext value to prevent unnecessary re-renders     | Trivial perf fix.                                                                                               |
| 19  | Add Turnstile fetch timeout and CSRF origin check on `/api/send` | Real security improvement. Bundle into PR #30 or its successor since `/api/send` is being touched there anyway. |
| 20  | Add cache headers to `/api/icon` route                           | Trivial. Bundle into next www PR.                                                                               |

**P3 low (5):**

| #   | Title                                                             | Action                                                                                                                                                                                             |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 22  | Add `lastBuildDate` to RSS feed                                   | Trivial.                                                                                                                                                                                           |
| 23  | Fix slug collision window (28 min repeat cycle)                   | Trivial. Bump the entropy on slug generation.                                                                                                                                                      |
| 24  | Add missing `package.json` metadata (license, repository, author) | Mechanical. Bundle when touching root files.                                                                                                                                                       |
| 25  | Fix `turbo.json` `globalDependencies` (missing config packages)   | Real DX bug. Quick fix.                                                                                                                                                                            |
| 27  | Sanitize Resend API response (don't leak internal details)        | **Maybe obsolete.** If PR #30 lands, the Resend SDK is removed entirely and this issue dissolves. Close as superseded once #30 merges. If #30 stalls past say 2026-06-01, fix this in a one-liner. |

None of the 20 are migration-blocking. Land #40 and #41 first, then revive #30, then start picking off P0 + P1.

## Forward roadmap (suggested, 4-week horizon)

Week 1 (this week, 2026-05-13 onward):

1. Land PR #40 (labs on CF Workers), execute Pages → Workers cutover for `labs.anipotts.com`.
2. Land PR #41 (vercel.json cleanup).
3. Cherry-pick the Node 22 bump from #40 into #41 if #40 stalls.
4. Decide on PR #30: rebase + revive, or close + reopen later.

Week 2:

5. Add `[observability] enabled = true` to existing Workers (`anipotts-www`, `anipotts-admin`, `anipotts-ingest`, `anipotts-weekly-email`).
6. Enable CF Web Analytics on all three hostnames.
7. Fix issues #3 (admin rate limit) and #4 (ThroughputChart guard). Both are P0.
8. Fix issue #7 (CI hard-fail).

Week 3:

9. Merge low-risk dependabot PRs (#39, #33, #32, #31).
10. Merge #37 (otplib major) solo with admin TOTP smoke test.
11. Merge #36 (TypeScript major) solo with full validation.
12. Land PR #30 (Resend → CF Email Workers) once prereqs are checked.

Week 4:

13. Wire Logpush to R2 for `anipotts-www` and `anipotts-admin`.
14. Add Sentry on Workers (start with `apps/www`).
15. Build the preview environment workflow (`preview.yml` + Workers Versions).
16. Pick off P1 issues (#5, #6, #9, #10).

## Update rule

When you ship infrastructure that changes the deploy graph (a new Worker, a custom-domain swap, a new binding type, a CF feature toggled on/off), update this doc in the same PR. Future contributors trust this over guesswork.
