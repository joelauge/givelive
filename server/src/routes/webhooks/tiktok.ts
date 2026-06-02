import { FastifyInstance } from 'fastify';
import { MessagingPipeline } from '../../services/messagingPipeline';

export default async function tiktokWebhookRoutes(server: FastifyInstance) {
    // 1. Webhook Event Receiver (POST)
    // Note: TikTok webhooks often require a verification header or challenge
    server.post('/webhooks/tiktok', async (request, reply) => {
        const body = request.body as any;
        server.log.info(`[TikTok Webhook] Received event: ${body.event}`);

        // TikTok send events in a standardized format
        // https://developers.tiktok.com/doc/webhook-event-overview/

        switch (body.event) {
            case 'video.comment.created':
                const commentData = body.data;
                await MessagingPipeline.handleTikTokComment(
                    commentData.user_id, // Open ID of commenter
                    commentData.video_id,
                    commentData.text,
                    commentData.comment_id
                );
                break;

            case 'direct_message.received':
                const msgData = body.data;
                await MessagingPipeline.handleTikTokMessage(
                    msgData.sender_id,
                    msgData.recipient_id,
                    msgData.text
                );
                break;

            default:
                server.log.warn(`[TikTok Webhook] Unhandled event type: ${body.event}`);
        }

        return { success: true };
    });
}
