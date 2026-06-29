# platform architecture

Last updated: 2026-06-29

This repo is being reduced to one public Astro app, one admin Astro app, one
structured content/state model, and one predictable CI/CD path.

`pnpm test:workspace` enforces the active app, package, and worker inventory so
archived surfaces do not re-enter the workspace quietly.

`pnpm test:path-hygiene` keeps active repo files off retired local account paths.
Historical references may remain under `docs/archive`, but live scripts and
launchd templates must point at `/Users/anipotts`.

## target state

| Surface        | Target                              | Status              | Next action                                           |
| -------------- | ----------------------------------- | ------------------- | ----------------------------------------------------- |
| public site    | `apps/www`                          | keep                | keep as Astro public app for `anipotts.com`           |
| admin site     | `apps/admin`                        | canonical cutover   | prove passkey registration and then remove Access     |
| current admin  | `apps/admin-solid`                  | manual rollback     | no auto-deploy; archive or delete after passkey proof |
| legacy admin   | `docs/archive/admin-next-legacy.md` | archived            | no Next admin app remains                             |
| labs           | `docs/archive/labs`                 | archived            | no app or deploy target remains                       |
| workers        | `workers/*`                         | review individually | keep only production-required workers                 |
| shared content | `packages/content`, `packages/lib`  | in progress         | use package contracts plus D1 operation tables        |
| database       | `drizzle`, D1 `anipotts-db`         | keep                | seed inert content operations, then prove admin reads |

## current inventory

### apps

| Path                | Role today                                 | Classification  |
| ------------------- | ------------------------------------------ | --------------- |
| `apps/www`          | public Astro site and newsletter endpoints | keep            |
| `apps/admin`        | Astro admin app for `admin.anipotts.com`   | keep            |
| `apps/admin-solid`  | legacy Solid admin rollback surface        | manual rollback |
| `docs/archive/labs` | archived labs reference material           | keep as archive |

### workers

| Path                   | Role today                                                   | Classification                        |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------- |
| `workers/ingest`       | deployed cron/fetch worker for D1 ingest and event receivers | keep, review writers before expansion |
| `workers/newsletter`   | deployed queue/fetch worker for newsletter sends             | keep, outbound-send gated             |
| `workers/state`        | deployed `api.anipotts.com` durable-object state plane       | keep with explicit deploy target      |
| `workers/weekly-email` | deployed scheduled email worker                              | keep, outbound-send gated             |

Detailed worker evidence and deletion criteria live in
`docs/worker-inventory.md`. The 2026-06-29 review found no worker safe to delete
yet: all four retained workers have current config, route or trigger evidence,
deploy target coverage, and live version history.

### packages

| Path               | Role today                                                     | Classification                  |
| ------------------ | -------------------------------------------------------------- | ------------------------------- |
| `packages/lib`     | shared CMS, admin, db, data, services helpers                  | keep, split later if useful     |
| `packages/content` | shared content inventory, previews, source parsers, and drafts | keep, expand toward D1 adapters |
| `packages/styles`  | shared style tokens                                            | keep                            |
| `packages/types`   | shared generated types                                         | keep                            |
| `packages/config`  | shared TypeScript, Tailwind, and PostCSS config                | keep minimal shared config      |

## route parity target

The Astro admin replacement covers these live admin-solid routes. Keep them
covered while passkey proof and Access removal are completed, then remove
`apps/admin-solid`:

`pnpm test:admin-routes` enforces the route files, admin navigation, deploy
smoke list, and manual smoke list for this parity set.

`pnpm test:public-boundary` enforces the public app boundary for `apps/www`.
The public app may render public CMS/D1 content, run newsletter subscribe
endpoints, redirect `/admin/*` to `admin.anipotts.com`, and proxy PostHog
analytics through `/ingest/*`. It must not add admin routes, admin API routes,
passkey logic, Cloudflare Access identity handling, proof tables, content draft
operation tables, or publish-event tables.

