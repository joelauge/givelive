export const WATERMARK_TEXT = 'Made with GiveLive.app';
export const WATERMARK_BASE_URL = 'https://givelive.app';

export type WatermarkMedium = 'page' | 'sms' | 'email';

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

export function shouldShowWatermarkForPlan(planId: string): boolean {
    return planId === 'free';
}
