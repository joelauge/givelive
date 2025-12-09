import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import fastifyStatic from '@fastify/static';
import path from 'path';

import eventRoutes from './routes/events';
import journeyRoutes from './routes/journey';
import smsRoutes from './routes/sms';
import analyticsRoutes from './routes/analytics';
import demoRoutes from './routes/demo';
import donationRoutes from './routes/donations';
import uploadRoutes from './routes/upload';

dotenv.config();

export const createApp = () => {
    const server = fastify({ logger: true });

    server.register(cors, {
        origin: '*', // Allow all for dev
    });

    server.register(require('@fastify/multipart'));

    server.register(fastifyStatic, {
        root: path.join(__dirname, '../uploads'),
        prefix: '/uploads/', // optional: default '/'
    });

    server.register(eventRoutes, { prefix: '/api' });
    server.register(journeyRoutes, { prefix: '/api' });
    server.register(smsRoutes, { prefix: '/api' });
    server.register(analyticsRoutes, { prefix: '/api' });
    server.register(demoRoutes, { prefix: '/api' });
    server.register(donationRoutes, { prefix: '/api' });
    server.register(uploadRoutes, { prefix: '/api' });

    server.get('/', async (request, reply) => {
        return { hello: 'world' };
    });

    return server;
};

if (require.main === module) {
    const start = async () => {
        const server = createApp();
        try {
            const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
            await server.listen({ port, host: '0.0.0.0' });
            console.log(`Server listening on port ${port}`);
        } catch (err) {
            server.log.error(err);
            process.exit(1);
        }
    };
    start();
}
