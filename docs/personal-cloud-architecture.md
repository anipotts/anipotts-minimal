# Personal Cloud Architecture

Multi-month vision doc for the anipotts personal infrastructure. Companion to `docs/cloudflare-infrastructure.md` (deploy substrate) and `docs/per-project-vercel-migration.md` (project-by-project Vercel exit). This one is the _destination_ the migrations are walking toward.

Last updated: 2026-05-13.

## The pitch in one paragraph

Stop thinking of `apps/admin` as "a dashboard that polls a server on the Mac Mini." Start thinking of the whole anipotts setup as a **personal cloud**: a graph of state living in Cloudflare Durable Objects, a SolidStart admin that subscribes via WebSocket (no polling, no SSR ceremony), Rudy as the human-facing input and output node on iMessage, the Mac Mini as one publisher among several (not the center), the iPhone as a first-class consumer and controller. Agents (Claude Code, Codex, Rudy, future) all hit the same `api.anipotts.com` Worker to read and write the graph. Realtime is the default. The mini can crash without the user-facing system going down.

## Three planes

```
┌─────────────────────────────────────────────────────────────────┐
│  INPUT PLANE                                                    │
│  ─────────────────                                              │
│  iMessage → Rudy (Mini) → tool calls → state.write              │
│  Email → Email Workers → state.write                            │
│  Webhooks (Typefully, Postiz, Buttondown, GitHub) → state.write │
│  Mini publisher daemons → ingest worker → state.write           │
│  Manual via apps/admin-solid → state.write                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STATE PLANE                                                    │
│  ─────────────────                                              │
│  workers/state (Hono on Workers, Bun-runtime build)             │
│  Durable Objects (one class per "thing in your life"):          │
│    MoneyState, ContentPipeline, BrandDeals, Inbox, LinkVault,   │
│    SystemStats, SymphonyMonitor, RudyConvos, CodeStats,         │
│    LinearIssues, CommitFeed, ...                                │
│  D1 (anipotts-db) is the durable archive; DOs hydrate from it   │
│  on cold start and snapshot back on a schedule.                 │
│  R2 for blob assets (OG images, screenshots, brand artifacts).  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  OUTPUT PLANE                                                   │
│  ─────────────────                                              │
│  apps/admin-solid (SolidStart) ← WebSocket → DOs                │
│  Rudy (iMessage proactive nudges to SELF tier only)             │
│  iPhone (Apple Shortcuts → Worker → DO read/write,              │
│           Web Push from DO state changes)                       │
│  api.anipotts.com (Hono router exposing DOs as REST + WS)       │
│  apps/www tile widgets (live status bar, pulled from DOs)       │
└─────────────────────────────────────────────────────────────────┘
```

Anyone in the input plane can mutate state. The state plane is the only thing both planes touch (input writes, output reads). The output plane is realtime by construction; nothing polls.

## Stack choices

