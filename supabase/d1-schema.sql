-- ============================================================================
-- D1 Schema: anipotts-db
-- SQLite (Cloudflare D1) equivalent of all Supabase tables
-- Generated: 2026-04-09 | Session 1: CF Foundation
--
-- Adaptations from Postgres:
--   UUIDs       -> TEXT (generated via crypto.randomUUID() in app)
--   TIMESTAMPTZ -> TEXT (ISO-8601 strings)
--   TEXT[]       -> TEXT (JSON arrays)
--   JSONB        -> TEXT (JSON strings)
--   BOOLEAN      -> INTEGER (0/1)
--   SERIAL       -> INTEGER PRIMARY KEY AUTOINCREMENT
--   RLS          -> eliminated (app-layer auth)
--   Triggers     -> eliminated (app handles updated_at)
--   pg_cron      -> Workers scheduled triggers / Mac Mini crons
-- ============================================================================

-- ============================================================================
-- EXISTING TABLES (migrated from Supabase)
-- ============================================================================

-- 1. thoughts (blog posts / content)
CREATE TABLE IF NOT EXISTS thoughts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  tags TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  views INTEGER DEFAULT 0,
  published INTEGER DEFAULT 0,
  section TEXT,

  -- content hub fields (migration 001)
  content_type TEXT DEFAULT 'article',
  series_type TEXT,
  status TEXT DEFAULT 'draft',
  artifact_url TEXT,
  artifact_type TEXT,
  platforms_targeted TEXT DEFAULT '[]',
  platforms_posted TEXT DEFAULT '[]',
  voice_mode TEXT,
  project TEXT,
  published_at TEXT,

  -- scheduling (migration 002)
  scheduled_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_thoughts_slug ON thoughts(slug);
