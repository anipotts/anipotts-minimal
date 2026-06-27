# anipotts-com agent guide

`AGENTS.md` is a symlink to this file. Codex and Claude use the same project
contract.

## ownership

This repo owns:

- `anipotts.com`: public Astro site in `apps/www`
- `admin.anipotts.com`: target Astro admin app in `apps/admin`
- transitional admin worker in `apps/admin-solid`
- legacy/reference surfaces in `apps/labs` and retained `workers/*`
- shared code in `packages/*`

Agents should move this repo forward. Do the work, verify it, commit it, push
it, open or update the PR, merge when the lane allows it, and deploy only the
approved target.

## current standing authority

Ani approved these standing lanes on 2026-06-27.

### admin lane

For admin UI, feed, content review, auth staging, and operator-dashboard work:

- branch or update the current PR
- mark ready once required checks are green
- merge after green checks
- deploy only the affected admin target
- record deploy run, skipped targets, and route proof

`apps/admin-solid` is transitional. Move parity into `apps/admin`, prove it, then
archive or remove `apps/admin-solid`.

Approved includes reviewed D1 migrations needed by the green PR, passkey auth
rollout, and Cloudflare Access removal after passkey proof.

### public-site lane

For `apps/www` copy, layout, static content, accessibility, route, and
presentation work:

- branch or update the current PR
- mark ready once required checks are green
- merge after green checks
- deploy `www=true` only
- record deploy run and route proof

### docs lane

Docs-only changes may merge after green checks. They should not run app deploy
targets.

## passkey and Access sequence

For `admin.anipotts.com`, use this order:

1. merge the reviewed passkey PR
2. apply its reviewed D1 migration to `anipotts-db`
3. deploy `admin_solid=true` only
4. prove passkey register, login, logout, session persistence, and blocked
   failure paths
5. prove `/auth/passkey`, `/`, `/content`, `/content/review`, and `/needs-ani`
6. remove Cloudflare Access only after proof passes
7. verify app-native unauthenticated block and authenticated passkey access
8. rollback by restoring the previous Access app or policy if proof fails

Do not remove Access before app-native passkey proof exists.

## hard stops

These still need exact current authority for the exact action:

- force-push, history rewrite, hook bypass, or destructive cleanup
- printing secrets or private payloads
- editing `.env*`, secret values, account credentials, payment, filing, or
  legal/contract surfaces
- source or personal deletes
- health-data mutation or `/Users/ojas` mutation
- legacy admin, worker, newsletter-send, ingest, approval-bridge, outbound
  message, publish-write, live-control, root, launchd, endpoint, or production
  collector changes outside an approved lane

If work mixes a safe lane and a hard stop, split it. Ship the safe lane and
leave the hard stop explicit.

## verification

Use the narrowest command that covers the diff.

```bash
pnpm turbo typecheck --filter=@anipotts/www...
pnpm turbo build --filter=@anipotts/www...
pnpm turbo typecheck --filter=@anipotts/admin-solid...
pnpm turbo build --filter=@anipotts/admin-solid...
pnpm validate
```

For deploys, record:

- PR number and merge SHA
- deploy workflow run URL
- which deploy target ran
- skipped target proof
- route proof
- live impact

## product direction

Public site code should become stable. More public text and project copy should
move into structured content that admin can review, draft, preview, and later
publish through an authorized write path.

Admin should become one Astro app for content, fleet state, proof, repo status,
handoffs, blockers, and future editing. Current Solid admin work is migration
source, not the long-term home.

See `docs/platform-architecture.md` for the current inventory and cleanup map.

## style

Public copy should sound like Ani: direct, specific, terse, and grounded in real
work. Avoid generic startup copy, guru tone, unsupported hype, rhetorical
questions, fake vulnerability, and exactly-three-item cadence.

No em dashes in human-facing copy. Never use `git add .` or `git add -A`.
