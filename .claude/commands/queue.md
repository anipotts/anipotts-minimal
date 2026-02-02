# Add to Community Request Queue

Add an audience request to the community queue for content planning.

## Usage
```
/queue "<request>" --source <platform-or-handle> --priority <P1|P2|P3>
```

**Arguments:**
- `request` — What the audience member asked for (in quotes)
- `--source` — Where the request came from (e.g., "@user on twitter", "comment on tiktok", "r/ClaudeAI", "DM on instagram")
- `--priority` — P1 (schedule this week), P2 (within 2 weeks), P3 (backlog)

**Examples:**
```
/queue "how do you set up claude code with cursor?" --source "@devjohn on twitter" --priority P1
/queue "tutorial on building a portfolio with AI" --source "comment on tiktok" --priority P2
/queue "your vim keybindings setup" --source "r/ClaudeAI" --priority P3
```

## Instructions

1. Parse the arguments: request, source, priority

2. Determine the source platform from the `--source` argument:
   - Extract platform name (twitter, tiktok, reddit, linkedin, instagram, youtube, discord, etc.)
   - Keep the full source string for the table

3. Read `engagement/community-queue.md`

4. Add a new row to the Queue table at the top (newest first):
   ```
   | YYYY-MM-DD | [source] | [platform] | [request] | [priority] | TBD | new | |
   ```

5. Save `engagement/community-queue.md`

6. Output confirmation:
   ```
   ## Added to Community Queue

   **Request:** [request]
   **Source:** [source]
   **Platform:** [platform]
   **Priority:** [priority]
   **Status:** new

   Queue stats:
   - P1 items: [count]
   - P2 items: [count]
   - P3 items: [count]
   - Total open: [count]
   ```

7. If priority is P1, add a reminder:
   ```
   ⚡ P1 item — should be scheduled this week.
   Consider: Which series type fits? (60s-fix, i-tried-it, quick-tip, etc.)
   ```

## Priority Guidelines

| Priority | When to Use |
|----------|------------|
| **P1** | Multiple people asked, trending topic, or directly asked by engaged follower |
| **P2** | Good fit for brand, aligns with content pillars, single request |
| **P3** | Interesting but niche, low overlap with current audience |

## Notes
- During `/review-week`, P1 items get surfaced for immediate scheduling
- P2 items aging past 2 weeks should be promoted to P1 or deprioritized to P3
- After publishing content that answers a request, update status to "done" and link the pillar
