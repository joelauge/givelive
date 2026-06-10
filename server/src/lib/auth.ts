import { verifyToken } from '@clerk/backend';
import type { FastifyReply, FastifyRequest } from 'fastify';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY?.trim();

export async function getAuthUserId(request: FastifyRequest): Promise<string | null> {
    if (!CLERK_SECRET_KEY) {
        request.log.error('[Auth] CLERK_SECRET_KEY is not configured');
        return null;
    }

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return null;
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) return null;

    try {
        const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
        return payload.sub || null;
    } catch (err) {
        request.log.warn({ err }, '[Auth] Invalid Clerk token');
        return null;
    }
}

export async function requireAuth(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<string | null> {
    const userId = await getAuthUserId(request);
    if (!userId) {
        reply.code(401).send({ error: 'Unauthorized' });
        return null;
    }
    return userId;
}

/**
 * Restrict a route to platform operators (comma-separated Clerk user IDs in
 * PLATFORM_ADMIN_IDS). Regular signed-in customers get a 403.
 */
export async function requirePlatformAdmin(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<string | null> {
    const userId = await requireAuth(request, reply);
    if (!userId) return null;

    const allowed = (process.env.PLATFORM_ADMIN_IDS || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

    if (!allowed.includes(userId)) {
        reply.code(403).send({ error: 'Forbidden' });
        return null;
    }
    return userId;
}

export async function requireOrgAccess(
    request: FastifyRequest,
    reply: FastifyReply,
    orgId: string | undefined
): Promise<string | null> {
    const userId = await requireAuth(request, reply);
    if (!userId) return null;

    if (!orgId || orgId !== userId) {
        reply.code(403).send({ error: 'Forbidden' });
        return null;
    }

    return userId;
}
