import { FastifyInstance } from 'fastify';
import { requireStripe } from '../lib/stripe';
import {
    type BillablePlanId,
    aiFollowUpAddon,
    billablePlans,
    getAiFollowUpPriceId,
    getPriceIdForPlan,
} from '../config/billingPlans';
import {
    ensureBillingSchema,
    getOrCreateOrganization,
    getOrganization,
    updateOrganizationPlan,
} from '../services/organizationBilling';
import { handleBillingStripeEvent } from '../services/stripeBillingWebhooks';
import { checkPublishLimit } from '../services/planEnforcement';

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

export default async function billingRoutes(server: FastifyInstance) {
    /** Current plan + Stripe connection for an org (Clerk user id) */
    server.get<{ Querystring: { org_id: string } }>('/billing/status', async (request, reply) => {
        try {
            const { org_id } = request.query;
            if (!org_id) {
                return reply.code(400).send({ error: 'org_id is required' });
            }

            await ensureBillingSchema();
            const org = await getOrCreateOrganization(org_id);

            return {
                orgId: org.id,
                planId: org.plan_id,
                aiFollowUpAddon: org.ai_followup_addon,
                hasSubscription: Boolean(org.stripe_subscription_id),
                stripeCustomerId: org.stripe_customer_id,
                leadsThisPeriod: org.leads_this_period,
            };
        } catch (err: any) {
            server.log.error(err);
            reply.code(500).send({ error: err.message || 'Failed to load billing status' });
        }
    });

    /** Whether org can publish another live QR flow (excludes current event when re-publishing) */
    server.get<{ Querystring: { org_id: string; event_id: string } }>(
        '/billing/can-publish',
        async (request, reply) => {
            try {
                const { org_id, event_id } = request.query;
                if (!org_id || !event_id) {
                    return reply.code(400).send({ error: 'org_id and event_id are required' });
                }

                const result = await checkPublishLimit(org_id, event_id);
                return result;
            } catch (err: any) {
                server.log.error(err);
                reply.code(500).send({ error: err.message || 'Failed to check publish limit' });
            }
        }
    );

    /** Create Stripe Checkout for a paid plan */
    server.post<{
        Body: {
            org_id: string;
            plan_id: BillablePlanId;
            email?: string;
            name?: string;
            include_ai_addon?: boolean;
        };
    }>('/billing/checkout', async (request, reply) => {
        try {
            const stripe = requireStripe();
            const { org_id, plan_id, email, name, include_ai_addon } = request.body;

            if (!org_id || !plan_id) {
                return reply.code(400).send({ error: 'org_id and plan_id are required' });
            }

            const priceId = getPriceIdForPlan(plan_id);
            if (!priceId) {
                return reply.code(400).send({
                    error: `Stripe Price ID not configured for plan "${plan_id}". Set ${billablePlans.find((p) => p.id === plan_id)?.priceIdEnv} in server env.`,
                });
            }

            const org = await getOrCreateOrganization(org_id, { email, name });

            let customerId = org.stripe_customer_id;
            if (!customerId) {
                const customer = await stripe.customers.create({
                    email: email || undefined,
                    name: name || undefined,
                    metadata: { org_id },
                });
                customerId = customer.id;
                await updateOrganizationPlan(org_id, { stripe_customer_id: customerId });
            }

            const lineItems: { price: string; quantity: number }[] = [
                { price: priceId, quantity: 1 },
            ];

            if (include_ai_addon) {
                const addonPrice = getAiFollowUpPriceId();
                if (addonPrice) {
                    lineItems.push({ price: addonPrice, quantity: 1 });
                }
            }

            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                customer: customerId,
                line_items: lineItems,
                success_url: `${FRONTEND_URL}/settings?billing=success&plan=${plan_id}`,
                cancel_url: `${FRONTEND_URL}/pricing?billing=canceled`,
                metadata: { org_id, plan_id },
                subscription_data: {
                    metadata: { org_id, plan_id },
                },
                allow_promotion_codes: true,
            });

            return { url: session.url, sessionId: session.id };
        } catch (err: any) {
            server.log.error(err);
            reply.code(500).send({ error: err.message || 'Failed to create checkout session' });
        }
    });

    /** Stripe Customer Portal — manage subscription & payment method */
    server.post<{ Body: { org_id: string } }>('/billing/portal', async (request, reply) => {
        try {
            const stripe = requireStripe();
            const { org_id } = request.body;

            if (!org_id) {
                return reply.code(400).send({ error: 'org_id is required' });
            }

            const org = await getOrganization(org_id);
            if (!org?.stripe_customer_id) {
                return reply.code(400).send({
                    error: 'No billing account yet. Subscribe to a plan first.',
                });
            }

            const session = await stripe.billingPortal.sessions.create({
                customer: org.stripe_customer_id,
                return_url: `${FRONTEND_URL}/settings`,
            });

            return { url: session.url };
        } catch (err: any) {
            server.log.error(err);
            reply.code(500).send({ error: err.message || 'Failed to open billing portal' });
        }
    });

    /** Which plans can be purchased (price IDs configured) */
    server.get('/billing/plans-available', async (_request, reply) => {
        const plans = billablePlans.map((p) => ({
            id: p.id,
            name: p.name,
            available: Boolean(process.env[p.priceIdEnv]?.trim()),
        }));
        return {
            plans,
            aiFollowUpAddon: {
                name: aiFollowUpAddon.name,
                available: Boolean(getAiFollowUpPriceId()),
            },
            stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
        };
    });
}

/** Handled on shared POST /api/donations/webhook */
export async function processBillingWebhookEvent(
    event: import('stripe').Stripe.Event,
    log: { info: (msg: string) => void; error: (msg: string) => void }
): Promise<boolean> {
    return handleBillingStripeEvent(event, log);
}