CREATE INDEX IF NOT EXISTS idx_thoughts_published ON thoughts(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thoughts_status ON thoughts(status);
CREATE INDEX IF NOT EXISTS idx_thoughts_series_type ON thoughts(series_type);
CREATE INDEX IF NOT EXISTS idx_thoughts_content_type ON thoughts(content_type);
CREATE INDEX IF NOT EXISTS idx_thoughts_project ON thoughts(project);

-- 2. atoms (platform-specific micro-content)
CREATE TABLE IF NOT EXISTS atoms (
  id TEXT PRIMARY KEY,
  content_id TEXT REFERENCES thoughts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  atom_content TEXT NOT NULL,
  voice_mode TEXT,
  hashtags TEXT DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  typefully_draft_id TEXT,
  scheduled_at TEXT,
  posted_at TEXT,
  external_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_atoms_content_id ON atoms(content_id);
CREATE INDEX IF NOT EXISTS idx_atoms_platform ON atoms(platform);
CREATE INDEX IF NOT EXISTS idx_atoms_status ON atoms(status);

-- 3. projects (portfolio items)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  year TEXT,
  category TEXT,
  role TEXT,
  duration TEXT,
  tags TEXT DEFAULT '[]',
  status TEXT,
  featured INTEGER DEFAULT 0,
  icon TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  link_live TEXT,
  link_repo TEXT,
  link_page TEXT,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_visible ON projects(visible, sort_order);

-- 4. social_links
CREATE TABLE IF NOT EXISTS social_links (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 5. page_content (CMS pages)
CREATE TABLE IF NOT EXISTS page_content (
  id TEXT PRIMARY KEY,
  page_key TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  published INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  version_history TEXT DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_page_content_key ON page_content(page_key, published);

-- 6. site_settings (key-value config)
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 7. github_events (webhook storage)
CREATE TABLE IF NOT EXISTS github_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_action TEXT,
  repo TEXT NOT NULL,
  repo_url TEXT,
  payload TEXT NOT NULL DEFAULT '{}',
  github_delivery_id TEXT UNIQUE,
  github_timestamp TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_github_events_time ON github_events(github_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_github_events_type ON github_events(event_type, github_timestamp DESC);

-- 8. contact_submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 9. content_config (YAML configs as JSON)
CREATE TABLE IF NOT EXISTS content_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 10. content_schedule (editorial calendar)
CREATE TABLE IF NOT EXISTS content_schedule (
  id TEXT PRIMARY KEY,
  content_id TEXT REFERENCES thoughts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  series_type TEXT,
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT,
  platform TEXT,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_content_schedule_date ON content_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_content_schedule_status ON content_schedule(status);

-- 11. update_alerts (AI update tracking)
CREATE TABLE IF NOT EXISTS update_alerts (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  detected_at TEXT DEFAULT (datetime('now')),
  content_opportunity_score TEXT DEFAULT 'medium',
  content_id TEXT REFERENCES thoughts(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'new',
  raw_data TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_update_alerts_status ON update_alerts(status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_update_alerts_source ON update_alerts(source);

-- 12. metrics_cache (GitHub/WakaTime stats)
CREATE TABLE IF NOT EXISTS metrics_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 13. status_checks (service monitoring)
CREATE TABLE IF NOT EXISTS status_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_url TEXT NOT NULL,
  service_name TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER NOT NULL,
  is_up INTEGER NOT NULL,
  checked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_status_checks_lookup ON status_checks(service_url, checked_at DESC);

-- 14. favorite_numbers (interactive feature)
CREATE TABLE IF NOT EXISTS favorite_numbers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number INTEGER NOT NULL,
  submitted_at TEXT DEFAULT (datetime('now')),
  user_ip TEXT
);

-- ============================================================================
-- NEW ADMIN TABLES
-- ============================================================================

-- 15. business_data (YAML data synced from Mac Mini)
CREATE TABLE IF NOT EXISTS business_data (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  source_file TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 16. analytics_events (granular analytics from all platforms)
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  dimensions TEXT DEFAULT '{}',
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_source ON analytics_events(source, metric, period_start);
CREATE INDEX IF NOT EXISTS idx_analytics_period ON analytics_events(period_start, period_end);

-- 17. ops_snapshots (Mac Mini health data)
CREATE TABLE IF NOT EXISTS ops_snapshots (
  key TEXT NOT NULL,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (key, category)
);

CREATE INDEX IF NOT EXISTS idx_ops_category ON ops_snapshots(category);

-- 18. code_health (repo status from Mac Mini)
CREATE TABLE IF NOT EXISTS code_health (
  repo TEXT PRIMARY KEY,
  dirty INTEGER DEFAULT 0,
  unpushed_count INTEGER DEFAULT 0,
  stale_branches INTEGER DEFAULT 0,
  last_commit_at TEXT,
  last_commit_msg TEXT,
  deployment_status TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- FTS5 VIRTUAL TABLES (full-text search)
-- ============================================================================

-- Search across thoughts (replaces Postgres tsvector)
CREATE VIRTUAL TABLE IF NOT EXISTS thoughts_fts USING fts5(
  title,
  summary,
  content,
  content='thoughts',
  content_rowid='rowid'
);

-- Search across projects
CREATE VIRTUAL TABLE IF NOT EXISTS projects_fts USING fts5(
  title,
  subtitle,
  description,
  content='projects',
  content_rowid='rowid'
);

-- ============================================================================
-- FTS5 TRIGGERS (keep FTS in sync with source tables)
-- ============================================================================

-- thoughts -> thoughts_fts sync
CREATE TRIGGER IF NOT EXISTS thoughts_fts_insert AFTER INSERT ON thoughts BEGIN
  INSERT INTO thoughts_fts(rowid, title, summary, content)
  VALUES (NEW.rowid, NEW.title, NEW.summary, NEW.content);
END;

CREATE TRIGGER IF NOT EXISTS thoughts_fts_delete AFTER DELETE ON thoughts BEGIN
  INSERT INTO thoughts_fts(thoughts_fts, rowid, title, summary, content)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.summary, OLD.content);
END;

CREATE TRIGGER IF NOT EXISTS thoughts_fts_update AFTER UPDATE ON thoughts BEGIN
  INSERT INTO thoughts_fts(thoughts_fts, rowid, title, summary, content)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.summary, OLD.content);
  INSERT INTO thoughts_fts(rowid, title, summary, content)
  VALUES (NEW.rowid, NEW.title, NEW.summary, NEW.content);
END;

-- projects -> projects_fts sync
CREATE TRIGGER IF NOT EXISTS projects_fts_insert AFTER INSERT ON projects BEGIN
  INSERT INTO projects_fts(rowid, title, subtitle, description)
  VALUES (NEW.rowid, NEW.title, NEW.subtitle, NEW.description);
END;

CREATE TRIGGER IF NOT EXISTS projects_fts_delete AFTER DELETE ON projects BEGIN
  INSERT INTO projects_fts(projects_fts, rowid, title, subtitle, description)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.subtitle, OLD.description);
END;

CREATE TRIGGER IF NOT EXISTS projects_fts_update AFTER UPDATE ON projects BEGIN
  INSERT INTO projects_fts(projects_fts, rowid, title, subtitle, description)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.subtitle, OLD.description);
  INSERT INTO projects_fts(rowid, title, subtitle, description)
  VALUES (NEW.rowid, NEW.title, NEW.subtitle, NEW.description);
END;
