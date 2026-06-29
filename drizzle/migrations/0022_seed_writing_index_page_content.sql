-- 0022_seed_writing_index_page_content.sql
-- Seed the /writing index copy into D1 page_content.
--
-- This stores existing public route copy as structured page_content. It does
-- not add save APIs, publish routes, deploy triggers, provider sync, sends, or
-- write paths.
--
-- Rollback:
--   DELETE FROM page_content
--   WHERE id = 'page-writing-v1-2026-06-29';

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
  'page-writing-v1-2026-06-29',
  'writing',
  '{
    "title": "writing",
    "description": "things ani''s written. claude code workflows, ai builds, the occasional music take.",
    "hero_title": "writing",
    "hero_summary": "stuff i''ve figured out and wanted to write down.",
    "search_placeholder": "search writing"
  }',
  1,
  1,
  '2026-06-29T00:00:00Z',
  'codex',
  '2026-06-29T00:00:00Z',
  '[{"event":"seeded","source":"drizzle/migrations/0022_seed_writing_index_page_content.sql","summary":"Seeded /writing index title, description, hero copy, and search placeholder into D1 page_content while preserving source fallback."}]'
);
