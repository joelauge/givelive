import { FastifyInstance } from 'fastify';
import { query } from '../db';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function marketingRoutes(fastify: FastifyInstance) {
    fastify.post('/marketing/subscribe', async (request, reply) => {
        const { email, source } = request.body as { email?: string; source?: string };

        const normalized = email?.trim().toLowerCase();
        if (!normalized || !EMAIL_RE.test(normalized)) {
            return reply.status(400).send({ error: 'A valid email is required' });
        }

        try {
            await query(
                `INSERT INTO newsletter_subscribers (email, source)
                 VALUES ($1, $2)
                 ON CONFLICT (email)
                 DO UPDATE SET unsubscribed_at = NULL, source = COALESCE(newsletter_subscribers.source, EXCLUDED.source)`,
                [normalized, source?.slice(0, 120) || null]
            );
        } catch (err) {
            fastify.log.error({ err }, 'Failed to store newsletter subscriber');
            return reply.status(500).send({ error: 'Failed to subscribe' });
        }

        return reply.send({ success: true });
    });
}
