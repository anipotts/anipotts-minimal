-- 0025_seed_newsletter_archive_page_content.sql
-- Seed the /newsletter/archive copy into D1 page_content.
--
-- This stores existing public route copy as structured page_content. It does
-- not add save APIs, publish routes, deploy triggers, provider sync, sends, or
-- write paths.
--
-- Rollback:
--   DELETE FROM page_content
--   WHERE id = 'page-newsletter-archive-v1-2026-06-29';

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
  'page-newsletter-archive-v1-2026-06-29',
  'newsletter_archive',
  '{
    "title": "newsletter archive",
    "description": "published issues from ani''s first-party newsletter.",
    "hero_title": "newsletter archive",
    "hero_summary": "published issues will appear here after the first-party send path is verified.",
    "section_label": "archive"
  }',
  1,
  1,
  '2026-06-29T00:00:00Z',
  'codex',
  '2026-06-29T00:00:00Z',
  '[{"event":"seeded","source":"drizzle/migrations/0025_seed_newsletter_archive_page_content.sql","summary":"Seeded /newsletter/archive title, description, section label, and hero copy into D1 page_content while preserving source fallback."}]'
);
