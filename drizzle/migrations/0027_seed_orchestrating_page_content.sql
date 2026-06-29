-- 0027_seed_orchestrating_page_content.sql
-- Seed the /orchestrating hero copy into D1 page_content.
--
-- This stores existing public route copy as structured page_content. It does
-- not add save APIs, publish routes, deploy triggers, provider sync, sends, or
-- write paths.
--
-- Rollback:
--   DELETE FROM page_content
--   WHERE id = 'page-orchestrating-v1-2026-06-29';

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
  'page-orchestrating-v1-2026-06-29',
  'orchestrating',
  '{
    "title": "orchestrating",
    "description": "personal systems, labs, experiments, and local automation around ani''s work.",
    "section_label": "orchestrating",
    "hero_title": "weird operating room",
    "hero_summary": "where the private machinery goes when it is useful to see: local logs, small checks, cron traces, admin surfaces, and experiments that do not need a whole product around them.",
    "panel_label": "machine noise",
    "panel_copy": "tool calls captured from local session logs."
  }',
  1,
  1,
  '2026-06-29T00:00:00Z',
  'codex',
  '2026-06-29T00:00:00Z',
  '[{"event":"seeded","source":"drizzle/migrations/0027_seed_orchestrating_page_content.sql","summary":"Seeded /orchestrating title, description, hero copy, and panel copy into D1 page_content while preserving source fallback."}]'
);
