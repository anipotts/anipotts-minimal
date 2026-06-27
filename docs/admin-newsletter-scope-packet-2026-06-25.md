# admin and newsletter scope packet: 2026-06-25

Status: no-mutation scope packet

## operating direction

Stop creating new admin/site PRs until the desired slice is clearly scoped.

The default sequence is:

1. define the desired user workflow
2. classify the gate
3. make one scoped edit
4. verify locally and in GitHub
5. merge/deploy only when the lane and authority match

Admin is second priority after brand/deals. Keep read-only dashboard work moving
only when it supports the defined operator/content system.

## open PR inventory

Admin and site PRs:

- PR #86: `Add read-only admin content review queue`
  - Classification: merge-ready after exact approval
  - Reason: read-only `apps/admin-solid` route, green checks, clean merge state
  - Action: keep
  - Approval: `approve PR #86 ready/merge/deploy admin-solid only for read-only /content/review`
- PR #87: `Add admin auth and content editing ADR`
  - Classification: design-only, merge-ready after exact approval
  - Reason: docs-only, green checks, clean merge state
  - Action: keep as the scope packet container
  - Approval: `approve PR #87 ready/merge docs-only, no deploy target`
- PR #73: `Clean public site links and homepage cards`
  - Classification: stale public-site candidate
  - Reason: older draft, public-site lane, not part of current admin/newsletter
    scope
  - Action: refresh/cherry-pick later only if Ani wants that public cleanup
  - Approval: separate public-site approval before merge/deploy

Dependabot PRs:

- PR #49: posthog-js update
  - Classification: should close/replace or regenerate
  - Reason: old dependency PR with failed review
- PR #39: tailwind-merge update
  - Classification: should close/replace or regenerate
  - Reason: old dependency PR with failed review
- PR #38: resend update
  - Classification: should close/replace or regenerate
  - Reason: old dependency PR with failed review
- PR #37: otplib update
  - Classification: should close/replace or regenerate
  - Reason: old dependency PR with failed CI/review
- PR #36: TypeScript update
  - Classification: should close/replace or regenerate
  - Reason: old dependency PR with failed CI/review
- PR #33: dependabot/fetch-metadata update
  - Classification: should close/replace or regenerate
  - Reason: old GitHub Actions dependency PR with failed review/security
- PR #32: actions/checkout update
  - Classification: should close/replace or regenerate
  - Reason: old GitHub Actions dependency PR with failed review
- PR #31: dorny/paths-filter update
  - Classification: should close/replace or regenerate
  - Reason: old GitHub Actions dependency PR with failed review/security

Do not mix dependency cleanup with admin/content/newsletter work.

## desired admin ux

Admin should answer:

`what is safe to do next?`

The practical dashboard should show:

- `needs ani`: typed return queue, stale date, owner, action, next agent step
- `content`: public-site current values, draft proposals, preview state, source
  refs
- `newsletter`: issue drafts, source material, section status, send gate,
  preview proof
- `repos`: dirty/divergent state, branch, PR, deploy impact, last check
- `handoffs`: newest, stale, unabsorbed, owner thread, target owner
- `machines`: ap-pro/ap-mini role, heartbeat, active work, blocked/running
- `gates`: dns, Access, env, secrets, root, launchd, endpoints, publish, send
- `proof`: last route render, deploy result, authenticated render, Access 302

Keep the current `apps/admin-solid` shell until the route/data model is stable.
Astro alignment is desirable, but a framework migration should wait until it
reduces complexity instead of adding churn.

## auth direction

Cloudflare Access stays in front of `admin.anipotts.com`.

Near-term auth work is design-only:

- keep Access as the edge gate
- simplify login inside Access first
- record exact Access app, IdP, selector, session, rollback, and proof route
  before any live mutation
- treat app-native auth as a future second layer for write/control routes

Do not remove Access or change policy until a reviewed migration has exact
authority.

## content queue

The content queue should use operation objects, not direct browser writes.

Read-only first:

- source default
- current rendered value
- proposed draft value
- preview route
- risk level
- authority state
- proof id
- blocked actions

Future writes require exact authority for storage, migration, API route, preview
route, rollback, and render proof.

## newsletter at news.anipotts.com

Newsletter work should be treated as content structure first, publish/send
later.

Draft structure:

- issue slug
- working title
- thesis
- sections
- source refs
- draft status
- review questions
- preview route
- send gate
- proof ids

Admin should eventually show newsletter drafts beside public-site content, but
outbound sends, mailing-list mutations, unsubscribe settings, analytics, and
domain/routing changes stay gated.

No authority exists in this packet to publish, send, deploy, change DNS, change
env, or mutate newsletter provider settings.

## approval model

Admin read-only lane:

- safe to branch, edit, verify, push, and PR
- safe to merge/deploy only when exact admin-only authority is active
- deploy should run only `admin_solid=true`
- proof must show unrelated targets skipped

Public site lane:

- presentation/content PRs can be safe, but public live impact is different
  from protected admin impact
- public deploys should remain separately approved when the change is visible on
  `anipotts.com`

Newsletter lane:

- draft structure and preview data are safe
- publish/send/provider actions require exact authority
- `news.anipotts.com` DNS, routing, and provider changes require exact authority

## proposed admin-only automerge/autodeploy policy

Design only. Do not change workflows yet.

Eligible:

- PR touches only `apps/admin-solid`, admin read-only static data, admin docs, or
  safe shared read-model code
- PR declares no write path, no auth change, no env/secrets, no DNS, no worker
  service outside admin-solid
- required checks are green
- Claude review and security review pass
- deploy workflow path filter resolves to `admin_solid=true`
- all unrelated deploy targets are skipped

Not eligible:

- any Cloudflare Access, DNS, env, secret, endpoint, collector, root, launchd, or
  auth mutation
- any admin write path, content publish write, approval bridge send, newsletter
  send, deploy button, or live control route
- public `apps/www` visual/content changes unless separately approved
- legacy `apps/admin` or non-admin workers

Exact authority needed before implementing this policy:

`approve admin-only automerge/autodeploy policy implementation for read-only apps/admin-solid PRs with skipped-target proof`

## public-site gated

Keep these separate from admin-only automation:

- homepage and public copy changes on `anipotts.com`
- project pages and writing surfaces
- newsletter public route or `news.anipotts.com`
- public redirects and route labels
- SEO metadata that changes public rendering
- analytics or tracking behavior
- deploy workflow behavior for public targets

## newsletter child thread

A remote mini `anipotts.com` project thread was requested for newsletter content
draft structure only. If thread creation succeeds, it should work in a separate
worktree and report back without publish, deploy, DNS, auth, env, secret,
provider, or outbound-send authority.