| Layer                  | Choice                                                                                                                   | Why                                                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend (admin)       | **SolidStart** + Cloudflare adapter                                                                                      | New for Ani (he has Next/React fatigue, has touched Svelte at Structured AI). Solid signals model = compute graph that reacts to inputs, native fit for "here are 30 cells, each subscribed to a different DO field" |
| Backend (state)        | **Hono** on Cloudflare Workers, **Bun runtime** for build/dev                                                            | Hono is Worker-native, tiny, integrates with DOs in a few lines, has clean types. Bun for speed in build/dev. Production runtime is workerd via `wrangler deploy`.                                                   |
| State store            | **Cloudflare Durable Objects**                                                                                           | Per-instance compute + storage with built-in WebSocket support. Strongly consistent. Single-writer per DO, multi-reader. Replaces both Redis and SSE-via-mini                                                        |
| Archive                | **D1** (existing `anipotts-db`)                                                                                          | Already exists, already wired to ingest + admin. DOs snapshot here on schedule for query/restore                                                                                                                     |
| Blob                   | **R2**                                                                                                                   | Free egress. Stores OG images, screenshots, brand assets, Logpush dumps                                                                                                                                              |
| AI primitives          | **Workers AI** + **Vectorize** + **AI Gateway**                                                                          | Edge inference for small models (classify emails, embed posts), vector search for "what was I working on March 14," provider routing for Claude/OpenAI/etc                                                           |
| Auth                   | **CF Access** for admin (already in use), API tokens for agents (rotate via Workers Secrets)                             | No new auth vendor needed                                                                                                                                                                                            |
| Email in/out           | **Email Workers** (in), **Email Workers `send_email` binding** (out, replaces Resend per PR #30)                         | Already planned; this fits the same model                                                                                                                                                                            |
| iPhone integration     | **Apple Shortcuts** → Worker, **Web Push** from DO events                                                                | No new app needed; Shortcuts gives voice + share-sheet + automation                                                                                                                                                  |
| Browser-side rendering | **Workers Browser Rendering**                                                                                            | OG image generation, screenshot-as-a-service, headless tasks                                                                                                                                                         |
| Observability          | **Workers Logs** (free), **Logpush to R2** (cheap retention), **Sentry on Workers** (errors), **CF Web Analytics** (RUM) | Already planned in `cloudflare-infrastructure.md`                                                                                                                                                                    |

## Rudy's role (the keystone)

Rudy is no longer a side project. Rudy is the **human-facing input/output of the entire personal cloud** for the iMessage channel, with proactive intelligence layered on top.

Existing Rudy infra (per `~/.claude/rules/ani-infra-map.md` "Rudy Phase 1.5" section, all Mini-resident):

- Code: `/Users/rudy/Code/projects/rudy/channel/server.ts`
- Launcher: `/Users/rudy/bin/rudy-launcher.sh`
- Plist: `/Users/rudy/Library/LaunchAgents/com.anipotts.rudy.plist`
- MCP config: `/Users/rudy/.rudy/mcp.json`
- Logs: `/Users/rudy/Library/Logs/rudy/`
- Persona: `/Users/rudy/.rudy/persona.md`
- Allowlists: `~/.rudy/{allow.txt,friends.txt}`
- Architecture: launchd → tmux socket `-L rudy` → `claude` CLI with channel server → bun MCP child watching `chat.db` → emits `notifications/claude/channel` events → Opus 4.7 (1M context, Max plan) → `reach_out` via osascript

What changes for Rudy in this architecture:

| New capability                   | Implementation                                                                                                                                                                       | Tier scope                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `state.read(do_name, query)`     | New MCP tool in `~/.rudy/mcp.json`. Calls Worker REST endpoint with API token.                                                                                                       | SELF + FRIENDS (read-only, hides sensitive DOs)  |
| `state.write(do_name, mutation)` | New MCP tool. Calls Worker REST. Auth: SELF tier only.                                                                                                                               | SELF only                                        |
| `state.subscribe(do_name)`       | New MCP tool. Opens WS to a DO, surfaces events back to Rudy's prompt context.                                                                                                       | SELF only                                        |
| Proactive nudges                 | New bun process on Mini (`/Users/rudy/Code/projects/rudy/proactive/server.ts`). Subscribes to DO event streams. Decides when to send Ani an iMessage based on configurable policies. | SELF only (Ani's Apple ID handles + `allow.txt`) |

Friends-tier semantics stay exactly the same as today: chat-only, no DO mutation, no `state.*` write tools, only `reach_out` allowed.

Proactive policy examples (configurable in `~/.rudy/proactive.policy.yml`, owner-edited):

- `SymphonyMonitor` emits `pr_merged_p0_closed` → Rudy texts: "QUA-47 closed, P0 down to zero. Want me to draft a 'shipped today' atom?"
- `BrandDeals` emits `new_email_match` → Rudy texts: "Email from Viral Nation looks like next deal confirmation. Reply yes to add to ContentPipeline."
- `Inbox` emits `unread_link_count > 10` → Rudy texts at 8pm: "10 saved links sitting unread. Want to triage 3 of them now?"
- `MoneyState` emits `mrr_milestone_crossed` → Rudy texts the new MRR figure with a cheer.

All proactive nudges are **suggestions** unless the policy is explicitly marked `safe-action`. Drafting an email is never auto-action. Saving a link to a DO bucket on Ani's instruction is.

## Mac Mini's new role

Today Mini is "the always-on server hosting the http API." That couples user-visible uptime to Mini's uptime.

Tomorrow Mini is **a publisher** plus **the Rudy host**. It produces events and pushes them to a Cloudflare Worker. It does not host an http API that any user-facing client depends on.

What stays on Mini:

- Rudy server + bun MCP child (the iMessage channel)
- Rudy proactive subsystem (new)
- Symphony daemon (autonomous Quantercise loop)
- The 21 launchd jobs (`com.pro.*` + `com.anipotts.rudy.*`) producing data
- `cloudflared` tunnel for the (now-rare) cases that need direct Mini access
- Tailscale node `ap-mini`

What gets removed/downgraded on Mini:

- `~/Code/active/mini-api` http server on port 3456: stops being the user-facing API. The same code can stay running for a transition period, but new admin code never calls it. Eventually delete.
- The `*.mini.anipotts.com` wildcard DNS record on Cloudflare: replaced by explicit `api.mini.anipotts.com` (only one in use) → Universal SSL covers it free → cancel ACM ($10/mo saving). See `cloudflare-infrastructure.md` for the ACM analysis.

What Mini publisher daemons look like:

```ts
// /Users/rudy/Code/projects/anipotts-publisher/src/index.ts
// Runs as a launchd job under com.anipotts.publisher.<name>.plist.
// Each job watches a specific local source and POSTs to the ingest worker.

import { mintToken } from "./lib/auth";

async function publish(event: {
  source: string;
  type: string;
  payload: object;
}) {
  await fetch("https://anipotts-ingest.anipotts.workers.dev/events", {
    method: "POST",
    headers: {
      "X-Ingest-Key": mintToken(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });
}

// Example: forward git commits across all ~/Code/projects/* watched repos
// Example: forward system stats from claude-stats / disk-monitor / etc
// Example: forward Symphony agent state changes
```

If the publisher fails (Mini offline, network blip), events queue locally and replay when connectivity returns. Idempotency keys on each event so the ingest worker can dedupe.

## iPhone integration

Apple Shortcuts is the lever. Two patterns:

1. **Voice query**: Siri → Shortcut → Worker GET endpoint → returns text → Siri speaks it. Examples: "what's my MRR," "what's symphony doing," "what links did I save today."
2. **Share-sheet write**: any app's share sheet → Shortcut → Worker POST endpoint → mutates DO. Examples: "save this tweet to Inbox," "queue this URL for the chained-chat-redesign series."

Web Push from CF Worker → APNs → iPhone notification. Triggered by DO events policy-matched against a per-device subscription. Examples: brand deal email matched, Symphony milestone, content publish confirmed.

iMessage stays the conversational interface (Rudy). Shortcuts is the verb-only interface (no chat, just commands). Both feed into the same DOs.

## What from current infra merges, keeps, kills

(Authoritative table; supersedes the smaller table in the previous section.)

| Existing thing                                                                                 | Action                       | Reasoning                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rudy Phase 1.5** (Mini, bun MCP, Opus 4.7, allowlist, persona)                               | **KEEP + EXTEND**            | Becomes the human-facing input/output. Add `state.read/write/subscribe` tools. Add proactive subsystem.                                                                      |
| **`packages/lib/src/mini/{stream.ts,client.ts}`** (admin's REST + SSE clients into Mini)       | **KILL eventually**          | Replaced by WebSocket connections from admin-solid to DOs. Keep during transition window so existing admin keeps working.                                                    |
| **`services/mini-api.ts`** (declarative service manifest)                                      | **DOWNGRADE**                | Mini stops being a server. Manifest can shrink to "the rudy + publishers run here" rather than "this http service exists."                                                   |
| **`~/Code/active/mini-api`** (http server on Mini, port 3456)                                  | **EVENTUALLY KILL**          | After admin-solid + DOs reach parity for every endpoint Mini exposes. Until then, keep running for backward compat.                                                          |
| **`workers/ingest`** (cron, every minute, hits Mini /health, writes D1)                        | **EXPAND**                   | Becomes the receiver for Mini publisher events. Existing rollups stay. New endpoint `POST /events` for publishers. Continues writing to D1; also calls into the relevant DO. |
| **`workers/weekly-email`**                                                                     | **KEEP unchanged**           | Cron job that reads from D1 and sends weekly email. Independent.                                                                                                             |
| **D1 `anipotts-db`**                                                                           | **KEEP**                     | The durable archive. DOs snapshot here on schedule. Existing tables stay.                                                                                                    |
| **Rudy's launchd jobs on Mini** (browser-history, sync, system-state)                          | **KEEP, REROUTE OUTPUTS**    | Same scripts, but they POST to ingest instead of writing local files. Last hop becomes "publish event" not "write to disk."                                                  |
| **`apps/admin`** (Next 16 + OpenNext, polling REST/SSE to Mini)                                | **REWRITE in parallel**      | Build `apps/admin-solid` alongside on `admin-v2.anipotts.com`. Migrate tile-by-tile. When admin-v2 has full parity, swap DNS, delete `apps/admin`. No big-bang rewrite.      |
| **`@anipottsbuilds` content system** + Postiz + Typefully + Buttondown                         | **KEEP, ADD WEBHOOKS**       | Each integration emits webhooks → ingest worker → `ContentPipeline` DO. Dashboard tile flips on publish. No polling.                                                         |
| **Symphony daemon** (Mini, autonomous Quantercise loop)                                        | **KEEP, ADD EVENT EMISSION** | Emits status events → `SymphonyMonitor` DO. Admin sees live agent state without ssh.                                                                                         |
| **D1 tables**: `business_data`, `daily_rollups`, `analytics_events`, `thoughts`, `atoms`, etc. | **KEEP**                     | DO snapshots write here. Reads continue to work.                                                                                                                             |
| **email-labeler** (`~/Content/tools/email-labeler/`)                                           | **EXTEND**                   | Labeled emails optionally trigger ingest worker → updates relevant DO (brand deal email → `BrandDeals` DO). Existing dual-write to YAML + D1 stays.                          |
| **iMessage MCP + cc plugin** (Rudy's transport)                                                | **KEEP unchanged**           | Rudy's whole transport layer stays. New `state.*` MCP tools added.                                                                                                           |
| **`*.mini.anipotts.com` wildcard DNS**                                                         | **KILL**                     | Replace with explicit `api.mini.anipotts.com` record. Universal SSL covers it free. Cancels ACM ($10/mo).                                                                    |
| **Cloudflare Tunnel `cloudflared-mini-api.plist`**                                             | **KEEP**                     | Exposes Mini for the rare ssh-via-domain case + transition-window backstop for old admin REST/SSE.                                                                           |
| **Workers Cron Triggers**                                                                      | **NEW**                      | Replace any remaining "X polls Y" pattern with cron + DO mutation.                                                                                                           |
| **Workers Logs** (`[observability] enabled = true` in every wrangler.toml)                     | **NEW (planned)**            | Per `cloudflare-infrastructure.md` adoption list.                                                                                                                            |
| **CF Web Analytics**                                                                           | **NEW (planned)**            | Per `cloudflare-infrastructure.md`.                                                                                                                                          |

## Build order (small honest steps)

Each step is a weekend or less. Each is shippable on its own.

1. **`workers/state` with one DO: `LinkVault`.** ~50 lines. WebSocket endpoint that streams the current list of links and broadcasts mutations. CLI script to test from terminal. Proves the pattern.
2. **Add `state.write` tool to Rudy.** New MCP tool wired into `~/.rudy/mcp.json`. SELF-tier auth check. Now you can text Rudy "save https://..." and watch the DO update via `wrangler tail`. Proves the input plane.
3. **`apps/admin-solid` skeleton with one component: `<LinkVault />`.** SolidStart static build deployed to a Worker. Opens WebSocket to `LinkVault` DO. Renders live list. (This is when you find out whether you love Solid; it's also a recoverable bet because the rest of the architecture doesn't depend on it.)
4. **Mini publisher daemon for one event type** (commits in `~/Code/projects/**` is a good starter). New launchd job under `com.anipotts.publisher.commits.plist`. POSTs to ingest worker. Ingest writes to a new `CodeStats` DO. Add `<CommitFeed />` component to admin-solid. Proves the publisher pattern.
5. **Proactive subsystem v0.** New bun process on Mini (`~/Code/projects/rudy/proactive/server.ts`). Watches `CodeStats` DO. Texts you via Rudy when "first commit of the day" event fires. Proves the proactive pattern. Limit: SELF tier only, single hardcoded policy.
6. **iPhone Shortcut: "what's my MRR"** + corresponding worker endpoint + `MoneyState` DO. Trivial after steps 1-3 are done. Proves the iPhone integration pattern.

After step 6, all four patterns work end to end. Everything that comes later (more DOs, more admin tiles, more proactive policies, more Shortcuts, OG image generation, email mutators, etc.) is _additive_. No more architectural reach.

## Build alongside, not big-bang

Ani's decision (2026-05-13): build `apps/admin-solid` alongside `apps/admin`, migrate one tile at a time. When `admin-v2` has parity, swap DNS, delete `apps/admin`. No big-bang rewrite, no maintenance window.

Worker name: `anipotts-admin-v2` (or just `anipotts-admin-solid`).
Hostname: `admin-v2.anipotts.com` during transition. Swap to `admin.anipotts.com` at parity.
Auth: CF Access, same group as current admin.

## What this is not

- It is not a refactor of every existing repo. The 9-project Vercel migration (`docs/per-project-vercel-migration.md`) is unrelated to this; those are domain moves, not architectural moves.
- It is not a new product. It's personal infra. If it spawns a productized version later, that's downstream of using it for a year.
- It is not "rip out everything tomorrow." It's strictly additive (new workers, new DO classes, new admin app) with one explicit kill (`*.mini.anipotts.com` wildcard) that's purely a billing/cleanup move.
- It is not Workers Realtime (audio/video calls). Explicitly deferred per Ani's call (2026-05-13).
- It is not a replacement for any external SaaS Ani actually pays for. Stripe stays Stripe. Linear stays Linear. PostHog stays PostHog. The DO graph subscribes to webhooks from these and exposes them as live state, not as substitutes.

## Open questions to settle before step 1

- **Token format for agent auth on `api.anipotts.com`.** Per-agent token stored in `wrangler secret`? JWT signed by a Worker? Decide before adding the Hono router.
- **DO snapshot cadence to D1.** Per-mutation? Hourly? Per-DO config? Affects D1 row growth and cold-start hydration time.
- **WebSocket reconnect strategy.** Native browser WS auto-reconnects badly. Use a small client lib like `partysocket` or write our own. Decide before admin-solid step 3.
- **Where `apps/admin-solid` lives.** Inside the anipotts.com monorepo (`apps/admin-solid`) or in a sibling repo (`anipotts/admin-solid`)? Monorepo is consistent with current pattern; sibling avoids Next 16 + Solid + Tailwind v4 toolchain conflicts in one workspace. Lean: monorepo (Solid has Tailwind v4 support; turborepo handles separate framework apps cleanly).
- **Who hosts the proactive subsystem.** Mini (next to Rudy) keeps the dependency contained; a separate Worker (cron-driven) is more reliable but loses the local context the Mini has. Lean: Mini for v0 (simpler), revisit if Mini reliability becomes a constraint.

## Cross-references

- Deploy substrate + repo-level adoption + monitoring posture: `docs/cloudflare-infrastructure.md`
- Per-project Vercel exit plan for 9 domain-bearing projects: `docs/per-project-vercel-migration.md`
- Current state of all in-flight PRs (this repo): see open PRs #40, #41, #42 + cross-account `wigglesburg.com` PR #1 (first migration)

## Update rule

When you ship something that changes any plane (a new DO class, a new publisher, a new admin tile, a new Rudy tool), update this doc in the same PR. The doc is the canonical mental model; if it drifts from reality, throw away whichever is wrong.
