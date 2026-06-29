# stale safety branches

Archived: 2026-06-29.

This note records why the remaining remote `safety/*` branches can be retired
after the note lands on `main`.

## safety/anipotts-com-docs-cloudflare-infrastructure-2026-05-26

Classification: absorbed.

Evidence:

| Branch file                            | Current preserved file                                    |
| -------------------------------------- | --------------------------------------------------------- |
| `docs/cloudflare-infrastructure.md`    | `docs/archive/cloudflare-infrastructure-2026-05-13.md`    |
| `docs/per-project-vercel-migration.md` | `docs/archive/per-project-vercel-migration-2026-05-13.md` |
| `docs/personal-cloud-architecture.md`  | `docs/archive/personal-cloud-architecture-2026-05-13.md`  |

The branch docs predate the Astro admin cutover and current CI/CD design.
Current source truth is `docs/platform-architecture.md`,
`docs/admin-v2-architecture.md`, `docs/newsletter-system.md`, and
`docs/worker-inventory.md`.

Retirement action: delete the remote branch after this note is merged.

## safety/astro-production-cutover-2026-06-15

Classification: superseded.

Evidence:

- current `main` already contains the Astro public app and canonical Astro admin
  app.
- current `main` contains a newer `apps/www/src/components/InlineMention.astro`.
- current `main` contains all currently referenced homepage brand assets:
  `structured-ai-favicon.png`, `ycombinator-favicon.ico`,
  `bad-habit-favicon.png`, `atlantic-records-logo-cropped.png`, and
  `business-insider-favicon.svg`.
- branch-only Atlantic Records, Bad Habit, Business Insider, and Structured AI
  image variants are not referenced by current source.
- the branch predates the June 29 content/D1 work, admin passkey staging,
  route parity guards, scoped deploy rules, and admin route proof inventory.

Retirement action: delete the remote branch after this note is merged.

## post-retirement proof

After deletion, `git branch -r --no-merged origin/main` should be empty or
contain only newly created active work. The site repo should remain clean on
`main`, with no app deploy required for this docs-only note.
