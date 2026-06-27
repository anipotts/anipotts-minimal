-- 0007_content_operations.sql
-- Additive schema for the admin content operation model.
--
-- This creates storage for reviewable content records, draft operations, and
-- publish proof events. It does not add write APIs, publish routes, outbound
-- sends, triggers, or automatic public-site reads.

CREATE TABLE IF NOT EXISTS content_records (
  id TEXT PRIMARY KEY,
  content_key TEXT NOT NULL UNIQUE,
  surface TEXT NOT NULL,
  route TEXT NOT NULL,
  field_path TEXT NOT NULL,
  value TEXT NOT NULL,
  value_format TEXT NOT NULL DEFAULT 'text',
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  source_ref TEXT NOT NULL,
  proof_ids TEXT NOT NULL DEFAULT '[]',
  metadata TEXT NOT NULL DEFAULT '{}',
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_content_records_surface_route
  ON content_records (surface, route);

CREATE INDEX IF NOT EXISTS idx_content_records_status
  ON content_records (status, updated_at);

CREATE TABLE IF NOT EXISTS content_draft_operations (
  operation_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'content_draft',
  surface TEXT NOT NULL,
  route TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  field_path TEXT NOT NULL,
  current_value_ref TEXT NOT NULL,
  proposed_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  risk_level TEXT NOT NULL DEFAULT 'low',
  authority_state TEXT NOT NULL,
  required_approval_ids TEXT NOT NULL DEFAULT '[]',
  allowed_actions TEXT NOT NULL DEFAULT '[]',
  forbidden_actions TEXT NOT NULL DEFAULT '[]',
  preview_targets TEXT NOT NULL DEFAULT '[]',
  proof_ids TEXT NOT NULL DEFAULT '[]',
  evidence_uri TEXT,
  redaction TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'agent',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT,
  rollback_ref TEXT NOT NULL,
  reviewer_note TEXT,
  metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_content_draft_operations_status
  ON content_draft_operations (status, updated_at);

CREATE INDEX IF NOT EXISTS idx_content_draft_operations_surface_route
  ON content_draft_operations (surface, route);

CREATE INDEX IF NOT EXISTS idx_content_draft_operations_risk
  ON content_draft_operations (risk_level, authority_state);

CREATE TABLE IF NOT EXISTS content_publish_events (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  content_record_id TEXT,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  proof_ids TEXT NOT NULL DEFAULT '[]',
  rollback_ref TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'agent',
  created_at TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (operation_id) REFERENCES content_draft_operations(operation_id),
  FOREIGN KEY (content_record_id) REFERENCES content_records(id)
);

CREATE INDEX IF NOT EXISTS idx_content_publish_events_operation
  ON content_publish_events (operation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_content_publish_events_record
  ON content_publish_events (content_record_id, created_at);

CREATE INDEX IF NOT EXISTS idx_content_publish_events_type
  ON content_publish_events (event_type, created_at);
