-- Migration 003: Add distribution tracking columns to thoughts
ALTER TABLE thoughts ADD COLUMN buttondown_email_id TEXT;
ALTER TABLE thoughts ADD COLUMN typefully_x_draft_id TEXT;
ALTER TABLE thoughts ADD COLUMN typefully_linkedin_draft_id TEXT;
CREATE INDEX IF NOT EXISTS idx_thoughts_buttondown ON thoughts(buttondown_email_id);
