export type BillablePlanId = 'starter' | 'growth' | 'pro';

export type BillingPlanConfig = {
    id: BillablePlanId;
    name: string;
    /** Live Stripe Product ID */
    stripeProductId: string;
    /** Stripe Price ID (price_...) — optional override; resolved from product if missing or mismatched */
    priceIdEnv: string;
};

export const billablePlans: BillingPlanConfig[] = [
    {
        id: 'starter',
        name: 'Starter',
        stripeProductId: 'prod_UdE4b1Nb7rDIEF',
        priceIdEnv: 'STRIPE_PRICE_STARTER',
    },
    {
        id: 'growth',
        name: 'Growth',
        stripeProductId: 'prod_UdE47EF7jdFwPZ',
        priceIdEnv: 'STRIPE_PRICE_GROWTH',
    },
    {
        id: 'pro',
        name: 'Pro',
        stripeProductId: 'prod_UdE4hmsWbLo7wT',
        priceIdEnv: 'STRIPE_PRICE_PRO',
    },
];

export const aiFollowUpAddon = {
    name: 'AI Follow-Up Assistant',
    stripeProductId: 'prod_UdE44ozVyxHFZr',
    priceIdEnv: 'STRIPE_PRICE_AI_FOLLOWUP',
};

/** Strip accidental trailing comments/whitespace from env values */
export function sanitizeStripeId(value: string | undefined): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    const match = trimmed.match(/^(price_[A-Za-z0-9]+|prod_[A-Za-z0-9]+)/);
    return match ? match[1] : trimmed.split(/\s+/)[0] || null;
}

export function getProductIdForPlan(planId: BillablePlanId): string | null {
    return billablePlans.find((p) => p.id === planId)?.stripeProductId || null;
}

export function getEnvPriceIdForPlan(planId: BillablePlanId): string | null {
    const plan = billablePlans.find((p) => p.id === planId);
    if (!plan) return null;
    return sanitizeStripeId(process.env[plan.priceIdEnv]);
}

export function getEnvAiFollowUpPriceId(): string | null {
    return sanitizeStripeId(process.env[aiFollowUpAddon.priceIdEnv]);
}

/** @deprecated Use billingPriceResolver.getCheckoutPriceId instead after cache is warm */
export function getPriceIdForPlan(planId: BillablePlanId): string | null {
    return getEnvPriceIdForPlan(planId);
}

export function getAiFollowUpPriceId(): string | null {
    return getEnvAiFollowUpPriceId();
}

export function planIdFromPriceId(priceId: string): string {
    for (const plan of billablePlans) {
        const envPrice = getEnvPriceIdForPlan(plan.id);
        if (envPrice === priceId) return plan.id;
    }
    const aiPrice = getEnvAiFollowUpPriceId();
    if (aiPrice === priceId) return 'ai_followup_addon';
    return 'unknown';
}
