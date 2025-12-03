import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

dotenv.config();

const server = fastify({ logger: true });

server.register(cors, {
    origin: '*', // Allow all for dev
});

import eventRoutes from './routes/events';
import journeyRoutes from './routes/journey';
import smsRoutes from './routes/sms';
import analyticsRoutes from './routes/analytics';
import donationRoutes from './routes/donations';

server.register(eventRoutes);
server.register(journeyRoutes);
server.register(smsRoutes);
server.register(analyticsRoutes);
server.register(donationRoutes);

server.get('/', async (request, reply) => {
    return { hello: 'world' };
});

const start = async () => {
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
