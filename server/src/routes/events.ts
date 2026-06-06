import { FastifyInstance } from 'fastify';
import { query } from '../db';
import { getCampaignLimitForPlan } from '../config/planLimits';
import { getOrCreateOrganization } from '../services/organizationBilling';
import { shouldShowWatermarkForPlan } from '../services/watermark';

interface EventBody {
    org_id: string;
    name: string;
    date?: string;
    qr_url?: string;
    root_node_id?: string;
}

export default async function eventRoutes(server: FastifyInstance) {
    // Get all events
    server.get('/events', async (request, reply) => {
        try {
            const result = await query('SELECT * FROM events ORDER BY created_at DESC');
            return result.rows;
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get single event
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

    // Get all nodes for an event
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

    // Create event
    server.post<{ Body: EventBody }>('/events', async (request, reply) => {
        try {
            const { org_id, name, date, qr_url, root_node_id } = request.body;

            if (org_id) {
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

    // Update event (partial update - only updates provided fields)
    server.put<{ Params: { id: string }; Body: Partial<EventBody> }>('/events/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const updates = request.body;

            // Build dynamic SQL query based on provided fields
            const fields = Object.keys(updates);
            if (fields.length === 0) {
                reply.code(400).send({ error: 'No fields to update' });
                return;
            }

            // Create SET clause with proper parameter indexing
            const setClause = fields.map((field, index) => `"${field}" = $${index + 1}`).join(', ');
            const values = fields.map(field => updates[field as keyof EventBody]);
            values.push(id); // Add id as the last parameter

            const sql = `UPDATE events SET ${setClause}, updated_at = NOW() WHERE id = $${values.length}::uuid RETURNING *`;

            server.log.info({ sql, values }, 'Executing update query');

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

    // Save flow (nodes and edges) for an event
    server.put<{ Params: { id: string }; Body: { nodes: any[], edges: any[], isPublished?: boolean } }>('/events/:id/flow', async (request, reply) => {
        try {
            const { id } = request.params;
            const { nodes, edges, isPublished } = request.body;

            // JSONB column accepts object directly, no need to stringify
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
    });

    // Get flow (nodes and edges) for an event
    server.get<{ Params: { id: string } }>('/events/:id/flow', async (request, reply) => {
        try {
            const { id } = request.params;
            const result = await query('SELECT flow_data FROM events WHERE id = $1::uuid', [id]);

            if (result.rows.length === 0) {
                reply.code(404).send({ error: 'Event not found' });
                return;
            }

            const flowData = result.rows[0].flow_data;

            // If no flow data yet, return empty flow instead of 404 to avoid console errors
            if (!flowData) {
                return { nodes: [], edges: [] };
            }

            // JSONB column returns object directly, no need to parse
            return flowData;
        } catch (err: any) {
            server.log.error(err);
            reply.code(500).send({ error: 'Failed to get flow', details: err.message });
        }
    });

    // Delete event
    server.delete<{ Params: { id: string } }>('/events/:id', async (request, reply) => {
        try {
            const { id } = request.params;
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
