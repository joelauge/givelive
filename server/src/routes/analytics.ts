import { FastifyInstance } from 'fastify';
import { query } from '../db';
import { requireAuth } from '../lib/auth';
import { requireEventAccess } from '../lib/eventAccess';
import { ensureAnalyticsSchema } from '../db/ensureAnalyticsSchema';
import { getEventMetrics, getOrgFlowMetrics, trackAnalyticsEvent } from '../services/analytics';

interface AnalyticsBody {
    event_id: string;
    user_id?: string;
    node_id?: string;
    action: string;
    metadata?: Record<string, unknown>;
}

export default async function analyticsRoutes(server: FastifyInstance) {
    server.post<{ Body: AnalyticsBody }>('/analytics/track', async (request, reply) => {
        try {
            const { event_id, user_id, node_id, action, metadata } = request.body;
            if (!event_id || !action) {
                return reply.code(400).send({ error: 'event_id and action are required' });
            }

            await trackAnalyticsEvent({ event_id, user_id, node_id, action, metadata });
            return { success: true };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    server.get<{ Params: { eventId: string } }>('/analytics/:eventId/stats', async (request, reply) => {
        try {
            await ensureAnalyticsSchema();
            const { eventId } = request.params;
            const access = await requireEventAccess(request, reply, eventId);
            if (!access) return;

            const stats = await getEventMetrics(eventId);
            const conversions =
                stats.scans > 0
                    ? Math.round((stats.lead_captures / stats.scans) * 1000) / 10
                    : 0;

            return {
                ...stats,
                conversions,
            };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    server.get('/analytics/org/overview', async (request, reply) => {
        try {
            await ensureAnalyticsSchema();
            const userId = await requireAuth(request, reply);
            if (!userId) return;

            const data = await getOrgFlowMetrics(userId);
            const totals = data.totals;
            const conversion_rate =
                totals.scans > 0
                    ? Math.round((totals.lead_captures / totals.scans) * 1000) / 10
                    : 0;

            return {
                ...data,
                totals: {
                    ...totals,
                    conversion_rate,
                },
            };
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
                revenue: parseFloat(revenueRes.rows[0]?.revenue || '0'),
            };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
}
