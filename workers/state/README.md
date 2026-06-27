# @anipotts/state

State worker for the personal cloud. Hosts Durable Objects that hold one fact each (LinkVault, MoneyState, ContentPipeline, etc.) and exposes a Hono REST + WebSocket API at `api.anipotts.com`.

This is **step 1** of the personal-cloud-architecture build (see `docs/personal-cloud-architecture.md`). The first DO is `LinkVault`. More DOs get added one class at a time as they're needed.

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

The full vision lives at `docs/personal-cloud-architecture.md` in the same monorepo. TL;DR: this worker is the state plane. Inputs (Rudy, email, webhooks, admin) write here. Outputs (admin, iPhone, Rudy, agents) read here via WebSocket so nothing polls.
