import { describe, it, expect } from 'vitest';
import { createHmac, randomBytes } from 'crypto';
import { verifyWebhookSignature } from './webhookSignature';

const rawSecret = randomBytes(24);
const secret = `whsec_${rawSecret.toString('base64')}`;

function sign(id: string, timestamp: string, payload: string): string {
    return createHmac('sha256', rawSecret).update(`${id}.${timestamp}.${payload}`).digest('base64');
}

const now = Math.floor(Date.now() / 1000);

describe('verifyWebhookSignature', () => {
    const id = 'msg_test';
    const timestamp = String(now);
    const payload = '{"type":"email.received"}';

    it('accepts a valid signature', () => {
        const signature = `v1,${sign(id, timestamp, payload)}`;
        expect(verifyWebhookSignature({ secret, id, timestamp, signature, payload, nowSeconds: now })).toBe(true);
    });

    it('accepts when one of multiple signatures matches', () => {
        const signature = `v1,${Buffer.from(randomBytes(32)).toString('base64')} v1,${sign(id, timestamp, payload)}`;
        expect(verifyWebhookSignature({ secret, id, timestamp, signature, payload, nowSeconds: now })).toBe(true);
    });

    it('rejects a tampered payload', () => {
        const signature = `v1,${sign(id, timestamp, payload)}`;
        expect(verifyWebhookSignature({ secret, id, timestamp, signature, payload: '{"type":"forged"}', nowSeconds: now })).toBe(false);
    });

    it('rejects a wrong secret', () => {
        const signature = `v1,${sign(id, timestamp, payload)}`;
        const otherSecret = `whsec_${randomBytes(24).toString('base64')}`;
        expect(verifyWebhookSignature({ secret: otherSecret, id, timestamp, signature, payload, nowSeconds: now })).toBe(false);
    });

    it('rejects a stale timestamp', () => {
        const staleTs = String(now - 600);
        const signature = `v1,${sign(id, staleTs, payload)}`;
        expect(verifyWebhookSignature({ secret, id, timestamp: staleTs, signature, payload, nowSeconds: now })).toBe(false);
    });

    it('rejects missing inputs', () => {
        expect(verifyWebhookSignature({ secret, id: '', timestamp, signature: 'v1,x', payload, nowSeconds: now })).toBe(false);
        expect(verifyWebhookSignature({ secret: '', id, timestamp, signature: 'v1,x', payload, nowSeconds: now })).toBe(false);
    });
});
