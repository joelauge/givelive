-- Faster per-event and per-org analytics aggregation
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_action ON analytics_events(event_id, action);
