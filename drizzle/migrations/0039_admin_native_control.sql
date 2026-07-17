-- Native admin authentication, sanitized Career projections, scoped machine
-- tokens, and encrypted action envelopes. Apply only during the reviewed
-- Access-protected cutover session.

CREATE TABLE IF NOT EXISTS admin_password_credentials (
  user_id TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  must_change INTEGER NOT NULL DEFAULT 1 CHECK (must_change IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_auth_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  auth_method TEXT NOT NULL CHECK (auth_method IN ('password', 'passkey')),
  credential_ref TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_auth_sessions_active
  ON admin_auth_sessions (token_hash, expires_at, revoked_at);

CREATE TABLE IF NOT EXISTS admin_auth_attempts (
  actor_key TEXT PRIMARY KEY,
  failure_count INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  locked_until TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_auth_audit (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  auth_method TEXT,
  credential_ref TEXT,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_auth_audit_created
  ON admin_auth_audit (created_at DESC);

CREATE TABLE IF NOT EXISTS admin_machine_tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  scopes TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  expires_at TEXT,
  last_used_at TEXT,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_machine_tokens_active
  ON admin_machine_tokens (token_hash, expires_at, revoked_at);

CREATE TABLE IF NOT EXISTS admin_career_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  project_ref TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  stale INTEGER NOT NULL DEFAULT 0 CHECK (stale IN (0, 1)),
  source_status TEXT NOT NULL DEFAULT '[]',
  current_focus TEXT NOT NULL,
  readiness TEXT NOT NULL,
  next_action TEXT NOT NULL,
  contradictions TEXT NOT NULL DEFAULT '[]',
  commitments TEXT NOT NULL DEFAULT '[]',
  proof_refs TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_career_snapshots_project
  ON admin_career_snapshots (project_ref, generated_at DESC);

CREATE TABLE IF NOT EXISTS admin_career_targets (
  target_id TEXT PRIMARY KEY,
  snapshot_ref TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  last_contact_at TEXT,
  interview_at TEXT,
  next_action TEXT NOT NULL,
  source_refs TEXT NOT NULL DEFAULT '[]',
  source_link_refs TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (snapshot_ref) REFERENCES admin_career_snapshots(snapshot_id)
);
CREATE INDEX IF NOT EXISTS idx_admin_career_targets_snapshot
  ON admin_career_targets (snapshot_ref, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS admin_source_links (
  source_link_id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  provider TEXT NOT NULL,
  label TEXT NOT NULL,
  locator_ciphertext TEXT NOT NULL,
  locator_iv TEXT NOT NULL,
  key_version INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  last_opened_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_source_links_domain
  ON admin_source_links (domain, expires_at);

CREATE TABLE IF NOT EXISTS admin_actions (
  action_id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('proposed', 'approved', 'claimed', 'succeeded', 'failed', 'expired', 'cancelled')
  ),
  idempotency_key TEXT NOT NULL UNIQUE,
  exact_scope TEXT NOT NULL,
  preview TEXT NOT NULL,
  payload_ciphertext TEXT NOT NULL,
  payload_iv TEXT NOT NULL,
  key_version INTEGER NOT NULL,
  proof_requirement TEXT NOT NULL,
  created_by TEXT NOT NULL,
  runner_token_id TEXT,
  proof_token_id TEXT,
  claim_handle_hash TEXT UNIQUE,
  claim_handle_used_at TEXT,
  execution_started_at TEXT,
  error_code TEXT,
  proof TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  approved_at TEXT,
  claimed_at TEXT,
  completed_at TEXT,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_actions_queue
  ON admin_actions (status, domain, expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_runner
  ON admin_actions (runner_token_id, status);
