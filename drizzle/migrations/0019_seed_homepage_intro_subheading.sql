-- 0019_seed_homepage_intro_subheading.sql
-- Move the homepage intro subheading into the published D1 home row.
--
-- This keeps the source fallback in @anipotts/lib/cms and does not add save
-- APIs, publish routes, deploy triggers, provider sync, sends, or write paths.
--
-- Rollback:
--   UPDATE page_content
--   SET
--     content = json_remove(content, '$.sections.intro.subheading'),
--     version = 6,
--     updated_at = '2026-06-28T00:00:00Z'
--   WHERE id = 'page-home-v1-2026-06-28'
--     AND page_key = 'home';

UPDATE page_content
SET
  content = json_set(
    content,
    '$.sections.intro.subheading',
    'previously worked on real-time agent i/o at structured ai (YC F25) and our bad habit, an atlantic records venture. every now and then i post about what i''m doing with claude code and codex.'
  ),
  version = 7,
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
      'drizzle/migrations/0019_seed_homepage_intro_subheading.sql',
      'summary',
      'Moved homepage intro subheading into D1 page_content while preserving source fallback.'
    )
  )
WHERE id = 'page-home-v1-2026-06-28'
  AND page_key = 'home';
