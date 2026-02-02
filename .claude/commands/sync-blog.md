# Sync with Blog

Sync pillar content with thoughts.anipotts.com.

## Usage
```
/sync-blog [path-to-pillar]
```

If no path provided, syncs all pillars with status: ready.

## Instructions

1. Read the pillar content file(s)
2. Check frontmatter for `status: ready` (skip drafts)
3. Format for thoughts.anipotts.com:
   - Ensure frontmatter is compatible with the blog's markdown parser
   - Verify canonical URL is set
   - Check all images have alt text
   - Ensure code blocks have language tags

4. Show diff/preview:

```
## Ready to Sync

**Posts to sync:**
- [title] → thoughts.anipotts.com/[slug]
  Status: [new/updated]
  Word count: [count]

**Confirm sync? (y/n)**
```

5. Run scripts/sync-to-blog.sh with the prepared content

## Pre-sync Checklist
- [ ] Title is compelling
- [ ] Slug is clean and SEO-friendly
- [ ] Canonical URL matches
- [ ] All links work
- [ ] Code snippets are formatted
- [ ] Meta description is set
- [ ] Tags are appropriate
