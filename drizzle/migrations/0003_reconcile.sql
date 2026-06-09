-- 0003_reconcile.sql
-- Canonical definitions for the out-of-ORM objects (FTS5 + triggers) that
-- Drizzle cannot express, plus the speculative projects_fts removal.
--
-- APPLY MANUALLY, NEVER AUTO-RUN. Snapshot first:
--   wrangler d1 export anipotts-db --remote --output=backup-$(date +%F).sql
-- Then dry-run --local before --remote:
--   wrangler d1 execute anipotts-db --local  --file=drizzle/migrations/0003_reconcile.sql
--   wrangler d1 execute anipotts-db --remote --file=drizzle/migrations/0003_reconcile.sql
--
-- Everything in the ADDITIVE half is IF NOT EXISTS, idempotent against the
-- live DB (which already has thoughts_fts + its 3 triggers).
-- The projects_fts DROP block is destructive and gated to the supervised
-- phase-3 reconcile. DO NOT RUN it before ani's review.

-- ===========================================================================
-- ADDITIVE HALF (idempotent, safe)
-- ===========================================================================

-- thoughts_fts already exists in prod; this is the canonical definition.
CREATE VIRTUAL TABLE IF NOT EXISTS thoughts_fts USING fts5(
  title, summary, content,
  content='thoughts', content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS thoughts_fts_insert AFTER INSERT ON thoughts BEGIN
  INSERT INTO thoughts_fts(rowid, title, summary, content)
  VALUES (new.rowid, new.title, new.summary, new.content);
END;

CREATE TRIGGER IF NOT EXISTS thoughts_fts_delete AFTER DELETE ON thoughts BEGIN
  INSERT INTO thoughts_fts(thoughts_fts, rowid, title, summary, content)
  VALUES ('delete', old.rowid, old.title, old.summary, old.content);
END;

CREATE TRIGGER IF NOT EXISTS thoughts_fts_update AFTER UPDATE ON thoughts BEGIN
  INSERT INTO thoughts_fts(thoughts_fts, rowid, title, summary, content)
  VALUES ('delete', old.rowid, old.title, old.summary, old.content);
  INSERT INTO thoughts_fts(rowid, title, summary, content)
  VALUES (new.rowid, new.title, new.summary, new.content);
END;

-- ===========================================================================
-- DESTRUCTIVE HALF -- DO NOT RUN. Phase-3 supervised reconcile only.
-- projects_fts has zero query callers (no `projects_fts MATCH` anywhere);
-- it dies with its 3 triggers once ani signs off.
-- ===========================================================================
-- DROP TRIGGER IF EXISTS projects_fts_insert;
-- DROP TRIGGER IF EXISTS projects_fts_delete;
-- DROP TRIGGER IF EXISTS projects_fts_update;
-- DROP TABLE IF EXISTS projects_fts;
