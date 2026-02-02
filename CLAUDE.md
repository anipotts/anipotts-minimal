# CLAUDE.md

This file tells Claude Code how to work in this repository. **Read this first.**

---

## How to Work With Ani

Ani is building @anipottsbuilds — a personal brand about Claude Code, Cursor, AI tools, and productivity. She's a math major at NYU graduating May 2026.

**When Ani talks about content, automatically use the right workflow:**

| When Ani says... | What to do |
|------------------|------------|
| "I have an idea for..." / "content idea:" / "I want to post about..." | Capture it in Supabase with series type, then help draft |
| "atomize this" / "turn this into posts" | Run the atomization workflow for all target platforms |
| "schedule this" / "post this" | Use Typefully for text platforms, show manual queue for video |
| "what should I work on?" / "what's next?" | Query Supabase for pipeline status, show priorities |
| "how am I doing?" / "weekly review" | Run comprehensive review with stats |
| "add a gist/repo" / "proof artifact" | Register the artifact on the content |

**Don't make Ani memorize commands.** Just understand her intent and execute the workflow.

---

## Quick Dev Commands

```bash
pnpm dev                                    # Start all apps
pnpm turbo dev --filter=@anipotts/www      # Just www app
pnpm build                                  # Production build
pnpm lint                                   # ESLint
```

---

## Content System Architecture

### Where Everything Lives

- **Supabase `thoughts` table** — All content (ideas, drafts, published)
- **Supabase `atoms` table** — Platform-specific posts generated from content
- **Admin UI** — anipotts.com/admin (Pipeline, Content, Atoms, Schedule, Config, Analytics)
- **content-config/** — Voice guides, templates, series definitions

### The Pipeline

```
idea → draft → ready → atomized → published
```

### CLI for Direct Access

```bash
# Stats and status
npx ts-node scripts/supabase-cli.ts stats
npx ts-node scripts/supabase-cli.ts list-content --status draft

# Create/update content
npx ts-node scripts/supabase-cli.ts create-content "Title" --series 60s-fix --type video
npx ts-node scripts/supabase-cli.ts update-content <id> status ready

# Atoms
npx ts-node scripts/supabase-cli.ts list-atoms --platform twitter
npx ts-node scripts/supabase-cli.ts update-atom <id> status posted
```

---

## Content Workflows

### 1. Capture an Idea

When Ani mentions a content idea:
1. Ask which series it fits (60s-fix, i-tried-it, quick-tip, stack-update, viral-reel)
2. Create in Supabase with status "idea"
3. Help brainstorm the hook, key points, and artifact

### 2. Draft Content

When Ani wants to draft:
1. Read the series requirements from `content-config/config/signature-series.yaml`
2. Read voice guide from `content-config/voice/tone-guide.md`
3. Help write in the correct format for the series
4. Make sure it passes anti-corny guardrails (no fake vulnerability, no engagement farming, no guru energy)

### 3. Atomize (Generate Platform Posts)

When content is ready to atomize:
1. Check series_type — determines which platforms get posts
2. Read voice modes for each platform
3. Generate atoms for each target platform
4. Save to Supabase atoms table
5. Show summary for review

**Series → Platforms:**
| Series | Primary | Secondary |
|--------|---------|-----------|
| 60s-fix | tiktok, instagram, twitter | threads, bluesky, linkedin, youtube |
| i-tried-it | medium, devto, youtube, twitter, linkedin, substack | reddit, tiktok, instagram |
| quick-tip | twitter, threads, bluesky | linkedin |
| stack-update | twitter, linkedin | bluesky, threads, devto |
| viral-reel | tiktok, instagram | youtube, twitter |

### 4. Schedule/Post

Text platforms (via Typefully API):
- Twitter, LinkedIn, Threads, Bluesky, Mastodon
- Use `/schedule` command or Typefully skill CLI

Video platforms (manual):
- TikTok, Instagram, YouTube
- Show the script/caption for Ani to post manually

### 5. Weekly Review

Every Friday or when asked "how am I doing":
1. Query Supabase for this week's content + atoms
2. Check against targets (4-5 original pieces, 15-25 atoms)
3. Check artifact coverage (80%+ target)
4. Show platform distribution
5. Surface bottlenecks (stuck items, missing artifacts)

---

## Signature Series

| Series | Format | Frequency | Artifact Required |
|--------|--------|-----------|-------------------|
| **60s Fix** | Short video (30-60s) | 2x/week | Gist |
| **I Tried It** | Long-form article + video | 1x/week | Repo |
| **Quick Tip** | Text-first tweet/thread | 1-2x/week | Optional |
| **Stack Update** | Text or short video | As needed | Optional |
| **Viral Reel** | Short video (<30s) | 1-2x/week | Gist |

---

## Voice Modes

### Spicy (Twitter, TikTok)
Max personality. Abbreviations: yk, ngl, tbh, lowkey, highkey. Hot takes, provocative hooks.
*Sounds like: texting your tech friend about something wild*

### Casual (Threads, Instagram, Bluesky, YouTube, Substack)
Conversational, friendly. Some abbreviations.
*Sounds like: explaining to a curious friend at coffee*

### Professional (LinkedIn, Medium, Dev.to)
Polished but not corporate. Full words, clear structure.
*Sounds like: presenting at a meetup, not a board meeting*

---

## Anti-Corny Guardrails (NON-NEGOTIABLE)

Every piece of content must pass:
1. **No fake vulnerability** — Don't perform honesty. Just be honest.
2. **No engagement farming** — No "comment X if you agree."
3. **No guru energy** — Share what you found, don't preach.
4. **No hype without receipts** — Every claim needs a proof artifact.
5. **No recycled platitudes** — If it could go on a poster, delete it.
6. **No em dashes** — Never use `—`, `–`, or ` -- `. Use periods, commas, or restructure.
7. **No triplet lists** — Never list exactly 3 items in sequence. Use 2, 4+, or inline prose.

---

## North Star Goals

1. **Authority + Trust** — Be the go-to voice for Claude Code and AI-assisted building
2. **Audience Growth** — Grow engaged followers (engagement rate > vanity metrics)
3. **Portfolio + Career** — Every public work is proof of skill

---

## Monorepo Structure

```
apps/
  www/          # Main site + /admin
  thoughts/     # Blog subdomain (thoughts.anipotts.com)
  docs/         # Documentation
  status/       # Status page
packages/
  lib/          # Shared utilities, Supabase helpers
  types/        # TypeScript interfaces
  ui/           # Shared React components
content-config/
  config/       # Series definitions, platforms, calendar
  voice/        # Tone guide, platform rules, anti-corny guardrails
  templates/    # Platform-specific templates
scripts/
  supabase-cli.ts    # Direct Supabase access
```

---

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
ADMIN_PASSWORD=<password>
TYPEFULLY_API_KEY=<key>
```

Optional:
```
SUPABASE_SERVICE_ROLE_KEY=<key>
```

---

## Key Technical Patterns

- Pages use `export const revalidate = 0` for fresh Supabase data
- Terminal UI managed by `WindowContext` (states: open, collapsed, minimized, fullscreen)
- `FadeIn` component for staggered animations
- PostHog proxied through Next.js rewrites to `/ingest/*`
- Admin requires cookie auth — set via ADMIN_PASSWORD env var

---

## Important Rules

- **NOTHING goes live without Ani's approval** — Always show summary before posting
- **Anti-corny guardrails are non-negotiable** — Run the checklist on every atom
- **If unsure about tone, err casual** — Authentic > perfect
- **80%+ of posts need proof artifacts** — Gists, repos, screenshots, demos
