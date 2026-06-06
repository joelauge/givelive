import { planLimits, type PlanId } from '../data/pricingPlans';

export function getCampaignLimit(planId: PlanId): number | null {
    const limits = planLimits[planId] ?? planLimits.free;
    return limits.activeCampaigns ?? limits.qrCodes;
}

export function canCreateCampaign(planId: PlanId, currentCount: number): boolean {
    const limit = getCampaignLimit(planId);
    if (limit === null) return true;
    return currentCount < limit;
}
