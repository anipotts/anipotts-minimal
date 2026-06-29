-- 0026_seed_newsletter_archive_cta_content.sql
-- Move the /newsletter archive CTA copy into the published D1 newsletter row.
--
-- This stores existing public fallback copy as structured page_content. It does
-- not add save APIs, publish routes, deploy triggers, provider sync, sends, or
-- write paths.
--
-- Rollback:
--   UPDATE page_content
--   SET
--     content = json_remove(
--       content,
--       '$.archive_label',
--       '$.archive_copy',
--       '$.archive_link_label',
--       '$.archive_url'
--     ),
--     version = 1,
--     updated_at = '2026-06-28T00:00:00Z'
--   WHERE id = 'page-newsletter-v1-2026-06-28'
--     AND page_key = 'newsletter';

UPDATE page_content
SET
  content = json_set(
    content,
    '$.archive_label',
    'archive',
    '$.archive_copy',
    'published notes live here as the archive fills in.',
    '$.archive_link_label',
    'read the archive',
    '$.archive_url',
    '/archive'
  ),
  version = 2,
  updated_at = '2026-06-29T00:00:00Z',
  updated_by = 'codex',
  version_history = json_insert(
    CASE
      WHEN json_valid(version_history) THEN version_history
      ELSE '[]'
    END,
    '$[#]',
    json_object(
      'event',
      'seeded',
      'source',
      'drizzle/migrations/0026_seed_newsletter_archive_cta_content.sql',
      'summary',
      'Moved newsletter archive CTA label, copy, link label, and link URL into D1 page_content while preserving source fallback.'
    )
  )
WHERE id = 'page-newsletter-v1-2026-06-28'
  AND page_key = 'newsletter';
