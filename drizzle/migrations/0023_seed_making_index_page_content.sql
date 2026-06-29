-- 0023_seed_making_index_page_content.sql
-- Seed the /making index copy into D1 page_content.
--
-- This stores existing public route copy as structured page_content. It does
-- not add save APIs, publish routes, deploy triggers, provider sync, sends, or
-- write paths.
--
-- Rollback:
--   DELETE FROM page_content
--   WHERE id = 'page-making-v1-2026-06-29';

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
  'page-making-v1-2026-06-29',
  'making',
  '{
    "title": "making",
    "description": "projects, experiments, weekly traces, and small utilities from ani potts.",
    "hero_title": "making",
    "hero_summary": "work i built or helped ship. product surfaces, data systems, quant tools, and the older pieces that still explain how i think."
  }',
  1,
  1,
  '2026-06-29T00:00:00Z',
  'codex',
  '2026-06-29T00:00:00Z',
  '[{"event":"seeded","source":"drizzle/migrations/0023_seed_making_index_page_content.sql","summary":"Seeded /making index title, description, and hero copy into D1 page_content while preserving source fallback."}]'
);
