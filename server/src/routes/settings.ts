import { FastifyInstance } from 'fastify';
import { query } from '../db';

export default async function settingsRoutes(server: FastifyInstance) {
    server.get('/settings/:key', async (request, reply) => {
        const { key } = request.params as { key: string };
        const res = await query('SELECT value FROM settings WHERE key = $1', [key]);
        if (res.rows.length === 0) return {};
        return res.rows[0].value;
    });

    server.post('/settings/:key', async (request, reply) => {
        const { key } = request.params as { key: string };
        const value = request.body;

        await query(
            'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
            [key, value]
        );
        return { success: true };
    });
}
