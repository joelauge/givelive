import CheckoutOverlay from './CheckoutOverlay';
import SubscriptionCheckoutEmbed from './SubscriptionCheckoutEmbed';

type PlanId = 'starter' | 'growth' | 'pro';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    planId: PlanId;
    planName?: string;
};

export default function BillingCheckoutModal({ isOpen, onClose, planId, planName }: Props) {
    return (
        <CheckoutOverlay
            isOpen={isOpen}
            onClose={onClose}
            title={planName ? `Subscribe to ${planName}` : 'Complete checkout'}
        >
            <SubscriptionCheckoutEmbed planId={planId} />
        </CheckoutOverlay>
    );
}
