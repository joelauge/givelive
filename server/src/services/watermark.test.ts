import { describe, it, expect } from 'vitest';
import {
    appendSmsWatermark,
    shouldShowWatermarkForPlan,
    watermarkUrl,
} from './watermark';

describe('watermark', () => {
    it('shows watermark only on free plan', () => {
        expect(shouldShowWatermarkForPlan('free')).toBe(true);
        expect(shouldShowWatermarkForPlan('starter')).toBe(false);
        expect(shouldShowWatermarkForPlan('growth')).toBe(false);
        expect(shouldShowWatermarkForPlan('pro')).toBe(false);
    });

    it('appends SMS suffix once', () => {
        const result = appendSmsWatermark('Hello there', true);
        expect(result).toContain('Made w/ GiveLive.app');
        expect(result.startsWith('Hello there')).toBe(true);
    });

    it('does not double-append SMS watermark', () => {
        const already = 'Hello — Made w/ GiveLive.app';
        expect(appendSmsWatermark(already, true)).toBe(already);
    });

    it('skips SMS watermark when disabled', () => {
        expect(appendSmsWatermark('Hello', false)).toBe('Hello');
    });

    it('builds UTM tracking URL', () => {
        const url = watermarkUrl('page', 'evt-123');
        expect(url).toContain('utm_source=watermark');
        expect(url).toContain('utm_medium=page');
        expect(url).toContain('utm_content=evt-123');
    });
});
