# Atomize for Video (Series-Aware)

Generate video scripts from a pillar blog post. Template selection depends on series type.

## Usage
```
/atomize-video <path-to-pillar>
```

## Instructions

1. Read the pillar content at the provided path
2. Read the pillar's frontmatter — extract `series_type`, `artifact_url`, `artifact_type`
3. Read voice/tone-guide.md for Ani's voice
4. Read voice/platform-rules.md (TikTok + Instagram sections)
5. Read voice/anti-corny-guardrails.md

6. **Select template based on series type:**

   | Series | Template | Duration | Notes |
   |--------|----------|----------|-------|
   | 60s-fix | templates/tiktok-script.md | 30-60s | HOOK/THING/RESULT/TAG format |
   | viral-reel | templates/viral-reel-script.md | <30s | Face→screen→result, proven 100k+ format |
   | i-tried-it | Longer outline (no template) | 3-10 min | Full walkthrough, not just a script |
   | quick-tip | templates/tiktok-script.md | 15-30s | Shortened 60s Fix format |
   | stack-update | templates/tiktok-script.md | 30-45s | Tool demo focus |

7. Extract:
   - The most visually demonstrable point
   - A screen-recording-worthy moment
   - The hook that would make someone stop scrolling

8. Generate video outputs based on series:

   **For 60s-fix / quick-tip / stack-update:**
   - TikTok/Reel script using tiktok-script.md
   - Instagram carousel (optional, if series targets it)
   - Include artifact link (gist URL)

   **For viral-reel:**
   - Script using viral-reel-script.md
   - Under 30 seconds. Face hook → screen proof → result flash.
   - Include artifact link (gist URL)
   - Production note: film with phone, edit in Meta app

   **For i-tried-it:**
   - Longer video outline (not a template — write section-by-section plan)
   - Include: intro hook, problem statement, build process, key moments, result demo, takeaway
   - Instagram carousel summary of the build
   - Include artifact link (repo URL)

9. Set frontmatter fields: `series_type`, `voice_mode: spicy`, `artifact_url`, `artifact_type`

10. Save to:
    - `atoms/tiktok/YYYY-MM-DD-slug.tiktok.md`
    - `atoms/instagram/YYYY-MM-DD-slug.instagram.md` (if carousel generated)

11. Run anti-corny QA on all outputs

12. Show preview with timing/slide counts and artifact status

## Voice Check
- Would she naturally say this to camera?
- Is the hook genuinely stopping? (test: would YOU stop scrolling?)
- Are there visual elements to show (not just talking head)?
- Does the energy match Spicy mode?
- Is the artifact linked?
- Anti-corny QA passed?
