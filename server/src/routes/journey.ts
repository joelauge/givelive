import { FastifyInstance } from 'fastify';
import { query } from '../db';

interface NodeBody {
    event_id: string;
    type: 'page' | 'sms' | 'delay' | 'condition' | 'donation' | 'end';
    config?: any;
    next_nodes?: any[];
}

interface ProgressBody {
    user_id: string;
    event_id: string;
    current_node_id: string;
    action?: string; // e.g., 'clicked_link', 'watched_video'
}

export default async function journeyRoutes(server: FastifyInstance) {
    // Get all nodes for an event
    server.get<{ Params: { eventId: string } }>('/journey/:eventId/nodes', async (request, reply) => {
        try {
            const { eventId } = request.params;
            const result = await query('SELECT * FROM journey_nodes WHERE event_id = $1', [eventId]);
            return result.rows;
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Create a node
    server.post<{ Body: NodeBody }>('/journey/nodes', async (request, reply) => {
        try {
            const { event_id, type, config, next_nodes } = request.body;
            const result = await query(
                'INSERT INTO journey_nodes (event_id, type, config, next_nodes) VALUES ($1, $2, $3, $4) RETURNING *',
                [event_id, type, config || {}, next_nodes || []]
            );
            reply.code(201).send(result.rows[0]);
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Update a node
    server.put<{ Params: { id: string }; Body: NodeBody }>('/journey/nodes/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const { type, config, next_nodes } = request.body;
            const result = await query(
                'UPDATE journey_nodes SET type = $1, config = $2, next_nodes = $3 WHERE id = $4 RETURNING *',
                [type, config, next_nodes, id]
            );
            if (result.rows.length === 0) {
                reply.code(404).send({ error: 'Node not found' });
                return;
            }
            return result.rows[0];
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Start Journey (Create User + Progress)
    server.post<{ Body: { event_id: string; phone_number?: string } }>('/journey/start', async (request, reply) => {
        try {
            const { event_id, phone_number } = request.body;

            // Create user (or find existing - simplified for now)
            const userResult = await query(
                'INSERT INTO users (event_id, phone_number) VALUES ($1, $2) RETURNING *',
                [event_id, phone_number]
            );
            const user = userResult.rows[0];

            // Get event and root node
            const eventResult = await query('SELECT root_node_id FROM events WHERE id = $1', [event_id]);

            if (eventResult.rows.length === 0) {
                reply.code(404).send({ error: 'Event not found' });
                return;
            }

            const rootNodeId = eventResult.rows[0]?.root_node_id;

            if (!rootNodeId) {
                reply.code(400).send({ error: 'Journey not yet published. Please publish the flow in the builder.' });
                return;
            }

            // Create progress
            const progressResult = await query(
                'INSERT INTO user_progress (user_id, event_id, current_node_id) VALUES ($1, $2, $3) RETURNING *',
                [user.id, event_id, rootNodeId]
            );

            return { user, progress: progressResult.rows[0] };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
    // Publish Journey (Bulk replace)
    server.post<{ Params: { eventId: string }; Body: { nodes: any[]; edges: any[] } }>('/journey/:eventId/publish', async (request, reply) => {
        try {
            const { eventId } = request.params;
            const { nodes, edges } = request.body;

            // 1. Clear existing nodes
            await query('DELETE FROM journey_nodes WHERE event_id = $1', [eventId]);

            // 2. Create ID mapping from frontend IDs to database UUIDs
            const idMapping = new Map<string, string>();

            // 3. Insert new nodes and build ID mapping
            let rootNodeId: string | null = null;

            for (const node of nodes) {
                const nodeType = node.data?.type || node.type || 'page';

                // Insert node without next_nodes first (will update after we have all UUIDs)
                const result = await query(
                    'INSERT INTO journey_nodes (event_id, type, config, next_nodes) VALUES ($1, $2, $3, $4) RETURNING id',
                    [
                        eventId,
                        nodeType,
                        JSON.stringify(node.data || {}),
                        JSON.stringify([]) // Empty for now, will update later
                    ]
                );

                const dbNodeId = result.rows[0].id;
                idMapping.set(node.id, dbNodeId);

                // If type is 'start', this is the root
                if (nodeType === 'start') {
                    rootNodeId = dbNodeId;
                }
            }

            // 4. Now update next_nodes with mapped UUIDs
            for (const node of nodes) {
                const dbNodeId = idMapping.get(node.id);
                if (!dbNodeId) continue;

                // Find edges starting from this node
                const outboundEdges = edges.filter((e: any) => e.source === node.id);
                const frontendNextNodeIds = outboundEdges.map((e: any) => e.target);

                // Map frontend IDs to database UUIDs
                const dbNextNodeIds = frontendNextNodeIds
                    .map((frontendId: string) => idMapping.get(frontendId))
                    .filter((id): id is string => id !== undefined);

                // Update next_nodes
                await query(
                    'UPDATE journey_nodes SET next_nodes = $1 WHERE id = $2',
                    [JSON.stringify(dbNextNodeIds), dbNodeId]
                );
            }

            // 5. Update Event Root Node
            if (rootNodeId) {
                await query('UPDATE events SET root_node_id = $1 WHERE id = $2', [rootNodeId, eventId]);
            } else if (nodes.length > 0) {
                // Fallback: use the first node if no explicit start
                const firstNodeDbId = idMapping.get(nodes[0].id);
                if (firstNodeDbId) {
                    await query('UPDATE events SET root_node_id = $1 WHERE id = $2', [firstNodeDbId, eventId]);
                }
            }

            return { success: true, message: 'Journey published successfully' };
        } catch (err: any) {
            server.log.error(err);
            reply.code(500).send({
                error: 'Failed to publish journey',
                details: err.message || 'Internal Server Error'
            });
        }
    });
}
