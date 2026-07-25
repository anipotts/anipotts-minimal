# anipotts-com agent guide

`AGENTS.md` is a symlink to this file. Codex and Claude use the same project
contract.

## ownership

This repo owns:

- `anipotts.com`: public Astro site in `apps/www`
- `admin.anipotts.com`: target Astro admin app in `apps/admin`
- legacy admin rollback worker in `apps/admin-solid`
- archived labs reference material in `docs/archive/labs` and retained
  `workers/*`
- shared code in `packages/*`

Agents should move this repo forward. Do the work, verify it, commit it, push
it, open or update the PR, merge when the lane allows it, and deploy only the
approved target.

## automation posture

Do not add or restore GitHub workflows that call Anthropic, Claude Code, or
other external LLM review APIs for this repo. Ani disabled those on 2026-06-27
to avoid unnecessary Claude API spend. `security-review.yml` is local static
checking only: sensitive path detection, literal-secret scans, banned external
LLM review hooks, and destructive migration guards. It must not call Claude,
Anthropic, or any paid model API. Real safety comes from small scoped diffs,
local checks, CodeRabbit/GitHub signals, focused human review when needed, and
deploy proof.

Primary workflows are intentionally limited to:

- `ci.yml`
- `security-review.yml`
- `agent-automerge.yml`
- `deploy.yml`
- `smoke.yml`

Do not add separate Dependabot automerge, external review, production
promotion, or broad deploy workflows. Dependency updates should pass through
the same PR checks and scoped deploy logic as other changes.
`apps/labs` is archived and is not a deploy target.

## current standing authority

Ani approved these standing lanes on 2026-06-27.
Ani removed the normal branch-protection/PR gate on 2026-06-30 for faster solo
iteration. For the lanes below, prefer direct verified commits to `main` when
the worktree is clean, the diff is scoped, and local checks pass. Use a branch
or PR only when the change is risky, unclear, blocked by GitHub permissions, or
Ani asks for review.

### admin lane

For admin UI, feed, content review, auth staging, and operator-dashboard work:

- commit verified scoped changes directly to `main` when safe
- deploy only the affected admin target
- record deploy run, skipped targets, and route proof

`apps/admin-solid` is legacy rollback. Keep it only until the Astro admin
cutover and passkey proof are complete, then archive or remove it. It is not a
normal auto-deploy target; use the explicit manual `admin_solid=true` deploy
input only for rollback.

Approved includes reviewed D1 migrations needed by the checked change, passkey
auth rollout, and Cloudflare Access removal after passkey proof.

### public-site lane

For `apps/www` copy, layout, static content, accessibility, route, and
presentation work:

- commit verified scoped changes directly to `main` when safe
- deploy `www=true` only
- record deploy run and route proof

### docs lane

Docs-only changes may commit directly to `main` after formatting/basic checks.
They should not run app deploy targets.

## passkey and Access sequence

For `admin.anipotts.com`, use this order:

1. merge the reviewed passkey PR
2. apply its reviewed D1 migration to `anipotts-db`
3. deploy `admin=true` only
4. prove passkey register, login, logout, session persistence, and blocked
   failure paths
5. prove `/auth/passkey`, `/`, `/content`, `/content/review`,
   `/content/drafts`, `/content/edit/home`,
   `/api/admin/content/draft-operation`, `/content/preview`,
   `/content/operations`, `/newsletter`,
   `/newsletter/first-thing-agents-need-control-plane`, `/inbox`, `/proof`, and
   `/deploys`
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
pnpm turbo typecheck --filter=@anipotts/admin...
pnpm turbo build --filter=@anipotts/admin...
pnpm turbo typecheck --filter=@anipotts/admin-solid...
pnpm turbo build --filter=@anipotts/admin-solid...
pnpm validate
```

## local admin preview

The canonical local review URL is `http://localhost:4311/`.

Start or reuse the durable preview with:

```bash
pnpm admin:preview:ensure
```

Check it with `pnpm admin:preview:status`. Stop it only when Ani explicitly
ends the feedback loop, using `pnpm admin:preview:stop`. Do not start an ad hoc
Astro process on a different port for admin review, and do not stop the managed
preview merely because an individual Codex task is ending.

The manager records only local process metadata and logs under ignored
`.local/admin-preview/`. It refuses to stop an unrecognized process or replace
an unrelated listener on port 4311.

`pnpm validate` mirrors the local PR gate: workspace/deploy/admin/public/path
invariants, content platform invariants, workflow/security guards, formatting,
and full build/lint/typecheck/test.

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

Pure public content defaults, normalizers, validators, page-key helpers, and
homepage summary helpers live in `@anipotts/content/public`. D1-backed readers
and search functions stay in `@anipotts/lib/cms`.

Admin should become one Astro app for content, fleet state, proof, repo status,
handoffs, blockers, and future editing. Current Solid admin work is migration
source, not the long-term home.

See `docs/platform-architecture.md` for the current inventory and cleanup map.

## style

Public copy should sound like Ani: direct, specific, terse, and grounded in real
work. Avoid generic startup copy, guru tone, unsupported hype, rhetorical
questions, fake vulnerability, and exactly-three-item cadence.

No em dashes in human-facing copy. Never use `git add .` or `git add -A`.
