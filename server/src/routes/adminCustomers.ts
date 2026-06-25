import { FastifyInstance } from 'fastify';
import { query } from '../db';
import { requirePlatformAdmin } from '../lib/auth';
import {
    getClerkUser,
    getClerkUsersByIds,
    isClerkAdminConfigured,
    listClerkUsers,
} from '../lib/clerkAdmin';
import { ensureAdminSchema, recordAdminAction } from '../db/ensureAdminSchema';
import {
    getOrCreateOrganization,
    getOrganization,
    updateOrganizationPlan,
    type OrganizationRow,
} from '../services/organizationBilling';
import { getStripe } from '../lib/stripe';

const VALID_PLANS = ['free', 'starter', 'growth', 'pro', 'enterprise'] as const;
type ValidPlan = (typeof VALID_PLANS)[number];

function isValidPlan(value: unknown): value is ValidPlan {
    return typeof value === 'string' && (VALID_PLANS as readonly string[]).includes(value);
}

async function loadOrgsByIds(ids: string[]): Promise<Map<string, OrganizationRow>> {
    const map = new Map<string, OrganizationRow>();
    if (ids.length === 0) return map;
    const res = await query('SELECT * FROM organizations WHERE id = ANY($1)', [ids]);
    for (const row of res.rows) map.set(row.id, row);
    return map;
}

async function loadCampaignCounts(ids: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (ids.length === 0) return map;
    const res = await query(
        `SELECT org_id, COUNT(*)::int AS count,
                COUNT(*) FILTER (WHERE is_published)::int AS published
         FROM events WHERE org_id = ANY($1) GROUP BY org_id`,
        [ids]
    );
    for (const row of res.rows) map.set(row.org_id, row.count);
    return map;
}

