import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { query } from '../db';
import { getStripe } from '../lib/stripe';
import { processBillingWebhookEvent } from './billing';

interface DonationBody {
    event_id: string;
    user_id: string;
    amount: number;
    recurring: boolean;
    frequency?: 'once' | 'monthly' | 'yearly';
    donorInfo?: {
        email?: string;
        name?: string;
        phone?: string;
    };
}

export default async function donationRoutes(server: FastifyInstance) {
    const stripe = getStripe();

    if (!stripe) {
        server.log.warn('STRIPE_SECRET_KEY not set - payment processing will be in test mode');
    }

    server.post<{ Body: DonationBody }>('/donations/create-intent', async (request, reply) => {
        try {
            const { event_id, user_id, amount, recurring, frequency = 'once', donorInfo } = request.body;

            // Validate amount
            if (!amount || amount <= 0) {
                return reply.code(400).send({ error: 'Invalid amount' });
            }

            // Get event to retrieve organization's connected Stripe account
            const eventResult = await query('SELECT * FROM events WHERE id = $1', [event_id]);
            if (eventResult.rows.length === 0) {
                return reply.code(404).send({ error: 'Event not found' });
            }

            const event = eventResult.rows[0];

            // If no Stripe configured, return mock response
            if (!stripe) {
                const mockIntentId = `pi_mock_${Math.random().toString(36).substring(7)}`;
                server.log.info(`[Stripe Mock] Creating intent for $${amount} (Recurring: ${recurring})`);

                const result = await query(
                    'INSERT INTO donations (event_id, user_id, amount, recurring, stripe_charge_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                    [event_id, user_id, amount, recurring, mockIntentId]
                );

                return {
                    clientSecret: `${mockIntentId}_secret_mock`,
                    donation: result.rows[0],
                    isTestMode: true
                };
            }

            // Handle recurring donations with Stripe Subscriptions
            if (recurring && frequency !== 'once') {
                // Create or retrieve customer
                let customerId: string;

                if (donorInfo?.email) {
                    // Check if customer exists
                    const customers = await stripe.customers.list({
                        email: donorInfo.email,
                        limit: 1
                    });

                    if (customers.data.length > 0) {
                        customerId = customers.data[0].id;
                    } else {
                        const customer = await stripe.customers.create({
                            email: donorInfo.email,
                            name: donorInfo.name,
                            phone: donorInfo.phone,
                            metadata: {
                                user_id,
                                event_id
                            }
                        });
                        customerId = customer.id;
                    }
                } else {
                    const customer = await stripe.customers.create({
                        metadata: {
                            user_id,
                            event_id
                        }
                    });
                    customerId = customer.id;
                }

                // Create subscription
                const interval = frequency === 'yearly' ? 'year' : 'month';

                // First create a price
                const price = await stripe.prices.create({
                    currency: 'usd',
                    unit_amount: Math.round(amount * 100), // Convert to cents
                    recurring: {
                        interval
                    },
                    product_data: {
                        name: `${event.name} - ${frequency} Donation`
                    }
                });

                const subscription = await stripe.subscriptions.create({
                    customer: customerId,
                    items: [{
                        price: price.id
                    }],
                    payment_behavior: 'default_incomplete',
                    payment_settings: {
                        save_default_payment_method: 'on_subscription'
                    },
                    expand: ['latest_invoice.payment_intent'],
                    metadata: {
                        event_id,
                        user_id,
                        frequency
                    }
                });

                const invoice = subscription.latest_invoice as any;
                const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

                // Record subscription in database
                const result = await query(
                    'INSERT INTO donations (event_id, user_id, amount, recurring, stripe_charge_id, stripe_subscription_id, frequency) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                    [event_id, user_id, amount, true, paymentIntent.id, subscription.id, frequency]
                );

                server.log.info(`[Stripe] Created subscription ${subscription.id} for $${amount}/${frequency}`);

                return {
                    clientSecret: paymentIntent.client_secret,
                    donation: result.rows[0],
                    subscriptionId: subscription.id,
                    isTestMode: false
                };
            }

            // One-time payment
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: 'usd',
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    event_id,
                    user_id,
                    event_name: event.name
                },
                description: `Donation to ${event.name}`
            });

            // Record pending donation
            const result = await query(
                'INSERT INTO donations (event_id, user_id, amount, recurring, stripe_charge_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [event_id, user_id, amount, false, paymentIntent.id]
            );

            server.log.info(`[Stripe] Created payment intent ${paymentIntent.id} for $${amount}`);

            return {
                clientSecret: paymentIntent.client_secret,
                donation: result.rows[0],
                isTestMode: false
            };
        } catch (err: any) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error', details: err.message });
        }
    });

    // Webhook to handle Stripe events
    server.post('/donations/webhook', async (request, reply) => {
        if (!stripe) {
            return reply.code(200).send({ received: true });
        }

        const sig = request.headers['stripe-signature'] as string;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            server.log.warn('STRIPE_WEBHOOK_SECRET not set');
            return reply.code(400).send({ error: 'Webhook secret not configured' });
        }

        try {
            const rawBody = (request as any).rawBody;
            if (!rawBody) {
                server.log.error('[Stripe Webhook] Missing raw body');
                return reply.code(400).send({ error: 'Webhook Error: Missing raw body' });
            }

            const event = stripe.webhooks.constructEvent(
                rawBody,
                sig,
                webhookSecret
            );

            server.log.info(`[Stripe Webhook] Received event: ${event.type}`);

            const handledByBilling = await processBillingWebhookEvent(event, {
                info: (msg) => server.log.info(msg),
                error: (msg) => server.log.error(msg),
            });
            if (handledByBilling) {
                return reply.send({ received: true });
            }

            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object as Stripe.PaymentIntent;
                    // Update donation status
                    await query(
                        'UPDATE donations SET status = $1, updated_at = NOW() WHERE stripe_charge_id = $2',
                        ['completed', paymentIntent.id]
                    );
                    server.log.info(`[Stripe] Payment succeeded: ${paymentIntent.id}`);
                    break;

                case 'payment_intent.payment_failed':
                    const failedIntent = event.data.object as Stripe.PaymentIntent;
                    await query(
                        'UPDATE donations SET status = $1, updated_at = NOW() WHERE stripe_charge_id = $2',
                        ['failed', failedIntent.id]
                    );
                    server.log.info(`[Stripe] Payment failed: ${failedIntent.id}`);
                    break;

                case 'invoice.payment_succeeded':
                    // Recurring subscription payment succeeded
                    const invoice = event.data.object as any;
                    if (invoice.subscription) {
                        server.log.info(`[Stripe] Subscription payment succeeded: ${invoice.subscription}`);
                        // You could create a new donation record for each successful recurring payment
                    }
                    break;

                default:
                    server.log.info(`[Stripe] Unhandled event type: ${event.type}`);
            }

            reply.send({ received: true });
        } catch (err: any) {
            server.log.error(`[Stripe Webhook] Error: ${err.message}`);
            reply.code(400).send({ error: `Webhook Error: ${err.message}` });
        }
    });
}
