-- 0029_update_public_content_contract_source_refs.sql
-- Refresh inert content operation source_ref metadata after moving pure public
-- content contracts from @anipotts/lib/cms to @anipotts/content/public.
--
-- This does not edit page_content, content_records, publish events, sends,
-- credentials, auth policy, DNS, or any external service.
--
-- Rollback:
--   UPDATE content_draft_operations
--   SET source_ref = replace(source_ref, '@anipotts/content/public', '@anipotts/lib/cms'),
--       metadata = json_set(
--         COALESCE(metadata, '{}'),
--         '$.source_ref_package',
--         '@anipotts/lib/cms'
--       )
--   WHERE source_ref LIKE '%@anipotts/content/public%';

UPDATE content_draft_operations
SET
  source_ref = replace(source_ref, '@anipotts/lib/cms', '@anipotts/content/public'),
  updated_at = '2026-06-29T00:00:00Z',
  metadata = json_set(
    COALESCE(metadata, '{}'),
    '$.source_ref_refreshed_by',
    'drizzle/migrations/0029_update_public_content_contract_source_refs.sql',
    '$.source_ref_package',
    '@anipotts/content/public'
  )
WHERE source_ref LIKE '%@anipotts/lib/cms%';
