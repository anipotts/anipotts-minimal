-- 0012_admin_proof_events.sql
-- Add durable read-only admin proof rows.
--
-- This moves the static proof log baseline into D1 so admin proof can become
-- part of the structured admin state model. It does not add write APIs,
-- deploy triggers, auth changes, Cloudflare Access changes, or publish paths.
--
-- Rollback:
--   DELETE FROM admin_proof_events
--   WHERE id IN (
--     'proof.admin.agent-deploy-scope',
--     'proof.site.public-routes',
--     'proof.admin.unauth-block',
--     'proof.admin.write-paths'
--   );
--   DROP TABLE IF EXISTS admin_proof_events;

CREATE TABLE IF NOT EXISTS admin_proof_events (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence_uri TEXT NOT NULL,
  redaction TEXT NOT NULL,
  next_safe_action TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_admin_proof_events_status
  ON admin_proof_events (status, updated_at);

CREATE INDEX IF NOT EXISTS idx_admin_proof_events_kind
  ON admin_proof_events (kind, updated_at);

INSERT OR IGNORE INTO admin_proof_events (
  id,
  kind,
  status,
  title,
  summary,
  evidence_uri,
  redaction,
  next_safe_action,
  source_ref,
  created_at,
  updated_at,
  metadata
) VALUES (
  'proof.admin.agent-deploy-scope',
  'deploy',
  'verified',
  'agent admin deploys stay scoped',
  'Recent admin content platform PRs deployed the Astro admin target only. Www, admin-solid, ingest, newsletter, weekly-email, and state workers were skipped.',
  'https://github.com/anipotts/anipotts.com/actions/workflows/deploy.yml',
  'public_metadata',
  'Keep deploy proof attached to admin route-level changes until proof rows move into D1.',
  'apps/admin/src/data/proof.ts',
  '2026-06-28T00:00:00Z',
  '2026-06-28T00:00:00Z',
  '{"seed":"drizzle/migrations/0012_admin_proof_events.sql","write_path":"inactive"}'
);

INSERT OR IGNORE INTO admin_proof_events (
  id,
  kind,
  status,
  title,
  summary,
  evidence_uri,
  redaction,
  next_safe_action,
  source_ref,
  created_at,
  updated_at,
  metadata
) VALUES (
  'proof.site.public-routes',
  'route',
  'verified',
  'public content routes answer',
  'Live public route probes have returned 200 for the current Astro site routes, while admin remains separately protected.',
  'https://anipotts.com',
  'public_metadata',
  'Keep public smoke coverage on the stable route set before expanding content from D1.',
  'apps/admin/src/data/proof.ts',
  '2026-06-28T00:00:00Z',
  '2026-06-28T00:00:00Z',
  '{"seed":"drizzle/migrations/0012_admin_proof_events.sql","write_path":"inactive"}'
);

INSERT OR IGNORE INTO admin_proof_events (
  id,
  kind,
  status,
  title,
  summary,
  evidence_uri,
  redaction,
  next_safe_action,
  source_ref,
  created_at,
  updated_at,
  metadata
) VALUES (
  'proof.admin.unauth-block',
  'auth',
  'verified',
  'admin unauthenticated block holds',
  'Unauthenticated admin probes return 302 to Cloudflare Access while app-native passkey proof is incomplete.',
  'https://admin.anipotts.com/auth/passkey',
  'protected_route',
  'After passkey enrollment, prove app-native login and then remove Cloudflare Access.',
  'apps/admin/src/data/proof.ts',
  '2026-06-28T00:00:00Z',
  '2026-06-28T00:00:00Z',
  '{"seed":"drizzle/migrations/0012_admin_proof_events.sql","write_path":"inactive"}'
);

INSERT OR IGNORE INTO admin_proof_events (
  id,
  kind,
  status,
  title,
  summary,
  evidence_uri,
  redaction,
  next_safe_action,
  source_ref,
  created_at,
  updated_at,
  metadata
) VALUES (
  'proof.admin.write-paths',
  'gate',
  'pending',
  'admin write paths remain inert',
  'Content preview, review, operations, mutation, and destructive-operation routes expose no save, publish, send, or live-control endpoint.',
  'apps/admin/src/pages',
  'metadata_only',
  'Before adding writes, require audited D1 operation records, rollback, and route proof.',
  'apps/admin/src/data/proof.ts',
  '2026-06-28T00:00:00Z',
  '2026-06-28T00:00:00Z',
  '{"seed":"drizzle/migrations/0012_admin_proof_events.sql","write_path":"inactive"}'
);
