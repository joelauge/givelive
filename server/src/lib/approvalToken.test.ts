import { describe, it, expect } from 'vitest';
import { signApprovalToken, verifyApprovalToken } from './approvalToken';

const SECRET = 'test-secret';
const future = () => Math.floor(Date.now() / 1000) + 3600;

describe('approval tokens', () => {
    it('round-trips a valid token', () => {
        const token = signApprovalToken({ pr: 42, exp: future() }, SECRET);
        const payload = verifyApprovalToken(token, SECRET);
        expect(payload?.pr).toBe(42);
    });

    it('rejects a token signed with a different secret', () => {
        const token = signApprovalToken({ pr: 42, exp: future() }, 'other-secret');
        expect(verifyApprovalToken(token, SECRET)).toBeNull();
    });

    it('rejects a tampered payload', () => {
        const token = signApprovalToken({ pr: 42, exp: future() }, SECRET);
        const [, sig] = token.split('.');
        const forgedBody = Buffer.from(JSON.stringify({ pr: 999, exp: future() })).toString('base64url');
        expect(verifyApprovalToken(`${forgedBody}.${sig}`, SECRET)).toBeNull();
    });

    it('rejects an expired token', () => {
        const token = signApprovalToken({ pr: 42, exp: Math.floor(Date.now() / 1000) - 10 }, SECRET);
        expect(verifyApprovalToken(token, SECRET)).toBeNull();
    });

    it('rejects malformed tokens', () => {
        expect(verifyApprovalToken('', SECRET)).toBeNull();
        expect(verifyApprovalToken('garbage', SECRET)).toBeNull();
        expect(verifyApprovalToken('a.b.c', SECRET)).toBeNull();
        expect(verifyApprovalToken('.signature', SECRET)).toBeNull();
    });
});
