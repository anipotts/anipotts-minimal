-- 0033_refresh_draft_operation_save_metadata.sql
-- Refresh existing draft operation metadata now that admin has an audited,
-- passkey-protected draft-operation save route.
--
-- This does not write page_content, content_records, content_publish_events,
-- source files, sends, deploys, or external providers.

UPDATE content_draft_operations
SET
  allowed_actions = '["save_draft","render_preview","request_review"]',
  forbidden_actions = '["publish","deploy","send","sync_provider","write_page_content","write_source_file"]',
  authority_state = 'passkey_draft_save_no_publish',
  reviewer_note = 'Draft operation is reviewable and can be updated through the passkey-protected draft save route. No page_content write, source rewrite, external sync, send, schedule, deploy, or publish event is created.',
  metadata = CASE
    WHEN json_valid(metadata) THEN json_set(
      metadata,
      '$.draft_save_path',
      '/api/admin/content/draft-operation',
      '$.write_scope',
      'draft_operation_only'
    )
    ELSE '{"draft_save_path":"/api/admin/content/draft-operation","write_scope":"draft_operation_only"}'
  END,
  updated_at = '2026-06-29T08:10:00Z'
WHERE kind = 'content_draft';
