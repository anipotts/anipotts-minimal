# @anipotts/admin-solid

Current protected admin control-plane shell for `admin.anipotts.com`.

This app is read-only first. It renders the fleet/admin feed model:

`intent / authority / operation / proof / state`

## current role

- practical operator dashboard for Ani and agents
- protected by Cloudflare Access at `admin.anipotts.com`
- static feed copy from Infra for committed sample state
- local-dev runtime loader for safe metadata overlays
- no admin write path, content save path, deploy trigger, DNS control, secret
  editor, or approval bridge execution path

## routes

| route              | purpose                                               |
| ------------------ | ----------------------------------------------------- |
| `/`                | safe-next-action overview and feed coverage           |
| `/needs-ani`       | typed human syscall queue and future bridge contract  |
| `/mutations`       | proposed, approved, running, verified, blocked states |
| `/fleet`           | machine and agent operation placeholders              |
| `/repos`           | static repo state plus local-dev runtime overlays     |
| `/handoffs`        | handoff absorption and owner routing                  |
| `/ops/destructive` | proof-backed destructive operation gates              |

## data

- static sample: `src/data/static/admin-feed.sample.json`
- adapter: `src/data/control-plane.ts`
- bridge design only: `src/data/approval-bridge.ts`
- local runtime endpoint: `/api/admin/runtime-feed`
- runtime source path:
  `/Users/anipotts/Infra/state/runtime/admin/admin-feed.current.json`

Runtime overlays are metadata-only. They must not include dirty filenames, file
contents, secret values, health payload rows, private messages, message ids, or
dollar amounts.

## commands

```bash
pnpm --filter @anipotts/admin-solid dev
pnpm --filter @anipotts/admin-solid typecheck
pnpm --filter @anipotts/admin-solid build
```

## deploy

Deploys go through the repo-level path-filtered GitHub Actions workflow. Do not
run `wrangler deploy` manually unless Ani has approved that exact action.

The deploy target is `anipotts-admin-solid`; its custom domain route is
`admin.anipotts.com`.

## gates

Allowed without fresh authority after normal PR review and checks:

- read-only routes
- feed adapters
- static sample rendering
- local-dev metadata overlays
- layout and usability improvements

Requires fresh authority:

- content writes
- deploy triggers from the UI
- approval bridge execution
- Cloudflare Access changes
- DNS changes
- env or secret changes
- production collector changes
- account or payment actions

## v2 direction

The next admin direction is Astro-aligned and sidebar-first. See
`docs/admin-v2-architecture.md`.
