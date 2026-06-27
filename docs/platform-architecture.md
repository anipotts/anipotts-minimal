# platform architecture

Last updated: 2026-06-27

This repo is being reduced to one public Astro app, one admin Astro app, one
structured content/state model, and one predictable CI/CD path.

## target state

| Surface        | Target                                    | Status                   | Next action                                               |
| -------------- | ----------------------------------------- | ------------------------ | --------------------------------------------------------- |
| public site    | `apps/www`                                | keep                     | keep as Astro public app for `anipotts.com`               |
| admin site     | `apps/admin`                              | Astro shell started      | port admin-solid behavior and then cut over               |
| current admin  | `apps/admin-solid`                        | migrate then remove      | port routes into `apps/admin`, then archive or delete     |
| legacy admin   | old Next.js code in `apps/admin`          | replace in place         | keep only useful models while rebuilding Astro admin      |
| labs           | `apps/labs`                               | archive/delete candidate | preserve useful content docs, then remove app target      |
| workers        | `workers/*`                               | review individually      | keep only production-required workers                     |
| shared content | `packages/lib`, future `packages/content` | clarify                  | move reusable content/schema logic into one owned package |
| database       | `drizzle`, D1 `anipotts-db`               | keep                     | use for content/admin state with reviewed migrations      |

## current inventory

### apps

| Path               | Role today                                      | Classification           |
| ------------------ | ----------------------------------------------- | ------------------------ |
| `apps/www`         | public Astro site and newsletter endpoints      | keep                     |
| `apps/admin-solid` | live protected admin dashboard, passkey staging | migrate                  |
| `apps/admin`       | Astro admin shell on legacy route               | migrate to canonical     |
| `apps/labs`        | legacy Next.js labs surface                     | archive/delete candidate |

### workers

| Path                   | Role today               | Classification |
| ---------------------- | ------------------------ | -------------- |
| `workers/ingest`       | ingest worker            | review         |
| `workers/newsletter`   | newsletter queue worker  | review         |
| `workers/state`        | future fleet state plane | keep candidate |
| `workers/weekly-email` | weekly email worker      | review         |

### packages

| Path                         | Role today                                    | Classification                     |
| ---------------------------- | --------------------------------------------- | ---------------------------------- |
| `packages/lib`               | shared CMS, admin, db, data, services helpers | keep, split later if useful        |
| `packages/styles`            | shared style tokens                           | keep                               |
| `packages/types`             | shared generated types                        | keep                               |
| `packages/services-platform` | service registry utilities                    | keep candidate                     |
| `packages/config`            | mostly Next.js shared config                  | remove after Next targets are gone |

## route parity target

The Astro admin replacement must cover these live admin-solid routes before
`apps/admin-solid` is removed:

| Route              | Purpose                              |
| ------------------ | ------------------------------------ |
| `/`                | operator overview                    |
| `/auth/passkey`    | app-native passkey auth              |
| `/content`         | content inventory                    |
| `/content/review`  | content proposal queue               |
| `/content/preview` | draft preview                        |
| `/needs-ani`       | typed human decision queue           |
| `/repos`           | repo and worktree state              |
| `/handoffs`        | handoff freshness                    |
| `/fleet`           | machine and agent state              |
| `/mutations`       | mutation queue                       |
| `/ops/destructive` | gated destructive-operation register |

## auth target

Passkey auth is the admin app boundary. Cloudflare Access stays in front only
until passkey proof is complete.

Required proof before removing Access:

| Proof                     | Evidence                                              |
| ------------------------- | ----------------------------------------------------- |
| register                  | D1 credential row exists after biometric registration |
| login                     | D1 session row exists and protected routes render     |
| logout                    | session is revoked and protected routes redirect      |
| persistence               | reload keeps authenticated access until expiry        |
| revoked credential denial | revoked credential cannot create a new session        |
| unauthenticated block     | protected admin routes redirect to app-native auth    |
| rollback                  | previous Access app or policy can be restored         |

## ci/cd target

Primary workflows:

| Workflow              | Role                                                      |
| --------------------- | --------------------------------------------------------- |
| `ci.yml`              | build, lint, typecheck, and test affected packages on PR  |
| `security-review.yml` | local no-API placeholder for the required `security` gate |
| `agent-automerge.yml` | merge green agent PRs and dispatch exact deploy targets   |
| `deploy.yml`          | deploy explicit targets only                              |
| `smoke.yml`           | post-deploy route proof for public and admin targets      |

Rules:

- docs-only changes deploy nothing.
- lockfile and root package changes never deploy every target by default.
- public site changes deploy `www` only.
- admin changes deploy only the affected admin target.
- D1 migrations run as reviewed migration steps before app deploy.
- Anthropic and Claude Code API-backed GitHub workflows are disabled for this
  repo.

## cleanup sequence

1. keep `main` production-reflective.
2. finish passkey proof while Access is still available.
3. remove Access after app-native proof and rollback proof.
4. port admin-solid routes into Astro `apps/admin`.
5. deploy `apps/admin` as the admin production target.
6. remove or archive `apps/admin-solid`.
7. archive useful labs docs, then delete the labs app target if unused.
8. review workers and delete unneeded worker targets.
9. split durable content schema into `packages/content` if `packages/lib`
   remains too broad.
10. reduce deploy workflow inputs to retained production targets.
