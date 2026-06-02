export type BillablePlanId = 'starter' | 'growth' | 'pro';

export type BillingPlanConfig = {
    id: BillablePlanId;
    name: string;
    /** Stripe Price ID (price_...) from Dashboard or setup script */
    priceIdEnv: string;
    /** Optional add-on */
    addon?: boolean;
};

export const billablePlans: BillingPlanConfig[] = [
    { id: 'starter', name: 'Starter', priceIdEnv: 'STRIPE_PRICE_STARTER' },
    { id: 'growth', name: 'Growth', priceIdEnv: 'STRIPE_PRICE_GROWTH' },
    { id: 'pro', name: 'Pro', priceIdEnv: 'STRIPE_PRICE_PRO' },
];

export const aiFollowUpAddon = {
    name: 'AI Follow-Up Assistant',
    priceIdEnv: 'STRIPE_PRICE_AI_FOLLOWUP',
};

export function getPriceIdForPlan(planId: BillablePlanId): string | null {
    const plan = billablePlans.find((p) => p.id === planId);
    if (!plan) return null;
    return process.env[plan.priceIdEnv]?.trim() || null;
}

export function getAiFollowUpPriceId(): string | null {
    return process.env[aiFollowUpAddon.priceIdEnv]?.trim() || null;
}

export function planIdFromPriceId(priceId: string): string {
    for (const plan of billablePlans) {
        const envPrice = process.env[plan.priceIdEnv]?.trim();
        if (envPrice === priceId) return plan.id;
    }
    const aiPrice = getAiFollowUpPriceId();
    if (aiPrice === priceId) return 'ai_followup_addon';
    return 'unknown';
}
