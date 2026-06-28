# platform architecture

Last updated: 2026-06-27

This repo is being reduced to one public Astro app, one admin Astro app, one
structured content/state model, and one predictable CI/CD path.

## target state

| Surface        | Target                              | Status              | Next action                                              |
| -------------- | ----------------------------------- | ------------------- | -------------------------------------------------------- |
| public site    | `apps/www`                          | keep                | keep as Astro public app for `anipotts.com`              |
| admin site     | `apps/admin`                        | canonical cutover   | prove passkey registration and then remove Access        |
| current admin  | `apps/admin-solid`                  | legacy rollback     | keep briefly, then archive or delete after passkey proof |
| legacy admin   | `docs/archive/admin-next-legacy.md` | archived            | no Next admin app remains                                |
| labs           | `docs/archive/labs`                 | archived            | no app or deploy target remains                          |
| workers        | `workers/*`                         | review individually | keep only production-required workers                    |
| shared content | `packages/content`, `packages/lib`  | in progress         | use package contracts plus D1 operation tables           |
| database       | `drizzle`, D1 `anipotts-db`         | keep                | seed inert content operations, then prove admin reads    |

## current inventory

### apps

| Path                | Role today                                 | Classification      |
| ------------------- | ------------------------------------------ | ------------------- |
| `apps/www`          | public Astro site and newsletter endpoints | keep                |
| `apps/admin`        | Astro admin app for `admin.anipotts.com`   | keep                |
| `apps/admin-solid`  | legacy Solid admin rollback surface        | archive/remove next |
| `docs/archive/labs` | archived labs reference material           | keep as archive     |

### workers

| Path                   | Role today                                                   | Classification                        |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------- |
| `workers/ingest`       | deployed cron/fetch worker for D1 ingest and event receivers | keep, review writers before expansion |
| `workers/newsletter`   | deployed queue/fetch worker for newsletter sends             | keep, outbound-send gated             |
| `workers/state`        | deployed `api.anipotts.com` durable-object state plane       | keep with explicit deploy target      |
| `workers/weekly-email` | deployed scheduled email worker                              | keep, outbound-send gated             |

### packages

| Path                         | Role today                                      | Classification                  |
| ---------------------------- | ----------------------------------------------- | ------------------------------- |
| `packages/lib`               | shared CMS, admin, db, data, services helpers   | keep, split later if useful     |
| `packages/content`           | shared content inventory, previews, and drafts  | keep, expand toward D1 adapters |
| `packages/styles`            | shared style tokens                             | keep                            |
| `packages/types`             | shared generated types                          | keep                            |
| `packages/services-platform` | service registry utilities                      | keep candidate                  |
| `packages/config`            | shared TypeScript, Tailwind, and PostCSS config | keep minimal shared config      |

## route parity target

The Astro admin replacement covers these live admin-solid routes. Keep them
covered while passkey proof and Access removal are completed, then remove
`apps/admin-solid`:

| Route                                               | Purpose                              |
| --------------------------------------------------- | ------------------------------------ |
| `/`                                                 | operator overview                    |
| `/auth/passkey`                                     | app-native passkey auth              |
| `/content`                                          | content inventory                    |
| `/content/review`                                   | content proposal queue               |
| `/content/preview`                                  | draft preview                        |
| `/content/operations`                               | read-only D1 content operation state |
| `/newsletter`                                       | newsletter issue queue               |
| `/newsletter/first-thing-agents-need-control-plane` | newsletter issue detail preview      |
| `/needs-ani`                                        | typed human decision queue           |
| `/proof`                                            | deploy, auth, and route proof log    |
| `/repos`                                            | repo and worktree state              |
| `/handoffs`                                         | handoff freshness                    |
| `/fleet`                                            | machine and agent state              |
| `/mutations`                                        | mutation queue                       |
| `/ops/destructive`                                  | gated destructive-operation register |
| `/api/admin/runtime-feed`                           | local-dev metadata overlay endpoint  |

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

Use `pnpm --silent proof:admin-passkey` before and after enrollment. It reads
the remote `anipotts-db` passkey tables and probes protected admin routes
without printing Cloudflare Access tokens. Before Access removal, the script
must show one active credential, one active session, and audit rows for
registration, session creation, session revocation, credential revocation, and
revoked-credential denial. After Access removal, the same script must show
app-native route blocking. The route probe set must include content inventory,
review, preview, operations, newsletter queue, newsletter detail preview,
needs-ani, proof, repos, handoffs, fleet, mutations, and destructive-ops routes.

## ci/cd target

Primary workflows:

| Workflow              | Role                                                     |
| --------------------- | -------------------------------------------------------- |
| `ci.yml`              | build, lint, typecheck, and test affected packages on PR |
| `agent-automerge.yml` | merge green agent PRs and dispatch exact deploy targets  |
| `deploy.yml`          | deploy explicit targets only                             |
| `smoke.yml`           | manual route proof for public and admin targets          |

Rules:

- docs-only changes deploy nothing.
- lockfile and root package changes never deploy every target by default.
- public site changes deploy `www` only.
- admin changes and `packages/content` changes deploy only the Astro admin
  target.
- `packages/lib` and `packages/styles` changes deploy `www` only because
  `apps/admin` does not depend on them.
- `deploy.yml` records route proof inside the `www` and `admin` deploy jobs.
- D1 migrations run as reviewed migration steps before app deploy.
- Anthropic and Claude Code API-backed GitHub workflows are disabled for this
  repo.
- `/api/admin/runtime-feed` is disabled in production and reads only the local
  Infra runtime metadata file during development.

## cleanup sequence

1. keep `main` production-reflective.
2. finish passkey proof while Access is still available.
3. remove Access after app-native proof and rollback proof.
4. keep admin-solid route parity covered in Astro `apps/admin`.
5. deploy `apps/admin` as the admin production target.
6. remove or archive `apps/admin-solid`.
7. archive useful labs docs, then delete the labs app target if unused. done on
   2026-06-27.
8. review workers and delete unneeded worker targets.
9. expand `packages/content` from static content inventory into the durable
   operation schema and D1 adapter layer. started with
   `drizzle/migrations/0007_content_operations.sql` and inert seed rows in
   `drizzle/migrations/0008_seed_content_draft_operations.sql`; first published
   newsletter page-content seed lives in
   `drizzle/migrations/0009_seed_newsletter_page_content.sql`.
10. reduce deploy workflow inputs to retained production targets.
