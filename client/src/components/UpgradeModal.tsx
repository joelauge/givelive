import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { QrCode, ArrowRight } from 'lucide-react';
import Modal from './Modal';
import { api } from '../api';
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
        headline: () => 'Your free plan includes 1 free QR flow to capture up to 100 leads per month. Want more?',
        body: 'Upgrade to run separate campaigns for different events, locations, or offers — without starting over on what already works.',
    },
    publish: {
        title: 'Ready to publish another flow?',
        headline: (limit: number) => `Your free plan includes ${limit} live QR campaign.`,
        body: 'Upgrade to publish additional flows and keep more than one journey live at a time.',
    },
};

export default function UpgradeModal({ isOpen, onClose, limit = 1, reason = 'campaign' }: Props) {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const starter = pricingPlans.find((p) => p.id === 'starter');

    const startCheckout = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const { url } = await api.createBillingCheckout({
                org_id: user.id,
                plan_id: 'starter',
                email: user.primaryEmailAddress?.emailAddress ?? undefined,
                name: user.fullName ?? undefined,
            });
            window.location.href = url;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Checkout failed';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    const text = copy[reason];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={text.title} maxWidth="max-w-lg">
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
                        onClick={startCheckout}
                        disabled={loading || !user?.id}
                        className="w-full py-3.5 rounded-full bg-primary text-white font-bold hover:bg-primary-light transition disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Redirecting to checkout…' : 'Get Starter'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                    <Link
                        to="/pricing"
                        onClick={onClose}
                        className="w-full py-3.5 rounded-full bg-gray-100 text-gray-900 font-bold text-center hover:bg-gray-200 transition"
                    >
                        View all plans
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition"
                    >
                        Not now
                    </button>
                </div>
            </div>
        </Modal>
    );
}
