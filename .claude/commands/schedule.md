# Schedule Content via Typefully

Schedule text-platform atoms through Typefully API. For video platforms (TikTok, Instagram, YouTube), outputs manual posting queue.

## Prerequisites

1. **Typefully API Key** — Set as environment variable:
   ```bash
   export TYPEFULLY_API_KEY="your-api-key"
   ```
   Get your API key from: https://typefully.com/settings/api

2. **Typefully Plan** — Requires Creator plan ($12.50/mo) or higher for API access

## Usage
```
/schedule <content-id-or-slug> [--time <time>] [--platforms <platforms>]
```

**Arguments:**
- `content-id-or-slug` — The content to schedule atoms for
- `--time` — When to schedule: `now`, `next`, or `YYYY-MM-DDTHH:MM`
- `--platforms` — Comma-separated list to filter (default: all text platforms)

**Examples:**
```
/schedule multi-cursor-magic --time next
/schedule 550e8400-e29b-41d4-a716-446655440000 --platforms twitter,linkedin
/schedule my-latest-tip --time 2026-02-03T10:00
```

## Typefully-Supported Platforms

These platforms can be scheduled via Typefully API:
- **twitter** (X)
- **linkedin**
- **threads**
- **bluesky** (if connected in Typefully)

## Manual Posting Platforms

These platforms require manual posting (script provided):
- **tiktok** — Video upload + caption
- **instagram** — Reel/carousel upload
- **youtube** — Video upload
- **medium** — Long-form article
- **devto** — Long-form article
- **substack** — Newsletter
- **reddit** — Post/comment

## Instructions

1. Fetch atoms for this content:
   ```bash
   cd ~/code/active/websites/anipotts.com
   npx ts-node scripts/supabase-cli.ts list-atoms --content <content-id> --status draft
   ```

2. Parse the returned JSON — group atoms by platform

3. Separate into Typefully-schedulable vs manual platforms

4. For each Typefully platform atom, prepare the API call:
   ```bash
   curl -X POST https://api.typefully.com/v1/drafts/ \
     -H "X-API-KEY: Bearer $TYPEFULLY_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "content": "[atom content]",
       "schedule-date": "[ISO datetime or null for next slot]",
       "threadify": false,
       "platforms": ["twitter"]
     }'
   ```

   **Typefully API Notes:**
   - `schedule-date`: ISO 8601 format or omit for auto-scheduling
   - `threadify`: true for Twitter threads, false for single posts
   - `platforms`: array of platforms to post to

5. Show preview before scheduling:

```
## Ready to Schedule

**Content:** [title]
**Content ID:** [id]
**Time:** [scheduled time or "next available slot"]

---

### Typefully Queue (API Scheduled)

#### Twitter/X
\`\`\`
[full atom content]
\`\`\`
**Character count:** [count]/280
**Voice:** spicy

#### LinkedIn
\`\`\`
[full atom content]
\`\`\`
**Voice:** professional

#### Threads
\`\`\`
[full atom content]
\`\`\`
**Voice:** casual

#### Bluesky
\`\`\`
[full atom content]
\`\`\`
**Voice:** casual

---

### Manual Posting Queue

#### TikTok (video required)
**Script:**
\`\`\`
[video script/caption content]
\`\`\`
**Hashtags:** [from content-config/voice/hashtags.md]

#### Instagram (video/carousel required)
**Caption:**
\`\`\`
[caption content]
\`\`\`
**Hashtags:** [from content-config/voice/hashtags.md]

#### YouTube (video required)
**Title:** [suggested title]
**Description:**
\`\`\`
[description content]
\`\`\`

---

**Confirm scheduling Typefully posts? (y/n)**
```

6. After confirmation, execute Typefully API calls

7. Update atom statuses in Supabase:
   ```bash
   npx ts-node scripts/supabase-cli.ts update-atom [atom-id] status scheduled
   npx ts-node scripts/supabase-cli.ts update-atom [atom-id] scheduled_for "[datetime]"
   ```

8. Output confirmation:

```
## Scheduling Complete

### Typefully Scheduled:
- ✅ twitter — scheduled for [time] (draft ID: [typefully_draft_id])
- ✅ linkedin — scheduled for [time]
- ✅ threads — scheduled for [time]
- ✅ bluesky — scheduled for [time]

### Manual Posting Queue:
- 📋 tiktok — script ready, film and post manually
- 📋 instagram — caption ready, create and post manually
- 📋 youtube — description ready, film and post manually

**Typefully Dashboard:** https://typefully.com/drafts

**Content Status:** atomized → [still atomized until all platforms posted]

---

**Next steps:**
1. Check Typefully queue for scheduled posts
2. Film video content from TikTok/Instagram scripts
3. Post manually to video platforms
4. Mark atoms as 'posted' after publishing:
   \`\`\`
   npx ts-node scripts/supabase-cli.ts update-atom [id] status posted
   \`\`\`
```

## Typefully API Reference

**Create Draft:**
```bash
curl -X POST https://api.typefully.com/v1/drafts/ \
  -H "X-API-KEY: Bearer $TYPEFULLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your post content",
    "schedule-date": "2026-02-03T10:00:00Z",
    "threadify": false,
    "platforms": ["twitter", "linkedin"]
  }'
```

**Response:**
```json
{
  "id": "draft-uuid",
  "url": "https://typefully.com/drafts/draft-uuid"
}
```

## Notes

- Typefully handles optimal posting times if using "next" slot
- All platforms connected in your Typefully account are available
- Thread formatting: Use `\n\n---\n\n` to separate tweets in a thread
- The manual posting queue is just a formatted output — you post manually
- Store Typefully draft IDs in atoms for reference
