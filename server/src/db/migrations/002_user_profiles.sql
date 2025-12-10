-- Migration: Enhanced User Profiles & Form Submission Tracking
-- This migration adds comprehensive user profile tracking

-- Add profile data to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 1;

-- Create form_submissions table to track all data collection
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  node_id TEXT, -- Can be UUID or text ID
  form_data JSONB NOT NULL,
  session_id TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_event ON users(event_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_user ON form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_event ON form_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_date ON form_submissions(submitted_at);

-- Create view for complete user profiles
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  u.id,
  u.event_id,
  u.email,
  u.phone_number,
  u.first_name,
  u.last_name,
  u.profile,
  u.consent,
  u.total_sessions,
  u.created_at,
  u.last_seen,
  COUNT(DISTINCT fs.id) as total_submissions,
  COALESCE(SUM(d.amount), 0) as total_donated,
  MAX(d.created_at) as last_donation_date
FROM users u
LEFT JOIN form_submissions fs ON u.id = fs.user_id
LEFT JOIN donations d ON u.id = d.user_id
GROUP BY u.id;
