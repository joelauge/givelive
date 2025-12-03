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

            if (client) {
                server.log.info(`[Twilio] Sending SMS to ${to}`);
                await client.messages.create({
                    body,
                    from: fromNumber || '+15005550006', // Magic number for testing if not provided
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
}
