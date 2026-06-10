import { FastifyInstance } from 'fastify';
import { query } from '../db';
import { DEFAULT_INBOX, sendMail } from '../lib/mailer';

export default async function demoRoutes(fastify: FastifyInstance) {
    // Registered with the '/api' prefix in index.ts → served at /api/request-demo
    fastify.post('/request-demo', async (request, reply) => {
        const { name, email, organization } = request.body as {
            name?: string;
            email?: string;
            organization?: string;
        };

        if (!name || !email) {
            return reply.status(400).send({ error: 'Name and email are required' });
        }

        // Always persist the request so it survives email outages.
        try {
            await query(
                'INSERT INTO demo_requests (name, email, organization) VALUES ($1, $2, $3)',
                [name, email, organization || null]
            );
        } catch (err) {
            fastify.log.error({ err }, 'Failed to persist demo request');
        }

        try {
            const sent = await sendMail({
                to: DEFAULT_INBOX,
                replyTo: email,
                subject: `New Demo Request from ${name}`,
                text: `Name: ${name}\nEmail: ${email}\nOrganization: ${organization || 'N/A'}\n\nRequesting a demo of the GiveLive platform.`,
                html: `
<h2>New Demo Request</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Organization:</strong> ${organization || 'N/A'}</p>
<p>Requesting a demo of the GiveLive platform.</p>
                `,
            });

            if (!sent) {
                fastify.log.warn('Demo request received but no SMTP configuration found');
            }
            return reply.send({ success: true, message: 'Demo request received' });
        } catch (error) {
            fastify.log.error({ err: error }, 'Error sending demo request email');
            // Stored in DB above, so the lead is not lost.
            return reply.send({ success: true, message: 'Demo request received' });
        }
    });
}
