import { FastifyInstance } from 'fastify';
import nodemailer from 'nodemailer';
import { query } from '../db';

const DEMO_INBOX = process.env.DEMO_REQUEST_EMAIL || 'hello@givelive.app';

type SmtpConfig = {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromName: string;
    fromEmail: string;
};

/** Prefer the admin-configured email settings, fall back to SMTP env vars. */
async function resolveSmtpConfig(): Promise<SmtpConfig | null> {
    try {
        const res = await query('SELECT value FROM settings WHERE key = $1', ['email_config']);
        const cfg = res.rows[0]?.value;
        if (cfg?.host && cfg?.user) {
            return {
                host: cfg.host,
                port: parseInt(cfg.port) || 587,
                user: cfg.user,
                pass: cfg.pass,
                fromName: cfg.fromName || 'GiveLive',
                fromEmail: cfg.fromEmail || DEMO_INBOX,
            };
        }
    } catch {
        // settings table unavailable; fall through to env config
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || '',
            fromName: 'GiveLive',
            fromEmail: process.env.SMTP_FROM || DEMO_INBOX,
        };
    }

    return null;
}

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

        const config = await resolveSmtpConfig();
        if (!config) {
            fastify.log.warn('Demo request received but no SMTP configuration found');
            // The request is stored; treat as success for the visitor.
            return reply.send({ success: true, message: 'Demo request received' });
        }

        try {
            const transporter = nodemailer.createTransport({
                host: config.host,
                port: config.port,
                secure: config.port === 465,
                auth: { user: config.user, pass: config.pass },
            });

            await transporter.sendMail({
                from: `"${config.fromName}" <${config.fromEmail}>`,
                to: DEMO_INBOX,
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

            return reply.send({ success: true, message: 'Demo request sent successfully' });
        } catch (error) {
            fastify.log.error({ err: error }, 'Error sending demo request email');
            // Stored in DB above, so the lead is not lost.
            return reply.send({ success: true, message: 'Demo request received' });
        }
    });
}
