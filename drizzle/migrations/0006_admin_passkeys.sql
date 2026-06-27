-- App-native passkey auth staging for admin.anipotts.com.
-- Apply only after Cloudflare Access remains active and the admin-solid
-- deployment has the DB binding configured.

CREATE TABLE IF NOT EXISTS admin_passkey_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT NOT NULL DEFAULT '[]',
  device_type TEXT,
  backed_up INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_passkey_credentials_user_active
  ON admin_passkey_credentials (user_id, revoked_at);

CREATE INDEX IF NOT EXISTS idx_admin_passkey_credentials_credential
  ON admin_passkey_credentials (credential_id);

CREATE TABLE IF NOT EXISTS admin_passkey_challenges (
  id TEXT PRIMARY KEY,
  purpose TEXT NOT NULL,
  challenge TEXT NOT NULL UNIQUE,
  credential_id TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_passkey_challenges_lookup
  ON admin_passkey_challenges (purpose, used_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_passkey_challenges_challenge
  ON admin_passkey_challenges (challenge);

CREATE TABLE IF NOT EXISTS admin_passkey_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  credential_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT,
  revoked_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_passkey_sessions_lookup
  ON admin_passkey_sessions (token_hash, revoked_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_passkey_sessions_credential
  ON admin_passkey_sessions (credential_id, revoked_at);

CREATE TABLE IF NOT EXISTS admin_passkey_audit (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  credential_id TEXT,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_passkey_audit_type_created
  ON admin_passkey_audit (event_type, created_at);
