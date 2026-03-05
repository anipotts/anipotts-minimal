# Atomize for Twitter/X Only (Series-Aware)

Generate a Twitter thread from a pillar blog post with correct voice mode and artifact linking.

## Usage

```
/atomize-twitter <path-to-pillar>
```

## Instructions

1. Read the pillar content at the provided path
2. Read the pillar's frontmatter — extract `series_type`, `artifact_url`, `artifact_type`
3. Read voice/tone-guide.md — use **Spicy** mode (Twitter default)
4. Read voice/platform-rules.md (Twitter section) — use hook formulas
5. Read voice/anti-corny-guardrails.md
6. Read templates/twitter-thread.md for format

7. Extract:
   - Core insight
   - Best hook angle
   - 3-5 supporting points with specifics
   - Artifact URL for linking

8. Generate a Twitter thread:
   - Tweet 1 = HOOK (this is 80% of the battle)
   - Use hook formulas from CLAUDE.md:
     - "stop [doing common thing]. do this instead."
     - "[number] [seconds/lines/minutes]. that's all it took."
     - "claude code tip that [specific outcome]"
   - 8-12 tweets for i-tried-it / stack-update
   - 3-5 tweets for 60s-fix / quick-tip
   - Each tweet: one idea, max 280 chars
   - Final tweet: takeaway + soft CTA
   - **Artifact Tweet:** Reply to thread with gist/repo link
   - Include 1-2 relevant hashtags only if natural

9. Set frontmatter: `series_type`, `voice_mode: spicy`, `artifact_url`, `artifact_type`

10. Save to: `atoms/twitter/YYYY-MM-DD-slug.twitter.md`

11. Run anti-corny QA

12. Show preview of all tweets with character counts and artifact status

## Voice Check

- Does it sound like Ani in **Spicy** mode? (yk, ngl, tbh, short punchy sentences)
- Would she actually tweet this?
- Is the hook genuinely scroll-stopping?
- Are there specific details (not generic advice)?
- Is the artifact tweet included?
- Anti-corny QA passed?
