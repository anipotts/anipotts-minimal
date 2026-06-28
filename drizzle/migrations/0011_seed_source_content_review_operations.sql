-- 0011_seed_source_content_review_operations.sql
-- Seed inert admin review operations for source-backed project and writing content.
--
-- These rows make the project and writing lanes visible in the D1-backed
-- content review queue. They do not insert published content records, edit
-- markdown, add save APIs, publish, send, deploy, or mutate external services.
--
-- Rollback:
--   DELETE FROM content_draft_operations
--   WHERE operation_id IN (
--     'content-draft-project-card-fields-2026-06-28',
--     'content-draft-writing-newsletter-backfill-2026-06-28'
--   );

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
  'content-draft-project-card-fields-2026-06-28',
  'content_draft',
  'public_site',
  '/making',
  'apps/www/src/content/projects/*.md frontmatter',
  'projects.card_fields',
  'source_markdown_frontmatter',
  'Expose project title, subtitle, description, year, category, role, status, links, tags, technical notes, and roadmap in admin before modeling any write route.',
  'previewed',
  'low',
  'source_inventory_preview_only',
  '[]',
  '["render_preview","request_review"]',
  '["save","publish","deploy","rewrite_markdown","sync_external"]',
  '["/content","/content/review","/content/preview","/making"]',
  '["content.projects.frontmatter.schema","admin.content.source-inventory"]',
  'repo://apps/www/src/content/projects',
  'public_copy_only',
  'agent',
  '2026-06-28T00:00:00Z',
  '2026-06-28T00:00:00Z',
  '2026-07-28T00:00:00Z',
  'source_markdown_frontmatter',
  'Seeded as an inert review operation. No source files or public routes are changed.',
  '{"source":"drizzle/migrations/0011_seed_source_content_review_operations.sql","write_path":"inactive"}'
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
  'content-draft-writing-newsletter-backfill-2026-06-28',
  'content_draft',
  'newsletter',
  '/writing',
  'apps/www/src/content/writing/*.md frontmatter and body',
  'writing.newsletter_backfill',
  'source_markdown_collection',
  'Review published writing titles, summaries, tags, dates, and body length as newsletter backfill candidates without sending or scheduling an issue.',
  'previewed',
  'medium',
  'backfill_review_only_no_send',
  '[]',
  '["render_preview","request_review"]',
  '["save","publish","send","schedule","sync_provider"]',
  '["/content","/content/review","/content/preview","/writing","/newsletter"]',
  '["content.writing.frontmatter.schema","content.newsletter.backfill.plan","admin.content.source-inventory"]',
  'repo://apps/www/src/content/writing',
  'public_copy_only',
  'agent',
  '2026-06-28T00:00:00Z',
  '2026-06-28T00:00:00Z',
  '2026-07-28T00:00:00Z',
  'source_markdown_collection',
  'Seeded as an inert review operation. No newsletter provider action, send, schedule, or source mutation is created.',
  '{"source":"drizzle/migrations/0011_seed_source_content_review_operations.sql","write_path":"inactive"}'
);
