-- ============================================================
-- Migration 002: Infrastructure for GitHub webhooks, contact
-- storage, full-text search, content versioning, scheduling,
-- and project images.
-- ============================================================

-- ============================================================
-- 1. GitHub Events (webhook storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS github_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_action TEXT,
  repo TEXT NOT NULL,
  repo_url TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  github_delivery_id TEXT UNIQUE,
  github_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_github_events_time ON github_events(github_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_github_events_type ON github_events(event_type, github_timestamp DESC);
ALTER TABLE github_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON github_events FOR SELECT USING (true);

-- ============================================================
-- 2. Contact Submissions
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON contact_submissions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 3. Full-text search indexes
-- ============================================================
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED;
CREATE INDEX IF NOT EXISTS idx_thoughts_fts ON thoughts USING GIN(fts);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED;
CREATE INDEX IF NOT EXISTS idx_projects_fts ON projects USING GIN(fts);

-- ============================================================
-- 4. Content versioning (lightweight JSONB approach)
-- ============================================================
ALTER TABLE page_content ADD COLUMN IF NOT EXISTS
  version_history JSONB[] DEFAULT '{}';

-- ============================================================
-- 5. Atomic view increment RPC
-- ============================================================
CREATE OR REPLACE FUNCTION increment_thought_views(thought_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE thoughts SET views = COALESCE(views, 0) + 1
  WHERE slug = thought_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. Content search RPC
-- ============================================================
CREATE OR REPLACE FUNCTION search_content(query TEXT, lim INTEGER DEFAULT 10)
RETURNS TABLE(
  type TEXT, id UUID, slug TEXT, title TEXT, summary TEXT, rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'thought'::TEXT, t.id, t.slug, t.title, t.summary,
    ts_rank(t.fts, websearch_to_tsquery('english', query))
  FROM thoughts t
  WHERE t.published = true AND t.fts @@ websearch_to_tsquery('english', query)
  UNION ALL
  SELECT 'project'::TEXT, p.id, p.slug, p.title, p.subtitle,
    ts_rank(p.fts, websearch_to_tsquery('english', query))
  FROM projects p
  WHERE p.visible = true AND p.fts @@ websearch_to_tsquery('english', query)
  ORDER BY rank DESC LIMIT lim;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. Contribution heatmap RPC
-- ============================================================
CREATE OR REPLACE FUNCTION get_commit_heatmap(days_back INTEGER DEFAULT 365)
RETURNS TABLE(date DATE, commit_count INTEGER) AS $$
  SELECT
    (github_timestamp AT TIME ZONE 'America/New_York')::date AS date,
    COALESCE(SUM((payload->>'commit_count')::int), 0)::integer
  FROM github_events
  WHERE event_type = 'push'
    AND github_timestamp >= NOW() - (days_back || ' days')::interval
  GROUP BY date ORDER BY date;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- 8. Scheduled auto-publish
-- ============================================================
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION auto_publish_scheduled()
RETURNS VOID AS $$
BEGIN
  UPDATE thoughts
  SET published = true, status = 'published', published_at = now()
  WHERE scheduled_at <= now()
    AND published = false
    AND scheduled_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_cron setup (run these separately in Supabase SQL editor):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('auto-publish', '*/5 * * * *', 'SELECT auto_publish_scheduled()');
-- SELECT cron.schedule('cleanup-github-events', '0 3 * * *',
--   $$DELETE FROM github_events WHERE created_at < now() - interval '90 days'$$);

-- ============================================================
-- 9. Image support for projects
-- ============================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
