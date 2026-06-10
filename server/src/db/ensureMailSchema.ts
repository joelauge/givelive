import { query } from './index';

const SCHEMA_STATEMENTS = [
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    `CREATE TABLE IF NOT EXISTS inbox_emails (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      resend_email_id TEXT UNIQUE,
      message_id TEXT,
      direction TEXT NOT NULL DEFAULT 'inbound',
      from_address TEXT NOT NULL,
      to_addresses JSONB NOT NULL DEFAULT '[]',
      cc_addresses JSONB NOT NULL DEFAULT '[]',
      subject TEXT,
      text_body TEXT,
      html_body TEXT,
      attachments JSONB NOT NULL DEFAULT '[]',
      is_read BOOLEAN NOT NULL DEFAULT false,
      in_reply_to UUID REFERENCES inbox_emails(id) ON DELETE SET NULL,
      received_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_inbox_emails_received_at ON inbox_emails(received_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_inbox_emails_in_reply_to ON inbox_emails(in_reply_to)`,
];

let schemaReady = false;

export async function ensureMailSchema(): Promise<void> {
    if (schemaReady) return;
    for (const sql of SCHEMA_STATEMENTS) {
        await query(sql);
    }
    schemaReady = true;
}
