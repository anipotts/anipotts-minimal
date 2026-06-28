# adr: admin auth boundary and content editing path

Archived: 2026-06-27.

This ADR was written before the Astro admin cutover. It is historical context
only. Current source truth is `docs/platform-architecture.md` and
`docs/admin-v2-architecture.md`.

Date: 2026-06-25
Status: accepted for design
Scope: design plus metadata-only audit

## decision

Keep Cloudflare Access in front of `admin.anipotts.com` for the next admin
slice. Do not remove it until a replacement has equal or better security,
operational proof, rollback, and exact authority for the live auth change.

The near-term simplification should be to improve the Access identity
experience, not to move auth into the app yet. The cleanest candidate is
Cloudflare Access with Cloudflare account membership as the identity provider,
restricted to Ani's Cloudflare account, with instant authentication where
appropriate. That preserves the edge gate while reducing one-time-pin style
friction.

For content editing, keep admin read-only until the route model is stable. The
next content architecture should use explicit content operations and a published
content read model, not direct file writes from the browser. Draft, preview,
approve, publish, and proof should be separate states.

Ani approved these bounded next steps on 2026-06-25:

- metadata-only Cloudflare Access admin app audit for `admin.anipotts.com`
- staged Cloudflare Access login simplification planning for
  `admin.anipotts.com`
- admin content draft operation schema and inert write-path design

Those approvals do not authorize live Access policy changes, DNS changes, env or
secret changes, endpoint changes, deploys, admin write paths, content publish
writes, or removal of Cloudflare Access.

## current boundary

Observed from repo state and unauthenticated live probes:

- Current admin app: `apps/admin-solid`
- Worker: `anipotts-admin-solid`
- Custom domain: `admin.anipotts.com`
- Worker config: `apps/admin-solid/wrangler.toml`
- Deploy path: `.github/workflows/deploy.yml`, `Deploy admin-solid`
- Live unauthenticated proof: `https://admin.anipotts.com/` and
  `https://admin.anipotts.com/content` return HTTP 302 to Cloudflare Access.
- Legacy admin: `apps/admin`, custom domain `legacy-admin.anipotts.com`
- Current admin-solid app auth: none inside the app shell. The live protection
  boundary is Cloudflare Access before the Worker route.
- Current write posture: admin-solid routes are read-only. The runtime loader is
  local-dev metadata only. Content save, publish, deploy, approval bridge,
  collector, DNS, Access, env, and secret paths are gated.

The current setup is secure mainly because unauthenticated traffic does not
reach the app content. Removing Access without a replacement would immediately
turn admin app bugs, future routes, and accidental debug output into public
exposure risks.

## goals

- Reduce login friction for Ani without lowering the security bar.
- Keep a strong edge gate while admin is still evolving quickly.
- Make the future auth model compatible with an Astro-aligned admin v2.
- Allow content editing to avoid routine code deploys once approved.
- Keep every write path inert until separate authority exists.

## non-goals

- No live auth change in this ADR.
- No DNS, route, Access policy, env, secret, endpoint, or deploy mutation.
- No production content store mutation.
- No admin write path or publish path.
- No replacement of `apps/admin-solid` with Astro in this slice.

## option a: keep and improve Cloudflare Access

Shape:

- Keep Access as the edge gate for `admin.anipotts.com`.
- Replace or improve the identity experience behind Access.
- Prefer Cloudflare account membership or another strong IdP over email-only
  one-time-pin flow.
- Use instant authentication if there is only one intended IdP.
- Keep route-level app code read-only until write paths are separately approved.

Pros:

- Current live protection model stays intact.
- Unauthenticated requests are blocked before app code runs.
- No app session storage, CSRF, password reset, or passkey recovery code needed.
- Can protect future Astro admin and existing Solid admin the same way.
- Good rollback: keep or restore the Access app and policy.

Cons:

- Still depends on Cloudflare Zero Trust configuration.
- The login experience can feel heavier than app-native auth.
- Per-route app roles are awkward unless the app also verifies identity headers.
- Auth state is outside the repo unless represented by generated config or
  audited handoffs.

When to choose:

- Now.
- While admin is read-only.
- While content writes, deploy buttons, approval bridges, and collectors are not
  live.

