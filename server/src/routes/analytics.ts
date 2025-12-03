import { FastifyInstance } from 'fastify';
import { query } from '../db';

interface AnalyticsBody {
    event_id: string;
    user_id?: string;
    node_id?: string;
    action: string; // 'view', 'click', 'dropoff', 'scan'
    metadata?: any;
}

export default async function analyticsRoutes(server: FastifyInstance) {
    server.post<{ Body: AnalyticsBody }>('/analytics/track', async (request, reply) => {
        try {
            const { event_id, user_id, node_id, action, metadata } = request.body;

            // For now, we'll just log this to console or maybe a separate table if we had one.
            // In a real app, this might go to a time-series DB or just a 'analytics_events' table.
            // Let's assume we just log it for MVP.

            server.log.info({
                type: 'ANALYTICS',
                event_id,
                user_id,
                node_id,
                action,
                metadata
            });

            return { success: true };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Endpoint to get stats (simplified)
    server.get<{ Params: { eventId: string } }>('/analytics/:eventId/stats', async (request, reply) => {
        try {
            const { eventId } = request.params;

            // Mock stats
            const stats = {
                scans: 150,
                conversions: 45,
                donations_total: 1250.00,
                active_users: 12
            };

            return stats;
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
}
