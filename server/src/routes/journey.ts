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

            // Get root node
            const eventResult = await query('SELECT root_node_id FROM events WHERE id = $1', [event_id]);
            const rootNodeId = eventResult.rows[0]?.root_node_id;

            if (!rootNodeId) {
                reply.code(400).send({ error: 'Event has no root node' });
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
}
