import { query } from './index';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  node_id TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_analytics_events_node ON analytics_events(node_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_action ON analytics_events(event_id, action);
CREATE INDEX IF NOT EXISTS idx_analytics_events_action ON analytics_events(action);
CREATE INDEX IF NOT EXISTS idx_analytics_events_date ON analytics_events(created_at);
`;

let schemaReady = false;

export async function ensureAnalyticsSchema(): Promise<void> {
    if (schemaReady) return;
    await query(SCHEMA_SQL);
    schemaReady = true;
}
