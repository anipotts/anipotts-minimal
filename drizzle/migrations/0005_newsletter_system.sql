/* 0005_newsletter_system.sql
   First-party newsletter tables for news.anipotts.com.
   Apply locally first:
   wrangler d1 execute anipotts-db --local --file=drizzle/migrations/0005_newsletter_system.sql
*/

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT NOT NULL DEFAULT 'website',
  tags TEXT NOT NULL DEFAULT '[]',
  metadata TEXT NOT NULL DEFAULT '{}',
  subscribed_at TEXT,
  confirmed_at TEXT,
  unsubscribed_at TEXT,
  suppressed_at TEXT,
  suppression_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status
  ON newsletter_subscribers (status);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email
  ON newsletter_subscribers (email);

CREATE TABLE IF NOT EXISTS newsletter_preferences (
  subscriber_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (subscriber_id, key),
  FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id)
);

CREATE TABLE IF NOT EXISTS newsletter_issues (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  summary TEXT,
  html TEXT,
  text TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TEXT,
  published_at TEXT,
  source_thought_id TEXT,
  buttondown_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_newsletter_issues_status
  ON newsletter_issues (status, scheduled_at);

CREATE TABLE IF NOT EXISTS newsletter_deliveries (
  id TEXT PRIMARY KEY,
  issue_id TEXT,
  subscriber_id TEXT NOT NULL,
  email TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  resend_email_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  queued_at TEXT NOT NULL,
  sent_at TEXT,
  delivered_at TEXT,
  opened_at TEXT,
  clicked_at TEXT,
  bounced_at TEXT,
  complained_at TEXT,
  unsubscribed_at TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (issue_id) REFERENCES newsletter_issues(id),
  FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_deliveries_issue_status
  ON newsletter_deliveries (issue_id, status);

CREATE INDEX IF NOT EXISTS idx_newsletter_deliveries_subscriber
  ON newsletter_deliveries (subscriber_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_newsletter_deliveries_resend_email
  ON newsletter_deliveries (resend_email_id);

CREATE TABLE IF NOT EXISTS newsletter_events (
  id TEXT PRIMARY KEY,
  subscriber_id TEXT,
  issue_id TEXT,
  delivery_id TEXT,
  email TEXT,
  type TEXT NOT NULL,
  provider TEXT,
  provider_event_id TEXT,
  provider_email_id TEXT,
  payload TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id),
  FOREIGN KEY (issue_id) REFERENCES newsletter_issues(id),
  FOREIGN KEY (delivery_id) REFERENCES newsletter_deliveries(id)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_events_type_created
  ON newsletter_events (type, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_events_provider_event
  ON newsletter_events (provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS newsletter_tokens (
  id TEXT PRIMARY KEY,
  subscriber_id TEXT NOT NULL,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_tokens_lookup
  ON newsletter_tokens (purpose, token_hash, expires_at);

CREATE TABLE IF NOT EXISTS newsletter_suppressions (
  email TEXT PRIMARY KEY,
  subscriber_id TEXT,
  reason TEXT NOT NULL,
  provider TEXT,
  provider_event_id TEXT,
  created_at TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_suppressions_reason
  ON newsletter_suppressions (reason, created_at);
