-- Migration: Analytics Events
-- This table tracks individual node interactions to aggregate node-level performance metrics

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  node_id TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g., 'sent', 'clicked', 'reply_received'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast aggregation
CREATE INDEX IF NOT EXISTS idx_analytics_events_node ON analytics_events(node_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_action ON analytics_events(action);
CREATE INDEX IF NOT EXISTS idx_analytics_events_date ON analytics_events(created_at);
