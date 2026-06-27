# platform architecture

Last updated: 2026-06-27

This repo is being reduced to one public Astro app, one admin Astro app, one
structured content/state model, and one predictable CI/CD path.

## target state

| Surface        | Target                                    | Status              | Next action                                               |
| -------------- | ----------------------------------------- | ------------------- | --------------------------------------------------------- |
| public site    | `apps/www`                                | keep                | keep as Astro public app for `anipotts.com`               |
| admin site     | `apps/admin`                              | canonical cutover   | prove passkey registration and then remove Access         |
| current admin  | `apps/admin-solid`                        | legacy rollback     | keep briefly on legacy route, then archive or delete      |
| legacy admin   | `docs/archive/admin-next-legacy.md`       | archived            | no Next admin app remains                                 |
| labs           | `docs/archive/labs`                       | archived            | no app or deploy target remains                           |
| workers        | `workers/*`                               | review individually | keep only production-required workers                     |
| shared content | `packages/lib`, future `packages/content` | clarify             | move reusable content/schema logic into one owned package |
| database       | `drizzle`, D1 `anipotts-db`               | keep                | use for content/admin state with reviewed migrations      |

## current inventory

### apps

| Path                | Role today                                 | Classification      |
| ------------------- | ------------------------------------------ | ------------------- |
| `apps/www`          | public Astro site and newsletter endpoints | keep                |
| `apps/admin`        | Astro admin app for `admin.anipotts.com`   | keep                |
| `apps/admin-solid`  | legacy Solid admin rollback surface        | archive/remove next |
| `docs/archive/labs` | archived labs reference material           | keep as archive     |

### workers

| Path                   | Role today               | Classification |
| ---------------------- | ------------------------ | -------------- |
| `workers/ingest`       | ingest worker            | review         |
| `workers/newsletter`   | newsletter queue worker  | review         |
| `workers/state`        | future fleet state plane | keep candidate |
| `workers/weekly-email` | weekly email worker      | review         |

### packages

| Path                         | Role today                                    | Classification              |
| ---------------------------- | --------------------------------------------- | --------------------------- |
| `packages/lib`               | shared CMS, admin, db, data, services helpers | keep, split later if useful |
| `packages/styles`            | shared style tokens                           | keep                        |
| `packages/types`             | shared generated types                        | keep                        |
| `packages/services-platform` | service registry utilities                    | keep candidate              |
| `packages/config`            | shared TypeScript config plus stale Next bits | remove Next exports later   |

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

| Workflow              | Role                                                     |
| --------------------- | -------------------------------------------------------- |
| `ci.yml`              | build, lint, typecheck, and test affected packages on PR |
| `agent-automerge.yml` | merge green agent PRs and dispatch exact deploy targets  |
| `deploy.yml`          | deploy explicit targets only                             |
| `smoke.yml`           | post-deploy route proof for public and admin targets     |

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
7. archive useful labs docs, then delete the labs app target if unused. done on
   2026-06-27.
8. review workers and delete unneeded worker targets.
9. split durable content schema into `packages/content` if `packages/lib`
   remains too broad.
10. reduce deploy workflow inputs to retained production targets.
