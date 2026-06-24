# admin.anipotts.com v2 architecture

## goal

`admin.anipotts.com` should become Ani's practical operator dashboard and,
later, the web editing surface for public-site text and content.

The dashboard must answer one operational question first:

`what is safe to do next?`

The current control-plane model remains the backbone:

`intent / authority / operation / proof / state`

## current baseline

Live baseline:

- app: `apps/admin-solid`
- worker: `anipotts-admin-solid`
- host: `admin.anipotts.com`
- protection: Cloudflare Access
- deployed state: read-only admin feed shell
- latest proven queue: `/needs-ani`

Current strengths:

- dense operational pages already exist
- `NEEDS-ANI` is rendered as typed human syscalls
- static Infra feed and local-dev runtime overlays are wired
- deploy workflow can target only admin-solid
- unauthenticated users are blocked by Cloudflare Access

Current gaps:

- app framework is separate from the Astro public site direction
- route components and data adapters are still tightly coupled
- content editing is modeled in docs but not represented in the live admin nav
- no formal read model for public-site editable content
- no disabled preview for future save or publish workflows

## recommended v2 shape

Build v2 as an Astro-aligned Cloudflare app with a sidebar-first operator shell.
Use Astro for routing, layout, and server-rendered read views. Use Solid islands
only where live state, filters, optimistic previews, or stream updates need
client-side state.

Recommended app options:

- short term: keep improving `apps/admin-solid` while v2 is documented
- medium term: create `apps/admin-v2` as an Astro app and port read-only routes
- final target: move `admin.anipotts.com` to the Astro-aligned app after proof

Do not rewrite only for framework symmetry. Rewrite when the v2 shell can reduce
deployment surface, make content editing easier, and share site-rendering
patterns with `apps/www`.

## information architecture

Primary sidebar:

- overview
- needs ani
- mutations
- fleet
- repos
- handoffs
- deploys
- content
- proof
- destructive ops
- settings

Overview should show:

- safe next action
- blocked-by-Ani queue count
- active operations
- stale handoffs
- dirty repo count
- deploy impact
- newest proof
- hard gates

`/content` should be read-only first:

- homepage copy and proof cards
- project cards and project detail bodies
- writing titles, summaries, tags, status, and body preview
- newsletter block copy
- source path or record id
- last proof or last edited timestamp when available

## data architecture

Use one adapter boundary:

`source feed -> normalized admin model -> route view model -> UI`

Source categories:

- static admin feed from Infra
- runtime admin feed from Infra state
- public-site content collections from `apps/www/src/content`
- page content from D1-backed CMS records
- future state-worker feed for live fleet state

Adapters should emit safe read models that carry:

- `id`
- `title`
- `status`
- `risk_level`
- `next_safe_action`
- `authority_state`
- `required_approval_ids`
- `allowed_actions`
- `forbidden_actions`
- `proof_ids`
- `evidence_uri`
- `redaction`
- `source_ref`
- `updated_at`

Never include secret values, dirty filenames, file contents, private messages,
health payload rows, message ids, signed document bodies, or dollar amounts in
admin feed payloads unless a future authority explicitly permits that exact
field.

## content editing model

Read-only content preview comes first.

Future editable content should be modeled as operations, not direct writes:

1. editor creates a proposed content operation
2. preview renders old value and proposed value
3. authority decides whether the operation is public-site safe or admin-gated
4. proof records source, reviewer, and expected live impact
5. approved operation writes to the chosen content store
6. post-write proof verifies rendered route or record state

Initial content surfaces:

- homepage heading, summary, mention copy, and proof cards
- selected project card fields
- project detail markdown body
- writing frontmatter and body
- newsletter block copy
- redirect and route labels only after separate review

Do not start with cross-posting or social publishing. Those are outbound send
paths and need stricter authority.

## permission split

Public site lane:

- agents may branch, edit, verify, push, and PR safe content and UI work
- agents may merge approved public-site PRs when checks pass
- deploy through path-filtered workflow is expected after approved merge
- live impact should be recorded in the PR or handoff

Admin read-only lane:

- agents may branch and PR read-only dashboards, routes, schema display, and
  feed adapters
- deploy requires approval when the live admin target changes
- authenticated and unauthenticated proof should be captured when available
- route output must respect redaction rules

Admin control lane:

- write paths require exact current authority
- approval bridge execution requires exact current authority
- deploy buttons require exact current authority
- content-save APIs require exact current authority
- collector, DNS, Access, env, and secret changes require exact current
  authority

## smallest first implementation slice

First slice: add a read-only `/content` route to the current admin shell.

Scope:

- no framework rewrite
- no writes
- no D1 mutation
- no deploy unless separately approved after PR
- no new secret or Access changes

Deliverables:

- route: `/content`
- adapter: public-site content read model
- sections for homepage, projects, writing, and newsletter
- each row shows source, current rendered value, editability candidate, risk, and
  next safe action
- docs link to `docs/content-admin-editor-brief.md`
- local build and typecheck

Why this slice:

- it moves admin toward the requested editing surface
- it stays read-only
- it exposes what should become editable before adding save behavior
- it helps separate content data from source-code deploy habit
- it can ship on the current app without waiting for Astro migration

Second slice:

- extract shared admin view-model types
- add content operation preview objects
- render disabled save/publish affordances with required authority labels
- keep every button inert

Third slice:

- decide whether to keep `apps/admin-solid` or introduce `apps/admin-v2` Astro
- port shell layout if Astro gives lower complexity
- only then propose approved write APIs

## verification expectations

For read-only admin slices:

```bash
pnpm turbo typecheck --filter=@anipotts/admin-solid...
pnpm turbo build --filter=@anipotts/admin-solid...
```

For future Astro v2 slices:

```bash
pnpm turbo typecheck --filter=<admin-v2-package>...
pnpm turbo build --filter=<admin-v2-package>...
```

For deploy proof after approved merge:

- PR merge commit
- Deploy run id
- target jobs run and skipped
- unauthenticated Cloudflare Access behavior
- authenticated route render when browser auth is available
