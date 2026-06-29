# admin content draft operations

Date: 2026-06-27
Status: draft operation save path staged; publish remains blocked

## purpose

Admin content editing should not write directly from a browser form into public
site source, deployed content, or outbound channels. The first write-path shape
stores passkey-protected draft operations only. These operations can be
rendered, previewed, reviewed, and proved before any `page_content`, public
runtime, outbound, or publish mutation exists.

The target flow is:

`source default -> content record -> draft operation -> preview -> approval -> published record -> render proof`

## operation schema v0

Each draft operation should be represented as a plain data object:

```json
{
  "operation_id": "content-draft-homepage-summary-2026-06-25",
  "kind": "content_draft",
  "surface": "public_site",
  "route": "/",
  "source_ref": "D1 page_content:home.sections.intro.rich_summary and @anipotts/lib/cms homepageSummaryText fallback",
  "field_path": "homepage.summary",
  "current_value_ref": "source_default",
  "proposed_value": "new copy goes here",
  "status": "draft",
  "risk_level": "low",
  "authority_state": "not_required_for_draft",
  "required_approval_ids": [],
  "allowed_actions": ["save_draft", "render_preview", "request_review"],
  "forbidden_actions": ["publish", "deploy", "send", "write_page_content"],
  "preview_targets": ["/content/preview", "/"],
  "proof_ids": [],
  "evidence_uri": "repo://apps/www/src/data/site.ts",
  "redaction": "public_copy_only",
  "created_by": "agent",
  "created_at": "2026-06-25T00:00:00Z",
  "expires_at": "2026-07-25T00:00:00Z",
  "rollback_ref": "source_default"
}
```

Required fields:

- `operation_id`
- `kind`
- `surface`
- `route`
- `source_ref`
- `field_path`
- `current_value_ref`
- `proposed_value`
- `status`
- `risk_level`
- `authority_state`
- `allowed_actions`
- `forbidden_actions`
- `preview_targets`
- `redaction`
- `rollback_ref`

Optional fields:

- `required_approval_ids`
- `proof_ids`
- `evidence_uri`
- `created_by`
- `created_at`
- `expires_at`
- `reviewer_note`

## states

Allowed initial states:

- `draft`
- `previewed`
- `needs_ani`
- `blocked`

Future gated states:

- `approved`
- `publishing`
- `published`
- `verified`
- `reverted`

The current admin app may render all states, but the only live write it may
create is a `content_draft_operations` row from the passkey-protected focused
editor. Only `draft`, `previewed`, `needs_ani`, and `blocked` should appear
until publish authority exists.

## authority mapping

Draft-only copy proposals can be low risk when they touch public-site text and
do not publish. They can be created and reviewed in safe branches or static
admin data.

Publishing requires exact authority when any operation:

- writes to D1, KV, R2, a CMS table, or repo source
- changes public rendered content without a PR merge
- triggers deploy, cache purge, or route invalidation
- sends, posts, files, pays, applies, deletes, or mutates an account
- touches auth, DNS, env, secrets, endpoints, collectors, root, or launchd

## draft-only write-path design

The first implementation exposes one live control and keeps irreversible
controls disabled:

- `preview` may render local/sample proposed values
- `request review` may show the needed authority text
- `save draft` may write a `content_draft_operations` row after passkey login
- `publish` remains disabled
- `deploy` remains absent unless separately approved

No hidden API routes should exist for disabled controls. The draft-save API is
explicitly same-origin, passkey-middleware protected, and limited to draft
operation rows.

## storage

The content store now has an additive D1 schema proposal in
`drizzle/migrations/0007_content_operations.sql`, mirrored in the canonical
Drizzle schema at `packages/lib/src/db/schema.ts`.

- `content_records`: published field overrides
- `content_draft_operations`: draft and preview operations
- `content_publish_events`: immutable publish proof

`drizzle/migrations/0008_seed_content_draft_operations.sql` seeds the first two
inert rows into `content_draft_operations`: homepage summary and newsletter
copy. These rows exist so admin can review real D1 operation state instead of
only static templates.

The schema and seed rows do not authorize public-site runtime reads from draft
records, browser writes to `page_content`, outbound sends, deploys, or publish
actions.

## proof requirements before publish writes

Before implementing any publish or public-content write path, require:

- storage target and binding approved
- migration reviewed and reversible
- API route and method approved
- CSRF/session posture defined
- Access boundary still proven
- preview route proven
- publish rollback defined
- audit event schema approved
- exact authority recorded for the live publish action
