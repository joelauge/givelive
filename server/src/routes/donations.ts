import { FastifyInstance } from 'fastify';
import { query } from '../db';

interface DonationBody {
    event_id: string;
    user_id: string;
    amount: number;
    recurring: boolean;
}

export default async function donationRoutes(server: FastifyInstance) {
    server.post<{ Body: DonationBody }>('/donations/create-intent', async (request, reply) => {
        try {
            const { event_id, user_id, amount, recurring } = request.body;

            // MOCK: Create a payment intent
            // In real Stripe: const intent = await stripe.paymentIntents.create({ ... });
            const mockIntentId = `pi_mock_${Math.random().toString(36).substring(7)}`;

            server.log.info(`[Stripe Mock] Creating intent for $${amount} (Recurring: ${recurring})`);

            // Record pending donation
            const result = await query(
                'INSERT INTO donations (event_id, user_id, amount, recurring, stripe_charge_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [event_id, user_id, amount, recurring, mockIntentId]
            );

            return {
                clientSecret: `${mockIntentId}_secret_mock`,
                donation: result.rows[0]
            };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
}