| Route                                               | Purpose                              |
| --------------------------------------------------- | ------------------------------------ |
| `/`                                                 | operator overview                    |
| `/auth/passkey`                                     | app-native passkey auth              |
| `/content`                                          | content inventory                    |
| `/content/review`                                   | content proposal queue               |
| `/content/drafts`                                   | inert draft editor surface           |
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
revoked-credential denial. It reports missing pre-removal evidence in
`access_removal_blockers`; `cloudflare_access_still_active: true` is expected
until the edge gate is removed, not a blocker by itself. After Access removal,
the same script must show app-native route blocking. The route probe set must
include content inventory, review, drafts, preview, operations, newsletter
queue, newsletter detail preview, needs-ani, proof, repos, handoffs, fleet,
mutations, and destructive-ops routes.

First-passkey bootstrap in production requires a verified Cloudflare Access
application JWT from `Cf-Access-Jwt-Assertion`. The admin Worker validates it
against `ACCESS_TEAM_DOMAIN` and `ACCESS_POLICY_AUD`, both non-secret
configuration values in `apps/admin/wrangler.toml`, before allowing the first
credential registration. After an active passkey session exists, additional
credential operations use the app-native passkey session rather than Access
identity headers.

Use `pnpm --silent proof:admin-content` after content migrations. It reads only
remote D1 metadata and route status, then proves published `home` and
`newsletter` page content, the newsletter subscribe copy fields, the four inert
draft operations, empty content write tables, public route health, and protected
admin route boundaries.

The admin proof log reads durable rows from D1 table `admin_proof_events` when
available, then appends live D1 metadata for content operations and passkey
proof. The table is seeded by
`drizzle/migrations/0012_admin_proof_events.sql`. There is still no admin proof
write API.

## ci/cd target

Primary workflows:

| Workflow              | Role                                                     |
| --------------------- | -------------------------------------------------------- |
| `ci.yml`              | build, lint, typecheck, and test affected packages on PR |
| `security-review.yml` | local static checks for sensitive path changes on PR     |
| `agent-automerge.yml` | merge green agent PRs and dispatch exact deploy targets  |
| `deploy.yml`          | deploy explicit targets only                             |
| `smoke.yml`           | manual route proof for public and admin targets          |

`pnpm test:workflows` enforces this exact workflow inventory and rejects
disabled external Claude or Anthropic review hooks.

Rules:

- docs-only changes deploy nothing.
- lockfile and root package changes never deploy every target by default.
- public site changes deploy `www` only.
- admin changes and `packages/content` changes deploy only the Astro admin
  target.
- `apps/admin-solid` changes do not auto-deploy. Its deploy job remains
  workflow-dispatch only for rollback while passkey proof is incomplete.
- `packages/lib` and `packages/styles` changes deploy `www` only because
  `apps/admin` does not depend on them.
- `agent-automerge.yml` and `deploy.yml` both use
  `scripts/ci/compute-deploy-targets.mjs`; target rules should not be duplicated
  in workflow-local path filters.
- `deploy.yml` records route proof inside the `www` and `admin` deploy jobs.
  `pnpm test:public-routes` keeps deploy smoke, manual smoke, and content proof
  aligned on the public route set: `/`, `/newsletter`, `/newsletter/archive`,
  `/making`, `/orchestrating`, `/projects`, and `/writing`.
- D1 migrations run as reviewed migration steps before app deploy.
- `security-review.yml` does not call Anthropic, Claude Code, or any external
  model API. It scans sensitive diffs for literal secrets, disabled LLM review
  hooks, and destructive migration patterns.
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
8. remove the inactive `services/` and `packages/services-platform` planning
   scaffold; keep the D1 `service_registry` table and `packages/lib` read
   queries.
9. review workers and delete unneeded worker targets. first pass completed on
   2026-06-29 in `docs/worker-inventory.md`; no worker is safe to delete yet
   because all four retained workers still have route or trigger evidence,
   deployment history, and production responsibility.
