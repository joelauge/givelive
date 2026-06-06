import { query } from '../db';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { requireAuth } from './auth';

export type EventRow = {
    id: string;
    org_id: string;
    name: string;
    [key: string]: unknown;
};

export async function getEventById(eventId: string): Promise<EventRow | null> {
    const result = await query('SELECT * FROM events WHERE id = $1::uuid', [eventId]);
    return (result.rows[0] as EventRow) || null;
}

export async function requireEventAccess(
    request: FastifyRequest,
    reply: FastifyReply,
    eventId: string
): Promise<{ userId: string; event: EventRow } | null> {
    const userId = await requireAuth(request, reply);
    if (!userId) return null;

    const event = await getEventById(eventId);
    if (!event) {
        reply.code(404).send({ error: 'Event not found' });
        return null;
    }

    if (event.org_id !== userId) {
        reply.code(403).send({ error: 'Forbidden' });
        return null;
    }

    return { userId, event };
}
