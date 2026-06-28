-- 0010_seed_home_page_content.sql
-- Seed the first published homepage page_content record.
--
-- This intentionally seeds safe homepage structure and the hero heading only.
-- The rich linked hero summary remains source-backed until the CMS supports
-- structured inline mentions. It does not add save APIs, publish routes,
-- deploy triggers, or external mutations.
--
-- Rollback:
--   DELETE FROM page_content
--   WHERE id = 'page-home-v1-2026-06-28';

INSERT OR IGNORE INTO page_content (
  id,
  page_key,
  content,
  version,
  published,
  updated_at,
  updated_by,
  created_at,
  version_history
) VALUES (
  'page-home-v1-2026-06-28',
  'home',
  '{"sections":{"intro":{"visible":true,"label":"index","heading":"hi, i''m ani"},"past_work":{"visible":true,"label":"making","limit":4,"links":[{"label":"view all","href":"/making"}],"view_all":"/making"},"latest_thoughts":{"visible":true,"label":"writing","limit":3,"links":[{"label":"view all","href":"/writing"}],"view_all":"/writing"}},"section_order":["intro","about","past_work","latest_thoughts"]}',
  1,
  1,
  '2026-06-28T00:00:00Z',
  'codex',
  '2026-06-28T00:00:00Z',
  '[{"event":"seeded","source":"drizzle/migrations/0010_seed_home_page_content.sql","summary":"Seeded homepage heading and section metadata while preserving source-backed rich hero summary."}]'
);
