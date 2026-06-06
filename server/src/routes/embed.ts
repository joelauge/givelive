import { FastifyInstance } from 'fastify';
import { checkUrlEmbeddable } from '../services/embedCheck';

export default async function embedRoutes(server: FastifyInstance) {
    server.get<{ Querystring: { url?: string } }>('/embed/check', async (request, reply) => {
        const { url } = request.query;

        if (!url) {
            reply.code(400).send({ error: 'url query parameter is required' });
            return;
        }

        try {
            const result = await checkUrlEmbeddable(url);
            return result;
        } catch (err) {
            server.log.error({ err, url }, 'Embed check failed');
            return { embeddable: false, reason: 'check-failed' };
        }
    });
}
