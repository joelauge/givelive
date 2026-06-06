import { query } from '../db';
import { getOrCreateOrganization } from './organizationBilling';

export const WATERMARK_TEXT = 'Made with GiveLive.app';
export const WATERMARK_BASE_URL = 'https://givelive.app';
export const SMS_WATERMARK_SUFFIX = ' — Made w/ GiveLive.app';

export type WatermarkMedium = 'page' | 'sms' | 'email';

export function shouldShowWatermarkForPlan(planId: string): boolean {
    return planId === 'free';
}

export function watermarkUrl(medium: WatermarkMedium, eventId?: string): string {
    const params = new URLSearchParams({
        utm_source: 'watermark',
        utm_medium: medium,
        utm_campaign: 'free_tier',
    });
    if (eventId) {
        params.set('utm_content', eventId);
    }
    return `${WATERMARK_BASE_URL}?${params.toString()}`;
}

export async function shouldShowWatermarkForOrg(orgId: string): Promise<boolean> {
    const org = await getOrCreateOrganization(orgId);
    return shouldShowWatermarkForPlan(org.plan_id);
}

export async function shouldShowWatermarkForEvent(eventId: string): Promise<boolean> {
    const result = await query('SELECT org_id FROM events WHERE id = $1::uuid', [eventId]);
    const orgId = result.rows[0]?.org_id as string | undefined;
    if (!orgId) return true;
    return shouldShowWatermarkForOrg(orgId);
}

export function appendSmsWatermark(body: string, apply: boolean): string {
    if (!apply) return body;
    const trimmed = body.trimEnd();
    if (/givelive\.app/i.test(trimmed) || /made w\/ givelive/i.test(trimmed)) {
        return body;
    }
    return `${trimmed}${SMS_WATERMARK_SUFFIX}`;
}

export function emailWatermarkHtml(eventId?: string): string {
    const url = watermarkUrl('email', eventId);
    return `
            <div style="text-align: center; padding: 20px; color: #888; font-size: 12px; border-top: 1px solid #eee; margin-top: 24px;">
                Made with <a href="${url}" style="color: #4F46E5; text-decoration: none; font-weight: 600;">GiveLive.app</a>
            </div>`;
}
