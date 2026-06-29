-- 0024_seed_projects_index_page_content.sql
-- Seed the /projects archive index copy into D1 page_content.
--
-- This stores existing public route copy as structured page_content. It does
-- not add save APIs, publish routes, deploy triggers, provider sync, sends, or
-- write paths.
--
-- Rollback:
--   DELETE FROM page_content
--   WHERE id = 'page-projects-v1-2026-06-29';

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
  'page-projects-v1-2026-06-29',
  'projects',
  '{
    "title": "projects",
    "description": "every project with a page. flat list.",
    "hero_title": "archive",
    "hero_summary": "every project with a page. the curated story is at",
    "hero_link_label": "/making",
    "hero_link_href": "/making"
  }',
  1,
  1,
  '2026-06-29T00:00:00Z',
  'codex',
  '2026-06-29T00:00:00Z',
  '[{"event":"seeded","source":"drizzle/migrations/0024_seed_projects_index_page_content.sql","summary":"Seeded /projects archive title, description, hero copy, and /making link into D1 page_content while preserving source fallback."}]'
);
