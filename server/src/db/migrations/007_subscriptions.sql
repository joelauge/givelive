-- Migration 007: Subscriptions & plan limits (NOT YET APPLIED)
-- Run after implementing Stripe Billing — see docs/PRICING_ROADMAP.md

-- Organization billing profile (Clerk org_id or user-owned workspace)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT,
  plan_id TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_id IN ('free', 'starter', 'growth', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  ai_followup_addon BOOLEAN DEFAULT FALSE,
  leads_this_period INTEGER DEFAULT 0,
  leads_period_start DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage audit (optional granular tracking)
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- lead_captured, campaign_created, qr_generated
  quantity INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_org_created ON usage_events(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);

-- Future: ALTER events ADD COLUMN org_id FK when migrating off default-org
