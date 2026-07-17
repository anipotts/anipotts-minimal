-- 0040_reorder_homepage_rich_summary.sql
-- Put the public-writing sentence before the prior-work sentence.
--
-- This swaps the two existing structured sentence objects in place so their
-- text, mentions, links, punctuation, and visual metadata remain unchanged.
--
-- Rollback:
--   Apply an inverse array swap with reversed sentence guards as a new
--   reviewed page_content version.

UPDATE page_content
SET
  content = json_set(
    content,
    '$.sections.intro.rich_summary',
    json_array(
      json_extract(content, '$.sections.intro.rich_summary[1]'),
      json_extract(content, '$.sections.intro.rich_summary[0]')
    )
  ),
  version = version + 1,
  updated_at = '2026-07-17T00:00:00Z',
  updated_by = 'codex',
  version_history = json_insert(
    CASE
      WHEN json_valid(version_history) THEN version_history
      ELSE '[]'
    END,
    '$[#]',
    json_object(
      'event',
      'reordered',
      'source',
      'drizzle/migrations/0040_reorder_homepage_rich_summary.sql',
      'summary',
      'Reversed the two homepage rich-summary sentences without changing their structured content.'
    )
  )
WHERE id = 'page-home-v1-2026-06-28'
  AND page_key = 'home'
  AND published = 1
  AND json_array_length(
    json_extract(content, '$.sections.intro.rich_summary')
  ) = 2
  AND json_extract(
    content,
    '$.sections.intro.rich_summary[0].segments[0].text'
  ) = 'previously worked on real-time agent i/o at '
  AND json_extract(
    content,
    '$.sections.intro.rich_summary[1].segments[0].text'
  ) = 'every now and then i post about what i''m doing with claude code and codex, as featured on ';
