import { FastifyInstance } from 'fastify';
import nodemailer from 'nodemailer';

export default async function demoRoutes(fastify: FastifyInstance) {
    fastify.post('/api/request-demo', async (request, reply) => {
        const { name, email, organization } = request.body as { name: string, email: string, organization: string };

        if (!name || !email) {
            return reply.status(400).send({ error: 'Name and email are required' });
        }

        // Configure transporter (using environment variables)
        // For development/testing without real SMTP, this might fail or need a mock
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.example.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        try {
            // Send email
            await transporter.sendMail({
                from: '"GiveLive Demo Request" <no-reply@givelive.co>',
                to: 'demo@givelive.co',
                subject: `New Demo Request from ${name}`,
                text: `
Name: ${name}
Email: ${email}
Organization: ${organization || 'N/A'}

Requesting a demo of the GiveLive platform.
                `,
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
            console.error('Error sending email:', error);
            // In dev, if SMTP is not configured, we might still want to return success to the UI 
            // but log the error. Or return 500. 
            // For this task, let's return 500 but log that it might be due to missing creds.
            return reply.status(500).send({ error: 'Failed to send email. Please check server logs.' });
        }
    });
}
