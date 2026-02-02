# Register Proof Artifact

Add a proof artifact to a content piece in Supabase. Artifacts are stored directly on the content record (artifact_url, artifact_type fields).

## Usage
```
/artifact <content-id-or-slug> <type> <url>
```

**Arguments:**
- `content-id-or-slug` — The content to attach this artifact to
- `type` — gist | repo | screenshot | screen-recording | diff | live-demo
- `url` — Full URL to the artifact

**Examples:**
```
/artifact multi-cursor-magic gist https://gist.github.com/anipotts/abc123
/artifact building-portfolio-with-ai repo https://github.com/anipotts/claude-portfolio-builder
/artifact quick-terminal-tip screenshot https://imgur.com/xyz789
```

## Artifact Types

| Type | Description | URL Pattern |
|------|-------------|-------------|
| **gist** | Code snippet on GitHub Gist | `https://gist.github.com/anipotts/...` |
| **repo** | Full repository | `https://github.com/anipotts/...` |
| **screenshot** | Static image proof | Any image URL (imgur, etc.) |
| **screen-recording** | Video demo | YouTube, Loom, etc. |
| **diff** | Code diff/PR | GitHub commit or PR URL |
| **live-demo** | Deployed demo | Any deployed URL |

## Instructions

1. Fetch the content to verify it exists:
   ```bash
   cd ~/code/active/websites/anipotts.com
   npx ts-node scripts/supabase-cli.ts get-content <id-or-slug>
   ```

2. Verify the artifact type matches series requirements:
   - **60s-fix** → MUST have gist
   - **i-tried-it** → MUST have repo
   - **viral-reel** → MUST have gist
   - **quick-tip** → artifact optional
   - **stack-update** → artifact optional

3. Update the content with artifact info:
   ```bash
   npx ts-node scripts/supabase-cli.ts update-content [id] artifact_url "[url]"
   npx ts-node scripts/supabase-cli.ts update-content [id] artifact_type "[type]"
   ```

4. Output confirmation:

```
## Artifact Registered

**Content:** [title]
**Content ID:** [id]
**Series:** [series_type]

**Artifact Type:** [type]
**Artifact URL:** [url]

---

**Artifact Requirements Check:**
- [series_type] requires: [gist/repo/none]
- This artifact: ✅ meets requirement / ⚠️ different type (acceptable) / ❌ missing

---

**Next steps:**
1. Verify the artifact is publicly accessible
2. If not yet atomized, run: `/atomize [id]`
3. Artifact will be included in all generated atoms automatically
```

## Series → Artifact Requirements

| Series | Required Type | Notes |
|--------|--------------|-------|
| 60s-fix | gist | Code snippet that solves the problem |
| i-tried-it | repo | Full project repository |
| viral-reel | gist | Quick proof snippet |
| quick-tip | optional | Encouraged but not required |
| stack-update | optional | Link to tool/update if relevant |

## Notes

- Artifacts are stored on the content record, not in a separate registry
- The `/atomize` command automatically includes artifact_url in generated atoms
- For series that require artifacts, `/atomize` will warn if artifact is missing
- You can update an artifact by running this command again with new URL
- Use descriptive gist names: `YYYY-MM-DD-short-description`
