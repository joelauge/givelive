import { query } from './index';

const SCHEMA_STATEMENTS = [
    `CREATE TABLE IF NOT EXISTS demo_requests (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      organization TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      source TEXT,
      subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      unsubscribed_at TIMESTAMP WITH TIME ZONE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email)`,
];

let schemaReady = false;

export async function ensureMarketingSchema(): Promise<void> {
    if (schemaReady) return;
    for (const sql of SCHEMA_STATEMENTS) {
        await query(sql);
    }
    schemaReady = true;
}