export default async function adminCustomerRoutes(server: FastifyInstance) {
    // Lightweight probe so the client can decide whether to show the Admin nav.
    server.get('/admin/access', async (request, reply) => {
        const userId = await requirePlatformAdmin(request, reply);
        if (!userId) return;
        return { admin: true, clerkConfigured: isClerkAdminConfigured() };
    });

    server.get('/admin/stats', async (request, reply) => {
        const userId = await requirePlatformAdmin(request, reply);
        if (!userId) return;
        await ensureAdminSchema();

        const [planRows, campaignRow, clerkList] = await Promise.all([
            query(`SELECT plan_id, COUNT(*)::int AS count FROM organizations GROUP BY plan_id`),
            query(`SELECT COUNT(*)::int AS count FROM events`),
            listClerkUsers({ limit: 1, offset: 0 }).catch(() => ({ users: [], total: 0 })),
        ]);

        const byPlan: Record<string, number> = { free: 0, starter: 0, growth: 0, pro: 0, enterprise: 0 };
        let paidCustomers = 0;
        for (const row of planRows.rows) {
            byPlan[row.plan_id] = row.count;
            if (row.plan_id !== 'free') paidCustomers += row.count;
        }

        return {
            totalCustomers: clerkList.total,
            byPlan,
            paidCustomers,
            totalCampaigns: campaignRow.rows[0]?.count ?? 0,
        };
    });

    server.get('/admin/customers', async (request, reply) => {
        const userId = await requirePlatformAdmin(request, reply);
        if (!userId) return;

        if (!isClerkAdminConfigured()) {
            return reply.code(503).send({ error: 'Clerk is not configured' });
        }

        const { search, limit = '25', offset = '0' } = request.query as {
            search?: string;
            limit?: string;
            offset?: string;
        };
        const lim = Math.min(Math.max(parseInt(limit) || 25, 1), 100);
        const off = Math.max(parseInt(offset) || 0, 0);

        const { users, total } = await listClerkUsers({
            limit: lim,
            offset: off,
            query: search?.trim() || undefined,
        });

        const ids = users.map((u) => u.id);
        const [orgs, campaigns] = await Promise.all([
            loadOrgsByIds(ids),
            loadCampaignCounts(ids),
        ]);

        const customers = users.map((u) => {
            const org = orgs.get(u.id);
            return {
                ...u,
                planId: org?.plan_id || 'free',
                aiFollowUpAddon: org?.ai_followup_addon || false,
                hasSubscription: Boolean(org?.stripe_subscription_id),
                stripeCustomerId: org?.stripe_customer_id || null,
                leadsThisPeriod: org?.leads_this_period || 0,
                campaignCount: campaigns.get(u.id) || 0,
            };
        });

        return { customers, total, limit: lim, offset: off };
    });

    server.get<{ Params: { id: string } }>('/admin/customers/:id', async (request, reply) => {
        const userId = await requirePlatformAdmin(request, reply);
        if (!userId) return;
        await ensureAdminSchema();

        const { id } = request.params;
        const [clerkUser, org, campaignsRes, actionsRes] = await Promise.all([
            getClerkUser(id),
            getOrganization(id),
            query(
                `SELECT id, name, is_published, created_at, updated_at
                 FROM events WHERE org_id = $1 ORDER BY created_at DESC LIMIT 100`,
                [id]
            ),
            query(
                `SELECT id, admin_user_id, action, details, created_at
                 FROM admin_actions WHERE target_org_id = $1 ORDER BY created_at DESC LIMIT 25`,
                [id]
            ),
        ]);

        if (!clerkUser && !org && campaignsRes.rows.length === 0) {
            return reply.code(404).send({ error: 'Customer not found' });
        }

        // Best-effort live Stripe subscription detail.
        let stripeSubscription: {
            id: string;
            status: string;
            currentPeriodEnd: number | null;
            cancelAtPeriodEnd: boolean;
            amount: number | null;
            currency: string | null;
            interval: string | null;
        } | null = null;

        const stripe = getStripe();
        if (stripe && org?.stripe_customer_id) {
            try {
                const subs = await stripe.subscriptions.list({
                    customer: org.stripe_customer_id,
                    status: 'all',
                    limit: 1,
                });
                const sub = subs.data[0];
                if (sub) {
                    const item = sub.items.data[0];
                    stripeSubscription = {
                        id: sub.id,
                        status: sub.status,
                        currentPeriodEnd: (sub as any).current_period_end ?? null,
                        cancelAtPeriodEnd: sub.cancel_at_period_end,
                        amount: item?.price?.unit_amount ?? null,
                        currency: item?.price?.currency ?? null,
                        interval: item?.price?.recurring?.interval ?? null,
                    };
                }
            } catch (err) {
                request.log.warn({ err }, 'Failed to load Stripe subscription for admin view');
            }
        }

        return {
            customer: clerkUser || { id, email: null, name: null, imageUrl: null, createdAt: null, lastSignInAt: null, banned: false },
            organization: org,
            campaigns: campaignsRes.rows,
            stripe: {
                customerId: org?.stripe_customer_id || null,
                subscriptionId: org?.stripe_subscription_id || null,
                subscription: stripeSubscription,
            },
            recentActions: actionsRes.rows,
        };
    });

    server.patch<{ Params: { id: string } }>('/admin/customers/:id/plan', async (request, reply) => {
        const adminId = await requirePlatformAdmin(request, reply);
        if (!adminId) return;
        await ensureAdminSchema();

        const { id } = request.params;
        const { planId, aiFollowUpAddon, note } = request.body as {
            planId?: string;
            aiFollowUpAddon?: boolean;
            note?: string;
        };

        if (planId !== undefined && !isValidPlan(planId)) {
            return reply.code(400).send({ error: 'Invalid planId' });
        }
        if (planId === undefined && aiFollowUpAddon === undefined) {
            return reply.code(400).send({ error: 'Nothing to update' });
        }

        const clerkUser = await getClerkUser(id);
        const before = await getOrCreateOrganization(id, {
            name: clerkUser?.name || undefined,
            email: clerkUser?.email || undefined,
        });

        await updateOrganizationPlan(id, {
            plan_id: planId,
            ai_followup_addon: aiFollowUpAddon,
        });
        const after = await getOrganization(id);

        await recordAdminAction({
            adminUserId: adminId,
            targetOrgId: id,
            action: 'plan_override',
            details: {
                from: { plan_id: before.plan_id, ai_followup_addon: before.ai_followup_addon },
                to: { plan_id: after?.plan_id, ai_followup_addon: after?.ai_followup_addon },
                note: note?.trim() || null,
            },
        });

        return { success: true, organization: after };
    });

    server.post<{ Params: { id: string } }>('/admin/customers/:id/reset-leads', async (request, reply) => {
        const adminId = await requirePlatformAdmin(request, reply);
        if (!adminId) return;
        await ensureAdminSchema();

        const { id } = request.params;
        const org = await getOrganization(id);
        if (!org) return reply.code(404).send({ error: 'Customer has no billing record' });

        await query(
            `UPDATE organizations SET leads_this_period = 0, leads_period_start = CURRENT_DATE, updated_at = NOW() WHERE id = $1`,
            [id]
        );
        await recordAdminAction({
            adminUserId: adminId,
            targetOrgId: id,
            action: 'reset_leads',
            details: { previous: org.leads_this_period },
        });

        return { success: true };
    });
}
