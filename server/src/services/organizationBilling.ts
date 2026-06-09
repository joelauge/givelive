import { query } from '../db';
import { resolvePlanIdFromPriceId } from './billingPriceResolver';

const SCHEMA_SQL = `
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

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);
`;

let schemaReady = false;

export async function ensureBillingSchema(): Promise<void> {
    if (schemaReady) return;
    await query(SCHEMA_SQL);
    schemaReady = true;
}

export type OrganizationRow = {
    id: string;
    name: string | null;
    plan_id: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    ai_followup_addon: boolean;
    leads_this_period: number;
    leads_period_start: string;
};

export async function getOrganization(orgId: string): Promise<OrganizationRow | null> {
    await ensureBillingSchema();
    const result = await query('SELECT * FROM organizations WHERE id = $1', [orgId]);
    return result.rows[0] || null;
}

export async function getOrCreateOrganization(
    orgId: string,
    opts?: { name?: string; email?: string }
): Promise<OrganizationRow> {
    await ensureBillingSchema();
    const existing = await getOrganization(orgId);
    if (existing) return existing;

    const result = await query(
        `INSERT INTO organizations (id, name, plan_id) VALUES ($1, $2, 'free') RETURNING *`,
        [orgId, opts?.name || opts?.email || null]
    );
    return result.rows[0];
}

export async function updateOrganizationPlan(
    orgId: string,
    data: {
        plan_id?: string;
        stripe_customer_id?: string;
        stripe_subscription_id?: string | null;
        ai_followup_addon?: boolean;
    }
): Promise<void> {
    await ensureBillingSchema();
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (data.plan_id !== undefined) {
        fields.push(`plan_id = $${i++}`);
        values.push(data.plan_id);
    }
    if (data.stripe_customer_id !== undefined) {
        fields.push(`stripe_customer_id = $${i++}`);
        values.push(data.stripe_customer_id);
    }
    if (data.stripe_subscription_id !== undefined) {
        fields.push(`stripe_subscription_id = $${i++}`);
        values.push(data.stripe_subscription_id);
    }
    if (data.ai_followup_addon !== undefined) {
        fields.push(`ai_followup_addon = $${i++}`);
        values.push(data.ai_followup_addon);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = NOW()');
    values.push(orgId);

    await query(
        `UPDATE organizations SET ${fields.join(', ')} WHERE id = $${i}`,
        values
    );
}

export async function findOrganizationByStripeCustomer(
    customerId: string
): Promise<OrganizationRow | null> {
    await ensureBillingSchema();
    const result = await query(
        'SELECT * FROM organizations WHERE stripe_customer_id = $1',
        [customerId]
    );
    return result.rows[0] || null;
}

/** Map active Stripe subscription items to plan_id + AI add-on flag */
export function resolvePlanFromSubscriptionItems(
    items: { price?: { id?: string } | string }[]
): { plan_id: string; ai_followup_addon: boolean } {
    let plan_id = 'free';
    let ai_followup_addon = false;

    for (const item of items) {
        const priceId =
            typeof item.price === 'string' ? item.price : item.price?.id;
        if (!priceId) continue;
        const mapped = resolvePlanIdFromPriceId(priceId);
        if (mapped === 'ai_followup_addon') {
            ai_followup_addon = true;
        } else if (['starter', 'growth', 'pro'].includes(mapped)) {
            plan_id = mapped;
        }
    }

    return { plan_id, ai_followup_addon };
}
