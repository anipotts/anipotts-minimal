-- 0035_seed_making_bucket_copy.sql
-- Add /making project bucket labels and notes to D1 page_content.
--
-- This moves existing public route bucket copy into the structured D1
-- page_content record so admin can review the complete /making listing copy as
-- one content object. It does not add save APIs, publish routes, deploy
-- triggers, provider sync, sends, source rewrites, or other write paths.
--
-- Rollback:
--   UPDATE page_content
--   SET
--     content = json_remove(content, '$.buckets'),
--     version = 1,
--     updated_at = '2026-06-29T00:00:00Z'
--   WHERE page_key = 'making' AND published = 1;

UPDATE page_content
SET
  content = json_set(
    CASE
      WHEN json_valid(content) THEN content
      ELSE '{}'
    END,
    '$.buckets',
    json('[
      {
        "id": "active",
        "label": "active",
        "note": "things still moving or maintained"
      },
      {
        "id": "past",
        "label": "past",
        "note": "finished work and older receipts"
      },
      {
        "id": "archive",
        "label": "archive",
        "note": "sunsetted projects kept for context"
      }
    ]')
  ),
  version = CASE
    WHEN version < 2 THEN 2
    ELSE version
  END,
  updated_at = '2026-06-29T09:45:00Z',
  updated_by = 'codex',
  version_history = json_insert(
    CASE
      WHEN json_valid(version_history) THEN version_history
      ELSE '[]'
    END,
    '$[#]',
    json_object(
      'event',
      'expanded',
      'source',
      'drizzle/migrations/0035_seed_making_bucket_copy.sql',
      'summary',
      'Moved /making project bucket labels and notes into structured page_content while preserving source fallback.'
    )
  )
WHERE page_key = 'making' AND published = 1;

UPDATE content_draft_operations
SET
  source_ref = 'D1 page_content:making.buckets and page copy, fallback @anipotts/content/public DEFAULT_MAKING_INDEX_CONTENT',
  field_path = 'projects.making_index_copy_and_buckets',
  proposed_value = 'Review future edits to the /making title, meta description, hero title, hero summary, and project bucket labels/notes through preview-only operations before any save path edits page_content.',
  updated_at = '2026-06-29T09:45:00Z',
  reviewer_note = 'Expanded /making page_content from hero-only copy to include project bucket labels and notes. Still inert preview metadata only.',
  metadata = json_set(
    CASE
      WHEN json_valid(metadata) THEN metadata
      ELSE '{}'
    END,
    '$.expanded_by',
    'drizzle/migrations/0035_seed_making_bucket_copy.sql'
  )
WHERE operation_id = 'content-draft-making-index-copy-2026-06-29';
