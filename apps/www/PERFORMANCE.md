# Performance Audit

**Date:** 2026-03-05
**Scope:** apps/www + packages/lib CMS queries + packages/ui Waves animation

## Current State: Good

The codebase is already well-optimized in most areas. No critical performance issues found.

## What's Already Well-Optimized

### Waves Animation (packages/ui/src/components/animation/Waves.tsx)
- IntersectionObserver pauses animation when off-screen (line 405)
- Throttled to 30fps via FRAME_INTERVAL (line 138)
- Respects `prefers-reduced-motion`: renders single static frame and exits (line 393)
- Uses refs instead of state for animation data (avoids re-renders)
- Canvas-based rendering (no DOM thrashing)

### Font Loading (apps/www/src/app/layout.tsx)
- next/font/google with `display: "swap"` for both fonts
- Only `latin` subset loaded (no unnecessary weights)
- Applied via CSS variables on `<html>` element

### Client Component Architecture
- Only 8 "use client" files in apps/www/src (lean client boundary)
- Admin pages are server components with small focused client islands
- Navbar, SiteStatusBar, TerminalHeaderWrapper are minimal wrappers
- ThoughtsSearch uses 250ms debounce on router.push

### Code Splitting
- Admin behind auth in layout.tsx (server component). Not bundled with public pages.
- Admin client components (pipeline-filters, approve-button, status-actions, teleprompter, quick-post-form) are small (<130 lines each). Dynamic imports would add complexity with no meaningful payload reduction.

### Caching & Revalidation
- Thought pages use `revalidate = 60` with `generateStaticParams` (ISR)
- Admin pages use `force-dynamic` (correct for real-time admin data)

## Findings

### 1. Raw `<img>` in Markdown Renderer (Low Impact)
**File:** `apps/www/src/app/(main)/thoughts/[slug]/page.tsx:135`

ReactMarkdown's custom `img` component uses a raw `<img>` tag. This bypasses next/image optimization (no WebP/AVIF, no lazy loading attributes, no responsive srcset).

**Why it stays:** Markdown image sources are arbitrary URLs. next/image requires known `width`/`height` or `fill` with a sized container, plus `remotePatterns` config for each domain. The `style={{ maxWidth: "100%" }}` prevents layout overflow.

**Future improvement:** If images are primarily from Supabase storage, configure `remotePatterns` for that domain and use next/image with `fill` in a sized container.

### 2. SELECT * in Two CMS Functions (Low Impact)
**File:** `packages/lib/src/cms/index.ts`

- `fetchProjects` (line 53): `select("*")` on projects table
- `fetchSocialLinks` (line 170): `select("*")` on social_links table

`fetchThoughts` correctly selects specific columns (line 110).

**Impact:** Minimal. These tables are small (likely <50 rows) and the extra columns are trivial bandwidth. The `fetchThoughts` function handles it correctly for the larger dataset.

### 3. Atom Count Query Pattern (Low Impact, Admin Only)
**File:** `apps/www/src/app/admin/page.tsx:34-43`

Fetches ALL atoms just to count them per content_id, rather than using a count aggregate or join:
```ts
const { data: atomCounts } = await supabase.from('atoms').select('content_id')
```

**Better approach:** Use `.select('content_id, count', { count: 'exact', head: false })` grouped by content_id, or a Supabase RPC/view for aggregated counts.

**Impact:** Only affects admin page load. Acceptable for current scale but will degrade if atom count grows to thousands.

### 4. Content Detail Pages Use SELECT * (Low Impact, Admin Only)
**Files:** `apps/www/src/app/admin/content/[id]/page.tsx:38`, `admin/record/[id]/page.tsx:57`

Both fetch `select('*')` for a single thought by ID. Low impact since it's one row, admin-only.

### 5. No Bundle Analyzer Configured
**File:** `apps/www/next.config.ts`

No `@next/bundle-analyzer` configured. Useful for tracking bundle size over time.

**Recommendation:** Add as optional dev dependency for periodic checks, not in CI.

## Recommendations (Prioritized)

### High Value, Future
1. **Add Supabase storage to `remotePatterns`** and convert markdown images to next/image for automatic WebP/AVIF and responsive srcsets
2. **Monitor bundle size** periodically with `@next/bundle-analyzer`

### Medium Value, Future
3. **Optimize atom count query** when atom table grows beyond ~500 rows
4. **Add `select()` column lists** to `fetchProjects`/`fetchSocialLinks` for consistency

### Low Value (No Action Needed)
5. Admin dynamic imports - components are already small, server-rendered pages handle code splitting naturally
6. Client component re-renders - all components are lean with no unnecessary re-render patterns
