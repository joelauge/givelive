import { FastifyInstance } from 'fastify';
import twilio from 'twilio';

interface SMSBody {
    to: string;
    body: string;
}

export default async function smsRoutes(server: FastifyInstance) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    let client: any;
    if (accountSid && authToken) {
        client = twilio(accountSid, authToken);
    } else {
        server.log.warn('Twilio credentials not found, using mock mode');
    }

    server.post<{ Body: SMSBody }>('/sms/send', async (request, reply) => {
        try {
            const { to, body } = request.body;

            if (!fromNumber) {
                server.log.error('TWILIO_PHONE_NUMBER environment variable is not set');
                reply.code(500).send({ error: 'SMS configuration error: Phone number not configured' });
                return;
            }

            if (client) {
                server.log.info(`[Twilio] Sending SMS to ${to} from ${fromNumber}`);
                await client.messages.create({
                    body,
                    from: fromNumber,
                    to
                });
                return { success: true, message: 'SMS sent via Twilio' };
            } else {
                // MOCK: Log the SMS
                server.log.info(`[MOCK SMS] To: ${to}, Body: ${body}`);
                return { success: true, message: 'SMS queued (Mock)' };
            }
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Webhook for receiving incoming SMS from Twilio
    server.post('/sms/webhook', async (request, reply) => {
        try {
            const { From, Body, MessageSid } = request.body as any;

            server.log.info(`[Twilio Webhook] Received SMS from ${From}: ${Body}`);

            // TODO: Process user response and navigate to next node
            // For now, just log and send a confirmation

            // Respond with TwiML (Twilio Markup Language)
            reply.type('text/xml');
            return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Thanks for your response! We received: "${Body}"</Message>
</Response>`;
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
}
