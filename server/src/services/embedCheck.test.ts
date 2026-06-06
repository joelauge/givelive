import { describe, expect, it } from 'vitest';
import { checkUrlEmbeddable } from './embedCheck';

describe('checkUrlEmbeddable', () => {
    it('rejects invalid URLs', async () => {
        await expect(checkUrlEmbeddable('not-a-url')).resolves.toEqual({
            embeddable: false,
            reason: 'invalid-url',
        });
    });

    it('detects sites that block cross-origin framing', async () => {
        const result = await checkUrlEmbeddable('https://royalanthems.com');
        expect(result.embeddable).toBe(false);
        expect(result.reason).toMatch(/x-frame-options|csp-frame-ancestors/);
    }, 15_000);
});
