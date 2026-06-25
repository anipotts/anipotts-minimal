# admin access simplification plan

Date: 2026-06-25
Status: approved for metadata audit and staged design only

## current audited state

The live `admin.anipotts.com` boundary is Cloudflare Access in front of the
`apps/admin-solid` Worker. A metadata-only API audit found:

- one account-level Access app matching `admin.anipotts.com`
- app type: self-hosted
- app hostname: `admin.anipotts.com`
- session duration: 24h
- app-level allowed IdP restriction: none
- policies: one allow policy using an email selector
- identity providers: one one-time-pin provider

The audit did not print secret values, policy email values, full object ids,
tokens, cookies, private payloads, or user lists. It did not mutate Access,
DNS, routes, env, secrets, users, groups, or policies.

Unauthenticated route probes still return Cloudflare Access 302 responses for:

- `https://admin.anipotts.com/`
- `https://admin.anipotts.com/content`

## decision

Keep Cloudflare Access as the edge gate. Simplify the login experience inside
Access before considering any app-native replacement.

The current one-time-pin flow is secure enough for the read-only dashboard, but
it is not the target operator experience. The next design target should be a
single strong IdP with instant authentication where Cloudflare supports it,
restricted to Ani's account or an explicit admin group.

Do not remove Access as part of login simplification.

## target shape

Preferred staged target:

- keep the same `admin.anipotts.com` self-hosted Access application
- use one intended IdP for Ani
- restrict the allow policy to an explicit identity selector or admin group
- set app-level allowed IdPs to the intended provider after validation
- keep session duration explicit
- keep unauthenticated browser probes blocked before Worker content returns
- keep app code read-only until write-path authority exists

The clean candidate remains Cloudflare account membership or another strong IdP
managed through Cloudflare Access. If Cloudflare account membership is used, the
policy should restrict access to Ani's Cloudflare account membership or a named
admin group, not a broad account-wide default.

## staged rollout

Stage 0: current state

- Access protects `admin.anipotts.com`.
- One-time-pin IdP is active.
- Read-only admin routes are live.

Stage 1: metadata packet

- record app hostname, type, session duration, IdP type, and policy selector
  kinds
- do not include full ids, emails, tokens, cookies, or policy payloads in public
  repo docs
- capture unauthenticated 302 proof for root and protected admin routes

Stage 2: proposed target config

- choose exact IdP
- choose exact selector or group
- choose exact session duration
- choose rollback config
- choose proof routes
- prepare a no-secret diff packet for review

Stage 3: live Access change, gated

- requires exact current authority for Cloudflare Access policy or app mutation
- apply only the approved Access config
- verify unauthenticated Access 302 behavior
- verify authenticated root and changed routes
- verify rollback path remains available
- record proof in bus or handoff

## rollback

Rollback should restore the previous Access app policy and IdP shape without
DNS changes. The fallback is to return to one-time-pin access with the existing
allow policy selector.

Rollback proof should include:

- Access app still exists for `admin.anipotts.com`
- unauthenticated root returns 302 to Access
- authenticated root renders
- no Worker route or DNS mutation was required

## exact authority still needed

Before any live Access change, Ani must approve:

- the exact Access app
- the exact target IdP
- the exact selector or group
- the exact session duration
- whether app-level allowed IdPs should be restricted
- the rollback config
- the proof routes

This plan does not authorize DNS, Cloudflare Access mutation, auth removal,
env or secret changes, Worker route changes, deploys, or app-native auth.
