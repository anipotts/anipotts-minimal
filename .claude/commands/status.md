# Content Pipeline Status

Show the current state of the content pipeline from Supabase.

## Usage

```
/status [--series <series>] [--detailed]
```

**Options:**

- `--series <series>` — Filter by series type
- `--detailed` — Show full content list, not just counts

## Instructions

1. Fetch pipeline statistics:

   ```bash
   cd ~/code/active/websites/anipotts.com
   npx ts-node scripts/supabase-cli.ts stats
   ```

2. Parse the returned JSON stats

3. If `--detailed` flag is present, also fetch content list:

   ```bash
   npx ts-node scripts/supabase-cli.ts list-content [--series <series>]
   ```

4. Generate the status report:

```
## Content Pipeline Status

**As of:** [current datetime]

---

### Overview

| Metric | Count |
|--------|-------|
| Total Content | [totalContent] |
| Total Atoms | [totalAtoms] |
| Total Views | [totalViews] |
| Avg Atoms/Content | [totalAtoms/totalContent] |

---

### Content by Status

| Status | Count | % |
|--------|-------|---|
| 💡 idea | [count] | [%] |
| 📝 draft | [count] | [%] |
| ✅ ready | [count] | [%] |
| ⚡ atomized | [count] | [%] |
| 🚀 published | [count] | [%] |

---

### Content by Series

| Series | Count | Status Breakdown |
|--------|-------|------------------|
| 60s-fix | [count] | idea: X, draft: X, ... |
| i-tried-it | [count] | ... |
| quick-tip | [count] | ... |
| stack-update | [count] | ... |
| viral-reel | [count] | ... |
| unassigned | [count] | ... |

---

### Atoms by Platform

| Platform | Count | Draft | Scheduled | Posted |
|----------|-------|-------|-----------|--------|
| twitter | [count] | [X] | [X] | [X] |
| tiktok | [count] | [X] | [X] | [X] |
| instagram | [count] | [X] | [X] | [X] |
| linkedin | [count] | [X] | [X] | [X] |
| threads | [count] | [X] | [X] | [X] |
| bluesky | [count] | [X] | [X] | [X] |
| youtube | [count] | [X] | [X] | [X] |
| medium | [count] | [X] | [X] | [X] |
| devto | [count] | [X] | [X] | [X] |
| substack | [count] | [X] | [X] | [X] |
| reddit | [count] | [X] | [X] | [X] |

---

### Weekly Targets (from content-config)

| Target | Goal | Current Week |
|--------|------|--------------|
| Original Pieces | 4-5 | [count created this week] |
| Total Atoms | 15-25 | [count created this week] |
| 60s Fix Videos | 2 | [count this week] |
| I Tried It Deep Dive | 1 | [count this week] |

---

### Action Items

[List any actionable items based on status:]
- ⚠️ [X] content pieces stuck in 'idea' status for >7 days
- ⚠️ [X] atomized content not yet published
- ⚠️ [X] atoms in 'draft' status ready for scheduling
- ✅ All targets met for this week / ⚠️ Behind on [X]
```

5. If `--detailed` is specified, add section:

```
---

### Detailed Content List

#### Ideas (not yet drafted)
| Title | Series | Created | Days Old |
|-------|--------|---------|----------|
| [title] | [series] | [date] | [X] |

#### Drafts (in progress)
...

#### Ready (awaiting atomization)
...

#### Atomized (awaiting publishing)
...
```

## Notes

- Run this regularly to stay on top of your content pipeline
- The "Action Items" section highlights what needs attention
- Use `--detailed` when doing weekly review
- All data comes from Supabase, no local file dependencies
