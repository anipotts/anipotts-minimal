-- 0017_seed_homepage_mentions.sql
-- Move homepage mention visual metadata into the published D1 home row.
--
-- This stores labels, safe links, and local image paths for the homepage rich
-- intro mentions. It does not add save APIs, publish routes, deploy triggers,
-- or external mutations.
--
-- Rollback:
--   UPDATE page_content
--   SET content = json_remove(content, '$.mentions')
--   WHERE id = 'page-home-v1-2026-06-28'
--     AND page_key = 'home';

UPDATE page_content
SET
  content = json_set(
    content,
    '$.mentions',
    json('{
      "structuredAi": {
        "label": "structured ai",
        "href": "https://getstructured.ai/",
        "logoSrc": "/images/brand/structured-ai-favicon.png",
        "logoAlt": "structured ai",
        "logoTone": "white"
      },
      "yCombinatorF25": {
        "label": "F25",
        "logoSrc": "/images/brand/ycombinator-favicon.ico",
        "logoAlt": "y combinator"
      },
      "badHabit": {
        "label": "our bad habit",
        "href": "https://ourbadhabit.com/",
        "logoSrc": "/images/brand/bad-habit-favicon.png",
        "logoAlt": "our bad habit"
      },
      "atlanticRecords": {
        "label": "atlantic records",
        "href": "https://www.atlanticrecords.com/",
        "logoSrc": "/images/brand/atlantic-records-logo-cropped.png",
        "logoAlt": "atlantic records",
        "logoShape": "wide"
      },
      "businessInsider": {
        "label": "business insider",
        "href": "/writing/saturdays-are-for-claude-code",
        "logoSrc": "/images/brand/business-insider-favicon.svg",
        "logoAlt": "business insider"
      }
    }')
  ),
  version = 6,
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
      'drizzle/migrations/0017_seed_homepage_mentions.sql',
      'summary',
      'Moved homepage mention labels, links, and local image paths into D1 page_content while preserving source fallback.'
    )
  )
WHERE id = 'page-home-v1-2026-06-28'
  AND page_key = 'home';
