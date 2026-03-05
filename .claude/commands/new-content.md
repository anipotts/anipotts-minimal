# Create New Content

Initialize a new content piece in Supabase and prompt for brainstorming.

## Usage

```
/new-content "Title of Your Content" [--series <series-type>] [--type <content-type>]
```

**Arguments:**

- `title` — Title for the content piece (required)
- `--series` — Series type: 60s-fix, i-tried-it, quick-tip, stack-update, viral-reel (optional)
- `--type` — Content type: video, article, thread, tip (default: article)

**Examples:**

```
/new-content "Multi-cursor Magic in Claude Code" --series 60s-fix --type video
/new-content "Building a Portfolio Site with AI" --series i-tried-it --type article
/new-content "Quick tip: Use @ for file context" --series quick-tip --type tip
```

## Instructions

1. Parse arguments: title, optional series-type, optional content-type

2. Create the content entry in Supabase:

   ```bash
   cd ~/code/active/websites/anipotts.com
   npx ts-node scripts/supabase-cli.ts create-content "Your Title" --series 60s-fix --type video
   ```

3. The CLI will return the created content with its ID. Store this for the session.

4. Read series requirements from `content-config/config/signature-series.yaml`:
   - What platforms does this series target?
   - Is an artifact required?
   - What voice mode is default?
   - What's the expected duration/format?

5. Output the brainstorm prompt:

```
## New Content Created

**ID:** [uuid]
**Title:** [title]
**Slug:** [slug]
**Series:** [series_type] (or "unassigned — assign before atomizing")
**Type:** [content_type]
**Status:** idea

**Admin URL:** https://anipotts.com/admin (Pipeline tab)

---

### Series Requirements (if assigned)

- **Format:** [format from series config]
- **Duration:** [duration if applicable]
- **Artifact Required:** [yes/no] — [artifact_type]
- **Primary Platforms:** [list]
- **Secondary Platforms:** [list]

---

### Quick Brainstorm

Before you write, let's nail down:

1. **Core insight** (one sentence — what's the ONE thing?):
   >

2. **Who cares?** (why should someone engage with this?):
   >

3. **Hook angle** (how do you grab attention?):
   >

4. **Key points** (3-5 things to cover):
   -
   -
   -

5. **Visual potential** (screen recording? code demo? carousel?):
   >

6. **Artifact idea** (what's the proof?):
   >

---

**Next steps:**
1. Fill in the brainstorm above
2. Draft content in your preferred tool (Notes, ChatGPT, etc.)
3. Update the content body in Admin or via CLI:
   \`\`\`
   npx ts-node scripts/supabase-cli.ts update-content [id] body "your content"
   npx ts-node scripts/supabase-cli.ts update-content [id] status draft
   \`\`\`
4. When ready, run: `/atomize [id]`
```

## Notes

- This replaces the old `/new-pillar` command
- Content is stored in Supabase `thoughts` table, not local files
- Use the Admin UI at anipotts.com/admin for visual editing
- The CLI script handles slug generation automatically
- If series_type is not provided, the content is "unassigned" — must be assigned before atomizing
