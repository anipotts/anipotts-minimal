-- Migration 003: Content config, schedule, and update alerts
-- Created: 2026-03-05

-- ============================================================
-- 1. Content Config (stores YAML configs as JSON)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read config" ON content_config FOR SELECT USING (true);
CREATE POLICY "Service role write config" ON content_config FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 2. Content Schedule (calendar entries)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES thoughts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  series_type TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  platform TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'filmed', 'posted', 'skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read schedule" ON content_schedule FOR SELECT USING (true);
CREATE POLICY "Service role write schedule" ON content_schedule FOR ALL USING (auth.role() = 'service_role');
CREATE INDEX idx_content_schedule_date ON content_schedule(scheduled_date);
CREATE INDEX idx_content_schedule_status ON content_schedule(status);

-- ============================================================
-- 3. Update Alerts (tracked updates from Anthropic/Claude)
-- ============================================================
CREATE TABLE IF NOT EXISTS update_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  content_opportunity_score TEXT DEFAULT 'medium' CHECK (content_opportunity_score IN ('high', 'medium', 'low')),
  content_id UUID REFERENCES thoughts(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'acted_on', 'dismissed')),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE update_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access alerts" ON update_alerts FOR ALL USING (auth.role() = 'service_role');
CREATE INDEX idx_update_alerts_status ON update_alerts(status, detected_at DESC);
CREATE INDEX idx_update_alerts_source ON update_alerts(source);

-- ============================================================
-- 4. Updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_config_updated_at
  BEFORE UPDATE ON content_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER content_schedule_updated_at
  BEFORE UPDATE ON content_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
