/**
 * Platform Stripe: one GiveLive account processes both
 * - flow donations (PaymentIntents via server STRIPE_SECRET_KEY)
 * - GiveLive subscriptions (Checkout via same server key)
 *
 * Only the publishable key belongs in the client bundle.
 */
export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() || '';

export const isPlatformStripeConfigured = Boolean(stripePublishableKey);
