-- 0002_brands_emails.sql
-- Adds brands_emails table for the email-labeler Apps Script → ingest worker path.
-- Replaces Content/logs/brands.yaml as the brand-outreach source of truth.
--
-- Ingest worker category: "brands_email" (see workers/ingest/src/index.ts).
-- Apps Script POSTs with Gmail message_id as dedup key; backfilled rows use
-- synthetic IDs prefixed "bf:".
--
-- Apply manually with:
--   wrangler d1 execute anipotts-db --remote --file=drizzle/migrations/0002_brands_emails.sql
--
-- DO NOT run this session. Review + apply outside of the editing session.

CREATE TABLE IF NOT EXISTS brands_emails (
  message_id  TEXT PRIMARY KEY,             -- Gmail ID or "bf:<hash>" for backfill
  thread_id   TEXT NOT NULL,
  received_at TEXT NOT NULL,                -- ISO-8601 from Gmail
  from_addr   TEXT NOT NULL,
  subject     TEXT NOT NULL,
  label       TEXT NOT NULL,                -- "Brands", "Brands/Paid", etc.
  deal_slug   TEXT,                         -- optional link to Content/deals/<slug>/
  status      TEXT DEFAULT 'inbox',         -- inbox | responding | won | lost | ghosted
  notes       TEXT,
  ingested_at TEXT NOT NULL                 -- auto-set by ingest worker
);

CREATE INDEX IF NOT EXISTS idx_brands_emails_received_at
  ON brands_emails (received_at);

CREATE INDEX IF NOT EXISTS idx_brands_emails_from_addr
  ON brands_emails (from_addr);

CREATE INDEX IF NOT EXISTS idx_brands_emails_status
  ON brands_emails (status);
