-- 0009_seed_newsletter_page_content.sql
-- Seed the first published newsletter page_content record.
--
-- This copies the current @anipotts/lib/cms DEFAULT_NEWSLETTER_CONTENT into D1
-- so the newsletter page reads stable structured content instead of only source
-- fallbacks. It does not add save APIs, send email, sync providers, publish an
-- issue, or mutate external services.
--
-- Rollback:
--   DELETE FROM page_content
--   WHERE id = 'page-newsletter-v1-2026-06-28';

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
  'page-newsletter-v1-2026-06-28',
  'newsletter',
  '{"headline":"notes from the build loop","deck":"notes on agent workflows and product builds, including the parts that broke while shipping.","cta_label":"subscribe","success_message":"subscribed. check your inbox.","error_message":"could not subscribe. try again in a minute.","footer_text":"you can unsubscribe at any time.","buttondown_url":"https://news.anipotts.com","sender_name":"Ani Potts","sender_email":"news@anipotts.com","reply_to":"contact@anipotts.com"}',
  1,
  1,
  '2026-06-28T00:00:00Z',
  'codex',
  '2026-06-28T00:00:00Z',
  '[{"event":"seeded","source":"drizzle/migrations/0009_seed_newsletter_page_content.sql","summary":"Copied current newsletter source defaults into D1 page_content without adding write or send paths."}]'
);
