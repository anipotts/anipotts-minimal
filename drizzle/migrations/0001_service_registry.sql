-- 0001_service_registry.sql
-- First Drizzle-tracked migration for anipotts-db (D1 / SQLite).
-- Prior 20 tables are baseline from supabase/d1-schema.sql and were created
-- out-of-band via wrangler d1 execute.
--
-- This migration:
--   1. Creates service_registry (new table managed by @anipotts/services-platform).
--   2. Adds status_checks.service_id (soft FK, no constraint — matches repo convention).
--   3. Adds two supporting indexes.
--
-- Apply manually with:
--   wrangler d1 execute anipotts-db --file=drizzle/migrations/0001_service_registry.sql
--
-- DO NOT run this session. Session 2b reviews + applies.

CREATE TABLE IF NOT EXISTS service_registry (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  hostname      TEXT NOT NULL,
  visibility    TEXT NOT NULL,
  owner         TEXT NOT NULL,
  port          INTEGER,
  manifest_sha  TEXT,
  manifest_path TEXT,
  deployed_at   TEXT,
  retired_at    TEXT,
  created_at    TEXT,
  updated_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_service_registry_name
  ON service_registry (name);

CREATE INDEX IF NOT EXISTS idx_service_registry_active
  ON service_registry (retired_at);

ALTER TABLE status_checks ADD COLUMN service_id TEXT;

CREATE INDEX IF NOT EXISTS idx_status_checks_service_id
  ON status_checks (service_id, checked_at);
