-- 0031_seed_detail_page_content.sql
-- Seed first individual project and writing detail records into page_content.
--
-- This preserves the current public markdown/frontmatter rendering for one
-- project detail page and one writing detail page while proving the structured
-- detail-record path. It does not add save APIs, publish writes, newsletter
-- sends, source rewrites, Cloudflare Access changes, or external mutations.
--
-- Rollback:
--   DELETE FROM page_content
--   WHERE id IN (
--     'page-project-quantercise-v1-2026-06-29',
--     'page-writing-saturdays-are-for-claude-code-v1-2026-06-29'
--   );
--   DELETE FROM content_draft_operations
--   WHERE operation_id IN (
--     'content-draft-project-quantercise-detail-2026-06-29',
--     'content-draft-writing-saturdays-detail-2026-06-29'
--   );

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
  'page-project-quantercise-v1-2026-06-29',
  'project:quantercise',
  '{"slug":"quantercise","title":"quantercise","status":"live","year":"2024-","range":"Ongoing","tags":["next.js","typescript","postgres","drizzle","stripe","python"],"summary":"quant prep with postgres, drizzle, stripe, and sandboxed python grading.","body":"Quantercise started as my own quant interview prep tool and turned into a full product: 400+ problems, real-time Python execution, math rendering, progress tracking, and payments.","links":[{"label":"live site","url":"https://quantercise.com"}],"featured":true,"order":100,"visible":true}',
  1,
  1,
  '2026-06-29T07:30:00Z',
  'codex',
  '2026-06-29T07:30:00Z',
  '[{"event":"seeded","source":"drizzle/migrations/0031_seed_detail_page_content.sql","summary":"Seeded project:quantercise as structured detail page_content while preserving markdown fallback."}]'
);

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
  'page-writing-saturdays-are-for-claude-code-v1-2026-06-29',
  'writing:saturdays-are-for-claude-code',
  '{"slug":"saturdays-are-for-claude-code","title":"saturdays are for claude code","date":"2026-04-13","tags":["claude-code","press","workflow","building"],"preview":"business insider interviewed me about ai usage limits. the useful part was less the quote and more the workflow it forced.","body":"The original Business Insider piece is here: [Saturdays are for Claude: How AI limits are reshaping the workday](https://www.businessinsider.com/ai-usage-limits-causing-some-to-restructure-their-workday-2026-4).\n\nA reporter from Business Insider reached out a couple weeks ago. He was writing about how usage limits on AI tools are changing the way people work. Somebody pointed him to me because I''ve been pretty vocal about how I use Claude Code.\n\nHe nailed the broad strokes. I do plan my work around session limits. I do save the hardest tasks for when I''m far from the cap. And yes, Saturdays are for Claude Code. That quote is real. My friends think I''m joking when I say that. I''m not.\n\nBut there''s stuff the article couldn''t capture because it''s a 1200-word piece about multiple people, not a deep dive on one workflow.\n\n## The actual numbers\n\nI track everything. Every session, every tool call, every dollar.\n\nMy median Claude Code session runs about 31 minutes wall clock. But Claude is only _actively working_ for about 15 of those minutes. The rest is me: reading diffs, making decisions, approving tool calls. The bottleneck is never the AI. It''s me.\n\nActive tool rate holds steady at about 3.3 calls per minute for any session over 10 minutes. Claude doesn''t slow down in long sessions. I do. Wall-time tool rate drops 8.8x from short sessions to marathons. That''s 100% human idle time.\n\nSessions under 30 minutes are the sweet spot. Past an hour, more than half hit context limits and need compaction. That''s when you lose coherence. So the usage limit forcing you to stop isn''t just about tokens. It''s preventing the session quality degradation that happens naturally anyway.\n\nYou can see the broader agent workflow on [my orchestrating page](/orchestrating). It''s live, updated from my actual session logs.\n\n## Why the limit is a feature\n\nThe article framed limits as a constraint. And for the other people interviewed, it clearly is. One guy described panic when his team hits the cap. I get that.\n\nBut for me, the forced pause has become genuinely useful. When I hit the limit I stop and review. Not because I want to. Because I have to. And every time, I catch something I would have missed if I''d kept going. A file I over-abstracted. A test I forgot. An approach that''s working but not the right one.\n\nThe best sessions aren''t the ones where Claude runs the longest. They''re the ones where I front-loaded the context, kept the scope tight, and let it execute a focused plan. You learn that pretty fast when sessions cost real money (or cap your allowance).\n\n## What I''m building with it\n\nI''ve logged over 1,000 hours of Claude Code across 600+ sessions. Right now I''m running 5 Claude Code sessions across different projects in a given week. The admin dashboard for this site, a quantitative interview prep app, a Mac Mini monitoring system, and open source tooling for other Claude Code users. I built [Claudemon](/writing/i-built-a-monitor-for-my-claude-code-sessions) to watch all of them from one place.\n\nThe irony of getting interviewed about usage limits is that my entire workflow is designed to be maximally efficient with those limits. Specific prompts. Tight session scopes. [End-of-day todos written as agent instructions](/writing/stop-ending-your-day-with-fix-the-bug). Parallel agents in worktrees. None of this is because I''m trying to game the system. It''s because it produces better code.\n\nThe limits just made me figure that out faster.","sourceLinks":[{"label":"source","url":"https://www.businessinsider.com/ai-usage-limits-causing-some-to-restructure-their-workday-2026-4"}],"visible":true,"order":50}',
  1,
  1,
  '2026-06-29T07:30:00Z',
  'codex',
  '2026-06-29T07:30:00Z',
  '[{"event":"seeded","source":"drizzle/migrations/0031_seed_detail_page_content.sql","summary":"Seeded writing:saturdays-are-for-claude-code as structured detail page_content while preserving markdown fallback."}]'
);

