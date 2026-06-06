export type PlanId = 'free' | 'starter' | 'growth' | 'pro' | 'enterprise';

const limits: Record<
    PlanId,
    { activeCampaigns: number | null; qrCodes: number | null }
> = {
    free: { activeCampaigns: 1, qrCodes: 1 },
    starter: { activeCampaigns: 10, qrCodes: null },
    growth: { activeCampaigns: null, qrCodes: null },
    pro: { activeCampaigns: null, qrCodes: null },
    enterprise: { activeCampaigns: null, qrCodes: null },
};

export function getCampaignLimitForPlan(planId: string): number | null {
    const plan = (limits[planId as PlanId] ? planId : 'free') as PlanId;
    const entry = limits[plan];
    return entry.activeCampaigns ?? entry.qrCodes;
}
