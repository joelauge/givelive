import { query } from '../db';
import { getStripe } from '../lib/stripe';
import { ensureBillingPriceCache, resolvePlanIdFromPriceId } from './billingPriceResolver';

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

function resolvePlanFromMetadataAndItems(
    metaPlanId: string | undefined,
    items: { price?: { id?: string } | string }[]
): { plan_id: string; ai_followup_addon: boolean } {
    const fromItems = resolvePlanFromSubscriptionItems(items);
    const plan_id =
        fromItems.plan_id !== 'free'
            ? fromItems.plan_id
            : ['starter', 'growth', 'pro'].includes(metaPlanId || '')
              ? metaPlanId!
              : 'free';
    return { plan_id, ai_followup_addon: fromItems.ai_followup_addon };
}

/** Pull active subscription state from Stripe and persist to organizations. */
export async function syncOrganizationBillingFromStripe(
    orgId: string
): Promise<OrganizationRow | null> {
    const stripe = getStripe();
    if (!stripe) return getOrganization(orgId);

    await ensureBillingSchema();
    await ensureBillingPriceCache(stripe);

    const org = await getOrganization(orgId);
    if (!org?.stripe_customer_id) return org;

    const subscriptions = await stripe.subscriptions.list({
        customer: org.stripe_customer_id,
        status: 'all',
        limit: 10,
    });

    const active = subscriptions.data.find((sub) =>
        ['active', 'trialing'].includes(sub.status)
    );

    if (!active) {
        return org;
    }

    const { plan_id, ai_followup_addon } = resolvePlanFromMetadataAndItems(
        active.metadata?.plan_id,
        active.items.data
    );

    await updateOrganizationPlan(orgId, {
        plan_id: plan_id !== 'free' ? plan_id : 'starter',
        stripe_subscription_id: active.id,
        ai_followup_addon,
    });

    return getOrganization(orgId);
}

/** Apply a completed Checkout Session immediately (don't wait for webhooks). */
export async function confirmCheckoutSession(
    orgId: string,
    sessionId: string
): Promise<OrganizationRow | null> {
    const stripe = getStripe();
    if (!stripe) throw new Error('STRIPE_SECRET_KEY is not configured');

    await ensureBillingSchema();
    await ensureBillingPriceCache(stripe);

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'subscription.items.data.price'],
    });

    if (session.metadata?.org_id !== orgId) {
        throw new Error('Checkout session does not belong to this account');
    }
    if (session.mode !== 'subscription') {
        throw new Error('Not a subscription checkout session');
    }

    const customerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id;

    let subscriptionId: string | null = null;
    let items: { price?: { id?: string } | string }[] = [];

    const subscription = session.subscription;
    if (subscription && typeof subscription !== 'string') {
        subscriptionId = subscription.id;
        items = subscription.items.data;
    } else if (typeof subscription === 'string') {
        subscriptionId = subscription;
        const sub = await stripe.subscriptions.retrieve(subscription, {
            expand: ['items.data.price'],
        });
        items = sub.items.data;
    }

    const { plan_id, ai_followup_addon } = resolvePlanFromMetadataAndItems(
        session.metadata?.plan_id,
        items
    );

    await updateOrganizationPlan(orgId, {
        plan_id: plan_id !== 'free' ? plan_id : session.metadata?.plan_id || 'starter',
        stripe_customer_id: customerId || undefined,
        stripe_subscription_id: subscriptionId,
        ai_followup_addon,
    });

    return getOrganization(orgId);
}
