import { useState } from 'react';
import StripeCheckoutModal from './StripeCheckoutModal';

interface PaymentSectionProps {
    id: string;
    content: any;
    formState: any;
    setFormState: (state: any) => void;
    eventId: string;
    userId: string;
}

export default function PaymentSection({
    id,
    content,
    formState,
    setFormState,
    eventId,
    userId
}: PaymentSectionProps) {
    const [frequency, setFrequency] = useState(content.frequencies?.[0] || 'once');
    const [amount, setAmount] = useState(content.defaultAmount || content.givingLevels?.[0]?.amount || 50);
    const [showCheckout, setShowCheckout] = useState(false);

    const handleDonate = () => {
        // Update form state with payment info
        setFormState({ ...formState, amount, frequency });

        // Open Stripe checkout
        setShowCheckout(true);
    };

    const handlePaymentSuccess = () => {
        console.log('Payment successful!');
        // You can trigger any post-payment actions here
    };

    // Map frequency display names
    const getFrequencyDisplay = (freq: string) => {
        if (freq === 'one-time' || freq === 'once') return 'One-Time';
        if (freq === 'monthly') return 'Monthly';
        if (freq === 'yearly') return 'Yearly';
        return freq.charAt(0).toUpperCase() + freq.slice(1);
    };

    return (
        <>
            <div key={id} className="p-6 space-y-4" style={{ paddingTop: content.paddingTop, paddingBottom: content.paddingBottom }}>
                {/* Frequency Selector */}
                {content.frequencies?.length > 1 && (
                    <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                        {content.frequencies.map((freq: string) => (
                            <button
                                key={freq}
                                type="button"
                                onClick={() => setFrequency(freq)}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${frequency === freq
                                        ? 'bg-white shadow-sm text-gray-900'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {getFrequencyDisplay(freq)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Giving Levels */}
                {content.givingLevels?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {content.givingLevels.map((level: any, idx: number) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setAmount(level.amount)}
                                className={`p-4 rounded-xl border-2 text-center transition ${amount === level.amount
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 bg-white hover:border-primary/50'
                                    }`}
                            >
                                <div className="text-2xl font-black text-gray-900">${level.amount}</div>
                                {level.label && (
                                    <div className="text-xs font-bold text-primary uppercase tracking-wider mt-1">
                                        {level.label}
                                    </div>
                                )}
                                {level.description && (
                                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {level.description}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
                            $
                        </span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                            className="w-full p-4 pl-10 rounded-2xl border-2 border-gray-200 text-2xl font-bold text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition"
                            min="1"
                        />
                    </div>
                )}

                {/* Donate Button */}
                <button
                    type="button"
                    onClick={handleDonate}
                    disabled={!amount || amount <= 0}
                    className="w-full py-4 rounded-xl font-bold text-white shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: content.buttonColor || '#000000' }}
                >
                    {content.buttonText || `Donate $${amount}`}
                </button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Secure Payment · Powered by Stripe
                </div>
            </div>

            {/* Stripe Checkout Modal */}
            <StripeCheckoutModal
                isOpen={showCheckout}
                amount={amount}
                frequency={frequency}
                eventId={eventId}
                userId={userId}
                donorInfo={{
                    email: formState.email,
                    name: formState.name || `${formState.firstName || ''} ${formState.lastName || ''}`.trim(),
                    phone: formState.phone
                }}
                onSuccess={handlePaymentSuccess}
                onClose={() => setShowCheckout(false)}
            />
        </>
    );
}
