import { FastifyInstance } from 'fastify';
import { query } from '../db';
import { getCampaignLimitForPlan } from '../config/planLimits';
import { getOrCreateOrganization } from '../services/organizationBilling';
import { shouldShowWatermarkForPlan } from '../services/watermark';
import { requireAuth } from '../lib/auth';
import { requireEventAccess } from '../lib/eventAccess';

interface EventBody {
    org_id?: string;
    name: string;
    date?: string;
    qr_url?: string;
    root_node_id?: string;
}

export default async function eventRoutes(server: FastifyInstance) {
    // List events for the authenticated organizer only
    server.get('/events', async (request, reply) => {
        try {
            const userId = await requireAuth(request, reply);
            if (!userId) return;

            const result = await query(
                'SELECT * FROM events WHERE org_id = $1 ORDER BY created_at DESC',
                [userId]
            );
            return result.rows;
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // One-time: move legacy default-org projects to the signed-in user (register before /:id)
    server.post('/events/claim-legacy', async (request, reply) => {
        try {
            const userId = await requireAuth(request, reply);
            if (!userId) return;

            const ownCount = await query(
                'SELECT COUNT(*)::int AS count FROM events WHERE org_id = $1',
                [userId]
            );
            if ((ownCount.rows[0]?.count ?? 0) > 0) {
                return reply.code(400).send({
                    error: 'already_claimed',
                    message: 'You already have projects under your account.',
                });
            }

            const legacyCount = await query(
                "SELECT COUNT(*)::int AS count FROM events WHERE org_id = 'default-org'"
            );
            if ((legacyCount.rows[0]?.count ?? 0) === 0) {
                return { migrated: 0, message: 'No legacy projects to claim.' };
            }

            const result = await query(
                "UPDATE events SET org_id = $1 WHERE org_id = 'default-org' RETURNING id",
                [userId]
            );

            return {
                migrated: result.rows.length,
                message: `Moved ${result.rows.length} legacy project(s) to your account.`,
            };
        } catch (err: any) {
            server.log.error(err);
            reply.code(500).send({ error: err.message || 'Failed to claim legacy projects' });
        }
    });

    // Get single event (public — scanners need metadata for published flows)
    server.get<{ Params: { id: string } }>('/events/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const result = await query('SELECT * FROM events WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                reply.code(404).send({ error: 'Event not found' });
                return;
            }

            const event = result.rows[0];
            const orgId = event.org_id as string | undefined;
            let planId = 'free';
            let showWatermark = true;

            if (orgId) {
                const org = await getOrCreateOrganization(orgId);
                planId = org.plan_id;
                showWatermark = shouldShowWatermarkForPlan(org.plan_id);
            }

            return { ...event, planId, showWatermark };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get all nodes for an event (public — used by live journeys / link resolution)
    server.get<{ Params: { id: string } }>('/events/:id/nodes', async (request, reply) => {
        try {
            const { id } = request.params;
            const result = await query('SELECT * FROM journey_nodes WHERE event_id = $1', [id]);
            return result.rows;
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Create event (org_id always taken from Clerk user — never trust client)
    server.post<{ Body: EventBody }>('/events', async (request, reply) => {
        try {
            const userId = await requireAuth(request, reply);
            if (!userId) return;

            const { name, date, qr_url, root_node_id } = request.body;
            const org_id = userId;

            const org = await getOrCreateOrganization(org_id);
            const limit = getCampaignLimitForPlan(org.plan_id);
            if (limit !== null) {
                const countResult = await query(
                    'SELECT COUNT(*)::int AS count FROM events WHERE org_id = $1',
                    [org_id]
                );
                const count = countResult.rows[0]?.count ?? 0;
                if (count >= limit) {
                    return reply.code(403).send({
                        error: 'plan_limit',
                        message: `Your ${org.plan_id} plan allows ${limit} active campaign${limit === 1 ? '' : 's'}. Upgrade to add more.`,
                        planId: org.plan_id,
                        limit,
                    });
                }
            }

            const result = await query(
                'INSERT INTO events (org_id, name, date, qr_url, root_node_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [org_id, name, date, qr_url, root_node_id]
            );
            reply.code(201).send(result.rows[0]);
        } catch (err: any) {
            server.log.error(err);
            reply.code(500).send({ error: err.message, details: err });
        }
    });

    // Update event (owner only)
    server.put<{ Params: { id: string }; Body: Partial<EventBody> }>('/events/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const access = await requireEventAccess(request, reply, id);
            if (!access) return;

            const updates = { ...request.body };
            delete updates.org_id;

            const fields = Object.keys(updates);
            if (fields.length === 0) {
                reply.code(400).send({ error: 'No fields to update' });
                return;
            }

            const setClause = fields.map((field, index) => `"${field}" = $${index + 1}`).join(', ');
            const values = fields.map((field) => updates[field as keyof EventBody]);
            values.push(id);

            const sql = `UPDATE events SET ${setClause}, updated_at = NOW() WHERE id = $${values.length}::uuid RETURNING *`;

            const result = await query(sql, values);

            if (result.rows.length === 0) {
                reply.code(404).send({ error: 'Event not found' });
                return;
            }
            return result.rows[0];
        } catch (err: any) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error', details: err.message });
        }
    });

    // Save flow draft (owner only)
    server.put<{ Params: { id: string }; Body: { nodes: any[]; edges: any[]; isPublished?: boolean } }>(
        '/events/:id/flow',
        async (request, reply) => {
            try {
                const { id } = request.params;
                const access = await requireEventAccess(request, reply, id);
                if (!access) return;

                const { nodes, edges, isPublished } = request.body;

                const result = await query(
                    'UPDATE events SET flow_data = $1, updated_at = NOW() WHERE id = $2::uuid RETURNING *',
                    [{ nodes, edges, isPublished }, id]
                );

                if (result.rows.length === 0) {
                    reply.code(404).send({ error: 'Event not found' });
                    return;
                }
                return { success: true, event: result.rows[0] };
            } catch (err: any) {
                server.log.error(err);
                reply.code(500).send({ error: 'Failed to save flow', details: err.message });
            }
        }
    );

    // Get flow draft (owner only)
    server.get<{ Params: { id: string } }>('/events/:id/flow', async (request, reply) => {
        try {
            const { id } = request.params;
            const access = await requireEventAccess(request, reply, id);
            if (!access) return;

            const result = await query('SELECT flow_data FROM events WHERE id = $1::uuid', [id]);

            if (result.rows.length === 0) {
                reply.code(404).send({ error: 'Event not found' });
                return;
            }

            const flowData = result.rows[0].flow_data;

            if (!flowData) {
                return { nodes: [], edges: [] };
            }

            return flowData;
        } catch (err: any) {
            server.log.error(err);
            reply.code(500).send({ error: 'Failed to get flow', details: err.message });
        }
    });

    // Delete event (owner only)
    server.delete<{ Params: { id: string } }>('/events/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const access = await requireEventAccess(request, reply, id);
            if (!access) return;

            const result = await query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
            if (result.rows.length === 0) {
                reply.code(404).send({ error: 'Event not found' });
                return;
            }
            return { message: 'Event deleted' };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

}
