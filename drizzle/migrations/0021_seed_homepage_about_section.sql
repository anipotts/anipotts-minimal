-- 0021_seed_homepage_about_section.sql
-- Move the homepage about section into the published D1 home row.
--
-- This stores existing public fallback copy as structured page_content. It does
-- not add save APIs, publish routes, deploy triggers, provider sync, sends, or
-- write paths.
--
-- Rollback:
--   UPDATE page_content
--   SET
--     content = json_remove(content, '$.sections.about'),
--     version = 7,
--     updated_at = '2026-06-29T00:00:00Z'
--   WHERE id = 'page-home-v1-2026-06-28'
--     AND page_key = 'home';

UPDATE page_content
SET
  content = json_set(
    content,
    '$.sections.about',
    json('{
      "visible": true,
      "label": "about",
      "heading": "",
      "paragraphs": [
        "I design multi-agent systems that orchestrate combinatorial verification tasks. Autonomous QA/QC pipelines for AEC, SEO auditing at scale, document extraction across regulatory domains. Previously full stack at a YC F25 startup (under NDA).",
        "Everything I build ships with Claude Code. I publish the workflows, tooling, and real usage data as I go. Recently featured in Business Insider on how developers are restructuring their days around AI tools."
      ]
    }')
  ),
  version = 8,
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
      'drizzle/migrations/0021_seed_homepage_about_section.sql',
      'summary',
      'Moved homepage about section into D1 page_content while preserving source fallback.'
    )
  )
WHERE id = 'page-home-v1-2026-06-28'
  AND page_key = 'home';