Recommended improvement path:

1. Metadata-only audit of current Access app, IdP, policy selectors, session
   duration, and allowed users.
2. Design a target Access config that uses a stronger, simpler IdP.
3. Stage the config on a non-production admin hostname or temporary app.
4. Switch `admin.anipotts.com` only after exact authority and rollback proof.

## option b: app-native auth in Astro admin

Shape:

- Future `apps/admin-v2` Astro app owns login, session cookies, CSRF protection,
  audit events, and roles.
- Auth can be password plus passkey, magic link, GitHub OAuth, or OIDC.
- Cloudflare Access either remains as defense in depth or is removed later.

Pros:

- Can make the admin UX feel native and simple.
- Can model app roles, write authority, proof, and audit in one place.
- Fits future content editing because operations can tie to an app session.
- Can support passkeys and device-bound sessions.

Cons:

- Much larger security surface than Access-only.
- Needs session storage, cookie hardening, CSRF, rate limiting, recovery, audit,
  and logout behavior.
- Needs rigorous tests before it protects live admin.
- A bug in app auth can expose the admin app unless Access remains in front.

When to choose:

- After admin v2 route model is stable.
- When write paths need per-action identity inside the app.
- Only with Access still in front until app auth has production proof.

Recommended posture:

- Build app-native auth as a second layer first, not a replacement.
- Require app-native auth only for future write/control routes.
- Keep read-only routes behind Access until the replacement has a rollback plan.

## option c: GitHub, passkey, or OIDC style auth

Shape:

- GitHub OAuth or OIDC: authenticate through a known identity provider.
- Passkey/WebAuthn: authenticate using platform credentials.
- Managed OIDC through Cloudflare Access or app-native OIDC can bridge either
  model.

Pros:

- Stronger and more familiar than shared passwords.
- GitHub membership can map naturally to repo/admin work.
- Passkeys reduce phishing risk when implemented correctly.
- OIDC gives a standard path for future clients and service boundaries.

Cons:

- GitHub OAuth adds app registration, callback URL, token handling, and provider
  outage dependency.
- Passkeys need enrollment, recovery, device loss handling, and storage.
- OIDC still needs session and role design if handled in-app.
- If implemented directly in the app, it does not give the same edge-blocking
  behavior as Access.

When to choose:

- GitHub/OIDC: when admin needs named operators and reviewable roles.
- Passkeys: when the app has a stable session store and recovery policy.
- Cloudflare Access OIDC: when the goal is simpler login while keeping the edge
  gate.

## option d: local-only or tunnel-first admin

Shape:

- Admin is only reachable through a private network, device client, or tunnel.
- Public `admin.anipotts.com` is removed or becomes a thin redirect.
- Access requires device enrollment, Tailscale, WARP, or a similar private path.

Pros:

- Very strong exposure reduction.
- Good for root, launchd, health, and machine-control surfaces.
- No public login page for sensitive operator actions.
- Pairs well with a separate public read-only status dashboard.

Cons:

- Worse mobile and browser ergonomics.
- Device enrollment becomes the main dependency.
- Harder to share authenticated proof from normal browser sessions.
- Not ideal for quick content review from any trusted machine.

When to choose:

- For future destructive/admin-control routes.
- For machine-local controls and root-adjacent operations.
- Not as the default path for read-only content review.

## when to remove Cloudflare Access

Do not remove Access until all of these are true:

- Replacement auth is implemented and tested on a staging hostname.
- The replacement blocks unauthenticated requests before protected content is
  returned.
- Session cookies are secure, httpOnly, sameSite, scoped, rotated, and audited.
- CSRF and rate limiting exist for every mutation route.
- Recovery and device-loss behavior are documented.
- Route-level roles distinguish read-only, content draft, publish, deploy, and
  destructive operations.
- Auth logs are recorded without secret values or private payloads.
- Rollback restores Access without DNS or route ambiguity.
- Ani gives exact current authority for the live auth change.

The earliest safe removal point is after an Astro-aligned admin v2 has app-native
auth running behind Access with authenticated render proof and write-path tests.
Even then, keeping Access as defense in depth may remain the better tradeoff.

## recommended path

