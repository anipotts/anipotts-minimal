# anipotts-com agent guide

This repo owns the public site and the protected admin UI. It should be easy
for Codex and Claude Code to build, verify, merge, and deploy ordinary public
site work while keeping admin control paths on stricter authority.

`AGENTS.md` is a symlink to this file. Keep them equivalent.

## source truth

- Public site code: `apps/www`
- Protected admin UI: `apps/admin-solid`
- Legacy admin: `apps/admin`
- Shared data and helpers: `packages/lib`, `packages/styles`, `packages/config`
- Cloudflare Workers: `workers/*`
- Content operations: `~/Content`, not this repo
- Fleet state: `~/Infra/coord`, handoffs, registries, and admin feed files

The target direction is that text content on `anipotts.com` becomes editable
through `admin.anipotts.com`, so routine wording changes move toward admin data
or content records instead of recurring source deploys.

## commands

```bash
pnpm dev
pnpm turbo dev --filter=@anipotts/www
pnpm turbo dev --filter=@anipotts/admin-solid
pnpm build
pnpm typecheck
pnpm test
pnpm validate
```

Use narrower package checks when the diff is scoped:

```bash
pnpm turbo typecheck --filter=@anipotts/admin-solid...
pnpm turbo build --filter=@anipotts/admin-solid...
pnpm turbo typecheck --filter=@anipotts/www...
pnpm turbo build --filter=@anipotts/www...
```

## architecture

- `apps/www`: Astro 5 site on Cloudflare Workers.
- `apps/admin-solid`: current admin control plane behind Cloudflare Access.
- `apps/admin`: older admin surface kept for compatibility while replacement
  work continues.
- `apps/labs`: labs subdomain.
- `workers/ingest`, `workers/state`, `workers/weekly-email`: Cloudflare
  worker services.
- `packages/lib`: shared D1, admin feed, metrics, CMS, validation, and status
  helpers.

The admin control plane is read-only first. It may render `NEEDS-ANI`, repo
state, fleet state, stale rule drift, live gates, proof paths, and future
content-editor previews. Admin write paths, production collectors, control
buttons, outbound sends, and account mutations require separate authority.

## permission model

Public site lane:

- Agents may proactively create branches and PRs for safe content, copy, route,
  layout, accessibility, and visual polish work.
- Agents may run checks, commit, push, mark PRs ready, and merge when required
  checks pass and the diff stays inside public site presentation or static
  content.
- Public site deploys from approved merges are normal when path-filtered CI
  selects `apps/www`.
- Do not use code edits as the permanent answer when the same wording should
  become admin-editable content.

Admin read-only lane:

- Agents may proactively branch and PR read-only admin UI, schema display,
  static feed rendering, local-dev runtime metadata, and proof views.
- Agents may merge and deploy read-only admin UI only when the PR is approved,
  checks pass, and the deploy target is limited to the intended admin worker.
- The current live protected admin target is `apps/admin-solid` on
  `admin.anipotts.com`.
- Admin v2 should stay Astro-aligned and sidebar-first, with interactive islands
  only where live state needs them.

Admin control lane:

- Any write path, content save, deploy trigger, approval bridge, external send,
  account action, collector change, or live control button needs exact current
  authority.
- Authority must name the operation, allowed surface, forbidden actions, proof
  requirement, and rollback or stop path.
- Disabled UI for future controls is acceptable only when it cannot execute.
- The default state for new admin capabilities is read-only proof rendering.

## agent lanes

Agents may inspect, edit, verify, commit, push branches, open PRs, and merge
approved safe lanes when checks pass.

Safe lanes:

- public site presentation, content records, and layout without secrets, auth,
  DNS, payments, or external writes.
- `apps/admin-solid` read-only UI, route, copy, static feed, and local-dev
  runtime display work.
- docs and repo guide updates that reduce stale blockers and align with
  `~/Infra/agents`.
- tests, validation, build config, and deploy workflow path filters that do not
  expand secrets or live permissions.

Merge and deploy lane:

- A same-repo PR may be merged by an agent after required checks pass when the
  diff is fully inside a safe lane.
- Main pushes trigger the path-filtered Deploy workflow. That is expected for
  safe public site and approved read-only admin UI work.
- Docs-only changes should be merged normally when reviewed, but should not
  deploy app targets.
- Record the merge, deploy run, and verification URL in the PR or bus when the
  work is fleet-visible.

Keep PRs draft while checks, review, or scope are still unsettled. Mark ready
when the diff is reviewed and the deploy lane is clear.

## hard gates

These still require exact active authority in `~/Infra/coord/authority.jsonl`
or an explicit current Ani instruction covering the exact action:

- DNS, Cloudflare Access policy, auth, secrets, env, root, launchd, endpoint, or
  production collector changes.
- admin write paths, live control actions, iMessage sends, external account
  mutations, applications, payments, filings, contracts, or outbound messages.
- force-push, history rewrite, destructive cleanup, or source/personal deletes.
- health-data mutation, `/Users/ojas` mutation, or printing secret values.

Do not use stale local "no deploy" text to block a safe-lane public site deploy
after checks. For admin, confirm that the change is read-only, approved, and
limited to the intended target before deploy. Do stop when the diff crosses a
hard gate.

## data and content

The public site should read structured data and markdown collections. Do not
recreate the old root `content/` mirror in this repo.

Admin should become the operator surface for editable content and fleet state.
Prefer small read-only slices:

- render the queue or state first,
- verify authenticated and unauthenticated behavior,
- only then propose write paths with authority.

See `docs/admin-v2-architecture.md` for the current admin v2 direction and
`docs/content-admin-editor-brief.md` for the public-site content model that
should eventually be editable through admin.

## environment

Local env files and Wrangler secrets stay out of git. Secret names may be
documented, but values must never appear in commits, logs, screenshots, or bus
rows.

Use `getEnv(key)` from `@anipotts/lib/env` for worker/runtime secrets. Avoid
raw `process.env` access unless the local framework path requires it.

## verification

Match checks to the touched package. For admin UI changes, run at least:

```bash
pnpm turbo typecheck --filter=@anipotts/admin-solid...
pnpm turbo build --filter=@anipotts/admin-solid...
```

For public site UI changes, run at least:

```bash
pnpm turbo typecheck --filter=@anipotts/www...
pnpm turbo build --filter=@anipotts/www...
```

For shared packages, workflow, worker, or cross-app changes, run broader
`pnpm validate` or the affected Turbo graph.

When deploy occurs, verify:

- GitHub PR and merge commit,
- Deploy workflow result,
- protected admin route returns Cloudflare Access to unauthenticated requests,
- authenticated browser render when a logged-in session is available.

## style

Public copy should sound like Ani. Keep it direct and specific. Avoid generic
startup copy, fake vulnerability, engagement bait, guru tone, unsupported hype,
recycled platitudes, rhetorical-question hooks, and exactly-three-item cadence.

No em dashes in human-facing copy. Use commas, periods, or shorter sentences.

Never use `git add .` or `git add -A`. Stage exact files.
