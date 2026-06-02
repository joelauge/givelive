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

    server.get<{ Params: { nodeId: string } }>('/analytics/node/:nodeId', async (request, reply) => {
        try {
            const { nodeId } = request.params;

            const statsRes = await query(`
                SELECT 
                    COUNT(*) FILTER (WHERE action = 'sent') as sent,
                    COUNT(*) FILTER (WHERE action = 'clicked') as clicked,
                    COUNT(*) FILTER (WHERE action = 'reply_received') as replies
                FROM analytics_events
                WHERE node_id = $1
                AND created_at >= NOW() - INTERVAL '30 days'
            `, [nodeId]);

            const stats = statsRes.rows[0] || { sent: 0, clicked: 0, replies: 0 };

            const revenueRes = await query(`
                SELECT COALESCE(SUM(d.amount), 0) as revenue
                FROM donations d
                JOIN analytics_events ae ON d.user_id = ae.user_id
                WHERE ae.node_id = $1
                AND d.created_at >= ae.created_at
                AND ae.created_at >= NOW() - INTERVAL '30 days'
            `, [nodeId]);

            return {
                sent: parseInt(stats.sent || '0'),
                clicked: parseInt(stats.clicked || '0'),
                replies: parseInt(stats.replies || '0'),
                revenue: parseFloat(revenueRes.rows[0]?.revenue || '0')
            };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
}
