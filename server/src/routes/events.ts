import { FastifyInstance } from 'fastify';
import { query } from '../db';

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
            return result.rows[0];
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Create event
    server.post<{ Body: EventBody }>('/events', async (request, reply) => {
        try {
            const { org_id, name, date, qr_url, root_node_id } = request.body;
            const result = await query(
                'INSERT INTO events (org_id, name, date, qr_url, root_node_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [org_id, name, date, qr_url, root_node_id]
            );
            reply.code(201).send(result.rows[0]);
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Update event
    server.put<{ Params: { id: string }; Body: EventBody }>('/events/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const { org_id, name, date, qr_url, root_node_id } = request.body;
            const result = await query(
                'UPDATE events SET org_id = $1, name = $2, date = $3, qr_url = $4, root_node_id = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
                [org_id, name, date, qr_url, root_node_id, id]
            );
            if (result.rows.length === 0) {
                reply.code(404).send({ error: 'Event not found' });
                return;
            }
            return result.rows[0];
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
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
