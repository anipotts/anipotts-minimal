# worker inventory

Last reviewed: 2026-06-29

This inventory supports the platform cleanup goal: retain only production
workers that have an explicit role, route or trigger, deploy target, and risk
gate. It records evidence without secrets.

Read-only checks used for this pass:

- `pnpm exec wrangler --version`: 4.92.0
- `pnpm exec wrangler whoami`: authenticated as `hello@anipotts.com` for the
  `anipotts` account
- `pnpm exec wrangler versions list --config <worker>/wrangler.toml`: version
  history exists for every retained worker
- `curl` route probes:
  - `https://anipotts-ingest.anipotts.workers.dev`: 200
  - `https://anipotts-newsletter-worker.anipotts.workers.dev`: 200
  - `https://api.anipotts.com/health`: 200
  - `https://api.anipotts.com/`: 200
  - `https://anipotts-weekly-email.anipotts.workers.dev`: 200

## retained workers

| Worker                 | Cloudflare name              | Trigger or route                                                   | Data boundary                                                                                                                           | Current classification    | Next cleanup action                                                                                          |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `workers/ingest`       | `anipotts-ingest`            | workers.dev fetch plus `* * * * *` cron                            | writes allowlisted rows into `anipotts-db`; scoped brand ingest key only writes `brands_email`; broader ingest uses the mini ingest key | keep                      | keep as production ingest plane until D1/admin feed writers are split and source-specific replacement exists |
| `workers/newsletter`   | `anipotts-newsletter-worker` | queue consumer for `newsletter-send`, workers.dev fetch health     | sends confirmation and issue email through Resend when configured; records newsletter events in D1                                      | keep, outbound-send gated | keep while newsletter subscription and issue delivery remain worker-backed                                   |
| `workers/state`        | `anipotts-state`             | `api.anipotts.com` custom domain, REST, WebSocket, Durable Objects | read routes are public metadata; write routes require `STATE_PUBLISH_KEY`; Durable Objects hold link and code state                     | keep                      | keep as state plane for admin/fleet work; do not expand write routes without route-level proof               |
| `workers/weekly-email` | `anipotts-weekly-email`      | workers.dev fetch plus Sunday cron                                 | reads D1, optional Mercury and mini metadata, sends or queues weekly summary email through Resend                                       | keep, outbound-send gated | keep until weekly summary is either retired or folded into the newsletter/content system with proof          |

## deploy target mapping

| Worker                 | Deploy input        | Auto path                 | Local check                                           |
| ---------------------- | ------------------- | ------------------------- | ----------------------------------------------------- |
| `workers/ingest`       | `ingest=true`       | `workers/ingest/**`       | `pnpm --filter @anipotts/ingest typecheck`            |
| `workers/newsletter`   | `newsletter=true`   | `workers/newsletter/**`   | `pnpm --filter @anipotts/newsletter-worker typecheck` |
| `workers/state`        | `state=true`        | `workers/state/**`        | `pnpm --filter @anipotts/state typecheck`             |
| `workers/weekly-email` | `weekly_email=true` | `workers/weekly-email/**` | `pnpm --filter anipotts-weekly-email typecheck`       |

`scripts/ci/compute-deploy-targets.mjs` keeps worker deploys exact. Worker README
changes and docs-only changes do not deploy.

## deletion criteria

Do not delete a worker only because its code feels old. Delete or archive a
worker only after current evidence proves all of these are true:

- no production route, cron, queue consumer, or durable object binding still
  depends on it
- no public, admin, D1, newsletter, or external account workflow still calls it
- replacement app or worker has been deployed and smoke tested
- rollback is documented if the worker held production state or outbound send
  responsibility
- deploy workflow inputs, path filters, workspace inventory tests, docs, and
  Cloudflare routes are updated in the same cleanup lane

## current conclusion

No worker is safe to delete in this pass. The right next step is to keep all
four retained workers documented, finish passkey proof and admin cutover, then
revisit `workers/weekly-email` and `workers/newsletter` once the newsletter
content system decides whether weekly/operator email remains live.
