-- =============================================================================
-- RLS Policies Documentation
-- Generated from migrations and dashboard configuration.
-- Run these in Supabase SQL Editor if rebuilding from scratch.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- thoughts (core content table)
-- RLS enabled by default at table creation. Public read for published content.
-- -----------------------------------------------------------------------------
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published" ON thoughts
  FOR SELECT USING (published = true);

CREATE POLICY "Service role full access" ON thoughts
  FOR ALL USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- atoms (platform-specific content generated from thoughts)
-- -----------------------------------------------------------------------------
ALTER TABLE atoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Atoms are viewable by everyone" ON atoms
  FOR SELECT USING (true);

CREATE POLICY "Service role can do anything" ON atoms
  FOR ALL USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- github_events (webhook storage for dev page activity feed)
-- -----------------------------------------------------------------------------
ALTER TABLE github_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON github_events
  FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- contact_submissions (contact form storage)
-- Service role only: no public read or write via anon key
-- -----------------------------------------------------------------------------
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON contact_submissions
  FOR ALL USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- page_content (CMS page content)
-- Public read for published content, service role for writes
-- -----------------------------------------------------------------------------
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read page_content" ON page_content
  FOR SELECT USING (published = true);

CREATE POLICY "Service write page_content" ON page_content
  FOR ALL USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- projects (CMS project entries)
-- Public read for visible projects, service role for writes
-- -----------------------------------------------------------------------------
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read projects" ON projects
  FOR SELECT USING (visible = true);

CREATE POLICY "Service write projects" ON projects
  FOR ALL USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- social_links (CMS social link entries)
-- Public read for visible links, service role for writes
-- -----------------------------------------------------------------------------
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read social_links" ON social_links
  FOR SELECT USING (visible = true);

CREATE POLICY "Service write social_links" ON social_links
  FOR ALL USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- site_settings (CMS site-wide settings)
-- Public read all, service role for writes
-- -----------------------------------------------------------------------------
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Service write site_settings" ON site_settings
  FOR ALL USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- metrics_cache (cached GitHub/WakaTime stats for dev page)
-- Public read, service role for writes (cron job)
-- -----------------------------------------------------------------------------
ALTER TABLE metrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read metrics_cache" ON metrics_cache
  FOR SELECT USING (true);

CREATE POLICY "Service write metrics_cache" ON metrics_cache
  FOR ALL USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- status_checks (service monitoring results for dev page)
-- Public read, service role for writes (cron job)
-- -----------------------------------------------------------------------------
ALTER TABLE status_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read status_checks" ON status_checks
  FOR SELECT USING (true);

CREATE POLICY "Service write status_checks" ON status_checks
  FOR ALL USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- favorite_numbers (fun interactive feature)
-- Public read/insert via anon key (RLS + view for stats)
-- -----------------------------------------------------------------------------
ALTER TABLE favorite_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert" ON favorite_numbers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read" ON favorite_numbers
  FOR SELECT USING (true);
