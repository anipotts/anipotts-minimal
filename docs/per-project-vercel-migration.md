# Per-Project Vercel → Cloudflare Migration Plan

Companion to `docs/cloudflare-infrastructure.md`. That doc covers the anipotts.com monorepo and the broader account picture. This doc plans the actual project-by-project migrations for the 9 domains slated to move.

Last updated: 2026-05-13.

## Scope

Migrate these 9 domain-bearing Vercel projects under the `anipotts` Vercel team to the `anipotts` Cloudflare account (`0f856093bdcd34a7da1bde5ee4385163`):

1. ashasreen.com
2. chained.chat
3. coolfollowers.com
4. howoldamiactually.com
5. nyupuritytest.com (`nyuricepurity.com` is a secondary registered domain that doesn't resolve; no action this round)
6. prcart.dev
7. quantercise.com
8. saeshify.com
9. wigglesburg.com

## Cross-cutting facts (apply to all 9)

**Nameservers.** All 9 domains are on Namecheap (`dns1/dns2.registrar-servers.com`). Zero are in Cloudflare zones today. Each migration starts with a Namecheap nameserver swap, propagation wait (1 to 24 hours, usually under 4), then Worker custom-domain bind. **No CF Worker can attach to a hostname that isn't in a CF zone.**

**Framework.** All 9 are Next.js. Mix of Next 14, 15, 16. No Astro, no Vite SPA, no Remix. The migration recipe is uniform: `@opennextjs/cloudflare` + `wrangler.toml` + `[assets]` binding + Workers Logs.

**CF account.** All deploys target `account_id = "0f856093bdcd34a7da1bde5ee4385163"` (the `anipotts` CF account, same one that hosts anipotts.com). Not rubio-potts, not stranger-matter.

**Repo locations.** Already cloned locally under `~/Code/projects/websites/`: ashasreen.com, coolfollowers.com, howoldamiactually.com, wigglesburg.com. Need cloning: chained-chat, quantercise, nyu-rice-purity, pr-cart, saeshify. Suggested target: `~/Code/projects/websites/<repo>` for consistency.

**Symphony (quantercise).** The Symphony daemon on `ap-mini` runs autonomous Linear-driven loops against `quantercise`. Per the infra map, it does fresh git clones into `~/symphony-workspaces/QUA-N/` per issue and pushes back. Modifying the deploy substrate without coordinating with Symphony will cause merge conflicts and blow up autonomous PRs in flight. **Pause Symphony before touching quantercise.** `ssh mini 'launchctl bootout gui/$(id -u)/com.symphony.quantercise'`. Restart after migration is verified.

**GitHub App scoping.** Vercel GitHub App stays installed on each repo until migration is verified (so the rollback path stays open). Once a migration is verified, remove that repo from the app's selected list (one DELETE call per repo, see `docs/cloudflare-infrastructure.md`).

## Per-project assessments

### 1. ashasreen.com — TRIVIAL

|                      |                                                                              |
| -------------------- | ---------------------------------------------------------------------------- |
| Repo                 | `anipotts/ashasreen.com` (local at `~/Code/projects/websites/ashasreen.com`) |
| Framework            | Next 16.1.2, React 19                                                        |
| API routes           | none                                                                         |
| Middleware           | none                                                                         |
| Vendor deps          | none                                                                         |
| Vercel-only features | none                                                                         |
| `vercel.json`        | absent                                                                       |
| `next.config.ts`     | empty                                                                        |

**Plan.** Add `wrangler.toml` + `open-next.config.ts`, run `opennextjs-cloudflare build`, deploy to `*.workers.dev`, smoke test, swap NS at Namecheap to CF, attach custom domain to Worker, delete Vercel project. Estimated time: 30 min including DNS propagation wait.

**Risk:** none. This is the practice run.

### 2. coolfollowers.com — SMALL APP

|                      |                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Repo                 | `anipotts/coolfollowers.com` (local)                                                     |
| Framework            | Next 16.1.1, React 19                                                                    |
| API routes           | 7 (auth, data fetching for IG followers/following/posts/profile/stats, refresh)          |
| Middleware           | yes (`src/middleware.ts`)                                                                |
| Vendor deps          | none in `dependencies`                                                                   |
| Vercel-only features | none                                                                                     |
| `vercel.json`        | absent                                                                                   |
| `next.config.ts`     | image remote patterns for Instagram CDNs (`*.cdninstagram.com`, `instagram.*.fbcdn.net`) |

**Plan.** Same recipe. The image `remotePatterns` list works fine on OpenNext (it just bundles them); no change. The 7 API routes will become Worker function invocations under OpenNext's adapter. Need to inventory env vars (probably IG OAuth keys) and `wrangler secret put` each.

**Risk:** medium. The auth route + Instagram OAuth flow might have a callback URL pinned to Vercel. Verify after deploy. Estimated time: 60 min.

### 3. howoldamiactually.com — TRIVIAL

|                      |                                                                     |
| -------------------- | ------------------------------------------------------------------- |
| Repo                 | `anipotts/howoldamiactually.com` (local)                            |
| Framework            | Next 16.1.2, React 19                                               |
| API routes           | none                                                                |
| Middleware           | none                                                                |
| Vendor deps          | `@vercel/analytics`                                                 |
| Vercel-only features | analytics SDK                                                       |
| `vercel.json`        | absent                                                              |
| `next.config.mjs`    | `images.unoptimized: true`, ignores TS + ESLint errors during build |

**Plan.** Same recipe. Replace `@vercel/analytics` import + provider with the CF Web Analytics snippet (or just delete; analytics on a one-off "how old am I" page is overkill). Probable 1-line removal. Estimated time: 30 min.

**Risk:** none.

### 4. nyupuritytest.com — SMALL APP

|                                     |                                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Repo                                | `anipotts/nyu-rice-purity` (clone to `~/Code/projects/websites/nyu-rice-purity`)                                |
| Framework                           | Next 14.2.35, React 18                                                                                          |
| API routes                          | 6 (revalidate-stats, save-feedback, share-stats, statistics, submission-count, submit-result)                   |
| Middleware                          | yes (`src/middleware.ts`, plus `src/app/admin/middleware.ts`)                                                   |
| Vendor deps                         | `@vercel/analytics`                                                                                             |
| Vercel-only features                | `vercel.json` pins `regions: ["sfo1"]`, uses legacy `builds: [@vercel/next]`, custom build command for tailwind |
| `vercel.json`                       | yes (region pin + legacy builder, both Vercel-specific)                                                         |
| `next.config.ts` / `next.config.js` | both present (collision); `next.config.js` has `swcMinify`, ignores TS errors                                   |

**Plan.** Same recipe but **delete `vercel.json` and consolidate to one `next.config`**. Region pinning becomes irrelevant on Workers (always edge). Drop `@vercel/analytics`. The data routes (stats, feedback, share, submit) almost certainly write to a database — find what (Postgres? Supabase? KV?) and either keep that vendor or migrate to D1. Inventory needed before migration starts.

**Risk:** medium. Open question: where does the data live? Need to read one of the API route files to find out. Estimated time: 1-2 hr depending on DB.

### 5. prcart.dev — UNKNOWN, PROBABLY STATIC

|                      |                            |
| -------------------- | -------------------------- |
| Repo                 | `anipotts/pr-cart` (clone) |
| Framework            | Next 14.2.0, React 18      |
| API routes           | none visible at top level  |
| Middleware           | none visible               |
| Vendor deps          | none                       |
| Vercel-only features | none                       |
| `vercel.json`        | absent                     |

**Plan.** Same recipe. If it really is static, this is identical to ashasreen.com. Estimated time: 30 min.

**Risk:** low. Possible: API routes nested deeper than top-level grep caught.

### 6. saeshify.com — MEDIUM, SUPABASE + CRON

|                      |                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Repo                 | `anipotts/saeshify` (clone)                                                                                                                     |
| Framework            | Next 16.0.10, React 19                                                                                                                          |
| API routes           | 10 (Spotify integration: search, album, artist, token; rhymes; push subscribe; **2 cron routes**: `/api/cron/notify`, `/api/cron/spotify-sync`) |
| Middleware           | yes (root `middleware.ts`, plus `lib/supabase/middleware.ts` for Supabase SSR)                                                                  |
| Vendor deps          | `@supabase/ssr`, `@supabase/supabase-js`, `vercel` (CLI as dependency, weird, likely accidental)                                                |
| Vercel-only features | cron routes (Vercel Cron triggers them via `vercel.json`); analytics?                                                                           |
| `vercel.json`        | not yet inspected, expect cron schedule definitions                                                                                             |
| `next.config.js`     | not yet fully inspected                                                                                                                         |

**Plan.**

1. Same recipe for the Worker.
2. The 2 cron routes need to become **Cloudflare Cron Triggers** in `wrangler.toml`. The route handlers themselves can stay as App Router routes; the Worker invokes them on schedule.
3. `vercel` CLI as a dep is junk — remove from `dependencies`.
4. Supabase keeps working as-is (Supabase is a separate hosted service; the SDK works on CF Workers via the SSR adapter).
5. `wrangler secret put` for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Spotify creds, push subscription keys.

**Risk:** medium. Cron porting is the main work. Spotify token refresh in the cron route needs to keep working. Estimated time: 2-3 hr.

### 7. wigglesburg.com — TRIVIAL

|                      |                                    |
| -------------------- | ---------------------------------- |
| Repo                 | `anipotts/wigglesburg.com` (local) |
| Framework            | Next 14.2.35, React 18             |
| API routes           | none visible                       |
| Middleware           | none                               |
| Vendor deps          | none                               |
| Vercel-only features | none                               |
| `vercel.json`        | absent                             |

**Plan.** Same recipe. Clean static site. Estimated time: 30 min.

**Risk:** none.

### 8. chained.chat — HARD, CONVEX + CLERK + STREAMING

|                      |                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Repo                 | `anipotts/chained-chat` (clone)                                                                                             |
| Framework            | Next 15.3.3, React 18                                                                                                       |
| API routes           | 8: create-session, run-chain, stream-agent, stream-parallel, supervisor-interact, transcribe-audio, upload-file, web-search |
| Middleware           | yes, Clerk auth + custom rate limiter + CORS for `chained.chat` origin                                                      |
| Vendor deps          | `@clerk/nextjs`, `convex`                                                                                                   |
| Vercel-only features | `vercel.json` sets `functions: maxDuration: 30` for all `app/api/**` routes                                                 |
| `vercel.json`        | yes (function timeout, framework pin, rewrites)                                                                             |
| `next.config.mjs`    | optimizePackageImports for Clerk/lucide/framer/radix; `serverExternalPackages: ['convex']`; custom webpack splitChunks      |

**Plan.**

1. Same Worker recipe.
2. `maxDuration: 30` on Vercel Functions has no direct CF equivalent; **CF Workers cap at 30s CPU time per request** by default but can stream for much longer. Streaming AI routes (`stream-agent`, `stream-parallel`) need verification: confirm OpenNext properly preserves streaming responses. If not, fall back to using `wrangler.toml`'s `limits.cpu_ms` setting and explicit Response stream handling.
3. Clerk works on CF Workers — they ship a CF adapter. Verify the middleware works without Vercel's edge runtime.
4. Convex runs on its own infra; the SDK works anywhere. No change needed.
5. Custom webpack splitChunks may need OpenNext-specific tweaks; test before declaring done.
6. The `vercel.json` `rewrites` (`/api/(.*) → /api/$1`) is a no-op and can be deleted.
7. `wrangler secret put` for: Clerk publishable + secret keys, Convex deployment URL + auth token, OpenAI / Anthropic / etc. API keys for the agents, web search API key, transcription API key, file upload destination creds.

**Risk:** high. Streaming + auth + multi-step agent loops are exactly the kind of code that exposes runtime differences between Vercel Edge and CF Workers. Build a separate verification harness before cutting over. Estimated time: 4-6 hr.

### 9. quantercise.com — HARDEST, ENTERPRISE APP + SYMPHONY

|                       |                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repo                  | `anipotts/quantercise` (clone)                                                                                                                                                                                                                                                                                                                                                                                   |
| Framework             | Next 15.5.15, React 19                                                                                                                                                                                                                                                                                                                                                                                           |
| API routes            | 40+, including admin (analytics, content, debug, drive uploads, failed events, feature flags, feedback), auth (account delete, sign-in-as), achievements, activity, alerts                                                                                                                                                                                                                                       |
| Middleware            | yes, full correlation-ID + structured logging + mock-mode security guard                                                                                                                                                                                                                                                                                                                                         |
| Vendor deps           | `@auth/drizzle-adapter`, **`@aws-sdk/client-cognito-identity-provider`**, `@aws-sdk/client-dynamodb`, `@aws-sdk/client-lambda`, `@aws-sdk/client-rds-data`, `@aws-sdk/client-secrets-manager`, `@aws-sdk/lib-dynamodb`, `@neondatabase/serverless`, **`@sentry/nextjs`**, `@upstash/ratelimit`, `@upstash/redis`, `@vercel/analytics`, **`botid`** (Vercel-owned bot detection), `next-auth` (v5 beta), `stripe` |
| Vercel-only features  | **BotID** (Vercel proprietary bot detection product), `vercel.json` cron at `*/5 * * * *` for `/api/health/db`, CSP allows `vercel.live` + `*.vercel.app`                                                                                                                                                                                                                                                        |
| `vercel.json`         | yes, cron + git deployment config                                                                                                                                                                                                                                                                                                                                                                                |
| `next.config.ts`      | `withSentryConfig` + `withBotId` wrappers, full CSP with Vercel-specific origins, security headers                                                                                                                                                                                                                                                                                                               |
| Symphony coordination | autonomous loops on `ap-mini` write to this repo                                                                                                                                                                                                                                                                                                                                                                 |

**Plan.** This needs its own focused effort. Skeleton:

1. **Pause Symphony first.** `ssh mini 'launchctl bootout gui/$(id -u)/com.symphony.quantercise'`.
2. **Decide on BotID.** It's a Vercel-only product. Either drop it (simplest), replace with **CF Turnstile + Bot Management** (CF-native, free tier covers most use), or keep BotID but accept that it won't function once off Vercel. Recommend: replace with Turnstile on user-facing forms, drop everywhere else.
3. **Sentry stays.** `@sentry/nextjs` works on Workers via the `@sentry/cloudflare` adapter. Need to migrate `withSentryConfig` to the CF adapter equivalent. Source maps upload via CI.
4. **Cron migration.** `vercel.json` cron to `wrangler.toml` `[triggers]`. The `/api/health/db` route stays the same.
5. **CSP cleanup.** Remove `vercel.live`, `*.vercel.app`, `wss://vercel.live` from script-src, connect-src, frame-src.
6. **AWS Cognito + RDS Data + DynamoDB + Lambda + Secrets Manager** all keep working — they're external AWS services and the SDK runs on CF Workers (with `nodejs_compat`). Verify `@aws-sdk` packages work in Worker runtime.
7. **Neon Postgres + Drizzle** keeps working. Drizzle has a HTTP driver that's CF-friendly.
8. **Upstash Ratelimit + Redis** is HTTP-based, works anywhere.
9. **Stripe** keeps working.
10. **next-auth v5 (Auth.js)** has a CF adapter; verify session storage continues to work.
11. **`@vercel/analytics`** → swap to CF Web Analytics or remove.
12. Workspace count is so large that Workers Bundle Size limit (10MB compressed for free, 100MB on paid) needs to be checked early. The OpenNext bundle for an app this size may exceed free tier; **verify bundle size before assuming free plan works**. Likely needs the Workers paid plan ($5/mo).
13. **Restart Symphony** with updated workflow that calls `wrangler deploy` instead of pushing to Vercel. The Symphony WORKFLOW.md needs editing to swap the deploy step.

**Risk:** very high. This is a real product with paying users (Stripe). Recommend doing the other 8 first, building muscle memory, then planning a dedicated quantercise migration session with a maintenance window. Estimated time: full day.

## Suggested execution order

| Wave              | Projects                                                                   | Why this order                                                                             |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1 (recipe)        | wigglesburg.com → ashasreen.com → howoldamiactually.com → pr-cart          | All trivial, all static-ish. First one shakes out the recipe. Latter three are repetition. |
| 2 (small app)     | coolfollowers.com → nyupuritytest.com                                      | API routes + middleware. Tests the OpenNext function-route conversion.                     |
| 3 (vendor stacks) | saeshify.com (Supabase + cron) → chained.chat (Convex + Clerk + streaming) | Each adds one dimension of complexity.                                                     |
| 4 (the boss)      | quantercise.com                                                            | After Symphony is paused and a maintenance window is scheduled.                            |

## What this session will and won't do

**Will (this session, if you say go):**

- Open this doc as a PR.
- For each of the 4 wave-1 projects: clone (where missing), add `wrangler.toml` + `open-next.config.ts`, run `opennextjs-cloudflare build`, push to GitHub on a `migrate/cloudflare-workers` branch, optionally deploy to `*.workers.dev` for smoke testing.
- Surface env-var inventory per project so you know what to `wrangler secret put`.

**Won't (this session, by design):**

- Touch DNS at Namecheap. Every NS swap is your call once the Worker is verified.
- Detach domains from Vercel projects. Same reason.
- Migrate quantercise. Needs Symphony coordination and a planned window.
- Migrate chained-chat or saeshify. Convex/Supabase auth flows need verification before cutover.
- Delete Vercel projects. Rollback path stays open until you're confident.

## Reference recipe (used by every project)

```toml
# wrangler.toml
name = "<repo-name-or-domain>"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]
account_id = "0f856093bdcd34a7da1bde5ee4385163"
main = ".open-next/worker.js"
workers_dev = true   # leave on during migration; flip to false after cutover

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

[observability]
enabled = true

# Add after NS swap + zone created in CF dashboard:
# [[routes]]
# pattern = "<domain.com>"
# custom_domain = true
# zone_id = "<zone-id>"
```

```ts
// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
export default defineCloudflareConfig({});
```

```jsonc
// package.json additions
{
  "devDependencies": {
    "@opennextjs/cloudflare": "^1.19.9",
    "wrangler": "^4.90.0",
  },
}
```

```bash
# build + deploy sequence
pnpm install   # or npm install
pnpm build     # next build
npx opennextjs-cloudflare build   # produces .open-next/worker.js
npx wrangler deploy                # publishes to *.workers.dev
# verify, then add custom_domain route + redeploy
```

## DNS cutover sequence (per project, owner action)

1. Add the domain as a zone in CF dashboard. CF generates two nameservers like `xyz.ns.cloudflare.com` + `abc.ns.cloudflare.com`.
2. Log in to Namecheap, navigate to the domain, change nameservers from `dns1.registrar-servers.com` + `dns2.registrar-servers.com` to the two CF nameservers.
3. Wait for propagation (`dig +short NS <domain>` should show `*.ns.cloudflare.com`). Typically 1-4 hours.
4. In CF dashboard for that zone, set SSL/TLS mode to "Full" (or "Full (strict)" once cert is verified).
5. Add `[[routes]] pattern = "<domain>" custom_domain = true zone_id = "<zone-id>"` to `wrangler.toml`. Re-deploy. Wrangler attaches the hostname.
6. `curl -I https://<domain>` should report `cf-ray:` headers and `server: cloudflare`. Confirm.
7. In Vercel dashboard for that project, detach the custom domain.
8. Optionally: delete the Vercel project, remove the repo from the Vercel GitHub App's selected list.

If step 6 fails: revert NS at Namecheap to point back at Vercel's nameservers (or the registrar's defaults pointing at the Vercel IP). Vercel reclaims serving.
