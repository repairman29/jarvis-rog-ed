-- Kroger OAuth Tokens Table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS kroger_tokens (
  user_id TEXT PRIMARY KEY,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_kroger_tokens_updated_at ON kroger_tokens(updated_at);

-- Enable Row Level Security (optional, for multi-tenant)
ALTER TABLE kroger_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access" ON kroger_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
