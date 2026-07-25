ALTER TABLE admin_inbox_items
  ADD COLUMN domain TEXT NOT NULL DEFAULT 'system';

ALTER TABLE admin_inbox_items
  ADD COLUMN entity_ref TEXT NOT NULL DEFAULT '';

ALTER TABLE admin_inbox_items
  ADD COLUMN attention_kind TEXT NOT NULL DEFAULT 'review';

UPDATE admin_inbox_items
SET entity_ref = dedupe_key
WHERE entity_ref = '';

UPDATE admin_inbox_items
SET attention_kind = CASE action_kind
  WHEN 'approve' THEN 'approval'
  WHEN 'decide' THEN 'decision'
  WHEN 'deadline' THEN 'deadline'
  WHEN 'verify' THEN 'verification'
  ELSE 'review'
END;

CREATE INDEX IF NOT EXISTS idx_admin_inbox_domain_status
  ON admin_inbox_items (domain, status, urgency);

CREATE INDEX IF NOT EXISTS idx_admin_inbox_entity
  ON admin_inbox_items (entity_ref, updated_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_inbox_open_entity_attention
  ON admin_inbox_items (entity_ref, attention_kind)
  WHERE status NOT IN ('archived', 'closed', 'completed', 'resolved', 'verified');
