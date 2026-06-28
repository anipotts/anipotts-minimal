-- 0013_seed_homepage_proof_cards.sql
-- Move the homepage proof grid into the published D1 home page_content record.
--
-- This keeps the Astro source fallback and does not add save APIs, publish
-- routes, deploy triggers, or external mutations.
--
-- Rollback:
--   UPDATE page_content
--   SET content = json_remove(content, '$.proof_cards')
--   WHERE id = 'page-home-v1-2026-06-28'
--     AND page_key = 'home';

UPDATE page_content
SET
  content = json_set(
    content,
    '$.proof_cards',
    json('[
      {
        "label": "structured ai",
        "href": "https://getstructured.ai/",
        "title": "drawing chat with page-level citations",
        "detail": "architectural PDFs in, cited answers out. streamed claude/gemini and kept redis replay for live spectating and later debugging."
      },
      {
        "label": "quantercise",
        "href": "https://quantercise.com",
        "title": "quant prep with real grading",
        "detail": "next.js, typescript, postgres, drizzle, stripe, sandboxed python, and math-heavy grading paths."
      },
      {
        "label": "paragon global investments",
        "href": "https://paragoninvestments.org",
        "title": "research portal for a quant fund",
        "detail": "next.js and typescript on supabase. made fund research searchable and usable from mobile instead of buried in scattered docs."
      },
      {
        "label": "public tooling",
        "href": "/projects/claude-code-tips",
        "title": "tools i actually use",
        "detail": "claude-code-tips and imessage mcp are small public receipts from the same local-first workflow i run every day."
      }
    ]')
  ),
  version = 2,
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
      'drizzle/migrations/0013_seed_homepage_proof_cards.sql',
      'summary',
      'Moved homepage proof cards into D1 page_content while preserving source fallback.'
    )
  )
WHERE id = 'page-home-v1-2026-06-28'
  AND page_key = 'home';
