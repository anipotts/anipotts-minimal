# @anipotts/state

State worker for the personal cloud. Hosts Durable Objects that hold one fact each (LinkVault, MoneyState, ContentPipeline, etc.) and exposes a Hono REST + WebSocket API at `api.anipotts.com`.

This is the retained state-plane worker for `api.anipotts.com`. The current repo
architecture lives in `docs/platform-architecture.md`. The older May 2026
personal-cloud sketch is archived at
`docs/archive/personal-cloud-architecture-2026-05-13.md`.

## Quick start

```bash
pnpm install
pnpm --filter @anipotts/state dev
# in another terminal
pnpm --filter @anipotts/state test:cli http://localhost:8787
```

## Endpoints

| Method | Path             | What                                                                                            |
| ------ | ---------------- | ----------------------------------------------------------------------------------------------- |
| GET    | `/`              | Service info                                                                                    |
| GET    | `/health`        | Liveness                                                                                        |
| GET    | `/api/links`     | List all saved links (REST)                                                                     |
| POST   | `/api/links`     | Save a link. Body: `{ url, title?, tag?, note?, source? }`                                      |
| DELETE | `/api/links/:id` | Remove a link                                                                                   |
| GET    | `/api/links/ws`  | WebSocket. Receives `snapshot` on connect, then `link.added` / `link.removed` on every mutation |

## Deploy

```bash
pnpm --filter @anipotts/state exec wrangler deploy
```

Production is bound to `api.anipotts.com` by the `[[routes]]` block in
`wrangler.toml`. Agent PRs that touch `workers/state/**` deploy through the
explicit `state=true` deploy target.

## Adding a new DO

1. New file at `src/do/<name>.ts` exporting a class extending `DurableObject`.
2. Export it from `src/index.ts`.
3. Add `[[durable_objects.bindings]]` and `[[migrations]]` (with `new_sqlite_classes`) to `wrangler.toml`.
4. Add Hono routes that proxy to the DO.

## Architecture

The current source truth is `docs/platform-architecture.md`. This worker is the
retained state plane for future operator state, fleet state, and WebSocket/DO
work. Inputs and write paths still need explicit route-level authority before
they become live controls.
