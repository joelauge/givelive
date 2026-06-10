import { createHmac, timingSafeEqual } from 'crypto';

export interface ApprovalPayload {
    /** Pull request number to merge on approval */
    pr: number;
    /** Unix epoch seconds after which the token is invalid */
    exp: number;
}

function hmac(data: string, secret: string): string {
    return createHmac('sha256', secret).update(data).digest('base64url');
}

export function signApprovalToken(payload: ApprovalPayload, secret: string): string {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${body}.${hmac(body, secret)}`;
}

export function verifyApprovalToken(token: string, secret: string): ApprovalPayload | null {
    const dot = token.lastIndexOf('.');
    if (dot <= 0) return null;

    const body = token.slice(0, dot);
    const signature = token.slice(dot + 1);
    const expected = hmac(body, secret);

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
        return null;
    }

    let payload: ApprovalPayload;
    try {
        payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
        return null;
    }

    if (typeof payload.pr !== 'number' || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
}
