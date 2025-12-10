-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL, -- Changed to TEXT to support 'default-org'
  name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE,
  qr_url TEXT,
  root_node_id UUID, -- Circular dependency with journey_nodes, might need to be nullable initially
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journey Nodes Table
CREATE TABLE IF NOT EXISTS journey_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('page', 'sms', 'delay', 'condition', 'donation', 'end')),
  config JSONB DEFAULT '{}',
  next_nodes JSONB DEFAULT '[]', -- Array of node IDs or logic
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table (Audience)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT,
  event_id UUID REFERENCES events(id),
  consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  current_node_id UUID REFERENCES journey_nodes(id),
  completed_nodes JSONB DEFAULT '[]', -- Array of node IDs
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donations Table
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  amount DECIMAL(10, 2) NOT NULL,
  recurring BOOLEAN DEFAULT FALSE,
  stripe_charge_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
