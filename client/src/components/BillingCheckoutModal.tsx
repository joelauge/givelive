import Modal from './Modal';
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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={planName ? `Subscribe to ${planName}` : 'Complete checkout'}
            maxWidth="max-w-2xl"
        >
            <SubscriptionCheckoutEmbed
                planId={planId}
                onComplete={() => {
                    window.location.href = `/settings?billing=success&plan=${planId}`;
                }}
            />
        </Modal>
    );
}
