import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { QrCode, ArrowLeft, ArrowRight } from 'lucide-react';
import Modal from './Modal';
import CheckoutOverlay from './CheckoutOverlay';
import SubscriptionCheckoutEmbed from './SubscriptionCheckoutEmbed';
import { pricingPlans } from '../data/pricingPlans';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    limit?: number;
    reason?: 'campaign' | 'publish';
};

const copy = {
    campaign: {
        title: 'Need another QR code?',
        checkoutTitle: 'Subscribe to Starter',
        headline: () => 'Your free plan includes 1 free QR flow to capture up to 100 leads per month. Want more?',
        body: 'Upgrade to run separate campaigns for different events, locations, or offers — without starting over on what already works.',
    },
    publish: {
        title: 'Ready to publish another flow?',
        checkoutTitle: 'Subscribe to Starter',
        headline: (limit: number) => `Your free plan includes ${limit} live QR campaign.`,
        body: 'Upgrade to publish additional flows and keep more than one journey live at a time.',
    },
};

export default function UpgradeModal({ isOpen, onClose, limit = 1, reason = 'campaign' }: Props) {
    const { user } = useUser();
    const [step, setStep] = useState<'offer' | 'checkout'>('offer');
    const starter = pricingPlans.find((p) => p.id === 'starter');
    const text = copy[reason];

    const handleClose = () => {
        setStep('offer');
        onClose();
    };

    if (!isOpen) return null;

    if (step === 'checkout') {
        return (
            <CheckoutOverlay
                isOpen
                onClose={() => setStep('offer')}
                title={text.checkoutTitle}
            >
                <button
                    type="button"
                    onClick={() => setStep('offer')}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-4 px-4"
                >
                    <ArrowLeft size={16} />
                    Back to plans
                </button>
                <SubscriptionCheckoutEmbed
                    planId="starter"
                    onComplete={() => {
                        window.location.href = '/settings?billing=success&plan=starter';
                    }}
                />
            </CheckoutOverlay>
        );
    }

    return (
        <Modal isOpen onClose={handleClose} title={text.title} maxWidth="max-w-lg">
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <div className="p-2.5 rounded-xl bg-white text-accent-blue shrink-0">
                        <QrCode size={24} />
                    </div>
                    <div>
                        <p className="text-gray-900 font-medium mb-1">{text.headline(limit)}</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{text.body}</p>
                    </div>
                </div>

                {starter && (
                    <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/80">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                            Recommended
                        </p>
                        <p className="font-bold text-gray-900 text-lg">
                            {starter.name} — {starter.price}
                            {starter.priceDetail}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{starter.description}</p>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => setStep('checkout')}
                        disabled={!user?.id}
                        className="w-full py-3.5 rounded-full bg-primary text-white font-bold hover:bg-primary-light transition disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        Get Starter
                        <ArrowRight size={18} />
                    </button>
                    <Link
                        to="/pricing"
                        onClick={handleClose}
                        className="w-full py-3.5 rounded-full bg-gray-100 text-gray-900 font-bold text-center hover:bg-gray-200 transition"
                    >
                        View all plans
                    </Link>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition"
                    >
                        Not now
                    </button>
                </div>
            </div>
        </Modal>
    );
}
