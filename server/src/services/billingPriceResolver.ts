import type Stripe from 'stripe';
import {
    type BillablePlanId,
    aiFollowUpAddon,
    billablePlans,
    getEnvAiFollowUpPriceId,
    getEnvPriceIdForPlan,
    planIdFromPriceId,
    sanitizeStripeId,
} from '../config/billingPlans';

type PlanKey = BillablePlanId | 'ai_followup';

const resolvedPriceByPlan = new Map<PlanKey, string>();
const planByPriceId = new Map<string, string>();

let cacheReady = false;
let cacheError: string | null = null;

function registerPrice(planKey: PlanKey, priceId: string, planIdForWebhook: string) {
    resolvedPriceByPlan.set(planKey, priceId);
    planByPriceId.set(priceId, planIdForWebhook);
}

async function pickActiveMonthlyPrice(
    stripe: Stripe,
    productId: string
): Promise<string | null> {
    const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 20,
    });

    const monthly = prices.data
        .filter((p) => p.type === 'recurring' && p.recurring?.interval === 'month')
        .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];

    return monthly?.id ?? null;
}

async function resolvePlanPrice(
    stripe: Stripe,
    planKey: PlanKey,
    productId: string,
    envPriceId: string | null,
    webhookPlanId: string
): Promise<void> {
    if (envPriceId) {
        try {
            const price = await stripe.prices.retrieve(envPriceId);
            const product =
                typeof price.product === 'string' ? price.product : price.product?.id;
            if (product === productId && price.active) {
                registerPrice(planKey, envPriceId, webhookPlanId);
                return;
            }
        } catch {
            // fall through to product lookup
        }
    }

    const resolved = await pickActiveMonthlyPrice(stripe, productId);
    if (!resolved) {
        throw new Error(`No active monthly price found for Stripe product ${productId}`);
    }
    registerPrice(planKey, resolved, webhookPlanId);
}

export async function warmBillingPriceCache(stripe: Stripe): Promise<void> {
    resolvedPriceByPlan.clear();
    planByPriceId.clear();
    cacheReady = false;
    cacheError = null;

    try {
        for (const plan of billablePlans) {
            await resolvePlanPrice(
                stripe,
                plan.id,
                plan.stripeProductId,
                getEnvPriceIdForPlan(plan.id),
                plan.id
            );
        }

        await resolvePlanPrice(
            stripe,
            'ai_followup',
            aiFollowUpAddon.stripeProductId,
            getEnvAiFollowUpPriceId(),
            'ai_followup_addon'
        );

        cacheReady = true;
    } catch (err) {
        cacheError = err instanceof Error ? err.message : 'Failed to resolve Stripe prices';
        throw err;
    }
}

export function isBillingPriceCacheReady(): boolean {
    return cacheReady;
}

export function getBillingCacheError(): string | null {
    return cacheError;
}

export async function ensureBillingPriceCache(stripe: Stripe): Promise<void> {
    if (cacheReady) return;
    await warmBillingPriceCache(stripe);
}

export function getCheckoutPriceId(planId: BillablePlanId): string | null {
    return resolvedPriceByPlan.get(planId) ?? null;
}

export function getCheckoutAiAddonPriceId(): string | null {
    return resolvedPriceByPlan.get('ai_followup') ?? null;
}

export function resolvePlanIdFromPriceId(priceId: string): string {
    const sanitized = sanitizeStripeId(priceId);
    if (!sanitized) return 'unknown';

    const fromCache = planByPriceId.get(sanitized);
    if (fromCache) return fromCache;

    return planIdFromPriceId(sanitized);
}

export function getBillingCatalog() {
    return {
        plans: billablePlans.map((p) => ({
            id: p.id,
            name: p.name,
            stripeProductId: p.stripeProductId,
            priceId: getCheckoutPriceId(p.id),
            available: Boolean(getCheckoutPriceId(p.id)),
        })),
        aiFollowUpAddon: {
            name: aiFollowUpAddon.name,
            stripeProductId: aiFollowUpAddon.stripeProductId,
            priceId: getCheckoutAiAddonPriceId(),
            available: Boolean(getCheckoutAiAddonPriceId()),
        },
    };
}
