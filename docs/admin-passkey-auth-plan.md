# admin passkey auth plan

Date: 2026-06-27
Status: implementation staged behind Cloudflare Access

## decision

Move toward biometric passkey login for `admin.anipotts.com`, but do not remove
Cloudflare Access first.

The safe order is:

1. keep Cloudflare Access as the edge gate
2. add app-native passkey auth behind Access on a staging or protected route
3. prove passkey registration, login, logout, recovery, and unauthenticated
   blocking
4. use passkey auth for future write/control routes while Access still protects
   the app
5. remove Access only after a separate reviewed rollback-ready change

## why not remove Access now

Current `apps/admin-solid` has no app-native auth boundary. Cloudflare Access is
what blocks unauthenticated traffic before admin app code returns protected
content.

Removing Access before app-native passkey auth exists would make every existing
and future admin route depend on code that was not designed to be the primary
auth wall.

## target user experience

Desired login:

- open `https://admin.anipotts.com`
- browser shows passkey prompt
- Ani authenticates with Touch ID, Face ID, or device passcode
- admin opens without one-time-pin email friction
- session can be revoked
- lost-device recovery is documented

## passkey architecture

Use WebAuthn/passkeys as the app-native auth layer.

Required server responsibilities:

- generate registration challenge
- verify registration response
- store credential public key, credential id, sign count, device metadata, and
  created timestamp
- generate login challenge
- verify login assertion
- create a secure session cookie
- rotate or revoke sessions
- enforce CSRF protection on future mutation routes
- audit auth events without secrets or private payloads

Required storage:

- credential table
- challenge table or signed short-lived challenge token
- session table or signed session token with revocation support
- recovery table or documented manual recovery path

Required browser behavior:

- secure context only
- first-party `admin.anipotts.com` origin
- one registered Ani credential at first
- future support for multiple trusted devices

## staging route

First route:

- `/auth/passkey`

Behavior:

- behind Cloudflare Access
- shows current auth state
- registers first passkey only when exact authority exists
- logs no secret material
- does not expose admin content if app session is missing

No hidden write APIs should exist until the exact registration storage and
session plan is approved.

## removal criteria for Cloudflare Access

Do not remove Access until all are true:

- passkey registration works on at least two trusted Ani devices
- login works after browser restart
- logout invalidates session
- revoked credential cannot log in
- lost-device recovery is documented and tested
- unauthenticated requests to admin content return app-native 401 or redirect
- mutation routes have CSRF and authority checks
- route tests cover read-only admin routes and future write-path denials
- rollback restores Cloudflare Access without DNS ambiguity
- Ani gives exact authority for the live Access removal

## staged implementation

The first implementation slice keeps Cloudflare Access active and adds:

- `/auth/passkey`
- `/api/admin/passkey/status`
- `/api/admin/passkey/register-options`
- `/api/admin/passkey/register-verify`
- `/api/admin/passkey/login-options`
- `/api/admin/passkey/login-verify`
- `/api/admin/passkey/logout`
- D1 binding `DB`
- migration `drizzle/migrations/0006_admin_passkeys.sql`

The route can show missing DB state safely in local or undeployed contexts. Live
enrollment requires the migration to be applied and the admin-solid app deployed
with the D1 binding.

## rollback plan

Before removing Cloudflare Access:

1. keep the existing Cloudflare Access app and policy config documented
2. prove passkey auth on `/auth/passkey`, `/`, `/content`, `/content/review`,
   `/content/preview`, `/content/operations`, and `/needs-ani`
3. remove Access only in a single reviewed change
4. if app-native auth blocks Ani or exposes an unexpected gap, restore the
   previous Access app/policy for `admin.anipotts.com` and leave passkey auth as
   an inner gate
5. record unauthenticated and authenticated route proof after rollback

## exact authority needed

For implementation behind Access:

`approve app-native passkey auth implementation behind Cloudflare Access for admin.anipotts.com, no Access removal`

This should allow code, schema, tests, and protected deploy only. It should not
allow Access policy changes, DNS changes, env/secret changes, or removing
Cloudflare Access unless separately stated.

For live Access removal:

`approve remove Cloudflare Access from admin.anipotts.com after passkey proof, rollback=<plan>, proof=<routes>`

This must name the rollback plan and proof routes.
