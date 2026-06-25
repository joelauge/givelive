import { query } from './index';

const SCHEMA_STATEMENTS = [
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    `CREATE TABLE IF NOT EXISTS admin_actions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      admin_user_id TEXT NOT NULL,
      target_org_id TEXT,
      action TEXT NOT NULL,
      details JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_org_id)`,
    `CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at DESC)`,
];

let schemaReady = false;

export async function ensureAdminSchema(): Promise<void> {
    if (schemaReady) return;
    for (const sql of SCHEMA_STATEMENTS) {
        await query(sql);
    }
    schemaReady = true;
}

export async function recordAdminAction(entry: {
    adminUserId: string;
    targetOrgId?: string | null;
    action: string;
    details?: Record<string, unknown>;
}): Promise<void> {
    await ensureAdminSchema();
    await query(
        `INSERT INTO admin_actions (admin_user_id, target_org_id, action, details)
         VALUES ($1, $2, $3, $4)`,
        [entry.adminUserId, entry.targetOrgId || null, entry.action, JSON.stringify(entry.details || {})]
    );
}
