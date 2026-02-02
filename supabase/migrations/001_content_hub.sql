-- Migration: Content Hub Schema Extension
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- Created: 2026-02-01

-- ============================================
-- STEP 1: Extend thoughts table
-- ============================================

-- Content typing
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'article';
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS series_type TEXT;

-- Workflow status (replaces simple published boolean)
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Artifacts
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS artifact_url TEXT;
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS artifact_type TEXT;

-- Platform tracking
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS platforms_targeted TEXT[] DEFAULT '{}';
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS platforms_posted TEXT[] DEFAULT '{}';

-- Voice mode override
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS voice_mode TEXT;

-- Project tagging
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS project TEXT;

-- Published timestamp (when first published anywhere)
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- ============================================
-- STEP 2: Create atoms table
-- ============================================

CREATE TABLE IF NOT EXISTS atoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES thoughts(id) ON DELETE CASCADE,

  -- Platform info
  platform TEXT NOT NULL,
  atom_content TEXT NOT NULL,
  voice_mode TEXT,
  hashtags TEXT[] DEFAULT '{}',

  -- Status tracking
  status TEXT DEFAULT 'draft',  -- draft, scheduled, posted

  -- Typefully integration
  typefully_draft_id TEXT,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  external_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_thoughts_status ON thoughts(status);
CREATE INDEX IF NOT EXISTS idx_thoughts_series_type ON thoughts(series_type);
CREATE INDEX IF NOT EXISTS idx_thoughts_content_type ON thoughts(content_type);
CREATE INDEX IF NOT EXISTS idx_thoughts_project ON thoughts(project);

CREATE INDEX IF NOT EXISTS idx_atoms_content_id ON atoms(content_id);
CREATE INDEX IF NOT EXISTS idx_atoms_platform ON atoms(platform);
CREATE INDEX IF NOT EXISTS idx_atoms_status ON atoms(status);

-- ============================================
-- STEP 4: Create updated_at trigger for atoms
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_atoms_updated_at ON atoms;
CREATE TRIGGER update_atoms_updated_at
  BEFORE UPDATE ON atoms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 5: Enable RLS on atoms table
-- ============================================

ALTER TABLE atoms ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone (atoms are public content)
CREATE POLICY "Atoms are viewable by everyone" ON atoms
  FOR SELECT USING (true);

-- Allow all operations for service role (admin)
CREATE POLICY "Service role can do anything" ON atoms
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- STEP 6: Add comments for documentation
-- ============================================

COMMENT ON COLUMN thoughts.content_type IS 'Type: video, article, thread, tip';
COMMENT ON COLUMN thoughts.series_type IS 'Series: 60s-fix, i-tried-it, quick-tip, stack-update, viral-reel';
COMMENT ON COLUMN thoughts.status IS 'Workflow: idea, draft, ready, atomized, published';
COMMENT ON COLUMN thoughts.artifact_url IS 'GitHub gist or repo URL for proof';
COMMENT ON COLUMN thoughts.artifact_type IS 'Type: gist, repo, screenshot, screen-recording, diff, live-demo';
COMMENT ON COLUMN thoughts.platforms_targeted IS 'Platforms we WANT to post to';
COMMENT ON COLUMN thoughts.platforms_posted IS 'Platforms we HAVE posted to';
COMMENT ON COLUMN thoughts.voice_mode IS 'Override: spicy, casual, professional (null = use series default)';
COMMENT ON COLUMN thoughts.project IS 'Project tag: quantercise, personal, paragon, etc.';

COMMENT ON TABLE atoms IS 'Generated platform-specific content from source thoughts';
COMMENT ON COLUMN atoms.platform IS 'Target platform: twitter, linkedin, tiktok, instagram, threads, bluesky, youtube, medium, devto, substack, reddit';
COMMENT ON COLUMN atoms.status IS 'Workflow: draft, scheduled, posted';
COMMENT ON COLUMN atoms.typefully_draft_id IS 'Typefully API draft ID for tracking';

-- ============================================
-- DONE! Verify with:
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'thoughts';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'atoms';
