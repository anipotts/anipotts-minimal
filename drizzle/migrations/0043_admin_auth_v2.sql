-- Additive passkey-first, team-ready auth for admin.anipotts.com.
-- Apply while Cloudflare Access remains active. This migration does not
-- revoke credentials, remove Access, enable Google, or send notifications.

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'operator', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'revoked')),
  created_by_user_id TEXT,
  approved_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  approved_at TEXT,
  revoked_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_singleton_owner
  ON admin_users (role)
  WHERE role = 'owner' AND status != 'revoked';

CREATE INDEX IF NOT EXISTS idx_admin_users_role_status
  ON admin_users (role, status);

INSERT OR IGNORE INTO admin_users (
  id,
  display_name,
  role,
  status,
  created_at,
  updated_at,
  approved_at
)
SELECT
  'ani',
  'Ani',
  'owner',
  'active',
  MIN(created_at),
  MAX(updated_at),
  MIN(created_at)
FROM admin_passkey_credentials
WHERE user_id = 'ani'
HAVING COUNT(*) > 0;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  credential_id TEXT,
  auth_method TEXT NOT NULL
    CHECK (auth_method IN (
      'passkey',
      'device_approval',
      'google_recovery',
      'legacy_passkey'
    )),
  restriction TEXT CHECK (restriction IS NULL OR restriction = 'recovery'),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  step_up_at TEXT,
  revoked_at TEXT,
  revoked_reason TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_active
  ON admin_sessions (token_hash, revoked_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_active
  ON admin_sessions (user_id, revoked_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_last_seen
  ON admin_sessions (last_seen_at, revoked_at);

ALTER TABLE admin_passkey_credentials ADD COLUMN label TEXT;
ALTER TABLE admin_passkey_credentials ADD COLUMN created_by_session_id TEXT;
ALTER TABLE admin_passkey_credentials ADD COLUMN revocation_reason TEXT;

ALTER TABLE admin_passkey_challenges ADD COLUMN user_id TEXT;
ALTER TABLE admin_passkey_challenges ADD COLUMN session_id TEXT;
ALTER TABLE admin_passkey_challenges ADD COLUMN invite_id TEXT;
ALTER TABLE admin_passkey_challenges ADD COLUMN recovery_session_id TEXT;
ALTER TABLE admin_passkey_challenges ADD COLUMN request_origin TEXT;
ALTER TABLE admin_passkey_challenges ADD COLUMN metadata TEXT NOT NULL DEFAULT '{}';

ALTER TABLE admin_passkey_audit ADD COLUMN user_id TEXT;
ALTER TABLE admin_passkey_audit ADD COLUMN session_id TEXT;
ALTER TABLE admin_passkey_audit ADD COLUMN outcome TEXT NOT NULL DEFAULT 'completed';
ALTER TABLE admin_passkey_audit ADD COLUMN metadata TEXT NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS admin_invites (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('operator', 'viewer')),
  invited_by_user_id TEXT NOT NULL,
  pending_user_id TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  approved_at TEXT,
  approved_by_user_id TEXT,
  revoked_at TEXT,
  FOREIGN KEY (invited_by_user_id) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_invites_token_active
  ON admin_invites (token_hash, used_at, revoked_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_invites_pending
  ON admin_invites (pending_user_id, approved_at, revoked_at);

CREATE TABLE IF NOT EXISTS admin_device_authorizations (
  id TEXT PRIMARY KEY,
  verifier_hash TEXT NOT NULL,
  requesting_device TEXT NOT NULL,
  requested_origin TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  approved_by_user_id TEXT,
  approved_by_session_id TEXT,
  approved_at TEXT,
  denied_at TEXT,
  claimed_at TEXT,
  claimed_session_id TEXT,
  FOREIGN KEY (approved_by_user_id) REFERENCES admin_users(id),
  FOREIGN KEY (claimed_session_id) REFERENCES admin_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_device_authorizations_active
  ON admin_device_authorizations (id, expires_at, approved_at, claimed_at);

CREATE TABLE IF NOT EXISTS admin_external_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  subject_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES admin_users(id),
  UNIQUE (provider, subject_hash)
);

CREATE INDEX IF NOT EXISTS idx_admin_external_identities_user
  ON admin_external_identities (user_id, provider, revoked_at);

CREATE TABLE IF NOT EXISTS admin_recovery_requests (
  id TEXT PRIMARY KEY,
  state_hash TEXT NOT NULL UNIQUE,
  verifier_hash TEXT NOT NULL,
  nonce_hash TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_recovery_requests_active
  ON admin_recovery_requests (state_hash, used_at, expires_at);

CREATE TABLE IF NOT EXISTS admin_machine_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_hint TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT '[]',
  created_by_session_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_used_at TEXT,
  last_used_ip_hash TEXT,
  rotated_at TEXT,
  rotated_to_token_id TEXT,
  revoked_at TEXT,
  revoked_by_session_id TEXT,
  FOREIGN KEY (user_id) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_machine_tokens_active
  ON admin_machine_tokens (token_hash, revoked_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_machine_tokens_user
  ON admin_machine_tokens (user_id, revoked_at);

CREATE TABLE IF NOT EXISTS admin_security_notifications (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  provider_message_id TEXT,
  failed_at TEXT,
  failure_code TEXT,
  FOREIGN KEY (user_id) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_security_notifications_pending
  ON admin_security_notifications (sent_at, failed_at, created_at);
