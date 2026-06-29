-- 0030_expand_orchestrating_page_content.sql
-- Expand /orchestrating page_content beyond hero copy.
--
-- This moves existing public route labels, loop cards, and public-tool cards
-- into the structured D1 page_content record so admin can review the page as a
-- single content object. It does not add save APIs, publish routes, deploy
-- triggers, provider sync, sends, or write paths.
--
-- Rollback:
--   UPDATE page_content
--   SET
--     content = '{
--       "title": "orchestrating",
--       "description": "personal systems, labs, experiments, and local automation around ani''s work.",
--       "section_label": "orchestrating",
--       "hero_title": "weird operating room",
--       "hero_summary": "where the private machinery goes when it is useful to see: local logs, small checks, cron traces, admin surfaces, and experiments that do not need a whole product around them.",
--       "panel_label": "machine noise",
--       "panel_copy": "tool calls captured from local session logs."
--     }',
--     version = 1,
--     updated_at = '2026-06-29T00:00:00Z'
--   WHERE page_key = 'orchestrating';

UPDATE page_content
SET
  content = '{
    "title": "orchestrating",
    "description": "personal systems, labs, experiments, and local automation around ani''s work.",
    "section_label": "orchestrating",
    "hero_title": "weird operating room",
    "hero_summary": "where the private machinery goes when it is useful to see: local logs, small checks, cron traces, admin surfaces, and experiments that do not need a whole product around them.",
    "panel_label": "machine noise",
    "panel_copy": "tool calls captured from local session logs.",
    "sections": {
      "systems": "systems",
      "loop": "how it stays useful",
      "public_tools": "public tooling",
      "public_tools_note": "agent notes and local tools",
      "status": "status",
      "status_note": "tool calls + file mutations",
      "records": "strange highs",
      "plugin": "local console",
      "hooks": "safety rails",
      "playbooks": "notes",
      "sessions": "recent traces"
    },
    "loop_cards": [
      {
        "label": "logs",
        "title": "everything leaves a trail",
        "detail": "local sessions and cron output get captured so future me can debug instead of guess."
      },
      {
        "label": "edges",
        "title": "experiments stay inspectable",
        "detail": "labs and odd tools can be public without pretending to be products."
      },
      {
        "label": "guards",
        "title": "sharp tools get rails",
        "detail": "small checks keep agents and scripts from doing expensive dumb things while still letting them move."
      },
      {
        "label": "controls",
        "title": "repeated work gets a surface",
        "detail": "if an action matters twice, it becomes a command, dashboard, admin field, or tiny page."
      }
    ],
    "public_tools": [
      {
        "title": "claude code tips",
        "href": "/projects/claude-code-tips",
        "detail": "hooks, agents, plugin notes, and working patterns from actual agent sessions."
      },
      {
        "title": "imessage mcp",
        "href": "/projects/imessage-mcp",
        "detail": "local-first mcp for searching message history without turning private data into a cloud product."
      }
    ]
  }',
  version = 2,
  updated_at = '2026-06-29T00:30:00Z',
  updated_by = 'codex',
  version_history = json_insert(
    CASE
      WHEN json_valid(version_history) THEN version_history
      ELSE '[]'
    END,
    '$[#]',
    json_object(
      'event',
      'expanded',
      'source',
      'drizzle/migrations/0030_expand_orchestrating_page_content.sql',
      'summary',
      'Moved /orchestrating section labels, loop cards, and public-tool cards into structured page_content while preserving source fallback.'
    )
  )
WHERE page_key = 'orchestrating';

UPDATE content_draft_operations
SET
  source_ref = 'D1 page_content:orchestrating, fallback @anipotts/content/public DEFAULT_ORCHESTRATING_CONTENT',
  field_path = 'orchestrating.hero_sections_loop_tools',
  proposed_value = 'Review future edits to the /orchestrating hero, section labels, loop cards, and public-tool cards through preview-only operations before any save path edits page_content.',
  updated_at = '2026-06-29T00:30:00Z',
  reviewer_note = 'Expanded from hero-only copy to a fuller page_content contract. Still inert preview metadata only.',
  metadata = json_set(
    CASE
      WHEN json_valid(metadata) THEN metadata
      ELSE '{}'
    END,
    '$.expanded_by',
    'drizzle/migrations/0030_expand_orchestrating_page_content.sql'
  )
WHERE operation_id = 'content-draft-orchestrating-hero-copy-2026-06-29';
