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

## Environment

Only set env vars for features you use (contact email, captcha, analytics, etc.).
