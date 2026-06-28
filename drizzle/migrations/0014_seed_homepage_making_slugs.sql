-- 0014_seed_homepage_making_slugs.sql
-- Move the homepage making/project selection into the published D1 home row.
--
-- This keeps the Astro source fallback and does not add save APIs, publish
-- routes, deploy triggers, or external mutations.
--
-- Rollback:
--   UPDATE page_content
--   SET content = json_remove(content, '$.sections.past_work.project_slugs')
--   WHERE id = 'page-home-v1-2026-06-28'
--     AND page_key = 'home';

UPDATE page_content
SET
  content = json_set(
    content,
    '$.sections.past_work.project_slugs',
    json('[
      "quantercise",
      "quantercise-extension",
      "saeshify",
      "nyu-purity-test"
    ]')
  ),
  version = 3,
  updated_at = '2026-06-28T00:00:00Z',
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
      'drizzle/migrations/0014_seed_homepage_making_slugs.sql',
      'summary',
      'Moved homepage making project slugs into D1 page_content while preserving source fallback.'
    )
  )
WHERE id = 'page-home-v1-2026-06-28'
  AND page_key = 'home';
