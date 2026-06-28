-- 0016_seed_homepage_rich_summary.sql
-- Move the homepage rich intro summary into the published D1 home row.
--
-- This stores structured text and mention keys only. Visual brand metadata
-- stays in the Astro source fallback. It does not add save APIs, publish
-- routes, deploy triggers, or external mutations.
--
-- Rollback:
--   UPDATE page_content
--   SET content = json_remove(content, '$.sections.intro.rich_summary')
--   WHERE id = 'page-home-v1-2026-06-28'
--     AND page_key = 'home';

UPDATE page_content
SET
  content = json_set(
    content,
    '$.sections.intro.rich_summary',
    json('[
      {
        "segments": [
          {
            "kind": "text",
            "text": "previously worked on real-time agent i/o at "
          },
          {
            "kind": "cluster",
            "segments": [
              { "kind": "mention", "key": "structuredAi" },
              {
                "kind": "parens",
                "segments": [
                  { "kind": "mention", "key": "yCombinatorF25" }
                ]
              }
            ]
          },
          { "kind": "text", "text": " and " },
          {
            "kind": "cluster",
            "segments": [
              { "kind": "mention", "key": "badHabit", "suffix": "," },
              { "kind": "text", "text": "an " },
              { "kind": "mention", "key": "atlanticRecords" },
              { "kind": "text", "text": " venture." }
            ]
          }
        ]
      },
      {
        "segments": [
          {
            "kind": "text",
            "text": "every now and then i post about what i''m doing with claude code and codex, as featured on "
          },
          { "kind": "mention", "key": "businessInsider", "suffix": "." }
        ]
      }
    ]')
  ),
  version = 5,
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
      'drizzle/migrations/0016_seed_homepage_rich_summary.sql',
      'summary',
      'Moved homepage rich intro summary into D1 page_content as structured text and mention keys while preserving source fallback.'
    )
  )
WHERE id = 'page-home-v1-2026-06-28'
  AND page_key = 'home';
