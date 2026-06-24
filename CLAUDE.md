# anipotts-com agent guide

`CLAUDE.md` is the canonical repo guide. `AGENTS.md` points here so Codex and
Claude read the same project contract.

This repo owns two live products:

- `anipotts.com`, the public Astro site.
- `admin.anipotts.com`, the protected operator dashboard.

Agents should keep this repo moving. Branch, edit, verify, push, open PRs,
merge, and deploy safe lanes without waiting for fleet/boss. Stop only at true
gates.

## product direction

The public site should become mostly stable code plus structured content. The
admin site should become the practical web surface for editing public-site text,
previewing changes, reviewing fleet state, and returning small decisions to
agents.

The clean target:

- public text and project copy become editable through admin.
- code deploys become less frequent because content changes move to records.
- admin stays read-only first, then adds draft and preview flows.
- publish, send, account, and live-control paths stay explicitly authorized.

## source map

- `apps/www`: Astro public site.
- `apps/admin-solid`: current protected admin dashboard.
- `apps/admin`: legacy admin surface, compatibility only.
- `apps/labs`: labs subdomain.
- `workers/*`: Cloudflare worker services.
- `packages/lib`: shared env, data, admin feed, CMS, metrics, and validation.
- `docs/admin-v2-architecture.md`: current admin v2 direction.
- `docs/content-admin-editor-brief.md`: public-site editable-content inventory.

Fleet state lives in `~/Infra`, especially `coord/NEEDS-ANI.md`,
`coord/ANSWERS.md`, `coord/authority.jsonl`, `coord/bus.jsonl`, handoffs,
registries, and admin feed artifacts.

## commands

Use the narrowest command that covers the diff.

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm test
pnpm validate
pnpm turbo typecheck --filter=@anipotts/www...
pnpm turbo build --filter=@anipotts/www...
pnpm turbo typecheck --filter=@anipotts/admin-solid...
pnpm turbo build --filter=@anipotts/admin-solid...
```

## safe lanes

Agents may complete safe lanes end to end: implement, verify, commit, push,
open PR, mark ready, merge after required checks, and let the scoped deploy run.

Safe lanes include:

- public-site presentation, layout, accessibility, routes, static data, and
  performance work.
- read-only `apps/admin-solid` dashboard work, including `/needs-ani`, `/repos`,
  fleet state, proof views, and non-writing content inventory.
- content schema, fixtures, adapters, previews, and migrations that do not write
  production content.
- docs, tests, package checks, and deploy workflow path filters that reduce
  stale blockers without expanding live permissions.

Safe public-site deploys are normal after green checks when the diff stays in
`apps/www` or shared presentation code. Safe admin deploys are normal after
green checks when the diff stays in read-only `apps/admin-solid` behavior.
Docs-only changes should merge normally and should not deploy app targets.

## admin content lane

Admin content editing should move in this order:

1. read current public-site content into an admin route.
2. render draft and preview states without writing production data.
3. create a typed `NEEDS-ANI` syscall only when human taste or live authority is
   required.
4. publish only through an authorized write path with proof.

The first implementation slice is a read-only `/content` route in the current
admin app. It should group homepage, projects, writing, and newsletter content;
show source refs and current values; mark editability and risk; and expose one
next safe action per row. It must not add save APIs, hidden write endpoints,
outbound publishing, social APIs, or credentials.

## needs ani

`NEEDS-ANI.md` is a human syscall queue. Use it only when work reaches a
capability boundary that Ani must answer from his phone: authority, taste,
identity, payment, secret setup, account-side action, source delete approval, or
final choice.

Each open item must have a fixed `type`, an owner, a short reason, one Ani
action, one agent next step, and a stale date. Use these types only:

- `approve`
- `choose`
- `provide`
- `perform`
- `review-delete`

Do not use `NEEDS-ANI.md` as a todo list, status page, notes doc, or parking lot.
Record normal status in commits, PRs, `bus.jsonl`, or handoffs.

## hard gates

These require exact current authority or an explicit current Ani instruction for
the exact action:

- DNS, Cloudflare Access, auth, secrets, env, root, launchd, endpoint, or
  production collector changes.
- admin write paths, content publish writes, live control buttons, deploy
  trigger buttons, approval bridges, iMessage, external sends, applications,
  payments, filings, contracts, or account mutations.
- legacy `apps/admin`, worker services, ingest, newsletter, and any write path
  outside the scoped public-site or read-only admin deploy lanes.
- force-push, published history rewrite, destructive cleanup, source or personal
  deletes, health-data mutation, `/Users/ojas` mutation, or printing secrets.

Split mixed-scope work. Ship the safe lane and leave the gated lane as one typed
syscall.

## verification

For public-site UI work:

```bash
pnpm turbo typecheck --filter=@anipotts/www...
pnpm turbo build --filter=@anipotts/www...
```

For admin UI work:

```bash
pnpm turbo typecheck --filter=@anipotts/admin-solid...
pnpm turbo build --filter=@anipotts/admin-solid...
```

For shared packages, workers, workflows, or cross-app changes, run the affected
Turbo graph or `pnpm validate`.

When a deploy runs, record the PR, merge commit, deploy workflow result,
unauthenticated Cloudflare Access proof for protected admin routes, and
authenticated render proof when a browser session is available.

## style

Public copy should sound like Ani: direct, specific, terse, and grounded in real
work. Avoid generic startup copy, guru tone, engagement bait, fake vulnerability,
unsupported hype, rhetorical-question hooks, and exactly-three-item cadence.

No em dashes in human-facing copy. Never use `git add .` or `git add -A`; stage
exact files.
