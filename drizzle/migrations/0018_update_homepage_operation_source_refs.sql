-- 0018_update_homepage_operation_source_refs.sql
-- Refresh stale homepage content operation source metadata after moving
-- homepage fallback content into @anipotts/lib/cms.
--
-- This updates metadata on inert review rows only. It does not create save
-- APIs, publish routes, content records, provider sync, sends, or deploys.
--
-- Rollback:
--   UPDATE content_draft_operations
--   SET
--     source_ref = 'D1 page_content:home.sections.intro.subheading, fallback apps/www/src/data/site.ts:homeContent.summary',
--     updated_at = '2026-06-28T00:00:00Z'
--   WHERE operation_id = 'content-draft-homepage-summary-2026-06-28';

UPDATE content_draft_operations
SET
  source_ref = 'D1 page_content:home.sections.intro.rich_summary and @anipotts/lib/cms homepageSummaryText fallback',
  updated_at = '2026-06-29T00:00:00Z',
  metadata = json_set(
    CASE
      WHEN json_valid(metadata) THEN metadata
      ELSE '{}'
    END,
    '$.source_ref_refreshed_by',
    'drizzle/migrations/0018_update_homepage_operation_source_refs.sql'
  )
WHERE operation_id = 'content-draft-homepage-summary-2026-06-28';
