import { query } from '../db';
import { getCampaignLimitForPlan } from '../config/planLimits';
import { getOrCreateOrganization } from './organizationBilling';
import { ensureAnalyticsSchema } from '../db/ensureAnalyticsSchema';

export async function countPublishedCampaigns(
    orgId: string,
    excludeEventId?: string
): Promise<number> {
    await ensureAnalyticsSchema();
    const result = await query(
        `SELECT COUNT(*)::int AS count
         FROM events
         WHERE org_id = $1
           AND (
             COALESCE(is_published, false) = true
             OR COALESCE((flow_data->>'isPublished')::boolean, false) = true
           )
           AND ($2::uuid IS NULL OR id != $2::uuid)`,
        [orgId, excludeEventId ?? null]
    );
    return result.rows[0]?.count ?? 0;
}

export type PublishLimitCheck = {
    canPublish: boolean;
    planId: string;
    limit: number | null;
    publishedCount: number;
};

export async function checkPublishLimit(
    orgId: string,
    eventId: string
): Promise<PublishLimitCheck> {
    const org = await getOrCreateOrganization(orgId);
    const limit = getCampaignLimitForPlan(org.plan_id);
    const publishedCount = await countPublishedCampaigns(orgId, eventId);

    if (limit === null) {
        return { canPublish: true, planId: org.plan_id, limit, publishedCount };
    }

    return {
        canPublish: publishedCount < limit,
        planId: org.plan_id,
        limit,
        publishedCount,
    };
}
