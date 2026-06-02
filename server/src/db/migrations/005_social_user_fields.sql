ALTER TABLE users ADD COLUMN IF NOT EXISTS social_profiles JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS shopify_customer_id TEXT;

CREATE INDEX idx_users_shopify_customer_id ON users(shopify_customer_id);
-- Index specific keys inside jsonb if needed, for now we can rely on GIN if we add one, or scan. 
-- Since we usually look up by precise ID, we might want a GIN index on social_profiles later.