10. expand `packages/content` from static content inventory into the durable
    operation schema and D1 adapter layer. started with
    `drizzle/migrations/0007_content_operations.sql` and inert seed rows in
    `drizzle/migrations/0008_seed_content_draft_operations.sql`; first published
    newsletter page-content seed lives in
    `drizzle/migrations/0009_seed_newsletter_page_content.sql`, and safe
    homepage heading/section metadata seed lives in
    `drizzle/migrations/0010_seed_home_page_content.sql`. Source-backed project
    and writing review operations live in
    `drizzle/migrations/0011_seed_source_content_review_operations.sql`.
11. move admin proof baseline rows into D1 `admin_proof_events`; seeded by
    `drizzle/migrations/0012_admin_proof_events.sql`.
12. move homepage proof cards into D1 `page_content`; seeded by
    `drizzle/migrations/0013_seed_homepage_proof_cards.sql` with Astro source
    fallback still retained.
13. move homepage making project slugs into D1 `page_content`; seeded by
    `drizzle/migrations/0014_seed_homepage_making_slugs.sql` with Astro source
    fallback still retained.
14. move homepage writing slugs into D1 `page_content`; seeded by
    `drizzle/migrations/0015_seed_homepage_writing_slugs.sql` with Astro source
    fallback still retained.
15. move homepage rich summary text and mention keys into D1 `page_content`;
    seeded by `drizzle/migrations/0016_seed_homepage_rich_summary.sql` with
    Astro source fallback still retained.
16. move homepage mention label, link, and local logo metadata into D1
    `page_content`; seeded by
    `drizzle/migrations/0017_seed_homepage_mentions.sql` with Astro source
    fallback still retained.
17. remove duplicate `homeContent` homepage fallback from `apps/www/src/data`;
    homepage fallback content now lives in `@anipotts/lib/cms`.
18. stop auto-deploying `apps/admin-solid`; keep it manual-only for rollback.
19. move homepage intro subheading into D1 `page_content`; seeded by
    `drizzle/migrations/0019_seed_homepage_intro_subheading.sql` with source
    fallback still retained.
20. refresh D1 admin proof event metadata now that the proof log is durable;
    updated by `drizzle/migrations/0020_refresh_admin_proof_events.sql`.
21. move homepage about section into D1 `page_content`; seeded by
    `drizzle/migrations/0021_seed_homepage_about_section.sql` with source
    fallback still retained.
22. move `/writing` index route copy into D1 `page_content`; seeded by
    `drizzle/migrations/0022_seed_writing_index_page_content.sql` with source
    fallback still retained.
23. move `/making` index route copy into D1 `page_content`; seeded by
    `drizzle/migrations/0023_seed_making_index_page_content.sql` with source
    fallback still retained.
24. move `/projects` archive index route copy into D1 `page_content`; seeded by
    `drizzle/migrations/0024_seed_projects_index_page_content.sql` with source
    fallback still retained.
25. move `/newsletter/archive` route copy into D1 `page_content`; seeded by
    `drizzle/migrations/0025_seed_newsletter_archive_page_content.sql` with
    source fallback still retained.
26. move the `/newsletter` archive CTA label, copy, and link into D1
    `page_content`; seeded by
    `drizzle/migrations/0026_seed_newsletter_archive_cta_content.sql` with
    source fallback still retained.
27. move `/orchestrating` hero and live-session panel copy into D1
    `page_content`; seeded by
    `drizzle/migrations/0027_seed_orchestrating_page_content.sql` with source
    fallback still retained.
28. seed inert D1 review operations for D1-backed listing/page copy on
    `/making`, `/projects`, `/writing`, `/newsletter/archive`, and
    `/orchestrating`; seeded by
    `drizzle/migrations/0028_seed_listing_content_review_operations.sql`.
29. add a first-class inert `/content/drafts` admin route with disabled editor
    controls backed by page_content and content_draft_operations.
30. move project and writing source-content parsing into `packages/content` so
    the admin app only owns the Vite raw-markdown import boundary.
31. reduce deploy workflow inputs to retained production targets after rollback
    no longer needs `apps/admin-solid`.
