import { createHmac, timingSafeEqual } from 'crypto';

const TOLERANCE_SECONDS = 5 * 60;

/**
 * Verify a Svix-style webhook signature (used by Resend webhooks).
 * The signed content is `${id}.${timestamp}.${rawBody}` HMAC-SHA256'd with
 * the base64-decoded portion of the `whsec_...` secret.
 */
export function verifyWebhookSignature(options: {
    secret: string;
    id: string;
    timestamp: string;
    signature: string;
    payload: string | Buffer;
    nowSeconds?: number;
}): boolean {
    const { secret, id, timestamp, signature, payload } = options;
    if (!secret || !id || !timestamp || !signature) return false;

    const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(now - ts) > TOLERANCE_SECONDS) return false;

    const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice(6) : secret, 'base64');
    const signedContent = `${id}.${timestamp}.${typeof payload === 'string' ? payload : payload.toString('utf8')}`;
    const expected = createHmac('sha256', key).update(signedContent).digest('base64');
    const expectedBuf = Buffer.from(expected);

    // Header may contain multiple space-delimited signatures like "v1,abc v1,def"
    for (const part of signature.split(' ')) {
        const value = part.includes(',') ? part.slice(part.indexOf(',') + 1) : part;
        const candidate = Buffer.from(value);
        if (candidate.length === expectedBuf.length && timingSafeEqual(candidate, expectedBuf)) {
            return true;
        }
    }
    return false;
}
