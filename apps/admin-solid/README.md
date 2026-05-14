# @anipotts/admin-solid

SolidStart admin (v2) for the personal cloud. Subscribes to Durable Objects in `@anipotts/state` over WebSockets so the dashboard updates in real time without polling.

This is **step 3** of the personal-cloud-architecture build (see `docs/personal-cloud-architecture.md`). Built alongside the existing `apps/admin` (Next.js) at `admin-v2.anipotts.com`. Tile-by-tile parity, then DNS swap to `admin.anipotts.com` and the Next admin retires.

## Quick start

```bash
pnpm install
# In one terminal:
pnpm --filter @anipotts/state dev
# In another:
pnpm --filter @anipotts/admin-solid dev
# Open http://localhost:3001
```

## Routes

| Route | Component                                     |
| ----- | --------------------------------------------- |
| `/`   | `LinkVaultPanel` (live links list, save form) |

## Adding a panel

1. Create `src/components/<Panel>.tsx` that opens a `StateClient` against `/<do>/ws` on the state worker.
2. Drop it into a route under `src/routes/`.
3. The panel gets live updates via the WebSocket; mutations go via REST POST to the same worker.

## Deploy

```bash
pnpm --filter @anipotts/admin-solid exec wrangler deploy
```

After deploy, hostname is `https://anipotts-admin-solid.<account>.workers.dev`. To bind to `admin-v2.anipotts.com`, uncomment the `[[routes]]` block in `wrangler.toml` once the zone is in CF.

## Architecture

The full vision: `docs/personal-cloud-architecture.md` in the same monorepo.
