import { FastifyInstance } from 'fastify';
import { MessagingPipeline } from '../../services/messagingPipeline';

export default async function metaWebhookRoutes(server: FastifyInstance) {
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'givelive_meta_verify';

    // 1. Webhook Verification (GET)
    server.get('/webhooks/meta', async (request, reply) => {
        const query = request.query as any;
        const mode = query['hub.mode'];
        const token = query['hub.verify_token'];
        const challenge = query['hub.challenge'];

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            server.log.info('Webhook verified by Meta');
            return challenge;
        }

        server.log.warn('Webhook verification failed: token mismatch');
        return reply.code(403).send('Forbidden');
    });

    // 2. Webhook Event Receiver (POST)
    server.post('/webhooks/meta', async (request, reply) => {
        const body = request.body as any;

        if (body.object === 'instagram' || body.object === 'page') {
            for (const entry of body.entry) {
                // messaging: DMs
                if (entry.messaging) {
                    for (const messaging of entry.messaging) {
                        const senderId = messaging.sender.id;
                        const recipientId = messaging.recipient.id;
                        const message = messaging.message;

                        if (message && message.text) {
                            server.log.info(`Received Meta Message from ${senderId} to ${recipientId}`);
                            // Logic: Trigger Messaging Pipeline (Phase 3)
                            try {
                                await MessagingPipeline.handleInstagramMessage(senderId, recipientId, message.text);
                            } catch (err: any) {
                                server.log.error(`Messaging Pipeline Error: ${err.message}`);
                            }
                        }
                    }
                }

                // changes: Comments, Mentions, etc.
                if (entry.changes) {
                    for (const change of entry.changes) {
                        const field = change.field;
                        const value = change.value;

                        if (field === 'comments') {
                            const senderId = value.from.id;
                            const text = value.text;
                            const mediaId = value.media.id;
                            const pageId = entry.id; // Page ID is at the entry level

                            server.log.info(`Received Meta Comment from ${senderId}`);
                            try {
                                await MessagingPipeline.handleInstagramComment(senderId, pageId, text, mediaId);
                            } catch (err: any) {
                                server.log.error(`Messaging Pipeline Comment Error: ${err.message}`);
                            }
                        }
                    }
                }
            }
            return { success: true };
        }

        return reply.code(404).send('Invalid object');
    });
}
