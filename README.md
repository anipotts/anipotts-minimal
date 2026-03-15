# anipotts.com

Monorepo for `anipotts.com`.

## Stack

- Next.js App Router (`apps/www`)
- Shared UI/styles/types packages (`packages/*`)
- Git-first content (local markdown + typed content modules)

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key Commands

```bash
pnpm build
pnpm test
pnpm github:audit
pnpm demo:capture anipotts-home
pnpm demo:capture:all
```

## Content Model

- Thoughts markdown: `apps/www/content/thoughts/*.md`
- Shared content outputs: `content/work/*`
- Project/thought templates: `content/templates/*`

## Route Map

- `/`
- `/work`
- `/projects/[slug]`
- `/thoughts`
- `/thoughts/[slug]`
- `/claude`
- `/connect`
- `/dev` -> permanent redirect to `/claude`

## Scripts

- GitHub scoring audit: `scripts/github/audit-public-repos.mjs`
- Demo capture pipeline: `scripts/demos/capture-project-demo.mjs`
- Claude stats refresh: `pnpm update-claude-stats`
- Claude stats refresh + commit: `pnpm update-claude-stats:commit`

## Claude Leaderboard Stats

The `/claude` page reads a generated JSON snapshot at:
`apps/www/src/app/(main)/claude/claude-stats.json`.

Manual refresh:

```bash
pnpm update-claude-stats
```

Daily scheduled refresh (macOS launchd, runs at 6:00 AM local time):

```bash
launchctl bootstrap gui/$UID /Users/anipotts/Code/active/websites/anipotts.com/scripts/claude/launchd/com.anipotts.claude-stats.plist
```

Disable the schedule:

```bash
launchctl bootout gui/$UID /Users/anipotts/Code/active/websites/anipotts.com/scripts/claude/launchd/com.anipotts.claude-stats.plist
```

Codex automation (daily auto-commit):

```bash
pnpm update-claude-stats:commit
```

## Environment

Only set env vars for features you use (contact email, captcha, analytics, etc.).
