CREATE TABLE analytics_events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  dimensions TEXT DEFAULT '{}',
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE atoms (
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
CREATE TABLE business_data (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  source_file TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE code_health (
  repo TEXT PRIMARY KEY,
  dirty INTEGER DEFAULT 0,
  unpushed_count INTEGER DEFAULT 0,
  stale_branches INTEGER DEFAULT 0,
  last_commit_at TEXT,
  last_commit_msg TEXT,
  deployment_status TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE contact_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE content_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE content_schedule (
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
CREATE TABLE daily_rollups (id TEXT PRIMARY KEY, date TEXT NOT NULL, hour INTEGER NOT NULL, metric TEXT NOT NULL, value REAL NOT NULL, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE email_queue (id TEXT PRIMARY KEY, subject TEXT NOT NULL, html TEXT NOT NULL, to_address TEXT NOT NULL, status TEXT DEFAULT 'pending', attempts INTEGER DEFAULT 0, last_error TEXT, created_at TEXT, updated_at TEXT);
CREATE TABLE favorite_numbers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number INTEGER NOT NULL,
  submitted_at TEXT DEFAULT (datetime('now')),
  user_ip TEXT
);
CREATE TABLE github_events (
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
CREATE TABLE metrics_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE ops_snapshots (
  key TEXT NOT NULL,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (key, category)
);
CREATE TABLE page_content (
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
CREATE TABLE projects (
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
CREATE VIRTUAL TABLE projects_fts USING fts5(
  title,
  subtitle,
  description,
  content='projects',
  content_rowid='rowid'
);
CREATE TABLE rate_limits (key TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE TABLE site_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE social_links (
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
CREATE TABLE status_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_url TEXT NOT NULL,
  service_name TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER NOT NULL,
  is_up INTEGER NOT NULL,
  checked_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE thoughts (
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
CREATE VIRTUAL TABLE thoughts_fts USING fts5(
  title,
  summary,
  content,
  content='thoughts',
  content_rowid='rowid'
);
CREATE TABLE update_alerts (
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
CREATE INDEX idx_analytics_period ON analytics_events(period_start, period_end);
CREATE INDEX idx_analytics_source ON analytics_events(source, metric, period_start);
CREATE INDEX idx_atoms_content_id ON atoms(content_id);
CREATE INDEX idx_atoms_platform ON atoms(platform);
CREATE INDEX idx_atoms_status ON atoms(status);
CREATE INDEX idx_content_schedule_date ON content_schedule(scheduled_date);
CREATE INDEX idx_content_schedule_status ON content_schedule(status);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_github_events_time ON github_events(github_timestamp DESC);
CREATE INDEX idx_github_events_type ON github_events(event_type, github_timestamp DESC);
CREATE INDEX idx_ops_category ON ops_snapshots(category);
CREATE INDEX idx_page_content_key ON page_content(page_key, published);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_visible ON projects(visible, sort_order);
CREATE INDEX idx_rate_limits_key_ts ON rate_limits(key, ts);
CREATE INDEX idx_rollups_date ON daily_rollups(date, metric);
CREATE INDEX idx_status_checks_lookup ON status_checks(service_url, checked_at DESC);
CREATE INDEX idx_thoughts_content_type ON thoughts(content_type);
CREATE INDEX idx_thoughts_project ON thoughts(project);
CREATE INDEX idx_thoughts_published ON thoughts(published, created_at DESC);
CREATE INDEX idx_thoughts_series_type ON thoughts(series_type);
CREATE INDEX idx_thoughts_slug ON thoughts(slug);
CREATE INDEX idx_thoughts_status ON thoughts(status);
CREATE INDEX idx_update_alerts_source ON update_alerts(source);
CREATE INDEX idx_update_alerts_status ON update_alerts(status, detected_at DESC);
CREATE TRIGGER projects_fts_delete AFTER DELETE ON projects BEGIN
  INSERT INTO projects_fts(projects_fts, rowid, title, subtitle, description)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.subtitle, OLD.description);
END;
CREATE TRIGGER projects_fts_insert AFTER INSERT ON projects BEGIN
  INSERT INTO projects_fts(rowid, title, subtitle, description)
  VALUES (NEW.rowid, NEW.title, NEW.subtitle, NEW.description);
END;
CREATE TRIGGER projects_fts_update AFTER UPDATE ON projects BEGIN
  INSERT INTO projects_fts(projects_fts, rowid, title, subtitle, description)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.subtitle, OLD.description);
  INSERT INTO projects_fts(rowid, title, subtitle, description)
  VALUES (NEW.rowid, NEW.title, NEW.subtitle, NEW.description);
END;
CREATE TRIGGER thoughts_fts_delete AFTER DELETE ON thoughts BEGIN
  INSERT INTO thoughts_fts(thoughts_fts, rowid, title, summary, content)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.summary, OLD.content);
END;
CREATE TRIGGER thoughts_fts_insert AFTER INSERT ON thoughts BEGIN
  INSERT INTO thoughts_fts(rowid, title, summary, content)
  VALUES (NEW.rowid, NEW.title, NEW.summary, NEW.content);
END;
CREATE TRIGGER thoughts_fts_update AFTER UPDATE ON thoughts BEGIN
  INSERT INTO thoughts_fts(thoughts_fts, rowid, title, summary, content)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.summary, OLD.content);
  INSERT INTO thoughts_fts(rowid, title, summary, content)
  VALUES (NEW.rowid, NEW.title, NEW.summary, NEW.content);
END;
