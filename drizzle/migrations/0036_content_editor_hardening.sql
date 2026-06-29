-- 0036_content_editor_hardening.sql
-- Add indexed draft editor columns and preserve older json-backed rows.

ALTER TABLE content_draft_operations ADD COLUMN page_key TEXT;
ALTER TABLE content_draft_operations ADD COLUMN slug TEXT;
ALTER TABLE content_draft_operations ADD COLUMN title TEXT;
ALTER TABLE content_draft_operations ADD COLUMN visibility TEXT;
ALTER TABLE content_draft_operations ADD COLUMN updated_by TEXT;
ALTER TABLE content_draft_operations ADD COLUMN published_from_operation_id TEXT;

UPDATE content_draft_operations
SET
  page_key = json_extract(metadata, '$.page_key'),
  slug = json_extract(metadata, '$.slug'),
  title = json_extract(metadata, '$.title'),
  visibility = json_extract(metadata, '$.visibility'),
  updated_by = created_by
WHERE page_key IS NULL
  AND json_extract(metadata, '$.page_key') IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_draft_operations_page_key_status
  ON content_draft_operations (page_key, status, updated_at);

CREATE INDEX IF NOT EXISTS idx_content_draft_operations_slug
  ON content_draft_operations (slug);

CREATE INDEX IF NOT EXISTS idx_content_draft_operations_visibility
  ON content_draft_operations (visibility, updated_at);