INSERT OR IGNORE INTO content_draft_operations (
  operation_id,
  kind,
  surface,
  route,
  source_ref,
  field_path,
  current_value_ref,
  proposed_value,
  status,
  risk_level,
  authority_state,
  required_approval_ids,
  allowed_actions,
  forbidden_actions,
  preview_targets,
  proof_ids,
  evidence_uri,
  redaction,
  created_by,
  created_at,
  updated_at,
  expires_at,
  rollback_ref,
  reviewer_note,
  metadata
) VALUES (
  'content-draft-project-quantercise-detail-2026-06-29',
  'content_draft',
  'public_site',
  '/projects/quantercise',
  'D1 page_content:project:quantercise seeded by drizzle/migrations/0031_seed_detail_page_content.sql, fallback apps/www/src/content/projects/quantercise.md',
  'projects.quantercise.detail',
  'published_page_content:project:quantercise',
  'Review future edits to the Quantercise title, summary, body, links, tags, and visibility through preview-only operations before any save path edits page_content.',
  'previewed',
  'medium',
  'detail_page_content_preview_only_no_write',
  '[]',
  '["render_preview","request_review"]',
  '["save","publish","deploy","rewrite_markdown","sync_external"]',
  '["/content/review","/content/preview","/projects/quantercise"]',
  '["content.projects.quantercise.page-content","admin.content.preview.d1"]',
  'repo://apps/www/src/content/projects/quantercise.md',
  'public_copy_only',
  'agent',
  '2026-06-29T07:30:00Z',
  '2026-06-29T07:30:00Z',
  '2026-07-29T07:30:00Z',
  'source_markdown:apps/www/src/content/projects/quantercise.md',
  'First project detail row seeded as inert preview metadata. No source rewrite, save route, or publish event is created.',
  '{"source_migration":"drizzle/migrations/0031_seed_detail_page_content.sql"}'
);

INSERT OR IGNORE INTO content_draft_operations (
  operation_id,
  kind,
  surface,
  route,
  source_ref,
  field_path,
  current_value_ref,
  proposed_value,
  status,
  risk_level,
  authority_state,
  required_approval_ids,
  allowed_actions,
  forbidden_actions,
  preview_targets,
  proof_ids,
  evidence_uri,
  redaction,
  created_by,
  created_at,
  updated_at,
  expires_at,
  rollback_ref,
  reviewer_note,
  metadata
) VALUES (
  'content-draft-writing-saturdays-detail-2026-06-29',
  'content_draft',
  'public_site',
  '/writing/saturdays-are-for-claude-code',
  'D1 page_content:writing:saturdays-are-for-claude-code seeded by drizzle/migrations/0031_seed_detail_page_content.sql, fallback apps/www/src/content/writing/saturdays-are-for-claude-code.md',
  'writing.saturdays_are_for_claude_code.detail',
  'published_page_content:writing:saturdays-are-for-claude-code',
  'Review future edits to the Saturdays are for Claude Code title, summary, body, source link, tags, and publish visibility through preview-only operations before any save path edits page_content.',
  'previewed',
  'medium',
  'detail_page_content_preview_only_no_write',
  '[]',
  '["render_preview","request_review"]',
  '["save","publish","send","schedule","rewrite_markdown","sync_provider"]',
  '["/content/review","/content/preview","/writing/saturdays-are-for-claude-code"]',
  '["content.writing.saturdays.page-content","admin.content.preview.d1"]',
  'repo://apps/www/src/content/writing/saturdays-are-for-claude-code.md',
  'public_copy_only',
  'agent',
  '2026-06-29T07:30:00Z',
  '2026-06-29T07:30:00Z',
  '2026-07-29T07:30:00Z',
  'source_markdown:apps/www/src/content/writing/saturdays-are-for-claude-code.md',
  'First writing detail row seeded as inert preview metadata. No source rewrite, send, save route, or publish event is created.',
  '{"source_migration":"drizzle/migrations/0031_seed_detail_page_content.sql"}'
);
