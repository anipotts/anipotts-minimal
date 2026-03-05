# Atomize Content (Supabase-Based, Series-Aware)

Generate platform-specific content atoms from a content piece in Supabase. Uses series-based routing — NOT all 11 platforms.

## Usage

```
/atomize <content-id-or-slug>
```

**Examples:**

```
/atomize multi-cursor-magic-in-claude-code
/atomize 550e8400-e29b-41d4-a716-446655440000
```

## Instructions

1. Fetch the content from Supabase:

   ```bash
   cd ~/code/active/websites/anipotts.com
   npx ts-node scripts/supabase-cli.ts get-content <id-or-slug>
   ```

2. Parse the returned JSON — extract:
   - `id` (UUID)
   - `title`
   - `slug`
   - `body` (the source content)
   - `series_type` (REQUIRED)
   - `content_type`
   - `artifact_url`, `artifact_type`
   - `voice_mode` (optional override)

3. If `series_type` is null or missing, STOP and ask:

   ```
   ⚠️ This content has no series_type assigned.

   Which series does this belong to?
   - 60s-fix (quick Claude Code tip, video-first)
   - i-tried-it (deep dive build, long-form)
   - quick-tip (text-first micro tip)
   - stack-update (tool/stack change)
   - viral-reel (proven viral format)

   Run: npx ts-node scripts/supabase-cli.ts update-content [id] series_type <series>
   ```

4. Read series config from `content-config/config/signature-series.yaml`:
   - Get `atomization_targets.primary` and `atomization_targets.secondary`
   - Get `voice_mode` default
   - Get `artifact_required` and `artifact_type`

5. If `artifact_required` is true and `artifact_url` is missing, WARN:

   ```
   ⚠️ This series requires a [artifact_type] artifact.
   Add one before publishing: /artifact <type> <slug> [url]
   ```

6. Read voice/style guides:
   - `content-config/voice/tone-guide.md`
   - `content-config/voice/platform-rules.md`
   - `content-config/voice/anti-corny-guardrails.md`

7. Extract from the content:
   - The core insight (one sentence)
   - 3-5 key supporting points
   - Any specific examples, numbers, or outcomes
   - The best hook angles

8. **Generate ONLY platforms listed for this series type:**

   For each target platform (primary first, then secondary):
   - Read the platform template from `content-config/templates/`
   - Apply the correct voice mode (Spicy/Casual/Professional)
   - Include `artifact_url` in the appropriate section
   - Use hook formulas from CLAUDE.md

   **Voice Mode Quick Reference:**
   - **Spicy** (Twitter, TikTok): Max abbreviations (yk, ngl, tbh, u, ur), provocative
   - **Casual** (Threads, IG, Bluesky, YouTube, Substack): Conversational, some abbrevs
   - **Professional** (LinkedIn, Medium, Dev.to): Full words, polished but human

9. **Anti-Corny QA** — For every generated atom, verify:
   - [ ] No fake vulnerability ("I used to struggle...")
   - [ ] No engagement farming ("Comment if you agree!")
   - [ ] No guru energy ("You NEED to do this")
   - [ ] No hype without receipts (artifact linked?)
   - [ ] No recycled platitudes (motivational poster vibes)

10. Create each atom in Supabase:

    ```bash
    npx ts-node scripts/supabase-cli.ts create-atom "[content_id]" "[platform]" "[atom_content]" "[voice_mode]"
    ```

11. Update content status to "atomized":

    ```bash
    npx ts-node scripts/supabase-cli.ts update-content [id] status atomized
    ```

12. Output summary:

```
## Atomization Complete

**Source:** [title]
**ID:** [content_id]
**Series:** [series_type]
**Artifact:** [artifact_url] ([artifact_type]) — or "⚠️ MISSING (required)"

### Atoms Generated: [count]

#### Primary Platforms:
- [x] twitter (spicy) — [first 50 chars of content]...
- [x] tiktok (spicy) — [first 50 chars of content]...
...

#### Secondary Platforms:
- [x] linkedin (professional) — [first 50 chars of content]...
...

#### Skipped (not in this series):
- medium — not in 60s-fix targets
- substack — not in 60s-fix targets
...

**Anti-Corny QA:** ✅ All [count] atoms passed

**Status Updated:** idea → atomized

---

**Next steps:**
1. Review atoms in Admin UI: anipotts.com/admin → Atoms tab
2. Schedule text platforms: `/schedule [content-id]`
3. Film video content from TikTok/Instagram scripts
4. Post manually to video platforms
```

## Series → Platform Quick Reference

| Series       | Primary                                             | Secondary                           |
| ------------ | --------------------------------------------------- | ----------------------------------- |
| 60s-fix      | tiktok, instagram, twitter                          | threads, bluesky, linkedin, youtube |
| i-tried-it   | medium, devto, youtube, twitter, linkedin, substack | reddit, tiktok, instagram           |
| quick-tip    | twitter, threads, bluesky                           | linkedin                            |
| stack-update | twitter, linkedin                                   | bluesky, threads, devto             |
| viral-reel   | tiktok, instagram                                   | youtube, twitter                    |

## Important

- MAINTAIN ANI'S VOICE — use the correct voice mode per platform
- If it sounds like generic AI, rewrite it
- Anti-corny guardrails are NON-NEGOTIABLE
- Show the summary so I can review before any publishing
- All atoms go into Supabase `atoms` table, not local files
