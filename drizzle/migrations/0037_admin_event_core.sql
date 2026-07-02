CREATE TABLE IF NOT EXISTS admin_events (
  schema_version INTEGER NOT NULL DEFAULT 1,
  event_id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL,
  source TEXT NOT NULL,
  provider TEXT,
  account TEXT,
  actor TEXT NOT NULL,
  kind TEXT NOT NULL,
  ts TEXT NOT NULL,
  privacy TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  href TEXT,
  payload_ref TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_events_dedupe
  ON admin_events (dedupe_key);

CREATE INDEX IF NOT EXISTS idx_admin_events_source_ts
  ON admin_events (source, ts);

CREATE INDEX IF NOT EXISTS idx_admin_events_kind_ts
  ON admin_events (kind, ts);

CREATE TABLE IF NOT EXISTS admin_inbox_items (
  item_id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  event_refs TEXT NOT NULL DEFAULT '[]',
  source TEXT NOT NULL,
  account TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  href TEXT,
  status TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'normal',
  owner TEXT NOT NULL,
  action_kind TEXT NOT NULL DEFAULT 'open',
  expires_at TEXT,
  last_seen_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_inbox_status_urgency
  ON admin_inbox_items (status, urgency);

CREATE INDEX IF NOT EXISTS idx_admin_inbox_source
  ON admin_inbox_items (source, updated_at);

CREATE INDEX IF NOT EXISTS idx_admin_inbox_expires
  ON admin_inbox_items (expires_at);

CREATE TABLE IF NOT EXISTS admin_piece_states (
  piece_id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  event_refs TEXT NOT NULL DEFAULT '[]',
  title TEXT NOT NULL,
  state TEXT NOT NULL,
  channels TEXT NOT NULL DEFAULT '[]',
  source_refs TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_piece_state
  ON admin_piece_states (state, updated_at);

CREATE TABLE IF NOT EXISTS admin_fleet_status (
  subject_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  owner TEXT NOT NULL,
  href TEXT,
  event_refs TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_fleet_kind_status
  ON admin_fleet_status (kind, status);

CREATE TABLE IF NOT EXISTS admin_deploy_states (
  deploy_id TEXT PRIMARY KEY,
  target TEXT NOT NULL,
  status TEXT NOT NULL,
  scope TEXT NOT NULL,
  href TEXT,
  last_run_at TEXT,
  event_refs TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_deploy_target_status
  ON admin_deploy_states (target, status);

CREATE TABLE IF NOT EXISTS admin_capability_states (
  capability_id TEXT PRIMARY KEY,
  machine TEXT NOT NULL,
  status TEXT NOT NULL,
  auth_model TEXT NOT NULL,
  write_enabled INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL,
  event_refs TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_capability_machine
  ON admin_capability_states (machine, status);
