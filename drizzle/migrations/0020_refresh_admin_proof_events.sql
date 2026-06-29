-- 0020_refresh_admin_proof_events.sql
-- Refresh durable admin proof metadata now that the proof log is D1-backed.
--
-- This updates proof row status and next-action metadata only. It does not add
-- write APIs, deploy triggers, auth changes, Cloudflare Access changes,
-- content publishes, sends, or live-control paths.
--
-- Rollback:
--   UPDATE admin_proof_events
--   SET
--     next_safe_action = 'Keep deploy proof attached to admin route-level changes until proof rows move into D1.',
--     source_ref = 'apps/admin/src/data/proof.ts',
--     updated_at = '2026-06-28T00:00:00Z'
--   WHERE id = 'proof.admin.agent-deploy-scope';
--
--   UPDATE admin_proof_events
--   SET
--     status = 'pending',
--     next_safe_action = 'Before adding writes, require audited D1 operation records, rollback, and route proof.',
--     source_ref = 'apps/admin/src/data/proof.ts',
--     updated_at = '2026-06-28T00:00:00Z'
--   WHERE id = 'proof.admin.write-paths';

UPDATE admin_proof_events
SET
  next_safe_action = 'Keep scoped deploy and skipped-target proof current in admin_proof_events after each admin route-level change.',
  source_ref = 'drizzle/migrations/0012_admin_proof_events.sql',
  updated_at = '2026-06-29T00:00:00Z',
  metadata = json_set(
    CASE
      WHEN json_valid(metadata) THEN metadata
      ELSE '{}'
    END,
    '$.refreshed_by',
    'drizzle/migrations/0020_refresh_admin_proof_events.sql'
  )
WHERE id = 'proof.admin.agent-deploy-scope';

UPDATE admin_proof_events
SET
  status = 'verified',
  next_safe_action = 'Keep content save, publish, send, and live-control endpoints absent until a reviewed write path is approved.',
  source_ref = 'apps/admin/src/pages/api and scripts/admin/content-proof.mjs',
  updated_at = '2026-06-29T00:00:00Z',
  metadata = json_set(
    CASE
      WHEN json_valid(metadata) THEN metadata
      ELSE '{}'
    END,
    '$.refreshed_by',
    'drizzle/migrations/0020_refresh_admin_proof_events.sql'
  )
WHERE id = 'proof.admin.write-paths';
