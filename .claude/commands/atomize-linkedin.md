# Atomize for LinkedIn Only (Series-Aware)

Generate a LinkedIn post from a pillar blog post with Professional voice mode and proof link.

## Usage

```
/atomize-linkedin <path-to-pillar>
```

## Instructions

1. Read the pillar content at the provided path
2. Read the pillar's frontmatter — extract `series_type`, `artifact_url`, `artifact_type`
3. Read voice/tone-guide.md — use **Professional** mode (LinkedIn default)
4. Read voice/platform-rules.md (LinkedIn section) — use hook formulas
5. Read voice/anti-corny-guardrails.md
6. Read templates/linkedin-post.md for format

7. Extract:
   - Core insight with a professional/career angle
   - Story or lesson-learned framing
   - Specific outcomes or numbers
   - Artifact URL for proof link

8. Generate a LinkedIn post:
   - Hook line (shows in feed preview — make it count)
   - Use hook formulas from CLAUDE.md:
     - "I [did specific thing]. Here's what happened."
     - "[Number] [timeframe] ago, I [started X]. Here's what I learned."
     - "Everyone's talking about [trend]. Here's what they're missing."
   - Body: Story > Insight > Takeaway format
   - 1300-1500 chars ideal
   - Line breaks every 2-3 sentences
   - CTA question at end to drive comments
   - **Proof Link:** Before hashtags, link to gist/repo/demo
   - 3 hashtags max at very end

9. Set frontmatter: `series_type`, `voice_mode: professional`, `artifact_url`, `artifact_type`

10. Save to: `atoms/linkedin/YYYY-MM-DD-slug.linkedin.md`

11. Run anti-corny QA

12. Show preview with character count, proof link status

## Voice Check

- Professional but not corporate (she's a student, not a CEO)
- Genuine insight, not performative wisdom
- Would this get comments or just polite likes?
- Is the proof link included?
- No guru energy or fake vulnerability
- Anti-corny QA passed?
