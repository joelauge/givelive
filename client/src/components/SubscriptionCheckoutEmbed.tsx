import { useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { api } from '../api';
import { isPlatformStripeConfigured, stripePublishableKey } from '../config/stripe';

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

type PlanId = 'starter' | 'growth' | 'pro';

type Props = {
    planId: PlanId;
    includeAiAddon?: boolean;
};

export default function SubscriptionCheckoutEmbed({ planId, includeAiAddon }: Props) {
    const { user } = useUser();

    const options = useMemo(
        () => ({
            fetchClientSecret: async () => {
                if (!user?.id) {
                    throw new Error('Sign in to subscribe');
                }
                const { clientSecret } = await api.createBillingCheckout({
                    org_id: user.id,
                    plan_id: planId,
                    email: user.primaryEmailAddress?.emailAddress ?? undefined,
                    name: user.fullName ?? undefined,
                    include_ai_addon: includeAiAddon,
                });
                if (!clientSecret) {
                    throw new Error('Checkout is unavailable');
                }
                return clientSecret;
            },
        }),
        [user, planId, includeAiAddon]
    );

    if (!isPlatformStripeConfigured || !stripePromise) {
        return (
            <p className="text-sm text-gray-600 p-4 text-center">
                Stripe is not configured. Add <code className="text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code> to enable checkout.
            </p>
        );
    }

    return (
        <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
            <EmbeddedCheckout className="w-full" />
        </EmbeddedCheckoutProvider>
    );
}
