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

- app: `apps/admin`
- worker: `anipotts-admin`
- host: `admin.anipotts.com`
- protection: Cloudflare Access plus staged app-native passkey middleware
- deployed state: Astro admin operator and content shell
- latest proven routes: `/newsletter` and
  `/newsletter/first-thing-agents-need-control-plane`

Current strengths:

- Astro admin is canonical for `admin.anipotts.com`
- `NEEDS-ANI`, content inventory, content review, operations, newsletter,
  proof, repos, handoffs, fleet, mutations, and destructive ops have protected
  routes
- deploy workflow can target only admin
- unauthenticated users are blocked by Cloudflare Access before app content
  renders
- passkey tables and app middleware are deployed

Current gaps:

- no active passkey credential exists yet
- Cloudflare Access is still the outer boundary until passkey proof is complete
- admin proof rows are still static source data, not durable D1 records
- content operations are modeled and queryable, but publish writes remain inert
- `apps/admin-solid` remains as a legacy rollback surface

## recommended v2 shape

Continue with `apps/admin` as the canonical Astro admin app. Do not create a
second admin app unless it removes more complexity than it adds.

Keep the sidebar-first operator shell. Use Astro for routing, layout, and
server-rendered read views. Add islands only where live state, filters,
optimistic previews, or stream updates need client-side state.

The next architecture milestone is proof, not another framework migration:

- enroll the first passkey while Access still protects the app
- prove app-native login, logout, persistence, and denial paths
- remove Access only after the proof script and browser proof both pass
- then archive or remove `apps/admin-solid`

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

Auth boundary note:

- Cloudflare Access remains the outer gate until passkey proof is complete.
- App-native passkey auth is implemented in the canonical Astro admin and uses
  D1-backed credentials, sessions, challenges, and audit events.
- The current unblocker is first passkey enrollment, then proof for register,
  login, logout, session persistence, revoked credential denial, and
  unauthenticated app-native blocking after Access removal.
- Historical auth and Access planning packets live under `docs/archive/`.
- See `docs/admin-content-draft-operations.md` for the inert content draft
  operation schema that should precede any save or publish path.
- Current merge/deploy policy lives in `CLAUDE.md` and
  `docs/platform-architecture.md`.

## smallest first implementation slice

First slice completed: add a read-only `/content` route to the current admin
shell.

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

Current next slice:

- complete passkey enrollment proof
- rerun `pnpm --silent proof:admin-passkey`
- remove Cloudflare Access only after proof passes
- archive or remove `apps/admin-solid`

Follow-up content slice:

- move proof records into D1-backed read models
- make content draft operations visible from D1
- keep save, publish, send, and live controls inert until audit proof exists

## verification expectations

For admin slices:

```bash
pnpm turbo typecheck --filter=@anipotts/admin...
pnpm turbo build --filter=@anipotts/admin...
```

For deploy proof after approved merge:

- PR merge commit
- Deploy run id
- target jobs run and skipped
- unauthenticated Cloudflare Access behavior
- authenticated route render when browser auth is available
