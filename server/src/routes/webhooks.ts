import { FastifyInstance } from 'fastify';
import { query } from '../db';
import crypto from 'crypto';

export default async function webhookRoutes(server: FastifyInstance) {

    // Shopify Webhook - Trigger Journey on Purchase (example)
    // POST /webhooks/shopify/:eventId/orders/create
    server.post<{ Params: { eventId: string } }>('/webhooks/shopify/:eventId/orders/create', async (request, reply) => {
        try {
            const { eventId } = request.params;
            const payload = request.body as any;

            // Verify HMAC (TODO: Get secret from DB based on eventId/Shopify Integration)
            // For now, assume validated or dev mode.

            const email = payload.email || payload.customer?.email;
            const phone = payload.phone || payload.customer?.phone;
            const shopifyId = payload.customer?.id?.toString();

            if (!email && !phone && !shopifyId) {
                return { status: 'ignored', reason: 'no_contact_info' };
            }

            // Find User
            let userRes = await query(
                'SELECT * FROM users WHERE event_id = $1 AND (email = $2 OR shopify_customer_id = $3)',
                [eventId, email, shopifyId]
            );

            let user = userRes.rows[0];

            if (!user) {
                // Create User
                const createRes = await query(
                    'INSERT INTO users (event_id, email, phone_number, shopify_customer_id, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                    [eventId, email, phone, shopifyId, payload.customer?.first_name, payload.customer?.last_name]
                );
                user = createRes.rows[0];
            } else if (!user.shopify_customer_id && shopifyId) {
                // Link Shopify ID
                await query('UPDATE users SET shopify_customer_id = $1 WHERE id = $2', [shopifyId, user.id]);
            }

            // Trigger "Shopify Order" Event in Journey
            // Implementation: Find start node with type 'shopify_trigger' (if distinguishing triggers)
            // Or just start generic journey if not already active?
            // For this feature, users probably want specific triggers. 
            // We will assume a generic 'start' or look for specific config.

            // Start Journey Logic (Reuse from journey.ts logic or call service)
            // For now, logging trigger.
            server.log.info(`Shopify Order Trigger for User ${user.id}`);

            // TODO: Actually start journey flow here.

            return { success: true };

        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Webhook processing failed' });
        }
    });

}