Short term:

1. Keep Cloudflare Access on `admin.anipotts.com`.
2. Improve the Access login path through a design-reviewed Access config.
3. Keep `apps/admin-solid` moving for read-only operator and content review.
4. Open draft PRs for UI/read-model work and require exact authority for live
   admin deploys.

Medium term:

1. Build an Astro-aligned `apps/admin-v2` shell only after route/data ownership
   is stable.
2. Add app-native identity as a second layer behind Access for future write
   surfaces.
3. Use per-operation authority checks for content writes, deploys, approval
   bridge sends, and destructive actions.
4. Preserve Access until app-native auth has proof equal to or stronger than the
   current edge gate.

## content editing path without routine deploys

Target model:

`source default -> content record -> draft operation -> preview -> approval -> published record -> render proof`

Recommended storage shape:

- Source defaults remain in `apps/www` and content collections as rollback.
- A typed content store holds published overrides for editable public-site text.
- A separate draft operation store holds proposed edits, reviewer notes,
  authority ids, proof ids, and blocked actions.
- Admin renders draft and published state, but cannot write until approved.
- Public site reads published records at runtime or build-time depending on the
  field.

Recommended first editable surfaces:

- Homepage heading, summary, and proof card copy.
- Project card fields that already map cleanly to markdown frontmatter.
- Writing title and summary records before body editing.
- Newsletter block copy, but not outbound sends.

Required before writes:

- Content schema and migration plan.
- D1 or equivalent binding design.
- Preview route proof.
- Audit event format.
- Rollback to source defaults.
- Exact authority for creating the write path.
- Exact authority for publishing to live public routes.

Implementation order:

1. Continue read-only admin routes: `/content`, `/content/preview`,
   `/content/review`, and `/content/operations`.
2. Add a typed draft operation model with static samples only.
3. Add a disabled write affordance that names the required authority.
4. Design the content store schema and migration.
5. Implement write APIs only after separate authority.

## proof from this review

- `apps/admin-solid/wrangler.toml` confirms Worker `anipotts-admin-solid` and
  custom domain `admin.anipotts.com`.
- `.github/workflows/deploy.yml` confirms `Deploy admin-solid` is a separate
  workflow target.
- `apps/admin-solid/README.md` confirms the current app role and gates.
- Unauthenticated `curl` to `https://admin.anipotts.com/` returned HTTP 302 to
  Cloudflare Access.
- Unauthenticated `curl` to `https://admin.anipotts.com/content` returned HTTP
  302 to Cloudflare Access.
- Metadata-only Cloudflare Access API audit found one self-hosted Access app for
  `admin.anipotts.com`, one allow policy using an email selector, one one-time
  pin identity provider, a 24 hour session duration, and no app-level allowed
  IdP restriction. Identifiers were redacted to suffixes only during inspection
  and are not required for this public repo doc.

See also:

- `docs/admin-access-simplification-plan.md`
- `docs/admin-passkey-auth-plan.md`
- `docs/admin-content-draft-operations.md`

## references

- Cloudflare Access self-hosted application docs:
  `https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/`
- Cloudflare as identity provider docs:
  `https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/cloudflare/`
- Cloudflare Tunnel and device-client private access docs:
  `https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/use-cases/ssh/ssh-device-client/`
- Cloudflare Access for Infrastructure docs:
  `https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/use-cases/ssh/ssh-infrastructure-access/`

## next exact authority needed

Completed design authority:

`approve metadata-only Cloudflare Access admin app audit for admin.anipotts.com`

`approve staged Cloudflare Access login simplification for admin.anipotts.com`

`approve admin content draft operation schema and inert write-path design`

The first and third items are now represented in this ADR and companion docs.
The second item is accepted as a staged plan only because it does not name the
exact target IdP selector, session duration, policy shape, rollback operation,
or proof route.

For a live Access simplification change, the next authority must name the exact
Access app, target IdP, selector, session duration, rollback path, and proof
routes. It should still forbid removing Access unless separately approved.

For content write work, the next authority must name the exact storage target,
schema migration, API route, preview route, rollback behavior, and live render
proof. Live writes, D1 migration, public rendering from records, and publish
actions each need separate authority.
