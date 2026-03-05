# Weekly Review

Run a comprehensive weekly review: delivery check, artifact coverage, platform performance, and North Star alignment. All data from Supabase.

## Usage

```
/review-week
```

## Instructions

1. Read configuration files for context:
   - `content-config/config/signature-series.yaml` (weekly targets)
   - `CLAUDE.md` (North Star goals, metrics)

2. Query Supabase for this week's data:

   ```bash
   cd ~/code/active/websites/anipotts.com

   # Get overall stats
   npx ts-node scripts/supabase-cli.ts stats

   # Get all content (filter by created_at in your analysis)
   npx ts-node scripts/supabase-cli.ts list-content

   # Get all atoms
   npx ts-node scripts/supabase-cli.ts list-atoms
   ```

3. Filter data for current week (last 7 days) in your analysis

4. Generate the weekly review report:

```
## Weekly Review — [YYYY-MM-DD]

**Period:** [start date] to [end date]
**Data Source:** Supabase

---

### 1. Delivery vs Targets

| Series | Target | Delivered | Status |
|--------|--------|-----------|--------|
| 60s Fix | 2 | [count this week] | ✅/⚠️/❌ |
| I Tried It | 1 | [count this week] | ✅/⚠️/❌ |
| Quick Tip | 1-2 | [count this week] | ✅/⚠️/❌ |
| Stack Update | as-needed | [count this week] | — |
| Viral Reel | 1-2 | [count this week] | ✅/⚠️/❌ |
| **Total Content** | **4-5** | **[count]** | |
| **Total Atoms** | **15-25** | **[count]** | |

---

### 2. Pipeline Health

| Status | Count | Notes |
|--------|-------|-------|
| 💡 idea | [count] | [oldest item age] |
| 📝 draft | [count] | |
| ✅ ready | [count] | Ready for atomization |
| ⚡ atomized | [count] | Ready for scheduling |
| 🚀 published | [count] | |

**Bottlenecks:**
- [X] items stuck in 'idea' for >7 days
- [X] items atomized but not yet posted

---

### 3. Artifact Coverage

| Metric | This Week |
|--------|-----------|
| Content with artifacts | [count]/[total requiring] ([%]) |
| Target | 80%+ |
| Status | ✅/⚠️/❌ |

**Missing artifacts (series that require them):**
- [ ] [title] (60s-fix) — needs gist
- [ ] [title] (i-tried-it) — needs repo

---

### 4. Platform Distribution

| Platform | Atoms Created | Scheduled | Posted |
|----------|---------------|-----------|--------|
| twitter | [count] | [count] | [count] |
| tiktok | [count] | [count] | [count] |
| instagram | [count] | [count] | [count] |
| linkedin | [count] | [count] | [count] |
| threads | [count] | [count] | [count] |
| bluesky | [count] | [count] | [count] |
| youtube | [count] | [count] | [count] |
| medium | [count] | [count] | [count] |
| devto | [count] | [count] | [count] |
| substack | [count] | [count] | [count] |
| reddit | [count] | [count] | [count] |

---

### 5. Platform Performance (Manual Input Required)

For each platform where content was posted this week:

> **Twitter/X:** How did this week's posts perform?
> - Impressions:
> - Engagement rate:
> - Top performer:
> - Viral moments:

> **TikTok:** Views on this week's videos?
> - Total views:
> - Best performer:
> - New followers:

> **LinkedIn:** Engagement on posts?
> - Impressions:
> - Engagement:
> - Comment quality:

> **Instagram:** Saves and shares?
> - Reach:
> - Saves:
> - Shares:

(Enter numbers above, or skip if no posts this week)

---

### 6. Content Mix Check

| Category | Target | This Week | Status |
|----------|--------|-----------|--------|
| Claude Code / AI | 70% | [%] | ✅/⚠️/❌ |
| UGC / BTS | 10% | [%] | ✅/⚠️/❌ |
| Productivity / Other | 20% | [%] | ✅/⚠️/❌ |

---

### 7. North Star Check

- [ ] **Authority + Trust** — Did this week's content demonstrate expertise? Any proof artifacts that double as portfolio pieces?
- [ ] **Audience Growth** — Net follower change across platforms?
- [ ] **Portfolio + Career** — Any repos/gists worth featuring on anipotts.com?
- [ ] **Engagement Quality** — Are people asking good questions? DMs? Collaboration requests?

---

### 8. Voice Mode Effectiveness

| Mode | Platforms Used | Worked Well? | Notes |
|------|---------------|-------------|-------|
| Spicy | Twitter, TikTok | | |
| Casual | Threads, IG, Bluesky, YouTube | | |
| Professional | LinkedIn, Medium, Dev.to | | |

---

### 9. Next Week Planning

**Priority Content:**
- [ ] [from P1 queue items]
- [ ] [series schedule requirements]

**Artifacts to Create:**
- [ ] [backlog items needing artifacts]

**Experiments to Try:**
- [ ] [format/hook/platform tests]

**Action Items:**
1. [specific next step]
2. [specific next step]
3. [specific next step]
```

5. Output the full report for discussion

## Notes

- Run this every Friday
- Performance metrics require manual input — this report generates the prompts
- All content/atom data comes from Supabase
- Use Admin UI (anipotts.com/admin → Analytics tab) for visual overview
- If delivery is consistently below targets, discuss capacity adjustment
