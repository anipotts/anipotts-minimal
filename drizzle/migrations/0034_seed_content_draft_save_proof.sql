-- 0034_seed_content_draft_save_proof.sql
-- Add the durable proof row for the admin draft-save write path.
--
-- This records the proof gate for content_draft_operations saves. It does not
-- write page_content, content_records, content_publish_events, source files,
-- sends, deploys, or external providers.
--
-- Rollback:
--   DELETE FROM admin_proof_events
--   WHERE id = 'proof.admin.content-draft-save';

INSERT INTO admin_proof_events (
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
  'proof.admin.content-draft-save',
  'gate',
  'pending',
  'content draft saves need proof',
  'The focused editor can save draft operation rows only. This proof row becomes verified after a passkey-authenticated draft save records a content_draft_operations row and refreshes admin_proof_events.',
  'D1 anipotts-db content_draft_operations and admin_proof_events',
  'metadata_only',
  'enroll passkey, save one draft operation from /content/edit/home, then verify this proof row and keep publish blocked',
  'apps/admin/src/lib/content-draft-operation.ts',
  '2026-06-29T09:00:00Z',
  '2026-06-29T09:00:00Z',
  '{"seed":"drizzle/migrations/0034_seed_content_draft_save_proof.sql","write_scope":"draft_operation_only","status":"pending_first_save"}'
)
ON CONFLICT(id) DO UPDATE SET
  kind = excluded.kind,
  status = CASE
    WHEN admin_proof_events.status = 'verified' THEN admin_proof_events.status
    ELSE excluded.status
  END,
  title = CASE
    WHEN admin_proof_events.status = 'verified' THEN admin_proof_events.title
    ELSE excluded.title
  END,
  summary = CASE
    WHEN admin_proof_events.status = 'verified' THEN admin_proof_events.summary
    ELSE excluded.summary
  END,
  evidence_uri = excluded.evidence_uri,
  redaction = excluded.redaction,
  next_safe_action = CASE
    WHEN admin_proof_events.status = 'verified' THEN admin_proof_events.next_safe_action
    ELSE excluded.next_safe_action
  END,
  source_ref = excluded.source_ref,
  updated_at = CASE
    WHEN admin_proof_events.status = 'verified' THEN admin_proof_events.updated_at
    ELSE excluded.updated_at
  END,
  metadata = CASE
    WHEN admin_proof_events.status = 'verified' THEN admin_proof_events.metadata
    ELSE excluded.metadata
  END;
