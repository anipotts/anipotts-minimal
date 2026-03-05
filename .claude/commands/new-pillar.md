# Create New Pillar Content

Initialize a new pillar content file.

## Usage

```
/new-pillar "Title of Your Post"
```

## Instructions

1. Generate slug from title (lowercase, hyphens, no special chars)
2. Create file at `pillars/YYYY-MM-DD-slug.md`
3. Use pillars/\_template.md as base
4. Fill in metadata:
   - title
   - date (today)
   - slug
   - canonical URL

5. Open the file and prompt for initial brainstorm:

```
## New Pillar Created

**File:** pillars/{{date}}-{{slug}}.md
**Canonical:** https://thoughts.anipotts.com/{{slug}}

### Quick Brainstorm

Before you write, let's nail down:

1. **Core insight** (one sentence - what's the ONE thing?):
   >

2. **Who cares?** (why should someone read this?):
   >

3. **Hook angle** (how do you grab attention?):
   >

4. **Key points** (3-5 things to cover):
   -
   -
   -

5. **Visual potential** (carousel? video? code demo?):
   >

---

File is ready. Start writing when you're ready, then run:
```

/atomize pillars/{{date}}-{{slug}}.md

```

```
