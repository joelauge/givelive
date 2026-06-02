import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
dotenv.config();

import fastifyStatic from '@fastify/static';
import * as querystring from 'querystring';
import path from 'path';
import fs from 'fs/promises';
import { query } from './db';

import eventRoutes from './routes/events';
import journeyRoutes from './routes/journey';
import smsRoutes from './routes/sms';
import analyticsRoutes from './routes/analytics';
import demoRoutes from './routes/demo';
import donationRoutes from './routes/donations';
import uploadRoutes from './routes/upload';
import userRoutes from './routes/users';
import aiRoutes from './routes/ai';
import webhookRoutes from './routes/webhooks';
import { integrationRoutes } from './routes/integrations';
import facebookAuthRoutes from './routes/auth/facebook';
import tiktokAuthRoutes from './routes/auth/tiktok';
import metaWebhookRoutes from './routes/webhooks/meta';
import tiktokWebhookRoutes from './routes/webhooks/tiktok';


export const createApp = () => {
    const server = fastify({ logger: true });

    server.register(cors, {
        origin: '*', // Allow all for dev
    });

    // Custom Form Parser for Twilio
    server.addContentTypeParser('application/x-www-form-urlencoded', function (request, payload, done) {
        let body = '';
        payload.on('data', function (chunk) {
            body += chunk;
        });
        payload.on('end', function () {
            try {
                const parsed = querystring.parse(body);
                done(null, parsed);
            } catch (err) {
                done(err as Error, undefined);
            }
        });
    });

    // Custom JSON Parser to preserve raw body (needed for Stripe)
    server.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
        try {
            const json = JSON.parse(body.toString());
            (req as any).rawBody = body;
            done(null, json);
        } catch (err) {
            done(err as Error, undefined);
        }
    });

    server.register(require('@fastify/multipart'), {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB
        }
    });

    const uploadsDir = path.join(__dirname, '../uploads');
    try {
        require('fs').accessSync(uploadsDir);
        server.register(fastifyStatic, {
            root: uploadsDir,
            prefix: '/uploads/',
        });
    } catch (e) {
        server.log.warn(`Uploads directory not found at ${uploadsDir}. Static file serving disabled.`);
    }

    server.register(eventRoutes, { prefix: '/api' });
    server.register(journeyRoutes, { prefix: '/api' });
    server.register(smsRoutes, { prefix: '/api' });
    server.register(analyticsRoutes, { prefix: '/api' });
    server.register(demoRoutes, { prefix: '/api' });
    server.register(donationRoutes, { prefix: '/api' });
    server.register(uploadRoutes, { prefix: '/api' });
    server.register(aiRoutes, { prefix: '/api' });
    server.register(webhookRoutes, { prefix: '/api' });
    server.register(integrationRoutes, { prefix: '/api' });
    server.register(facebookAuthRoutes, { prefix: '/api' });
    server.register(tiktokAuthRoutes, { prefix: '/api' });
    server.register(metaWebhookRoutes, { prefix: '/api' });
    server.register(tiktokWebhookRoutes, { prefix: '/api' });
    server.register(require('./routes/settings').default, { prefix: '/api' });

    // Serving dynamic HTML for events (for QR viewfinders and SEO)
    server.get<{ Params: { eventId: string } }>('/event/:eventId', async (request, reply) => {
        const { eventId } = request.params;
        const indexPath = path.join(__dirname, '../../dist/index.html');

        try {
            // 1. Fetch Event and Nodes to find Start Node
            const eventRes = await query('SELECT name FROM events WHERE id = $1', [eventId]);
            const nodeRes = await query('SELECT * FROM journey_nodes WHERE event_id = $1', [eventId]);

            if (eventRes.rows.length === 0) {
                // Return default if event not found
                const html = await fs.readFile(indexPath, 'utf-8');
                return reply.type('text/html').send(html);
            }

            const event = eventRes.rows[0];
            const startNode = nodeRes.rows.find(n => n.type === 'start' || n.config?.type === 'start');
            const startNodeConfig = startNode?.config || {};

            const displayName = startNodeConfig.qrDisplayText || event.name || 'GiveLive';
            const campaignImage = startNodeConfig.campaignImage;

            // 2. Read index.html template
            let html = await fs.readFile(indexPath, 'utf-8');

            // 3. Inject metadata (regex replacements for robustness)
            // Replace Title
            html = html.replace(/<title>.*?<\/title>/, `<title>${displayName}</title>`);

            // Replace OG Tags
            html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${displayName}" />`);
            html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="Join us for ${event.name}" />`);

            // Replace Twitter Tags
            html = html.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${displayName}" />`);
            html = html.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="Join us for ${event.name}" />`);

            if (campaignImage) {
                html = html.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${campaignImage}" />`);
                html = html.replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${campaignImage}" />`);
            }

            return reply.type('text/html').send(html);
        } catch (err) {
            console.error('[DynamicHTML] Error serving event page:', err);
            // Safe fallback to static HTML
            try {
                const html = await fs.readFile(indexPath, 'utf-8');
                return reply.type('text/html').send(html);
            } catch (e) {
                return reply.code(500).send('Internal Server Error');
            }
        }
    });

    server.get('/', async (request, reply) => {
        return { hello: 'world' };
    });

    return server;
};

if (require.main === module) {
    const start = async () => {
        const server = createApp();
        try {
            // Test DB Connection
            try {
                await query('SELECT NOW()');
                console.log('✅ Database connected successfully');
            } catch (dbErr) {
                console.error('❌ Database connection failed:', dbErr);
                console.warn('⚠️ Server starting without DB connection. API calls needing DB will fail.');
            }

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
