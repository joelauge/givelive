import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) return null;
    if (!stripeClient) {
        stripeClient = new Stripe(key, {
            apiVersion: '2026-02-25.clover',
        });
    }
    return stripeClient;
}

export function requireStripe(): Stripe {
    const stripe = getStripe();
    if (!stripe) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    return stripe;
}
