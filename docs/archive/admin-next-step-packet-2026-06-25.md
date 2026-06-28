# admin next-step packet: 2026-06-25

Archived: 2026-06-27.

This packet described old admin-solid PRs that have since been merged,
superseded, or closed. Current source truth lives in
`docs/platform-architecture.md`.

Status: no mutation packet

## current state

- Live public site main: `daee50c`
- Admin host: `admin.anipotts.com`
- Admin app: `apps/admin-solid`
- Auth boundary: Cloudflare Access remains active
- Priority: second after brand/deals

Open admin PRs:

- PR #86: `Add read-only admin content review queue`
  - Branch: `codex/pro/admin-content-review-2026-06-25`
  - Head: `f95d219`
  - State: open draft
  - Merge state: clean
  - Historical checks then: CI and GitHub review signals green
  - Superseded gate note: Claude/API security review is now disabled and is not
    required for this repo
  - Scope: read-only `apps/admin-solid` route and styling
- PR #87: `Add admin auth and content editing ADR`
  - Branch: `codex/pro/admin-auth-content-adr-2026-06-25`
  - Head: `1274d84`
  - State: open draft
  - Merge state: clean
  - Historical checks then: CI and GitHub review signals green
  - Superseded gate note: Claude/API security review is now disabled and is not
    required for this repo
  - Scope: docs-only auth/content ADR, Access audit packet, inert draft
    operation schema

## safe to merge and deploy with exact approval

PR #86 can be treated as the next admin-solid-only read-only candidate:

- adds `/content/review`
- groups current public-site content with inert proposal previews
- adds no save API
- adds no publish API
- adds no content-store mutation
- adds no approval bridge sending
- adds no hidden write endpoint

Recommended action if Ani wants this live:

1. mark PR #86 ready
2. merge PR #86 after checks remain green
3. run deploy with `admin_solid=true`
4. verify all unrelated deploy targets skipped
5. prove unauthenticated Cloudflare Access 302 for `/content/review`
6. prove authenticated render if browser auth is available

Exact approval phrase:

`approve PR #86 ready/merge/deploy admin-solid only for read-only /content/review`

## safe to merge without deploy target

PR #87 can be merged as docs-only when Ani wants the architecture recorded on
main. It should not deploy app targets.

Recommended action if Ani wants this merged:

1. mark PR #87 ready
2. merge PR #87 after checks remain green
3. verify docs-only deploy behavior, with app targets skipped

Exact approval phrase:

`approve PR #87 ready/merge docs-only, no deploy target`

## must remain design-only

These remain gated:

- removing Cloudflare Access
- changing Cloudflare Access policy, IdP, session duration, or allowed users
- DNS or route mutation
- env or secret mutation
- app-native auth activation
- content save APIs
- content publish writes
- D1, KV, R2, CMS, or repo-source write paths
- approval bridge sending
- production collectors
- live control or destructive operations

Exact approval needed before live Access mutation:

`approve live Cloudflare Access change for admin.anipotts.com: app=<app>, idp=<idp>, selector=<selector-or-group>, session=<duration>, rollback=<rollback>, proof=<routes>`

Exact approval needed before content writes:

`approve admin content write path: storage=<target>, migration=<id>, api=<route>, preview=<route>, rollback=<plan>, proof=<routes>`

## next useful read-only admin vision

Keep the current Solid admin shell until the route/data model stabilizes. The
next read-only routes should make admin practical before a framework migration:

- typed `NEEDS-ANI` return queue: show answer-ready items, stale items, and
  agent next steps
- content review: keep `/content`, `/content/preview`, and `/content/review`
  moving as inert preview surfaces
- handoffs: show newest, stale, unabsorbed, owner thread, target owner, and
  absorbed status
- stale rule drift: show AGENTS/CLAUDE, Infra policy, launchd docs, workflow
  defaults, and open drift packets
- repo state: dirty tracked count, untracked count, branch, upstream,
  ahead/behind, deploy impact, and active PR
- machine drift: ap-pro/ap-mini task, heartbeat, role, idle/running/blocked,
  and last proof
- live gates: DNS, Access, env, secrets, root, launchd, endpoints, deploy,
  write paths, outbound sends
- last proof: newest verified route, deploy run, authenticated render, and
  unauthenticated Access proof
- future content/newsletter: public-site text, project copy, writing metadata,
  newsletter copy, and outbound publishing as gated future surfaces

Astro alignment should stay design-only for now. The clean migration point is
after the admin route model and content operation schema are stable enough that
an Astro app reduces complexity instead of adding churn.
